import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { MapPin, RefreshCw, AlertTriangle, Navigation, Phone } from 'lucide-react';
import { hospitalAPI } from '../services/api';
import useUserLocation from '../hooks/useUserLocation';
import toast from 'react-hot-toast';

// Lazy load leaflet to avoid SSR issues
let MapContainer, TileLayer, Marker, Popup, Circle, useMap;
let L;

const initLeaflet = async () => {
  if (typeof window === 'undefined') return false;
  try {
    const leaflet = await import('leaflet');
    L = leaflet.default;
    const rl = await import('react-leaflet');
    MapContainer = rl.MapContainer;
    TileLayer = rl.TileLayer;
    Marker = rl.Marker;
    Popup = rl.Popup;
    Circle = rl.Circle;
    return true;
  } catch { return false; }
};

const createIcon = (color, size = 12) => {
  if (!L) return null;
  return L.divIcon({
    html: `<div style="
      width:${size}px;height:${size}px;
      background:${color};
      border-radius:50%;
      border:2px solid rgba(255,255,255,0.6);
      box-shadow:0 0 10px ${color}80;
    "></div>`,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

export default function LiveMapPage() {
  const { location, error: locError, loading: locLoading, refresh } = useUserLocation();
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [MapComponents, setMapComponents] = useState(null);

  useEffect(() => {
    initLeaflet().then(ok => {
      if (ok) {
        setMapComponents({ MapContainer, TileLayer, Marker, Popup, Circle });
        setMapReady(true);
      }
    });
  }, []);

  const fetchPlaces = useCallback(async () => {
    if (!location) return;
    setLoading(true);
    try {
      const { data } = await hospitalAPI.getNearby({
        lat: location.lat,
        lng: location.lng,
        radius: 5000
      });
      setPlaces(data.data.places);
    } catch {
      toast.error('Failed to load map data');
    } finally { setLoading(false); }
  }, [location]);

  useEffect(() => { fetchPlaces(); }, [fetchPlaces]);

  if (!mapReady || !location) {
    return (
      <div className="h-[70vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full border-2 border-t-primary-500 border-primary-500/20 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">
            {locLoading ? 'Getting your location...' : locError ? locError : 'Loading map...'}
          </p>
        </div>
      </div>
    );
  }

  const { MapContainer: MC, TileLayer: TL, Marker: MK, Popup: PU, Circle: CL } = MapComponents || {};

  const emergencyIcon = L ? createIcon('#f43f5e', 14) : null;
  const hospitalIcon = L ? createIcon('#15b38a', 12) : null;
  const pharmacyIcon = L ? createIcon('#60a5fa', 10) : null;
  const userIcon = L ? createIcon('#818cf8', 16) : null;

  const getIcon = (place) => {
    if (place.isEmergency) return emergencyIcon;
    if (place.type === 'pharmacy') return pharmacyIcon;
    return hospitalIcon;
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-white mb-1">Live Map</h1>
          <p className="text-slate-400 text-sm">{places.length} medical places nearby</p>
        </div>
        <button
          onClick={() => { refresh(); fetchPlaces(); }}
          disabled={loading}
          className="btn-ghost flex items-center gap-2 self-start"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 glass p-4 rounded-xl">
        {[
          { color: '#818cf8', label: 'Your Location' },
          { color: '#f43f5e', label: 'Emergency Hospital' },
          { color: '#15b38a', label: 'Hospital/Clinic' },
          { color: '#60a5fa', label: 'Pharmacy' },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ background: item.color, boxShadow: `0 0 6px ${item.color}80` }} />
            <span className="text-slate-400 text-xs">{item.label}</span>
          </div>
        ))}
      </div>

      {/* Map */}
      <div className="h-[60vh] rounded-2xl overflow-hidden border border-white/[0.08]">
        <MC
          center={[location.lat, location.lng]}
          zoom={14}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
        >
          <TL
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />

          {/* User location */}
          {userIcon && (
            <MK position={[location.lat, location.lng]} icon={userIcon}>
              <PU>
                <div className="text-sm font-semibold text-white">📍 Your Location</div>
              </PU>
            </MK>
          )}

          {/* Accuracy circle */}
          {location.accuracy && (
            <CL
              center={[location.lat, location.lng]}
              radius={location.accuracy}
              pathOptions={{ color: '#818cf8', fillColor: '#818cf8', fillOpacity: 0.08, weight: 1 }}
            />
          )}

          {/* Hospital markers */}
          {places.map((place, i) => {
            const icon = getIcon(place);
            if (!icon) return null;
            return (
              <MK
                key={i}
                position={[place.lat, place.lng]}
                icon={icon}
                eventHandlers={{ click: () => setSelectedPlace(place) }}
              >
                <PU maxWidth={220}>
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-white font-bold text-sm leading-tight">{place.name}</h4>
                      {place.isEmergency && (
                        <span className="text-xs bg-danger-500/30 text-danger-300 px-2 py-0.5 rounded-full flex-shrink-0">Emergency</span>
                      )}
                    </div>
                    <p className="text-slate-400 text-xs">{place.address}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-primary-400 text-xs font-semibold">{place.distanceText}</span>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <a
                        href={`https://www.openstreetmap.org/directions?to=${place.lat},${place.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-3 py-1.5 bg-primary-500/30 text-primary-300 text-xs rounded-lg hover:bg-primary-500/40 transition-colors"
                      >
                        <Navigation className="w-3 h-3" /> Directions
                      </a>
                      {place.phone && (
                        <a
                          href={`tel:${place.phone}`}
                          className="flex items-center gap-1 px-3 py-1.5 bg-white/10 text-slate-300 text-xs rounded-lg hover:bg-white/20 transition-colors"
                        >
                          <Phone className="w-3 h-3" /> Call
                        </a>
                      )}
                    </div>
                  </div>
                </PU>
              </MK>
            );
          })}
        </MC>
      </div>

      {/* Selected place info */}
      {selectedPlace && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-white font-bold">{selectedPlace.name}</h3>
              <p className="text-slate-400 text-sm mt-1">{selectedPlace.address}</p>
              <p className="text-primary-400 text-sm font-semibold mt-1">{selectedPlace.distanceText} away</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => window.open(`https://www.openstreetmap.org/directions?to=${selectedPlace.lat},${selectedPlace.lng}`, '_blank')}
                className="btn-outline text-sm py-2 px-4 flex items-center gap-2"
              >
                <Navigation className="w-4 h-4" /> Directions
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
