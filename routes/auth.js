// routes/auth.js
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const {
  authMiddleware,
  adminMiddleware,
  validateSignup,
  validateLogin,
  validateUserId,
  validateUpdateUser,
} = require('../middleware/auth');

const router = express.Router();

// Signup (consolidated /register, /adduser, /signup)
router.post('/register', validateSignup, async (req, res) => {
  try {
    const { email, password, name, role, googleId, image, provider, active } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const hashedPassword = password ? await bcrypt.hash(password, 10) : undefined;
    const user = new User({
      email,
      password: hashedPassword,
      name,
      role: role || 'user',
      googleId,
      image,
      provider: provider || 'local',
      active: active !== undefined ? active : true,
    });

    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        active: user.active,
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// Login
router.post('/login', validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    if (!user.active) {
      return res.status(403).json({ message: 'Account is deactivated' });
    }

    if (user.provider === 'local' && password) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid email or password' });
      }
    } else if (user.provider !== 'local') {
      return res.status(400).json({ message: 'Use social login for this account' });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        active: user.active,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// Get all users (admin only)
router.get(
  '/users',
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const users = await User.find().select('-password -__v');
      res.json(users);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      res.status(500).json({ message: 'Internal server error', error: error.message });
    }
  }
);

// Update a user by ID (admin or self)
router.put(
  '/users/:id',
  authMiddleware,
  validateUserId,
  validateUpdateUser,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { name, email, role, active, password, image, provider } = req.body;

      // Check if user is admin or updating their own profile
      const requestingUser = await User.findById(req.user.userId);
      if (req.user.userId !== id && requestingUser.role !== 'admin') {
        return res.status(403).json({ message: 'Unauthorized to update this user' });
      }

      const updatedData = { name, email, image, provider };
      if (password) {
        updatedData.password = await bcrypt.hash(password, 10);
      }
      if (requestingUser.role === 'admin') {
        updatedData.role = role || 'user';
        updatedData.active = active !== undefined ? active : true;
      }

      const updatedUser = await User.findByIdAndUpdate(
        id,
        { $set: updatedData },
        { new: true }
      ).select('-password -__v');

      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json(updatedUser);
    } catch (error) {
      console.error('Failed to update user:', error);
      res.status(500).json({ message: 'Internal server error', error: error.message });
    }
  }
);

// Delete a user by ID (admin only)
router.delete(
  '/users/:id',
  authMiddleware,
  adminMiddleware,
  validateUserId,
  async (req, res) => {
    try {
      const user = await User.findByIdAndDelete(req.params.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      console.error('Failed to delete user:', error);
      res.status(500).json({ message: 'Internal server error', error: error.message });
    }
  }
);
router.post('/check-user', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        active: user.active,
      },
      token: jwt.sign({ userId: user._id }, process.env.JWT_SECRET),
    });
  } catch (error) {
    console.error('Check user error:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});
// routes/auth.js
router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;
  const user = await User.findOne({ refreshToken });
  if (!user) return res.status(401).json({ message: 'Invalid refresh token' });
  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  res.json({ token });
});

module.exports = router;