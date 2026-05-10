const Symptom = require('../models/Symptom');
const { analyzeSymptoms } = require('../ai/gemini');

// @desc    Analyze symptoms with AI
// @route   POST /api/symptoms/analyze
exports.analyzeSymptoms = async (req, res, next) => {
  try {
    const { symptoms, inputMethod, language, location } = req.body;

    if (!symptoms || symptoms.trim().length < 3) {
      return res.status(400).json({ success: false, message: 'Please describe your symptoms' });
    }

    // AI Analysis
    const aiAnalysis = await analyzeSymptoms(symptoms);

    // Save to DB
    const symptomRecord = await Symptom.create({
      user: req.user.id,
      symptoms: symptoms.trim(),
      inputMethod: inputMethod || 'text',
      language: language || 'en',
      location,
      aiAnalysis,
      status: 'analyzed'
    });

    // Emit emergency alert via socket if critical
    if (aiAnalysis.isEmergency || aiAnalysis.severityLevel === 'critical') {
      const io = req.app.get('io');
      if (io) {
        io.to(`user_${req.user.id}`).emit('emergency_alert', {
          message: aiAnalysis.emergencyWarning || 'Critical symptoms detected. Seek emergency help immediately!',
          symptomId: symptomRecord._id
        });
      }
    }

    res.status(201).json({
      success: true,
      data: {
        id: symptomRecord._id,
        symptoms,
        aiAnalysis,
        createdAt: symptomRecord.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get symptom history
// @route   GET /api/symptoms/history
exports.getHistory = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const symptoms = await Symptom.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Symptom.countDocuments({ user: req.user.id });

    res.json({
      success: true,
      data: symptoms,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single symptom analysis
// @route   GET /api/symptoms/:id
exports.getSymptom = async (req, res, next) => {
  try {
    const symptom = await Symptom.findOne({ _id: req.params.id, user: req.user.id });
    if (!symptom) {
      return res.status(404).json({ success: false, message: 'Symptom record not found' });
    }
    res.json({ success: true, data: symptom });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete symptom record
// @route   DELETE /api/symptoms/:id
exports.deleteSymptom = async (req, res, next) => {
  try {
    const symptom = await Symptom.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!symptom) {
      return res.status(404).json({ success: false, message: 'Symptom record not found' });
    }
    res.json({ success: true, message: 'Symptom record deleted' });
  } catch (error) {
    next(error);
  }
};
