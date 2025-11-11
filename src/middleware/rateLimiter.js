const rateLimit = require('express-rate-limit');

// Create rate limiter with dynamic limits based on user role
const createRateLimiter = () => {
  return rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    
    // Dynamic limit based on user role
    max: (req) => {
      if (!req.user) {
        return 20; // Anonymous: 20 requests per 15 minutes
      }
      
      if (req.user.role === 'premium' || req.user.role === 'admin') {
        return 500; // Premium/Admin: 500 requests per 15 minutes
      }
      
      return 100; // Regular user: 100 requests per 15 minutes
    },
    
    // Return rate limit info in headers
    standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    
    // Custom error handler
    handler: (req, res) => {
      const retryAfter = Math.ceil(req.rateLimit.resetTime.getTime() / 1000 - Date.now() / 1000);
      
      res.status(429).json({
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: `Too many requests. Try again in ${Math.ceil(retryAfter / 60)} minutes`,
          retryAfter: retryAfter,
          timestamp: new Date().toISOString(),
          path: req.path
        }
      });
    },
    
    // Use user ID if authenticated, otherwise use IP address
    keyGenerator: (req) => {
      return req.user ? req.user.id : req.ip;
    },
    
    // Skip rate limiting for specific routes (optional)
    skip: (req) => {
      // Skip health check endpoint
      return req.path === '/health';
    }
  });
};

// Middleware to add custom rate limit headers
const rateLimitHeaders = (req, res, next) => {
  const originalJson = res.json.bind(res);
  
  res.json = function(data) {
    // Add custom rate limit headers if rate limit info exists
    if (req.rateLimit) {
      res.set({
        'X-RateLimit-Limit': req.rateLimit.limit,
        'X-RateLimit-Remaining': req.rateLimit.remaining,
        'X-RateLimit-Reset': Math.ceil(req.rateLimit.resetTime.getTime() / 1000)
      });
    }
    return originalJson(data);
  };
  
  next();
};

module.exports = {
  createRateLimiter,
  rateLimitHeaders
};