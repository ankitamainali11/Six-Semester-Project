const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Opportunity = require('../models/Opportunity');

// User management
exports.listUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const role = req.query.role;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {};
    if (role && ['volunteer', 'organization', 'admin'].includes(role)) {
      filter.role = role;
    }

    const users = await User.find(filter)
      .select('-password -tokens')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(filter);
    const pages = Math.ceil(total / limit);

    console.log(`Admin ${req.user.id} listed users - page ${page}, role filter: ${role || 'all'}`);

    res.json({
      users,
      page,
      pages,
      total
    });
  } catch (error) {
    console.error('Error listing users:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    // Prevent admin creation via API
    if (role === 'admin') {
      return res.status(400).json({ message: 'Cannot create admin accounts via API' });
    }

    // Validate role
    if (role && !['volunteer', 'organization'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Must be volunteer or organization' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: role || 'volunteer',
      isVerified: true // Admin-created users are auto-verified
    });

    await user.save();

    console.log(`Admin ${req.user.id} created user: ${user.email} with role: ${user.role}`);

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password -tokens');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log(`Admin ${req.user.id} viewed user: ${user.email}`);

    res.json({ user });
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { name, email, role } = req.body;
    const userId = req.params.id;

    // Get target user
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent editing admin accounts
    if (targetUser.role === 'admin') {
      return res.status(403).json({ message: 'Cannot edit admin accounts' });
    }

    // Prevent setting role to admin
    if (role === 'admin') {
      return res.status(400).json({ message: 'Cannot set role to admin' });
    }

    // Validate role if provided
    if (role && !['volunteer', 'organization'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Must be volunteer or organization' });
    }

    // Check if email is already taken by another user
    if (email && email !== targetUser.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already taken' });
      }
    }

    // Update user
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (role) updateData.role = role;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password -tokens');

    console.log(`Admin ${req.user.id} updated user: ${updatedUser.email}`);

    res.json({
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

    // Get target user
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent deleting admin accounts
    if (targetUser.role === 'admin') {
      return res.status(403).json({ message: 'Cannot delete admin accounts' });
    }

    await User.findByIdAndDelete(userId);

    console.log(`Admin ${req.user.id} deleted user: ${targetUser.email}`);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Opportunity management
exports.listOpportunities = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const opportunities = await Opportunity.find()
      .populate('organization', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Opportunity.countDocuments();
    const pages = Math.ceil(total / limit);

    console.log(`Admin ${req.user.id} listed opportunities - page ${page}`);

    res.json({
      opportunities,
      page,
      pages,
      total
    });
  } catch (error) {
    console.error('Error listing opportunities:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.createOpportunity = async (req, res) => {
  try {
    const opportunityData = {
      ...req.body,
      organization: req.user.id, // Admin creating opportunity
      organizationName: req.user.name
    };

    const opportunity = new Opportunity(opportunityData);
    await opportunity.save();

    const populatedOpportunity = await Opportunity.findById(opportunity._id)
      .populate('organization', 'name email');

    console.log(`Admin ${req.user.id} created opportunity: ${opportunity.title}`);

    res.status(201).json({
      message: 'Opportunity created successfully',
      opportunity: populatedOpportunity
    });
  } catch (error) {
    console.error('Error creating opportunity:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.updateOpportunity = async (req, res) => {
  try {
    const opportunityId = req.params.id;
    const updateData = req.body;

    const opportunity = await Opportunity.findByIdAndUpdate(
      opportunityId,
      updateData,
      { new: true, runValidators: true }
    ).populate('organization', 'name email');

    if (!opportunity) {
      return res.status(404).json({ message: 'Opportunity not found' });
    }

    console.log(`Admin ${req.user.id} updated opportunity: ${opportunity.title}`);

    res.json({
      message: 'Opportunity updated successfully',
      opportunity
    });
  } catch (error) {
    console.error('Error updating opportunity:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.deleteOpportunity = async (req, res) => {
  try {
    const opportunityId = req.params.id;

    const opportunity = await Opportunity.findById(opportunityId);
    if (!opportunity) {
      return res.status(404).json({ message: 'Opportunity not found' });
    }

    await Opportunity.findByIdAndDelete(opportunityId);

    console.log(`Admin ${req.user.id} deleted opportunity: ${opportunity.title}`);

    res.json({ message: 'Opportunity deleted successfully' });
  } catch (error) {
    console.error('Error deleting opportunity:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Admin stats
exports.getStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalVolunteers = await User.countDocuments({ role: 'volunteer' });
    const totalOrganizations = await User.countDocuments({ role: 'organization' });
    const totalAdmins = await User.countDocuments({ role: 'admin' });
    const totalOpportunities = await Opportunity.countDocuments();
    const activeOpportunities = await Opportunity.countDocuments({ status: 'active' });

    console.log(`Admin ${req.user.id} viewed stats`);

    res.json({
      users: {
        total: totalUsers,
        volunteers: totalVolunteers,
        organizations: totalOrganizations,
        admins: totalAdmins
      },
      opportunities: {
        total: totalOpportunities,
        active: activeOpportunities
      }
    });
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
