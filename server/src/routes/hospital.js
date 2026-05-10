const express = require('express');
const router = express.Router();
const { getNearbyHospitals, getEmergencyHospitals } = require('../controllers/hospitalController');

router.get('/nearby', getNearbyHospitals);
router.get('/emergency', getEmergencyHospitals);

module.exports = router;
