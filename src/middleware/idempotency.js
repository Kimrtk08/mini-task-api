const Task = require('../models/task.model');

// Idempotency middleware for POST requests
const checkIdempotency = async (req, res, next) => {
  const idempotencyKey = req.headers['idempotency-key'];

  // Check if Idempotency-Key header exists
  if (!idempotencyKey) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Idempotency-Key header is required',
        timestamp: new Date().toISOString(),
        path: req.path
      }
    });
  }

  try {
    const userId = req.user.id;

    // Check if this idempotency key already exists for this user
    const existingRequest = await Task.findIdempotencyKey(idempotencyKey, userId);

    if (existingRequest) {
      // Parse the stored request body and current request body
      const existingBody = JSON.parse(existingRequest.requestBody);
      const currentBody = req.body;

      // Compare request bodies
      if (JSON.stringify(existingBody) !== JSON.stringify(currentBody)) {
        // Same key but different data = Conflict (409)
        return res.status(409).json({
          error: {
            code: 'CONFLICT',
            message: 'Idempotency key already used with different request data',
            timestamp: new Date().toISOString(),
            path: req.path
          }
        });
      }

      // Same key, same data = Return cached response
      const cachedResponse = JSON.parse(existingRequest.responseBody);
      return res.status(existingRequest.responseStatus).json(cachedResponse);
    }

    // New idempotency key, attach to request and continue
    req.idempotencyKey = idempotencyKey;
    next();

  } catch (error) {
    console.error('Idempotency check error:', error);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to process idempotency check',
        timestamp: new Date().toISOString(),
        path: req.path
      }
    });
  }
};

// Save idempotent response to database
const saveIdempotentResponse = async (req, res, responseData, statusCode = 201) => {
  try {
    // Only save if idempotencyKey exists (from POST requests)
    if (req.idempotencyKey && req.user) {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // Expire after 24 hours

      await Task.saveIdempotencyKey(
        req.idempotencyKey,
        req.user.id,
        req.body,
        statusCode,
        responseData,
        expiresAt
      );
    }
  } catch (error) {
    // Log error but don't fail the request
    console.error('Failed to save idempotency key:', error);
  }
};

module.exports = {
  checkIdempotency,
  saveIdempotentResponse
};