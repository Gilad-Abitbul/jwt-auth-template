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
import * as authenticationController from '../../controllers/auth.controller';
import validateRequest from '../../middlewares/validate-request';
import otpLimiter from '../../middlewares/otpLimiter';
import { validateBody } from '../../middlewares/validate';
import { createUserSchema, loginUserSchema, requestPasswordResetOtpSchema } from '../../schemas/auth.schema';

const router = express.Router();

router.post(
  '/signup',
  validateBody(createUserSchema),
  authenticationController.createUser
);

router.post(
  '/login',
  validateBody(loginUserSchema),
  authenticationController.loginUser
);

router.post(
  '/request-password-reset-otp',
  validateBody(requestPasswordResetOtpSchema),
  authenticationController.requestPasswordResetOtp
);

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