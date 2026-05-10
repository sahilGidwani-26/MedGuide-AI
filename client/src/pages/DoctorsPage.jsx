import { useState, useEffect } from 'react';
import {
  Search, MapPin, Navigation, Star, Award, Phone,
  Calendar, Sparkles, Loader2, RefreshCw, Trophy,
  Stethoscope, Heart, Brain, Bone, Eye, Ear,
  Baby, UserRound, Activity, ChevronDown, ChevronUp,
  ExternalLink, Clock, Building2, CheckCircle2
} from 'lucide-react';
import { doctorAPI } from '../services/api';
import useUserLocation from '../hooks/useUserLocation';
import toast from 'react-hot-toast';

const SPECIALIZATIONS = [
  { label: 'All',              icon: Stethoscope },
  { label: 'General Physician',icon: Activity     },
  { label: 'Cardiologist',     icon: Heart        },
  { label: 'Neurologist',      icon: Brain        },
  { label: 'Orthopedic',       icon: Bone         },
  { label: 'Dermatologist',    icon: UserRound    },
  { label: 'Pediatrician',     icon: Baby         },
  { label: 'Gynecologist',     icon: UserRound    },
  { label: 'Ophthalmologist',  icon: Eye          },
  { label: 'ENT',              icon: Ear          },
  { label: 'Dentist',          icon: Stethoscope  },
];

const SPEC_COLORS = {
  'General Physician': '#10b981',
  'Cardiologist':      '#ef4444',
  'Neurologist':       '#8b5cf6',
  'Orthopedic':        '#3b82f6',
  'Dermatologist':     '#f59e0b',
  'Pediatrician':      '#f472b6',
  'Gynecologist':      '#ec4899',
  'Ophthalmologist':   '#06b6d4',
  'ENT':               '#84cc16',
  'Dentist':           '#a78bfa',
};

const RANK_COLORS = { 1: '#f59e0b', 2: '#94a3b8', 3: '#b45309' };
const RANK_LABELS = { 1: 'AI Top Pick', 2: '2nd Best', 3: '3rd Best' };

function StarRow({ rating, count }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          className="w-3 h-3"
          fill={i <= Math.round(rating) ? '#f59e0b' : 'transparent'}
          stroke={i <= Math.round(rating) ? '#f59e0b' : '#374151'}
        />
      ))}
      <span className="text-amber-400 font-bold text-xs ml-1">{rating}</span>
      {count !== undefined && (
        <span className="text-slate-600 text-xs">({count})</span>
      )}
    </div>
  );
}

function SpecIcon({ spec, size = 'md' }) {
  const found = SPECIALIZATIONS.find(s => s.label === spec);
  const Icon  = found?.icon || Stethoscope;
  const color = SPEC_COLORS[spec] || '#6366f1';
  const cls   = size === 'sm' ? 'w-3.5 h-3.5' : 'w-5 h-5';
  return <Icon className={cls} style={{ color }} />;
}

export default function DoctorsPage() {
  const { location } = useUserLocation();

  const [doctors,         setDoctors]         = useState([]);
  const [loading,         setLoading]         = useState(false);
  const [search,          setSearch]          = useState('');
  const [specFilter,      setSpecFilter]      = useState('All');
  const [cityInput,       setCityInput]       = useState('');
  const [cityName,        setCityName]        = useState('');
  const [symptoms,        setSymptoms]        = useState('');
  const [aiRecommendation,setAiRecommendation]= useState(null);
  const [total,           setTotal]           = useState(0);
  const [expanded,        setExpanded]        = useState(null);
  const [sortBy,          setSortBy]          = useState('distance');
  const [searched,        setSearched]        = useState(false);

  // Auto-load on mount if location available
  useEffect(() => {
    if (location) {
      fetchDoctors(null, location.lat, location.lng);
    }
  }, [location]);

  const fetchDoctors = async (city = null, lat = null, lng = null) => {
    setLoading(true);
    setAiRecommendation(null);
    setExpanded(null);
    setSearched(true);
    try {
      const params = { page: 1, limit: 20 };
      if (specFilter !== 'All') params.specialization = specFilter;
      if (search)   params.search   = search;
      if (symptoms) params.symptoms = symptoms;
      if (city)     params.city     = city;
      if (lat && lng) { params.lat = lat; params.lng = lng; }

      const { data } = await doctorAPI.getAll(params);
      setDoctors(data.data || []);
      setTotal(data.pagination?.total || data.data?.length || 0);
      setCityName(data.cityName || city || '');
      if (data.aiRecommendation) setAiRecommendation(data.aiRecommendation);

      if (!data.data?.length) toast('Koi doctor nahi mila. Alag city try karein.', { icon: '🔍' });
    } catch {
      toast.error('Doctors load karne mein error. Dobara try karein.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (!cityInput.trim()) return toast.error('City naam likhein pehle');
    fetchDoctors(cityInput.trim());
  };

  const handleUseLocation = () => {
    if (!location) return toast.error('Location access allow karein');
    setCityInput('');
    setCityName('Aapki Location');
    fetchDoctors(null, location.lat, location.lng);
  };

  const handleSpecChange = (spec) => {
    setSpecFilter(spec);
    if (searched) {
      setTimeout(() => {
        const params = { page: 1, limit: 20, specialization: spec !== 'All' ? spec : undefined };
        if (search)   params.search   = search;
        if (symptoms) params.symptoms = symptoms;
        if (cityInput) params.city    = cityInput;
        else if (location) { params.lat = location.lat; params.lng = location.lng; }
        doctorAPI.getAll(params)
          .then(({ data }) => {
            setDoctors(data.data || []);
            setAiRecommendation(data.aiRecommendation || null);
          })
          .catch(() => {});
      }, 50);
    }
  };

  // Sorted list
  const sorted = [...doctors].sort((a, b) => {
    if (sortBy === 'distance') return (a.distance ?? 999) - (b.distance ?? 999);
    if (sortBy === 'rating')   return (b.rating || 0) - (a.rating || 0);
    if (sortBy === 'fee')      return (a.consultationFee || 0) - (b.consultationFee || 0);
    return 0;
  });

  // AI top-pick helpers
  const getPickRank   = (i) => aiRecommendation?.topPicks?.find(p => p.doctorIndex - 1 === i)?.rank;
  const getPickReason = (i) => aiRecommendation?.topPicks?.find(p => p.doctorIndex - 1 === i)?.reason;

  return (
    <div className="space-y-5 animate-fade-in">

      {/* ── Page header ── */}
      <div>
        <h1 className="font-display text-3xl font-bold text-white mb-1">Find Doctors</h1>
        <p className="text-slate-400 text-sm">
          Koi bhi city search karo — real hospitals &amp; doctors milenge
        </p>
      </div>

      {/* ── City search card ── */}
      <div className="card border border-primary-500/20 space-y-3">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary-400" />
          City se Doctors Dhundho
        </h3>

        {/* City input row */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Satna, Indore, Bhopal, Mumbai…"
              value={cityInput}
              onChange={e => setCityInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              className="input-field pl-10 w-full"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading}
            className="btn-primary flex items-center justify-center gap-2 flex-shrink-0"
          >
            {loading
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Search className="w-4 h-4" />}
            Search
          </button>
          <button
            onClick={handleUseLocation}
            disabled={loading || !location}
            className="btn-ghost flex items-center justify-center gap-2 flex-shrink-0"
          >
            <Navigation className="w-4 h-4" />
            My Location
          </button>
        </div>

        {/* Symptoms input */}
        <div>
          <input
            type="text"
            placeholder="Symptoms batao AI recommendation ke liye (e.g. chest pain, fever)"
            value={symptoms}
            onChange={e => setSymptoms(e.target.value)}
            className="input-field text-sm w-full"
          />
          <p className="text-slate-600 text-xs mt-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Symptoms add karo AI doctor recommendation ke liye
          </p>
        </div>

        {/* Quick city buttons */}
        <div className="flex flex-wrap gap-2 pt-1">
          {['Satna', 'Indore', 'Bhopal', 'Jabalpur', 'Mumbai', 'Delhi'].map(c => (
            <button
              key={c}
              onClick={() => { setCityInput(c); fetchDoctors(c); }}
              className="px-3 py-1 rounded-full text-xs font-medium bg-white/5 text-slate-400
                         border border-white/10 hover:bg-white/10 hover:text-white transition-all"
            >
              📍 {c}
            </button>
          ))}
        </div>
      </div>

      {/* ── AI Recommendation banner ── */}
      {aiRecommendation && (
        <div className="glass border border-violet-500/30 p-4 rounded-2xl space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-500/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-violet-400" />
            </div>
            <div>
              <h3 className="text-white font-bold text-sm">AI Doctor Recommendation</h3>
              <p className="text-slate-500 text-xs">Powered by Groq AI</p>
            </div>
          </div>

          {aiRecommendation.generalAdvice && (
            <p className="text-slate-300 text-sm pl-1">
              💬 {aiRecommendation.generalAdvice}
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            {aiRecommendation.topPicks?.map((pick, i) => (
              <div
                key={i}
                className="flex items-start gap-2 px-3 py-2 rounded-xl text-xs border"
                style={{
                  background: `${RANK_COLORS[pick.rank]}15`,
                  borderColor: `${RANK_COLORS[pick.rank]}35`,
                  color: RANK_COLORS[pick.rank],
                }}
              >
                <Trophy className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">
                    #{pick.rank} {doctors[pick.doctorIndex - 1]?.name || `Doctor ${pick.doctorIndex}`}
                  </span>
                  <p className="opacity-75 mt-0.5 font-normal">{pick.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Filters row ── */}
      <div className="space-y-3">
        {/* Search by name */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Doctor naam se search karo…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchDoctors(cityInput || null, location?.lat, location?.lng)}
            className="input-field pl-10 w-full"
          />
        </div>

        {/* Specialization pills */}
        <div className="flex flex-wrap gap-2">
          {SPECIALIZATIONS.map(({ label, icon: Icon }) => (
            <button
              key={label}
              onClick={() => handleSpecChange(label)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
                          transition-all border ${
                specFilter === label
                  ? 'bg-primary-500/25 text-primary-300 border-primary-500/40'
                  : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
              }`}
            >
              <Icon className="w-3 h-3" />
              {label}
            </button>
          ))}
        </div>

        {/* Sort + result count */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="text-slate-500 text-sm">
            {loading
              ? 'Searching…'
              : searched
              ? `${doctors.length} doctors mile${cityName ? ` in ${cityName}` : ''}`
              : 'City search karo doctors dekhne ke liye'}
          </span>
          {doctors.length > 0 && (
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="text-xs bg-white/5 border border-white/10 text-slate-300
                         rounded-lg px-3 py-1.5 outline-none cursor-pointer"
            >
              <option value="distance">📏 Distance</option>
              <option value="rating">⭐ Rating</option>
              <option value="fee">💰 Fee (kam se)</option>
            </select>
          )}
        </div>
      </div>

      {/* ── Loading skeletons ── */}
      {loading && (
        <div className="grid sm:grid-cols-2 gap-4">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="skeleton h-52 rounded-2xl" />
          ))}
        </div>
      )}

      {/* ── Empty states ── */}
      {!loading && searched && doctors.length === 0 && (
        <div className="text-center py-20 space-y-3">
          <MapPin className="w-14 h-14 text-slate-700 mx-auto" />
          <h3 className="text-slate-400 font-semibold">Koi doctor nahi mila</h3>
          <p className="text-slate-600 text-sm">
            Alag city naam try karo ya spelling check karo
          </p>
          <button
            onClick={() => fetchDoctors(cityInput || null, location?.lat, location?.lng)}
            className="btn-outline flex items-center gap-2 mx-auto"
          >
            <RefreshCw className="w-4 h-4" /> Try Again
          </button>
        </div>
      )}

      {!loading && !searched && (
        <div className="text-center py-20 space-y-3">
          <Building2 className="w-14 h-14 text-slate-700 mx-auto" />
          <h3 className="text-slate-400 font-semibold">Koi bhi city search karo</h3>
          <p className="text-slate-600 text-sm">
            Satna, Indore, Mumbai — India ki koi bhi city ke doctors dekhein
          </p>
        </div>
      )}

      {/* ── Doctor Cards Grid ── */}
      {!loading && sorted.length > 0 && (
        <div className="grid sm:grid-cols-2 gap-4">
          {sorted.map((doc, i) => {
            const rank     = getPickRank(i);
            const reason   = getPickReason(i);
            const isOpen   = expanded === (doc._id || i);
            const color    = SPEC_COLORS[doc.specialization] || '#6366f1';
            const fee      = doc.consultationFee ?? doc.fee;

            return (
              <div
                key={doc._id || i}
                className="card group transition-all duration-300 relative overflow-hidden"
                style={{
                  borderLeft: `3px solid ${rank ? RANK_COLORS[rank] : color}`,
                  boxShadow: rank === 1 ? `0 0 20px ${RANK_COLORS[1]}20` : undefined,
                }}
              >
                {/* Rank strip */}
                {rank && aiRecommendation && (
                  <div
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold -mx-4 -mt-4 mb-3 border-b"
                    style={{
                      background: `${RANK_COLORS[rank]}15`,
                      borderColor: `${RANK_COLORS[rank]}30`,
                      color: RANK_COLORS[rank],
                    }}
                  >
                    <Trophy className="w-3.5 h-3.5" />
                    {RANK_LABELS[rank]}
                  </div>
                )}

                {/* Header */}
                <div className="flex items-start gap-3 mb-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${color}18`, border: `1.5px solid ${color}30` }}
                  >
                    <SpecIcon spec={doc.specialization} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="text-white font-bold text-sm truncate">{doc.name}</h3>
                        <p className="text-xs font-semibold mt-0.5" style={{ color }}>
                          {doc.specialization}
                        </p>
                        <p className="text-slate-600 text-xs">{doc.qualification || 'MBBS'}</p>
                      </div>
                      {doc.isVerified && (
                        <CheckCircle2 className="w-4 h-4 text-primary-400 flex-shrink-0 mt-0.5" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Meta row */}
                <div className="space-y-1.5 mb-3">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Award className="w-3.5 h-3.5" />
                      <span>{doc.experience || '—'} yrs exp</span>
                    </div>
                    <StarRow rating={doc.rating} count={doc.reviewCount} />
                  </div>

                  {doc.distanceText && (
                    <div className="flex items-center gap-1.5 text-xs text-primary-400">
                      <Navigation className="w-3.5 h-3.5" />
                      <span className="font-semibold">{doc.distanceText} away</span>
                    </div>
                  )}

                  {doc.hospital && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{doc.hospital}</span>
                    </div>
                  )}

                  {doc.address && doc.address !== 'Address not available' && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{doc.address}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${doc.availability ?? doc.available ? 'bg-green-400' : 'bg-slate-600'}`} />
                      <span className={`text-xs ${doc.availability ?? doc.available ? 'text-green-400' : 'text-slate-600'}`}>
                        {doc.availability ?? doc.available ? 'Available' : 'Unavailable'}
                      </span>
                    </div>
                    <span className="text-xs text-slate-300 font-semibold">
                      {fee === 0 ? '🆓 Free' : `₹${fee}`}
                    </span>
                  </div>
                </div>

                {/* AI reason */}
                {reason && aiRecommendation && (
                  <div className="mb-3 px-3 py-2 rounded-xl bg-violet-500/10 border border-violet-500/20">
                    <p className="text-violet-300 text-xs flex items-start gap-1.5">
                      <Sparkles className="w-3 h-3 flex-shrink-0 mt-0.5" />
                      {reason}
                    </p>
                  </div>
                )}

                {/* Expand toggle */}
                <button
                  onClick={() => setExpanded(isOpen ? null : (doc._id || i))}
                  className="w-full flex items-center justify-center gap-1 text-xs text-slate-500
                             hover:text-slate-300 transition-colors py-1"
                >
                  {isOpen ? (
                    <><ChevronUp className="w-3.5 h-3.5" /> Hide details</>
                  ) : (
                    <><ChevronDown className="w-3.5 h-3.5" /> More details</>
                  )}
                </button>

                {/* Expanded section */}
                {isOpen && (
                  <div className="mt-2 pt-3 border-t border-white/[0.06] space-y-2">
                    {doc.phone && (
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Phone className="w-3.5 h-3.5 text-slate-500" />
                        <a href={`tel:${doc.phone}`} className="text-primary-400 font-semibold hover:underline">
                          {doc.phone}
                        </a>
                      </div>
                    )}
                    {doc.openingHours && (
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{doc.openingHours}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-2 mt-3 pt-3 border-t border-white/[0.06]">
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${doc.lat},${doc.lng}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl
                               bg-primary-500/20 text-primary-400 hover:bg-primary-500/30
                               text-xs font-semibold transition-all"
                  >
                    <Navigation className="w-3.5 h-3.5" /> Directions
                  </a>
                  {doc.phone ? (
                    <a
                      href={`tel:${doc.phone}`}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl
                                 bg-green-500/10 text-green-400 hover:bg-green-500/20
                                 text-xs font-semibold transition-all"
                    >
                      <Phone className="w-3.5 h-3.5" /> Call
                    </a>
                  ) : (
                    <a
                      href={`https://www.google.com/maps/search/${encodeURIComponent(doc.name)}`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl
                                 bg-white/5 text-slate-400 hover:bg-white/10
                                 text-xs font-semibold transition-all"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Maps
                    </a>
                  )}
                  <button
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl
                               bg-white/5 text-slate-400 hover:bg-white/10
                               text-xs font-semibold transition-all"
                  >
                    <Calendar className="w-3.5 h-3.5" /> Book
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}