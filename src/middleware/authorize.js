// RBAC (Role-Based Access Control) Middleware
const authorize = (roles) => {
  return (req, res, next) => {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
          timestamp: new Date().toISOString(),
          path: req.path
        }
      });
    }

    // Check if user's role is in the allowed roles array
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'Access denied',
          details: {
            requiredRoles: roles,
            userRole: req.user.role
          },
          timestamp: new Date().toISOString(),
          path: req.path
        }
      });
    }

    // User has required role, proceed to next middleware
    next();
  };
};

module.exports = authorize;