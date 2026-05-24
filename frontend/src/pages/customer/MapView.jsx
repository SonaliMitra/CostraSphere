import { useState } from 'react';
import TelecomMap from '../../components/TelecomMap';
import { useProject } from '../../context/ProjectContext';
import api from '../../api/axios';

export default function MapView() {
  const { plan } = useProject();
  const [selectedTower, setSelectedTower] = useState(null);
  const [routeIndex, setRouteIndex] = useState(0);
  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  if (!plan) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-lavender-800">Map View</h1>
        <p className="text-gray-500">Create a project first to view the deployment map.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-lavender-800">Map View</h1>
      <p className="text-sm text-gray-500">One fiber route shown at a time. Click towers or use arrows to navigate routes.</p>
      <TelecomMap hub={plan.hub} towers={plan.towers || []} routes={plan.routes || []} onTowerClick={setSelectedTower} height="520px" singleRoute onRouteIndexChange={(i) => setRouteIndex(i)} />
      {selectedTower && (
        <div className="glass p-4 text-sm">
          <strong>{selectedTower.name}</strong> — {selectedTower.tower_type} | {selectedTower.route_distance} km | Cost: {selectedTower.deployment_cost?.toLocaleString()}
        </div>
      )}
      {plan.routes && plan.routes.length > 0 && (
        <div className="flex gap-2">
          <button
            className="btn-primary"
            onClick={async () => {
              const route = plan.routes[routeIndex % plan.routes.length];
              setPreviewLoading(true);
              try {
                const res = await api.post(`/projects/${plan.project_id}/preview_proposal?route_id=${route.tower_id}`);
                setPreview(res.data);
              } catch (err) {
                window.alert(err.response?.data?.detail || 'Failed to get preview');
              } finally {
                setPreviewLoading(false);
              }
            }}
          >
            {previewLoading ? 'Loading...' : 'Preview Proposal'}
          </button>
        </div>
      )}

      {preview && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-40">
          <div className="bg-white rounded-lg p-6 w-11/12 max-w-2xl">
            <h3 className="text-lg font-semibold">Proposal Preview</h3>
            <p className="text-sm text-gray-600">Route: {preview.route?.tower_name} — {preview.route?.distance_km} km</p>
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
              {Object.entries(preview.costs || {}).map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="capitalize text-gray-700">{k.replace(/_/g, ' ')}</span>
                  <span className="font-medium">{(preview.costs && preview.costs.currency) || 'INR'} {typeof v === 'number' ? v.toLocaleString() : String(v)}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button className="btn-ghost" onClick={() => setPreview(null)}>Cancel</button>
              <button className="btn-primary" onClick={async () => {
                try {
                  await api.post(`/projects/${plan.project_id}/send_proposal?route_id=${preview.route.tower_id}`);
                  window.alert('Proposal sent to selected company');
                  setPreview(null);
                } catch (err) {
                  window.alert(err.response?.data?.detail || 'Failed to send proposal');
                }
              }}>Confirm & Send</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
