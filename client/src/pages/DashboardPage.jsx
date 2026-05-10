import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Activity, FileText, MapPin, AlertTriangle, TrendingUp,
  ArrowRight, Clock, Heart, ChevronRight, Zap
} from 'lucide-react';
import { userAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';

const severityConfig = {
  low: { color: 'text-green-400', bg: 'bg-green-400/10', border: 'border-green-400/20', label: 'Low' },
  medium: { color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20', label: 'Medium' },
  high: { color: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-400/20', label: 'High' },
  critical: { color: 'text-danger-400', bg: 'bg-danger-400/10', border: 'border-danger-400/20', label: 'Critical' },
};

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    userAPI.getDashboard()
      .then(res => setData(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const stats = data ? [
    { label: 'Symptom Checks', value: data.stats.totalSymptomChecks, icon: Activity, color: 'text-primary-400', bg: 'bg-primary-500/10', delta: '+2 this week' },
    { label: 'Medical Reports', value: data.stats.totalReports, icon: FileText, color: 'text-blue-400', bg: 'bg-blue-500/10', delta: 'Uploaded' },
    { label: 'Saved Hospitals', value: data.stats.savedHospitals, icon: MapPin, color: 'text-amber-400', bg: 'bg-amber-500/10', delta: 'Nearby' },
    { label: 'Emergency Alerts', value: data.stats.emergencyAlerts, icon: AlertTriangle, color: 'text-danger-400', bg: 'bg-danger-500/10', delta: 'Total' },
  ] : Array(4).fill(null);

  const quickActions = [
    { label: 'Check Symptoms', icon: Activity, path: '/symptom-checker', color: 'from-primary-600 to-teal-500', desc: 'AI-powered analysis' },
    { label: 'Find Hospitals', icon: MapPin, path: '/nearby-hospitals', color: 'from-blue-600 to-cyan-500', desc: 'Near your location' },
    { label: 'AI Assistant', icon: Zap, path: '/chat', color: 'from-violet-600 to-purple-500', desc: 'Chat with MedGuide' },
    { label: 'Emergency', icon: AlertTriangle, path: '/emergency', color: 'from-danger-600 to-rose-500', desc: 'Instant help' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">
            Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'},&nbsp;
            <span className="gradient-text">{user?.name?.split(' ')[0]}</span> 👋
          </h1>
          <p className="text-slate-400 mt-1 text-sm">Here's your health overview for today</p>
        </div>
        <div className="flex items-center gap-3 glass px-4 py-3 rounded-xl">
          <Heart className="w-5 h-5 text-danger-400" />
          <div>
            <p className="text-xs text-slate-500">Health Score</p>
            <p className="text-white font-bold text-lg leading-none">{user?.healthScore || 100}<span className="text-slate-500 text-sm">/100</span></p>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="card"
          >
            {loading || !stat ? (
              <div className="space-y-3">
                <div className="skeleton w-10 h-10 rounded-xl" />
                <div className="skeleton w-16 h-7 rounded-lg" />
                <div className="skeleton w-24 h-4 rounded" />
              </div>
            ) : (
              <>
                <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <p className="font-display text-3xl font-extrabold text-white">{stat.value}</p>
                <p className="text-slate-400 text-sm mt-1">{stat.label}</p>
                <p className="text-xs text-slate-600 mt-1">{stat.delta}</p>
              </>
            )}
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="section-title mb-4">Quick Actions</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, i) => (
            <motion.button
              key={action.label}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + i * 0.06 }}
              onClick={() => navigate(action.path)}
              className="card-hover text-left relative overflow-hidden group"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-4 shadow-lg`}>
                <action.icon className="w-6 h-6 text-white" />
              </div>
              <p className="text-white font-semibold">{action.label}</p>
              <p className="text-slate-500 text-xs mt-1">{action.desc}</p>
              <ChevronRight className="absolute top-4 right-4 w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
            </motion.button>
          ))}
        </div>
      </div>

      {/* Recent Activity + Saved Hospitals */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Symptoms */}
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-display font-bold text-white">Recent Analyses</h3>
            <button onClick={() => navigate('/symptom-checker')} className="text-primary-400 hover:text-primary-300 text-sm flex items-center gap-1">
              View All <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          {loading ? (
            <div className="space-y-3">
              {Array(3).fill(0).map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)}
            </div>
          ) : data?.recentSymptoms?.length > 0 ? (
            <div className="space-y-3">
              {data.recentSymptoms.map(s => {
                const cfg = severityConfig[s.aiAnalysis?.severityLevel] || severityConfig.low;
                return (
                  <div key={s._id} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                    <div className={`w-2 h-2 rounded-full mt-2 ${cfg.bg.replace('bg-', 'bg-')} flex-shrink-0`} style={{ background: cfg.color.replace('text-', '') }} />
                    <div className="min-w-0 flex-1">
                      <p className="text-slate-200 text-sm truncate">{s.symptoms}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`badge text-xs ${cfg.bg} ${cfg.color} border ${cfg.border}`}>{cfg.label}</span>
                        <span className="text-slate-600 text-xs flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDistanceToNow(new Date(s.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Activity className="w-10 h-10 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">No symptom checks yet</p>
              <button onClick={() => navigate('/symptom-checker')} className="btn-outline text-sm py-2 px-4 mt-3">
                Check Symptoms
              </button>
            </div>
          )}
        </div>

        {/* Saved Hospitals */}
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-display font-bold text-white">Saved Hospitals</h3>
            <button onClick={() => navigate('/nearby-hospitals')} className="text-primary-400 hover:text-primary-300 text-sm flex items-center gap-1">
              Find More <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          {loading ? (
            <div className="space-y-3">
              {Array(3).fill(0).map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)}
            </div>
          ) : data?.savedHospitals?.length > 0 ? (
            <div className="space-y-3">
              {data.savedHospitals.map((h, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02]">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-slate-200 text-sm font-medium truncate">{h.name}</p>
                    <p className="text-slate-500 text-xs truncate">{h.address}</p>
                    {h.distance && <p className="text-primary-400 text-xs mt-0.5">{h.distance} away</p>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <MapPin className="w-10 h-10 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">No saved hospitals yet</p>
              <button onClick={() => navigate('/nearby-hospitals')} className="btn-outline text-sm py-2 px-4 mt-3">
                Find Hospitals
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Health tip */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="glass border border-primary-500/20 p-5 rounded-2xl flex items-start gap-4"
      >
        <div className="w-10 h-10 rounded-xl bg-primary-500/20 flex items-center justify-center flex-shrink-0">
          <TrendingUp className="w-5 h-5 text-primary-400" />
        </div>
        <div>
          <p className="text-white font-semibold text-sm mb-1">💡 Daily Health Tip</p>
          <p className="text-slate-400 text-sm">Drink at least 8 glasses of water daily and take a 30-minute walk. Regular hydration and physical activity are key to maintaining good health.</p>
        </div>
      </motion.div>
    </div>
  );
}
