import { Request, Response, NextFunction } from 'express';
import User, { IUser, UserDocument } from '../models/user';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger';
import { encrypt, decrypt } from '../utils/encryption/aes.encryption';
import HttpError from '../utils/HttpError';
import { Types } from 'mongoose';
import redisClient from '../utils/redisClient';
import { EmailService } from '../utils/email/emailService';
import { AuthService } from '../service/auth.service';
import { CreateUserRequestBody, LoginUserRequestBody, RequestPasswordResetOtpBody, RequestResendVerifyEmailBody, RequestResetPasswordBody, RequestVerifyEmailQueryParam, RequestVerifyResetOtpBody } from '../schemas/auth.schema';
import { UserService } from '../service/user.service';
import { OtpService } from '../service/otp.service';
import { ResetTokenService } from '../service/resetToken.service';
import { TokenPayloadData, TokenService } from '../service/token.service';
import { config } from '../config';


export const createUser = async (
  req: Request<{}, {}, CreateUserRequestBody>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await AuthService.registerUser(req.body);
    res
      .status(201)
      .json({
        message: 'User created successfully!'
      });
  } catch (error) {
    next(error instanceof HttpError ? error : new HttpError('Error Creating User!', 500));
  }
};


export const loginUser = async (
  req: Request<{}, {}, LoginUserRequestBody>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {

    const { email, password } = req.body;
    const { token } = await AuthService.loginUser(email, password);

    res
      .status(200)
      .json({
        message: 'Login successful!',
        meta: { token }
      });

  } catch (error) {
    next(error instanceof HttpError ? error : new HttpError('Error logging in user!', 500));
  }
}

export const requestPasswordResetOtp = async (
  req: Request<{}, {}, RequestPasswordResetOtpBody>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email } = req.body;
    const user: UserDocument | null = await UserService.getUserByEmail(email);

    const maskedEmail = OtpService.maskEmail(email);

    if (!user) {
      res.status(200).json({
        message: `If the email ${maskedEmail} exists, a reset code was sent.`
      });
      return;
    }

    await OtpService.generateAndSendOtp(user);

    res.status(200).json({
      message: `If the email ${maskedEmail} exists, a reset code was sent.`
    });

  } catch (error) {
    next(error instanceof HttpError ? error : new HttpError('Error requesting password reset!', 500));
  }
};



export const verifyResetOtp = async (
  req: Request<{}, {}, RequestVerifyResetOtpBody>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, otp } = req.body;
    const result = await OtpService.verifyOtp(email, otp);

    if (!result.success) {
      if (typeof result.attemptsLeft === 'number') {
        throw new HttpError('Invalid OTP!', 401, undefined, { attemptsLeft: result.attemptsLeft })
      }
      throw new HttpError(`Invalid OTP`, 401);
    }
    const resetToken = await ResetTokenService.createAndStore(email);
    res.status(200).json({
      message: 'OTP verified successfully.',
      resetToken,
    });
  } catch (error) {
    next(error instanceof HttpError ? error : new HttpError('Failed to verify OTP!', 500));
  }
};

export const resetPassword = async (
  req: Request<{}, {}, RequestResetPasswordBody>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { resetToken, newPassword, email } = req.body;

    const verified = await ResetTokenService.verify(email, resetToken);
    if (!verified) {
      throw new HttpError('Invalid or expired reset token.', 401);
    }

    const user = await AuthService.changePassword(email, newPassword);
    await ResetTokenService.delete(email);

    logger.info(`Password reset for ${email}`);

    await EmailService.sendEmail('RESET_SUCCESS', {
      user
    });

    res.status(200).json({
      message: 'Password reset successfully.',
    });

  } catch (error) {
    next(error instanceof HttpError ? error : new HttpError('Failed to reset password.', 500));
  }
};

export const verifyEmail = async (
  req: Request<{}, {}, {}, RequestVerifyEmailQueryParam>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { token } = req.query;

  try {
    const decoded = TokenService.verifyToken(token);

    if (decoded.type !== 'emailVerification') {
      throw new HttpError('Invalid token type for this action', 403);
    }

    const user = await UserService.getUserById(decoded.userId);

    if (!user) {
      const error = new HttpError('User not found', 404);
      throw error;
    }

    if (user.verified) {
      return res.redirect(`${config.frontendDomain}/email-verified?status=success`);
    }

    await UserService.setEmailVerified(user, true);

    logger.info(`Email verified for ${user.email}`);

    return res.redirect(`${config.frontendDomain}/email-verified?status=success`);

  } catch (error) {
    logger.error(`Email verification failed: ${(error as Error).message}`);
    return res.redirect(`${config.frontendDomain}/email-verified?status=invalid`);
  }
};

export const resendVerificationEmail = async (
  req: Request<{}, {}, RequestResendVerifyEmailBody>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {

    const { email } = req.body;
    const user = await UserService.getUserByEmail(email);
    const maskedEmail = OtpService.maskEmail(email);
    if (!user || user.verified) {
      res.status(200).json({
        message: `If the email ${maskedEmail} exists, a verification email was sent.`
      });
      return;
    }

    const payload: TokenPayloadData = {
      userId: user._id.toString(),
      type: 'emailVerification',
    }

    const token = TokenService.generateToken(payload)
    const verificationLink = `${config.backendDomain}/api/v1/verify-email?token=${token}`;

    EmailService.sendEmail('VERIFY', {
      user,
      verificationLink
    })

    res.status(200).json({
      message: `If the email ${maskedEmail} exists, a verification email was sent.`
    });

  } catch (error) {
    next(error instanceof HttpError ? error : new HttpError('Something went wrong. Please try again later.', 500));
  }
};