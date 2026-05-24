import { useEffect, useState } from 'react';
import TelecomMap from '../../components/TelecomMap';
import api from '../../api/axios';

export default function DeploymentPlanning() {
  const [projects, setProjects] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    api.get('/company/projects/all').then((r) => {
      setProjects(r.data);
      if (r.data.length) setSelected(r.data[0]);
    }).catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-lavender-800">Deployment Planning</h1>
      <select value={selected?.id || ''} onChange={(e) => setSelected(projects.find((p) => p.id === Number(e.target.value)))} className="input-field max-w-md">
        {projects.map((p) => <option key={p.id} value={p.id}>{p.name} — {p.city}</option>)}
      </select>
      {selected && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card-stat"><p className="text-xs text-gray-500">Days</p><p className="font-bold">{Math.min(100, selected.deployment_days)}</p></div>
            <div className="card-stat"><p className="text-xs text-gray-500">Workers Needed</p><p className="font-bold">{selected.workers_needed || 'Pending approval'}</p></div>
            <div className="card-stat"><p className="text-xs text-gray-500">Max Tower Dist</p><p className="font-bold">{selected.max_tower_distance_km || 10} km</p></div>
            <div className="card-stat"><p className="text-xs text-gray-500">Company</p><p className="font-bold">{selected.selected_company || '—'}</p></div>
          </div>
          <TelecomMap hub={{ latitude: selected.latitude, longitude: selected.longitude }} towers={selected.towers_data || []} routes={selected.routes_data || []} height="420px" singleRoute />
        </>
      )}
    </div>
  );
}
