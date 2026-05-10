import { useState, useEffect, useCallback } from 'react';

const CACHE_KEY = 'medguide_location';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const useUserLocation = () => {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const getLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    // Check cache
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_TTL) {
        setLocation(data);
        return;
      }
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy
        };
        setLocation(loc);
        setLoading(false);
        // Cache it
        localStorage.setItem(CACHE_KEY, JSON.stringify({ data: loc, timestamp: Date.now() }));
      },
      (err) => {
        const messages = {
          1: 'Location permission denied. Please allow location access.',
          2: 'Location unavailable. Check your device settings.',
          3: 'Location request timed out.'
        };
        setError(messages[err.code] || 'Failed to get location');
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: CACHE_TTL }
    );
  }, []);

  useEffect(() => { getLocation(); }, [getLocation]);

  return { location, error, loading, refresh: getLocation };
};

export default useUserLocation;
