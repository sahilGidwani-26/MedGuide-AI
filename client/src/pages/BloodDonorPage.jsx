// src/pages/BloodDonorPage.jsx
// ─── ONLY CHANGE from previous version: useSocket import + real-time listener ──
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Droplets, Plus, Search, MapPin, Phone, User,
  Clock, CheckCircle2, AlertTriangle, X, Heart,
  RefreshCw, Shield, ChevronRight, Users,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { bloodAPI } from '../services/api';
import { useSocket } from '../hooks/useSocket';   // ← ADD THIS IMPORT

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const URGENCY_META = {
  critical: { label: 'Critical',  color: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/30'    },
  urgent:   { label: 'Urgent',    color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30' },
  normal:   { label: 'Normal',    color: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/30'   },
};
const BG_COLORS = {
  'A+':'bg-red-500/20 text-red-300','A-':'bg-red-500/10 text-red-400',
  'B+':'bg-blue-500/20 text-blue-300','B-':'bg-blue-500/10 text-blue-400',
  'AB+':'bg-purple-500/20 text-purple-300','AB-':'bg-purple-500/10 text-purple-400',
  'O+':'bg-green-500/20 text-green-300','O-':'bg-green-500/10 text-green-400',
};

// ─── Register Donor Modal ─────────────────────────────────────────────────────
function DonorRegisterModal({ existing, onClose, onSave }) {
  const [form, setForm] = useState({
    name:              existing?.name              || '',
    bloodGroup:        existing?.bloodGroup        || '',
    phone:             existing?.phone             || '',
    city:              existing?.city              || '',
    state:             existing?.state             || '',
    age:               existing?.age               || '',
    weight:            existing?.weight            || '',
    medicalConditions: existing?.medicalConditions || '',
    lastDonated:       existing?.lastDonated
      ? new Date(existing.lastDonated).toISOString().slice(0,10) : '',
  });
  const [saving,   setSaving]   = useState(false);
  const [locating, setLocating] = useState(false);
  const [coords,   setCoords]   = useState({ lat: null, lng: null });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const getLocation = () => {
    if (!navigator.geolocation) return toast.error('Geolocation support nahi hai');
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
        toast.success('Location detect ho gayi!');
      },
      () => { setLocating(false); toast.error('Location nahi mili'); }
    );
  };

  const handleSubmit = async () => {
    if (!form.name || !form.bloodGroup || !form.phone || !form.city)
      return toast.error('Naam, Blood Group, Phone, City zaroori hai');
    setSaving(true);
    try {
      const res = await bloodAPI.registerDonor({ ...form, ...coords });
      toast.success(existing ? 'Profile update ho gaya!' : 'Donor ke roop mein register ho gaye! ❤️');
      onSave(res.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error aaya');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg bg-slate-900 rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
          <h2 className="text-white font-bold text-lg flex items-center gap-2">
            <Droplets className="w-5 h-5 text-red-400" />
            {existing ? 'Profile Update Karein' : 'Donor Register Karein'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 text-slate-400"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-slate-400 text-xs mb-1.5 block">Aapka naam *</label>
              <input value={form.name} onChange={e => set('name', e.target.value)}
                placeholder="Pura naam"
                className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-500/50" />
            </div>
            <div className="col-span-2">
              <label className="text-slate-400 text-xs mb-1.5 block">Blood Group *</label>
              <div className="grid grid-cols-4 gap-1.5">
                {BLOOD_GROUPS.map(bg => (
                  <button key={bg} onClick={() => set('bloodGroup', bg)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all
                      ${form.bloodGroup === bg
                        ? 'bg-red-500/20 border-red-500/40 text-red-300'
                        : 'bg-slate-800 border-white/10 text-slate-400 hover:text-white'}`}>
                    {bg}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-slate-400 text-xs mb-1.5 block">Phone *</label>
              <input value={form.phone} onChange={e => set('phone', e.target.value)}
                placeholder="+91 98765 43210" type="tel"
                className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-500/50" />
            </div>
            <div>
              <label className="text-slate-400 text-xs mb-1.5 block">City *</label>
              <input value={form.city} onChange={e => set('city', e.target.value)}
                placeholder="Indore, Mumbai..."
                className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-500/50" />
            </div>
            <div>
              <label className="text-slate-400 text-xs mb-1.5 block">State</label>
              <input value={form.state} onChange={e => set('state', e.target.value)}
                placeholder="Madhya Pradesh"
                className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-500/50" />
            </div>
            <div>
              <label className="text-slate-400 text-xs mb-1.5 block">Umar (years)</label>
              <input value={form.age} onChange={e => set('age', e.target.value)} type="number" min="18" max="65"
                className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-500/50" />
            </div>
            <div>
              <label className="text-slate-400 text-xs mb-1.5 block">Wajan (kg)</label>
              <input value={form.weight} onChange={e => set('weight', e.target.value)} type="number" min="45"
                className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-500/50" />
            </div>
            <div>
              <label className="text-slate-400 text-xs mb-1.5 block">Pichli baar kab donate kiya?</label>
              <input value={form.lastDonated} onChange={e => set('lastDonated', e.target.value)} type="date"
                className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-500/50" />
            </div>
            <div className="col-span-2">
              <label className="text-slate-400 text-xs mb-1.5 block">Koi bimari hai? (optional)</label>
              <input value={form.medicalConditions} onChange={e => set('medicalConditions', e.target.value)}
                placeholder="e.g. Diabetes, hypertension, none"
                className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-500/50" />
            </div>
          </div>

          <button onClick={getLocation} disabled={locating}
            className="flex items-center gap-2 w-full px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-white/10 rounded-xl text-slate-300 text-sm transition-all">
            <MapPin className="w-4 h-4 text-primary-400" />
            {locating ? 'Location dhundh raha hai...' : coords.lat ? '✅ Location mili — click to refresh' : 'Current location use karein (nearby search ke liye)'}
          </button>

          <div className="p-3 bg-red-500/5 border border-red-500/20 rounded-xl text-red-400/80 text-xs">
            ❤️ Donor register karke aap kisi ki jaan bacha sakte hain. Aapka number sirf emergency mein use hoga.
          </div>
        </div>

        <div className="p-5 border-t border-white/[0.06] flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 text-sm transition-all">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={saving}
            className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold text-sm transition-all disabled:opacity-50">
            {saving ? 'Saving...' : existing ? 'Update Karein' : 'Register Karein ❤️'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Create Request Modal ─────────────────────────────────────────────────────
function CreateRequestModal({ onClose, onSave }) {
  const [form, setForm] = useState({
    patientName: '', bloodGroup: '', unitsNeeded: 1,
    hospital: '', city: '', contactPhone: '', urgency: 'urgent', notes: '',
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.patientName || !form.bloodGroup || !form.hospital || !form.city || !form.contactPhone)
      return toast.error('Sab zaroori fields bharo');
    setSaving(true);
    try {
      let lat, lng;
      await new Promise((res) => {
        navigator.geolocation?.getCurrentPosition(
          p => { lat = p.coords.latitude; lng = p.coords.longitude; res(); },
          () => res()
        );
      });
      const res = await bloodAPI.createRequest({ ...form, lat, lng });
      toast.success('Blood request send ho gayi! Donors ko notify kiya ja raha hai 🔔');
      onSave(res.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Request nahi gayi');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg bg-slate-900 rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
          <h2 className="text-white font-bold text-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            Blood Request Bhejein
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 text-slate-400"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-5 space-y-3 max-h-[75vh] overflow-y-auto">
          <div>
            <label className="text-slate-400 text-xs mb-1.5 block">Kitna zaroor hai?</label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(URGENCY_META).map(([key, meta]) => (
                <button key={key} onClick={() => set('urgency', key)}
                  className={`py-2 rounded-xl text-xs font-semibold border transition-all
                    ${form.urgency === key ? `${meta.bg} ${meta.border} ${meta.color}` : 'bg-slate-800 border-white/10 text-slate-400 hover:text-white'}`}>
                  {meta.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-slate-400 text-xs mb-1.5 block">Patient ka naam *</label>
            <input value={form.patientName} onChange={e => set('patientName', e.target.value)}
              placeholder="Patient ka pura naam"
              className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-500/50" />
          </div>

          <div>
            <label className="text-slate-400 text-xs mb-1.5 block">Kaun sa blood chahiye? *</label>
            <div className="grid grid-cols-4 gap-1.5">
              {BLOOD_GROUPS.map(bg => (
                <button key={bg} onClick={() => set('bloodGroup', bg)}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all
                    ${form.bloodGroup === bg ? 'bg-red-500/20 border-red-500/40 text-red-300' : 'bg-slate-800 border-white/10 text-slate-400 hover:text-white'}`}>
                  {bg}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 text-xs mb-1.5 block">Kitne units?</label>
              <input value={form.unitsNeeded} onChange={e => set('unitsNeeded', e.target.value)}
                type="number" min="1" max="10"
                className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-500/50" />
            </div>
            <div>
              <label className="text-slate-400 text-xs mb-1.5 block">Contact number *</label>
              <input value={form.contactPhone} onChange={e => set('contactPhone', e.target.value)}
                placeholder="+91 98765 43210" type="tel"
                className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-500/50" />
            </div>
          </div>

          <div>
            <label className="text-slate-400 text-xs mb-1.5 block">Hospital *</label>
            <input value={form.hospital} onChange={e => set('hospital', e.target.value)}
              placeholder="Hospital ka naam"
              className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-500/50" />
          </div>

          <div>
            <label className="text-slate-400 text-xs mb-1.5 block">City *</label>
            <input value={form.city} onChange={e => set('city', e.target.value)}
              placeholder="Indore, Bhopal..."
              className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-500/50" />
          </div>

          <div>
            <label className="text-slate-400 text-xs mb-1.5 block">Extra jaankari (optional)</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
              placeholder="Koi aur zaroori baat..." rows={2}
              className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-500/50 resize-none" />
          </div>
        </div>

        <div className="p-5 border-t border-white/[0.06] flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 text-sm transition-all">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={saving}
            className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold text-sm transition-all disabled:opacity-50">
            {saving ? 'Sending...' : '🆘 Request Bhejein'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Donor Card ───────────────────────────────────────────────────────────────
function DonorCard({ donor }) {
  return (
    <div className="bg-slate-900 rounded-2xl border border-white/[0.06] p-4 flex items-center gap-4">
      <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
        <span className={`text-sm font-black ${BG_COLORS[donor.bloodGroup]?.split(' ')[1] || 'text-red-300'}`}>
          {donor.bloodGroup}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white font-semibold text-sm truncate">{donor.name}</p>
        <p className="text-slate-500 text-xs flex items-center gap-1 mt-0.5">
          <MapPin className="w-3 h-3" /> {donor.city}{donor.state ? `, ${donor.state}` : ''}
        </p>
        {donor.totalDonations > 0 && (
          <p className="text-slate-600 text-xs mt-0.5">🩸 {donor.totalDonations} baar donate kiya</p>
        )}
      </div>
      <div className="flex flex-col items-end gap-2">
        <span className={`px-2 py-0.5 rounded-lg text-xs font-semibold ${donor.isAvailable ? 'bg-green-500/10 text-green-400' : 'bg-slate-700 text-slate-500'}`}>
          {donor.isAvailable ? 'Available' : 'Unavailable'}
        </span>
        {donor.isAvailable && (
          <a href={`tel:${donor.phone}`}
            className="flex items-center gap-1 px-2 py-1 bg-primary-500/10 hover:bg-primary-500/20 text-primary-400 rounded-lg text-xs transition-all">
            <Phone className="w-3 h-3" /> Call
          </a>
        )}
      </div>
    </div>
  );
}

// ─── Request Card ─────────────────────────────────────────────────────────────
function RequestCard({ request, onRespond, isOwnRequest, onClose, isNew }) {
  const meta = URGENCY_META[request.urgency] || URGENCY_META.normal;
  const timeAgo = (() => {
    const diff = Date.now() - new Date(request.createdAt).getTime();
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    if (h > 0) return `${h}h pehle`;
    return `${m} min pehle`;
  })();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`bg-slate-900 rounded-2xl border p-4 transition-all
        ${isNew ? 'border-red-500/50 shadow-lg shadow-red-500/10' : meta.border}`}
    >
      {/* NEW badge for real-time requests */}
      {isNew && (
        <div className="flex items-center gap-1.5 mb-2">
          <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse">
            🔴 LIVE — Abhi aaya!
          </span>
        </div>
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-2xl ${meta.bg} flex items-center justify-center flex-shrink-0`}>
            <span className={`text-sm font-black ${meta.color}`}>{request.bloodGroup}</span>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-white font-semibold text-sm">{request.patientName}</h3>
              <span className={`px-2 py-0.5 rounded-lg text-xs font-semibold ${meta.bg} ${meta.color}`}>
                {meta.label}
              </span>
            </div>
            <p className="text-slate-500 text-xs mt-0.5">
              {request.unitsNeeded} unit • {request.hospital}
            </p>
            <p className="text-slate-600 text-xs flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3" /> {request.city} · <Clock className="w-3 h-3" /> {timeAgo}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-1.5 flex-shrink-0">
          <a href={`tel:${request.contactPhone}`}
            className="flex items-center gap-1 px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-lg text-xs font-semibold transition-all">
            <Phone className="w-3 h-3" /> Call
          </a>
          {!isOwnRequest && request.status === 'open' && (
            <button onClick={() => onRespond(request._id)}
              className="flex items-center gap-1 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs font-semibold transition-all">
              <Heart className="w-3 h-3" /> Help
            </button>
          )}
          {isOwnRequest && request.status === 'open' && (
            <button onClick={() => onClose(request._id)}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-xs font-semibold transition-all">
              <CheckCircle2 className="w-3 h-3" /> Fulfilled
            </button>
          )}
        </div>
      </div>

      {request.notes && (
        <p className="mt-2 text-slate-500 text-xs border-t border-white/[0.04] pt-2">
          📝 {request.notes}
        </p>
      )}
      {request.respondedDonors?.length > 0 && (
        <p className="mt-2 text-primary-400 text-xs">
          ❤️ {request.respondedDonors.length} donor(s) ne respond kiya
        </p>
      )}
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function BloodDonorPage() {
  const [tab,            setTab]            = useState('requests');
  const [myProfile,      setMyProfile]      = useState(null);
  const [donors,         setDonors]         = useState([]);
  const [requests,       setRequests]       = useState([]);
  const [myRequests,     setMyRequests]     = useState([]);
  const [newRequestIds,  setNewRequestIds]  = useState(new Set()); // tracks real-time arrivals
  const [loading,        setLoading]        = useState(true);
  const [showDonorModal, setShowDonorModal] = useState(false);
  const [showReqModal,   setShowReqModal]   = useState(false);
  const [filter,         setFilter]         = useState({ bloodGroup: '', city: '' });
  const [searching,      setSearching]      = useState(false);

  // ── useSocket — real-time blood requests ──────────────────────
  const { on, off } = useSocket();   // ← USING YOUR EXISTING HOOK

  useEffect(() => {
    // Listen for new blood requests from ANY user in real-time
    const cleanup = on('blood_request_new', (data) => {
      // Build a minimal request object from socket payload
      const liveRequest = {
        _id:           data.requestId,
        patientName:   data.patientName,
        bloodGroup:    data.bloodGroup,
        hospital:      data.hospital,
        city:          data.city,
        urgency:       data.urgency,
        contactPhone:  data.contactPhone,
        unitsNeeded:   data.unitsNeeded || 1,
        status:        'open',
        respondedDonors: [],
        createdAt:     data.createdAt || new Date().toISOString(),
      };

      // Prepend to requests list
      setRequests(prev => {
        // Avoid duplicates
        if (prev.some(r => r._id === liveRequest._id)) return prev;
        return [liveRequest, ...prev];
      });

      // Mark it as "new" so it shows the LIVE badge
      setNewRequestIds(prev => new Set([...prev, liveRequest._id]));

      // Show a toast alert to everyone on the page
      toast(`🆘 New ${data.bloodGroup} request in ${data.city}!\n${data.hospital}`, {
        duration: 8000,
        style: {
          background: 'rgba(239,68,68,0.15)',
          border: '1px solid rgba(239,68,68,0.3)',
          color: '#fca5a5',
        },
        icon: '🩸',
      });

      // Remove NEW badge after 30 seconds
      setTimeout(() => {
        setNewRequestIds(prev => {
          const next = new Set(prev);
          next.delete(liveRequest._id);
          return next;
        });
      }, 30000);
    });

    return cleanup;   // cleans up socket listener on unmount
  }, [on]);

  // ── Load initial data ─────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [profRes, reqRes, myReqRes] = await Promise.allSettled([
        bloodAPI.getMyProfile(),
        bloodAPI.getRequests({ status: 'open' }),
        bloodAPI.getMyRequests(),
      ]);
      if (profRes.status === 'fulfilled') setMyProfile(profRes.value.data.data);
      if (reqRes.status === 'fulfilled')  setRequests(reqRes.value.data.data);
      if (myReqRes.status === 'fulfilled') setMyRequests(myReqRes.value.data.data);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const searchDonors = async () => {
    if (!filter.bloodGroup && !filter.city) return toast.error('Blood group ya city daalo');
    setSearching(true);
    try {
      const res = await bloodAPI.searchDonors(filter);
      setDonors(res.data.data);
      if (!res.data.data.length) toast('Is area mein koi donor nahi mila 😔');
    } catch { toast.error('Search fail hua'); }
    setSearching(false);
  };

  const handleRespond = async (id) => {
    try {
      await bloodAPI.respondRequest(id);
      toast.success('✅ Response record ho gaya! Requester aapko call kar sakta hai.');
      setRequests(prev => prev.map(r => r._id === id
        ? { ...r, respondedDonors: [...(r.respondedDonors || []), { status: 'interested' }] }
        : r));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Response nahi gaya');
    }
  };

  const handleCloseRequest = async (id) => {
    try {
      await bloodAPI.updateStatus(id, 'fulfilled');
      setMyRequests(prev => prev.map(r => r._id === id ? { ...r, status: 'fulfilled' } : r));
      setRequests(prev => prev.filter(r => r._id !== id));
      toast.success('Request fulfilled mark ho gayi! ❤️');
    } catch { toast.error('Update nahi hua'); }
  };

  const toggleAvailability = async () => {
    try {
      const res = await bloodAPI.toggleAvailability();
      setMyProfile(res.data.data);
      toast(res.data.data.isAvailable ? '🟢 Aap available hain' : '🔴 Aap unavailable hain');
    } catch { toast.error('Update nahi hua'); }
  };

  const openRequests = requests.filter(r => r.status === 'open');
  const myOpenReqs   = myRequests.filter(r => r.status === 'open');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold text-white flex items-center gap-2">
            <Droplets className="w-6 h-6 text-red-400" />
            Blood Donor Finder
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Emergency mein real-time donors dhundho 🩸
            <span className="ml-2 inline-flex items-center gap-1 text-green-400 text-xs">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              Live
            </span>
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowReqModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-red-500/20">
            <AlertTriangle className="w-4 h-4" /> Blood Maangna Hai
          </button>
          {!myProfile && (
            <button onClick={() => setShowDonorModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-white/10 text-white rounded-xl text-sm font-semibold transition-all">
              <Heart className="w-4 h-4 text-red-400" /> Donor Banein
            </button>
          )}
        </div>
      </div>

      {/* My profile quick card */}
      {myProfile && (
        <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-2xl flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
              <span className="text-red-300 font-black text-sm">{myProfile.bloodGroup}</span>
            </div>
            <div>
              <p className="text-white font-semibold text-sm">Aap Registered Donor Hain ❤️</p>
              <p className="text-slate-500 text-xs">{myProfile.city} · {myProfile.totalDonations} donations</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${myProfile.isAvailable ? 'bg-green-500/10 text-green-400' : 'bg-slate-700 text-slate-400'}`}>
              {myProfile.isAvailable ? '🟢 Available' : '🔴 Unavailable'}
            </span>
            <button onClick={toggleAvailability}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-300 rounded-lg text-xs transition-all">
              Toggle
            </button>
            <button onClick={() => setShowDonorModal(true)}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-300 rounded-lg text-xs transition-all">
              Edit
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-900 p-1 rounded-xl w-fit border border-white/[0.06]">
        {[
          { key: 'requests', label: `🆘 Requests (${openRequests.length})` },
          { key: 'donors',   label: '🔍 Donors Dhundho' },
          { key: 'mine',     label: `📋 Meri Requests (${myOpenReqs.length})` },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap
              ${tab === t.key ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'text-slate-500 hover:text-slate-300'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Open Requests ── */}
      {tab === 'requests' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-slate-400 text-sm">{openRequests.length} open request(s)</p>
            <button onClick={loadData} className="p-2 rounded-lg hover:bg-white/5 text-slate-500 hover:text-slate-300">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
          {loading ? (
            <div className="text-center py-12 text-slate-500">Loading...</div>
          ) : openRequests.length === 0 ? (
            <div className="text-center py-16">
              <Droplets className="w-12 h-12 text-slate-700 mx-auto mb-4" />
              <p className="text-slate-400 font-medium">Abhi koi active request nahi hai</p>
              <p className="text-slate-600 text-sm mt-1">Jab koi blood maangega, yahan dikhega</p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {openRequests.map(r => (
                <RequestCard
                  key={r._id}
                  request={r}
                  onRespond={handleRespond}
                  isOwnRequest={myRequests.some(mr => mr._id === r._id)}
                  onClose={handleCloseRequest}
                  isNew={newRequestIds.has(r._id)}
                />
              ))}
            </AnimatePresence>
          )}
        </div>
      )}

      {/* ── Tab: Donor Search ── */}
      {tab === 'donors' && (
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <select value={filter.bloodGroup} onChange={e => setFilter(f => ({ ...f, bloodGroup: e.target.value }))}
              className="bg-slate-800 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-red-500/50">
              <option value="">Koi bhi blood group</option>
              {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
            </select>
            <input value={filter.city} onChange={e => setFilter(f => ({ ...f, city: e.target.value }))}
              placeholder="City (e.g. Indore)"
              className="flex-1 min-w-[140px] bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-500/50" />
            <button onClick={searchDonors} disabled={searching}
              className="flex items-center gap-2 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50">
              <Search className="w-4 h-4" /> {searching ? 'Dhundh raha...' : 'Dhundho'}
            </button>
          </div>
          {donors.length === 0 ? (
            <div className="text-center py-16">
              <Users className="w-12 h-12 text-slate-700 mx-auto mb-4" />
              <p className="text-slate-400">Blood group aur city daal ke donors dhundho</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-slate-400 text-sm">{donors.length} donor(s) mile</p>
              {donors.map(d => <DonorCard key={d._id} donor={d} />)}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: My Requests ── */}
      {tab === 'mine' && (
        <div className="space-y-3">
          {myRequests.length === 0 ? (
            <div className="text-center py-16">
              <AlertTriangle className="w-12 h-12 text-slate-700 mx-auto mb-4" />
              <p className="text-slate-400">Aapne abhi koi request nahi bheji</p>
              <button onClick={() => setShowReqModal(true)}
                className="mt-4 px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-semibold transition-all">
                Pehli Request Bhejein
              </button>
            </div>
          ) : (
            myRequests.map(r => (
              <RequestCard key={r._id} request={r}
                onRespond={handleRespond}
                isOwnRequest={true}
                onClose={handleCloseRequest}
                isNew={false} />
            ))
          )}
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {showDonorModal && (
          <DonorRegisterModal existing={myProfile}
            onClose={() => setShowDonorModal(false)}
            onSave={(data) => { setMyProfile(data); setShowDonorModal(false); }} />
        )}
        {showReqModal && (
          <CreateRequestModal
            onClose={() => setShowReqModal(false)}
            onSave={(data) => {
              setRequests(prev => [data, ...prev]);
              setMyRequests(prev => [data, ...prev]);
              setShowReqModal(false);
            }} />
        )}
      </AnimatePresence>
    </div>
  );
}