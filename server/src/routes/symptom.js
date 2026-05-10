const express = require('express');
const router = express.Router();
const { analyzeSymptoms, getHistory, getSymptom, deleteSymptom } = require('../controllers/symptomController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/analyze', analyzeSymptoms);
router.get('/history', getHistory);
router.route('/:id').get(getSymptom).delete(deleteSymptom);

module.exports = router;
