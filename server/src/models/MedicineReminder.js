const mongoose = require('mongoose');

const doseLogSchema = new mongoose.Schema({
  scheduledTime: { type: Date, required: true },
  takenAt:       { type: Date },
  status:        { type: String, enum: ['taken', 'missed', 'pending'], default: 'pending' },
  note:          { type: String }
}, { _id: true });

const medicineReminderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  medicineName: {
    type: String,
    required: [true, 'Medicine name is required'],
    trim: true,
    maxlength: 100
  },
  dosage: {
    type: String,
    trim: true,
    maxlength: 50
    // e.g. "500mg", "1 tablet"
  },
  frequency: {
    type: String,
    enum: ['once_daily', 'twice_daily', 'thrice_daily', 'every_4_hours', 'every_6_hours', 'every_8_hours', 'weekly', 'custom'],
    default: 'once_daily'
  },
  times: [{
    type: String,   // "HH:MM" 24-hr format  e.g. "08:00"
    required: true
  }],
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date   // null = ongoing
  },
  isActive: {
    type: Boolean,
    default: true
  },
  color: {
    type: String,
    default: '#15b38a'  // matches primary-500
  },
  instructions: {
    type: String,
    maxlength: 200
    // e.g. "Take after meals", "With warm water"
  },
  // push-notification subscription stored per reminder (or rely on user model)
  notificationsEnabled: {
    type: Boolean,
    default: true
  },
  // rolling 30-day dose log
  doseLogs: [doseLogSchema],

  streak: {
    type: Number,
    default: 0
  },
  totalDoses:  { type: Number, default: 0 },
  missedDoses: { type: Number, default: 0 },
  takenDoses:  { type: Number, default: 0 }

}, { timestamps: true });

// Index for efficient queries
medicineReminderSchema.index({ user: 1, isActive: 1 });
medicineReminderSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('MedicineReminder', medicineReminderSchema);