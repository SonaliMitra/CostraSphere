import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../api/axios';

export default function RevenueAnalytics() {
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    api.get('/company/analytics').then((r) => setAnalytics(r.data)).catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-lavender-800">Revenue Analytics</h1>
      <div className="glass p-6">
        {analytics ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics.monthly_revenue}>
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line type="monotone" dataKey="revenue" stroke="#9333ea" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        ) : <p className="text-gray-400">Loading...</p>}
      </div>
    </div>
  );
}
