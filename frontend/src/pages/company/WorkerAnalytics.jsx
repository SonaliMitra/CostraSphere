import { useEffect, useState } from 'react';
import api from '../../api/axios';

export default function WorkerAnalytics() {
  const [workers, setWorkers] = useState([]);

  useEffect(() => {
    api.get('/company/workers').then((r) => setWorkers(r.data)).catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-lavender-800">Worker Analytics</h1>
      <div className="glass p-6 overflow-x-auto">
        <table className="table-elegant">
          <thead><tr><th>Name</th><th>Email</th><th>Projects</th><th>Total Spend</th><th>Company</th></tr></thead>
          <tbody>
            {workers.map((w) => (
              <tr key={w.id}><td>{w.name}</td><td>{w.email}</td><td>{w.projects}</td><td>{w.total_spend?.toLocaleString()}</td><td>{w.company || '—'}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
