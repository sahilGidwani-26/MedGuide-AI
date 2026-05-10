const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  specialization: {
    type: String,
    required: true
  },
  qualification: [String],
  experience: {
    type: Number,
    default: 0
  },
  hospital: String,
  address: String,
  phone: String,
  email: String,
  avatar: String,
  rating: {
    type: Number,
    default: 4.0,
    min: 0,
    max: 5
  },
  reviewCount: {
    type: Number,
    default: 0
  },
  consultationFee: {
    type: Number,
    default: 0
  },
  availability: {
    type: Boolean,
    default: true
  },
  availableSlots: [{
    day: String,
    startTime: String,
    endTime: String
  }],
  location: {
    lat: Number,
    lng: Number,
    city: String
  },
  languages: [String],
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Doctor', doctorSchema);
