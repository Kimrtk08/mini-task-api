// Global error handler middleware
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Default error values
  let statusCode = err.statusCode || 500;
  let errorResponse = {
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: err.message || 'An unexpected error occurred',
      timestamp: new Date().toISOString(),
      path: req.path
    }
  };

  // Add details if available
  if (err.details) {
    errorResponse.error.details = err.details;
  }

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    errorResponse.error.code = 'VALIDATION_ERROR';
  }

  if (err.name === 'UnauthorizedError') {
    statusCode = 401;
    errorResponse.error.code = 'UNAUTHORIZED';
  }

  // Don't leak error details in production
  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    errorResponse.error.message = 'Internal server error';
  }

  res.status(statusCode).json(errorResponse);
};

// 404 Not Found handler
const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'Route not found',
      timestamp: new Date().toISOString(),
      path: req.path
    }
  });
};

module.exports = {
  errorHandler,
  notFoundHandler
};