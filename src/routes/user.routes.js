const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

// User's own profile endpoints
// GET /api/v1/users/me - ดูข้อมูลตัวเอง
router.get('/me', authenticate, userController.getMe);

// PUT /api/v1/users/me - แก้ไขข้อมูลตัวเอง
router.put('/me', authenticate, userController.updateMe);

// DELETE /api/v1/users/me - ลบบัญชีตัวเอง
router.delete('/me', authenticate, userController.deleteMe);

// Admin only endpoints
// GET /api/v1/users - ดูรายชื่อ users ทั้งหมด (admin only)
router.get('/', authenticate, authorize(['admin']), userController.getAllUsers);

module.exports = router;