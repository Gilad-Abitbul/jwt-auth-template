import express from 'express';
import * as authenticationController from '../../controllers/auth.controller';
import { validateBody, validateQuery } from '../../middlewares/validate';
import { createUserSchema, loginUserSchema, requestPasswordResetOtpSchema, ResendVerifyEmailSchema, resetPasswordSchema, verifyEmailQuerySchema, verifyResetOtpSchema } from '../../schemas/auth.schema';
import {
  loginLimiter,
  signupLimiter,
  requestOtpLimiter,
  verifyOtpLimiter,
  resetPasswordLimiter,
  verifyEmailLimiter,
  resendVerificationLimiter,
  refreshLimiter
} from '../../middlewares/rateLimiters/auth';

const router = express.Router();

router.post(
  '/signup',
  signupLimiter,
  validateBody(createUserSchema),
  authenticationController.createUser
);

router.post(
  '/login',
  loginLimiter,
  validateBody(loginUserSchema),
  authenticationController.loginUser
);

router.post(
  '/request-password-reset-otp',
  requestOtpLimiter,
  validateBody(requestPasswordResetOtpSchema),
  authenticationController.requestPasswordResetOtp
);

router.post(
  '/verify-password-reset-otp',
  verifyOtpLimiter,
  validateBody(verifyResetOtpSchema),
  authenticationController.verifyResetOtp
);

router.post(
  '/reset-password',
  resetPasswordLimiter,
  validateBody(resetPasswordSchema),
  authenticationController.resetPassword
);

router.get(
  '/verify-email',
  verifyEmailLimiter,
  validateQuery(verifyEmailQuerySchema),
  authenticationController.verifyEmail
);

router.post(
  '/resend-verification',
  resendVerificationLimiter,
  validateBody(ResendVerifyEmailSchema),
  authenticationController.resendVerificationEmail
);

router.post(
  '/refresh',
  refreshLimiter,
  authenticationController.refreshToken
);

export default router;