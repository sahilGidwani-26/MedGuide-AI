const User = require('../models/User');
const Symptom = require('../models/Symptom');
const Report = require('../models/Report');

// @desc    Get user profile
// @route   GET /api/users/profile
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
exports.updateProfile = async (req, res, next) => {
  try {
    const allowedFields = ['name', 'phone', 'dateOfBirth', 'gender', 'bloodGroup', 'allergies', 'currentMedications', 'emergencyContact', 'location'];
    const updates = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true, runValidators: true });
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// @desc    Update avatar
// @route   PUT /api/users/avatar
exports.updateAvatar = async (req, res, next) => {
  try {
    const { avatarUrl } = req.body;
    const user = await User.findByIdAndUpdate(req.user.id, { avatar: avatarUrl }, { new: true });
    res.json({ success: true, data: { avatar: user.avatar } });
  } catch (error) {
    next(error);
  }
};

// @desc    Save hospital
// @route   POST /api/users/saved-hospitals
exports.saveHospital = async (req, res, next) => {
  try {
    const { name, address, phone, lat, lng, distance } = req.body;
    
    const user = await User.findById(req.user.id);
    
    // Check if already saved
    const alreadySaved = user.savedHospitals.some(h => h.lat === lat && h.lng === lng);
    if (alreadySaved) {
      return res.status(400).json({ success: false, message: 'Hospital already saved' });
    }

    user.savedHospitals.push({ name, address, phone, lat, lng, distance });
    await user.save();

    res.json({ success: true, data: user.savedHospitals });
  } catch (error) {
    next(error);
  }
};

// @desc    Get saved hospitals
// @route   GET /api/users/saved-hospitals
exports.getSavedHospitals = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('savedHospitals');
    res.json({ success: true, data: user.savedHospitals });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove saved hospital
// @route   DELETE /api/users/saved-hospitals/:index
exports.removeSavedHospital = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    user.savedHospitals.splice(req.params.index, 1);
    await user.save();
    res.json({ success: true, data: user.savedHospitals });
  } catch (error) {
    next(error);
  }
};

// @desc    Get dashboard stats
// @route   GET /api/users/dashboard
exports.getDashboard = async (req, res, next) => {
  try {
    const [symptomCount, reportCount, recentSymptoms, savedHospitals] = await Promise.all([
      Symptom.countDocuments({ user: req.user.id }),
      Report.countDocuments({ user: req.user.id }),
      Symptom.find({ user: req.user.id }).sort({ createdAt: -1 }).limit(5),
      User.findById(req.user.id).select('savedHospitals healthScore')
    ]);

    const emergencySymptoms = await Symptom.countDocuments({
      user: req.user.id,
      'aiAnalysis.isEmergency': true
    });

    res.json({
      success: true,
      data: {
        stats: {
          totalSymptomChecks: symptomCount,
          totalReports: reportCount,
          emergencyAlerts: emergencySymptoms,
          savedHospitals: savedHospitals.savedHospitals?.length || 0,
          healthScore: savedHospitals.healthScore
        },
        recentSymptoms,
        savedHospitals: savedHospitals.savedHospitals?.slice(0, 3) || []
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update FCM token
// @route   PUT /api/users/fcm-token
exports.updateFcmToken = async (req, res, next) => {
  try {
    const { fcmToken } = req.body;
    await User.findByIdAndUpdate(req.user.id, { fcmToken });
    res.json({ success: true, message: 'FCM token updated' });
  } catch (error) {
    next(error);
  }
};
