const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth');
const BloodDonor   = require('../models/BloodDonor');
const BloodRequest = require('../models/BloodRequest');

// ════════════════════════════════════════════════════════════════
//  DONOR PROFILE
// ════════════════════════════════════════════════════════════════

// GET my donor profile
router.get('/donor/me', protect, async (req, res) => {
  try {
    const donor = await BloodDonor.findOne({ user: req.user.id });
    res.json({ success: true, data: donor || null });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST register / update as donor  (upsert)
router.post('/donor/register', protect, async (req, res) => {
  try {
    const { name, bloodGroup, phone, city, state, lat, lng,
            age, weight, medicalConditions, lastDonated } = req.body;

    if (!name || !bloodGroup || !phone || !city) {
      return res.status(400).json({ success: false, message: 'name, bloodGroup, phone, city required' });
    }

    const donor = await BloodDonor.findOneAndUpdate(
      { user: req.user.id },
      {
        user: req.user.id,
        name, bloodGroup, phone, city, state, age, weight,
        medicalConditions, lastDonated,
        location: {
          type: 'Point',
          coordinates: [parseFloat(lng) || 0, parseFloat(lat) || 0]
        }
      },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(201).json({ success: true, data: donor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH toggle availability
router.patch('/donor/availability', protect, async (req, res) => {
  try {
    const donor = await BloodDonor.findOne({ user: req.user.id });
    if (!donor) return res.status(404).json({ success: false, message: 'Donor profile not found' });
    donor.isAvailable = !donor.isAvailable;
    await donor.save();
    res.json({ success: true, data: donor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET search donors by blood group + city (or coords)
router.get('/donors/search', protect, async (req, res) => {
  try {
    const { bloodGroup, city, lat, lng, radius = 50 } = req.query;
    let query = { isAvailable: true };

    if (bloodGroup) query.bloodGroup = bloodGroup;

    // Geo search takes priority over city text search
    if (lat && lng) {
      const donors = await BloodDonor.find({
        ...query,
        location: {
          $near: {
            $geometry:    { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
            $maxDistance: parseFloat(radius) * 1000   // km → metres
          }
        }
      }).limit(30).populate('user', 'name');

      return res.json({ success: true, data: donors });
    }

    if (city) query.city = { $regex: city, $options: 'i' };

    const donors = await BloodDonor.find(query)
      .limit(30)
      .sort({ createdAt: -1 })
      .populate('user', 'name');

    res.json({ success: true, data: donors });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ════════════════════════════════════════════════════════════════
//  BLOOD REQUESTS
// ════════════════════════════════════════════════════════════════

// GET all open requests (feed)
router.get('/requests', protect, async (req, res) => {
  try {
    const { bloodGroup, city, status = 'open' } = req.query;
    let query = { status };
    if (bloodGroup) query.bloodGroup = bloodGroup;
    if (city) query.city = { $regex: city, $options: 'i' };

    const requests = await BloodRequest.find(query)
      .sort({ urgency: 1, createdAt: -1 })   // critical first
      .limit(50)
      .populate('requester', 'name');

    res.json({ success: true, data: requests });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET my requests
router.get('/requests/mine', protect, async (req, res) => {
  try {
    const requests = await BloodRequest.find({ requester: req.user.id })
      .sort({ createdAt: -1 });
    res.json({ success: true, data: requests });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST create blood request
router.post('/requests', protect, async (req, res) => {
  try {
    const { patientName, bloodGroup, unitsNeeded, hospital,
            city, contactPhone, urgency, notes, lat, lng } = req.body;

    if (!patientName || !bloodGroup || !hospital || !city || !contactPhone) {
      return res.status(400).json({
        success: false,
        message: 'patientName, bloodGroup, hospital, city, contactPhone required'
      });
    }

    const request = await BloodRequest.create({
      requester: req.user.id,
      patientName, bloodGroup, unitsNeeded, hospital,
      city, contactPhone, urgency, notes,
      location: {
        type: 'Point',
        coordinates: [parseFloat(lng) || 0, parseFloat(lat) || 0]
      }
    });

    // 🔔 Real-time socket broadcast to all connected clients
    const io = req.app.get('io');
    if (io) {
      io.emit('blood_request_new', {
        requestId:   request._id,
        bloodGroup:  request.bloodGroup,
        city:        request.city,
        hospital:    request.hospital,
        urgency:     request.urgency,
        patientName: request.patientName,
        contactPhone: request.contactPhone,
        createdAt:   request.createdAt
      });
    }

    res.status(201).json({ success: true, data: request });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST respond to a blood request (donor interested)
router.post('/requests/:id/respond', protect, async (req, res) => {
  try {
    const donor = await BloodDonor.findOne({ user: req.user.id });
    if (!donor) return res.status(400).json({ success: false, message: 'Register as donor first' });

    const request = await BloodRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });
    if (request.status !== 'open') return res.status(400).json({ success: false, message: 'Request is no longer open' });

    // Avoid duplicate responses
    const already = request.respondedDonors.some(r => r.donor?.toString() === donor._id.toString());
    if (already) return res.status(400).json({ success: false, message: 'Already responded' });

    request.respondedDonors.push({ donor: donor._id, status: 'interested' });
    await request.save();

    // Real-time notify requester
    const io = req.app.get('io');
    if (io) {
      io.emit(`blood_response_${request.requester}`, {
        requestId:  request._id,
        donorName:  donor.name,
        donorPhone: donor.phone,
        bloodGroup: donor.bloodGroup
      });
    }

    res.json({ success: true, message: 'Response recorded', data: request });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH mark request fulfilled / cancelled
router.patch('/requests/:id/status', protect, async (req, res) => {
  try {
    const { status } = req.body;
    const request = await BloodRequest.findOneAndUpdate(
      { _id: req.params.id, requester: req.user.id },
      { status },
      { new: true }
    );
    if (!request) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: request });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;