import jwt from 'jsonwebtoken';
import { env } from '../env';
import HttpError from '../utils/HttpError';
import type { SignOptions } from 'jsonwebtoken';

export type TokenType = 'access' | 'verification' | 'refresh';

export interface TokenPayloadData {
  userId: string;
  type: TokenType;
}

const secretsMap: Record<string, string> = {
  'access-token-v1': env.accessTokenSecret,
  'refresh-token-v1': env.refreshTokenSecret,
  'verification-v1': env.verificationTokenSecret,
};

const kidMap: Record<TokenType, string> = {
  access: 'access-token-v1',
  refresh: 'refresh-token-v1',
  verification: 'verification-v1',
};

export class TokenService {

  static generateToken(
    payload: TokenPayloadData,
    expiresIn: SignOptions['expiresIn'] = '1h'
  ): string {
    const kid = kidMap[payload.type];
    const secret = secretsMap[kid];

    return jwt.sign(
      payload,
      secret,
      {
        expiresIn,
        header: {
          kid,
          alg: 'HS256'
        }
      }
    );
  }

  static verifyToken(token: string): TokenPayloadData {
    try {
      const decodedHeader = jwt.decode(token, { complete: true });

      if (!decodedHeader || typeof decodedHeader !== 'object') throw new HttpError('Invalid token header', 400);

      const kid = decodedHeader.header?.kid;
      if (!kid || !secretsMap[kid]) throw new HttpError('Unknown or missing token kid', 400);

      const secret = secretsMap[kid];
      const decoded = jwt.verify(token, secret);
      if (typeof decoded === 'string') throw new HttpError('Invalid token payload', 400);

      const { userId, type } = decoded as Partial<TokenPayloadData>;
      if (!userId || !type) throw new HttpError('Invalid token payload', 400);

      return { userId, type };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) throw new HttpError('Token expired', 401);
      if (error instanceof jwt.JsonWebTokenError) throw new HttpError('Invalid token', 401);
      if (error instanceof HttpError) throw error;
      throw new HttpError('Token verification failed', 500);
    }
  }
}