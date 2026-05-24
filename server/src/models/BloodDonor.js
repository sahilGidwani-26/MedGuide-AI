const mongoose = require('mongoose');

const bloodDonorSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true   // one donor profile per user
  },
  name:        { type: String, required: true, trim: true },
  bloodGroup:  {
    type: String,
    required: true,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
  },
  phone:       { type: String, required: true, trim: true },
  city:        { type: String, required: true, trim: true },
  state:       { type: String, trim: true },
  location: {
    type:        { type: String, default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] }   // [lng, lat]
  },
  isAvailable:     { type: Boolean, default: true },
  lastDonated:     { type: Date },
  totalDonations:  { type: Number, default: 0 },
  medicalConditions: { type: String, maxlength: 300 },
  age:             { type: Number },
  weight:          { type: Number },  // kg
  // FCM token for push (reuse from user if possible)
  fcmToken:        { type: String }
}, { timestamps: true });

bloodDonorSchema.index({ location: '2dsphere' });
bloodDonorSchema.index({ bloodGroup: 1, isAvailable: 1 });
bloodDonorSchema.index({ city: 1, bloodGroup: 1 });

module.exports = mongoose.model('BloodDonor', bloodDonorSchema);