const mongoose = require('mongoose');

const symptomSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  symptoms: {
    type: String,
    required: [true, 'Symptoms description is required'],
    maxlength: [1000, 'Symptoms cannot exceed 1000 characters']
  },
  inputMethod: {
    type: String,
    enum: ['text', 'voice'],
    default: 'text'
  },
  language: {
    type: String,
    default: 'en'
  },
  aiAnalysis: {
    possibleConditions: [{
      name: String,
      probability: String,
      description: String
    }],
    severityLevel: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'low'
    },
    severityScore: {
      type: Number,
      min: 0,
      max: 10,
      default: 0
    },
    precautions: [String],
    recommendedDoctorType: String,
    immediateActions: [String],
    isEmergency: {
      type: Boolean,
      default: false
    },
    emergencyWarning: String,
    homeRemedies: [String],
    whenToSeekHelp: String,
    disclaimer: String
  },
  location: {
    lat: Number,
    lng: Number,
    city: String
  },
  status: {
    type: String,
    enum: ['pending', 'analyzed', 'reviewed'],
    default: 'pending'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Symptom', symptomSchema);
