/**
 * @fileoverview Authentication Routes
 * 
 * This file defines all the routes related to user authentication processes,
 * including user registration (sign-up), login, password reset (OTP request, verification, reset),
 * and email verification (initial and resend).
 *
 * Each route includes appropriate validation using express-validator
 * and connects to the corresponding controller methods.
 * 
 * Middlewares used:
 * - `validateRequest`: Validates request body and handles validation errors.
 * 
 * @module routes/authentication
 */
import express, { Request, Response, NextFunction } from 'express';
import { body } from 'express-validator';
import * as authenticationController from '../../controllers/authentication';
import User from '../../models/user';
import validateRequest from '../../middlewares/validate-request';

const router = express.Router();

/**
 * @route POST /signup
 * @description Registers a new user with email, password, first name, and last name.
 * @access Public
 * @bodyParam {string} email - User email, must be valid and unique.
 * @bodyParam {string} password - Password (5-12 chars, with required complexity).
 * @bodyParam {string} firstName - User's first name (3-12 chars, no spaces).
 * @bodyParam {string} lastName - User's last name (3-12 chars, no spaces).
 */
router.post(
  '/signup',
  [
    body('email')
      .isEmail().withMessage('Please enter a valid email address.')
      .normalizeEmail()
      .custom(async (value: string) => {
        return User.findOne({ email: value }).then((userDoc) => {
          if (userDoc) {
            return Promise.reject('This email address is already registered.');
          }
        });
      }),

    body('password')
      .trim()
      .isLength({ min: 5, max: 12 }).withMessage('Password must be between 5 and 12 characters long.')
      .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter.')
      .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter.')
      .matches(/[0-9]/).withMessage('Password must contain at least one number.')
      .matches(/[^A-Za-z0-9]/).withMessage('Password must contain at least one special character (e.g. @, #, $).')
      .not().matches(/\s/).withMessage('Password must not contain spaces.'),

    body('firstName')
      .trim()
      .isLength({ min: 3, max: 12 }).withMessage('First name must be between 3 and 12 characters.')
      .matches(/^[^\s]+$/).withMessage('First name must not contain spaces.'),

    body('lastName')
      .trim()
      .isLength({ min: 3, max: 12 }).withMessage('Last name must be between 3 and 12 characters.')
      .matches(/^[^\s]+$/).withMessage('Last name must not contain spaces.'),
  ],
  authenticationController.createUser
);

/**
 * @route POST /login
 * @description Authenticates a user with email and password.
 * @access Public
 * @bodyParam {string} email - Registered user email.
 * @bodyParam {string} password - Corresponding password.
 */
router.post(
  '/login',
  [
    body('email')
      .isEmail().withMessage('Please enter a valid email address.')
      .normalizeEmail(),

    body('password')
      .trim()
      .isLength({ min: 5, max: 12 }).withMessage('Password must be between 5 and 12 characters long.')
      .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter.')
      .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter.')
      .matches(/[0-9]/).withMessage('Password must contain at least one number.')
      .matches(/[^A-Za-z0-9]/).withMessage('Password must contain at least one special character (e.g. @, #, $).')
      .not().matches(/\s/).withMessage('Password must not contain spaces.'),
  ],
  validateRequest,
  authenticationController.loginUser
);


/**
 * @route POST /request-password-reset-otp
 * @description Requests a password reset by sending a One-Time Password (OTP) to the user's email.
 * @access Public
 * @bodyParam {string} email - Registered user email address.
 */
router.post(
  '/request-password-reset-otp',
  [
    body('email')
      .isEmail().withMessage('Invalid email address.')
      .normalizeEmail(),
  ],
  validateRequest,
  authenticationController.requestPasswordReset
);

/**
 * @route POST /verify-password-reset-otp
 * @description Verifies the OTP provided by the user for password reset.
 * @access Public
 * @bodyParam {string} otp - 6-digit numeric OTP code.
 * @bodyParam {string} email - Registered user email address.
 */
router.post(
  '/verify-password-reset-otp',
  [
    body('otp')
      .isLength({ min: 6, max: 6 }).withMessage('Incorrect OTP format')
      .isNumeric().withMessage('Incorrect OTP format'),

    body('email')
      .isEmail().withMessage('Invalid email address.')
      .normalizeEmail(),
  ],
  validateRequest,
  authenticationController.verifyResetOtp
);

/**
 * @route POST /reset-password
 * @description Resets the user's password using a valid reset token.
 * @access Public
 * @bodyParam {string} newPassword - New password with required complexity.
 * @bodyParam {string} resetToken - Valid UUID v4 token received after OTP verification.
 */
router.post(
  '/reset-password',
  [
    body('newPassword')
      .trim()
      .isLength({ min: 5, max: 12 }).withMessage('Password must be between 5 and 12 characters long.')
      .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter.')
      .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter.')
      .matches(/[0-9]/).withMessage('Password must contain at least one number.')
      .matches(/[^A-Za-z0-9]/).withMessage('Password must contain at least one special character (e.g. @, #, $).')
      .not().matches(/\s/).withMessage('Password must not contain spaces.'),

    body('resetToken')
      .trim()
      .isUUID(4).withMessage('Invalid reset token.'),
  ],
  validateRequest,
  authenticationController.resetPassword
);

/**
 * @route GET /verify-email
 * @description Verifies a user's email address using a token sent via email.
 * @access Public
 * @queryParam {string} token - Verification token.
 */
router.get(
  '/verify-email',
  authenticationController.verifyEmail
);

/**
 * @route POST /resend-verification
 * @description Resends a new email verification token to the user.
 * @access Public
 * @bodyParam {string} email - User's email address.
 */
router.post(
  '/resend-verification',
  [
    body('email')
      .isEmail().withMessage('Invalid email address.')
      .normalizeEmail(),
  ],
  validateRequest,
  authenticationController.resendVerificationEmail
);

export default router;