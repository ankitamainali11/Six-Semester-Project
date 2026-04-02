const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const isVerified = require('../middleware/isVerified');

const{createTag, getAllTags} = require('../controllers/tagController');

router.post('/', protect, isVerified, createTag);
router.get('/', getAllTags);

module.exports = router;