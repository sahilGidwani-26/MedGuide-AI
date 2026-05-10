const express = require('express');
const router = express.Router();
const { getAnalytics, getUsers, toggleUserStatus, getAllSymptoms } = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('admin'));

router.get('/analytics', getAnalytics);
router.get('/users', getUsers);
router.put('/users/:id/toggle', toggleUserStatus);
router.get('/symptoms', getAllSymptoms);

module.exports = router;
