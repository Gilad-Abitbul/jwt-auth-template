
import jwt, { JwtPayload } from 'jsonwebtoken';
import { TokenService, TokenPayloadData } from '../../src/services/token.service';

// Mocking the env module to provide fake secrets
jest.mock('../../src/env', () => ({
  env: {
    accessTokenSecret: 'mock-access-secret',
    refreshTokenSecret: 'mock-refresh-secret',
    verificationTokenSecret: 'mock-verification-secret',
    backendDomain: 'http://localhost:3000',
  },
}));

describe('TokenService', () => {
  const mockPayload: TokenPayloadData = {
    userId: '12345',
    type: 'access',
  };

  it('should generate a valid JWT token with correct payload and header', () => {
    const token = TokenService.generateToken(mockPayload, '1h');

    const decoded = jwt.decode(token, { complete: true });
    expect(decoded).toBeTruthy();
    if (!decoded || typeof decoded !== 'object') return;

    const { header, payload } = decoded;

    expect(header.alg).toBe('HS256');
    expect(header.kid).toBe('access-token-v1');

    if (typeof payload !== 'object' || payload === null) return;

    expect((payload as JwtPayload).userId).toBe(mockPayload.userId);
    expect((payload as JwtPayload).type).toBe(mockPayload.type);
  });

  it('should verify a valid token and return the correct payload', () => {
    const token = TokenService.generateToken(mockPayload, '1h');
    const verifiedPayload = TokenService.verifyToken(token);
    expect(verifiedPayload).toEqual(mockPayload);
  });

  it('should throw an error for token with unknown kid', () => {
    const token = jwt.sign(mockPayload, 'some-secret', {
      header: { kid: 'unknown-kid', alg: 'HS256' },
    });

    expect(() => TokenService.verifyToken(token)).toThrow('Unknown or missing token kid');
  });

  it('should throw an error for token with string payload (invalid)', () => {
    const token = jwt.sign('invalid-string-payload', 'mock-access-secret', {
      header: { kid: 'access-token-v1', alg: 'HS256' },
    });

    expect(() => TokenService.verifyToken(token)).toThrow('Invalid token payload');
  });

  it('should throw an error for expired token', async () => {
    const shortLivedToken = TokenService.generateToken(mockPayload, '1ms');
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(() => TokenService.verifyToken(shortLivedToken)).toThrow('Token expired');
  });

  it('should throw a generic error for malformed token', () => {
    const invalidToken = 'this.is.not.valid';
    expect(() => TokenService.verifyToken(invalidToken)).toThrow('Invalid token');
  });

  it('should throw an error for token missing required payload fields', () => {
    const incompletePayload = { userId: '12345' }; // missing "type"
    const token = jwt.sign(incompletePayload, 'mock-access-secret', {
      header: { kid: 'access-token-v1', alg: 'HS256' },
    });

    expect(() => TokenService.verifyToken(token)).toThrow('Invalid token payload');
  });

  it('should correctly handle a refresh token', () => {
    const refreshPayload = { userId: 'abcde', type: 'refresh' as const };
    const token = TokenService.generateToken(refreshPayload, '1h');
    const result = TokenService.verifyToken(token);
    expect(result).toEqual(refreshPayload);
  });
});