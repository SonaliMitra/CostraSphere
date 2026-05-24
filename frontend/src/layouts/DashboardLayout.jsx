import { NavLink, Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Watermark from '../components/Watermark';
import Chatbot from '../components/Chatbot';

export default function DashboardLayout({ title, navItems, showChatbot = false }) {
  return (
    <div className="min-h-screen pb-8 relative">
      <Navbar />
      <Watermark />
      <div className="max-w-7xl mx-auto px-4 py-6 relative z-10">
        <div className="flex flex-col lg:flex-row gap-6">
          <aside className="glass p-4 lg:w-64 shrink-0 h-fit lg:sticky lg:top-24">
            <h2 className="text-lg font-bold text-lavender-800 mb-4 px-2">{title}</h2>
            <nav className="space-y-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                      isActive ? 'bg-lavender-600 text-white shadow-glow' : 'text-lavender-700 hover:bg-lavender-50'
                    }`
                  }
                >
                  <item.icon size={18} />
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </aside>
          <main className="flex-1 min-w-0">
            <Outlet />
          </main>
        </div>
      </div>
      {showChatbot && <Chatbot />}
    </div>
  );
}
