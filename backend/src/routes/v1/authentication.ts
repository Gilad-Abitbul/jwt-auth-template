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
import { validateBody, validateQuery } from '../../middlewares/validate';
import { createUserSchema, loginUserSchema, requestPasswordResetOtpSchema, ResendVerifyEmailSchema, resetPasswordSchema, verifyEmailQuerySchema, verifyResetOtpSchema } from '../../schemas/auth.schema';

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
  validateBody(verifyResetOtpSchema),
  authenticationController.verifyResetOtp
);

router.post(
  '/reset-password',
  validateBody(resetPasswordSchema),
  authenticationController.resetPassword
);

router.get(
  '/verify-email',
  validateQuery(verifyEmailQuerySchema),
  authenticationController.verifyEmail
);

router.post(
  '/resend-verification',
  validateBody(ResendVerifyEmailSchema),
  authenticationController.resendVerificationEmail
);

export default router;