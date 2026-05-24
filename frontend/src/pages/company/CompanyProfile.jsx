import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function CompanyProfile() {
  const { user, updateProfile } = useAuth();
  const [form, setForm] = useState({ full_name: user?.full_name || '', company_name: user?.company_name || '', phone: user?.phone || '' });
  const [msg, setMsg] = useState('');

  const save = async () => {
    await updateProfile(form);
    setMsg('Company profile updated');
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-lavender-800">Company Profile</h1>
      <div className="glass p-6 max-w-lg space-y-4">
        {msg && <div className="p-3 bg-green-50 text-green-700 rounded-xl text-sm">{msg}</div>}
        <input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="input-field" placeholder="Admin name" />
        <input value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} className="input-field" placeholder="Company name (listed for customers)" />
        <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input-field" placeholder="Phone" />
        <input value={user?.email || ''} disabled className="input-field opacity-60" />
        <button onClick={save} className="btn-primary">Save Profile</button>
      </div>
    </div>
  );
}
