// Global error handling middleware
const errorHandler = (error, request, response, next) => {
  const statusCode = error.statusCode || 500; // Default to 500 if no statusCode
  const message = error.message || 'Internal server error'; // Default message
  const details = error.details || null; // Error details if available

  response.status(statusCode).json({
    message: message,
    details: details,
  });
};

module.exports = errorHandler;