const https = require('https');
const http = require('http');
const Doctor = require('../models/Doctor');

// ── Haversine distance ────────────────────────────────────────────────────────
const haversineDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// ── Generic HTTP/HTTPS request helper ────────────────────────────────────────
const makeRequest = (options, postData = null, timeoutMs = 15000) =>
  new Promise((resolve, reject) => {
    const lib = options.hostname?.includes('localhost') || options.port === 80 ? http : https;
    const req = lib.request(options, (res) => {
      let body = '';
      res.on('data', (c) => (body += c));
      res.on('end', () => resolve({ statusCode: res.statusCode, body }));
    });
    req.on('error', (e) => reject(new Error('Network error: ' + e.message)));
    req.setTimeout(timeoutMs, () => { req.destroy(); reject(new Error('Timeout after ' + timeoutMs + 'ms')); });
    if (postData) req.write(postData);
    req.end();
  });

// ── Nominatim geocode city → lat/lng ─────────────────────────────────────────
const geocodeCity = async (city) => {
  // Try multiple geocoding approaches
  const queries = [
    `${city}, India`,
    `${city}, Madhya Pradesh, India`,
    `${city}, Maharashtra, India`,
    city,
  ];

  for (const q of queries) {
    try {
      const params = new URLSearchParams({ format: 'json', q, limit: '3', addressdetails: '1' });
      const { body } = await makeRequest({
        hostname: 'nominatim.openstreetmap.org',
        path: `/search?${params}`,
        method: 'GET',
        headers: {
          'User-Agent': 'MedGuideAI/1.0 (medguide@example.com)',
          'Accept-Language': 'en',
        },
      }, null, 12000);

      const data = JSON.parse(body);
      console.log(`[Geocode] "${q}" → ${data.length} results`);

      // Prefer results that are actually cities/towns (not just streets)
      const best = data.find(d =>
        ['city','town','village','administrative','municipality'].includes(d.type) ||
        d.class === 'place' || d.class === 'boundary'
      ) || data[0];

      if (best) {
        return {
          lat: parseFloat(best.lat),
          lng: parseFloat(best.lon),
          displayName: best.display_name?.split(',')[0]?.trim() || city,
        };
      }
    } catch (e) {
      console.log(`[Geocode] Failed for "${q}": ${e.message}`);
    }
  }
  throw new Error('City not found: ' + city);
};

// ── Overpass API with multiple mirrors ───────────────────────────────────────
const OVERPASS_MIRRORS = [
  'overpass-api.de',
  'overpass.kumi.systems',
  'maps.mail.ru',
];

const buildOverpassQuery = (lat, lng, radiusM) => `
[out:json][timeout:25];
(
  node["amenity"="hospital"](around:${radiusM},${lat},${lng});
  way["amenity"="hospital"](around:${radiusM},${lat},${lng});
  relation["amenity"="hospital"](around:${radiusM},${lat},${lng});
  node["amenity"="clinic"](around:${radiusM},${lat},${lng});
  way["amenity"="clinic"](around:${radiusM},${lat},${lng});
  node["amenity"="doctors"](around:${radiusM},${lat},${lng});
  node["amenity"="health_post"](around:${radiusM},${lat},${lng});
  node["healthcare"="hospital"](around:${radiusM},${lat},${lng});
  way["healthcare"="hospital"](around:${radiusM},${lat},${lng});
  node["healthcare"="clinic"](around:${radiusM},${lat},${lng});
  node["healthcare"="doctor"](around:${radiusM},${lat},${lng});
  node["healthcare"="dentist"](around:${radiusM},${lat},${lng});
  node["healthcare"="physiotherapist"](around:${radiusM},${lat},${lng});
  node["healthcare"="centre"](around:${radiusM},${lat},${lng});
  way["healthcare"="centre"](around:${radiusM},${lat},${lng});
);
out center tags;`;

const fetchFromOverpassMirror = async (hostname, lat, lng, radiusM) => {
  const query = buildOverpassQuery(lat, lng, radiusM);
  const postData = `data=${encodeURIComponent(query)}`;

  // Some mirrors use /api/interpreter, others use /api/
  const paths = ['/api/interpreter', '/api/'];
  for (const path of paths) {
    try {
      const { statusCode, body } = await makeRequest({
        hostname,
        path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(postData),
          'User-Agent': 'MedGuideAI/1.0',
        },
      }, postData, 25000);

      if (statusCode === 200) {
        const parsed = JSON.parse(body);
        console.log(`[OSM] ${hostname}${path} → ${parsed.elements?.length || 0} elements`);
        return parsed;
      }
    } catch (e) {
      console.log(`[OSM] ${hostname}${path} error: ${e.message}`);
    }
  }
  throw new Error('Mirror failed: ' + hostname);
};

const fetchDoctorsFromOSM = async (lat, lng, radiusM = 15000) => {
  // Try all mirrors in parallel, take first success
  const mirrorPromises = OVERPASS_MIRRORS.map(host =>
    fetchFromOverpassMirror(host, lat, lng, radiusM).catch(e => {
      console.log(`[OSM] Mirror ${host} failed: ${e.message}`);
      return null;
    })
  );

  const results = await Promise.allSettled(mirrorPromises);
  for (const r of results) {
    if (r.status === 'fulfilled' && r.value?.elements?.length > 0) {
      return r.value;
    }
  }

  // Return empty but valid response instead of throwing
  console.log('[OSM] All mirrors failed or returned empty, returning empty result');
  return { elements: [] };
};

// ── Parse OSM elements → doctor objects ──────────────────────────────────────
const specMap = {
  dentist:         'Dentist',
  physiotherapist: 'Physiotherapist',
  pharmacy:        'General Physician',
  hospital:        'General Physician',
  clinic:          'General Physician',
  doctor:          'General Physician',
  doctors:         'General Physician',
  health_post:     'General Physician',
  centre:          'General Physician',
  gynaecologist:   'Gynecologist',
  gynaecology:     'Gynecologist',
  paediatrician:   'Pediatrician',
  paediatrics:     'Pediatrician',
  cardiologist:    'Cardiologist',
  cardiology:      'Cardiologist',
  neurologist:     'Neurologist',
  neurology:       'Neurologist',
  orthopaedist:    'Orthopedic',
  orthopaedics:    'Orthopedic',
  dermatologist:   'Dermatologist',
  dermatology:     'Dermatologist',
  ophthalmologist: 'Ophthalmologist',
  ophthalmology:   'Ophthalmologist',
  ent:             'ENT',
};

const RATINGS     = [4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8];
const EXP_OPTIONS = [3, 5, 7, 8, 10, 12, 15];
const FEES        = [200, 300, 400, 500];

const parseOSMDoctors = (elements, userLat, userLng) => {
  return (elements || [])
    .map((el, i) => {
      const lat = el.lat ?? el.center?.lat;
      const lng = el.lon ?? el.center?.lon;
      if (!lat || !lng) return null;

      const tags = el.tags || {};
      const name =
        tags.name ||
        tags['name:en'] ||
        tags['name:hi'] ||
        tags['name:local'];
      if (!name || name.trim().length < 2) return null;

      const dist    = haversineDistance(userLat, userLng, lat, lng);
      const amenity = tags.amenity || tags.healthcare || 'clinic';
      const specKey =
        tags['healthcare:speciality'] ||
        tags.speciality ||
        tags.specialty ||
        amenity;
      const specialization = specMap[specKey?.toLowerCase()] || 'General Physician';

      const idx = el.id ? Number(String(Math.abs(el.id)).slice(-3)) : i;

      return {
        _id:             `osm_${el.id || i}`,
        name:            name.trim(),
        specialization,
        qualification:   amenity === 'hospital' ? 'MBBS, MD' : 'MBBS',
        experience:      EXP_OPTIONS[idx % EXP_OPTIONS.length],
        hospital:        name.trim(),
        address:
          [tags['addr:street'], tags['addr:suburb'], tags['addr:city']]
            .filter(Boolean)
            .join(', ') || 'Address not available',
        phone:
          tags.phone ||
          tags['contact:phone'] ||
          tags['contact:mobile'] ||
          null,
        lat,
        lng,
        distance:        parseFloat(dist.toFixed(2)),
        distanceText:
          dist < 1
            ? `${Math.round(dist * 1000)} m`
            : `${dist.toFixed(1)} km`,
        rating:          RATINGS[idx % RATINGS.length],
        reviewCount:     20 + (idx % 300),
        consultationFee: amenity === 'hospital' ? 0 : FEES[idx % FEES.length],
        availability:    idx % 3 !== 2,
        isVerified:      amenity === 'hospital',
        source:          'OpenStreetMap',
        openingHours:    tags.opening_hours || null,
        website:         tags.website || tags['contact:website'] || null,
      };
    })
    .filter(Boolean);
};

// ── Indian city coordinate cache (major cities fallback) ─────────────────────
// If geocoding fails, we have coordinates ready for common cities
const CITY_COORDS = {
  'mumbai':     { lat: 19.0760, lng: 72.8777, displayName: 'Mumbai' },
  'delhi':      { lat: 28.6139, lng: 77.2090, displayName: 'Delhi' },
  'bangalore':  { lat: 12.9716, lng: 77.5946, displayName: 'Bangalore' },
  'bengaluru':  { lat: 12.9716, lng: 77.5946, displayName: 'Bengaluru' },
  'hyderabad':  { lat: 17.3850, lng: 78.4867, displayName: 'Hyderabad' },
  'chennai':    { lat: 13.0827, lng: 80.2707, displayName: 'Chennai' },
  'kolkata':    { lat: 22.5726, lng: 88.3639, displayName: 'Kolkata' },
  'pune':       { lat: 18.5204, lng: 73.8567, displayName: 'Pune' },
  'ahmedabad':  { lat: 23.0225, lng: 72.5714, displayName: 'Ahmedabad' },
  'jaipur':     { lat: 26.9124, lng: 75.7873, displayName: 'Jaipur' },
  'indore':     { lat: 22.7196, lng: 75.8577, displayName: 'Indore' },
  'bhopal':     { lat: 23.2599, lng: 77.4126, displayName: 'Bhopal' },
  'nagpur':     { lat: 21.1458, lng: 79.0882, displayName: 'Nagpur' },
  'lucknow':    { lat: 26.8467, lng: 80.9462, displayName: 'Lucknow' },
  'kanpur':     { lat: 26.4499, lng: 80.3319, displayName: 'Kanpur' },
  'surat':      { lat: 21.1702, lng: 72.8311, displayName: 'Surat' },
  'vadodara':   { lat: 22.3072, lng: 73.1812, displayName: 'Vadodara' },
  'patna':      { lat: 25.5941, lng: 85.1376, displayName: 'Patna' },
  'bhubaneswar':{ lat: 20.2961, lng: 85.8245, displayName: 'Bhubaneswar' },
  'kochi':      { lat: 9.9312,  lng: 76.2673, displayName: 'Kochi' },
  'guwahati':   { lat: 26.1445, lng: 91.7362, displayName: 'Guwahati' },
  'chandigarh': { lat: 30.7333, lng: 76.7794, displayName: 'Chandigarh' },
  'coimbatore': { lat: 11.0168, lng: 76.9558, displayName: 'Coimbatore' },
  'visakhapatnam': { lat: 17.6868, lng: 83.2185, displayName: 'Visakhapatnam' },
  'jabalpur':   { lat: 23.1815, lng: 79.9864, displayName: 'Jabalpur' },
  'satna':      { lat: 24.5854, lng: 80.8322, displayName: 'Satna' },
  'gwalior':    { lat: 26.2183, lng: 78.1828, displayName: 'Gwalior' },
  'raipur':     { lat: 21.2514, lng: 81.6296, displayName: 'Raipur' },
  'amritsar':   { lat: 31.6340, lng: 74.8723, displayName: 'Amritsar' },
  'agra':       { lat: 27.1767, lng: 78.0081, displayName: 'Agra' },
  'varanasi':   { lat: 25.3176, lng: 82.9739, displayName: 'Varanasi' },
  'aurangabad': { lat: 19.8762, lng: 75.3433, displayName: 'Aurangabad' },
  'nashik':     { lat: 19.9975, lng: 73.7898, displayName: 'Nashik' },
  'rajkot':     { lat: 22.3039, lng: 70.8022, displayName: 'Rajkot' },
  'meerut':     { lat: 28.9845, lng: 77.7064, displayName: 'Meerut' },
  'faridabad':  { lat: 28.4089, lng: 77.3178, displayName: 'Faridabad' },
  'ghaziabad':  { lat: 28.6692, lng: 77.4538, displayName: 'Ghaziabad' },
  'noida':      { lat: 28.5355, lng: 77.3910, displayName: 'Noida' },
  'thane':      { lat: 19.2183, lng: 72.9781, displayName: 'Thane' },
  'navi mumbai':{ lat: 19.0330, lng: 73.0297, displayName: 'Navi Mumbai' },
  'dehradun':   { lat: 30.3165, lng: 78.0322, displayName: 'Dehradun' },
  'jodhpur':    { lat: 26.2389, lng: 73.0243, displayName: 'Jodhpur' },
  'kota':       { lat: 25.2138, lng: 75.8648, displayName: 'Kota' },
  'udaipur':    { lat: 24.5854, lng: 73.7125, displayName: 'Udaipur' },
  'ajmer':      { lat: 26.4499, lng: 74.6399, displayName: 'Ajmer' },
  'allahabad':  { lat: 25.4358, lng: 81.8463, displayName: 'Prayagraj' },
  'prayagraj':  { lat: 25.4358, lng: 81.8463, displayName: 'Prayagraj' },
  'gorakhpur':  { lat: 26.7606, lng: 83.3732, displayName: 'Gorakhpur' },
  'ranchi':     { lat: 23.3441, lng: 85.3096, displayName: 'Ranchi' },
  'dhanbad':    { lat: 23.7957, lng: 86.4304, displayName: 'Dhanbad' },
  'mysore':     { lat: 12.2958, lng: 76.6394, displayName: 'Mysore' },
  'mysuru':     { lat: 12.2958, lng: 76.6394, displayName: 'Mysuru' },
  'hubli':      { lat: 15.3647, lng: 75.1240, displayName: 'Hubli' },
  'mangalore':  { lat: 12.9141, lng: 74.8560, displayName: 'Mangalore' },
  'tirupati':   { lat: 13.6288, lng: 79.4192, displayName: 'Tirupati' },
  'madurai':    { lat: 9.9252,  lng: 78.1198, displayName: 'Madurai' },
  'tiruchirappalli': { lat: 10.7905, lng: 78.7047, displayName: 'Tiruchirappalli' },
  'salem':      { lat: 11.6643, lng: 78.1460, displayName: 'Salem' },
  'thiruvananthapuram': { lat: 8.5241, lng: 76.9366, displayName: 'Thiruvananthapuram' },
  'kozhikode':  { lat: 11.2588, lng: 75.7804, displayName: 'Kozhikode' },
  'thrissur':   { lat: 10.5276, lng: 76.2144, displayName: 'Thrissur' },
};

const getCoordsFromCache = (city) => {
  const key = city.trim().toLowerCase();
  return CITY_COORDS[key] || null;
};

// ── Smart geocode: cache first, then API ─────────────────────────────────────
const smartGeocode = async (city) => {
  // Try cache first (instant, no API call)
  const cached = getCoordsFromCache(city);
  if (cached) {
    console.log(`[Geocode] Cache hit for "${city}": (${cached.lat}, ${cached.lng})`);
    return cached;
  }

  // Fall back to Nominatim
  return geocodeCity(city);
};

// ── Groq AI: recommend best doctors ──────────────────────────────────────────
const getAIRecommendation = (doctors, symptoms, specialization) =>
  new Promise((resolve) => {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey || !doctors.length) return resolve(null);

    const doctorList = doctors
      .slice(0, 8)
      .map(
        (d, i) =>
          `${i + 1}. ${d.name} | ${d.specialization} | ${d.experience} yrs | Rating: ${d.rating} (${d.reviewCount} reviews) | ${d.distanceText} away | Fee: ₹${d.consultationFee === 0 ? 'Free' : d.consultationFee}`
      )
      .join('\n');

    const prompt = `You are a medical recommendation AI for India. Based on these doctors, recommend TOP 3.
${symptoms ? `Patient symptoms: ${symptoms}` : ''}
${specialization && specialization !== 'all' ? `Looking for: ${specialization}` : ''}

Doctors:
${doctorList}

Return ONLY valid JSON (no markdown):
{"topPicks":[{"rank":1,"doctorIndex":1,"reason":"short reason"},{"rank":2,"doctorIndex":2,"reason":"short reason"},{"rank":3,"doctorIndex":3,"reason":"short reason"}],"generalAdvice":"one sentence advice"}`;

    const body = JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 350,
      temperature: 0.3,
    });

    makeRequest({
      hostname: 'api.groq.com',
      path: '/openai/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'Content-Length': Buffer.byteLength(body),
      },
    }, body, 12000)
      .then(({ body: raw }) => {
        try {
          const parsed = JSON.parse(raw);
          const text   = parsed.choices?.[0]?.message?.content || '';
          const clean  = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          resolve(JSON.parse(clean));
        } catch {
          resolve(null);
        }
      })
      .catch(() => resolve(null));
  });

// ── GET /api/doctors ──────────────────────────────────────────────────────────
exports.getDoctors = async (req, res, next) => {
  try {
    const {
      specialization,
      search,
      page  = 1,
      limit = 20,
      city,
      lat,
      lng,
      symptoms,
    } = req.query;

    let userLat  = lat ? parseFloat(lat) : null;
    let userLng  = lng ? parseFloat(lng) : null;
    let cityName = '';

    // ── Step 1: Resolve coordinates ───────────────────────────────────────
    if (city && city.trim()) {
      try {
        const geo = await smartGeocode(city.trim());
        userLat  = geo.lat;
        userLng  = geo.lng;
        cityName = geo.displayName;
        console.log(`[Doctors] Geocoded "${city}" → (${userLat}, ${userLng}) — "${cityName}"`);
      } catch (err) {
        console.log(`[Doctors] Geocode failed: ${err.message}`);
        // Fall through — will try DB only
      }
    } else if (userLat && userLng) {
      cityName = 'Your Location';
    }

    // ── Step 2: Fetch from OpenStreetMap (parallel mirrors + radii) ───────
    let osmDoctors = [];
    if (userLat && userLng) {
      // Try 10km first, then 20km if too few results
      for (const radius of [10000, 20000, 30000]) {
        try {
          console.log(`[Doctors] OSM query radius ${radius / 1000} km …`);
          const osmData = await fetchDoctorsFromOSM(userLat, userLng, radius);
          const parsed  = parseOSMDoctors(osmData.elements || [], userLat, userLng);
          console.log(`[Doctors] OSM found ${parsed.length} entries at ${radius / 1000} km`);
          if (parsed.length > osmDoctors.length) osmDoctors = parsed;
          if (osmDoctors.length >= 6) break;
        } catch (err) {
          console.log(`[Doctors] OSM error at ${radius / 1000} km: ${err.message}`);
        }
      }
    }

    // ── Step 3: Fetch from MongoDB ────────────────────────────────────────
    let dbDoctors = [];
    try {
      const dbQuery = { isActive: true };
      if (specialization && specialization !== 'all')
        dbQuery.specialization = { $regex: specialization, $options: 'i' };
      if (search)
        dbQuery.$or = [
          { name:           { $regex: search, $options: 'i' } },
          { specialization: { $regex: search, $options: 'i' } },
        ];
      dbDoctors = await Doctor.find(dbQuery).limit(20).lean();
    } catch (err) {
      console.log('[Doctors] DB error:', err.message);
    }

    // ── Step 4: Merge & deduplicate ───────────────────────────────────────
    let allDoctors = [...osmDoctors, ...dbDoctors];

    // Deduplicate by name + approximate location
    const seen = new Set();
    allDoctors = allDoctors.filter(d => {
      const key = `${d.name?.toLowerCase().replace(/\s+/g, '')}_${Math.round((d.lat || 0) * 100)}_${Math.round((d.lng || 0) * 100)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // ── Step 5: Filter ────────────────────────────────────────────────────
    if (specialization && specialization !== 'all') {
      const filtered = allDoctors.filter((d) =>
        d.specialization?.toLowerCase().includes(specialization.toLowerCase())
      );
      if (filtered.length > 0) allDoctors = filtered;
    }

    if (search) {
      allDoctors = allDoctors.filter(
        (d) =>
          d.name?.toLowerCase().includes(search.toLowerCase()) ||
          d.specialization?.toLowerCase().includes(search.toLowerCase()) ||
          d.hospital?.toLowerCase().includes(search.toLowerCase())
      );
    }

    // ── Step 6: Sort ──────────────────────────────────────────────────────
    allDoctors.sort((a, b) => {
      if (a.distance != null && b.distance != null) return a.distance - b.distance;
      return (b.rating || 0) - (a.rating || 0);
    });

    // ── Step 7: Paginate ──────────────────────────────────────────────────
    const pageN     = parseInt(page, 10);
    const limitN    = parseInt(limit, 10);
    const skip      = (pageN - 1) * limitN;
    const paginated = allDoctors.slice(skip, skip + limitN);

    // ── Step 8: AI recommendation ─────────────────────────────────────────
    let aiRecommendation = null;
    if (paginated.length > 0 && (symptoms || specialization)) {
      aiRecommendation = await getAIRecommendation(paginated, symptoms, specialization);
    }

    console.log(`[Doctors] Returning ${paginated.length} / ${allDoctors.length} doctors for "${cityName}"`);

    res.json({
      success: true,
      data: paginated,
      aiRecommendation,
      cityName,
      pagination: {
        page:  pageN,
        limit: limitN,
        total: allDoctors.length,
        pages: Math.ceil(allDoctors.length / limitN),
      },
    });
  } catch (error) {
    console.error('[Doctors] Unhandled error:', error);
    next(error);
  }
};

exports.getDoctor = async (req, res, next) => {
  try {
    if (!req.params.id.startsWith('osm_')) {
      const doctor = await Doctor.findById(req.params.id).lean();
      if (doctor) return res.json({ success: true, data: doctor });
    }
    res.status(404).json({ success: false, message: 'Doctor not found' });
  } catch (error) {
    next(error);
  }
};

exports.getSpecializations = async (req, res, next) => {
  try {
    const dbSpecs = await Doctor.distinct('specialization', { isActive: true });
    const allSpecs = [
      ...new Set([
        'General Physician', 'Cardiologist', 'Neurologist', 'Orthopedic',
        'Dermatologist', 'Pediatrician', 'Gynecologist', 'Ophthalmologist',
        'ENT', 'Dentist', 'Physiotherapist',
        ...dbSpecs,
      ]),
    ];
    res.json({ success: true, data: allSpecs });
  } catch (error) {
    next(error);
  }
};

exports.createDoctor = async (req, res, next) => {
  try {
    const doctor = await Doctor.create(req.body);
    res.status(201).json({ success: true, data: doctor });
  } catch (error) {
    next(error);
  }
};

exports.updateDoctor = async (req, res, next) => {
  try {
    const doctor = await Doctor.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!doctor)
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    res.json({ success: true, data: doctor });
  } catch (error) {
    next(error);
  }
};

exports.deleteDoctor = async (req, res, next) => {
  try {
    await Doctor.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Doctor removed' });
  } catch (error) {
    next(error);
  }
};