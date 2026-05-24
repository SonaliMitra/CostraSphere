import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('costrasphere_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);

  const persist = useCallback((token, userData) => {
    localStorage.setItem('costrasphere_token', token);
    localStorage.setItem('costrasphere_user', JSON.stringify(userData));
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('costrasphere_token');
    localStorage.removeItem('costrasphere_user');
    setUser(null);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('costrasphere_token');
    if (!token) {
      setLoading(false);
      return;
    }
    api.get('/auth/me')
      .then((res) => {
        setUser(res.data);
        localStorage.setItem('costrasphere_user', JSON.stringify(res.data));
      })
      .catch(() => logout())
      .finally(() => setLoading(false));
  }, [logout]);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    persist(res.data.access_token, res.data.user);
    return res.data;
  };

  const register = async (data) => {
    const res = await api.post('/auth/register', data);
    persist(res.data.access_token, res.data.user);
    return res.data;
  };

  const updateProfile = async (data) => {
    const res = await api.put('/auth/me', data);
    setUser(res.data);
    localStorage.setItem('costrasphere_user', JSON.stringify(res.data));
    return res.data;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile, persist }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
