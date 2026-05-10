const User = require('../models/User');
const Symptom = require('../models/Symptom');
const Report = require('../models/Report');
const Doctor = require('../models/Doctor');

// @desc    Get admin dashboard analytics
// @route   GET /api/admin/analytics
exports.getAnalytics = async (req, res, next) => {
  try {
    const [totalUsers, totalSymptoms, totalReports, totalDoctors, emergencyAlerts] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      Symptom.countDocuments(),
      Report.countDocuments(),
      Doctor.countDocuments({ isActive: true }),
      Symptom.countDocuments({ 'aiAnalysis.isEmergency': true })
    ]);

    // Recent registrations (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const newUsers = await User.countDocuments({ createdAt: { $gte: sevenDaysAgo } });

    // Symptom severity distribution
    const severityDist = await Symptom.aggregate([
      { $group: { _id: '$aiAnalysis.severityLevel', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      data: {
        stats: { totalUsers, totalSymptoms, totalReports, totalDoctors, emergencyAlerts, newUsers },
        severityDistribution: severityDist
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
exports.getUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search;
    const query = {};
    if (search) query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: users,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle user active status
// @route   PUT /api/admin/users/:id/toggle
exports.toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.isActive = !user.isActive;
    await user.save();
    res.json({ success: true, data: { isActive: user.isActive } });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all symptoms (admin)
// @route   GET /api/admin/symptoms
exports.getAllSymptoms = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const symptoms = await Symptom.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    const total = await Symptom.countDocuments();
    res.json({
      success: true,
      data: symptoms,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    next(error);
  }
};
