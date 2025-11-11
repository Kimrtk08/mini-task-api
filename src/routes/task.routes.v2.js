const express = require('express');
const router = express.Router();
const taskController = require('../controllers/task.controller');
const authenticate = require('../middleware/authenticate');
const { checkTaskAccess, checkHighPriority } = require('../middleware/abac');
const { checkIdempotency } = require('../middleware/idempotency');

// Create task (with idempotency) - v2
router.post('/',authenticate,checkHighPriority,checkIdempotency,taskController.createTask);

// Get all tasks - v2 (with metadata)
router.get('/', authenticate, taskController.getTasksV2);

// Get single task - v2 (with metadata)
router.get('/:id', authenticate, checkTaskAccess('read'), taskController.getTaskV2);

// Update task (full update) - v2
router.put('/:id',authenticate,checkTaskAccess('write'),taskController.updateTask);

// Update task status (idempotent) - v2
router.patch('/:id/status',authenticate,checkTaskAccess('write'),taskController.updateTaskStatus
);

// Delete task - v2
router.delete('/:id',authenticate,checkTaskAccess('write'),taskController.deleteTask);

module.exports = router;