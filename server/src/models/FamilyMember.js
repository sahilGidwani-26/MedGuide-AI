const mongoose = require('mongoose');

const vitalSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['bp', 'sugar', 'weight', 'temperature', 'heartRate', 'oxygen'],
    required: true
  },
  value: { type: String, required: true },   // e.g. "120/80" or "98.6"
  value2: { type: String },                  // for BP: systolic/diastolic
  unit: { type: String },                    // mmHg, mg/dL, kg, °F, bpm, %
  note: { type: String },
  recordedAt: { type: Date, default: Date.now }
}, { _id: true });

const vaccinationSchema = new mongoose.Schema({
  name: { type: String, required: true },    // e.g. "BCG", "Polio", "COVID-19"
  doseNumber: { type: String },              // "1st dose", "2nd dose"
  givenAt: { type: Date },
  nextDueAt: { type: Date },
  hospital: { type: String },
  doctor: { type: String },
  status: { type: String, enum: ['given', 'due', 'overdue', 'upcoming'], default: 'upcoming' },
  notes: { type: String }
}, { _id: true });

const familyMemberSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: { type: String, required: true, trim: true },
  relation: {
    type: String,
    enum: ['self', 'father', 'mother', 'spouse', 'son', 'daughter', 'brother', 'sister', 'grandfather', 'grandmother', 'other'],
    required: true
  },
  dateOfBirth: { type: Date },
  gender: { type: String, enum: ['male', 'female', 'other'] },
  bloodGroup: { type: String, enum: ['A+','A-','B+','B-','AB+','AB-','O+','O-', null], default: null },
  avatar: { type: String, default: null },

  // Medical info
  conditions: [{ type: String }],       // Diabetes, Hypertension etc.
  allergies: [{ type: String }],
  medications: [{ type: String }],
  emergencyContact: { type: String },

  // Health records
  vitals: [vitalSchema],
  vaccinations: [vaccinationSchema],

  // Notes
  notes: { type: String },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

// Virtual: age
familyMemberSchema.virtual('age').get(function () {
  if (!this.dateOfBirth) return null;
  const diff = Date.now() - new Date(this.dateOfBirth).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
});

familyMemberSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('FamilyMember', familyMemberSchema);