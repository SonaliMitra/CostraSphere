import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, DollarSign, CheckCircle, Clock, Map } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import Navbar from '../components/Navbar';
import Watermark from '../components/Watermark';
import TelecomMap from '../components/TelecomMap';
import AnimatedCounter from '../components/AnimatedCounter';
import LoadingSkeleton from '../components/LoadingSkeleton';
import api from '../api/axios';

export default function CompanyDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [workers, setWorkers] = useState([]);
  const [pending, setPending] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [a, w, p, proj] = await Promise.all([
        api.get('/company/analytics'),
        api.get('/company/workers'),
        api.get('/company/projects/pending'),
        api.get('/projects/'),
      ]);
      setAnalytics(a.data);
      setWorkers(w.data);
      setPending(p.data);
      setProjects(proj.data);
      if (proj.data.length) setSelectedProject(proj.data[0]);
    } catch { /* empty */ }
    finally { setLoading(false); }
  };

  const approveProject = async (id, status) => {
    await api.put(`/projects/${id}`, { approval_status: status });
    loadData();
  };

  const cityData = analytics?.projects_by_city
    ? Object.entries(analytics.projects_by_city).map(([city, count]) => ({ city, count }))
    : [];

  if (loading) return <LoadingSkeleton fullPage />;

  return (
    <div className="min-h-screen pb-8 relative">
      <Navbar />
      <Watermark />
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 relative z-10">
        <h1 className="text-3xl font-bold text-lavender-800">Company Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { icon: DollarSign, label: 'Total Revenue', value: analytics?.total_revenue || 0, prefix: '₹' },
            { icon: Users, label: 'Active Workers', value: analytics?.active_workers || 0 },
            { icon: CheckCircle, label: 'Approved', value: analytics?.approved_projects || 0 },
            { icon: Clock, label: 'Pending', value: analytics?.pending_approvals || 0 },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="card-stat">
              <s.icon className="text-lavender-500 mb-2" size={24} />
              <p className="text-sm text-gray-500">{s.label}</p>
              <p className="text-2xl font-bold text-lavender-700"><AnimatedCounter value={s.value} prefix={s.prefix || ''} /></p>
            </motion.div>
          ))}
        </div>

        {/* CORRECTION #5: Show profit clearly */}
        <div className="glass p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500">
          <h2 className="text-xl font-bold text-green-800 mb-4 flex items-center gap-2">
            <DollarSign className="text-green-600" size={24} /> Profit Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg p-4 border border-green-200">
              <p className="text-sm text-gray-600">Total Profit (10%)</p>
              <p className="text-3xl font-bold text-green-700 mt-2">
                ₹ {(analytics?.total_revenue ? (analytics.total_revenue * 0.10).toLocaleString() : 0)}
              </p>
              <p className="text-xs text-gray-500 mt-2">Across all approved projects</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-green-200">
              <p className="text-sm text-gray-600">Profit Margin</p>
              <p className="text-3xl font-bold text-green-700 mt-2">10%</p>
              <p className="text-xs text-gray-500 mt-2">Standard margin per project</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-green-200">
              <p className="text-sm text-gray-600">Avg. Profit per Project</p>
              <p className="text-3xl font-bold text-green-700 mt-2">
                ₹ {(analytics?.approved_projects > 0 ? ((analytics.total_revenue * 0.10) / analytics.approved_projects).toLocaleString() : 0)}
              </p>
              <p className="text-xs text-gray-500 mt-2">From {analytics?.approved_projects || 0} approved projects</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass p-6">
            <h2 className="font-semibold text-lavender-800 mb-4">Revenue Analytics</h2>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={analytics?.monthly_revenue || []}>
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" stroke="#9333ea" strokeWidth={2} dot={{ fill: '#a855f7' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="glass p-6">
            <h2 className="font-semibold text-lavender-800 mb-4">Projects by City</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={cityData.slice(0, 8)}>
                <XAxis dataKey="city" tick={{ fontSize: 9 }} angle={-20} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#7c3aed" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass p-6">
          <h2 className="font-semibold text-lavender-800 mb-4">Pending Approvals</h2>
          <table className="table-elegant w-full">
            <thead><tr><th>Project</th><th>City</th><th>Budget</th><th>Profit (10%)</th><th>Terrain</th><th>Actions</th></tr></thead>
            <tbody>
              {pending.map((p) => {
                const profit = (p.total_budget || 0) * 0.10;
                return (
                  <tr key={p.id}>
                    <td>{p.name}</td>
                    <td>{p.city}</td>
                    <td className="font-semibold">{p.currency} {p.total_budget?.toLocaleString()}</td>
                    <td className="font-semibold text-green-700">{p.currency} {profit.toLocaleString('en-IN', {maximumFractionDigits: 2})}</td>
                    <td>{p.terrain}</td>
                    <td className="space-x-2">
                      <button onClick={() => approveProject(p.id, 'approved')} className="text-green-600 text-sm hover:font-semibold">Approve</button>
                      <button onClick={() => approveProject(p.id, 'rejected')} className="text-red-500 text-sm hover:font-semibold">Reject</button>
                    </td>
                  </tr>
                );
              })}
              {!pending.length && <tr><td colSpan={6} className="text-gray-400 text-center">No pending approvals</td></tr>}
            </tbody>
          </table>
        </div>

        <div className="glass p-6">
          <h2 className="font-semibold text-lavender-800 mb-4">Worker Analytics</h2>
          <table className="table-elegant">
            <thead><tr><th>Name</th><th>Email</th><th>Projects</th><th>Total Spend</th><th>Company</th></tr></thead>
            <tbody>
              {workers.map((w) => (
                <tr key={w.id}><td>{w.name}</td><td>{w.email}</td><td>{w.projects}</td><td>{w.total_spend?.toLocaleString()}</td><td>{w.company || '-'}</td></tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="glass p-6">
          <h2 className="font-semibold text-lavender-800 mb-4 flex items-center gap-2"><Map size={18} /> Map Analytics</h2>
          <select value={selectedProject?.id || ''} onChange={(e) => setSelectedProject(projects.find((p) => p.id === parseInt(e.target.value)))} className="input-field mb-4 max-w-xs">
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          {selectedProject && (
            <TelecomMap
              hub={{ latitude: selectedProject.latitude, longitude: selectedProject.longitude }}
              towers={selectedProject.towers_data || []}
              routes={selectedProject.routes_data || []}
              height="400px"
            />
          )}
        </div>
      </div>
    </div>
  );
}
