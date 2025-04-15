const { validationResult } = require('express-validator');

const validateRequest = (request, response, next) => {
  const errors = validationResult(request);
  if (!errors.isEmpty()) {
    const formattedErrors = {};
    errors.array().forEach(error => {
      if (!formattedErrors[error.path]) {
        formattedErrors[error.path] = [];
      }
      formattedErrors[error.path].push(error.msg);
    });
    return response.status(400).json({ message: "Invalid Input", details: formattedErrors });
  }
  next(); 
};

module.exports = validateRequest;