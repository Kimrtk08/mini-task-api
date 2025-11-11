const User = require('../models/user.model');

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found', timestamp: new Date().toISOString(), path: req.path }});
    res.json({ id: user.id, email: user.email, name: user.name, role: user.role, isPremium: user.isPremium, subscriptionExpiry: user.subscriptionExpiry, createdAt: user.createdAt });
  } catch (error) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve user', timestamp: new Date().toISOString(), path: req.path }});
  }
};

exports.updateMe = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (email) updates.email = email;
    if (password) updates.password = password;
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'No valid fields to update', timestamp: new Date().toISOString(), path: req.path }});
    }
    if (email) {
      const existingUser = await User.findByEmail(email);
      if (existingUser && existingUser.id !== req.user.id) {
        return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Email already exists', timestamp: new Date().toISOString(), path: req.path }});
      }
    }
    const updatedUser = await User.update(req.user.id, updates);
    res.json({ message: 'User updated successfully', user: { id: updatedUser.id, email: updatedUser.email, name: updatedUser.name, role: updatedUser.role, isPremium: updatedUser.isPremium }});
  } catch (error) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to update user', timestamp: new Date().toISOString(), path: req.path }});
  }
};

exports.deleteMe = async (req, res) => {
  try {
    const deleted = await User.delete(req.user.id);
    if (!deleted) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found', timestamp: new Date().toISOString(), path: req.path }});
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to delete account', timestamp: new Date().toISOString(), path: req.path }});
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.getAll();
    res.json({ count: users.length, users });
  } catch (error) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve users', timestamp: new Date().toISOString(), path: req.path }});
  }
};