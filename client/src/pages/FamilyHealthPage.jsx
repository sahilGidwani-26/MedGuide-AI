import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Plus, Heart, Activity, Syringe, FileText,
  ChevronRight, AlertTriangle, CheckCircle, X, Loader2,
  Trash2, Edit3, Sparkles, TrendingUp, TrendingDown,
  Minus, Calendar, ArrowLeft, User, Droplets, Thermometer,
  Wind, Scale, Save, RefreshCw
} from 'lucide-react';
import api from '../services/api';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

// ── API helpers ───────────────────────────────────────────────────────────────
const familyAPI = {
  getOverview:       () => api.get('/family/overview'),
  getMembers:        () => api.get('/family'),
  getMember:         (id) => api.get(`/family/${id}`),
  createMember:      (d) => api.post('/family', d),
  updateMember:      (id, d) => api.put(`/family/${id}`, d),
  deleteMember:      (id) => api.delete(`/family/${id}`),
  addVital:          (id, d) => api.post(`/family/${id}/vitals`, d),
  getVitals:         (id, p) => api.get(`/family/${id}/vitals`, { params: p }),
  deleteVital:       (id, vid) => api.delete(`/family/${id}/vitals/${vid}`),
  addVaccination:    (id, d) => api.post(`/family/${id}/vaccinations`, d),
  updateVaccination: (id, vid, d) => api.put(`/family/${id}/vaccinations/${vid}`, d),
  getAISummary:      (id) => api.get(`/family/${id}/ai-summary`),
};

// ── Constants ─────────────────────────────────────────────────────────────────
const RELATIONS = ['self','father','mother','spouse','son','daughter','brother','sister','grandfather','grandmother','other'];
const BLOOD_GROUPS = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];
const VITAL_TYPES = [
  { key: 'bp', label: 'Blood Pressure', unit: 'mmHg', icon: Heart, color: 'text-danger-400', bg: 'bg-danger-400/10', placeholder: '120/80', hint: 'systolic/diastolic' },
  { key: 'sugar', label: 'Blood Sugar', unit: 'mg/dL', icon: Droplets, color: 'text-amber-400', bg: 'bg-amber-400/10', placeholder: '95', hint: 'fasting: 70-100' },
  { key: 'weight', label: 'Weight', unit: 'kg', icon: Scale, color: 'text-blue-400', bg: 'bg-blue-400/10', placeholder: '70', hint: 'in kilograms' },
  { key: 'temperature', label: 'Temperature', unit: '°F', icon: Thermometer, color: 'text-orange-400', bg: 'bg-orange-400/10', placeholder: '98.6', hint: 'normal: 97-99°F' },
  { key: 'heartRate', label: 'Heart Rate', unit: 'bpm', icon: Activity, color: 'text-pink-400', bg: 'bg-pink-400/10', placeholder: '72', hint: 'normal: 60-100 bpm' },
  { key: 'oxygen', label: 'Oxygen Level', unit: '%', icon: Wind, color: 'text-teal-400', bg: 'bg-teal-400/10', placeholder: '98', hint: 'normal: 95-100%' },
];

const RELATION_EMOJI = {
  self:'🧑', father:'👨', mother:'👩', spouse:'💑', son:'👦',
  daughter:'👧', brother:'🧑', sister:'👧', grandfather:'👴', grandmother:'👵', other:'🧑'
};

const STATUS_STYLE = {
  normal:   'text-green-400 bg-green-400/10 border-green-400/30',
  warning:  'text-amber-400 bg-amber-400/10 border-amber-400/30',
  critical: 'text-danger-400 bg-danger-400/10 border-danger-400/30',
};

// ── Main Component ────────────────────────────────────────────────────────────
export default function FamilyHealthPage() {
  const [view, setView] = useState('overview');       // overview | member | vitals | vaccines | ai
  const [members, setMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showAddVital, setShowAddVital] = useState(false);
  const [showAddVaccine, setShowAddVaccine] = useState(false);
  const [vitals, setVitals] = useState([]);
  const [vitalFilter, setVitalFilter] = useState('all');
  const [aiSummary, setAiSummary] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [editingMember, setEditingMember] = useState(false);

  useEffect(() => { fetchOverview(); }, []);

  const fetchOverview = async () => {
    setLoading(true);
    try {
      const { data } = await familyAPI.getOverview();
      setMembers(data.data);
    } catch { toast.error('Failed to load family data'); }
    finally { setLoading(false); }
  };

  const openMember = async (member) => {
    setSelectedMember(member);
    setView('member');
    setAiSummary(null);
    // fetch full member
    try {
      const { data } = await familyAPI.getMember(member._id);
      setSelectedMember(data.data);
    } catch {}
  };

  const fetchVitals = async (type = 'all') => {
    if (!selectedMember) return;
    try {
      const params = type !== 'all' ? { type } : {};
      const { data } = await familyAPI.getVitals(selectedMember._id, params);
      setVitals(data.data);
    } catch {}
  };

  const fetchAISummary = async () => {
    if (!selectedMember) return;
    setAiLoading(true);
    try {
      const { data } = await familyAPI.getAISummary(selectedMember._id);
      setAiSummary(data.data);
    } catch { toast.error('AI summary failed'); }
    finally { setAiLoading(false); }
  };

  const handleDeleteMember = async (id) => {
    if (!confirm('Remove this family member?')) return;
    try {
      await familyAPI.deleteMember(id);
      setMembers(prev => prev.filter(m => m._id !== id));
      if (view === 'member') { setView('overview'); setSelectedMember(null); }
      toast.success('Member removed');
    } catch { toast.error('Failed to remove'); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {view !== 'overview' && (
            <button onClick={() => { setView('overview'); setSelectedMember(null); setAiSummary(null); }}
              className="p-2 rounded-xl hover:bg-white/5 text-slate-400">
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="font-display text-3xl font-bold text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-600 to-rose-500 flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              {view === 'overview' ? 'Family Health' :
               view === 'vitals' ? `${selectedMember?.name}'s Vitals` :
               view === 'vaccines' ? `${selectedMember?.name}'s Vaccinations` :
               view === 'ai' ? 'AI Health Summary' :
               selectedMember?.name || 'Member Profile'}
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              {view === 'overview' ? `${members.length} family members` : selectedMember?.relation}
            </p>
          </div>
        </div>
        {view === 'overview' && (
          <button onClick={() => setShowAddMember(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Member
          </button>
        )}
        {view === 'member' && (
          <div className="flex gap-2">
            <button onClick={fetchAISummary} disabled={aiLoading}
              className="btn-ghost flex items-center gap-2 text-sm">
              {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-violet-400" />}
              AI Summary
            </button>
            <button onClick={() => handleDeleteMember(selectedMember._id)}
              className="p-2 rounded-xl bg-danger-500/20 text-danger-400 hover:bg-danger-500/30">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* ── OVERVIEW ── */}
      {view === 'overview' && (
        <>
          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array(3).fill(0).map((_, i) => <div key={i} className="skeleton h-48 rounded-2xl" />)}
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-20">
              <Users className="w-16 h-16 text-slate-700 mx-auto mb-4" />
              <h3 className="text-slate-400 font-medium mb-2">No family members yet</h3>
              <p className="text-slate-600 text-sm mb-6">Add your family members to track their health</p>
              <button onClick={() => setShowAddMember(true)} className="btn-primary flex items-center gap-2 mx-auto">
                <Plus className="w-4 h-4" /> Add First Member
              </button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {members.map((m, i) => (
                <motion.div key={m._id}
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                  onClick={() => openMember(m)}
                  className={`card cursor-pointer hover:-translate-y-0.5 transition-all duration-300 relative ${m.hasAlert ? 'border-amber-500/30' : ''}`}
                >
                  {m.hasAlert && (
                    <span className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                  )}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-600/30 to-rose-500/30 border border-pink-500/20 flex items-center justify-center text-3xl">
                      {RELATION_EMOJI[m.relation] || '🧑'}
                    </div>
                    <div>
                      <h3 className="text-white font-bold">{m.name}</h3>
                      <p className="text-slate-400 text-sm capitalize">{m.relation}{m.age ? ` • ${m.age} yrs` : ''}</p>
                      {m.bloodGroup && <span className="badge badge-emergency text-xs mt-1">{m.bloodGroup}</span>}
                    </div>
                  </div>

                  {/* Quick vitals */}
                  {Object.keys(m.latestVitals || {}).length > 0 && (
                    <div className="space-y-1.5 mb-3">
                      {Object.entries(m.latestVitals).slice(0, 3).map(([type, vital]) => {
                        const vt = VITAL_TYPES.find(v => v.key === type);
                        return (
                          <div key={type} className="flex items-center justify-between text-xs">
                            <span className="text-slate-500">{vt?.label || type}</span>
                            <span className={`font-semibold ${
                              vital.status === 'critical' ? 'text-danger-400' :
                              vital.status === 'warning' ? 'text-amber-400' : 'text-green-400'
                            }`}>{vital.value} {vt?.unit}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
                    <div className="flex gap-3 text-xs text-slate-600">
                      <span>{m.totalVitals || 0} vitals</span>
                      <span>{m.totalVaccinations || 0} vaccines</span>
                    </div>
                    {m.overdueVaccinations > 0 && (
                      <span className="badge badge-warning text-xs">{m.overdueVaccinations} due</span>
                    )}
                    <ChevronRight className="w-4 h-4 text-slate-600" />
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── MEMBER PROFILE ── */}
      {view === 'member' && selectedMember && (
        <div className="space-y-4">
          {/* Profile card */}
          <div className="card">
            <div className="flex items-start gap-5">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-pink-600/30 to-rose-500/30 border border-pink-500/20 flex items-center justify-center text-4xl flex-shrink-0">
                {RELATION_EMOJI[selectedMember.relation] || '🧑'}
              </div>
              <div className="flex-1">
                <h2 className="text-white font-display font-bold text-2xl">{selectedMember.name}</h2>
                <p className="text-slate-400 capitalize">{selectedMember.relation}
                  {selectedMember.age ? ` • ${selectedMember.age} years old` : ''}
                  {selectedMember.gender ? ` • ${selectedMember.gender}` : ''}
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedMember.bloodGroup && <span className="badge badge-emergency">{selectedMember.bloodGroup}</span>}
                  {(selectedMember.conditions || []).map(c => (
                    <span key={c} className="badge badge-warning text-xs">{c}</span>
                  ))}
                </div>
                {(selectedMember.allergies || []).length > 0 && (
                  <p className="text-slate-500 text-xs mt-2">⚠️ Allergic to: {selectedMember.allergies.join(', ')}</p>
                )}
                {(selectedMember.medications || []).length > 0 && (
                  <p className="text-slate-500 text-xs mt-1">💊 Medications: {selectedMember.medications.join(', ')}</p>
                )}
              </div>
            </div>
          </div>

          {/* AI Summary */}
          {aiSummary && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className={`card border ${
                aiSummary.overallStatus === 'good' ? 'border-green-500/30' :
                aiSummary.overallStatus === 'attention-needed' ? 'border-danger-500/30' :
                'border-amber-500/30'
              }`}>
              <div className="flex items-center gap-3 mb-3">
                <Sparkles className="w-5 h-5 text-violet-400" />
                <h3 className="text-white font-bold">AI Health Summary</h3>
                <span className={`badge text-xs border ml-auto ${
                  aiSummary.overallStatus === 'good' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                  aiSummary.overallStatus === 'attention-needed' ? 'bg-danger-500/20 text-danger-400 border-danger-500/30' :
                  'bg-amber-500/20 text-amber-400 border-amber-500/30'
                }`}>{aiSummary.overallStatus}</span>
              </div>
              <p className="text-slate-300 text-sm mb-3">{aiSummary.summary}</p>
              {aiSummary.alerts?.length > 0 && (
                <div className="space-y-1 mb-3">
                  {aiSummary.alerts.map((a, i) => (
                    <div key={i} className="flex items-start gap-2 text-danger-300 text-sm">
                      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />{a}
                    </div>
                  ))}
                </div>
              )}
              {aiSummary.recommendations?.length > 0 && (
                <div className="space-y-1">
                  {aiSummary.recommendations.map((r, i) => (
                    <div key={i} className="flex items-start gap-2 text-primary-300 text-sm">
                      <CheckCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-primary-500" />{r}
                    </div>
                  ))}
                </div>
              )}
              {aiSummary.nextSteps && (
                <div className="mt-3 p-3 rounded-xl bg-primary-500/10 border border-primary-500/20">
                  <p className="text-primary-300 text-xs font-semibold">Next Step: {aiSummary.nextSteps}</p>
                </div>
              )}
            </motion.div>
          )}

          {/* Action buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: Activity, label: 'Vitals', key: 'vitals', color: 'text-danger-400', bg: 'bg-danger-500/10', action: () => { setView('vitals'); fetchVitals(); } },
              { icon: Syringe, label: 'Vaccines', key: 'vaccines', color: 'text-green-400', bg: 'bg-green-500/10', action: () => setView('vaccines') },
              { icon: FileText, label: 'Reports', key: 'reports', color: 'text-blue-400', bg: 'bg-blue-500/10', action: () => toast('Reports feature — upload from Medical Reports section', { icon: 'ℹ️' }) },
              { icon: Edit3, label: 'Edit', key: 'edit', color: 'text-amber-400', bg: 'bg-amber-500/10', action: () => setEditingMember(true) },
            ].map(btn => (
              <button key={btn.key} onClick={btn.action}
                className={`card-hover flex flex-col items-center gap-2 py-4 ${btn.bg}`}>
                <btn.icon className={`w-6 h-6 ${btn.color}`} />
                <span className="text-slate-300 text-sm font-medium">{btn.label}</span>
              </button>
            ))}
          </div>

          {/* Latest vitals preview */}
          {(selectedMember.vitals || []).length > 0 && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold">Latest Vitals</h3>
                <button onClick={() => { setView('vitals'); fetchVitals(); }}
                  className="text-primary-400 text-xs hover:text-primary-300">View All →</button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {VITAL_TYPES.map(vt => {
                  const v = (selectedMember.vitals || []).find(x => x.type === vt.key);
                  if (!v) return null;
                  return (
                    <div key={vt.key} className={`p-3 rounded-xl ${vt.bg} border border-white/[0.06]`}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <vt.icon className={`w-3.5 h-3.5 ${vt.color}`} />
                        <span className="text-slate-500 text-xs">{vt.label}</span>
                      </div>
                      <p className={`font-bold text-lg ${vt.color}`}>{v.value}</p>
                      <p className="text-slate-600 text-xs">{vt.unit}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── VITALS VIEW ── */}
      {view === 'vitals' && selectedMember && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-1 glass p-1 rounded-xl overflow-x-auto scrollbar-hide">
              {[{ key: 'all', label: 'All' }, ...VITAL_TYPES].map(vt => (
                <button key={vt.key} onClick={() => { setVitalFilter(vt.key); fetchVitals(vt.key); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                    vitalFilter === vt.key ? 'bg-primary-500/30 text-primary-300' : 'text-slate-400 hover:text-slate-200'
                  }`}>
                  {vt.label || 'All'}
                </button>
              ))}
            </div>
            <button onClick={() => setShowAddVital(true)} className="btn-primary flex items-center gap-2 text-sm py-2">
              <Plus className="w-4 h-4" /> Add Vital
            </button>
          </div>

          {vitals.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="w-12 h-12 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-500">No vitals recorded yet</p>
              <button onClick={() => setShowAddVital(true)} className="btn-outline mt-4 text-sm flex items-center gap-2 mx-auto">
                <Plus className="w-4 h-4" /> Record First Vital
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {vitals.map((v, i) => {
                const vt = VITAL_TYPES.find(x => x.key === v.type);
                return (
                  <motion.div key={v._id || i}
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className={`card flex items-center gap-4 border ${STATUS_STYLE[v.status] || STATUS_STYLE.normal}`}>
                    <div className={`w-10 h-10 rounded-xl ${vt?.bg || 'bg-white/5'} flex items-center justify-center flex-shrink-0`}>
                      {vt ? <vt.icon className={`w-5 h-5 ${vt.color}`} /> : <Activity className="w-5 h-5 text-primary-400" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold text-xl ${vt?.color || 'text-white'}`}>{v.value}</span>
                        <span className="text-slate-500 text-sm">{v.unit}</span>
                        {v.status !== 'normal' && (
                          <span className={`badge text-xs border ${STATUS_STYLE[v.status]}`}>{v.status}</span>
                        )}
                      </div>
                      <p className="text-slate-400 text-xs">{vt?.label || v.type}</p>
                      {v.note && <p className="text-slate-600 text-xs mt-0.5">{v.note}</p>}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-slate-500 text-xs">{v.recordedAt ? format(new Date(v.recordedAt), 'dd MMM') : ''}</p>
                      <p className="text-slate-700 text-xs">{v.recordedAt ? format(new Date(v.recordedAt), 'hh:mm a') : ''}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── VACCINATIONS VIEW ── */}
      {view === 'vaccines' && selectedMember && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowAddVaccine(true)} className="btn-primary flex items-center gap-2 text-sm">
              <Plus className="w-4 h-4" /> Add Vaccine
            </button>
          </div>
          {(selectedMember.vaccinations || []).length === 0 ? (
            <div className="text-center py-12">
              <Syringe className="w-12 h-12 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-500">No vaccinations recorded</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(selectedMember.vaccinations || []).map((v, i) => (
                <motion.div key={v._id || i}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="card flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    v.status === 'given' ? 'bg-green-500/20' :
                    v.status === 'overdue' ? 'bg-danger-500/20' :
                    v.status === 'due' ? 'bg-amber-500/20' : 'bg-blue-500/20'
                  }`}>
                    <Syringe className={`w-5 h-5 ${
                      v.status === 'given' ? 'text-green-400' :
                      v.status === 'overdue' ? 'text-danger-400' :
                      v.status === 'due' ? 'text-amber-400' : 'text-blue-400'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-white font-semibold text-sm">{v.name}</h4>
                      {v.doseNumber && <span className="text-slate-500 text-xs">{v.doseNumber}</span>}
                      <span className={`badge text-xs border ml-auto ${
                        v.status === 'given' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                        v.status === 'overdue' ? 'bg-danger-500/20 text-danger-400 border-danger-500/30' :
                        v.status === 'due' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                        'bg-blue-500/20 text-blue-400 border-blue-500/30'
                      }`}>{v.status}</span>
                    </div>
                    {v.givenAt && <p className="text-slate-500 text-xs mt-1">Given: {format(new Date(v.givenAt), 'dd MMM yyyy')}</p>}
                    {v.nextDueAt && <p className="text-amber-400 text-xs">Next due: {format(new Date(v.nextDueAt), 'dd MMM yyyy')}</p>}
                    {v.hospital && <p className="text-slate-600 text-xs">{v.hospital}</p>}
                  </div>
                  {v.status !== 'given' && (
                    <button
                      onClick={async () => {
                        await familyAPI.updateVaccination(selectedMember._id, v._id, { status: 'given', givenAt: new Date() });
                        const { data } = await familyAPI.getMember(selectedMember._id);
                        setSelectedMember(data.data);
                        toast.success('Marked as given!');
                      }}
                      className="text-xs px-3 py-1.5 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-all flex-shrink-0">
                      ✓ Mark Given
                    </button>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── MODALS ── */}
      {/* Add Member Modal */}
      <Modal show={showAddMember} onClose={() => setShowAddMember(false)} title="Add Family Member">
        <AddMemberForm
          onSave={async (formData) => {
            try {
              await familyAPI.createMember(formData);
              await fetchOverview();
              setShowAddMember(false);
              toast.success(`${formData.name} added!`);
            } catch (err) { toast.error(err.response?.data?.message || 'Failed to add'); }
          }}
          onCancel={() => setShowAddMember(false)}
        />
      </Modal>

      {/* Add Vital Modal */}
      <Modal show={showAddVital} onClose={() => setShowAddVital(false)} title={`Add Vital — ${selectedMember?.name}`}>
        <AddVitalForm
          onSave={async (formData) => {
            try {
              await familyAPI.addVital(selectedMember._id, formData);
              await fetchVitals(vitalFilter);
              // refresh member
              const { data } = await familyAPI.getMember(selectedMember._id);
              setSelectedMember(data.data);
              setShowAddVital(false);
              toast.success('Vital recorded!');
            } catch { toast.error('Failed to save'); }
          }}
          onCancel={() => setShowAddVital(false)}
        />
      </Modal>

      {/* Add Vaccine Modal */}
      <Modal show={showAddVaccine} onClose={() => setShowAddVaccine(false)} title={`Add Vaccination — ${selectedMember?.name}`}>
        <AddVaccineForm
          onSave={async (formData) => {
            try {
              await familyAPI.addVaccination(selectedMember._id, formData);
              const { data } = await familyAPI.getMember(selectedMember._id);
              setSelectedMember(data.data);
              setShowAddVaccine(false);
              toast.success('Vaccination recorded!');
            } catch { toast.error('Failed to save'); }
          }}
          onCancel={() => setShowAddVaccine(false)}
        />
      </Modal>

      {/* Edit Member Modal */}
      <Modal show={editingMember} onClose={() => setEditingMember(false)} title={`Edit — ${selectedMember?.name}`}>
        <AddMemberForm
          initial={selectedMember}
          onSave={async (formData) => {
            try {
              const { data } = await familyAPI.updateMember(selectedMember._id, formData);
              setSelectedMember(data.data);
              await fetchOverview();
              setEditingMember(false);
              toast.success('Profile updated!');
            } catch { toast.error('Update failed'); }
          }}
          onCancel={() => setEditingMember(false)}
        />
      </Modal>
    </div>
  );
}

// ── Modal wrapper ─────────────────────────────────────────────────────────────
function Modal({ show, onClose, title, children }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={e => e.target === e.currentTarget && onClose()}>
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="glass-strong w-full max-w-lg p-6 rounded-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display text-xl font-bold text-white">{title}</h3>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 text-slate-400"><X className="w-5 h-5" /></button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Add/Edit Member Form ──────────────────────────────────────────────────────
function AddMemberForm({ onSave, onCancel, initial }) {
  const [form, setForm] = useState({
    name: initial?.name || '',
    relation: initial?.relation || 'father',
    dateOfBirth: initial?.dateOfBirth ? initial.dateOfBirth.split('T')[0] : '',
    gender: initial?.gender || '',
    bloodGroup: initial?.bloodGroup || '',
    conditions: (initial?.conditions || []).join(', '),
    allergies: (initial?.allergies || []).join(', '),
    medications: (initial?.medications || []).join(', '),
    notes: initial?.notes || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!form.name || !form.relation) return toast.error('Name and relation required');
    setSaving(true);
    await onSave({
      ...form,
      conditions: form.conditions ? form.conditions.split(',').map(s => s.trim()).filter(Boolean) : [],
      allergies: form.allergies ? form.allergies.split(',').map(s => s.trim()).filter(Boolean) : [],
      medications: form.medications ? form.medications.split(',').map(s => s.trim()).filter(Boolean) : [],
    });
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-slate-400 text-xs font-medium block mb-1.5">Name *</label>
          <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            placeholder="Full name" className="input-field" />
        </div>
        <div>
          <label className="text-slate-400 text-xs font-medium block mb-1.5">Relation *</label>
          <select value={form.relation} onChange={e => setForm(p => ({ ...p, relation: e.target.value }))}
            className="input-field capitalize">
            {RELATIONS.map(r => <option key={r} value={r} className="capitalize">{r}</option>)}
          </select>
        </div>
        <div>
          <label className="text-slate-400 text-xs font-medium block mb-1.5">Date of Birth</label>
          <input type="date" value={form.dateOfBirth} onChange={e => setForm(p => ({ ...p, dateOfBirth: e.target.value }))}
            className="input-field" />
        </div>
        <div>
          <label className="text-slate-400 text-xs font-medium block mb-1.5">Gender</label>
          <select value={form.gender} onChange={e => setForm(p => ({ ...p, gender: e.target.value }))}
            className="input-field">
            <option value="">Select</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="text-slate-400 text-xs font-medium block mb-1.5">Blood Group</label>
          <select value={form.bloodGroup} onChange={e => setForm(p => ({ ...p, bloodGroup: e.target.value }))}
            className="input-field">
            <option value="">Unknown</option>
            {BLOOD_GROUPS.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="text-slate-400 text-xs font-medium block mb-1.5">Medical Conditions (comma separated)</label>
        <input value={form.conditions} onChange={e => setForm(p => ({ ...p, conditions: e.target.value }))}
          placeholder="Diabetes, Hypertension, Asthma..." className="input-field" />
      </div>
      <div>
        <label className="text-slate-400 text-xs font-medium block mb-1.5">Allergies (comma separated)</label>
        <input value={form.allergies} onChange={e => setForm(p => ({ ...p, allergies: e.target.value }))}
          placeholder="Penicillin, Dust, Pollen..." className="input-field" />
      </div>
      <div>
        <label className="text-slate-400 text-xs font-medium block mb-1.5">Current Medications</label>
        <input value={form.medications} onChange={e => setForm(p => ({ ...p, medications: e.target.value }))}
          placeholder="Metformin 500mg, Aspirin..." className="input-field" />
      </div>
      <div className="flex gap-3 pt-2">
        <button onClick={onCancel} className="btn-ghost flex-1">Cancel</button>
        <button onClick={handleSubmit} disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {initial ? 'Update' : 'Add Member'}
        </button>
      </div>
    </div>
  );
}

// ── Add Vital Form ────────────────────────────────────────────────────────────
function AddVitalForm({ onSave, onCancel }) {
  const [form, setForm] = useState({ type: 'bp', value: '', note: '' });
  const [saving, setSaving] = useState(false);
  const vt = VITAL_TYPES.find(v => v.key === form.type);

  const handleSubmit = async () => {
    if (!form.value) return toast.error('Please enter value');
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-slate-400 text-xs font-medium block mb-2">Vital Type</label>
        <div className="grid grid-cols-3 gap-2">
          {VITAL_TYPES.map(v => (
            <button key={v.key} onClick={() => setForm(p => ({ ...p, type: v.key, value: '' }))}
              className={`p-3 rounded-xl border text-xs font-medium transition-all flex flex-col items-center gap-1 ${
                form.type === v.key ? `${v.bg} border-current ${v.color}` : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
              }`}>
              <v.icon className="w-4 h-4" />
              {v.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="text-slate-400 text-xs font-medium block mb-1.5">
          {vt?.label} ({vt?.unit}) — {vt?.hint}
        </label>
        <input
          value={form.value}
          onChange={e => setForm(p => ({ ...p, value: e.target.value }))}
          placeholder={vt?.placeholder}
          className="input-field text-lg font-semibold"
        />
      </div>
      <div>
        <label className="text-slate-400 text-xs font-medium block mb-1.5">Note (optional)</label>
        <input value={form.note} onChange={e => setForm(p => ({ ...p, note: e.target.value }))}
          placeholder="After meal, before medicine, etc." className="input-field" />
      </div>
      <div className="flex gap-3">
        <button onClick={onCancel} className="btn-ghost flex-1">Cancel</button>
        <button onClick={handleSubmit} disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Vital
        </button>
      </div>
    </div>
  );
}

// ── Add Vaccine Form ──────────────────────────────────────────────────────────
function AddVaccineForm({ onSave, onCancel }) {
  const [form, setForm] = useState({ name: '', doseNumber: '', givenAt: '', nextDueAt: '', hospital: '', doctor: '', status: 'given', notes: '' });
  const [saving, setSaving] = useState(false);

  const commonVaccines = ['BCG', 'Polio OPV', 'Hepatitis B', 'DPT', 'MMR', 'Typhoid', 'Varicella', 'COVID-19', 'Flu', 'Pneumococcal'];

  return (
    <div className="space-y-4">
      <div>
        <label className="text-slate-400 text-xs font-medium block mb-2">Common Vaccines</label>
        <div className="flex flex-wrap gap-1.5">
          {commonVaccines.map(v => (
            <button key={v} onClick={() => setForm(p => ({ ...p, name: v }))}
              className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                form.name === v ? 'bg-primary-500/30 text-primary-300 border-primary-500/40' : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
              }`}>{v}</button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="text-slate-400 text-xs font-medium block mb-1.5">Vaccine Name *</label>
          <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            placeholder="e.g. BCG, Polio, COVID-19..." className="input-field" />
        </div>
        <div>
          <label className="text-slate-400 text-xs font-medium block mb-1.5">Dose Number</label>
          <input value={form.doseNumber} onChange={e => setForm(p => ({ ...p, doseNumber: e.target.value }))}
            placeholder="1st dose, 2nd..." className="input-field" />
        </div>
        <div>
          <label className="text-slate-400 text-xs font-medium block mb-1.5">Status</label>
          <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} className="input-field">
            <option value="given">Given ✓</option>
            <option value="due">Due Soon</option>
            <option value="upcoming">Upcoming</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
        <div>
          <label className="text-slate-400 text-xs font-medium block mb-1.5">Date Given</label>
          <input type="date" value={form.givenAt} onChange={e => setForm(p => ({ ...p, givenAt: e.target.value }))} className="input-field" />
        </div>
        <div>
          <label className="text-slate-400 text-xs font-medium block mb-1.5">Next Due Date</label>
          <input type="date" value={form.nextDueAt} onChange={e => setForm(p => ({ ...p, nextDueAt: e.target.value }))} className="input-field" />
        </div>
        <div className="col-span-2">
          <label className="text-slate-400 text-xs font-medium block mb-1.5">Hospital/Clinic</label>
          <input value={form.hospital} onChange={e => setForm(p => ({ ...p, hospital: e.target.value }))}
            placeholder="Hospital name" className="input-field" />
        </div>
      </div>
      <div className="flex gap-3">
        <button onClick={onCancel} className="btn-ghost flex-1">Cancel</button>
        <button onClick={async () => { setSaving(true); await onSave(form); setSaving(false); }}
          disabled={saving || !form.name}
          className="btn-primary flex-1 flex items-center justify-center gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Vaccine
        </button>
      </div>
    </div>
  );
}