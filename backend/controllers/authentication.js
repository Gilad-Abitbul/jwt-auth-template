// Loads environment variables from the .env file (***only in development environment***)
require('dotenv').config()

const User = require('../models/user.js');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');

/**
 * @function createUser
 * @description
 * Handles the creation of a new user in the system.
 * 
 * This controller:
 * 1. Validates the request body using express-validator.
 * 2. If validation fails, throws a 422 error with a structured list of field-specific validation messages.
 * 3. If validation passes, hashes the user's password using bcrypt.
 * 4. Creates and saves the user to the database.
 * 5. Responds with a 201 status code and the user's ID on success.
 * 6. On internal errors, forwards a 500 error to the error-handling middleware.
 * 
 * @access Public
 * @route POST /api/auth/signup
 * @param {Object} request - Express request object. Expects a JSON body with the following fields:
 *   - email: string (must be a valid email format)
 *   - password: string (5-12 chars, must include uppercase, lowercase, number, special char)
 *   - firstName: string (3-12 chars, no spaces)
 *   - lastName: string (3-12 chars, no spaces)
 * @param {Object} response - Express response object.
 * @param {Function} next - Express next middleware function.
 * 
 * @returns {Object} 201 JSON response on success:
 * {
 *   message: "User created successfully!",
 *   userId: "<MongoDB User ID>"
 * }
 * 
 * @throws {Error} 422 - Validation error. JSON response:
 * {
 *   message: "Error - Invalid Input",
 *   details: {
 *     email: [ "Please enter a valid email address." ],
 *     password: [
 *       "Password must be between 5 and 12 characters long.",
 *       "Password must contain at least one uppercase letter.",
 *       ...
 *     ],
 *     ...
 *   }
 * }
 * 
 * @throws {Error} 500 - Internal server error (e.g., hashing or database failure). JSON response:
 * {
 *   message: "Error creating user!"
 * }
 */
exports.createUser = (request, response, next) => {
  const errors = validationResult(request);
  if (!errors.isEmpty()) {

    const formattedErrors = {};

    errors.array().forEach(error => {
      if (!formattedErrors[error.path]) {
        formattedErrors[error.path] = [];
      }
      formattedErrors[error.path].push(error.msg);
    });

    const error = new Error('Error - Invalid Input');
    error.statusCode = 422;
    error.details = formattedErrors;
    throw error;
  }
    
  const { email, password, firstName, lastName } = request.body;
  
  // Hashing password
  const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS ,10)
  bcrypt.hash(password, saltRounds)
  .then(hash => {
    const user = new User({
      email: email,
      password: hash,
      firstName: firstName,
      lastName: lastName,
    })
    return user.save()
  })
  .then(user => {
    response.status(201).json({ message: 'User created successfully!', userId: user._id });
  })
  .catch(error => {
    error.message = 'Error creating user!';
    error.statusCode = 500;
    next(error);
  });
}