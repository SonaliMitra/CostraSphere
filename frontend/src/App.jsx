import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingSkeleton from './components/LoadingSkeleton';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import CustomerLayout from './pages/customer/CustomerLayout';
import CustomerHome from './pages/customer/CustomerHome';
import ProjectCreator from './pages/customer/ProjectCreator';
import MapView from './pages/customer/MapView';
import Reports from './pages/customer/Reports';
import SavedProjects from './pages/customer/SavedProjects';
import CustomerProfile from './pages/customer/CustomerProfile';
import CompanyLayoutWrapper from './pages/company/CompanyLayoutWrapper';
import CompanyHome from './pages/company/CompanyHome';
import WorkerAnalytics from './pages/company/WorkerAnalytics';
import DeploymentPlanning from './pages/company/DeploymentPlanning';
import RevenueAnalytics from './pages/company/RevenueAnalytics';
import ProjectApprovals from './pages/company/ProjectApprovals';
import CompanyProfile from './pages/company/CompanyProfile';
import DeveloperDashboard from './pages/DeveloperDashboard';
import { useAuth } from './context/AuthContext';

function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSkeleton fullPage />;
  if (!user) return <Home />;
  if (user.role === 'developer') return <Navigate to="/developer" replace />;
  if (user.role === 'company') return <Navigate to="/company" replace />;
  return <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      <Route path="/dashboard" element={<ProtectedRoute roles={['customer']}><CustomerLayout /></ProtectedRoute>}>
        <Route index element={<CustomerHome />} />
        <Route path="create" element={<ProjectCreator />} />
        <Route path="map" element={<MapView />} />
        <Route path="reports" element={<Reports />} />
        <Route path="projects" element={<SavedProjects />} />
        <Route path="profile" element={<CustomerProfile />} />
      </Route>

      <Route path="/reports" element={<ProtectedRoute roles={['customer']}><CustomerLayout><Reports /></CustomerLayout></ProtectedRoute>} />

      <Route path="/company" element={<ProtectedRoute roles={['company', 'developer']}><CompanyLayoutWrapper /></ProtectedRoute>}>
        <Route index element={<CompanyHome />} />
        <Route path="workers" element={<WorkerAnalytics />} />
        <Route path="deployment" element={<DeploymentPlanning />} />
        <Route path="revenue" element={<RevenueAnalytics />} />
        <Route path="approvals" element={<ProjectApprovals />} />
        <Route path="profile" element={<CompanyProfile />} />
      </Route>

      <Route path="/developer/*" element={<ProtectedRoute roles={['developer']}><DeveloperDashboard /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
