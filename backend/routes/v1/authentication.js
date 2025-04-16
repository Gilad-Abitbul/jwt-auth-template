const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const authenticationController = require('../../controllers/authentication.js');
const User = require('../../models/user.js');
const {passwordResetRateLimit, otpVerifyRateLimit} = require('../../middleware/rateLimiters.js');
const validateRequest  = require('../../middleware/validate-request.js');
/**
 * @route   POST /api/v1/signup
 * @desc    Register a new user account
 * @access  Public
 * 
 * @requestBody
 * {
 *   "email": "string",       // A valid and unique email address
 *   "password": "string",    // 5-12 characters, at least one uppercase, one lowercase, one digit, one symbol, no spaces
 *   "firstName": "string",   // 3-12 characters, no spaces
 *   "lastName": "string"     // 3-12 characters, no spaces
 * }
 * 
 * @response
 * 201 Created (success)
 * {
 *   "message": "User created successfully!",
 *   "userId": "ObjectId"
 * }
 * 
 * @validation
 * - email must be valid and not already registered
 * - password must meet complexity requirements
 * - firstName and lastName must be 3–12 characters long, must not contain spaces, and cannot be empty
 */
router.post(
  '/signup',
  [
    // Email validations
    body('email')
      .isEmail().withMessage('Please enter a valid email address.')
      .normalizeEmail()
      .custom((value) => {
        return User.findOne({ email: value }).then(userDoc => {
          if (userDoc) {
            return Promise.reject('This email address is already registered.');
          }
        });
      }),

    // Password validations
    body('password')
      .trim()
      .isLength({ min: 5, max: 12 }).withMessage('Password must be between 5 and 12 characters long.')
      .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter.')
      .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter.')
      .matches(/[0-9]/).withMessage('Password must contain at least one number.')
      .matches(/[^A-Za-z0-9]/).withMessage('Password must contain at least one special character (e.g. @, #, $).')
      .not().matches(/\s/).withMessage('Password must not contain spaces.'),

    // First name validations
    body('firstName')
      .trim()
      .isLength({ min: 3, max: 12 }).withMessage('First name must be between 3 and 12 characters.')
      .matches(/^[^\s]+$/).withMessage('First name must not contain spaces.'),

    // Last name validations
    body('lastName')
      .trim()
      .isLength({ min: 3, max: 12 }).withMessage('Last name must be between 3 and 12 characters.')
      .matches(/^[^\s]+$/).withMessage('Last name must not contain spaces.'),
  ],
  authenticationController.createUser
);

router.post(
  '/login',
  [
    // Email validations
    body('email')
      .isEmail().withMessage('Please enter a valid email address.').normalizeEmail(),

    // Password validations
    body('password')
      .trim()
      .isLength({ min: 5, max: 12 }).withMessage('Password must be between 5 and 12 characters long.')
      .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter.')
      .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter.')
      .matches(/[0-9]/).withMessage('Password must contain at least one number.')
      .matches(/[^A-Za-z0-9]/).withMessage('Password must contain at least one special character (e.g. @, #, $).')
      .not().matches(/\s/).withMessage('Password must not contain spaces.'),
  ],
  authenticationController.loginUser
)

router.post(
  '/request-password-reset',
  [
    body('email')
      .isEmail().withMessage('Invalid email address.')
      .normalizeEmail()
  ],
  validateRequest,
  passwordResetRateLimit,
  authenticationController.requestPasswordReset
)

router.post(
  '/verify-reset-otp',
  [
    body('otp')
    .isLength({ min: 6, max: 6 }).withMessage('Incorrect OTP format').isNumeric().withMessage('Incorrect OTP format'),
    body('email')
    .isEmail().withMessage('Invalid email address.')
    .normalizeEmail()
  ],
  validateRequest,
  otpVerifyRateLimit,
  authenticationController.verifyResetOtp
)

module.exports = router;