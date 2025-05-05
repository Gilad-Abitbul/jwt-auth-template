import jwt from 'jsonwebtoken';
import { config } from '../config';
import HttpError from '../utils/HttpError';

export interface TokenPayloadData {
  userId: string;
}

export class TokenService {
  static generateToken(payload: TokenPayloadData): string {
    return jwt.sign(
      payload,
      config.jwtSecret,
      { expiresIn: '1h' });
  }

  static verifyToken(token: string): TokenPayloadData {
    try {
      const decoded = jwt.verify(token, config.jwtSecret);

      if (typeof decoded === 'string') throw new HttpError('Invalid token payload', 400);

      return decoded as TokenPayloadData;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new HttpError('Invalid token', 401);
      }
      throw new HttpError('Token verification failed', 500);
    }
  }
}