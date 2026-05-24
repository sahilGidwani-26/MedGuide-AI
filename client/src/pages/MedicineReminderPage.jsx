// src/pages/MedicineReminderPage.jsx
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Pill, Plus, Bell, BellOff, Trash2, CheckCircle2,
  XCircle, Clock, Edit3, BarChart2, Flame, AlertCircle,
  ChevronDown, ChevronUp, FlaskConical, X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { medicineReminderAPI } from '../services/api';
import { useMedicineNotifications } from '../hooks/useMedicineNotifications';

// ─── helpers ──────────────────────────────────────────────────────────────────
const FREQ_LABELS = {
  once_daily:    'Ek baar roz',
  twice_daily:   'Do baar roz',
  thrice_daily:  'Teen baar roz',
  every_4_hours: 'Har 4 ghante',
  every_6_hours: 'Har 6 ghante',
  every_8_hours: 'Har 8 ghante',
  weekly:        'Hafte mein ek baar',
  custom:        'Custom',
};

const DEFAULT_TIMES_BY_FREQ = {
  once_daily:    ['08:00'],
  twice_daily:   ['08:00', '20:00'],
  thrice_daily:  ['08:00', '14:00', '20:00'],
  every_4_hours: ['06:00', '10:00', '14:00', '18:00', '22:00'],
  every_6_hours: ['06:00', '12:00', '18:00', '00:00'],
  every_8_hours: ['07:00', '15:00', '23:00'],
  weekly:        ['09:00'],
  custom:        ['08:00'],
};

const COLORS = [
  '#15b38a','#3b82f6','#8b5cf6','#f59e0b',
  '#ef4444','#ec4899','#06b6d4','#84cc16',
];

const fmt12 = (t) => {
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2,'0')} ${ampm}`;
};

// ─── Add / Edit Modal ─────────────────────────────────────────────────────────
function ReminderModal({ reminder, onClose, onSave }) {
  const isEdit = Boolean(reminder?._id);
  const [form, setForm] = useState({
    medicineName:         reminder?.medicineName        || '',
    dosage:               reminder?.dosage              || '',
    frequency:            reminder?.frequency           || 'once_daily',
    times:                reminder?.times               || ['08:00'],
    color:                reminder?.color               || '#15b38a',
    instructions:         reminder?.instructions        || '',
    notificationsEnabled: reminder?.notificationsEnabled ?? true,
    startDate: reminder?.startDate
      ? new Date(reminder.startDate).toISOString().slice(0,10)
      : new Date().toISOString().slice(0,10),
    endDate: reminder?.endDate
      ? new Date(reminder.endDate).toISOString().slice(0,10)
      : '',
  });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const onFreqChange = (freq) => {
    set('frequency', freq);
    set('times', DEFAULT_TIMES_BY_FREQ[freq] || ['08:00']);
  };

  const updateTime = (i, val) => {
    const t = [...form.times];
    t[i] = val;
    set('times', t);
  };

  const addTime    = () => set('times', [...form.times, '12:00']);
  const removeTime = (i) => set('times', form.times.filter((_, idx) => idx !== i));

  const handleSubmit = async () => {
    if (!form.medicineName.trim()) return toast.error('Medicine name daalna zaroori hai');
    if (!form.times.length)        return toast.error('Kam se kam ek time daalna zaroori hai');
    setSaving(true);
    try {
      const payload = {
        ...form,
        startDate: form.startDate || undefined,
        endDate:   form.endDate   || undefined,
      };
      let data;
      if (isEdit) {
        const res = await medicineReminderAPI.update(reminder._id, payload);
        data = res.data.data;
        toast.success('Reminder update ho gaya!');
      } else {
        const res = await medicineReminderAPI.create(payload);
        data = res.data.data;
        toast.success('Reminder add ho gaya! 💊');
      }
      onSave(data, isEdit);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Kuch gadbad hui');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg bg-slate-900 rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
          <h2 className="text-white font-bold text-lg flex items-center gap-2">
            <Pill className="w-5 h-5 text-primary-400" />
            {isEdit ? 'Reminder Edit Karein' : 'Naya Reminder Add Karein'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Medicine Name */}
          <div>
            <label className="text-slate-400 text-xs mb-1.5 block">Medicine ka naam *</label>
            <input
              value={form.medicineName}
              onChange={e => set('medicineName', e.target.value)}
              placeholder="e.g. Paracetamol, Metformin..."
              className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-primary-500/50"
            />
          </div>

          {/* Dosage */}
          <div>
            <label className="text-slate-400 text-xs mb-1.5 block">Dosage (optional)</label>
            <input
              value={form.dosage}
              onChange={e => set('dosage', e.target.value)}
              placeholder="e.g. 500mg, 1 tablet, 2 capsule"
              className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-primary-500/50"
            />
          </div>

          {/* Frequency */}
          <div>
            <label className="text-slate-400 text-xs mb-1.5 block">Kitni baar leni hai?</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(FREQ_LABELS).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => onFreqChange(key)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all text-left
                    ${form.frequency === key
                      ? 'bg-primary-500/20 border-primary-500/40 text-primary-300'
                      : 'bg-slate-800 border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Times */}
          <div>
            <label className="text-slate-400 text-xs mb-1.5 block">
              Reminder time(s)
            </label>
            <div className="space-y-2">
              {form.times.map((t, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="time"
                    value={t}
                    onChange={e => updateTime(i, e.target.value)}
                    className="flex-1 bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-primary-500/50"
                  />
                  {form.times.length > 1 && (
                    <button onClick={() => removeTime(i)} className="p-2 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              {form.frequency === 'custom' && (
                <button onClick={addTime} className="text-primary-400 text-xs hover:text-primary-300 flex items-center gap-1">
                  <Plus className="w-3.5 h-3.5" /> Aur time add karein
                </button>
              )}
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 text-xs mb-1.5 block">Shuru ki tarikh</label>
              <input type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)}
                className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-primary-500/50" />
            </div>
            <div>
              <label className="text-slate-400 text-xs mb-1.5 block">Khatam ki tarikh (optional)</label>
              <input type="date" value={form.endDate} onChange={e => set('endDate', e.target.value)}
                className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-primary-500/50" />
            </div>
          </div>

          {/* Instructions */}
          <div>
            <label className="text-slate-400 text-xs mb-1.5 block">Instructions (optional)</label>
            <input
              value={form.instructions}
              onChange={e => set('instructions', e.target.value)}
              placeholder="e.g. Khana khane ke baad, garm paani ke saath"
              className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-primary-500/50"
            />
          </div>

          {/* Color */}
          <div>
            <label className="text-slate-400 text-xs mb-1.5 block">Color</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => set('color', c)}
                  style={{ background: c }}
                  className={`w-7 h-7 rounded-full transition-all ${form.color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110' : ''}`}
                />
              ))}
            </div>
          </div>

          {/* Notifications toggle */}
          <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl border border-white/[0.06]">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary-400" />
              <span className="text-slate-300 text-sm">Browser notification bhejo</span>
            </div>
            <button
              onClick={() => set('notificationsEnabled', !form.notificationsEnabled)}
              className={`w-11 h-6 rounded-full transition-colors relative ${form.notificationsEnabled ? 'bg-primary-500' : 'bg-slate-600'}`}
            >
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${form.notificationsEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-white/[0.06] flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 text-sm transition-all">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 px-4 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-semibold text-sm transition-all disabled:opacity-50"
          >
            {saving ? 'Saving...' : isEdit ? 'Update Karein' : 'Add Karein'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Reminder Card ────────────────────────────────────────────────────────────
function ReminderCard({ reminder, onEdit, onDelete, onDose, onToggle }) {
  const [expanded, setExpanded] = useState(false);
  const adherence = reminder.totalDoses > 0
    ? Math.round((reminder.takenDoses / reminder.totalDoses) * 100)
    : null;

  const nextTime = (() => {
    const now = new Date();
    const todayStr = now.toDateString();
    let nearest = null;
    (reminder.times || []).forEach(t => {
      const [h, m] = t.split(':').map(Number);
      const d = new Date(todayStr);
      d.setHours(h, m, 0, 0);
      if (d > now && (!nearest || d < nearest)) nearest = d;
    });
    if (!nearest) return null;
    const diff = Math.round((nearest - now) / 60000);
    if (diff < 60) return `${diff} min mein`;
    return `${Math.floor(diff / 60)}h ${diff % 60}m mein`;
  })();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`bg-slate-900 rounded-2xl border overflow-hidden transition-all ${
        reminder.isActive ? 'border-white/[0.08]' : 'border-white/[0.04] opacity-60'
      }`}
    >
      {/* Color bar */}
      <div className="h-1 w-full" style={{ background: reminder.color || '#15b38a' }} />

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          {/* Left */}
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: (reminder.color || '#15b38a') + '22' }}>
              <Pill className="w-5 h-5" style={{ color: reminder.color || '#15b38a' }} />
            </div>
            <div className="min-w-0">
              <h3 className="text-white font-semibold text-sm truncate">{reminder.medicineName}</h3>
              {reminder.dosage && <p className="text-slate-500 text-xs">{reminder.dosage}</p>}
              <p className="text-slate-500 text-xs mt-0.5">{FREQ_LABELS[reminder.frequency]}</p>
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {reminder.streak > 0 && (
              <div className="flex items-center gap-1 bg-orange-500/10 px-2 py-1 rounded-lg">
                <Flame className="w-3 h-3 text-orange-400" />
                <span className="text-orange-400 text-xs font-bold">{reminder.streak}</span>
              </div>
            )}
            <button onClick={() => onToggle(reminder)}
              className={`p-1.5 rounded-lg transition-all ${reminder.isActive ? 'text-primary-400 hover:bg-primary-500/10' : 'text-slate-600 hover:bg-white/5'}`}
              title={reminder.isActive ? 'Pause' : 'Activate'}>
              {reminder.isActive ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
            </button>
            <button onClick={() => onEdit(reminder)} className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/5">
              <Edit3 className="w-4 h-4" />
            </button>
            <button onClick={() => onDelete(reminder._id)} className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10">
              <Trash2 className="w-4 h-4" />
            </button>
            <button onClick={() => setExpanded(e => !e)} className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/5">
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Times row */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {(reminder.times || []).map((t, i) => (
            <span key={i} className="flex items-center gap-1 bg-slate-800 px-2 py-0.5 rounded-lg text-slate-300 text-xs">
              <Clock className="w-3 h-3 text-slate-500" />
              {fmt12(t)}
            </span>
          ))}
          {nextTime && (
            <span className="flex items-center gap-1 bg-primary-500/10 px-2 py-0.5 rounded-lg text-primary-400 text-xs ml-auto">
              <Bell className="w-3 h-3" /> {nextTime}
            </span>
          )}
        </div>

        {/* Dose action buttons */}
        {reminder.isActive && (
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => onDose(reminder._id, 'taken')}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-primary-500/10 hover:bg-primary-500/20 text-primary-400 text-xs font-semibold transition-all border border-primary-500/20"
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Maine le li ✅
            </button>
            <button
              onClick={() => onDose(reminder._id, 'missed')}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold transition-all border border-red-500/20"
            >
              <XCircle className="w-3.5 h-3.5" /> Miss hua ❌
            </button>
          </div>
        )}

        {/* Expanded stats */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-3 pt-3 border-t border-white/[0.06] grid grid-cols-3 gap-3">
                {[
                  { label: 'Total Doses', val: reminder.totalDoses,  color: 'text-slate-300' },
                  { label: 'Li gayi',     val: reminder.takenDoses,  color: 'text-primary-400' },
                  { label: 'Miss hui',    val: reminder.missedDoses, color: 'text-red-400' },
                ].map(s => (
                  <div key={s.label} className="bg-slate-800/60 rounded-xl p-2.5 text-center">
                    <p className={`text-lg font-bold ${s.color}`}>{s.val}</p>
                    <p className="text-slate-500 text-xs">{s.label}</p>
                  </div>
                ))}
              </div>
              {adherence !== null && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-500">Adherence</span>
                    <span className={`font-semibold ${adherence >= 80 ? 'text-primary-400' : adherence >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {adherence}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${adherence}%`, background: adherence >= 80 ? '#15b38a' : adherence >= 60 ? '#f59e0b' : '#ef4444' }} />
                  </div>
                </div>
              )}
              {reminder.instructions && (
                <p className="mt-3 text-slate-500 text-xs flex items-start gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-yellow-500" />
                  {reminder.instructions}
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function MedicineReminderPage() {
  const [reminders,   setReminders]   = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [showModal,   setShowModal]   = useState(false);
  const [editTarget,  setEditTarget]  = useState(null);
  const [tab,         setTab]         = useState('active');  // 'active' | 'all'

  const { requestPermission, scheduleReminders, testNotification, permissionStatus } =
    useMedicineNotifications();

  const fetchReminders = useCallback(async () => {
    try {
      const res = await medicineReminderAPI.getAll();
      const data = res.data.data || [];
      setReminders(data);
      scheduleReminders(data.filter(r => r.isActive && r.notificationsEnabled));
    } catch (err) {
      toast.error('Reminders load nahi hue');
    } finally {
      setLoading(false);
    }
  }, [scheduleReminders]);

  useEffect(() => { fetchReminders(); }, [fetchReminders]);

  const handleSave = (saved, isEdit) => {
    setReminders(prev =>
      isEdit
        ? prev.map(r => r._id === saved._id ? saved : r)
        : [saved, ...prev]
    );
    setShowModal(false);
    setEditTarget(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Yeh reminder delete karein?')) return;
    try {
      await medicineReminderAPI.delete(id);
      setReminders(prev => prev.filter(r => r._id !== id));
      toast.success('Reminder delete ho gaya');
    } catch {
      toast.error('Delete nahi hua');
    }
  };

  const handleDose = async (id, status) => {
    try {
      const scheduledTime = new Date().toISOString();
      const res = await medicineReminderAPI.logDose(id, { status, scheduledTime });
      setReminders(prev => prev.map(r => r._id === id ? res.data.data : r));
      if (status === 'taken') toast.success('✅ Dose record ho gayi! Streak badha!');
      else toast('❌ Miss mark ho gaya', { icon: '😕' });
    } catch {
      toast.error('Dose log nahi hua');
    }
  };

  const handleToggle = async (reminder) => {
    try {
      const res = await medicineReminderAPI.update(reminder._id, { isActive: !reminder.isActive });
      setReminders(prev => prev.map(r => r._id === reminder._id ? res.data.data : r));
      toast(reminder.isActive ? 'Reminder pause hua' : 'Reminder active ho gaya!');
    } catch {
      toast.error('Update nahi hua');
    }
  };

  const filtered = reminders.filter(r =>
    tab === 'active' ? r.isActive : true
  );

  const totalActive  = reminders.filter(r => r.isActive).length;
  const totalStreak  = reminders.reduce((s, r) => s + (r.streak || 0), 0);
  const totalTaken   = reminders.reduce((s, r) => s + (r.takenDoses || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white flex items-center gap-2">
            <Pill className="w-6 h-6 text-primary-400" />
            Medicine Reminder
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">Kabhi koi dose miss mat karo 💊</p>
        </div>
        <button
          onClick={() => { setEditTarget(null); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-primary-500/20"
        >
          <Plus className="w-4 h-4" /> Add Medicine
        </button>
      </div>

      {/* Notification permission banner */}
      {permissionStatus !== 'granted' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl"
        >
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-yellow-400 flex-shrink-0" />
            <div>
              <p className="text-yellow-300 font-semibold text-sm">Notifications enable karein</p>
              <p className="text-yellow-500/70 text-xs">Mobile pe bhi reminder milega ✅</p>
            </div>
          </div>
          <button
            onClick={requestPermission}
            className="px-3 py-1.5 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 rounded-lg text-sm font-semibold transition-all"
          >
            Enable
          </button>
        </motion.div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: Pill,       label: 'Active',       val: totalActive,  color: 'text-primary-400', bg: 'bg-primary-500/10' },
          { icon: Flame,      label: 'Total Streak',  val: totalStreak,  color: 'text-orange-400',  bg: 'bg-orange-500/10' },
          { icon: CheckCircle2, label: 'Doses Li',   val: totalTaken,   color: 'text-green-400',   bg: 'bg-green-500/10' },
        ].map(s => (
          <div key={s.label} className="bg-slate-900 rounded-2xl p-4 border border-white/[0.06] flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center flex-shrink-0`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <div>
              <p className={`text-xl font-bold ${s.color}`}>{s.val}</p>
              <p className="text-slate-500 text-xs">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-900 p-1 rounded-xl w-fit border border-white/[0.06]">
        {['active', 'all'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all capitalize ${
              tab === t ? 'bg-primary-500/20 text-primary-300 border border-primary-500/30' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {t === 'active' ? '🟢 Active' : '📋 Sab'}
          </button>
        ))}
      </div>

      {/* Reminders list */}
      {loading ? (
        <div className="text-center py-16 text-slate-500">Loading reminders...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Pill className="w-12 h-12 text-slate-700 mx-auto mb-4" />
          <p className="text-slate-400 font-medium">Koi reminder nahi hai</p>
          <p className="text-slate-600 text-sm mt-1">Pehla medicine reminder add karein</p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-semibold transition-all"
          >
            <Plus className="w-4 h-4 inline mr-1" /> Add Medicine
          </button>
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="space-y-3">
            {filtered.map(r => (
              <ReminderCard
                key={r._id}
                reminder={r}
                onEdit={(rem) => { setEditTarget(rem); setShowModal(true); }}
                onDelete={handleDelete}
                onDose={handleDose}
                onToggle={handleToggle}
              />
            ))}
          </div>
        </AnimatePresence>
      )}

      {/* Test notification button */}
      {reminders.length > 0 && permissionStatus === 'granted' && (
        <button
          onClick={() => testNotification(reminders[0].medicineName)}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-300 text-sm transition-all"
        >
          <FlaskConical className="w-4 h-4" /> Test notification bhejo
        </button>
      )}

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <ReminderModal
            reminder={editTarget}
            onClose={() => { setShowModal(false); setEditTarget(null); }}
            onSave={handleSave}
          />
        )}
      </AnimatePresence>
    </div>
  );
}