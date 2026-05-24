import { useEffect, useState } from 'react';
import { Trash2, Edit2 } from 'lucide-react';
import api from '../../api/axios';

export default function ProjectApprovals() {
  const [pending, setPending] = useState([]);
  const [allProjects, setAllProjects] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const load = () => {
    api.get('/company/projects/pending').then((r) => setPending(r.data)).catch(() => {});
    api.get('/company/projects/all').then((r) => setAllProjects(r.data)).catch(() => {});
  };

  useEffect(() => { load(); }, []);

  const approve = async (id, status) => {
    await api.put(`/projects/${id}`, { approval_status: status });
    load();
  };

  // CORRECTION #7: Delete approved project
  const deleteProject = async (id) => {
    if (!window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) return;
    try {
      await api.delete(`/telecom/projects/${id}/report`);
      window.alert('Project deleted successfully');
      load();
    } catch (err) {
      window.alert('Failed to delete project');
    }
  };

  // CORRECTION #7: Edit/Reject approved project
  const handleEdit = (id) => {
    setEditingId(editingId === id ? null : id);
  };

  const rejectProject = async (id) => {
    if (!window.confirm('Are you sure you want to reject this project?')) return;
    try {
      await api.put(`/projects/${id}`, { approval_status: 'rejected' });
      window.alert('Project rejected');
      setEditingId(null);
      load();
    } catch (err) {
      window.alert('Failed to reject project');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-lavender-800">Project Approvals</h1>
      <div className="glass p-6 overflow-x-auto">
        <h2 className="font-semibold mb-4">Pending Approvals</h2>
        <table className="table-elegant">
          <thead><tr><th>Project</th><th>Location</th><th>Lat/Lon</th><th>Currency</th><th>Budget</th><th>Days</th><th>Actions</th></tr></thead>
          <tbody>
            {pending.map((p) => (
              <tr key={p.id}>
                <td className="font-medium">{p.name}</td>
                <td>{p.city}, {p.state}</td>
                <td className="text-xs font-mono">{p.latitude.toFixed(4)}, {p.longitude.toFixed(4)}</td>
                <td><span className="bg-lavender-100 text-lavender-700 px-2 py-1 rounded text-sm font-medium">{p.currency}</span></td>
                <td>{p.currency} {p.total_budget?.toLocaleString()}</td>
                <td>{Math.min(100, p.deployment_days)}</td>
                <td className="space-x-2">
                  <button onClick={() => approve(p.id, 'approved')} className="text-green-600 text-sm font-medium hover:text-green-700">✓ Approve</button>
                  <button onClick={() => approve(p.id, 'rejected')} className="text-red-500 text-sm font-medium hover:text-red-600">✗ Reject</button>
                </td>
              </tr>
            ))}
            {!pending.length && <tr><td colSpan={7} className="text-center text-gray-400">No pending approvals</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="glass p-6">
        <h2 className="font-semibold mb-4">Approved Projects — Cost Breakdown with Profit</h2>
        <div className="space-y-3">
          {allProjects.filter((p) => p.approval_status === 'approved' && p.cost_breakdown).map((p) => {
            const c = p.cost_breakdown || {};
            return (
              <div key={p.id} className="border-l-4 border-green-500 bg-green-50 p-4 rounded">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-medium text-lavender-800">{p.name}</p>
                    <p className="text-xs text-gray-500">{p.city}, {p.state}</p>
                  </div>
                  <div className="flex gap-2 items-center">
                    <span className="bg-green-200 text-green-800 px-2 py-1 rounded text-sm font-medium">Approved</span>
                    <button
                      onClick={() => handleEdit(p.id)}
                      className="p-1.5 hover:bg-green-200 rounded transition"
                      title="Edit or reject"
                    >
                      <Edit2 size={16} className="text-blue-600" />
                    </button>
                    <button
                      onClick={() => deleteProject(p.id)}
                      className="p-1.5 hover:bg-red-200 rounded transition"
                      title="Delete project"
                    >
                      <Trash2 size={16} className="text-red-600" />
                    </button>
                  </div>
                </div>
                
                {editingId === p.id && (
                  <div className="mt-3 pt-3 border-t border-green-200 space-y-2">
                    <p className="text-sm text-gray-700 font-medium">Edit Options:</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => rejectProject(p.id)}
                        className="px-4 py-2 bg-orange-500 text-white rounded text-sm hover:bg-orange-600 transition"
                      >
                        Reject Project
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-4 py-2 bg-gray-400 text-white rounded text-sm hover:bg-gray-500 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-4 gap-2 text-sm">
                  <div>
                    <p className="text-gray-600 text-xs">Subtotal</p>
                    <p className="font-semibold">{p.currency} {(c.subtotal_cost || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-xs">Profit (10%)</p>
                    <p className="font-semibold text-green-700">{p.currency} {(c.company_profit || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-xs">Total Budget</p>
                    <p className="font-semibold">{p.currency} {p.total_budget?.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-xs">Workers</p>
                    <p className="font-semibold">{p.workers_needed || '—'}</p>
                  </div>
                </div>
              </div>
            );
          })}
          {!allProjects.some((p) => p.approval_status === 'approved') && (
            <p className="text-gray-400 text-sm text-center py-8">No approved projects yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
