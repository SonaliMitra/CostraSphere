import { Link, useNavigate } from 'react-router-dom';
import { LogOut, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/images/logo.png';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const dashPath = user?.role === 'developer' ? '/developer' : user?.role === 'company' ? '/company' : '/dashboard';

  return (
    <nav className="glass sticky top-0 z-50 mx-4 mt-4 px-6 py-3 flex items-center justify-between">
      <Link to={dashPath} className="flex items-center gap-3">
        <img src={logo} alt="CostraSphere AI" className="h-10 object-contain" />
        <span className="font-bold text-lavender-800 text-lg hidden sm:block">CostraSphere AI</span>
      </Link>
      {user && (
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-lavender-700">
            <User size={16} />
            <span className="hidden md:inline">{user.full_name}</span>
            <span className="px-2 py-0.5 bg-lavender-100 rounded-full text-xs capitalize">{user.role}</span>
          </div>
          <button onClick={handleLogout} className="btn-secondary flex items-center gap-2 text-sm py-2 px-4">
            <LogOut size={16} /> Logout
          </button>
        </div>
      )}
    </nav>
  );
}
