// src/middleware/auth.js
const { verifyAccessToken } = require('../utils/tokens');

module.exports = function authMiddleware(req, res, next) {
  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authorization required' });
    }
    const token = auth.split(' ')[1];
    let payload;
    try {
      payload = verifyAccessToken(token); // may throw
    } catch (err) {
      console.error('authMiddleware: token verify failed:', err.message || err);
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    // attach user info (normalized)
    req.user = {
      id: payload.sub, // important: tokens.js signs sub
      email: payload.email,
      username: payload.username,
    };

    // helpful debug log (remove in production)
    console.debug('authMiddleware: user=', req.user);

    next();
  } catch (err) {
    console.error('authMiddleware unexpected error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};
