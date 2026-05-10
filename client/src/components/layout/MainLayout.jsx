import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Activity, MapPin, Map, MessageCircle,
  FileText, User, Stethoscope, AlertTriangle, Menu, X,
  LogOut, Bell, ChevronRight, Shield
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/symptom-checker', icon: Activity, label: 'Symptom Checker' },
  { path: '/nearby-hospitals', icon: MapPin, label: 'Nearby Hospitals' },
  { path: '/live-map', icon: Map, label: 'Live Map' },
  { path: '/chat', icon: MessageCircle, label: 'AI Assistant' },
  { path: '/doctors', icon: Stethoscope, label: 'Find Doctors' },
  { path: '/reports', icon: FileText, label: 'Medical Reports' },
  { path: '/profile', icon: User, label: 'My Profile' },
];

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => { await logout(); navigate('/'); };

  const Sidebar = ({ mobile = false }) => (
    <div className={`flex flex-col h-full ${mobile ? 'p-4' : 'p-6'}`}>
      {/* Logo */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-teal-400 flex items-center justify-center shadow-lg shadow-primary-500/30">
          <Activity className="w-5 h-5 text-white" strokeWidth={2.5} />
        </div>
        <div>
          <h1 className="font-display font-bold text-white text-lg leading-none">MedGuide</h1>
          <span className="text-primary-400 text-xs font-medium">AI Healthcare</span>
        </div>
      </div>

      {/* Emergency button */}
      <button
        onClick={() => navigate('/emergency')}
        className="flex items-center gap-3 mb-6 px-4 py-3 rounded-xl bg-danger-600/20 border border-danger-500/30 hover:bg-danger-600/30 transition-all group"
      >
        <div className="w-8 h-8 rounded-lg bg-danger-500/30 flex items-center justify-center">
          <AlertTriangle className="w-4 h-4 text-danger-400" />
        </div>
        <span className="text-danger-300 font-semibold text-sm">Emergency Mode</span>
        <ChevronRight className="w-4 h-4 text-danger-400 ml-auto group-hover:translate-x-0.5 transition-transform" />
      </button>

      {/* Nav */}
      <nav className="flex-1 space-y-1">
        {navItems.map(({ path, icon: Icon, label }) => (
          <NavLink
            key={path}
            to={path}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group
              ${isActive
                ? 'bg-primary-500/20 text-primary-300 border border-primary-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-primary-400' : 'group-hover:text-slate-300'}`} />
                {label}
              </>
            )}
          </NavLink>
        ))}
        {user?.role === 'admin' && (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all mt-2
              ${isActive ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`
            }
          >
            <Shield className="w-4 h-4" /> Admin Panel
          </NavLink>
        )}
      </nav>

      {/* User */}
      <div className="border-t border-white/[0.06] pt-4 mt-4">
        <div className="flex items-center gap-3 px-2 mb-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-600 to-teal-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-semibold truncate">{user?.name}</p>
            <p className="text-slate-500 text-xs truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm text-slate-400 hover:text-danger-400 hover:bg-danger-500/10 transition-all"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 flex-shrink-0 border-r border-white/[0.06] bg-slate-950/80">
        <Sidebar />
      </aside>

      {/* Mobile overlay sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 z-50 w-72 bg-slate-900 border-r border-white/[0.08]"
            >
              <div className="flex justify-end p-4">
                <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-lg hover:bg-white/5 text-slate-400">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <Sidebar mobile />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile topbar */}
        <header className="lg:hidden flex items-center justify-between px-4 h-16 border-b border-white/[0.06] bg-slate-950/80 backdrop-blur-xl flex-shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-xl hover:bg-white/5 text-slate-400">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary-400" />
            <span className="font-display font-bold text-white">MedGuide AI</span>
          </div>
          <button
            onClick={() => navigate('/emergency')}
            className="p-2 rounded-xl bg-danger-500/20 text-danger-400 hover:bg-danger-500/30"
          >
            <AlertTriangle className="w-5 h-5" />
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="min-h-full p-4 lg:p-8 max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
