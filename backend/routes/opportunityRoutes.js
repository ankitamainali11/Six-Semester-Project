const express = require('express');
const router = express.Router();
const {
    createOpportunity,
    getAllOpportunities,
    getOpportunityById,
    getOpportunityTags,
    getMyOpportunities,
    getMyApplications,
    applyToOpportunity,
    getApplicants,
    updateOpportunity,
    deleteOpportunity,
    approveApplicant,
    rejectApplicant,
    markAsCompleted,
    getRecommendedOpportunities,
    getUserDashboard,
    searchOpportunities
} = require ('../controllers/opportunityController');
const { protect } = require('../middleware/authMiddleware');
const isVerified = require('../middleware/isVerified');

router.get('/', getAllOpportunities);
router.post('/', protect, createOpportunity);
router.get('/my', protect, getMyOpportunities);
router.get('/my-applications', protect, getMyApplications);
router.get('/recommendations', protect, getRecommendedOpportunities);
router.get('/dashboard', protect, getUserDashboard);
router.get('/search', searchOpportunities);

router.get('/:id', getOpportunityById);
router.get('/:id/tags', getOpportunityTags);
router.post('/:id/apply', protect, applyToOpportunity);
router.get('/:id/applicants', protect, getApplicants);

router.put('/:id', protect, updateOpportunity);
router.delete('/:id', protect, deleteOpportunity);

router.post('/:id/approve-applicant', protect, approveApplicant);
router.post('/:id/reject-applicant', protect, rejectApplicant);
router.post('/:id/mark-completed', protect, markAsCompleted);

router.get('/recommendations', protect, getRecommendedOpportunities);
router.get('/dashboard', protect, getUserDashboard);
router.get('/my-applications', protect, getMyApplications);

router.get('/search', searchOpportunities);
module.exports = router;