const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/tokens');

const router = express.Router();


router.post('/register',
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: 'Invalid input', errors: errors.array() });
    const { email, password } = req.body;
    try {
      const existing = await User.findOne({ email });
      if (existing) return res.status(409).json({ message: 'User already exists' });

      const passwordHash = await bcrypt.hash(password, 10);
      const user = new User({ email, passwordHash });
      await user.save();

      res.status(201).json({ message: 'User registered' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  });


router.post('/login',
  body('email').isEmail(),
  body('password').isString().notEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: 'Invalid credentials', errors: errors.array() });

    const { email, password } = req.body;
    try {
      const user = await User.findOne({ email });
      if (!user) return res.status(401).json({ message: 'Invalid credentials' });

      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

      const accessToken = signAccessToken(user);
      const refreshToken = signRefreshToken(user);

      user.refreshTokens.push({ token: refreshToken, createdAt: new Date() });

      const MAX_TOKENS = 8;
      if (user.refreshTokens.length > MAX_TOKENS) {
        user.refreshTokens = user.refreshTokens.slice(-MAX_TOKENS);
      }
      await user.save();

      res.json({ accessToken, refreshToken });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  });


router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ message: 'Refresh token required' });
  try {
    const payload = verifyRefreshToken(refreshToken);
    const userId = payload.sub;
    const user = await User.findById(userId);
    if (!user) return res.status(401).json({ message: 'Invalid refresh token' });


    const found = user.refreshTokens.find(rt => rt.token === refreshToken);
    if (!found) {

      user.refreshTokens = [];
      await user.save();
      return res.status(401).json({ message: 'Refresh token not recognized' });
    }

    user.refreshTokens = user.refreshTokens.filter(rt => rt.token !== refreshToken);
    const newRefresh = signRefreshToken(user);
    user.refreshTokens.push({ token: newRefresh, createdAt: new Date() });
    await user.save();

    const newAccess = signAccessToken(user);
    return res.json({ accessToken: newAccess, refreshToken: newRefresh });
  } catch (err) {
    console.error('Refresh error:', err);
    return res.status(401).json({ message: 'Invalid or expired refresh token' });
  }
});


router.post('/logout', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ message: 'Refresh token required' });
    let decoded;
    try {
      decoded = require('jsonwebtoken').decode(refreshToken);
    } catch (e) {
      decoded = null;
    }
    if (!decoded || !decoded.sub) return res.status(200).json({ message: 'Logged out' });
    const user = await User.findById(decoded.sub);
    if (!user) return res.status(200).json({ message: 'Logged out' });

    user.refreshTokens = user.refreshTokens.filter(rt => rt.token !== refreshToken);
    await user.save();
    return res.status(200).json({ message: 'Logged out' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
