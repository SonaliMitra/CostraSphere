import { Download } from 'lucide-react';
import api from '../../api/axios';
import { useProject } from '../../context/ProjectContext';

export default function Reports() {
  const { projects, plan } = useProject();

  const downloadReport = async (projectId) => {
    try {
      const res = await api.get(`/telecom/projects/${projectId}/report`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `costrasphere_report_${projectId}.pdf`;
      a.click();
    } catch (err) {
      window.alert(err.response?.data?.detail || 'Failed to download report');
    }
  };

  const deleteReport = async (projectId) => {
    if (!window.confirm('Delete this report/project? This action cannot be undone.')) return;
    try {
      await api.delete(`/telecom/projects/${projectId}/report`);
      window.alert('Report/project deleted');
      window.location.reload();
    } catch (err) {
      window.alert(err.response?.data?.detail || 'Delete failed');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-lavender-800">Reports</h1>
      {plan?.project_id && (
        <div className="glass p-6">
          <h2 className="font-semibold mb-2">Current Project Report</h2>
          <button onClick={() => downloadReport(plan.project_id)} className="btn-primary flex items-center gap-2">
            <Download size={16} /> Download PDF Report
          </button>
        </div>
      )}
      <div className="glass p-6">
        <h2 className="font-semibold mb-4">All Project Reports</h2>
        <table className="table-elegant">
          <thead><tr><th>Project</th><th>Location</th><th>Budget</th><th>Days</th><th>Action</th></tr></thead>
          <tbody>
            {projects.map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>{p.city}, {p.state}</td>
                <td>{p.currency} {p.total_budget?.toLocaleString()}</td>
                <td>{p.deployment_days}</td>
                <td className="flex items-center gap-2">
                  <button onClick={() => downloadReport(p.id)} className="text-lavender-600 text-sm flex items-center gap-1"><Download size={14} /> PDF</button>
                  <button onClick={() => deleteReport(p.id)} className="text-red-600 text-sm">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
