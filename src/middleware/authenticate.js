const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'No token provided',
          timestamp: new Date().toISOString(),
          path: req.path
        }
      });
    }

    const token = authHeader.substring(7);

    // Check if token is blacklisted
    const isBlacklisted = await User.isTokenBlacklisted(token);
    if (isBlacklisted) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Token has been revoked',
          timestamp: new Date().toISOString(),
          path: req.path
        }
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user to request
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      isPremium: decoded.isPremium,
      subscriptionExpiry: decoded.subscriptionExpiry
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid token',
          timestamp: new Date().toISOString(),
          path: req.path
        }
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Token has expired',
          timestamp: new Date().toISOString(),
          path: req.path
        }
      });
    }

    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Authentication failed',
        timestamp: new Date().toISOString(),
        path: req.path
      }
    });
  }
};

module.exports = authenticate;