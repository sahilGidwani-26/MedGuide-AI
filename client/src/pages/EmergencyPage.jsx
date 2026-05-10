import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle, Phone, Navigation, MapPin, ArrowLeft,
  BookmarkPlus, ExternalLink, Loader2, RefreshCw, Heart
} from 'lucide-react';
import { hospitalAPI, userAPI } from '../services/api';
import useUserLocation from '../hooks/useUserLocation';
import toast from 'react-hot-toast';

const emergencyNumbers = [
  { label: 'Emergency', number: '112', color: 'bg-danger-600 hover:bg-danger-500', textColor: 'text-white', icon: '🚨' },
  { label: 'Ambulance', number: '108', color: 'bg-red-700 hover:bg-red-600', textColor: 'text-white', icon: '🚑' },
  { label: 'Police', number: '100', color: 'bg-blue-700 hover:bg-blue-600', textColor: 'text-white', icon: '👮' },
  { label: 'Fire', number: '101', color: 'bg-orange-700 hover:bg-orange-600', textColor: 'text-white', icon: '🔥' },
];

export default function EmergencyPage() {
  const navigate = useNavigate();
  const { location, loading: locLoading, error: locError } = useUserLocation();
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState({});

  // Pulsing background animation timer
  const [pulse, setPulse] = useState(true);
  useEffect(() => {
    const t = setInterval(() => setPulse(p => !p), 1500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (location) fetchEmergencyHospitals();
  }, [location]);

  const fetchEmergencyHospitals = async () => {
    if (!location) return;
    setLoading(true);
    try {
      const { data } = await hospitalAPI.getEmergency({ lat: location.lat, lng: location.lng });
      setHospitals(data.data.hospitals);
      // Offline save
      localStorage.setItem('medguide_emergency', JSON.stringify({
        hospitals: data.data.hospitals.slice(0, 5),
        timestamp: Date.now()
      }));
      if (data.data.warningMessage) toast(data.data.warningMessage, { icon: '⚠️', duration: 6000 });
    } catch {
      // Load from offline cache
      const cached = localStorage.getItem('medguide_emergency');
      if (cached) {
        const { hospitals: cachedH } = JSON.parse(cached);
        setHospitals(cachedH);
        toast('Using cached emergency data', { icon: '📦' });
      }
    } finally { setLoading(false); }
  };

  const handleSave = async (hospital, index) => {
    setSaving(p => ({ ...p, [index]: true }));
    try {
      await userAPI.saveHospital({
        name: hospital.name,
        address: hospital.address,
        phone: hospital.phone,
        lat: hospital.lat,
        lng: hospital.lng,
        distance: hospital.distanceText
      });
      toast.success('Hospital saved for quick access');
    } catch { toast.error('Failed to save'); }
    finally { setSaving(p => ({ ...p, [index]: false })); }
  };

  const handleNavigate = (hospital) => {
    window.open(`https://www.openstreetmap.org/directions?to=${hospital.lat},${hospital.lng}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      {/* Animated danger background */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          animate={{ opacity: pulse ? 0.06 : 0.02 }}
          transition={{ duration: 1.5 }}
          className="absolute inset-0 bg-danger-600 rounded-full"
          style={{ transform: 'scale(2)' }}
        />
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-danger-600 via-danger-400 to-danger-600 animate-pulse" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" /> Back
          </button>
          <button
            onClick={fetchEmergencyHospitals}
            disabled={loading || locLoading}
            className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Emergency banner */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="glass border border-danger-500/50 p-6 rounded-2xl text-center relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-danger-600/5" />
          <div className="relative">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-danger-600/30 flex items-center justify-center">
                  <AlertTriangle className="w-10 h-10 text-danger-400" />
                </div>
                <span className="absolute inset-0 rounded-full bg-danger-500/20 animate-ping" />
                <span className="absolute -inset-2 rounded-full bg-danger-500/10 animate-ping" style={{ animationDelay: '0.7s' }} />
              </div>
            </div>
            <h1 className="font-display text-3xl font-extrabold text-danger-300 mb-2">Emergency Mode</h1>
            <p className="text-slate-400 text-sm">If this is a life-threatening emergency, call 112 immediately</p>
          </div>
        </motion.div>

        {/* Emergency numbers */}
        <div>
          <h2 className="font-display text-lg font-bold text-white mb-3">Quick Call</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {emergencyNumbers.map(en => (
              <motion.button
                key={en.number}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.open(`tel:${en.number}`)}
                className={`${en.color} ${en.textColor} p-4 rounded-2xl flex flex-col items-center gap-2 shadow-xl transition-all active:scale-95`}
              >
                <span className="text-2xl">{en.icon}</span>
                <span className="font-display font-bold text-xl">{en.number}</span>
                <span className="text-xs opacity-80">{en.label}</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Location status */}
        {(locLoading || locError) && (
          <div className={`glass p-4 rounded-xl border ${locError ? 'border-danger-500/30' : 'border-primary-500/20'} flex items-center gap-3`}>
            {locLoading ? (
              <><Loader2 className="w-5 h-5 text-primary-400 animate-spin" /><p className="text-slate-400 text-sm">Getting your location...</p></>
            ) : (
              <><AlertTriangle className="w-5 h-5 text-danger-400" /><p className="text-slate-400 text-sm">{locError}</p></>
            )}
          </div>
        )}

        {/* Nearest hospital highlight */}
        {hospitals.length > 0 && (
          <div>
            <h2 className="font-display text-lg font-bold text-white mb-3 flex items-center gap-2">
              <Heart className="w-5 h-5 text-danger-400" />
              Nearest Emergency Hospital
            </h2>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass border border-danger-500/40 p-5 rounded-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-danger-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="relative">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-white font-bold text-lg">{hospitals[0].name}</h3>
                    <p className="text-slate-400 text-sm mt-1">{hospitals[0].address}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="badge-emergency">Emergency</span>
                      <span className="text-danger-300 font-bold text-lg">{hospitals[0].distanceText}</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-danger-500/20 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-6 h-6 text-danger-400" />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleNavigate(hospitals[0])}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-sm font-semibold transition-all"
                  >
                    <Navigation className="w-4 h-4" /> Navigate Now
                  </button>
                  {hospitals[0].phone && (
                    <button
                      onClick={() => window.open(`tel:${hospitals[0].phone}`)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-danger-600 hover:bg-danger-500 text-white text-sm font-semibold transition-all"
                    >
                      <Phone className="w-4 h-4" /> Call Hospital
                    </button>
                  )}
                  <button
                    onClick={() => handleSave(hospitals[0], 0)}
                    disabled={saving[0]}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-all"
                  >
                    {saving[0] ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookmarkPlus className="w-4 h-4" />}
                    Save
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* All emergency hospitals */}
        {hospitals.length > 1 && (
          <div>
            <h2 className="font-display text-lg font-bold text-white mb-3">Other Emergency Hospitals</h2>
            <div className="space-y-3">
              {hospitals.slice(1, 6).map((hospital, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="glass p-4 rounded-xl border border-white/[0.06] flex items-center gap-4"
                >
                  <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-red-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm truncate">{hospital.name}</p>
                    <p className="text-slate-500 text-xs truncate">{hospital.address}</p>
                    <p className="text-primary-400 text-xs font-semibold mt-0.5">{hospital.distanceText}</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleNavigate(hospital)}
                      className="w-9 h-9 rounded-xl bg-primary-600/30 hover:bg-primary-600/50 text-primary-400 flex items-center justify-center transition-all"
                    >
                      <Navigation className="w-4 h-4" />
                    </button>
                    {hospital.phone && (
                      <button
                        onClick={() => window.open(`tel:${hospital.phone}`)}
                        className="w-9 h-9 rounded-xl bg-danger-600/30 hover:bg-danger-600/50 text-danger-400 flex items-center justify-center transition-all"
                      >
                        <Phone className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {loading && hospitals.length === 0 && (
          <div className="flex flex-col items-center py-12 gap-3">
            <Loader2 className="w-10 h-10 text-danger-400 animate-spin" />
            <p className="text-slate-400 text-sm">Finding emergency hospitals near you...</p>
          </div>
        )}

        {/* Disclaimer */}
        <p className="text-slate-700 text-xs text-center pb-4">
          ⚠️ In a life-threatening emergency, always call 112 first. Don't rely solely on this app.
        </p>
      </div>
    </div>
  );
}
