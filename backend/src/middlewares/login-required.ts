import { Request, Response, NextFunction } from 'express';
import { TokenPayloadData, TokenService } from '../services/token.service';
import HttpError from '../utils/HttpError';

const loginRequired = (request: Request, response: Response, next: NextFunction): void => {
  // Retrieve the Authorization header
  const header = request.get('Authorization');

  // Check if the Authorization header is provided
  if (!header) {
    return next(new HttpError('No authorization header provided in the request', 401));
  }

  // Check if the header is in the correct format 'Bearer <token>'
  const headerParts = header.split(' ');
  if (headerParts.length !== 2 || headerParts[0] !== 'Bearer') {
    return next(new HttpError('Invalid authorization header format', 401));
  }

  // Extract the token from the Authorization header
  const token = headerParts[1];

  let decoded: TokenPayloadData;

  try {
    // Verify the token using the secret key from environment variables
    decoded = TokenService.verifyToken(token);
  } catch (e) {
    return next(new HttpError('Token verification failed', 401))
  }

  if (!decoded || decoded?.type !== 'access') return next(new HttpError('Not authenticated', 401))

  // Attach the userId from the token to the request object for further use in routes
  request.userId = decoded.userId;

  // Proceed to the next middleware or route handler
  next();
};

export default loginRequired;
