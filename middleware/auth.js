const { verifyAccessToken } = require('../utils/tokens');

const authMiddleware = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ message: 'Authorization header required' });
  const parts = header.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ message: 'Malformed authorization header' });
  const token = parts[1];
  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, email: payload.email };
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired access token' });
  }
};

module.exports = { authMiddleware };
