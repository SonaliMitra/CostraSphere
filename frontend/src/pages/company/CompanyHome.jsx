import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import AnimatedCounter from '../../components/AnimatedCounter';
import api from '../../api/axios';

export default function CompanyHome() {
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    api.get('/company/analytics').then((r) => setAnalytics(r.data)).catch(() => {});
  }, []);

  if (!analytics) return <p className="text-gray-500">Loading...</p>;

  const cards = [
    { label: 'Total Revenue', value: analytics.total_revenue, prefix: '₹' },
    { label: 'Active Workers', value: analytics.active_workers },
    { label: 'Approved', value: analytics.approved_projects },
    { label: 'Pending', value: analytics.pending_approvals },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-lavender-800">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {cards.map((c, i) => (
          <motion.div key={c.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="card-stat">
            <p className="text-sm text-gray-500">{c.label}</p>
            <p className="text-2xl font-bold text-lavender-700"><AnimatedCounter value={c.value} prefix={c.prefix || ''} /></p>
          </motion.div>
        ))}
      </div>
      <div className="glass p-6 text-sm text-gray-600">
        Average deployment: {Math.min(100, Math.round(analytics.average_deployment_days))} days | Average budget: ₹{analytics.average_budget?.toLocaleString()}
      </div>
    </div>
  );
}
