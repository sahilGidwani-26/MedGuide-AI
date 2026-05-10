const express = require('express');
const router = express.Router();
const {
  uploadReport, getReports, getReport,
  deleteReport, uploadMiddleware, analyzeReport
} = require('../controllers/reportController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getReports)
  .post(uploadMiddleware, uploadReport);

router.route('/:id')
  .get(getReport)
  .delete(deleteReport);

// Re-analyze existing report
router.post('/:id/analyze', analyzeReport);

module.exports = router;