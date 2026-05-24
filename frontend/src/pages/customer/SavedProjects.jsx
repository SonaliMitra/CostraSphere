import { useProject } from '../../context/ProjectContext';

export default function SavedProjects() {
  const { projects, selectProject, plan } = useProject();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-lavender-800">Saved Projects</h1>
      <div className="glass p-6 overflow-x-auto">
        <table className="table-elegant">
          <thead>
            <tr>
              <th>Name</th><th>Company</th><th>Location</th><th>Max Dist</th><th>Budget</th><th>Days</th><th>Status</th><th>Workers</th><th></th>
            </tr>
          </thead>
          <tbody>
            {projects.map((p) => (
              <tr key={p.id} className={plan?.project_id === p.id ? 'bg-lavender-50' : ''}>
                <td>{p.name}</td>
                <td>{p.selected_company || '—'}</td>
                <td>{p.city}, {p.state}</td>
                <td>{p.max_tower_distance_km || 10} km</td>
                <td>{p.currency} {p.total_budget?.toLocaleString()}</td>
                <td>{p.deployment_days}</td>
                <td><span className="px-2 py-1 bg-lavender-100 rounded-full text-xs">{p.approval_status}</span></td>
                <td>{p.approval_status === 'approved' ? (p.workers_needed || '—') : '—'}</td>
                <td><button onClick={() => selectProject(p)} className="text-lavender-600 text-sm">View</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
