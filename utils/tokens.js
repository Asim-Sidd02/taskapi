const jwt = require('jsonwebtoken');

const signAccessToken = (user) => {
  const payload = { sub: user._id.toString(), email: user.email };
  const secret = process.env.JWT_ACCESS_SECRET;
  const expiresIn = process.env.ACCESS_TOKEN_EXPIRES_IN || '15m';
  return jwt.sign(payload, secret, { expiresIn });
};

const signRefreshToken = (user) => {
  const payload = { sub: user._id.toString() };
  const secret = process.env.JWT_REFRESH_SECRET;
  const expiresIn = process.env.REFRESH_TOKEN_EXPIRES_IN || '30d';
  return jwt.sign(payload, secret, { expiresIn });
};

const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
};

const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
};

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken
};
