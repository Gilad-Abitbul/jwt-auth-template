import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Interface for the decoded JWT token
interface DecodedToken {
  userId: string;
}

interface CustomRequest extends Request {
  userId?: string;
}

/**
 * @function loginRequired
 * @description
 * Middleware that checks if the user is authenticated by verifying the JWT token
 * provided in the Authorization header.
 * 
 * This middleware:
 * 1. Checks if the 'Authorization' header is provided in the request.
 * 2. If the header is missing, throws a 401 Unauthorized error.
 * 3. Extracts the token from the header in the format: 'Authorization: Bearer <token>'.
 * 4. Verifies the token using a secret key from environment variables.
 * 5. If the token is invalid or expired, throws a 401 Unauthorized error.
 * 6. If the token is valid, decodes it and attaches the user ID to the request object for further use.
 * 7. If the token cannot be decoded, throws a 401 Unauthorized error.
 * 
 * @access Private
 * @route Any route that needs authentication
 * @param {CustomRequest} request - Express request object. Expects a 'Authorization' header with the following format:
 *   - 'Authorization': 'Bearer <token>'
 * @param {Response} response - Express response object.
 * @param {NextFunction} next - Express next middleware function.
 * 
 * @returns {void} - If the token is valid, it proceeds to the next middleware or route handler.
 * 
 * @throws {Error} 401 - Unauthorized error if the token is missing, invalid, or expired. JSON response:
 * {
 *   message: "No authorization header provided in the request" | "Not authenticated"
 * }
 * 
 * @throws {Error} 500 - Internal server error (e.g., token verification failure). JSON response:
 * {
 *   message: "Token verification failed"
 * }
 */
const loginRequired = (request: CustomRequest, response: Response, next: NextFunction): void => {
  // Retrieve the Authorization header
  const header = request.get('Authorization');

  // Check if the Authorization header is provided
  if (!header) {
    const error = new Error('No authorization header provided in the request');
    (error as any).statusCode = 401;
    throw error;
  }

  // Check if the header is in the correct format 'Bearer <token>'
  const headerParts = header.split(' ');
  if (headerParts.length !== 2 || headerParts[0] !== 'Bearer') {
    const error = new Error('Invalid authorization header format');
    (error as any).statusCode = 401;
    throw error;
  }

  // Extract the token from the Authorization header
  const token = headerParts[1];

  let decoded: DecodedToken | undefined;

  try {
    // Verify the token using the secret key from environment variables
    decoded = jwt.verify(token, process.env.JWT_SECRET as string) as DecodedToken;
  } catch (e) {
    const error = new Error("Token verification failed");
    (error as any).statusCode = 500;
    throw error;
  }

  // If the token is invalid (decoded is null or undefined)
  if (!decoded) {
    const error = new Error('Not authenticated');
    (error as any).statusCode = 401;
    throw error;
  }

  // Attach the userId from the token to the request object for further use in routes
  request.userId = decoded.userId;

  // Proceed to the next middleware or route handler
  next();
};

export default loginRequired;
