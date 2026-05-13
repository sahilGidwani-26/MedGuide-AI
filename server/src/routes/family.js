const express = require('express');
const router = express.Router();
const {
  getMembers, getMember, createMember, updateMember, deleteMember,
  addVital, getVitals, deleteVital,
  addVaccination, updateVaccination,
  getAISummary, getFamilyOverview
} = require('../controllers/familyController');
const { protect } = require('../middleware/auth');

router.use(protect);

// Family overview
router.get('/overview', getFamilyOverview);

// Members CRUD
router.route('/')
  .get(getMembers)
  .post(createMember);

router.route('/:id')
  .get(getMember)
  .put(updateMember)
  .delete(deleteMember);

// Vitals
router.post('/:id/vitals', addVital);
router.get('/:id/vitals', getVitals);
router.delete('/:id/vitals/:vitalId', deleteVital);

// Vaccinations
router.post('/:id/vaccinations', addVaccination);
router.put('/:id/vaccinations/:vaccId', updateVaccination);

// AI Summary
router.get('/:id/ai-summary', getAISummary);

module.exports = router;