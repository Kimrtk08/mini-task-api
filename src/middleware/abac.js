const Task = require('../models/task.model');

const checkTaskAccess = (action) => {
  return async (req, res, next) => {
    try {
      const task = await Task.findById(req.params.id);
      if (!task) {
        return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Task not found', timestamp: new Date().toISOString(), path: req.path }});
      }
      if (req.user.role === 'admin') {
        req.task = task;
        return next();
      }
      if (action === 'read') {
        if (task.isPublic || task.ownerId === req.user.id || task.assignedTo === req.user.id) {
          req.task = task;
          return next();
        }
      } else if (action === 'write') {
        if (task.ownerId === req.user.id) {
          req.task = task;
          return next();
        }
      }
      return res.status(403).json({ error: { code: 'ACCESS_DENIED', message: "You don't have permission to access this resource", timestamp: new Date().toISOString(), path: req.path }});
    } catch (error) {
      return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to check access', timestamp: new Date().toISOString(), path: req.path }});
    }
  };
};

const checkPremiumFeature = (req, res, next) => {
  if (req.user.role === 'admin') return next();
  if (req.user.isPremium && req.user.subscriptionExpiry && new Date(req.user.subscriptionExpiry) > new Date()) {
    return next();
  }
  return res.status(403).json({ error: { code: 'PREMIUM_REQUIRED', message: 'This feature requires premium subscription', timestamp: new Date().toISOString(), path: req.path }});
};

const checkHighPriority = (req, res, next) => {
  if (req.body.priority !== 'high') return next();
  if (req.user.role === 'admin') return next();
  if (req.user.isPremium && req.user.subscriptionExpiry && new Date(req.user.subscriptionExpiry) > new Date()) {
    return next();
  }
  return res.status(403).json({ error: { code: 'PREMIUM_REQUIRED', message: 'Creating high priority tasks requires premium subscription', timestamp: new Date().toISOString(), path: req.path }});
};

module.exports = { checkTaskAccess, checkPremiumFeature, checkHighPriority };