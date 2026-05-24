import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSkeleton from './LoadingSkeleton';

export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSkeleton fullPage />;

  if (!user) return <Navigate to="/login" replace />;

  if (roles && !roles.includes(user.role)) {
    const dashboard = user.role === 'developer' ? '/developer' : user.role === 'company' ? '/company' : '/dashboard';
    return <Navigate to={dashboard} replace />;
  }

  return children;
}
