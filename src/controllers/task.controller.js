const Task = require('../models/task.model');
const { saveIdempotentResponse } = require('../middleware/idempotency');

exports.createTask = async (req, res) => {
  try {
    const { title, description, status, priority, assignedTo, isPublic } = req.body;
    if (!title) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid input data', details: { title: 'Title is required' }, timestamp: new Date().toISOString(), path: req.path }});
    }
    const validStatuses = ['pending', 'in_progress', 'completed'];
    const validPriorities = ['low', 'medium', 'high'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid input data', details: { status: 'Must be one of: pending, in_progress, completed' }, timestamp: new Date().toISOString(), path: req.path }});
    }
    if (priority && !validPriorities.includes(priority)) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid input data', details: { priority: 'Must be one of: low, medium, high' }, timestamp: new Date().toISOString(), path: req.path }});
    }
    const task = await Task.create({ title, description, status: status || 'pending', priority: priority || 'medium', ownerId: req.user.id, assignedTo: assignedTo || null, isPublic: isPublic || false });
    const responseData = { message: 'Task created successfully', task };
    await saveIdempotentResponse(req, res, responseData, 201);
    res.status(201).json(responseData);
  } catch (error) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to create task', timestamp: new Date().toISOString(), path: req.path }});
  }
};

exports.getTasks = async (req, res) => {
  try {
    const filters = {};
    if (req.user.role !== 'admin') filters.ownerId = req.user.id;
    if (req.query.status) filters.status = req.query.status;
    if (req.query.priority) filters.priority = req.query.priority;
    if (req.query.assignedTo) filters.assignedTo = req.query.assignedTo;
    if (req.query.isPublic !== undefined) filters.isPublic = req.query.isPublic === 'true';
    if (req.query.sort) filters.sort = req.query.sort;
    if (req.query.page) filters.page = req.query.page;
    if (req.query.limit) filters.limit = req.query.limit;
    const result = await Task.findAll(filters);
    res.json({ tasks: result.tasks, pagination: result.pagination });
  } catch (error) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve tasks', timestamp: new Date().toISOString(), path: req.path }});
  }
};

exports.getTasksV2 = async (req, res) => {
  try {
    const filters = {};
    if (req.user.role !== 'admin') filters.ownerId = req.user.id;
    if (req.query.status) filters.status = req.query.status;
    if (req.query.priority) filters.priority = req.query.priority;
    if (req.query.assignedTo) filters.assignedTo = req.query.assignedTo;
    if (req.query.isPublic !== undefined) filters.isPublic = req.query.isPublic === 'true';
    if (req.query.sort) filters.sort = req.query.sort;
    if (req.query.page) filters.page = req.query.page;
    if (req.query.limit) filters.limit = req.query.limit;
    const result = await Task.findAll(filters);
    const tasksWithMetadata = result.tasks.map(task => ({ ...task, metadata: { createdAt: task.createdAt, updatedAt: task.updatedAt, version: 'v2' }}));
    res.json({ tasks: tasksWithMetadata, pagination: result.pagination });
  } catch (error) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve tasks', timestamp: new Date().toISOString(), path: req.path }});
  }
};

exports.getTask = async (req, res) => {
  try {
    res.json(req.task);
  } catch (error) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve task', timestamp: new Date().toISOString(), path: req.path }});
  }
};

exports.getTaskV2 = async (req, res) => {
  try {
    res.json({ ...req.task, metadata: { createdAt: req.task.createdAt, updatedAt: req.task.updatedAt, version: 'v2' }});
  } catch (error) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve task', timestamp: new Date().toISOString(), path: req.path }});
  }
};

exports.updateTask = async (req, res) => {
  try {
    const { title, description, status, priority, assignedTo, isPublic } = req.body;
    const updates = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (status !== undefined) updates.status = status;
    if (priority !== undefined) updates.priority = priority;
    if (assignedTo !== undefined) updates.assignedTo = assignedTo;
    if (isPublic !== undefined) updates.isPublic = isPublic;
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'No valid fields to update', timestamp: new Date().toISOString(), path: req.path }});
    }
    const validStatuses = ['pending', 'in_progress', 'completed'];
    const validPriorities = ['low', 'medium', 'high'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid input data', details: { status: 'Must be one of: pending, in_progress, completed' }, timestamp: new Date().toISOString(), path: req.path }});
    }
    if (priority && !validPriorities.includes(priority)) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid input data', details: { priority: 'Must be one of: low, medium, high' }, timestamp: new Date().toISOString(), path: req.path }});
    }
    const updatedTask = await Task.update(req.params.id, updates);
    res.json({ message: 'Task updated successfully', task: updatedTask });
  } catch (error) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to update task', timestamp: new Date().toISOString(), path: req.path }});
  }
};

exports.updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Status is required', timestamp: new Date().toISOString(), path: req.path }});
    }
    const validStatuses = ['pending', 'in_progress', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid status', details: { status: 'Must be one of: pending, in_progress, completed' }, timestamp: new Date().toISOString(), path: req.path }});
    }
    const updatedTask = await Task.updateStatus(req.params.id, status);
    res.json({ message: 'Task status updated successfully', task: updatedTask });
  } catch (error) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to update task status', timestamp: new Date().toISOString(), path: req.path }});
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const deleted = await Task.delete(req.params.id);
    if (!deleted) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Task not found', timestamp: new Date().toISOString(), path: req.path }});
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to delete task', timestamp: new Date().toISOString(), path: req.path }});
  }
};