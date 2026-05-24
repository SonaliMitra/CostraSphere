import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, KeyRound, Lock } from 'lucide-react';
import api from '../api/axios';
import logo from '../assets/images/logo.png';
import Watermark from '../components/Watermark';

export default function ForgotPassword() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const sendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setMessage('OTP sent to your email.');
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    setLoading(true);
    try {
      await api.post('/auth/resend-otp', { email, purpose: 'password_reset' });
      setMessage('OTP resent successfully.');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { email, otp_code: otp, new_password: newPassword });
      setMessage('Password reset successfully! You can now login.');
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.detail || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <Watermark />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass w-full max-w-md p-8 z-10">
        <img src={logo} alt="CostraSphere" className="h-14 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-lavender-800 text-center mb-6">Reset Password</h1>
        {message && <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-xl text-sm">{message}</div>}
        {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm">{error}</div>}

        {step === 1 && (
          <form onSubmit={sendOtp} className="space-y-4">
            <div>
              <label className="text-sm text-gray-600">Email</label>
              <div className="relative"><Mail className="absolute left-3 top-3 text-lavender-400" size={18} />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field pl-10" required />
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? 'Sending...' : 'Send OTP'}</button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={resetPassword} className="space-y-4">
            <div>
              <label className="text-sm text-gray-600">OTP Code</label>
              <div className="relative"><KeyRound className="absolute left-3 top-3 text-lavender-400" size={18} />
                <input value={otp} onChange={(e) => setOtp(e.target.value)} className="input-field pl-10" maxLength={6} required />
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-600">New Password</label>
              <div className="relative"><Lock className="absolute left-3 top-3 text-lavender-400" size={18} />
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="input-field pl-10" minLength={8} required />
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? 'Resetting...' : 'Reset Password'}</button>
            <button type="button" onClick={resendOtp} disabled={loading} className="btn-secondary w-full text-sm">Resend OTP</button>
          </form>
        )}

        {step === 3 && <Link to="/login" className="btn-primary w-full block text-center">Go to Login</Link>}

        <p className="text-center text-sm text-gray-500 mt-4">
          <Link to="/login" className="text-lavender-600 hover:underline">Back to Login</Link>
        </p>
      </motion.div>
    </div>
  );
}
