const express = require('express');
const router = express.Router();
const {
  getProfile, updateProfile, updateAvatar,
  saveHospital, getSavedHospitals, removeSavedHospital,
  getDashboard, updateFcmToken
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.put('/avatar', updateAvatar);
router.get('/dashboard', getDashboard);
router.put('/fcm-token', updateFcmToken);

router.route('/saved-hospitals')
  .get(getSavedHospitals)
  .post(saveHospital);

router.delete('/saved-hospitals/:index', removeSavedHospital);

module.exports = router;
