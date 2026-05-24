import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Database, Mail, Key, Activity, Brain, Users, FolderKanban, Server } from 'lucide-react';
import Navbar from '../components/Navbar';
import Watermark from '../components/Watermark';
import AnimatedCounter from '../components/AnimatedCounter';
import LoadingSkeleton from '../components/LoadingSkeleton';
import api from '../api/axios';

const TABS = [
  { id: 'overview', label: 'Super Admin Dashboard', icon: Activity },
  { id: 'database', label: 'Database Viewer', icon: Database },
  { id: 'smtp', label: 'SMTP Logs', icon: Mail },
  { id: 'otp', label: 'OTP Logs', icon: Key },
  { id: 'api', label: 'API Logs', icon: Activity },
  { id: 'users', label: 'User Management', icon: Users },
  { id: 'projects', label: 'Project Management', icon: FolderKanban },
  { id: 'ai', label: 'Debug Tools', icon: Brain },
  { id: 'diagnostics', label: 'Backend API', icon: Server },
];

export default function DeveloperDashboard() {
  const [tab, setTab] = useState('overview');
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [smtpLogs, setSmtpLogs] = useState([]);
  const [otpLogs, setOtpLogs] = useState([]);
  const [apiLogs, setApiLogs] = useState([]);
  const [aiLogs, setAiLogs] = useState([]);
  const [tables, setTables] = useState([]);
  const [tableData, setTableData] = useState(null);
  const [diagnostics, setDiagnostics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editRow, setEditRow] = useState(null);

  useEffect(() => { loadOverview(); }, []);

  const loadOverview = async () => {
    setLoading(true);
    try {
      const [a, d] = await Promise.all([api.get('/admin/analytics'), api.get('/admin/diagnostics')]);
      setAnalytics(a.data);
      setDiagnostics(d.data);
    } catch { /* empty */ }
    finally { setLoading(false); }
  };

  const loadTab = async (id) => {
    setTab(id);
    setLoading(true);
    try {
      if (id === 'users') setUsers((await api.get('/admin/users')).data);
      else if (id === 'projects') setProjects((await api.get('/admin/projects')).data);
      else if (id === 'smtp') setSmtpLogs((await api.get('/admin/smtp-logs')).data);
      else if (id === 'otp') setOtpLogs((await api.get('/admin/otp-logs')).data);
      else if (id === 'api') setApiLogs((await api.get('/admin/api-logs')).data);
      else if (id === 'ai') setAiLogs((await api.get('/admin/ai-logs')).data);
      else if (id === 'database') {
        const t = (await api.get('/admin/tables')).data;
        setTables(t.tables);
        if (t.tables.length) loadTable(t.tables[0]);
      }
      else if (id === 'overview') await loadOverview();
      else if (id === 'diagnostics') setDiagnostics((await api.get('/admin/diagnostics')).data);
    } catch { /* empty */ }
    finally { setLoading(false); }
  };

  const loadTable = async (name) => {
    const res = await api.get(`/admin/tables/${name}`);
    setTableData(res.data);
  };

  const updateUser = async (userId, data) => {
    await api.put(`/admin/users/${userId}`, data);
    loadTab('users');
  };

  const deleteUser = async (userId) => {
    if (!confirm('Delete this user?')) return;
    await api.delete(`/admin/users/${userId}`);
    loadTab('users');
  };

  const saveTableEdit = async () => {
    if (!editRow) return;
    await api.put('/admin/tables/update', {
      table_name: tableData.table,
      record_id: editRow.id,
      data: editRow,
    });
    setEditRow(null);
    loadTable(tableData.table);
  };

  if (loading && tab === 'overview' && !analytics) return <LoadingSkeleton fullPage />;

  return (
    <div className="min-h-screen pb-8 relative">
      <Navbar />
      <Watermark />
      <div className="max-w-7xl mx-auto px-4 py-6 relative z-10">
        <h1 className="text-3xl font-bold text-lavender-800 mb-6">Developer Super Admin</h1>

        <div className="flex flex-wrap gap-2 mb-6">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => loadTab(t.id)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all ${tab === t.id ? 'bg-lavender-600 text-white shadow-glow' : 'glass text-lavender-700 hover:bg-lavender-50'}`}>
              <t.icon size={16} /> {t.label}
            </button>
          ))}
        </div>

        {loading ? <LoadingSkeleton rows={5} /> : (
          <>
            {tab === 'overview' && analytics && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: 'Total Users', value: analytics.total_users },
                  { label: 'Total Projects', value: analytics.total_projects },
                  { label: 'Total Budget', value: analytics.total_budget, prefix: '₹' },
                  { label: 'SMTP Success', value: analytics.smtp_success },
                  { label: 'SMTP Failed', value: analytics.smtp_failed },
                  { label: 'API Logs', value: analytics.api_log_count },
                ].map((s) => (
                  <div key={s.label} className="card-stat">
                    <p className="text-sm text-gray-500">{s.label}</p>
                    <p className="text-2xl font-bold text-lavender-700"><AnimatedCounter value={s.value} prefix={s.prefix || ''} /></p>
                  </div>
                ))}
              </div>
            )}

            {tab === 'users' && (
              <div className="glass p-6 overflow-x-auto">
                <table className="table-elegant">
                  <thead><tr><th>ID</th><th>Email</th><th>Name</th><th>Role</th><th>Active</th><th>Actions</th></tr></thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id}>
                        <td>{u.id}</td><td>{u.email}</td><td>{u.full_name}</td>
                        <td>
                          <select value={u.role} onChange={(e) => updateUser(u.id, { role: e.target.value })} className="text-xs border rounded px-1">
                            <option value="customer">customer</option>
                            <option value="company">company</option>
                            <option value="developer">developer</option>
                          </select>
                        </td>
                        <td>
                          <button onClick={() => updateUser(u.id, { is_active: !u.is_active })} className={`text-xs px-2 py-1 rounded ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                            {u.is_active ? 'Active' : 'Inactive'}
                          </button>
                        </td>
                        <td>
                          {u.email !== 'developer@costrasphere.ai' && (
                            <button onClick={() => deleteUser(u.id)} className="text-red-500 text-xs">Delete</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {tab === 'projects' && (
              <div className="glass p-6 overflow-x-auto">
                <table className="table-elegant">
                  <thead><tr><th>ID</th><th>Name</th><th>Owner</th><th>City</th><th>Budget</th><th>Status</th><th>Approval</th></tr></thead>
                  <tbody>
                    {projects.map((p) => (
                      <tr key={p.id}><td>{p.id}</td><td>{p.name}</td><td>{p.owner_id}</td><td>{p.city}</td><td>{p.total_budget?.toLocaleString()}</td><td>{p.status}</td><td>{p.approval_status}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {tab === 'database' && (
              <div className="space-y-4">
                <div className="flex gap-2 flex-wrap">
                  {tables.map((t) => (
                    <button key={t} onClick={() => loadTable(t)} className={`px-3 py-1 rounded-lg text-sm ${tableData?.table === t ? 'bg-lavender-600 text-white' : 'glass'}`}>{t}</button>
                  ))}
                </div>
                {tableData && (
                  <div className="glass p-4 overflow-x-auto">
                    <table className="table-elegant text-xs">
                      <thead><tr>{tableData.columns.map((c) => <th key={c}>{c}</th>)}<th>Edit</th></tr></thead>
                      <tbody>
                        {tableData.rows.map((row, i) => (
                          <tr key={i}>
                            {tableData.columns.map((c) => <td key={c}>{typeof row[c] === 'object' ? JSON.stringify(row[c]) : String(row[c] ?? '')}</td>)}
                            <td>
                              {['users', 'projects'].includes(tableData.table) && (
                                <button onClick={() => setEditRow({ ...row })} className="text-lavender-600">Edit</button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {editRow && (
                  <div className="glass p-4 space-y-2">
                    <h3 className="font-semibold">Edit Record #{editRow.id}</h3>
                    {Object.keys(editRow).filter((k) => k !== 'id' && k !== 'hashed_password').map((k) => (
                      <input key={k} value={editRow[k] ?? ''} onChange={(e) => setEditRow({ ...editRow, [k]: e.target.value })} className="input-field text-sm" placeholder={k} />
                    ))}
                    <div className="flex gap-2">
                      <button onClick={saveTableEdit} className="btn-primary text-sm">Save</button>
                      <button onClick={() => setEditRow(null)} className="btn-secondary text-sm">Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {tab === 'smtp' && <LogTable data={smtpLogs} cols={['id', 'recipient', 'subject', 'status', 'message', 'created_at']} />}
            {tab === 'otp' && <LogTable data={otpLogs} cols={['id', 'user_id', 'otp_code', 'purpose', 'is_used', 'expires_at', 'created_at']} />}
            {tab === 'api' && <LogTable data={apiLogs} cols={['id', 'method', 'path', 'status_code', 'user_id', 'duration_ms', 'created_at']} />}
            {tab === 'ai' && <LogTable data={aiLogs} cols={['id', 'service', 'message', 'created_at']} extra={aiLogs} />}
            {tab === 'diagnostics' && diagnostics && (
              <div className="glass p-6">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap">{JSON.stringify(diagnostics, null, 2)}</pre>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function LogTable({ data, cols }) {
  return (
    <div className="glass p-6 overflow-x-auto max-h-[600px] overflow-y-auto">
      <table className="table-elegant text-xs">
        <thead><tr>{cols.map((c) => <th key={c}>{c}</th>)}</tr></thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i}>{cols.map((c) => <td key={c}>{typeof row[c] === 'object' ? JSON.stringify(row[c])?.slice(0, 80) : String(row[c] ?? '')}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
