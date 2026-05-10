import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users, Activity, FileText, AlertTriangle, TrendingUp,
  ArrowLeft, Shield, UserCheck, UserX, Search, RefreshCw
} from 'lucide-react';
import { adminAPI } from '../services/api';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchAnalytics();
    fetchUsers();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => fetchUsers(), 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchAnalytics = async () => {
    try {
      const { data } = await adminAPI.getAnalytics();
      setAnalytics(data.data);
    } catch { toast.error('Failed to load analytics'); }
    finally { setLoading(false); }
  };

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const { data } = await adminAPI.getUsers({ search, limit: 20 });
      setUsers(data.data);
    } catch {}
    finally { setUsersLoading(false); }
  };

  const toggleUser = async (id) => {
    try {
      const { data } = await adminAPI.toggleUser(id);
      setUsers(prev => prev.map(u => u._id === id ? { ...u, isActive: data.data.isActive } : u));
      toast.success('User status updated');
    } catch { toast.error('Failed to update user'); }
  };

  const statCards = analytics ? [
    { label: 'Total Users', value: analytics.stats.totalUsers, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10', delta: `+${analytics.stats.newUsers} this week` },
    { label: 'Symptom Checks', value: analytics.stats.totalSymptoms, icon: Activity, color: 'text-primary-400', bg: 'bg-primary-500/10', delta: 'Total analyses' },
    { label: 'Medical Reports', value: analytics.stats.totalReports, icon: FileText, color: 'text-violet-400', bg: 'bg-violet-500/10', delta: 'Files uploaded' },
    { label: 'Emergency Alerts', value: analytics.stats.emergencyAlerts, icon: AlertTriangle, color: 'text-danger-400', bg: 'bg-danger-500/10', delta: 'Critical cases' },
  ] : [];

  return (
    <div className="min-h-screen bg-slate-950 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="p-2 rounded-xl hover:bg-white/5 text-slate-400">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-display text-3xl font-bold text-white flex items-center gap-3">
              <Shield className="w-8 h-8 text-violet-400" />
              Admin Dashboard
            </h1>
            <p className="text-slate-400 text-sm">Manage users, monitor activity, view analytics</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 glass p-1 rounded-xl w-fit">
          {[{ value: 'overview', label: 'Overview' }, { value: 'users', label: 'Users' }].map(tab => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.value ? 'bg-violet-500/30 text-violet-300' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <>
            {/* Stat cards */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {loading ? (
                Array(4).fill(0).map((_, i) => <div key={i} className="skeleton h-32 rounded-2xl" />)
              ) : (
                statCards.map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="card"
                  >
                    <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
                      <stat.icon className={`w-5 h-5 ${stat.color}`} />
                    </div>
                    <p className="font-display text-3xl font-extrabold text-white">{stat.value}</p>
                    <p className="text-slate-400 text-sm mt-1">{stat.label}</p>
                    <p className="text-xs text-slate-600 mt-1">{stat.delta}</p>
                  </motion.div>
                ))
              )}
            </div>

            {/* Severity distribution */}
            {analytics?.severityDistribution && (
              <div className="card">
                <h3 className="font-display font-bold text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary-400" /> Symptom Severity Distribution
                </h3>
                <div className="space-y-3">
                  {analytics.severityDistribution.map(item => {
                    const total = analytics.stats.totalSymptoms || 1;
                    const pct = Math.round((item.count / total) * 100);
                    const colors = {
                      low: 'bg-green-500',
                      medium: 'bg-amber-500',
                      high: 'bg-orange-500',
                      critical: 'bg-danger-500'
                    };
                    return (
                      <div key={item._id} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-300 capitalize">{item._id || 'Unknown'}</span>
                          <span className="text-slate-500">{item.count} ({pct}%)</span>
                        </div>
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.8, delay: 0.3 }}
                            className={`h-full rounded-full ${colors[item._id] || 'bg-slate-500'}`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'users' && (
          <div className="card">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h3 className="font-display font-bold text-white text-xl">All Users</h3>
              <div className="flex gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search users..."
                    className="input-field pl-10 py-2 text-sm"
                  />
                </div>
                <button onClick={fetchUsers} className="btn-ghost py-2 px-3">
                  <RefreshCw className={`w-4 h-4 ${usersLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {usersLoading ? (
              <div className="space-y-3">
                {Array(5).fill(0).map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)}
              </div>
            ) : (
              <div className="space-y-2">
                {users.map((u, i) => (
                  <motion.div
                    key={u._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600/30 to-teal-500/30 flex items-center justify-center font-bold text-primary-300 flex-shrink-0">
                      {u.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-sm truncate">{u.name}</p>
                      <p className="text-slate-500 text-xs truncate">{u.email}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`badge text-xs ${u.role === 'admin' ? 'badge-warning' : 'badge-info'}`}>{u.role}</span>
                      <span className={`badge text-xs ${u.isActive ? 'badge-success' : 'bg-slate-700/50 text-slate-500'}`}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <button
                        onClick={() => toggleUser(u._id)}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                          u.isActive ? 'bg-danger-500/20 text-danger-400 hover:bg-danger-500/30' : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                        }`}
                        title={u.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {u.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                      </button>
                    </div>
                  </motion.div>
                ))}
                {users.length === 0 && (
                  <p className="text-center text-slate-600 py-8">No users found</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
