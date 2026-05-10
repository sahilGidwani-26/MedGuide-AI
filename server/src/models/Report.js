const mongoose = require('mongoose');

const findingSchema = new mongoose.Schema({
  parameter: String,
  value: String,
  status: { type: String, enum: ['normal', 'high', 'low', 'abnormal', 'unknown'], default: 'unknown' },
  english: String,
  hindi: String,
}, { _id: false });

const bilingualSchema = new mongoose.Schema({
  english: String,
  hindi: String,
}, { _id: false });

const bilingualArraySchema = new mongoose.Schema({
  english: [String],
  hindi: [String],
}, { _id: false });

const aiAnalysisSchema = new mongoose.Schema({
  summary:         bilingualSchema,
  findings:        [findingSchema],
  diet:            bilingualArraySchema,
  avoid:           bilingualArraySchema,
  lifestyle:       bilingualArraySchema,
  whenToSeeDoctor: bilingualSchema,
  overallSeverity: { type: String, enum: ['normal', 'mild', 'moderate', 'severe'], default: 'normal' },
  urgency:         { type: String, enum: ['routine', 'soon', 'urgent', 'emergency'], default: 'routine' },
  disclaimer:      bilingualSchema,
}, { _id: false });

const reportSchema = new mongoose.Schema({
  user:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:        { type: String, required: true, trim: true },
  type:         {
    type: String,
    enum: ['blood_test','xray','mri','prescription','discharge','vaccination','dental','eye','other'],
    default: 'other'
  },
  fileUrl:      { type: String, required: true },
  publicId:     { type: String, required: true },
  fileType:     { type: String, enum: ['image', 'pdf'], required: true },
  notes:        String,
  doctorName:   String,
  hospitalName: String,
  reportDate:   { type: Date, default: Date.now },
  aiAnalysis:   { type: aiAnalysisSchema, default: null },
}, { timestamps: true });

module.exports = mongoose.models.Report || mongoose.model('Report', reportSchema);