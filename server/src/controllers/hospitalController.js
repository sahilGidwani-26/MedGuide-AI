const https = require('https');

const haversineDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
};

// ── Overpass API ──────────────────────────────────────────────────────────────
const queryOverpass = (query) => new Promise((resolve, reject) => {
  const data = `data=${encodeURIComponent(query)}`;
  const req = https.request({
    hostname: 'overpass-api.de',
    path: '/api/interpreter',
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(data) }
  }, (res) => {
    let body = '';
    res.on('data', c => body += c);
    res.on('end', () => { try { resolve(JSON.parse(body)); } catch { reject(new Error('Overpass parse error')); } });
  });
  req.on('error', reject);
  req.setTimeout(25000, () => { req.destroy(); reject(new Error('Overpass timeout')); });
  req.write(data);
  req.end();
});

// ── Nominatim — bounded to nearby box only ────────────────────────────────────
// boxSize in degrees: 0.2 ≈ 22km, 0.5 ≈ 55km
const queryNominatim = (lat, lng, query, boxSize = 0.3) => new Promise((resolve, reject) => {
  // Create bounding box around user location
  const minLat = lat - boxSize;
  const maxLat = lat + boxSize;
  const minLng = lng - boxSize;
  const maxLng = lng + boxSize;

  // viewbox = left,top,right,bottom  AND bounded=1 means ONLY return results inside box
  const params = new URLSearchParams({
    format: 'json',
    q: query,
    viewbox: `${minLng},${maxLat},${maxLng},${minLat}`,
    bounded: '1',          // ← KEY: only results inside viewbox
    limit: '20',
    addressdetails: '1',
    namedetails: '1',
  });

  const req = https.request({
    hostname: 'nominatim.openstreetmap.org',
    path: `/search?${params.toString()}`,
    method: 'GET',
    headers: { 'User-Agent': 'MedGuideAI/1.0 (healthcare app)' }
  }, (res) => {
    let body = '';
    res.on('data', c => body += c);
    res.on('end', () => { try { resolve(JSON.parse(body)); } catch { reject(new Error('Nominatim parse error')); } });
  });
  req.on('error', reject);
  req.setTimeout(10000, () => { req.destroy(); reject(new Error('Nominatim timeout')); });
  req.end();
});

// ── Parse Overpass ────────────────────────────────────────────────────────────
const parseOverpass = (elements, userLat, userLng) => {
  return (elements || []).map(el => {
    const lat = el.lat || el.center?.lat;
    const lng = el.lon || el.center?.lon;
    if (!lat || !lng) return null;
    const dist = haversineDistance(userLat, userLng, lat, lng);
    const tags = el.tags || {};
    const amenity = tags.amenity || 'healthcare';
    return {
      id: `osm_${el.id}`,
      name: tags.name || tags['name:en'] || tags['name:hi'] || 'Healthcare Facility',
      type: amenity,
      address: [tags['addr:housenumber'], tags['addr:street'], tags['addr:city']].filter(Boolean).join(', ')
        || tags['addr:full'] || 'Address not available',
      phone: tags.phone || tags['contact:phone'] || null,
      lat, lng,
      distance: parseFloat(dist.toFixed(2)),
      distanceText: dist < 1 ? `${Math.round(dist*1000)} m` : `${dist.toFixed(1)} km`,
      isEmergency: amenity === 'hospital' || tags.emergency === 'yes',
      source: 'OSM'
    };
  }).filter(Boolean);
};

// ── Parse Nominatim — filter by max distance ──────────────────────────────────
const parseNominatim = (results, userLat, userLng, maxDistKm = 30) => {
  return (results || [])
    .map((r, i) => {
      const lat = parseFloat(r.lat);
      const lng = parseFloat(r.lon);
      if (isNaN(lat) || isNaN(lng)) return null;
      const dist = haversineDistance(userLat, userLng, lat, lng);
      if (dist > maxDistKm) return null; // ← reject far results

      const nameRaw = r.namedetails?.name || r.display_name?.split(',')[0] || '';
      const isEmergency = r.type === 'hospital'
        || r.class === 'amenity' && r.type === 'hospital'
        || nameRaw.toLowerCase().includes('hospital');

      return {
        id: `nom_${r.place_id || i}`,
        name: nameRaw || 'Healthcare Facility',
        type: isEmergency ? 'hospital' : (r.type === 'pharmacy' ? 'pharmacy' : 'clinic'),
        address: r.display_name || 'Address not available',
        phone: null,
        lat, lng,
        distance: parseFloat(dist.toFixed(2)),
        distanceText: dist < 1 ? `${Math.round(dist*1000)} m` : `${dist.toFixed(1)} km`,
        isEmergency,
        source: 'Nominatim'
      };
    })
    .filter(Boolean);
};

// ── GET /api/hospitals/nearby ─────────────────────────────────────────────────
exports.getNearbyHospitals = async (req, res, next) => {
  try {
    const { lat, lng, type = 'all' } = req.query;
    if (!lat || !lng) return res.status(400).json({ success: false, message: 'Location required' });

    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);

    const amenityMap = {
      hospital: '["amenity"="hospital"]',
      clinic:   '["amenity"~"clinic|doctors"]',
      pharmacy: '["amenity"="pharmacy"]',
      all:      '["amenity"~"hospital|clinic|pharmacy|doctors|emergency"]'
    };
    const amenityFilter = amenityMap[type] || amenityMap.all;

    let places = [];
    let usedRadius = 5;

    // ── Step 1: Overpass expanding radius ──
    for (const radius of [5000, 10000, 20000]) {
      try {
        console.log(`[Overpass] Trying ${radius/1000}km...`);
        const query = `[out:json][timeout:25];(node${amenityFilter}(around:${radius},${userLat},${userLng});way${amenityFilter}(around:${radius},${userLat},${userLng}););out center;`;
        const data = await queryOverpass(query);
        const found = parseOverpass(data.elements, userLat, userLng);
        usedRadius = radius / 1000;
        if (found.length >= 3) { places = found; break; }
        if (found.length > 0) places = [...places, ...found];
      } catch (err) {
        console.log(`[Overpass] ${err.message}`);
      }
    }

    // ── Step 2: Nominatim fallback with BOUNDED box ──
    if (places.length < 3) {
      console.log('[Nominatim] Trying bounded search...');
      const boxSize = 0.25; // ~28km box
      const searchTerms = type === 'pharmacy'
        ? ['pharmacy', 'medical store']
        : ['hospital', 'nursing home', 'clinic', 'dispensary'];

      for (const term of searchTerms) {
        try {
          const results = await queryNominatim(userLat, userLng, term, boxSize);
          const parsed = parseNominatim(results, userLat, userLng, 30);
          console.log(`[Nominatim] "${term}" → ${parsed.length} results within box`);
          places = [...places, ...parsed];
          if (places.length >= 5) break;
          await new Promise(r => setTimeout(r, 300));
        } catch (err) {
          console.log(`[Nominatim] ${term}: ${err.message}`);
        }
      }
      if (places.length > 0) usedRadius = 25;
    }

    // Deduplicate by coordinates
    const coordSeen = new Set();
    const nameSeen = new Set();
    places = places.filter(p => {
      const coordKey = `${p.lat.toFixed(3)}_${p.lng.toFixed(3)}`;
      const nameKey = p.name.toLowerCase().trim();
      if (coordSeen.has(coordKey) || nameSeen.has(nameKey)) return false;
      coordSeen.add(coordKey);
      nameSeen.add(nameKey);
      return true;
    });

    // Sort: emergency first, then distance
    places.sort((a, b) => {
      if (a.isEmergency && !b.isEmergency) return -1;
      if (!a.isEmergency && b.isEmergency) return 1;
      return a.distance - b.distance;
    });

    res.json({
      success: true,
      data: {
        places: places.slice(0, 40),
        total: places.length,
        hasNearbyEmergency: places.some(p => p.isEmergency),
        searchRadiusKm: usedRadius,
        userLocation: { lat: userLat, lng: userLng },
        message: places.length === 0
          ? 'No medical places found in your area. Data may be limited.'
          : `Found ${places.length} places within ${usedRadius}km`
      }
    });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/hospitals/emergency ──────────────────────────────────────────────
exports.getEmergencyHospitals = async (req, res, next) => {
  try {
    const { lat, lng } = req.query;
    if (!lat || !lng) return res.status(400).json({ success: false, message: 'Location required' });

    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    let hospitals = [];

    // Overpass
    for (const radius of [10000, 25000]) {
      try {
        const query = `[out:json][timeout:25];(node["amenity"~"hospital|clinic|doctors"](around:${radius},${userLat},${userLng});way["amenity"~"hospital|clinic|doctors"](around:${radius},${userLat},${userLng}););out center;`;
        const data = await queryOverpass(query);
        hospitals = parseOverpass(data.elements, userLat, userLng).map(h => ({ ...h, isEmergency: true }));
        if (hospitals.length >= 2) break;
      } catch (err) {
        console.log(`[Emergency Overpass] ${err.message}`);
      }
    }

    // Nominatim fallback — bounded box ~30km
    if (hospitals.length === 0) {
      for (const term of ['hospital', 'nursing home', 'clinic']) {
        try {
          const results = await queryNominatim(userLat, userLng, term, 0.3);
          const parsed = parseNominatim(results, userLat, userLng, 30).map(h => ({ ...h, isEmergency: true }));
          hospitals = [...hospitals, ...parsed];
          if (hospitals.length >= 3) break;
          await new Promise(r => setTimeout(r, 300));
        } catch {}
      }
    }

    hospitals.sort((a, b) => a.distance - b.distance);

    // Deduplicate
    const seen = new Set();
    hospitals = hospitals.filter(h => {
      const key = `${h.lat.toFixed(3)}_${h.lng.toFixed(3)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    res.json({
      success: true,
      data: {
        hospitals: hospitals.slice(0, 10),
        nearest: hospitals[0] || null,
        warningMessage: hospitals.length === 0
          ? 'No hospital found nearby. Please call 112 immediately.'
          : hospitals[0]?.distance > 15
            ? `Nearest hospital is ${hospitals[0].distanceText} away. Call 112 for ambulance.`
            : null
      }
    });
  } catch (error) {
    next(error);
  }
};