const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const { v4: uuidv4 } = require('uuid');

const generateAccessToken = (user) => {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role, isPremium: user.isPremium, subscriptionExpiry: user.subscriptionExpiry },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { userId: user.id, tokenId: uuidv4() },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
};

exports.register = async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Invalid input data',
          details: { email: !email ? 'Email is required' : undefined, password: !password ? 'Password is required' : undefined, name: !name ? 'Name is required' : undefined },
          timestamp: new Date().toISOString(), path: req.path }
      });
    }
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Email already exists', timestamp: new Date().toISOString(), path: req.path }});
    }
    const user = await User.create({ email, password, name });
    res.status(201).json({ message: 'User registered successfully', user: { id: user.id, email: user.email, name: user.name, role: user.role }});
  } catch (error) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Registration failed', timestamp: new Date().toISOString(), path: req.path }});
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Email and password are required', timestamp: new Date().toISOString(), path: req.path }});
    }
    const user = await User.findByEmail(email);
    if (!user || !(await User.comparePassword(password, user.password))) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Invalid credentials', timestamp: new Date().toISOString(), path: req.path }});
    }
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    const refreshExpiry = new Date(); refreshExpiry.setDate(refreshExpiry.getDate() + 7);
    await User.saveRefreshToken(user.id, refreshToken, refreshExpiry);
    res.json({ accessToken, refreshToken, user: { id: user.id, email: user.email, name: user.name, role: user.role, isPremium: user.isPremium }});
  } catch (error) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Login failed', timestamp: new Date().toISOString(), path: req.path }});
  }
};

exports.refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Refresh token is required', timestamp: new Date().toISOString(), path: req.path }});
    }
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const tokenData = await User.findRefreshToken(refreshToken);
    if (!tokenData) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Invalid refresh token', timestamp: new Date().toISOString(), path: req.path }});
    }
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'User not found', timestamp: new Date().toISOString(), path: req.path }});
    }
    const newAccessToken = generateAccessToken(user);
    res.json({ accessToken: newAccessToken });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Invalid or expired refresh token', timestamp: new Date().toISOString(), path: req.path }});
    }
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Token refresh failed', timestamp: new Date().toISOString(), path: req.path }});
  }
};

exports.logout = async (req, res) => {
  try {
    const token = req.headers.authorization.substring(7);
    const decoded = jwt.decode(token);
    await User.blacklistToken(token, new Date(decoded.exp * 1000));
    const { refreshToken } = req.body;
    if (refreshToken) await User.deleteRefreshToken(refreshToken);
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Logout failed', timestamp: new Date().toISOString(), path: req.path }});
  }
};