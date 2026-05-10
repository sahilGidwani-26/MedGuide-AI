import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, Phone, Navigation, Bookmark, BookmarkCheck,
  AlertTriangle, RefreshCw, Search, Loader2,
  Building2, Pill, Stethoscope, Info
} from 'lucide-react';
import { hospitalAPI, userAPI } from '../services/api';
import useUserLocation from '../hooks/useUserLocation';
import toast from 'react-hot-toast';

const typeConfig = {
  hospital: { icon: Building2, label: 'Hospital', color: 'text-red-400', bg: 'bg-red-400/10' },
  clinic:   { icon: Stethoscope, label: 'Clinic', color: 'text-blue-400', bg: 'bg-blue-400/10' },
  doctors:  { icon: Stethoscope, label: 'Doctor', color: 'text-blue-400', bg: 'bg-blue-400/10' },
  pharmacy: { icon: Pill, label: 'Pharmacy', color: 'text-green-400', bg: 'bg-green-400/10' },
  default:  { icon: MapPin, label: 'Medical', color: 'text-primary-400', bg: 'bg-primary-400/10' },
};

export default function NearbyHospitalsPage() {
  const { location, error: locError, loading: locLoading, refresh } = useUserLocation();
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [savedHospitals, setSavedHospitals] = useState([]);
  const [warningMessage, setWarningMessage] = useState('');
  const [searchRadiusKm, setSearchRadiusKm] = useState(null);
  const [message, setMessage] = useState('');

  const fetchHospitals = useCallback(async () => {
    if (!location) return;
    setLoading(true);
    setPlaces([]);
    try {
      const { data } = await hospitalAPI.getNearby({
        lat: location.lat,
        lng: location.lng,
        type: filter === 'all' ? 'all' : filter
      });

      setPlaces(data.data.places);
      setSearchRadiusKm(data.data.searchRadiusKm);
      setMessage(data.data.message || '');

      // Only show warning if NO emergency hospital at all
      if (!data.data.hasNearbyEmergency) {
        setWarningMessage('No emergency hospital detected nearby. Call 112 if needed.');
      } else {
        setWarningMessage('');
      }

      // Cache for offline
      localStorage.setItem('medguide_nearby', JSON.stringify({
        places: data.data.places.slice(0, 10),
        timestamp: Date.now()
      }));

    } catch (err) {
      toast.error('Failed to fetch nearby places');
      const cached = localStorage.getItem('medguide_nearby');
      if (cached) {
        const { places: cachedPlaces } = JSON.parse(cached);
        setPlaces(cachedPlaces);
        toast('Showing cached data', { icon: '📦' });
      }
    } finally { setLoading(false); }
  }, [location, filter]);

  useEffect(() => { fetchHospitals(); }, [fetchHospitals]);

  useEffect(() => {
    userAPI.getSavedHospitals()
      .then(res => setSavedHospitals(res.data.data || []))
      .catch(() => {});
  }, []);

  const handleSave = async (place) => {
    const alreadySaved = savedHospitals.some(h => h.lat === place.lat && h.lng === place.lng);
    if (alreadySaved) return toast('Already saved', { icon: '✓' });
    try {
      await userAPI.saveHospital({
        name: place.name, address: place.address,
        phone: place.phone, lat: place.lat,
        lng: place.lng, distance: place.distanceText
      });
      setSavedHospitals(prev => [...prev, { lat: place.lat, lng: place.lng }]);
      toast.success('Hospital saved!');
    } catch { toast.error('Failed to save'); }
  };

  const isSaved = (place) => savedHospitals.some(h => h.lat === place.lat && h.lng === place.lng);

  const filtered = places.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.address.toLowerCase().includes(search.toLowerCase())
  );

  const filterTabs = [
    { value: 'all', label: 'All' },
    { value: 'hospital', label: 'Hospitals' },
    { value: 'clinic', label: 'Clinics' },
    { value: 'pharmacy', label: 'Pharmacies' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-white mb-1">Nearby Medical Places</h1>
          <p className="text-slate-400 text-sm">
            {loading ? 'Searching nearby locations...' :
             searchRadiusKm ? `Showing results within ${searchRadiusKm}km of your location` :
             'Getting your location...'}
          </p>
        </div>
        <button
          onClick={() => { refresh(); setTimeout(fetchHospitals, 500); }}
          disabled={loading || locLoading}
          className="btn-ghost flex items-center gap-2 self-start"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Location error */}
      {locError && (
        <div className="glass border border-amber-500/30 p-4 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-amber-300 font-medium text-sm">Location Access Required</p>
            <p className="text-slate-400 text-xs mt-1">{locError}</p>
          </div>
        </div>
      )}

      {/* Radius info badge */}
      {searchRadiusKm && !loading && (
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Info className="w-4 h-4 text-primary-400" />
          <span>
            Auto-searched within <span className="text-primary-400 font-semibold">{searchRadiusKm}km</span> radius
            {searchRadiusKm > 5 && <span className="text-slate-500"> — expanded because fewer results found nearby</span>}
          </span>
        </div>
      )}

      {/* Emergency warning */}
      {warningMessage && !loading && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass border border-danger-500/40 p-4 rounded-xl flex items-start gap-3"
        >
          <AlertTriangle className="w-5 h-5 text-danger-400 flex-shrink-0 mt-0.5 animate-pulse" />
          <div>
            <p className="text-danger-300 font-medium text-sm">{warningMessage}</p>
            <button onClick={() => window.open('tel:112')} className="text-danger-400 text-xs hover:text-danger-300 mt-1">
              📞 Call 112 Emergency
            </button>
          </div>
        </motion.div>
      )}

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search hospitals, clinics..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field pl-11"
          />
        </div>
        <div className="flex gap-1 glass p-1 rounded-xl">
          {filterTabs.map(tab => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === tab.value
                  ? 'bg-primary-500/30 text-primary-300'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Count */}
      <div className="flex items-center justify-between text-sm text-slate-500">
        <span>{filtered.length} places found</span>
        {loading && (
          <div className="flex items-center gap-2 text-primary-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            Auto-expanding search radius...
          </div>
        )}
      </div>

      {/* Loading skeletons */}
      {loading && places.length === 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => <div key={i} className="skeleton h-52 rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 && !loading ? (
        <div className="text-center py-16">
          <MapPin className="w-14 h-14 text-slate-700 mx-auto mb-4" />
          <p className="text-slate-400 font-medium">No places found within 20km</p>
          <p className="text-slate-600 text-sm mt-1">Try refreshing or check your location settings</p>
          <button onClick={fetchHospitals} className="btn-outline mt-4 flex items-center gap-2 mx-auto">
            <RefreshCw className="w-4 h-4" /> Try Again
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filtered.map((place, i) => {
              const typeCfg = typeConfig[place.type] || typeConfig.default;
              const saved = isSaved(place);
              return (
                <motion.div
                  key={place.id || i}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.04, 0.4) }}
                  className={`card relative group ${place.isEmergency ? 'border-red-500/20' : ''}`}
                >
                  {place.isEmergency && (
                    <span className="absolute top-4 right-4 badge-emergency text-xs">Emergency</span>
                  )}

                  <div className={`w-10 h-10 rounded-xl ${typeCfg.bg} flex items-center justify-center mb-3`}>
                    <typeCfg.icon className={`w-5 h-5 ${typeCfg.color}`} />
                  </div>

                  <h3 className="text-white font-semibold text-sm leading-snug mb-1 pr-16">{place.name}</h3>
                  <p className="text-slate-500 text-xs mb-3 line-clamp-2">{place.address}</p>

                  <div className="flex items-center gap-2 mb-4">
                    <span className="badge badge-info text-xs">{typeCfg.label}</span>
                    <span className="text-primary-400 text-xs font-semibold">{place.distanceText}</span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => window.open(`https://www.openstreetmap.org/directions?to=${place.lat},${place.lng}`, '_blank')}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-primary-500/20 text-primary-400 hover:bg-primary-500/30 text-xs font-medium transition-all"
                    >
                      <Navigation className="w-3.5 h-3.5" /> Directions
                    </button>
                    {place.phone && (
                      <button
                        onClick={() => window.open(`tel:${place.phone}`)}
                        className="px-3 py-2 rounded-xl bg-white/5 text-slate-400 hover:bg-white/10 transition-all"
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleSave(place)}
                      className={`px-3 py-2 rounded-xl transition-all ${
                        saved ? 'bg-amber-500/20 text-amber-400' : 'bg-white/5 text-slate-400 hover:bg-white/10'
                      }`}
                    >
                      {saved ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}