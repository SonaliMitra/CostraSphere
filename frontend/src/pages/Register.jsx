import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Building2, KeyRound } from 'lucide-react';
import api from '../api/axios';
import logo from '../assets/images/logo.png';
import Watermark from '../components/Watermark';

export default function Register() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ email: '', password: '', full_name: '', role: 'customer', company_name: '' });
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = { ...form };
      if (payload.role !== 'company') delete payload.company_name;
      const res = await api.post('/auth/register', payload);
      setMessage(res.data.message);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/complete-registration', { email: form.email, otp_code: otp });
      localStorage.setItem('costrasphere_token', res.data.access_token);
      localStorage.setItem('costrasphere_user', JSON.stringify(res.data.user));
      const path = res.data.user.role === 'company' ? '/company' : '/dashboard';
      navigate(path);
    } catch (err) {
      setError(err.response?.data?.detail || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    setLoading(true);
    try {
      await api.post('/auth/resend-otp', { email: form.email, purpose: 'registration' });
      setMessage('OTP resent to your email.');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <Watermark />
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="glass w-full max-w-lg p-8 z-10">
        <div className="text-center mb-6">
          <img src={logo} alt="CostraSphere AI" className="h-14 mx-auto mb-3" />
          <p className="text-xs uppercase tracking-widest text-lavender-500 font-semibold mb-1">CostraSphere AI</p>
          <h1 className="text-2xl font-bold text-lavender-800">{step === 1 ? 'Create Account' : 'Verify Email'}</h1>
        </div>
        {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm">{error}</div>}
        {message && <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-xl text-sm">{message}</div>}

        {step === 1 && (
          <form onSubmit={handleRegister} className="space-y-3">
            <Field label="Full Name" icon={User} name="full_name" value={form.full_name} onChange={handleChange} />
            <Field label="Email" icon={Mail} name="email" type="email" value={form.email} onChange={handleChange} />
            <Field label="Password" icon={Lock} name="password" type="password" value={form.password} onChange={handleChange} minLength={8} />
            <div>
              <label className="text-sm text-gray-600">Role</label>
              <select name="role" value={form.role} onChange={handleChange} className="input-field">
                <option value="customer">Customer</option>
                <option value="company">Company Admin</option>
              </select>
            </div>
            {form.role === 'company' && (
              <Field label="Company Name" icon={Building2} name="company_name" value={form.company_name} onChange={handleChange} />
            )}
            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">{loading ? 'Sending OTP...' : 'Register & Send OTP'}</button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={verifyOtp} className="space-y-4">
            <div>
              <label className="text-sm text-gray-600">OTP Code</label>
              <div className="relative"><KeyRound className="absolute left-3 top-3 text-lavender-400" size={18} />
                <input value={otp} onChange={(e) => setOtp(e.target.value)} className="input-field pl-10" maxLength={6} required />
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? 'Verifying...' : 'Verify & Complete Registration'}</button>
            <button type="button" onClick={resendOtp} disabled={loading} className="btn-secondary w-full text-sm">Resend OTP</button>
          </form>
        )}

        <p className="text-center text-sm text-gray-500 mt-4">
          Already have an account? <Link to="/login" className="text-lavender-600 hover:underline">Sign In</Link>
        </p>
      </motion.div>
    </div>
  );
}

function Field({ label, icon: Icon, name, type = 'text', value, onChange, minLength }) {
  return (
    <div>
      <label className="text-sm text-gray-600">{label}</label>
      <div className="relative">
        <Icon className="absolute left-3 top-3 text-lavender-400" size={18} />
        <input name={name} type={type} value={value} onChange={onChange} className="input-field pl-10" minLength={minLength} required />
      </div>
    </div>
  );
}
