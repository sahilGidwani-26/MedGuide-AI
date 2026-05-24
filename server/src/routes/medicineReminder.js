const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth');  // your existing JWT middleware
const MedicineReminder = require('../models/MedicineReminder');

// ── GET all reminders for current user ─────────────────────────
router.get('/', protect, async (req, res) => {
  try {
    const reminders = await MedicineReminder.find({ user: req.user.id })
      .sort({ createdAt: -1 });
    res.json({ success: true, data: reminders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


router.get('/stats/adherence', protect, async (req, res) => {
  try {
    const reminders = await MedicineReminder.find({ user: req.user.id, isActive: true });
    const stats = reminders.map(r => ({
      id:           r._id,
      name:         r.medicineName,
      totalDoses:   r.totalDoses,
      takenDoses:   r.takenDoses,
      missedDoses:  r.missedDoses,
      streak:       r.streak,
      adherenceRate: r.totalDoses > 0
        ? Math.round((r.takenDoses / r.totalDoses) * 100)
        : 0
    }));
    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


// ── GET single reminder ─────────────────────────────────────────
router.get('/:id', protect, async (req, res) => {
  try {
    const reminder = await MedicineReminder.findOne({
      _id: req.params.id, user: req.user.id
    });
    if (!reminder) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: reminder });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST create reminder ────────────────────────────────────────
router.post('/', protect, async (req, res) => {
  try {
    const {
      medicineName, dosage, frequency, times,
      startDate, endDate, color, instructions, notificationsEnabled
    } = req.body;

    if (!medicineName || !times || times.length === 0) {
      return res.status(400).json({ success: false, message: 'medicineName and times are required' });
    }

    const reminder = await MedicineReminder.create({
      user: req.user.id,
      medicineName, dosage, frequency, times,
      startDate, endDate, color, instructions, notificationsEnabled
    });

    res.status(201).json({ success: true, data: reminder });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PUT update reminder ─────────────────────────────────────────
router.put('/:id', protect, async (req, res) => {
  try {
    const reminder = await MedicineReminder.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!reminder) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: reminder });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── DELETE reminder ─────────────────────────────────────────────
router.delete('/:id', protect, async (req, res) => {
  try {
    const reminder = await MedicineReminder.findOneAndDelete({
      _id: req.params.id, user: req.user.id
    });
    if (!reminder) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST log a dose (taken / missed) ───────────────────────────
router.post('/:id/dose', protect, async (req, res) => {
  try {
    const { status, scheduledTime, note } = req.body;
    // status: 'taken' | 'missed'

    const reminder = await MedicineReminder.findOne({
      _id: req.params.id, user: req.user.id
    });
    if (!reminder) return res.status(404).json({ success: false, message: 'Not found' });

    const doseEntry = {
      scheduledTime: new Date(scheduledTime),
      status,
      note,
      ...(status === 'taken' && { takenAt: new Date() })
    };

    reminder.doseLogs.push(doseEntry);
    reminder.totalDoses += 1;

    if (status === 'taken') {
      reminder.takenDoses += 1;
      reminder.streak     += 1;
    } else {
      reminder.missedDoses += 1;
      reminder.streak       = 0;   // reset streak on miss
    }

    // Keep only last 90 logs to avoid bloat
    if (reminder.doseLogs.length > 90) {
      reminder.doseLogs = reminder.doseLogs.slice(-90);
    }

    await reminder.save();
    res.json({ success: true, data: reminder });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET adherence stats for current user ───────────────────────

module.exports = router;