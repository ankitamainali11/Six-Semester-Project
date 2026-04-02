const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const isAdmin = require('../middleware/isAdmin');
const adminController = require('../controllers/adminController');

router.use(protect);
router.use(isAdmin);

router.get('/users', adminController.listUsers);
router.post('/users', adminController.createUser);
router.get('/users/:id', adminController.getUser);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);

router.get('/opportunities', adminController.listOpportunities);
router.post('/opportunities', adminController.createOpportunity);
router.put('/opportunities/:id', adminController.updateOpportunity);
router.delete('/opportunities/:id', adminController.deleteOpportunity);

router.get('/stats', adminController.getStats);

module.exports = router;
