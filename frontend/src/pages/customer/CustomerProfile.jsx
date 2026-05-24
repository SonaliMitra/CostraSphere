import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function CustomerProfile() {
  const { user, updateProfile } = useAuth();
  const [profile, setProfile] = useState({
    full_name: user?.full_name || '',
    company_name: user?.company_name || '',
    phone: user?.phone || '',
  });
  const [msg, setMsg] = useState('');

  const save = async () => {
    await updateProfile(profile);
    setMsg('Profile updated successfully');
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-lavender-800">Profile</h1>
      <div className="glass p-6 max-w-lg space-y-4">
        {msg && <div className="p-3 bg-green-50 text-green-700 rounded-xl text-sm">{msg}</div>}
        <input value={profile.full_name} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} className="input-field" placeholder="Full name" />
        <input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} className="input-field" placeholder="Phone" />
        <input value={user?.email || ''} disabled className="input-field opacity-60" />
        <button onClick={save} className="btn-primary">Save Profile</button>
      </div>
    </div>
  );
}
