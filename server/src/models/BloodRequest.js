const mongoose = require('mongoose');

const bloodRequestSchema = new mongoose.Schema({
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  patientName:  { type: String, required: true, trim: true },
  bloodGroup:   {
    type: String,
    required: true,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
  },
  unitsNeeded:  { type: Number, default: 1 },
  hospital:     { type: String, required: true, trim: true },
  city:         { type: String, required: true, trim: true },
  contactPhone: { type: String, required: true },
  urgency:      { type: String, enum: ['critical', 'urgent', 'normal'], default: 'urgent' },
  notes:        { type: String, maxlength: 300 },
  location: {
    type:        { type: String, default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] }
  },
  status: {
    type: String,
    enum: ['open', 'fulfilled', 'cancelled'],
    default: 'open'
  },
  respondedDonors: [{
    donor:       { type: mongoose.Schema.Types.ObjectId, ref: 'BloodDonor' },
    respondedAt: { type: Date, default: Date.now },
    status:      { type: String, enum: ['interested', 'confirmed', 'declined'], default: 'interested' }
  }],
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)  // 7 days
  }
}, { timestamps: true });

bloodRequestSchema.index({ location: '2dsphere' });
bloodRequestSchema.index({ bloodGroup: 1, status: 1 });
bloodRequestSchema.index({ city: 1, status: 1 });
bloodRequestSchema.index({ requester: 1, createdAt: -1 });

module.exports = mongoose.model('BloodRequest', bloodRequestSchema);