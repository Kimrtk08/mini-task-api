const express = require('express');
const router = express.Router();
const taskController = require('../controllers/task.controller');
const authenticate = require('../middleware/authenticate');
const { checkTaskAccess, checkHighPriority } = require('../middleware/abac');
const { checkIdempotency } = require('../middleware/idempotency');

router.post('/', authenticate, checkHighPriority, checkIdempotency, taskController.createTask);
router.get('/', authenticate, taskController.getTasks);
router.get('/:id', authenticate, checkTaskAccess('read'), taskController.getTask);
router.put('/:id', authenticate, checkTaskAccess('write'), taskController.updateTask);
router.patch('/:id/status', authenticate, checkTaskAccess('write'), taskController.updateTaskStatus);
router.delete('/:id', authenticate, checkTaskAccess('write'), taskController.deleteTask);

module.exports = router;