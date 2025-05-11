import { Request, Response, NextFunction, CookieOptions } from 'express';
import { UserDocument } from '../models/user';
import logger from '../utils/logger';
import HttpError from '../utils/HttpError';
import { EmailService } from '../utils/email/emailService';
import { AuthService } from '../services/auth.service';
import { CreateUserRequestBody, LoginUserRequestBody, RequestPasswordResetOtpBody, RequestResendVerifyEmailBody, RequestResetPasswordBody, RequestVerifyEmailQueryParam, RequestVerifyResetOtpBody } from '../schemas/auth.schema';
import { UserService } from '../services/user.service';
import { OtpService } from '../services/otp.service';
import { ResetTokenService } from '../services/resetToken.service';
import { TokenPayloadData, TokenService } from '../services/token.service';
import { env } from '../env';


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
    const { email, password, rememberMe } = req.body;
    const { accessToken, refreshToken } = await AuthService.loginUser(email, password);

    const cookieOptions: CookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      ...(rememberMe ? { maxAge: 30 * 24 * 60 * 60 * 1000 } : {}),
      path: '/api/v1/refresh',
    }

    res
      .cookie('refreshToken', refreshToken, cookieOptions)
      .status(200)
      .json({
        message: 'Login successful!',
        meta: { accessToken }
      })

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

    if (decoded?.type !== 'verification') {
      throw new HttpError('Invalid token type for this action', 403);
    }

    const user = await UserService.getUserById(decoded.userId);

    if (!user) {
      const error = new HttpError('User not found', 404);
      throw error;
    }

    if (user.verified) {
      return res.redirect(`${env.frontendDomain}/email-verified?status=success`);
    }

    await UserService.setEmailVerified(user, true);

    logger.info(`Email verified for ${user.email}`);

    return res.redirect(`${env.frontendDomain}/email-verified?status=success`);

  } catch (error) {
    logger.error(`Email verification failed: ${(error as Error).message}`);
    return res.redirect(`${env.frontendDomain}/email-verified?status=invalid`);
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
      type: 'verification',
    }

    const token = TokenService.generateToken(payload)
    const verificationLink = `${env.backendDomain}/api/v1/verify-email?token=${token}`;

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

export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.cookies?.refreshToken;

    if (!token) {
      throw new HttpError('No refresh token provided.', 401);
    }

    const payload = TokenService.verifyToken(token);
    if (payload.type !== 'refresh') throw new HttpError('Invalid token type.', 401);

    const user = await UserService.getUserById(payload.userId);
    if (!user) throw new HttpError('User no longer exists.', 401);


    const newAccessToken = TokenService.generateToken({
      userId: payload.userId,
      type: 'access'
    }, '1h');

    res.status(200).json({
      message: 'Token refreshed!',
      meta: { accessToken: newAccessToken }
    });

  } catch (error) {
    next(error instanceof HttpError ? error : new HttpError('Error refreshing token.', 401));
  }
};