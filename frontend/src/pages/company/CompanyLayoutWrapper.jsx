import { LayoutDashboard, Users, MapPin, DollarSign, CheckCircle, Building2 } from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';

const NAV = [
  { to: '/company', label: 'Admin Dashboard', icon: LayoutDashboard, end: true },
  { to: '/company/workers', label: 'Worker Analytics', icon: Users },
  { to: '/company/deployment', label: 'Deployment Planning', icon: MapPin },
  { to: '/company/revenue', label: 'Revenue Analytics', icon: DollarSign },
  { to: '/company/approvals', label: 'Project Approvals', icon: CheckCircle },
  { to: '/company/profile', label: 'Company Profile', icon: Building2 },
];

export default function CompanyLayoutWrapper() {
  return <DashboardLayout title="Company Admin" navItems={NAV} />;
}
