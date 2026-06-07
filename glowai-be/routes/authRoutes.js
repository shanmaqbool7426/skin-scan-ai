const express = require('express');
const User = require('../models/User');
const { authenticateToken, generateToken } = require('../middleware/auth');

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/auth/register', async (req, res) => {
  try {
    const { name, email, password, skinType, age } = req.body;

    // Validate request
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email is already registered' });
    }

    // Create new user
    const user = new User({
      name,
      email,
      password,
      skinType: skinType || 'Combination',
      age: age || 25,
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      token,
      user,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Log in user & get token
 * @access  Public
 */
router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user by email and select password (which is excluded by default)
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user._id);

    // Remove password before returning user
    const userJson = user.toJSON();

    res.json({
      token,
      user: userJson,
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ error: 'Server error during login' });
  }
});

/**
 * @route   GET /api/user/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/user/me', authenticateToken, async (req, res) => {
  try {
    res.json({ user: req.user });
  } catch (error) {
    console.error('Get profile error:', error.message);
    res.status(500).json({ error: 'Server error fetching user profile' });
  }
});

/**
 * @route   PUT /api/user/me
 * @desc    Update user profile (skinType, age, name, etc.)
 * @access  Private
 */
router.put('/user/me', authenticateToken, async (req, res) => {
  try {
    const { name, skinType, age, avatar } = req.body;
    const user = req.user;

    if (name) user.name = name;
    if (skinType) user.skinType = skinType;
    if (age !== undefined) user.age = age;
    if (avatar !== undefined) user.avatar = avatar;

    await user.save();

    res.json({ user });
  } catch (error) {
    console.error('Update profile error:', error.message);
    res.status(500).json({ error: 'Server error updating profile' });
  }
});

module.exports = router;
