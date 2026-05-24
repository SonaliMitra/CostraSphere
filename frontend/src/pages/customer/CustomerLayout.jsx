import { LayoutDashboard, PlusCircle, Map, FileText, FolderOpen, User } from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { ProjectProvider } from '../../context/ProjectContext';

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/dashboard/create', label: 'Project Creator', icon: PlusCircle },
  { to: '/dashboard/map', label: 'Map View', icon: Map },
  { to: '/dashboard/reports', label: 'Reports', icon: FileText },
  { to: '/dashboard/projects', label: 'Saved Projects', icon: FolderOpen },
  { to: '/dashboard/profile', label: 'Profile', icon: User },
];

export default function CustomerLayout() {
  return (
    <ProjectProvider>
      <DashboardLayout title="Customer Portal" navItems={NAV} showChatbot />
    </ProjectProvider>
  );
}
