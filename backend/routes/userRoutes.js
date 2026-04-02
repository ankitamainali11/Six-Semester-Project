const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');

// Get user's saved opportunities
router.get('/saved-opportunities', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('savedOpportunities');
    res.json({ savedOpportunities: user.savedOpportunities || [] });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user's interests (for testing)
router.get('/interests', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ 
      interests: user.interests || [],
      userId: user._id,
      userName: user.name 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Manually add tags to user interests (for testing)
router.post('/interests/add', protect, async (req, res) => {
  try {
    const { tags } = req.body;
    const user = await User.findById(req.user._id);
    
    console.log('=== MANUAL TAG ADDITION TEST ===');
    console.log('User current interests:', user.interests);
    console.log('Tags to add:', tags);
    
    if (tags && Array.isArray(tags)) {
      const newInterests = tags.map(tag => tag.toLowerCase().trim());
      const updatedInterests = [...new Set([...user.interests, ...newInterests])];
      user.interests = updatedInterests;
      await user.save();
      
      console.log('Updated user interests:', user.interests);
      console.log('=== MANUAL TAG ADDITION COMPLETE ===');
      
      res.json({ 
        success: true,
        oldInterests: user.interests,
        newInterests: updatedInterests,
        addedTags: newInterests
      });
    } else {
      res.status(400).json({ message: 'Tags array is required' });
    }
  } catch (error) {
    console.error('Error in manual tag addition:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Save an opportunity
router.post('/saved-opportunities', protect, async (req, res) => {
  try {
    const { opportunityId } = req.body;
    const user = await User.findById(req.user._id);
    
    if (!user.savedOpportunities.includes(opportunityId)) {
      user.savedOpportunities.push(opportunityId);
      await user.save();
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Remove saved opportunity
router.delete('/saved-opportunities/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.savedOpportunities = user.savedOpportunities.filter(
      id => id.toString() !== req.params.id
    );
    await user.save();
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update user profile
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, email, phone, location, bio, skills, interests, availability } = req.body;
    
    const user = await User.findById(req.user._id);
    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email;
    if (phone !== undefined) user.phone = phone;
    if (location !== undefined) user.location = location;
    if (bio !== undefined) user.bio = bio;
    if (skills !== undefined) user.skills = skills;
    if (interests !== undefined) user.interests = interests;
    if (availability !== undefined) user.availability = availability;
    
    await user.save();
    
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Test email sending (protected)
router.post('/test-email', protect, async (req, res) => {
  try {
    const { to, subject, text } = req.body;
    if (!to) return res.status(400).json({ message: 'Recipient (to) required' });
    const info = await sendEmail(to, subject || 'Test Email', text || 'This is a test email from Volunteer System.');
    res.json({ success: true, messageId: info?.messageId || null });
  } catch (error) {
    console.error('Test email error:', error?.message || error);
    res.status(500).json({ message: 'Email send failed', error: error.message });
  }
});

module.exports = router; 