// Loads environment variables from the .env file (***only in development environment***)
import dotenv from 'dotenv';
dotenv.config();
import { Request, Response, NextFunction } from 'express';
import User from '../models/user';
import bcrypt from 'bcryptjs';
import { validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import { EmailBuilder, EmailFactory } from '../utils/mailer/mailer';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger';
import crypto from 'crypto';
import { encrypt, decrypt } from '../utils/encryption';
import HttpError from '../utils/HttpError';
import { Types } from 'mongoose';

// OTP management using redis:
import redisClient from '../utils/redisClient';

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
export const createUser = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
  try {

    const { email, password, firstName, lastName } = request.body;

    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS as string, 10);
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const user = new User({
      email,
      password: hashedPassword,
      firstName,
      lastName,
    });

    const savedUser = await user.save();

    const token = jwt.sign(
      { userId: savedUser._id },
      process.env.JWT_SECRET as string,
      { expiresIn: '1d' }
    );

    const username = `${firstName} ${lastName}`;
    const verificationLink = `${process.env.BACKEND_DOMAIN}/api/v1/verify-email?token=${token}`;

    const template = EmailFactory.create('confirm-email', {
      username,
      verificationLink,
    });

    await new EmailBuilder(template).setTo(email).send();

    const userId = (savedUser._id as Types.ObjectId).toString();
    response.status(201).json({ message: 'User created successfully!', userId });

  } catch (error) {
    if (!(error instanceof HttpError)) {
      error = new HttpError('Error creating user!', 500);
    }
    next(error);
  }
};

/**
 * @function loginUser
 * @description
 * Handles user login by validating credentials and authenticating the user.
 * 
 * This controller:
 * 1. Validates the request body using express-validator.
 * 2. If validation fails, throws a 401 Unauthorized error with a generic message.
 * 3. Attempts to find a user by email in the database.
 * 4. If the user does not exist or the password is incorrect, throws a 401 error.
 * 5. If authentication is successful, responds with a 200 status code, user ID, and a JWT token.
 * 6. On unexpected internal errors, forwards a 500 error to the error-handling middleware.
 * 
 * @access Public
 * @route POST /api/auth/login
 * @param {Object} request - Express request object. Expects a JSON body with the following fields:
 *   - email: string (must be a valid email format)
 *   - password: string (minimum 5 characters)
 * @param {Object} response - Express response object.
 * @param {Function} next - Express next middleware function.
 * 
 * @returns {Object} 200 JSON response on success:
 * {
 *   message: "Login successful!",
 *   userId: "<MongoDB User ID>",
 *   token: "<JWT token>"
 * }
 * 
 * @throws {Error} 401 - Unauthorized error if email or password is invalid. JSON response:
 * {
 *   message: "Email and password do not match"
 * }
 * 
 * @throws {Error} 500 - Internal server error (e.g., database or hashing failure). JSON response:
 * {
 *   message: "Error logging in user!"
 * }
 */

export const loginUser = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = request.body;

    const user = await User.findOne({ email: email });

    if (!user) {
      const error = new HttpError('Email and password do not match', 401);
      throw error;
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      const error = new HttpError('Email and password do not match', 401);
      throw error;
    }

    const userId = (user._id as Types.ObjectId).toString();

    const secret = process.env.JWT_SECRET;

    if (!secret) {
      const error = new HttpError('Missing JWT secret config', 500);
      throw error;
    }

    const token = jwt.sign(
      { userId, email: user.email },
      'secret',
      { expiresIn: '1h' }
    );

    response.status(200).json({
      message: 'Login successful!',
      userId,
      token: token
    });

  } catch (error) {
    if (error instanceof HttpError) {
      return next(error);
    }
    const unknownError = new HttpError('Error logging in user!', 500);
    return next(unknownError);
  }
}

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');

  if (!local || !domain) {
    throw new Error('Invalid email format');
  }

  if (local.length <= 3) {
    return local[0] + '***@' + domain;
  }

  return local.substring(0, 3) + '***@' + domain;
}

export const requestPasswordReset = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
  try {
    const { email } = request.body;

    const maskedEmail = maskEmail(email);

    const user = await User.findOne({ email: email });

    if (!user) {
      response.status(200).json({
        message: `If the email ${maskedEmail} exists, a reset code was sent.`
      });
      return;
    }

    const otp: string = Math.floor(100000 + Math.random() * 900000).toString();

    const saltRoundsEnv = process.env.BCRYPT_SALT_ROUNDS;

    if (!saltRoundsEnv) {
      throw new HttpError('Missing BCRYPT_SALT_ROUNDS configuration', 500);
    }

    const saltRounds = parseInt(saltRoundsEnv, 10);
    const hashedOtp = await bcrypt.hash(otp, saltRounds);

    // OTP management using redis:
    const redisKey = `passwordResetOTP:${user.email}`;

    // Invalidate the previous OTP, if it exists in memory.
    await redisClient.del(redisKey);

    const redisValue = JSON.stringify({
      userId: (user._id as Types.ObjectId).toString(),
      hashedOtp,
      attemptsLeft: 3
    });

    // Setting a new OTP for the user with a 5-minute time validity
    await redisClient.set(redisKey, redisValue, 'EX', 300);

    const username = `${user.firstName} ${user.lastName}`;

    const template = EmailFactory.create('reset-password', {
      username,
      otp
    });

    await new EmailBuilder(template).setTo(user.email).send();

    response.status(200).json({
      message: `If the email ${maskedEmail} exists, a reset code was sent.`
    });

  } catch (error) {
    if (error instanceof HttpError) {
      next(error);
    } else {
      const unknownError = new HttpError('Error requesting password reset!', 500);
      next(unknownError);
    }
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

    const username = `${user.firstName} ${user.lastName}`;
    const template = EmailFactory.create('reset-password-notification', {
      username
    });

    await new EmailBuilder(template).setTo(user.email).send();

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

    const username = `${user.firstName} ${user.lastName}`;
    const verificationLink = `${process.env.BACKEND_DOMAIN}/api/v1/verify-email?token=${token}`;

    const template = EmailFactory.create('confirm-email', {
      username,
      verificationLink,
    });

    await new EmailBuilder(template).setTo(email).send();

    response.status(200).json({
      message: `If the email ${maskedEmail} exists, a verification email was sent.`
    });
  } catch (error) {
    next(error instanceof HttpError ? error : new HttpError('Something went wrong. Please try again later.', 500));
  }
};