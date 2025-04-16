// Loads environment variables from the .env file (***only in development environment***)
require('dotenv').config()

const User = require('../models/user.js');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const { sendEmail } = require('../utils/mailer.js');
const {v4: uuidv4} = require('uuid');

//OTP management using mongodb:
//const PasswordReset = require('../models/password-reset.js');

//OTP management using redis:
const redisClient = require('../utils/redisClient.js');

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
exports.createUser = async (request, response, next) => {
  try {
    const errors = validationResult(request);
    if (!errors.isEmpty()) {
      const formattedErrors = {};

      errors.array().forEach(error => {
        if (!formattedErrors[error.path]) {
          formattedErrors[error.path] = [];
        }
        formattedErrors[error.path].push(error.msg);
      });

      const error = new Error('Error - Invalid Input');
      error.statusCode = 422;
      error.details = formattedErrors;
      throw error;
    }

    const { email, password, firstName, lastName } = request.body;
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10);

    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const user = new User({
      email,
      password: hashedPassword,
      firstName,
      lastName,
    });

    const savedUser = await user.save();

    response.status(201).json({ message: 'User created successfully!', userId: savedUser._id.toString() });

  } catch (error) {
    if (!error.statusCode) {
      error.message = 'Error creating user!';
      error.statusCode = 500;
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
exports.loginUser = async (request, response, next) => {
  try {
    const errors = validationResult(request);
    if (!errors.isEmpty()) {
      const error = new Error('Email and password do not match');
      error.statusCode = 401;
      throw error;
    }

    const { email, password } = request.body;

    const user = await User.findOne({ email: email });
    if (!user) {
      const error = new Error('Email and password do not match');
      error.statusCode = 401;
      throw error;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      const error = new Error('Email and password do not match');
      error.statusCode = 401;
      throw error;
    }

    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    )

    response.status(200).json({ 
      message: 'Login successful!', 
      userId: user._id.toString(), 
      token: token 
    });

  } catch (error) {
    if (!error.statusCode) {
      error.message = 'Error logging in user!';
      error.statusCode = 500;
    }
    next(error);
  }
}

function maskEmail(email) {
  const [local, domain] = email.split('@');
  if (local.length <= 3) {
    return local[0] + '***@' + domain;
  }
  return local.substring(0, 3) + '***@' + domain;
}

exports.requestPasswordReset = async (request, response, next) => {
  try {
    const errors = validationResult(request);
    if (!errors.isEmpty()) {
      const error = new Error(errors.array()[0].msg || 'Email Validation failed');
      error.statusCode = 422;
      throw error;
    }
    const { email } = request.body;
    const maskedEmail = maskEmail(email);
    const user = await User.findOne({email: email});
    if (!user) {
      return response.status(200).json({
        message: `If the email ${maskedEmail} exists, a reset code was sent.`
      });
    }

    //OTP management using mongodb:
    // await PasswordReset.deleteMany({
    //   user: user._id,
    //   used: false,
    // });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10);
    const hashedOtp = await bcrypt.hash(otp, saltRounds);
  
    //OTP management using mongodb:
    // await PasswordReset.create({
    //   user: user._id,
    //   hashedOtp,
    //   expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 min
    // });
    
    //OTP management using redis:
    await redisClient.deleteKey(`password_reset:${email}`);
    await redisClient.set(`password_reset:${email}`, hashedOtp, 'EX', 300);

    await sendEmail(otp, user.firstName + ' ' + user.lastName, {
      to: email,
    })

    return response.status(200).json({
      message: `If the email ${maskedEmail} exists, a reset code was sent.`
    });
  } catch(err) {
    next(err)
  }
}

exports.verifyResetOtp = async (request, response, next) => {
  try {
    const {email, otp} = request.body;
    const redisOtpKey = `password_reset:${email}`;
    const hashedOtp = await redisClient.get(redisOtpKey);
    if (!hashedOtp) {
      return response.status(400).json({
        message: 'Invalid OTP or expired',
      });
    }

    const isMatch = await bcrypt.compare(otp, hashedOtp);
    if (!isMatch) {
      return response.status(401).json({
        message: 'Invalid OTP',
      });
    }

    await redisClient.del(redisOtpKey);

    const resetToken = uuidv4();
    const redisKey = `reset_token:${resetToken}`;
    await redisClient.set(redisKey, email, 'EX', 300);

    return response.status(200).json({
      message: 'OTP verified successfully.',
      resetToken,
    });
  } catch (error) {
    next(error);
  }
}