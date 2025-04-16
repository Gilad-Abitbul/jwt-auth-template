const { validationResult } = require('express-validator');

/**
 * @middleware validateRequest
 * @desc    Validates the request using express-validator and returns detailed error messages if validation fails.
 * 
 * @usage   Should be used after route-level validators (e.g. express-validator `body`, `param`, etc.).
 * 
 * @input
 * - Request object should contain validation rules applied using express-validator.
 * 
 * @output
 * - If validation passes: calls `next()` to proceed.
 * - If validation fails:
 *   Status: 400 Bad Request
 *   Response:
 *   {
 *     "message": "Invalid Input",
 *     "details": {
 *       "fieldName1": ["Error message 1", "Error message 2"],
 *       "fieldName2": ["Error message 1"]
 *     }
 *   }
 * 
 * @example
 * router.post(
 *   '/login',
 *   [
 *     body('email').isEmail(),
 *     body('password').isLength({ min: 6 })
 *   ],
 *   validateRequest,
 *   loginController
 * );
 */
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