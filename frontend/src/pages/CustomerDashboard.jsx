import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Radio, Download, RefreshCw, User as UserIcon, Send } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import Navbar from '../components/Navbar';
import Watermark from '../components/Watermark';
import TelecomMap from '../components/TelecomMap';
import Chatbot from '../components/Chatbot';
import AnimatedCounter from '../components/AnimatedCounter';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const TERRAINS = ['Urban', 'Rural', 'Mountain', 'Forest'];
const CURRENCIES = ['INR', 'USD', 'GBP', 'JPY', 'CNY'];
const COLORS = ['#a855f7', '#9333ea', '#7c3aed', '#6d28d9', '#581c87'];

export default function CustomerDashboard() {
  const { user, updateProfile } = useAuth();
  const [lat, setLat] = useState(13.0827);
  const [lng, setLng] = useState(80.2707);
  const [terrain, setTerrain] = useState('Urban');
  const [currency, setCurrency] = useState('INR');
  const [projectName, setProjectName] = useState('');
  const [plan, setPlan] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTower, setSelectedTower] = useState(null);
  const [profile, setProfile] = useState({ full_name: user?.full_name || '', company_name: user?.company_name || '', phone: user?.phone || '' });

  useEffect(() => {
    loadProjects();
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
      });
    }
  }, []);

  const loadProjects = async () => {
    try {
      const res = await api.get('/projects/');
      setProjects(res.data);
      if (res.data.length && !plan) {
        const p = res.data[0];
        setPlan({ project_id: p.id, towers: p.towers_data, routes: p.routes_data, costs: p.cost_breakdown, location: { city: p.city, state: p.state }, hub: { latitude: p.latitude, longitude: p.longitude } });
      }
    } catch { /* empty */ }
  };

  const generatePlan = async () => {
    setLoading(true);
    try {
      const res = await api.post('/telecom/generate', { latitude: lat, longitude: lng, terrain, currency, project_name: projectName || undefined });
      setPlan(res.data);
      loadProjects();
    } catch (err) {
      alert(err.response?.data?.detail || 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = async (projectId) => {
    const res = await api.get(`/telecom/projects/${projectId}/report`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement('a');
    a.href = url;
    a.download = `costrasphere_report_${projectId}.pdf`;
    a.click();
  };

  const saveProfile = async () => {
    await updateProfile(profile);
    alert('Profile updated');
  };

  // CORRECTION #9: Send approval to company
  const sendApproval = async (projectId) => {
    try {
      await api.post(`/telecom/projects/${projectId}/send-approval`);
      alert('Approval request sent to company!');
      loadProjects();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to send approval request');
    }
  };

  const costChart = plan?.costs ? [
    { name: 'Fiber', value: plan.costs.fiber_deployment_cost },
    { name: 'Towers', value: plan.costs.tower_installation_cost },
    { name: 'Labor', value: plan.costs.labor_planning_cost },
    { name: 'Maintenance', value: plan.costs.maintenance_cost },
    { name: 'Transport', value: plan.costs.transport_cost },
  ] : [];

  return (
    <div className="min-h-screen pb-8 relative">
      <Navbar />
      <Watermark />
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 relative z-10">
        <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-3xl font-bold text-lavender-800">
          Customer Dashboard
        </motion.h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Budget', value: plan?.costs?.final_budget || 0, prefix: plan?.costs?.currency_symbol || '₹' },
            { label: 'Towers', value: plan?.towers?.length || 0 },
            { label: 'Route KM', value: plan?.costs?.total_route_km || 0 },
            { label: 'Deploy Days', value: plan?.costs?.deployment_duration_days || 0 },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="card-stat">
              <p className="text-sm text-gray-500">{s.label}</p>
              <p className="text-2xl font-bold text-lavender-700 mt-1">
                <AnimatedCounter value={s.value} prefix={s.prefix || ''} />
              </p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="glass p-6 lg:col-span-1 space-y-4">
            <h2 className="font-semibold text-lavender-800 flex items-center gap-2"><MapPin size={18} /> Deployment Planner</h2>
            <input value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="Project name" className="input-field" />
            <div className="grid grid-cols-2 gap-2">
              <input type="number" step="0.0001" value={lat} onChange={(e) => setLat(parseFloat(e.target.value))} className="input-field text-sm" placeholder="Latitude" />
              <input type="number" step="0.0001" value={lng} onChange={(e) => setLng(parseFloat(e.target.value))} className="input-field text-sm" placeholder="Longitude" />
            </div>
            <select value={terrain} onChange={(e) => setTerrain(e.target.value)} className="input-field">
              {TERRAINS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="input-field">
              {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <button onClick={generatePlan} disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> {loading ? 'Generating...' : 'Generate AI Plan'}
            </button>
            {plan?.location && (
              <p className="text-xs text-gray-500">Matched: {plan.location.city}, {plan.location.state} ({plan.location.match_reason})</p>
            )}
          </div>

          <div className="glass p-4 lg:col-span-2">
            {loading ? <LoadingSkeleton rows={5} /> : (
              <TelecomMap hub={plan?.hub} towers={plan?.towers || []} routes={plan?.routes || []} onTowerClick={setSelectedTower} height="480px" />
            )}
          </div>
        </div>

        {selectedTower && (
          <div className="glass p-4">
            <h3 className="font-semibold text-lavender-800 flex items-center gap-2"><Radio size={18} /> {selectedTower.name}</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-3 text-sm">
              <div><span className="text-gray-500">Type</span><p>{selectedTower.tower_type}</p></div>
              <div><span className="text-gray-500">Connectors</span><p>{selectedTower.connector_count}</p></div>
              <div><span className="text-gray-500">Nodes</span><p>{selectedTower.fiber_node_count}</p></div>
              <div><span className="text-gray-500">Route</span><p>{selectedTower.route_distance} km</p></div>
              <div><span className="text-gray-500">Cost</span><p>{selectedTower.deployment_cost?.toLocaleString()}</p></div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass p-6">
            <h2 className="font-semibold text-lavender-800 mb-4">Cost Breakdown</h2>
            {costChart.length ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={costChart}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#9333ea" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-gray-400 text-sm">Generate a plan to see analytics</p>}
          </div>
          <div className="glass p-6">
            <h2 className="font-semibold text-lavender-800 mb-4">Budget Distribution</h2>
            {costChart.length ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={costChart} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {costChart.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : <p className="text-gray-400 text-sm">No data yet</p>}
          </div>
        </div>

        <div className="glass p-6">
          <h2 className="font-semibold text-lavender-800 mb-4">Saved Projects</h2>
          <div className="overflow-x-auto">
            <table className="table-elegant">
              <thead><tr><th>Name</th><th>Location</th><th>Budget</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {projects.map((p) => (
                  <tr key={p.id}>
                    <td>{p.name}</td>
                    <td>{p.city}, {p.state}</td>
                    <td>{p.currency} {p.total_budget?.toLocaleString()}</td>
                    <td><span className="px-2 py-1 bg-lavender-100 rounded-full text-xs">{p.status}</span></td>
                    <td>
                      <button onClick={() => { setPlan({ project_id: p.id, towers: p.towers_data, routes: p.routes_data, costs: p.cost_breakdown, location: { city: p.city, state: p.state }, hub: { latitude: p.latitude, longitude: p.longitude } }); }} className="text-lavender-600 text-sm mr-2">View</button>
                      <button onClick={() => downloadReport(p.id)} className="text-lavender-600 text-sm mr-2"><Download size={14} className="inline" /> PDF</button>
                      <button onClick={() => sendApproval(p.id)} className="text-blue-600 text-sm hover:text-blue-700 flex items-center gap-1 inline"><Send size={14} /> Approval</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="glass p-6">
          <h2 className="font-semibold text-lavender-800 mb-4 flex items-center gap-2"><UserIcon size={18} /> Profile</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input value={profile.full_name} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} className="input-field" placeholder="Full name" />
            <input value={profile.company_name} onChange={(e) => setProfile({ ...profile, company_name: e.target.value })} className="input-field" placeholder="Company" />
            <input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} className="input-field" placeholder="Phone" />
          </div>
          <button onClick={saveProfile} className="btn-primary mt-4">Save Profile</button>
        </div>
      </div>
      <Chatbot />
    </div>
  );
}
