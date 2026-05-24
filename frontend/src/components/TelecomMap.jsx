import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import towerIcon from '../assets/images/tower.png';

const towerMarkerIcon = new L.Icon({
  iconUrl: towerIcon,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36],
  className: 'telecom-glow-marker',
});

function FitBounds({ towers, hub }) {
  const map = useMap();
  useEffect(() => {
    const points = [];
    if (hub) points.push([hub.latitude, hub.longitude]);
    towers?.forEach((t) => points.push([t.latitude, t.longitude]));
    if (points.length) map.fitBounds(points, { padding: [40, 40] });
  }, [towers, hub, map]);
  return null;
}

export default function TelecomMap({
  hub, towers = [], routes = [], onTowerClick, height = '500px', singleRoute = true, onRouteIndexChange,
}) {
  const [routeIndex, setRouteIndex] = useState(0);
  const center = hub ? [hub.latitude, hub.longitude] : [13.0827, 80.2707];
  const hubLatLng = hub ? [hub.latitude, hub.longitude] : null;
  const visibleRoutes = singleRoute && routes.length ? [routes[routeIndex % routes.length]] : routes;
  const activeRoute = routes[routeIndex];

  return (
    <div>
      {singleRoute && routes.length > 0 && (
        <div className="flex items-center justify-between mb-3 glass px-4 py-2">
          <button type="button" onClick={() => setRouteIndex((i) => (i - 1 + routes.length) % routes.length)} className="btn-secondary p-2">
            <ChevronLeft size={16} />
          </button>
          <div className="text-sm text-center">
            <span className="text-lavender-700 font-medium">Route {routeIndex + 1} of {routes.length}</span>
            {activeRoute && <p className="text-xs text-gray-500">{activeRoute.tower_name} — {activeRoute.distance_km} km</p>}
          </div>
          <button type="button" onClick={() => setRouteIndex((i) => (i + 1) % routes.length)} className="btn-secondary p-2">
            <ChevronRight size={16} />
          </button>
        </div>
      )}
      {/* notify parent when routeIndex changes */}
      {onRouteIndexChange && onRouteIndexChange(routeIndex)}
      <div style={{ height }} className="rounded-2xl overflow-hidden shadow-glow border border-lavender-200/50">
        <MapContainer center={center} zoom={11} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
          <TileLayer attribution="OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <FitBounds towers={towers} hub={hub} />
          {hubLatLng && (
            <CircleMarker center={hubLatLng} radius={12} pathOptions={{ color: '#7c3aed', fillColor: '#a855f7', fillOpacity: 0.8, weight: 3 }}>
              <Popup><strong>Central Office Hub</strong></Popup>
            </CircleMarker>
          )}
          {visibleRoutes.map((route) => (
            <Polyline key={`route-${route.tower_id}`} positions={route.coordinates} pathOptions={{ color: '#9333ea', weight: 5, opacity: 0.9, className: 'animated-route telecom-route' }} />
          ))}
          {/* CORRECTION #3: Display connector points every 100m as white dots */}
          {towers.map((tower) => {
            const points = tower.connector_points || [];
            return points.map((cp, idx) => (
              <CircleMarker
                key={`connector-${tower.id}-${idx}`}
                center={[cp.latitude, cp.longitude]}
                radius={4}
                pathOptions={{ color: 'white', fillColor: 'white', fillOpacity: 0.8, weight: 1, opacity: 0.7 }}
              >
                <Popup>Connector Point {idx + 1}</Popup>
              </CircleMarker>
            ));
          })}
          {towers.map((tower) => (
            <Marker
              key={tower.id}
              position={[tower.latitude, tower.longitude]}
              icon={towerMarkerIcon}
              eventHandlers={{
                click: () => {
                  onTowerClick?.(tower);
                  if (singleRoute) {
                    const idx = routes.findIndex((r) => r.tower_id === tower.id);
                    if (idx >= 0) setRouteIndex(idx);
                  }
                },
              }}
            >
              <Popup>
                <div className="min-w-[200px]">
                  <h3 className="font-bold text-lavender-800">{tower.name}</h3>
                  <p className="text-sm">Type: {tower.tower_type}</p>
                  <p className="text-xs">Connectors: {tower.connector_count} | Nodes: {tower.fiber_node_count}</p>
                  <p className="text-xs">Route: {tower.route_distance} km</p>
                  <p className="text-xs font-semibold text-lavender-700">Cost: {tower.deployment_cost?.toLocaleString()}</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
