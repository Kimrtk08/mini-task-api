const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authenticate = require('../middleware/authenticate');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected routes
router.post('/refresh', authenticate, authController.refresh);
router.post('/logout', authenticate, authController.logout);

module.exports = router;