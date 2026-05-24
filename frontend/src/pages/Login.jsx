import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/images/logo.png';
import Watermark from '../components/Watermark';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    const path = user.role === 'developer' ? '/developer' : user.role === 'company' ? '/company' : '/dashboard';
    navigate(path, { replace: true });
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(email, password);
      const path = data.user.role === 'developer' ? '/developer' : data.user.role === 'company' ? '/company' : '/dashboard';
      navigate(path);
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <Watermark />
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="glass w-full max-w-md p-8 z-10">
        <div className="text-center mb-8">
          <img src={logo} alt="CostraSphere AI" className="h-16 mx-auto mb-4" />
          <p className="text-xs uppercase tracking-widest text-lavender-500 font-semibold mb-1">CostraSphere AI</p>
          <h1 className="text-2xl font-bold text-lavender-800">Welcome Back</h1>
          <p className="text-gray-500 text-sm mt-1">Telecom AI SaaS Platform — Sign in to continue</p>
        </div>
        {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 text-lavender-400" size={18} />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field pl-10" placeholder="you@company.com" required />
            </div>
          </div>
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 text-lavender-400" size={18} />
              <input type={showPass ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className="input-field pl-10 pr-10" placeholder="••••••••" required />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-3.5 text-gray-400">
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div className="text-right">
            <Link to="/forgot-password" className="text-sm text-lavender-600 hover:underline">Forgot password?</Link>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? 'Signing in...' : 'Sign In'}</button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-6">
          Don&apos;t have an account? <Link to="/register" className="text-lavender-600 font-medium hover:underline">Register</Link>
        </p>
      </motion.div>
    </motion.div>
  );
}
