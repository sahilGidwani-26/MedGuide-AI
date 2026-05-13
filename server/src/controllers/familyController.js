const FamilyMember = require('../models/FamilyMember');
const https = require('https');

// ── helpers ───────────────────────────────────────────────────────────────────
const vitalUnits = {
  bp: 'mmHg', sugar: 'mg/dL', weight: 'kg',
  temperature: '°F', heartRate: 'bpm', oxygen: '%'
};

const vitalNormalRange = {
  bp:          { low: '90/60', high: '120/80', danger: '140/90', label: 'Blood Pressure' },
  sugar:       { low: 70, high: 100, danger: 126, label: 'Blood Sugar (Fasting)' },
  weight:      { label: 'Weight' },
  temperature: { low: 97, high: 99, danger: 103, label: 'Temperature' },
  heartRate:   { low: 60, high: 100, danger: 120, label: 'Heart Rate' },
  oxygen:      { low: 95, high: 100, danger: 90, label: 'Oxygen Saturation' },
};

const getVitalStatus = (type, value) => {
  const range = vitalNormalRange[type];
  if (!range || type === 'weight' || type === 'bp') return 'normal';
  const num = parseFloat(value);
  if (isNaN(num)) return 'normal';
  if (type === 'oxygen') return num < range.danger ? 'critical' : num < range.low ? 'warning' : 'normal';
  if (num > range.danger) return 'critical';
  if (num > range.high) return 'warning';
  if (num < range.low) return 'warning';
  return 'normal';
};

// ── GET all family members ────────────────────────────────────────────────────
exports.getMembers = async (req, res, next) => {
  try {
    const members = await FamilyMember.find({ user: req.user.id, isActive: true })
      .sort({ createdAt: 1 });
    res.json({ success: true, data: members });
  } catch (err) { next(err); }
};

// ── GET single member ─────────────────────────────────────────────────────────
exports.getMember = async (req, res, next) => {
  try {
    const member = await FamilyMember.findOne({ _id: req.params.id, user: req.user.id });
    if (!member) return res.status(404).json({ success: false, message: 'Member not found' });
    res.json({ success: true, data: member });
  } catch (err) { next(err); }
};

// ── CREATE member ─────────────────────────────────────────────────────────────
exports.createMember = async (req, res, next) => {
  try {
    const { name, relation, dateOfBirth, gender, bloodGroup, conditions, allergies, medications, notes } = req.body;
    if (!name || !relation) return res.status(400).json({ success: false, message: 'Name and relation required' });

    // Auto-add default vaccinations for children
    let vaccinations = [];
    if (dateOfBirth) {
      const ageYears = (Date.now() - new Date(dateOfBirth)) / (1000 * 60 * 60 * 24 * 365.25);
      if (ageYears < 12) {
        vaccinations = [
          { name: 'BCG', status: 'upcoming', doseNumber: '1 dose' },
          { name: 'Polio (OPV)', status: 'upcoming', doseNumber: 'Multiple doses' },
          { name: 'Hepatitis B', status: 'upcoming', doseNumber: '3 doses' },
          { name: 'DPT', status: 'upcoming', doseNumber: '5 doses' },
          { name: 'MMR', status: 'upcoming', doseNumber: '2 doses' },
        ];
      }
    }

    const member = await FamilyMember.create({
      user: req.user.id,
      name, relation, dateOfBirth, gender, bloodGroup,
      conditions: conditions || [],
      allergies: allergies || [],
      medications: medications || [],
      notes,
      vaccinations
    });
    res.status(201).json({ success: true, data: member });
  } catch (err) { next(err); }
};

// ── UPDATE member ─────────────────────────────────────────────────────────────
exports.updateMember = async (req, res, next) => {
  try {
    const allowed = ['name', 'relation', 'dateOfBirth', 'gender', 'bloodGroup',
      'conditions', 'allergies', 'medications', 'notes', 'emergencyContact', 'avatar'];
    const updates = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    const member = await FamilyMember.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      updates, { new: true }
    );
    if (!member) return res.status(404).json({ success: false, message: 'Member not found' });
    res.json({ success: true, data: member });
  } catch (err) { next(err); }
};

// ── DELETE member ─────────────────────────────────────────────────────────────
exports.deleteMember = async (req, res, next) => {
  try {
    await FamilyMember.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { isActive: false }
    );
    res.json({ success: true, message: 'Member removed' });
  } catch (err) { next(err); }
};

// ── ADD vital record ──────────────────────────────────────────────────────────
exports.addVital = async (req, res, next) => {
  try {
    const { type, value, value2, note } = req.body;
    if (!type || !value) return res.status(400).json({ success: false, message: 'Type and value required' });

    const status = getVitalStatus(type, value);
    const vital = {
      type, value, value2,
      unit: vitalUnits[type] || '',
      note,
      recordedAt: new Date()
    };

    const member = await FamilyMember.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { $push: { vitals: { $each: [vital], $position: 0 } } },
      { new: true }
    );
    if (!member) return res.status(404).json({ success: false, message: 'Member not found' });

    res.json({ success: true, data: { vital, status, member: member.name } });
  } catch (err) { next(err); }
};

// ── GET vitals history ────────────────────────────────────────────────────────
exports.getVitals = async (req, res, next) => {
  try {
    const { type, limit = 30 } = req.query;
    const member = await FamilyMember.findOne({ _id: req.params.id, user: req.user.id });
    if (!member) return res.status(404).json({ success: false, message: 'Member not found' });

    let vitals = member.vitals;
    if (type) vitals = vitals.filter(v => v.type === type);
    vitals = vitals.slice(0, parseInt(limit));

    // Add status to each vital
    const withStatus = vitals.map(v => ({
      ...v.toObject(),
      status: getVitalStatus(v.type, v.value),
      range: vitalNormalRange[v.type]
    }));

    res.json({ success: true, data: withStatus, memberName: member.name });
  } catch (err) { next(err); }
};

// ── DELETE vital ──────────────────────────────────────────────────────────────
exports.deleteVital = async (req, res, next) => {
  try {
    await FamilyMember.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { $pull: { vitals: { _id: req.params.vitalId } } }
    );
    res.json({ success: true, message: 'Vital removed' });
  } catch (err) { next(err); }
};

// ── ADD / UPDATE vaccination ──────────────────────────────────────────────────
exports.addVaccination = async (req, res, next) => {
  try {
    const { name, doseNumber, givenAt, nextDueAt, hospital, doctor, status, notes } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Vaccine name required' });

    const vaccine = { name, doseNumber, givenAt, nextDueAt, hospital, doctor, status: status || 'given', notes };
    const member = await FamilyMember.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { $push: { vaccinations: vaccine } },
      { new: true }
    );
    if (!member) return res.status(404).json({ success: false, message: 'Member not found' });
    res.json({ success: true, data: member.vaccinations });
  } catch (err) { next(err); }
};

// ── UPDATE vaccination status ─────────────────────────────────────────────────
exports.updateVaccination = async (req, res, next) => {
  try {
    const updates = {};
    ['status', 'givenAt', 'nextDueAt', 'hospital', 'doctor', 'notes'].forEach(f => {
      if (req.body[f] !== undefined) updates[`vaccinations.$.${f}`] = req.body[f];
    });
    await FamilyMember.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id, 'vaccinations._id': req.params.vaccId },
      { $set: updates }
    );
    const member = await FamilyMember.findById(req.params.id);
    res.json({ success: true, data: member.vaccinations });
  } catch (err) { next(err); }
};

// ── AI Health Summary ─────────────────────────────────────────────────────────
exports.getAISummary = async (req, res, next) => {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return res.status(500).json({ success: false, message: 'AI not configured' });

    const member = await FamilyMember.findOne({ _id: req.params.id, user: req.user.id });
    if (!member) return res.status(404).json({ success: false, message: 'Member not found' });

    const recentVitals = member.vitals.slice(0, 10);
    const overdueVaccines = member.vaccinations.filter(v => v.status === 'overdue' || v.status === 'due');

    const prompt = `You are a family health AI assistant. Analyze this family member's health data and provide a brief health summary.

Member: ${member.name}, Age: ${member.age || 'Unknown'}, Relation: ${member.relation}
Blood Group: ${member.bloodGroup || 'Unknown'}
Medical Conditions: ${member.conditions.join(', ') || 'None'}
Allergies: ${member.allergies.join(', ') || 'None'}
Medications: ${member.medications.join(', ') || 'None'}
Recent Vitals: ${JSON.stringify(recentVitals.slice(0, 5))}
Overdue Vaccinations: ${overdueVaccines.map(v => v.name).join(', ') || 'None'}

Return ONLY this JSON (no markdown):
{
  "overallStatus": "good/fair/attention-needed",
  "summary": "2-3 sentence health overview in simple language",
  "alerts": ["alert 1 if any", "alert 2 if any"],
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"],
  "nextSteps": "Most important action to take",
  "positives": ["positive health aspect 1", "positive 2"]
}`;

    const data = JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 500, temperature: 0.3
    });

    const summary = await new Promise((resolve, reject) => {
      const r = https.request({
        hostname: 'api.groq.com',
        path: '/openai/v1/chat/completions',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}`, 'Content-Length': Buffer.byteLength(data) }
      }, (res) => {
        let body = '';
        res.on('data', c => body += c);
        res.on('end', () => {
          try {
            const p = JSON.parse(body);
            if (p.error) return reject(new Error(p.error.message));
            const t = p.choices?.[0]?.message?.content || '';
            resolve(JSON.parse(t.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()));
          } catch { reject(new Error('AI parse failed')); }
        });
      });
      r.on('error', reject);
      r.setTimeout(15000, () => { r.destroy(); reject(new Error('Timeout')); });
      r.write(data);
      r.end();
    });

    res.json({ success: true, data: summary, memberName: member.name });
  } catch (err) { next(err); }
};

// ── Family Overview (all members summary) ────────────────────────────────────
exports.getFamilyOverview = async (req, res, next) => {
  try {
    const members = await FamilyMember.find({ user: req.user.id, isActive: true });

    const overview = members.map(m => {
      const latestVitals = {};
      ['bp', 'sugar', 'weight', 'heartRate', 'oxygen'].forEach(type => {
        const latest = m.vitals.find(v => v.type === type);
        if (latest) latestVitals[type] = { value: latest.value, recordedAt: latest.recordedAt, status: getVitalStatus(type, latest.value) };
      });

      const overdueVaccinations = m.vaccinations.filter(v =>
        v.status === 'overdue' || (v.nextDueAt && new Date(v.nextDueAt) < new Date())
      );

      const hasAlert = overdueVaccinations.length > 0 ||
        Object.values(latestVitals).some(v => v.status === 'critical' || v.status === 'warning');

      return {
        _id: m._id,
        name: m.name,
        relation: m.relation,
        age: m.age,
        gender: m.gender,
        bloodGroup: m.bloodGroup,
        avatar: m.avatar,
        conditions: m.conditions,
        latestVitals,
        overdueVaccinations: overdueVaccinations.length,
        totalVitals: m.vitals.length,
        totalVaccinations: m.vaccinations.length,
        hasAlert
      };
    });

    res.json({ success: true, data: overview, total: members.length });
  } catch (err) { next(err); }
};