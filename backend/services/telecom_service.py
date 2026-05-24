import math
import random
import uuid
from typing import Dict, List, Optional

import httpx
import pandas as pd
from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut, GeocoderServiceError
from haversine import haversine, Unit
from sqlalchemy.orm import Session

from models.models import AIDebugLog

TERRAIN_MULTIPLIERS = {
    "Urban": 1.0,
    "Rural": 0.85,
    "Mountain": 1.45,
    "Forest": 1.35,
}

CURRENCY_RATES = {
    "INR": 1.0,
    "USD": 0.012,
    "GBP": 0.0095,
    "JPY": 1.78,
    "CNY": 0.087,
}

CURRENCY_SYMBOLS = {
    "INR": "₹",
    "USD": "$",
    "GBP": "£",
    "JPY": "¥",
    "CNY": "¥",
}

TOWER_TYPES = [
    "Macro Tower",
    "Micro Cell",
    "Small Cell",
    "Distribution Point",
    "Central Office",
]

VALID_MAX_DISTANCES = (5, 10, 20, 30)
WATER_TYPES = {"water", "bay", "strait", "sea", "ocean", "reservoir", "lake", "river", "canal", "basin", "pond", "lagoon"}

_csv_cache: Optional[pd.DataFrame] = None
_geolocator = Nominatim(user_agent="costrasphere-ai/1.0", timeout=10)


def _load_costs_csv() -> pd.DataFrame:
    global _csv_cache
    if _csv_cache is None:
        import os
        base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        path = os.path.join(base, "data", "global_city_costs.csv")
        _csv_cache = pd.read_csv(path)
        _csv_cache["city_lower"] = _csv_cache["city"].str.lower().str.strip()
        _csv_cache["state_lower"] = _csv_cache["state"].str.lower().str.strip()
    return _csv_cache


def _log_ai(db: Optional[Session], service: str, input_data: dict, output_data: dict, message: str = ""):
    if db is None:
        return
    entry = AIDebugLog(service=service, input_data=input_data, output_data=output_data, message=message)
    db.add(entry)
    db.commit()


def _is_on_land(lat: float, lng: float) -> bool:
    try:
        location = _geolocator.reverse(f"{lat}, {lng}", language="en", exactly_one=True)
        if not location or not location.raw:
            return True
        ot = str(location.raw.get("type", "")).lower()
        oc = str(location.raw.get("class", "")).lower()
        if ot in WATER_TYPES:
            return False
        if oc in ("waterway", "natural") and any(w in ot for w in WATER_TYPES):
            return False
        address = location.raw.get("address", {})
        if address.get("water") or address.get("waterway"):
            return False
        return True
    except (GeocoderTimedOut, GeocoderServiceError, Exception):
        return True


def reverse_geocode(lat: float, lng: float) -> Dict[str, str]:
    try:
        location = _geolocator.reverse(f"{lat}, {lng}", language="en", exactly_one=True)
        if not location or not location.raw:
            return {"city": "", "state": "", "district": "", "country": "INDIA"}
        address = location.raw.get("address", {})
        city = (
            address.get("city")
            or address.get("town")
            or address.get("village")
            or address.get("suburb")
            or address.get("county")
            or ""
        )
        state = address.get("state", "")
        district = address.get("state_district") or address.get("county") or address.get("district") or ""
        country = address.get("country", "INDIA")
        return {
            "city": city,
            "state": state,
            "district": district,
            "country": country.upper() if country else "INDIA",
        }
    except (GeocoderTimedOut, GeocoderServiceError, Exception):
        return {"city": "", "state": "", "district": "", "country": "INDIA"}


def match_location(lat: float, lng: float, db: Optional[Session] = None) -> Dict:
    df = _load_costs_csv()
    geo = reverse_geocode(lat, lng)
    input_data = {"lat": lat, "lng": lng, "geocoded": geo}

    df["dist"] = df.apply(
        lambda r: haversine((lat, lng), (r["latitude"], r["longitude"]), unit=Unit.KILOMETERS)
        if r["latitude"] and r["longitude"]
        else 99999,
        axis=1,
    )

    matched = None
    match_reason = "nearby_city"

    # Priority 1: Exact city match with same state
    if geo["city"] and geo["state"]:
        city_state_match = df[
            (df["city_lower"] == geo["city"].lower().strip()) &
            (df["state_lower"] == geo["state"].lower().strip())
        ]
        if not city_state_match.empty:
            matched = city_state_match.iloc[0]
            match_reason = "exact_city_state"
    
    # Priority 2: Exact city match in any state
    if matched is None and geo["city"]:
        city_match = df[df["city_lower"] == geo["city"].lower().strip()]
        if not city_match.empty:
            matched = city_match.sort_values("dist").iloc[0]
            match_reason = "same_city"
        else:
            # fuzzy/contains match (handles alternate naming)
            try:
                contains_match = df[df["city_lower"].str.contains(geo["city"].lower().strip(), na=False)]
                if not contains_match.empty:
                    matched = contains_match.sort_values("dist").iloc[0]
                    match_reason = "city_contains"
            except Exception:
                pass

    # Priority 3: Nearest city in same state
    if matched is None and geo["state"]:
        state_match = df[df["state_lower"] == geo["state"].lower().strip()]
        if not state_match.empty:
            matched = state_match.sort_values("dist").iloc[0]
            match_reason = "same_state"

    # Priority 4: District/County match
    if matched is None and geo["district"]:
        district_match = df[
            (df["city_lower"] == geo["district"].lower().strip())
            | (df["state"].str.lower().str.contains(geo["district"].lower().strip(), na=False))
        ]
        if not district_match.empty:
            matched = district_match.sort_values("dist").iloc[0]
            match_reason = "same_district"

    # Priority 5: Nearest city within 150 km
    if matched is None:
        nearby = df[df["dist"] < 150].sort_values("dist")
        if not nearby.empty:
            matched = nearby.iloc[0]
            match_reason = "nearby_city"
        else:
            matched = df.sort_values("dist").iloc[0]
            match_reason = "fallback_nearest"

    result = {
        "city": matched["city"],
        "state": matched["state"],
        "district": geo.get("district") or matched["city"],
        "country": matched["country"],
        "latitude": float(matched["latitude"]),
        "longitude": float(matched["longitude"]),
        "currency": matched["currency"],
        "currency_symbol": matched["currency_symbol"],
        "fiber_per_km": float(matched["fiber_per_km"]),
        "labor_per_km": float(matched["labor_per_km"]),
        "connector_cost": float(matched["connector_cost"]),
        "maintenance_per_km": float(matched["maintenance_per_km"]),
        "terrain_multiplier_csv": float(matched["terrain_multiplier"]),
        "estimated_total_project_cost": float(matched["estimated_total_project_cost"]),
        "match_reason": match_reason,
        "geocoded": geo,
        "distance_km": float(matched["dist"]),
    }
    _log_ai(db, "location_matching", input_data, result, f"Matched via {match_reason}")
    return result


def _population_density_factor(city: str, terrain: str) -> float:
    metro_cities = {
        "mumbai", "delhi", "bangalore", "bengaluru", "chennai", "kolkata",
        "hyderabad", "pune", "ahmedabad", "visakhapatnam", "jaipur", "lucknow",
    }
    if city.lower() in metro_cities:
        return 1.0
    if terrain == "Urban":
        return 0.6
    if terrain == "Rural":
        return 0.25
    return 0.4


def _normalize_max_distance(max_distance_km: int) -> int:
    if max_distance_km in VALID_MAX_DISTANCES:
        return max_distance_km
    return min(VALID_MAX_DISTANCES, key=lambda x: abs(x - max_distance_km))


def _land_coords(hub_lat: float, hub_lng: float, radius_km: float, angle: float, attempts: int = 12) -> tuple:
    for attempt in range(attempts):
        jitter = random.uniform(-0.15, 0.15) * attempt
        a = angle + jitter
        dlat = (radius_km / 111.0) * math.cos(a)
        dlng = (radius_km / (111.0 * math.cos(math.radians(hub_lat)))) * math.sin(a)
        tlat = hub_lat + dlat
        tlng = hub_lng + dlng
        if _is_on_land(tlat, tlng):
            return tlat, tlng
    inward = radius_km * 0.5
    dlat = (inward / 111.0) * math.cos(angle)
    dlng = (inward / (111.0 * math.cos(math.radians(hub_lat)))) * math.sin(angle)
    return hub_lat + dlat, hub_lng + dlng


def calculate_workers_needed(towers: List[Dict], total_route_km: float, deployment_days: int) -> int:
    tower_count = len([t for t in towers if t.get("tower_type") != "Central Office"])
    base = max(2, tower_count // 2)
    route_workers = max(1, int(total_route_km / 15))
    day_workers = max(1, deployment_days // 20)
    return min(50, base + route_workers + day_workers)


def generate_towers(
    lat: float,
    lng: float,
    location: Dict,
    terrain: str,
    currency: str,
    max_distance_km: int = 10,
    db: Optional[Session] = None,
) -> List[Dict]:
    max_distance_km = _normalize_max_distance(max_distance_km)
    density = _population_density_factor(location["city"], terrain)

    if max_distance_km <= 5:
        count = max(3, int(5 * density))
    elif max_distance_km <= 10:
        count = max(4, int(7 * density))
    elif max_distance_km <= 20:
        count = max(5, int(9 * density))
    else:
        count = max(6, int(12 * density))

    min_radius = max(1.5, max_distance_km * 0.2)
    max_radius = float(max_distance_km)

    random.seed(f"{lat:.4f}{lng:.4f}{terrain}{max_distance_km}")
    towers = []
    hub_lat, hub_lng = lat, lng

    towers.append({
        "id": str(uuid.uuid4())[:8].upper(),
        "name": f"{location['city']} Central Office",
        "latitude": round(hub_lat, 6),
        "longitude": round(hub_lng, 6),
        "tower_type": "Central Office",
        "load_capacity": random.randint(2000, 8000),
        "connector_count": random.randint(12, 48),
        "fiber_node_count": random.randint(8, 24),
        "deployment_cost": 0,
        "route_distance": 0,
    })

    for i in range(1, count):
        angle = (2 * math.pi * (i - 1)) / max(count - 1, 1) + random.uniform(-0.2, 0.2)
        radius_km = random.uniform(min_radius, max_radius)
        tlat, tlng = _land_coords(hub_lat, hub_lng, radius_km, angle)
        route_dist = min(max_distance_km, haversine((hub_lat, hub_lng), (tlat, tlng), unit=Unit.KILOMETERS))

        # Check if tower is on land (not in sea/ocean) - CORRECTION #2: Remove towers in sea
        if not _is_on_land(tlat, tlng):
            continue

        tower_type = TOWER_TYPES[(i - 1) % (len(TOWER_TYPES) - 1) + 1]
        load = random.randint(500, 5000) if tower_type == "Macro Tower" else random.randint(100, 1500)
        connectors = random.randint(4, 48)
        nodes = random.randint(2, 24)

        base_cost = location["estimated_total_project_cost"] / max(count, 1)
        type_multiplier = {
            "Macro Tower": 1.4,
            "Micro Cell": 0.7,
            "Small Cell": 0.5,
            "Distribution Point": 0.6,
            "Central Office": 2.0,
        }.get(tower_type, 1.0)
        terrain_mult = TERRAIN_MULTIPLIERS.get(terrain, 1.0) * location["terrain_multiplier_csv"]
        deployment_cost = base_cost * type_multiplier * terrain_mult * CURRENCY_RATES.get(currency, 1.0)

        # Generate connector points every 100m - CORRECTION #3
        num_connector_points = max(1, int(route_dist * 1000 / 100))
        connector_points = []
        for cp_idx in range(num_connector_points):
            cp_lat = hub_lat + (tlat - hub_lat) * (cp_idx + 1) / (num_connector_points + 1)
            cp_lng = hub_lng + (tlng - hub_lng) * (cp_idx + 1) / (num_connector_points + 1)
            connector_points.append({"latitude": round(cp_lat, 6), "longitude": round(cp_lng, 6)})

        towers.append({
            "id": str(uuid.uuid4())[:8].upper(),
            "name": f"{location['city']} {tower_type} #{i}",
            "latitude": round(tlat, 6),
            "longitude": round(tlng, 6),
            "tower_type": tower_type,
            "load_capacity": load,
            "connector_count": connectors,
            "fiber_node_count": nodes,
            "deployment_cost": round(deployment_cost, 2),
            "route_distance": round(route_dist, 2),
            "connector_points": connector_points,
        })

    _log_ai(db, "tower_generation", {"lat": lat, "lng": lng, "max_distance_km": max_distance_km}, {"count": len(towers)})
    return towers


def calculate_costs(
    location: Dict,
    towers: List[Dict],
    terrain: str,
    currency: str,
    total_route_km: float,
    include_profit: bool = False,
) -> Dict:
    terrain_mult = TERRAIN_MULTIPLIERS.get(terrain, 1.0) * location["terrain_multiplier_csv"]
    rate = CURRENCY_RATES.get(currency, 1.0)
    symbol = CURRENCY_SYMBOLS.get(currency, "₹")

    fiber_cost = total_route_km * location["fiber_per_km"] * terrain_mult * rate
    labor_cost = total_route_km * location["labor_per_km"] * terrain_mult * rate
    connector_cost = sum(t["connector_count"] for t in towers) * location["connector_cost"] * rate
    maintenance_cost = total_route_km * location["maintenance_per_km"] * terrain_mult * rate
    tower_install = sum(t["deployment_cost"] for t in towers)
    transport_cost = total_route_km * location["labor_per_km"] * 0.3 * terrain_mult * rate

    subtotal = fiber_cost + labor_cost + connector_cost + maintenance_cost + tower_install + transport_cost
    profit_margin = 0.10 if include_profit else 0.0
    company_profit = subtotal * profit_margin
    total = subtotal + company_profit

    deployment_days = min(100, max(7, int(total_route_km * 1.5 + len(towers) * 2)))
    workers_needed = calculate_workers_needed(towers, total_route_km, deployment_days)

    return {
        "currency": currency,
        "currency_symbol": symbol,
        "fiber_deployment_cost": round(fiber_cost, 2),
        "tower_installation_cost": round(tower_install, 2),
        "maintenance_cost": round(maintenance_cost, 2),
        "transport_cost": round(transport_cost, 2),
        "labor_planning_cost": round(labor_cost, 2),
        "connector_cost": round(connector_cost, 2),
        "terrain_multiplier": round(terrain_mult, 2),
        "total_route_km": round(total_route_km, 2),
        "deployment_duration_days": deployment_days,
        "workers_needed": workers_needed,
        "subtotal_cost": round(subtotal, 2),
        "company_profit": round(company_profit, 2),
        "profit_margin_percent": round(profit_margin * 100, 1),
        "final_budget": round(total, 2),
        "location": {
            "city": location["city"],
            "state": location["state"],
            "match_reason": location["match_reason"],
        },
    }


async def get_osrm_route(start_lat: float, start_lng: float, end_lat: float, end_lng: float) -> Dict:
    url = (
        f"https://router.project-osrm.org/route/v1/driving/"
        f"{start_lng},{start_lat};{end_lng},{end_lat}"
        f"?overview=full&geometries=geojson"
    )
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.get(url)
        resp.raise_for_status()
        data = resp.json()
        if data.get("code") != "Ok" or not data.get("routes"):
            raise ValueError("OSRM routing failed")
        route = data["routes"][0]
        coords = route["geometry"]["coordinates"]
        return {
            "coordinates": [[c[1], c[0]] for c in coords],
            "distance_km": round(route["distance"] / 1000, 2),
            "duration_min": round(route["duration"] / 60, 1),
        }


async def generate_routes(hub_lat: float, hub_lng: float, towers: List[Dict], location: Dict = None, terrain: str = "Urban", currency: str = "INR") -> List[Dict]:
    routes = []
    for tower in towers:
        if tower["tower_type"] == "Central Office":
            continue
        try:
            route = await get_osrm_route(hub_lat, hub_lng, tower["latitude"], tower["longitude"])
            distance_km = route["distance_km"]
        except Exception:
            distance_km = tower["route_distance"]
        
        # Calculate per-route cost based on distance
        if location:
            terrain_mult = TERRAIN_MULTIPLIERS.get(terrain, 1.0) * location.get("terrain_multiplier_csv", 1.0)
            rate = CURRENCY_RATES.get(currency, 1.0)
            
            # Per-route fiber and labor costs
            fiber_cost = distance_km * location.get("fiber_per_km", 100) * terrain_mult * rate
            labor_cost = distance_km * location.get("labor_per_km", 50) * terrain_mult * rate
            maintenance_cost = distance_km * location.get("maintenance_per_km", 20) * terrain_mult * rate
            connector_cost = tower.get("connector_count", 10) * location.get("connector_cost", 50) * rate
            
            route_subtotal = fiber_cost + labor_cost + maintenance_cost + connector_cost
            route_cost = round(route_subtotal, 2)
            
            # Per-route deployment days based on distance and tower complexity
            route_days = max(3, int(distance_km * 0.5 + 2))
            
            # Per-route worker count
            route_workers = max(1, int(distance_km / 10))
        else:
            route_cost = 0
            route_days = max(3, int(distance_km * 0.5 + 2))
            route_workers = max(1, int(distance_km / 10))
        
        route_obj = {
            "tower_id": tower["id"],
            "tower_name": tower["name"],
            "tower_type": tower["tower_type"],
            "coordinates": [[hub_lat, hub_lng], [tower["latitude"], tower["longitude"]]],
            "distance_km": distance_km,
            "duration_min": round(distance_km * 2, 1),
            "route_cost": route_cost,
            "route_deployment_days": route_days,
            "route_workers_needed": route_workers,
        }
        
        # Get full route coordinates if available
        try:
            route = await get_osrm_route(hub_lat, hub_lng, tower["latitude"], tower["longitude"])
            route_obj["coordinates"] = route["coordinates"]
        except Exception:
            pass
        
        routes.append(route_obj)
    
    return routes
