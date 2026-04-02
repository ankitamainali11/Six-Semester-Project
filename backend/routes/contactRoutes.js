const express = require('express');
const router = express.Router();

// Handle contact form submission
router.post('/', async (req, res) => {
  try {
    const { name, email, subject, category, message } = req.body;
    
    // Here you would typically save to database or send email
    // For now, we'll just log the message and return success
    console.log('Contact form submission:', { name, email, subject, category, message });
    
    res.json({ success: true, message: 'Message sent successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router; 