const mongoose = require('mongoose');

// ── Sub-schemas ───────────────────────────────────────────────

const moodEntrySchema = new mongoose.Schema({
  emoji:    { type: String, required: true },
  label:    { type: String, required: true },
  score:    { type: Number, required: true, min: 1, max: 5 },
  color:    { type: String, required: true },
  note:     { type: String, default: '' },
  loggedAt: { type: Date,   default: Date.now },
});

const stressEntrySchema = new mongoose.Schema({
  level:    { type: Number, required: true, min: 1, max: 10 },
  note:     { type: String, default: '' },
  loggedAt: { type: Date,   default: Date.now },
});

const breathingSessionSchema = new mongoose.Schema({
  cycles:      { type: Number, required: true, min: 1 },
  durationSec: { type: Number, default: 0 },
  loggedAt:    { type: Date,   default: Date.now },
});

const phq9ResultSchema = new mongoose.Schema({
  answers:       { type: [Number], required: true },
  score:         { type: Number,   required: true, min: 0, max: 27 },
  severityLabel: { type: String,   required: true },
  severityColor: { type: String,   required: true },
  loggedAt:      { type: Date,     default: Date.now },
});

const chatMessageSchema = new mongoose.Schema({
  role:    { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true },
  sentAt:  { type: Date,   default: Date.now },
});

// ── Main Document (one per user) ──────────────────────────────

const mentalHealthSchema = new mongoose.Schema(
  {
    user: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      unique:   true,
      index:    true,
    },
    moodHistory:      { type: [moodEntrySchema],        default: [] },
    stressHistory:    { type: [stressEntrySchema],       default: [] },
    breathingHistory: { type: [breathingSessionSchema],  default: [] },
    phq9History:      { type: [phq9ResultSchema],        default: [] },
    chatHistory:      { type: [chatMessageSchema],       default: [] },
  },
  { timestamps: true }
);

// Keep arrays bounded on every save
mentalHealthSchema.pre('save', function (next) {
  const cap = (arr, n) => (arr.length > n ? arr.slice(-n) : arr);
  this.moodHistory      = cap(this.moodHistory,      50);
  this.stressHistory    = cap(this.stressHistory,    50);
  this.breathingHistory = cap(this.breathingHistory, 50);
  this.phq9History      = cap(this.phq9History,      20);
  this.chatHistory      = cap(this.chatHistory,      100);
  next();
});

module.exports = mongoose.model('MentalHealth', mentalHealthSchema);