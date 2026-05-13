import { useState, useMemo, useEffect } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer,
} from 'recharts';
import {
  Heart, Droplets, Scale, Thermometer, Activity,
  Plus, Trash2, AlertTriangle, CheckCircle2,
  TrendingUp, TrendingDown, Minus, ChevronDown,
  X, Zap, ClipboardList, BarChart2, Save,
  Calendar, Clock, FileText,
} from 'lucide-react';
import { vitalsAPI } from '../services/api';
import toast from 'react-hot-toast';

// ─── Config ───────────────────────────────────────────────────────────────────

const VITALS = {
  bp_systolic: {
    key: 'bp_systolic', key2: 'bp_diastolic',
    label: 'Blood Pressure', unit: 'mmHg',
    Icon: Heart, hex: '#f43f5e',
    normal:  { min: 90,  max: 120 },
    warning: { min: 80,  max: 140 },
    ph: '120', ph2: '80',
    hint: 'Normal: 90–120 / 60–80 mmHg',
  },
  blood_sugar: {
    key: 'blood_sugar',
    label: 'Blood Sugar', unit: 'mg/dL',
    Icon: Droplets, hex: '#f97316',
    normal:  { min: 70,  max: 100 },
    warning: { min: 60,  max: 180 },
    ph: '90',
    hint: 'Fasting normal: 70–100 mg/dL',
  },
  weight: {
    key: 'weight',
    label: 'Weight', unit: 'kg',
    Icon: Scale, hex: '#a855f7',
    normal:  { min: 0, max: 99999 },
    warning: { min: 0, max: 99999 },
    ph: '70',
    hint: 'Track your weight in kilograms',
  },
  heart_rate: {
    key: 'heart_rate',
    label: 'Heart Rate', unit: 'bpm',
    Icon: Activity, hex: '#10b981',
    normal:  { min: 60,  max: 100 },
    warning: { min: 50,  max: 120 },
    ph: '72',
    hint: 'Normal resting: 60–100 bpm',
  },
  temperature: {
    key: 'temperature',
    label: 'Temperature', unit: '°C',
    Icon: Thermometer, hex: '#38bdf8',
    normal:  { min: 36.1, max: 37.2 },
    warning: { min: 35,   max: 38.5 },
    ph: '36.6',
    hint: 'Normal: 36.1–37.2 °C',
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getStatus(value, cfg) {
  if (value == null) return 'unknown';
  if (cfg.key === 'weight') return 'normal';
  if (value >= cfg.normal.min && value <= cfg.normal.max) return 'normal';
  if (value >= cfg.warning.min && value <= cfg.warning.max) return 'warning';
  return 'danger';
}

const STATUS_MAP = {
  normal:  { label: 'Normal',  textCls: 'text-emerald-400', badgeCls: 'bg-emerald-400/10 border border-emerald-400/25 text-emerald-400' },
  warning: { label: 'Warning', textCls: 'text-amber-400',   badgeCls: 'bg-amber-400/10   border border-amber-400/25   text-amber-400'   },
  danger:  { label: 'Danger',  textCls: 'text-red-400',     badgeCls: 'bg-red-400/10     border border-red-400/25     text-red-400'     },
  unknown: { label: '—',       textCls: 'text-slate-500',   badgeCls: 'bg-slate-500/10   border border-slate-500/20   text-slate-500'   },
};

function calcTrend(records, key) {
  if (records.length < 2) return 'stable';
  const last = records.at(-1)[key];
  const prev = records.at(-2)[key];
  if (last == null || prev == null) return 'stable';
  const diff = last - prev;
  if (Math.abs(diff) < 0.5) return 'stable';
  return diff > 0 ? 'up' : 'down';
}

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

// ─── Alert Engine ─────────────────────────────────────────────────────────────

function buildAlerts(records) {
  if (!records.length) return [];
  const r = records.at(-1);
  const alerts = [];

  if (r.bp_systolic != null) {
    if (r.bp_systolic >= 140)
      alerts.push({ level: 'danger',  vital: 'Blood Pressure', msg: `Systolic ${r.bp_systolic} mmHg — Hypertension Stage 2. Please consult a doctor today.` });
    else if (r.bp_systolic >= 130)
      alerts.push({ level: 'warning', vital: 'Blood Pressure', msg: `Systolic ${r.bp_systolic} mmHg — slightly elevated. Reduce salt and rest.` });
    else if (r.bp_systolic < 90)
      alerts.push({ level: 'warning', vital: 'Blood Pressure', msg: `Systolic ${r.bp_systolic} mmHg — low BP. Drink water and lie down.` });
  }

  if (r.blood_sugar != null) {
    if (r.blood_sugar > 200)
      alerts.push({ level: 'danger',  vital: 'Blood Sugar', msg: `${r.blood_sugar} mg/dL — critically high. Seek medical attention immediately.` });
    else if (r.blood_sugar > 140)
      alerts.push({ level: 'warning', vital: 'Blood Sugar', msg: `${r.blood_sugar} mg/dL — pre-diabetic range. Review your diet.` });
    else if (r.blood_sugar < 70)
      alerts.push({ level: 'danger',  vital: 'Blood Sugar', msg: `${r.blood_sugar} mg/dL — hypoglycemia! Eat something sweet immediately.` });
  }

  if (r.heart_rate != null) {
    if (r.heart_rate > 120)
      alerts.push({ level: 'danger',  vital: 'Heart Rate', msg: `${r.heart_rate} bpm — very fast. Seek help if you feel chest pain.` });
    else if (r.heart_rate < 50)
      alerts.push({ level: 'warning', vital: 'Heart Rate', msg: `${r.heart_rate} bpm — below normal. See a doctor if dizzy.` });
  }

  if (r.temperature != null) {
    if (r.temperature >= 38.5)
      alerts.push({ level: 'danger',  vital: 'Temperature', msg: `${r.temperature}°C — high fever. Take paracetamol and see a doctor.` });
    else if (r.temperature >= 37.5)
      alerts.push({ level: 'warning', vital: 'Temperature', msg: `${r.temperature}°C — mild fever. Rest and stay hydrated.` });
    else if (r.temperature < 35.5)
      alerts.push({ level: 'danger',  vital: 'Temperature', msg: `${r.temperature}°C — hypothermia risk. Warm up and contact a doctor.` });
  }

  if (records.length >= 3) {
    const bp3 = records.slice(-3).map(x => x.bp_systolic).filter(Boolean);
    if (bp3.length === 3 && bp3[0] < bp3[1] && bp3[1] < bp3[2])
      alerts.push({ level: 'warning', vital: 'Trend', msg: 'Blood pressure rising for 3 consecutive readings — monitor closely.' });

    const sg3 = records.slice(-3).map(x => x.blood_sugar).filter(Boolean);
    if (sg3.length === 3 && sg3[0] < sg3[1] && sg3[1] < sg3[2])
      alerts.push({ level: 'warning', vital: 'Trend', msg: 'Blood sugar rising for 3 consecutive readings — review your diet.' });
  }

  return alerts;
}

// ─── Chart Tooltip ────────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label, cfg }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-xs shadow-xl">
      <p className="text-slate-400 mb-1">{label}</p>
      <p className="font-bold" style={{ color: cfg.hex }}>{payload[0]?.value} {cfg.unit}</p>
      {cfg.key2 && payload[1] && (
        <p className="text-sky-400 mt-0.5">Diastolic: {payload[1]?.value} {cfg.unit}</p>
      )}
    </div>
  );
}

// ─── Vital Card ───────────────────────────────────────────────────────────────

function VitalCard({ vKey, records, activeKey, setActiveKey }) {
  const cfg    = VITALS[vKey];
  const { Icon } = cfg;
  const latest   = records.at(-1);
  const val      = latest?.[cfg.key] ?? null;
  const status   = getStatus(val, cfg);
  const sm       = STATUS_MAP[status];
  const t        = calcTrend(records, cfg.key);
  const isActive = activeKey === vKey;

  const TrendIcon = t === 'up' ? TrendingUp : t === 'down' ? TrendingDown : Minus;
  const trendCls  = t === 'up' ? 'text-red-400' : t === 'down' ? 'text-emerald-400' : 'text-slate-600';

  return (
    <button
      onClick={() => setActiveKey(isActive ? null : vKey)}
      className="group w-full text-left rounded-2xl p-4 border border-white/[0.07] bg-slate-800/50 hover:border-white/15 hover:-translate-y-0.5 transition-all duration-200"
      style={{ boxShadow: isActive ? `0 0 0 1px ${cfg.hex}44, 0 4px 20px ${cfg.hex}18` : 'none',
               borderColor: isActive ? `${cfg.hex}55` : undefined,
               background:  isActive ? `${cfg.hex}10` : undefined }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${cfg.hex}20` }}>
          <Icon size={17} color={cfg.hex} strokeWidth={2} />
        </div>
        <span className={`text-[10px] font-bold tracking-wider px-2 py-0.5 rounded ${sm.badgeCls}`}>
          {sm.label.toUpperCase()}
        </span>
      </div>

      <p className="text-slate-500 text-[11px] mb-1">{cfg.label}</p>

      <div className="flex items-baseline gap-1 flex-wrap">
        <span className="text-2xl font-black leading-none" style={{ color: val != null ? cfg.hex : '#1e293b' }}>
          {val ?? '—'}
        </span>
        <span className="text-slate-600 text-[11px]">{cfg.unit}</span>
        {vKey === 'bp_systolic' && latest?.bp_diastolic != null && (
          <span className="text-sky-400 text-sm">/ {latest.bp_diastolic}</span>
        )}
      </div>

      <div className={`flex items-center gap-1.5 mt-2.5 ${trendCls}`}>
        <TrendIcon size={11} strokeWidth={2.5} />
        <span className="text-[11px]">
          {t === 'stable' ? 'Stable' : t === 'up' ? 'Rising' : 'Falling'}
        </span>
      </div>
    </button>
  );
}

// ─── Chart Section ────────────────────────────────────────────────────────────

function ChartSection({ vKey, setActiveKey, records }) {
  const cfg = VITALS[vKey];

  const data = records
    .map(r => ({ date: fmtDate(r.date), value: r[cfg.key], value2: r[cfg.key2] ?? undefined }))
    .filter(d => d.value != null);

  const allVals = data.flatMap(d => [d.value, d.value2].filter(Boolean));
  const yMin = allVals.length ? Math.floor(Math.min(...allVals) - 8) : 0;
  const yMax = allVals.length ? Math.ceil(Math.max(...allVals)  + 8) : 200;

  return (
    <div className="mt-3 bg-slate-800/50 border border-white/[0.07] rounded-2xl overflow-hidden">
      {/* Tab bar */}
      <div className="flex items-center gap-2 px-5 py-3 border-b border-white/[0.06] overflow-x-auto">
        <BarChart2 size={14} className="text-slate-500 flex-shrink-0" strokeWidth={2} />
        <span className="text-slate-300 text-sm font-semibold mr-2 flex-shrink-0">Trend</span>
        {Object.keys(VITALS).map(k => {
          const c = VITALS[k];
          const active = k === vKey;
          return (
            <button
              key={k}
              onClick={() => setActiveKey(k)}
              className="px-3 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all duration-150 border"
              style={{
                background:   active ? `${c.hex}22`  : 'rgba(255,255,255,0.04)',
                color:        active ? c.hex          : '#64748b',
                borderColor:  active ? `${c.hex}55`  : 'transparent',
              }}
            >
              {c.label}
            </button>
          );
        })}
      </div>

      {/* Empty state */}
      {!data.length ? (
        <div className="py-16 flex flex-col items-center gap-3 text-slate-600">
          <BarChart2 size={36} strokeWidth={1.5} />
          <p className="text-sm">No data yet. Click <span className="text-emerald-400 font-semibold">+ Log Vitals</span> to add your first reading.</p>
        </div>
      ) : (
        <div className="px-5 pt-4 pb-5">
          {/* Legend */}
          <div className="flex gap-5 mb-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-px bg-emerald-400/40" />
              <span className="text-slate-500 text-[11px]">Normal range</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-0.5 rounded" style={{ background: cfg.hex }} />
              <span className="text-slate-500 text-[11px]">{cfg.label}{cfg.key2 ? ' (Systolic)' : ''}</span>
            </div>
            {cfg.key2 && (
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-0.5 rounded bg-sky-400" />
                <span className="text-slate-500 text-[11px]">Diastolic</span>
              </div>
            )}
          </div>

          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data} margin={{ top: 4, right: 8, left: -22, bottom: 0 }}>
              <defs>
                <linearGradient id={`g1-${vKey}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={cfg.hex} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={cfg.hex} stopOpacity={0}   />
                </linearGradient>
                {cfg.key2 && (
                  <linearGradient id={`g2-${vKey}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#38bdf8" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}   />
                  </linearGradient>
                )}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis domain={[yMin, yMax]} tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip cfg={cfg} />} />
              {cfg.key !== 'weight' && (
                <>
                  <ReferenceLine y={cfg.normal.max} stroke="#4ade8040" strokeDasharray="4 4" />
                  <ReferenceLine y={cfg.normal.min} stroke="#4ade8040" strokeDasharray="4 4" />
                </>
              )}
              <Area type="monotone" dataKey="value" stroke={cfg.hex} strokeWidth={2.5}
                fill={`url(#g1-${vKey})`}
                dot={{ fill: cfg.hex, r: 4, strokeWidth: 0 }}
                activeDot={{ r: 6, strokeWidth: 0 }} />
              {cfg.key2 && (
                <Area type="monotone" dataKey="value2" stroke="#38bdf8" strokeWidth={2}
                  fill={`url(#g2-${vKey})`}
                  dot={{ fill: '#38bdf8', r: 3, strokeWidth: 0 }}
                  activeDot={{ r: 5, strokeWidth: 0 }} />
              )}
            </AreaChart>
          </ResponsiveContainer>

          <p className="text-slate-600 text-[11px] text-center mt-3">{cfg.hint}</p>
        </div>
      )}
    </div>
  );
}

// ─── Log Modal ────────────────────────────────────────────────────────────────

const MODAL_FIELDS = [
  { key: 'bp_systolic', key2: 'bp_diastolic', label: 'Blood Pressure', unit: 'mmHg', ph: '120', ph2: '80', Icon: Heart,       hex: '#f43f5e' },
  { key: 'blood_sugar',                        label: 'Blood Sugar',    unit: 'mg/dL', ph: '90',            Icon: Droplets,    hex: '#f97316' },
  { key: 'weight',                             label: 'Weight',         unit: 'kg',    ph: '70',             Icon: Scale,       hex: '#a855f7' },
  { key: 'heart_rate',                         label: 'Heart Rate',     unit: 'bpm',   ph: '72',             Icon: Activity,    hex: '#10b981' },
  { key: 'temperature',                        label: 'Temperature',    unit: '°C',    ph: '36.6',           Icon: Thermometer, hex: '#38bdf8' },
];

function LogModal({ onClose, onSave }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm]     = useState({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    bp_systolic: '', bp_diastolic: '',
    blood_sugar: '', weight: '',
    heart_rate: '', temperature: '',
    note: '',
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    const numKeys = ['bp_systolic','bp_diastolic','blood_sugar','weight','heart_rate','temperature'];
    const entry   = { ...form };
    numKeys.forEach(k => { entry[k] = entry[k] === '' ? null : parseFloat(entry[k]); });

    if (numKeys.every(k => entry[k] == null)) {
      toast.error('Enter at least one reading.');
      return;
    }

    setSaving(true);
    await onSave({ id: Date.now().toString(), ...entry });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07]">
          <div>
            <p className="text-white font-bold text-sm">Log Vitals</p>
            <p className="text-slate-500 text-xs mt-0.5">Enter your health readings</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 transition-colors">
            <X size={15} strokeWidth={2} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-3">
          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-slate-500 flex items-center gap-1.5 mb-1.5">
                <Calendar size={11} strokeWidth={2} /> Date
              </label>
              <input type="date" value={form.date} onChange={e => set('date', e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-slate-200 text-sm outline-none focus:border-white/20"
                style={{ colorScheme: 'dark' }} />
            </div>
            <div>
              <label className="text-[11px] text-slate-500 flex items-center gap-1.5 mb-1.5">
                <Clock size={11} strokeWidth={2} /> Time
              </label>
              <input type="time" value={form.time} onChange={e => set('time', e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-slate-200 text-sm outline-none focus:border-white/20"
                style={{ colorScheme: 'dark' }} />
            </div>
          </div>

          {/* Vital Fields */}
          {MODAL_FIELDS.map(({ key, key2, label, unit, ph, ph2, Icon: FIcon, hex }) => (
            <div key={key} className="bg-white/[0.025] border border-white/[0.06] rounded-xl px-4 py-3">
              <label className="text-xs text-slate-400 font-medium flex items-center gap-2 mb-2.5">
                <FIcon size={13} color={hex} strokeWidth={2} />
                {label}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number" step="0.1" placeholder={ph} value={form[key]}
                  onChange={e => set(key, e.target.value)}
                  className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm font-semibold outline-none focus:border-white/25 placeholder:text-slate-700"
                />
                {key2 && (
                  <>
                    <span className="text-slate-600 text-lg font-light">/</span>
                    <input
                      type="number" placeholder={ph2} value={form[key2]}
                      onChange={e => set(key2, e.target.value)}
                      className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm font-semibold outline-none focus:border-white/25 placeholder:text-slate-700"
                    />
                  </>
                )}
                <span className="text-slate-600 text-[11px] whitespace-nowrap min-w-[36px] text-right">{unit}</span>
              </div>
            </div>
          ))}

          {/* Note */}
          <div>
            <label className="text-[11px] text-slate-500 flex items-center gap-1.5 mb-1.5">
              <FileText size={11} strokeWidth={2} /> Note (optional)
            </label>
            <textarea
              rows={2} placeholder="Any symptoms, medications, or observations..."
              value={form.note} onChange={e => set('note', e.target.value)}
              className="w-full px-3 py-2 bg-white/5 border border-white/[0.08] rounded-lg text-slate-300 text-sm outline-none resize-none focus:border-white/20 placeholder:text-slate-700"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-5 py-4 border-t border-white/[0.06]">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/8 text-slate-400 text-sm font-semibold transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave} disabled={saving}
            className="flex-[2] py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors"
          >
            <Save size={14} strokeWidth={2.5} />
            {saving ? 'Saving...' : 'Save Vitals'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function HealthVitalsPage() {
  const [records,         setRecords]         = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [activeKey,       setActiveKey]       = useState('bp_systolic');
  const [showModal,       setShowModal]       = useState(false);
  const [showHistory,     setShowHistory]     = useState(false);
  const [alertsDismissed, setAlertsDismissed] = useState(false);

  // Fetch from API
  useEffect(() => {
    (async () => {
      try {
        const res = await vitalsAPI.getAll(90);
        setRecords(res.data?.data ?? []);
      } catch {
        toast.error('Failed to load vitals.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const alerts = useMemo(() => buildAlerts(records), [records]);

  const handleSave = async (entry) => {
    try {
      const res   = await vitalsAPI.log(entry);
      const saved = res.data?.data ?? entry;
      setRecords(r => [...r, saved].sort((a, b) => a.date.localeCompare(b.date)));
      setAlertsDismissed(false);
      toast.success('Vitals saved!');
      setShowModal(false);
    } catch {
      setRecords(r => [...r, entry].sort((a, b) => a.date.localeCompare(b.date)));
      toast.error('Saved locally — API error.');
      setShowModal(false);
    }
  };

  const handleDelete = async (id) => {
    setRecords(r => r.filter(x => (x.id ?? x._id) !== id));
    try {
      await vitalsAPI.delete(id);
      toast.success('Record deleted.');
    } catch {
      toast.error('Delete failed on server.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-rose-500 to-rose-700 flex items-center justify-center shadow-lg shadow-rose-500/20 flex-shrink-0">
            <Activity size={20} className="text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-100 leading-tight">Health Vitals Tracker</h1>
            <p className="text-slate-500 text-sm mt-0.5">Log daily readings — AI alerts you if something is off</p>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold rounded-xl transition-colors flex-shrink-0 shadow-lg shadow-emerald-500/20"
        >
          <Plus size={16} strokeWidth={2.5} />
          Log Vitals
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-24 text-slate-600 gap-3">
          <Activity size={22} className="animate-pulse" />
          <span className="text-sm">Loading vitals...</span>
        </div>
      )}

      {!loading && (
        <>
          {/* AI Alerts */}
          {alerts.length > 0 && !alertsDismissed && (
            <div className="mb-4 bg-red-500/[0.07] border border-red-500/20 rounded-2xl overflow-hidden">
              <div className="flex items-center gap-2.5 px-4 py-3 border-b border-red-500/10">
                <Zap size={14} className="text-red-400" strokeWidth={2.5} />
                <span className="text-red-300 font-bold text-sm">AI Health Alerts ({alerts.length})</span>
                <button onClick={() => setAlertsDismissed(true)} className="ml-auto text-slate-600 hover:text-slate-400 transition-colors">
                  <X size={14} strokeWidth={2} />
                </button>
              </div>
              {alerts.map((a, i) => (
                <div key={i} className={`flex gap-2.5 px-4 py-2.5 ${i < alerts.length - 1 ? 'border-b border-white/[0.03]' : ''}`}>
                  <AlertTriangle size={13} className={`mt-0.5 flex-shrink-0 ${a.level === 'danger' ? 'text-red-400' : 'text-amber-400'}`} strokeWidth={2} />
                  <p className="text-xs text-slate-400">
                    <span className={`font-bold mr-1.5 ${a.level === 'danger' ? 'text-red-400' : 'text-amber-400'}`}>{a.vital}</span>
                    {a.msg}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* All clear */}
          {alerts.length === 0 && records.length > 0 && (
            <div className="mb-4 flex items-center gap-2.5 px-4 py-3 bg-emerald-500/[0.07] border border-emerald-500/20 rounded-xl">
              <CheckCircle2 size={15} className="text-emerald-400" strokeWidth={2} />
              <span className="text-emerald-400 text-sm font-semibold">All vitals are in the normal range — keep it up!</span>
            </div>
          )}

          {/* Vital Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {Object.keys(VITALS).map(k => (
              <VitalCard key={k} vKey={k} records={records} activeKey={activeKey} setActiveKey={setActiveKey} />
            ))}
          </div>

          {/* Chart */}
          {activeKey && (
            <ChartSection vKey={activeKey} setActiveKey={setActiveKey} records={records} />
          )}

          {/* History */}
          <div className="mt-3 bg-slate-800/50 border border-white/[0.07] rounded-2xl overflow-hidden">
            <button
              onClick={() => setShowHistory(h => !h)}
              className="w-full flex items-center gap-2.5 px-5 py-4 text-left hover:bg-white/[0.02] transition-colors"
            >
              <ClipboardList size={15} className="text-slate-500" strokeWidth={2} />
              <span className="text-slate-300 font-semibold text-sm">Reading History</span>
              <span className="ml-1 text-[11px] text-slate-600 bg-white/5 px-2 py-0.5 rounded-full">{records.length}</span>
              <ChevronDown
                size={15} className="ml-auto text-slate-600 transition-transform duration-200"
                style={{ transform: showHistory ? 'rotate(180deg)' : 'none' }}
              />
            </button>

            {showHistory && (
              records.length === 0 ? (
                <div className="py-12 text-center border-t border-white/[0.05]">
                  <ClipboardList size={32} className="mx-auto mb-3 text-slate-700" strokeWidth={1.5} />
                  <p className="text-slate-600 text-sm">No readings yet. Log your first vital above.</p>
                </div>
              ) : (
                <div className="overflow-x-auto border-t border-white/[0.05]">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-white/[0.05]">
                        {['Date','Time','BP (sys/dia)','Sugar','Weight','HR','Temp','Note',''].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-slate-600 font-semibold whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[...records].reverse().map(r => {
                        const id = r.id ?? r._id;
                        return (
                          <tr key={id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                            <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{fmtDate(r.date)}</td>
                            <td className="px-4 py-3 text-slate-600">{r.time}</td>
                            <td className="px-4 py-3 text-slate-200 font-semibold">
                              {r.bp_systolic ?? '—'}{r.bp_diastolic ? `/${r.bp_diastolic}` : ''}
                            </td>
                            <td className="px-4 py-3 text-slate-300">{r.blood_sugar ?? '—'}</td>
                            <td className="px-4 py-3 text-slate-300">{r.weight ?? '—'}</td>
                            <td className="px-4 py-3 text-slate-300">{r.heart_rate ?? '—'}</td>
                            <td className="px-4 py-3 text-slate-300">{r.temperature ?? '—'}</td>
                            <td className="px-4 py-3 text-slate-600 max-w-[120px] truncate">{r.note || '—'}</td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() => handleDelete(id)}
                                className="p-1.5 rounded-lg text-slate-700 hover:text-red-400 hover:bg-red-400/10 transition-all"
                              >
                                <Trash2 size={12} strokeWidth={2} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )
            )}
          </div>
        </>
      )}

      {showModal && <LogModal onClose={() => setShowModal(false)} onSave={handleSave} />}
    </div>
  );
}