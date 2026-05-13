// models/Vital.js
const mongoose = require('mongoose');

const vitalSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    date: {
      type: String,       // 'YYYY-MM-DD'
      required: true,
    },
    time: {
      type: String,       // 'HH:MM'
      default: '08:00',
    },
    bp_systolic:  { type: Number, default: null },
    bp_diastolic: { type: Number, default: null },
    blood_sugar:  { type: Number, default: null },
    weight:       { type: Number, default: null },
    heart_rate:   { type: Number, default: null },
    temperature:  { type: Number, default: null },
    note:         { type: String, default: '' },

    // AI-generated alerts stored at save time
    alerts: [
      {
        level: { type: String, enum: ['warning', 'danger'] },
        vital: String,
        msg:   String,
      },
    ],
  },
  { timestamps: true }
);

// Compound index: one entry per user per date+time (optional — allow multiple per day)
vitalSchema.index({ user: 1, date: -1, createdAt: -1 });

module.exports = mongoose.model('Vital', vitalSchema);