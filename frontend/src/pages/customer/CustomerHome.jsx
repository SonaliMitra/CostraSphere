import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import AnimatedCounter from '../../components/AnimatedCounter';
import { useProject } from '../../context/ProjectContext';

export default function CustomerHome() {
  const { plan, projects } = useProject();
  const approved = projects.filter((p) => p.approval_status === 'approved');

  const stats = [
    { label: 'Total Budget', value: plan?.costs?.final_budget || 0, prefix: plan?.costs?.currency || 'INR', isCurrency: true },
    { label: 'Towers', value: plan?.towers?.length || 0 },
    { label: 'Route KM', value: plan?.costs?.total_route_km || 0 },
    { label: 'Deploy Days', value: plan?.costs?.deployment_duration_days || plan?.deployment_days || 0 },
  ];

  const costChart = plan?.costs ? [
    { name: 'Fiber', value: plan.costs.fiber_deployment_cost },
    { name: 'Towers', value: plan.costs.tower_installation_cost },
    { name: 'Labor', value: plan.costs.labor_planning_cost },
    { name: 'Maintenance', value: plan.costs.maintenance_cost },
  ] : [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-lavender-800">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="card-stat">
            <p className="text-sm text-gray-500">{s.label}</p>
            <div className="flex items-center gap-1">
              {s.isCurrency && <span className="text-sm text-lavender-600 font-medium">{s.prefix}</span>}
              <p className="text-2xl font-bold text-lavender-700"><AnimatedCounter value={s.value} prefix={s.isCurrency ? '' : s.prefix} /></p>
            </div>
          </motion.div>
        ))}
      </div>

      {approved.length > 0 && (
        <div className="glass p-6">
          <h2 className="font-semibold text-lavender-800 mb-3">Approved Projects — Workers Assigned</h2>
          {approved.map((p) => (
            <div key={p.id} className="flex justify-between py-2 border-b border-lavender-50 text-sm">
              <span>{p.name}</span>
              <span className="text-lavender-700 font-medium">{p.workers_needed || 0} workers needed</span>
            </div>
          ))}
        </div>
      )}

      <div className="glass p-6">
        <h2 className="font-semibold text-lavender-800 mb-4">AI Budget Analytics</h2>
        {costChart.length ? (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={costChart}><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="value" fill="#9333ea" radius={[6, 6, 0, 0]} /></BarChart>
          </ResponsiveContainer>
        ) : <p className="text-gray-400 text-sm">Create a project to see analytics.</p>}
      </div>
    </div>
  );
}
