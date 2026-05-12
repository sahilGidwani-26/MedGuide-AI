import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Activity, MapPin, Map, MessageCircle,
  FileText, User, Stethoscope, AlertTriangle, Menu, X,
  LogOut, ChevronRight, Shield, Pill, HeartPulse,
  ChevronLeft,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { path: '/dashboard',        icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/symptom-checker',  icon: Activity,        label: 'Symptom Checker' },
  { path: '/nearby-hospitals', icon: MapPin,           label: 'Nearby Hospitals' },
  { path: '/live-map',         icon: Map,              label: 'Live Map' },
  { path: '/chat',             icon: MessageCircle,    label: 'AI Assistant' },
  { path: '/doctors',          icon: Stethoscope,      label: 'Find Doctors' },
  { path: '/reports',          icon: FileText,         label: 'Medical Reports' },
  { path: '/medicine-scanner', icon: Pill,             label: 'Medicine Scanner' },
  { path: '/first-aid',        icon: HeartPulse,       label: 'First Aid Guide' },
  { path: '/profile',          icon: User,             label: 'My Profile' },
];

export default function MainLayout() {
  const [sidebarOpen,     setSidebarOpen]     = useState(false);
  const [collapsed,       setCollapsed]       = useState(false); // desktop collapse
  const { user, logout } = useAuth();
  const navigate          = useNavigate();

  const handleLogout = async () => { await logout(); navigate('/'); };

  /* ── Shared nav content ─────────────────────────────────────── */
  const NavContent = ({ mobile = false, onClose }) => (
    <div className={`flex flex-col h-full ${mobile ? 'p-4' : collapsed ? 'p-3' : 'p-5'}`}>

      {/* Logo row */}
      <div className={`flex items-center mb-6 ${collapsed && !mobile ? 'justify-center' : 'gap-3'}`}>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-teal-400 flex items-center justify-center shadow-lg shadow-primary-500/30 flex-shrink-0">
          <Activity className="w-4 h-4 text-white" strokeWidth={2.5} />
        </div>
        {(!collapsed || mobile) && (
          <div>
            <h1 className="font-display font-bold text-white text-base leading-none">MedGuide</h1>
            <span className="text-primary-400 text-xs font-medium">AI Healthcare</span>
          </div>
        )}
        {/* Collapse toggle — desktop only */}
        {!mobile && (
          <button
            onClick={() => setCollapsed(c => !c)}
            className={`ml-auto p-1 rounded-lg hover:bg-white/5 text-slate-500 hover:text-slate-300 transition-all ${collapsed ? 'mx-auto mt-1' : ''}`}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <ChevronLeft className={`w-4 h-4 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>

      {/* Emergency button */}
      <button
        onClick={() => { navigate('/emergency'); onClose?.(); }}
        className={`flex items-center mb-5 rounded-xl bg-danger-600/20 border border-danger-500/30 hover:bg-danger-600/30 transition-all group
          ${collapsed && !mobile ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5'}`}
        title="Emergency Mode"
      >
        <div className="w-7 h-7 rounded-lg bg-danger-500/30 flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="w-3.5 h-3.5 text-danger-400" />
        </div>
        {(!collapsed || mobile) && (
          <>
            <span className="text-danger-300 font-semibold text-sm">Emergency Mode</span>
            <ChevronRight className="w-3.5 h-3.5 text-danger-400 ml-auto group-hover:translate-x-0.5 transition-transform" />
          </>
        )}
      </button>

      {/* ── Nav items — scrollable ───────────────────────────── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden space-y-0.5 pr-0.5
        scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {navItems.map(({ path, icon: Icon, label }) => (
          <NavLink
            key={path}
            to={path}
            onClick={() => onClose?.()}
            title={collapsed && !mobile ? label : undefined}
            className={({ isActive }) =>
              `flex items-center rounded-xl text-sm font-medium transition-all group
              ${collapsed && !mobile ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5'}
              ${isActive
                ? 'bg-primary-500/20 text-primary-300 border border-primary-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-primary-400' : 'group-hover:text-slate-300'}`} />
                {(!collapsed || mobile) && <span className="truncate">{label}</span>}
              </>
            )}
          </NavLink>
        ))}

        {user?.role === 'admin' && (
          <NavLink
            to="/admin"
            onClick={() => onClose?.()}
            title={collapsed && !mobile ? 'Admin Panel' : undefined}
            className={({ isActive }) =>
              `flex items-center rounded-xl text-sm font-medium transition-all mt-1
              ${collapsed && !mobile ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5'}
              ${isActive
                ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
              }`
            }
          >
            <Shield className="w-4 h-4 flex-shrink-0" />
            {(!collapsed || mobile) && <span>Admin Panel</span>}
          </NavLink>
        )}
      </nav>

      {/* ── User section ─────────────────────────────────────── */}
      <div className="border-t border-white/[0.06] pt-3 mt-3 flex-shrink-0">
        {(!collapsed || mobile) ? (
          <>
            <div className="flex items-center gap-2.5 px-2 mb-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-600 to-teal-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-white text-sm font-semibold truncate">{user?.name}</p>
                <p className="text-slate-500 text-xs truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-sm text-slate-400 hover:text-danger-400 hover:bg-danger-500/10 transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-600 to-teal-500 flex items-center justify-center text-white font-bold text-xs">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-2 rounded-xl text-slate-400 hover:text-danger-400 hover:bg-danger-500/10 transition-all"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950">

      {/* ── Desktop Sidebar ──────────────────────────────────── */}
      <aside
        className={`hidden lg:flex flex-col flex-shrink-0 border-r border-white/[0.06] bg-slate-950/80 transition-all duration-300 ${
          collapsed ? 'w-[64px]' : 'w-60'
        }`}
      >
        <NavContent />
      </aside>

      {/* ── Mobile overlay sidebar ───────────────────────────── */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 z-50 w-64 bg-slate-900 border-r border-white/[0.08] flex flex-col"
            >
              <div className="flex justify-end p-3 flex-shrink-0">
                <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-lg hover:bg-white/5 text-slate-400">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-hidden">
                <NavContent mobile onClose={() => setSidebarOpen(false)} />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Main content ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Mobile topbar */}
        <header className="lg:hidden flex items-center justify-between px-4 h-14 border-b border-white/[0.06] bg-slate-950/80 backdrop-blur-xl flex-shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-xl hover:bg-white/5 text-slate-400">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary-400" />
            <span className="font-display font-bold text-white text-sm">MedGuide AI</span>
          </div>
          <button
            onClick={() => navigate('/emergency')}
            className="p-2 rounded-xl bg-danger-500/20 text-danger-400 hover:bg-danger-500/30"
          >
            <AlertTriangle className="w-4 h-4" />
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