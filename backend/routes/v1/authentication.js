const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const authenticationController = require('../../controllers/authentication.js');
const User = require('../../models/user.js');
const {requestPasswordResetRateLimit, otpVerifyRateLimit, resetPasswordRateLimit} = require('../../middleware/rateLimiters.js');
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

/**
 * @route   POST /api/v1/login
 * @desc    Login a user with email and password
 * @access  Public
 * 
 * @requestBody
 * {
 *   "email": "string",     // A valid registered email address
 *   "password": "string"   // 5-12 characters, includes uppercase, lowercase, digit, symbol, no spaces
 * }
 * 
 * @response
 * 200 OK (success)
 * {
 *   "message": "Login successful",
 *   "token": "JWT",
 *   "userId": "<MongoDB User ID>",
 * }
 * 
 * @validation
 * - email must be a valid format
 * - password must be 5–12 characters, with required complexity
 */
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

/**
 * @route   POST /api/v1/request-password-reset
 * @desc    Request a password reset OTP to be sent to user's email
 * @access  Public
 * 
 * @requestBody
 * {
 *   "email": "string"   // A valid registered email address
 * }
 * 
 * @response
 * 200 OK (success)
 * {
 *   "message": "If the email <masked email format (e.g. test@test.com -> t***@test.com)> exists, a reset code was sent.""
 * }
 * 
 * @validation
 * - email must be valid format
 * - Rate limiting applies per email and IP
 */
router.post(
  '/request-password-reset',
  [
    // Email validations
    body('email')
      .isEmail().withMessage('Invalid email address.')
      .normalizeEmail()
  ],
  validateRequest,
  requestPasswordResetRateLimit,
  authenticationController.requestPasswordReset
)

/**
 * @route   POST /api/v1/verify-reset-otp
 * @desc    Verify the OTP sent to the user's email
 * @access  Public
 * 
 * @requestBody
 * {
 *   "email": "string",   // A valid registered email
 *   "otp": "string"      // 6-digit numeric OTP
 * }
 * 
 * @response
 * 200 OK (success)
 * {
 *   "message": "OTP verified successfully",
 *   "resetToken": "<UUIDv4 token>"
 * }
 * 
 * @validation
 * - email must be valid
 * - otp must be a 6-digit numeric string
 * - Rate limiting applies per email and IP
 */
router.post(
  '/verify-reset-otp',
  [
    // OTP validations
    body('otp')
    .isLength({ min: 6, max: 6 }).withMessage('Incorrect OTP format').isNumeric().withMessage('Incorrect OTP format'),
    
    // Email validations
    body('email')
    .isEmail().withMessage('Invalid email address.')
    .normalizeEmail()
  ],
  validateRequest,
  otpVerifyRateLimit,
  authenticationController.verifyResetOtp
)

/**
 * @route   POST /api/v1/reset-password
 * @desc    Reset user's password using a valid reset token
 * @access  Public
 * 
 * @requestBody
 * {
 *   "newPassword": "string",   // 5-12 characters, includes uppercase, lowercase, digit, symbol, no spaces
 *   "resetToken": "UUIDv4"     // A valid reset token received from OTP verification
 * }
 * 
 * @response
 * 200 OK (success)
 * {
 *   "message": "Password reset successfully."
 * }
 * 
 * @validation
 * - password must meet complexity rules
 * - resetToken must be a valid UUIDv4
 * - Rate limiting applies per IP
 */
router.post(
  '/reset-password',
  [
    // New Password validations
    body('newPassword')
    .trim()
    .isLength({ min: 5, max: 12 }).withMessage('Password must be between 5 and 12 characters long.')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter.')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter.')
    .matches(/[0-9]/).withMessage('Password must contain at least one number.')
    .matches(/[^A-Za-z0-9]/).withMessage('Password must contain at least one special character (e.g. @, #, $).')
    .not().matches(/\s/).withMessage('Password must not contain spaces.'),
    
    // Reset Token validations
    body('resetToken')
    .trim()
    .isUUID(4).withMessage('Invalid reset token.')
  ],
  validateRequest,
  resetPasswordRateLimit,
  authenticationController.resetPassword
)

router.get(
  '/verify-email',
  authenticationController.verifyEmail
)

module.exports = router;