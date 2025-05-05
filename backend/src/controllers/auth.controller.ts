import { Request, Response, NextFunction } from 'express';
import User, { IUser, UserDocument } from '../models/user';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger';
import { encrypt, decrypt } from '../utils/encryption/aes';
import HttpError from '../utils/HttpError';
import { Types } from 'mongoose';
import redisClient from '../utils/redisClient';
import { EmailService } from '../utils/email/emailService';
import { AuthService } from '../service/auth.service';
import { CreateUserRequestBody, LoginUserRequestBody, RequestPasswordResetOtpBody } from '../schemas/auth.schema';
import { UserService } from '../service/user.service';
import { OtpService } from '../service/otp.service';


export const createUser = async (
  req: Request<{}, {}, CreateUserRequestBody>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email } = req.body;

    const existingUser: UserDocument | null = await User.findOne({ email: email });

    if (existingUser) {
      return next(new HttpError('This email address is already registered.', 400, { email: ['Email already in use.'] }));
    }

    await AuthService.registerUser(req.body);
    res.status(201).json({ message: 'User created successfully!' });
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

    res.status(200).json({ message: 'Login successful!', meta: { token } });

  } catch (error) {
    next(error instanceof HttpError ? error : new HttpError('Error logging in user!', 500));
  }
}

// function maskEmail(email: string): string {
//   const [local, domain] = email.split('@');

//   if (!local || !domain) {
//     throw new Error('Invalid email format');
//   }

//   if (local.length <= 3) {
//     return local[0] + '***@' + domain;
//   }

//   return local.substring(0, 3) + '***@' + domain;
// }

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



interface PasswordResetOTP {
  attemptsLeft: number;
  hashedOtp: string;
}


export const verifyResetOtp = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, otp } = request.body;

    let redisKey = `passwordResetOTP:${email}`;
    const redisValue = await redisClient.get(redisKey);

    if (!redisValue) {
      response.status(400).json({
        message: 'OTP is invalid or expired',
      });
      return
    }

    const parsedRedisValue = JSON.parse(redisValue);
    const { attemptsLeft, hashedOtp } = parsedRedisValue as PasswordResetOTP;

    if (attemptsLeft <= 0) {
      await redisClient.del(redisKey);
      response.status(400).json({
        message: 'You have exceeded the number of attempts. Please request a new OTP.',
      });
      return;
    }

    const isMatch = await bcrypt.compare(otp, hashedOtp);

    if (!isMatch) {
      const updatedRedisValue = {
        ...parsedRedisValue,
        attemptsLeft: attemptsLeft - 1,
      };

      await redisClient.set(redisKey, JSON.stringify(updatedRedisValue), 'EX', 300);

      response.status(401).json({
        message: `Invalid OTP. Attempts left: ${attemptsLeft - 1}`,
      });
      return;
    }

    await redisClient.del(redisKey);

    const resetToken = uuidv4();
    redisKey = `passwordResetToken:${resetToken}`;

    const payload = encrypt(email);
    await redisClient.set(redisKey, payload, 'EX', 600);

    response.status(200).json({
      message: 'OTP verified successfully.',
      resetToken,
    });
    return;
  } catch (error) {
    if (error instanceof HttpError) {
      next(error);
    } else {
      const unknownError = new HttpError('Failed to verify OTP!', 500);
      next(unknownError);
    }
  }
};

export const resetPassword = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
  try {
    const { resetToken, newPassword }: { resetToken: string; newPassword: string } = request.body;

    const redisKey = `passwordResetToken:${resetToken}`;

    const cipher = await redisClient.get(redisKey);

    if (!cipher) {
      const error = new HttpError('Invalid or expired reset token.', 400);
      throw error;
    }

    const decrypted = decrypt(cipher);

    const user = await User.findOne({ email: decrypted });

    if (!user) {
      const error = new HttpError('User not found', 404);
      throw error;
    }

    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS!, 10);
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    user.password = hashedPassword;

    await user.save();

    await redisClient.del(redisKey);

    logger.info(`Password reset for ${decrypted}`);

    await EmailService.sendEmail('RESET_SUCCESS', {
      user
    });

    response.status(200).json({
      message: 'Password reset successfully.',
    });

  } catch (error) {
    next(error instanceof HttpError ? error : new HttpError('Failed to reset password.', 500));
  }
};

export const verifyEmail = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
  const { token } = request.query;

  try {
    const decoded: any = jwt.verify(token as string, process.env.JWT_SECRET as string);

    const user = await User.findById(decoded.userId);
    if (!user) {
      const error = new HttpError('User not found', 404);
      throw error;
    }

    if (user.verified) {
      return response.redirect(`${process.env.FRONTEND_DOMAIN}/email-verified?status=success`);
    }

    user.verified = true;
    await user.save();

    logger.info(`Email verified for ${user.email}`);
    return response.redirect(`${process.env.FRONTEND_DOMAIN}/email-verified?status=success`);

  } catch (error) {
    return response.redirect(`${process.env.FRONTEND_DOMAIN}/email-verified?status=invalid`);
  }
};

export const resendVerificationEmail = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
  try {
    const { email } = request.body;
    const user = await User.findOne({ email: email });

    const maskedEmail = maskEmail(email);

    if (!user || user.verified) {
      response.status(200).json({
        message: `If the email ${maskedEmail} exists, a verification email was sent.`
      });
      return;
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET as string,
      { expiresIn: '1d' }
    );

    const verificationLink = `${process.env.BACKEND_DOMAIN}/api/v1/verify-email?token=${token}`;

    EmailService.sendEmail('VERIFY', {
      user,
      verificationLink
    })

    response.status(200).json({
      message: `If the email ${maskedEmail} exists, a verification email was sent.`
    });
  } catch (error) {
    next(error instanceof HttpError ? error : new HttpError('Something went wrong. Please try again later.', 500));
  }
};