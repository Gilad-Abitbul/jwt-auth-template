import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationError } from 'express-validator';
import HttpError from '../utils/HttpError';

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


const validateRequest = (request: Request, response: Response, next: NextFunction): void => {
  type ExtendedValidationError = ValidationError & { path: string };
  const errors = validationResult(request);
  if (!errors.isEmpty()) {
    const formattedErrors: { [key: string]: string[] } = {};

    // Format errors into a field-based object
    errors.array().forEach((error: ValidationError) => {
      if (error.type === 'field') {
        if (!formattedErrors[error.path]) {
          formattedErrors[error.path] = [];
        }
        formattedErrors[error.path].push(error.msg);
      }
    });

    // Return a 400 status with the formatted error details
    const error = new HttpError('Invalid Request Data!', 400, formattedErrors);
    return next(error);
  }

  // Proceed to the next middleware/handler if validation passes
  next();
};

export default validateRequest;
