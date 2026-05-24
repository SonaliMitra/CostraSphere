from typing import Dict, List


def generate_chatbot_reply(message: str, context: Dict = None) -> str:
    msg = message.lower().strip()
    context = context or {}

    if any(w in msg for w in ["hello", "hi", "hey"]):
        return "Hello! I'm CostraSphere AI Assistant. I can help with telecom deployment planning, cost estimates, tower placement, and project analytics. How can I assist you today?"

    if any(w in msg for w in ["cost", "budget", "price", "estimate"]):
        budget = context.get("total_budget", 0)
        currency = context.get("currency", "INR")
        if budget:
            return f"Based on your current project, the estimated budget is {currency} {budget:,.2f}. This includes fiber deployment, tower installation, maintenance, and labor costs adjusted for terrain."
        return "Cost estimates depend on location, terrain type, tower count, and fiber route distance. Use the Cost AI Engine on your dashboard to generate a detailed breakdown for your deployment area."

    if any(w in msg for w in ["tower", "cell", "macro", "micro"]):
        count = len(context.get("towers", []))
        if count:
            return f"Your project has {count} towers deployed. Metro areas get more Macro Towers and Small Cells, while rural areas use sparse Macro Towers with 15-30km radius coverage."
        return "Tower density varies by area: Metro cities get 12-15 towers, small towns 5-8, and rural areas 3-6. Each tower includes load capacity, connectors, fiber nodes, and OSRM-calculated deployment routes."

    if any(w in msg for w in ["fiber", "route", "osrm", "deployment"]):
        routes = context.get("routes", [])
        if routes:
            total_km = sum(r.get("distance_km", 0) for r in routes)
            return f"Your deployment has {len(routes)} fiber routes totaling {total_km:.1f} km, calculated using real OSRM road-based routing from OpenStreetMap data."
        return "Fiber routes are generated using OSRM routing API for real road-based paths. Each tower connects to the central office hub with animated route visualization on the map."

    if any(w in msg for w in ["terrain", "urban", "rural", "mountain", "forest"]):
        return "Terrain multipliers affect costs: Urban (1.0x), Rural (0.85x), Mountain (1.45x), Forest (1.35x). These combine with location-specific CSV data for accurate budgeting."

    if any(w in msg for w in ["chennai", "location", "city", "state"]):
        city = context.get("city", "")
        state = context.get("state", "")
        if city:
            return f"Your project is matched to {city}, {state} using priority logic: same city → same district → same state → nearby city, with haversine distance filtering to prevent wrong state mapping."
        return "Location matching uses reverse geocoding via Nominatim, then validates state and district against our global_city_costs database to ensure accurate regional pricing."

    if any(w in msg for w in ["report", "pdf", "download"]):
        return "You can download a comprehensive PDF report from your dashboard including deployment summary, tower list, fiber analytics, cost breakdown, and timeline. Click 'Download Report' on any saved project."

    if any(w in msg for w in ["help", "support", "what can"]):
        return "I can help with: (1) Cost & budget analysis, (2) Tower placement info, (3) Fiber route details, (4) Terrain impact, (5) Location matching, (6) PDF reports. Just ask!"

    if any(w in msg for w in ["currency", "inr", "usd", "gbp", "jpy", "cny"]):
        return "CostraSphere supports INR ₹, USD $, GBP £, JPY ¥, and CNY ¥. Select your preferred currency in the deployment planner and all costs will be converted accordingly."

    return "I'm here to help with telecom infrastructure planning. Ask me about costs, towers, fiber routes, terrain effects, location matching, or PDF reports for your deployment project."
