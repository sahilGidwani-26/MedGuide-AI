const express = require('express');
const router = express.Router();
const {
  scanMedicine,
  checkInteraction,
  translateToHindi,
  uploadMiddleware
} = require('../controllers/medicineController');
const { protect } = require('../middleware/auth');

router.use(protect);

// Scan medicine image OR search by name
router.post('/scan', (req, res, next) => {
  uploadMiddleware(req, res, (err) => {
    if (err) return res.status(400).json({ success: false, message: err.message });
    next();
  });
}, scanMedicine);

// Drug interaction check
router.post('/interaction', checkInteraction);

// Translate to Hindi
router.post('/translate', translateToHindi);

module.exports = router;