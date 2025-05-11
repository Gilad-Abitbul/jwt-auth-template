import { AuthService } from '../../src/services/auth.service';
import { UserService } from '../../src/services/user.service';
import { TokenService } from '../../src/services/token.service';
import { EmailService } from '../../src/utils/email/emailService';
import * as bcrypt from '../../src/utils/encryption/bcrypt.encryption';
import HttpError from '../../src/utils/HttpError';
import { UserDocument } from '../../src/models/user';

jest.mock('../../src/services/user.service');
jest.mock('../../src/services/token.service');
jest.mock('../../src/utils/email/emailService');
jest.mock('../../src/utils/encryption/bcrypt.encryption');

describe('AuthService', () => {
  const mockUser = {
    _id: { toString: () => 'userId123' },
    email: 'test@example.com',
    password: 'hashedPassword',
    verified: true,
  } as unknown as UserDocument;

  afterEach(() => jest.clearAllMocks());

  describe('registerUser', () => {
    it('should register a new user and send verification email', async () => {
      (UserService.getUserByEmail as jest.Mock).mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
      (UserService.createUser as jest.Mock).mockResolvedValue(mockUser);
      (TokenService.generateToken as jest.Mock).mockReturnValue('token');
      (EmailService.sendEmail as jest.Mock).mockResolvedValue(undefined);

      const result = await AuthService.registerUser({
        email: 'test@example.com',
        password: 'pass1234',
        firstName: 'Test',
        lastName: 'User',
      });

      expect(result).toBe('userId123');
      expect(EmailService.sendEmail).toHaveBeenCalledWith('VERIFY', expect.any(Object));
    });

    it('should throw if user already exists', async () => {
      (UserService.getUserByEmail as jest.Mock).mockResolvedValue(mockUser);

      await expect(AuthService.registerUser({
        email: 'test@example.com',
        password: 'pass1234',
        firstName: 'Test',
        lastName: 'User',
      })).rejects.toThrow(HttpError);
    });
  });

  describe('loginUser', () => {
    it('should return tokens if credentials are valid', async () => {
      (UserService.getUserByEmail as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (TokenService.generateToken as jest.Mock).mockReturnValueOnce('accessToken').mockReturnValueOnce('refreshToken');

      const result = await AuthService.loginUser('test@example.com', 'pass1234');
      expect(result).toEqual({ accessToken: 'accessToken', refreshToken: 'refreshToken' });
    });

    it('should throw if user not found', async () => {
      (UserService.getUserByEmail as jest.Mock).mockResolvedValue(null);

      await expect(AuthService.loginUser('no@user.com', 'pass')).rejects.toThrow(HttpError);
    });

    it('should throw if password does not match', async () => {
      (UserService.getUserByEmail as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(AuthService.loginUser('test@example.com', 'wrongpass')).rejects.toThrow(HttpError);
    });

    it('should throw if email not verified', async () => {
      (UserService.getUserByEmail as jest.Mock).mockResolvedValue({ ...mockUser, verified: false });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(AuthService.loginUser('test@example.com', 'pass')).rejects.toThrow(HttpError);
    });
  });

  describe('changePassword', () => {
    it('should update the user password', async () => {
      (UserService.getUserByEmail as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('newHashed');
      (UserService.changePassword as jest.Mock).mockResolvedValue({ ...mockUser, password: 'newHashed' });

      const result = await AuthService.changePassword('test@example.com', 'newPass');
      expect(result.password).toBe('newHashed');
    });

    it('should throw if user not found', async () => {
      (UserService.getUserByEmail as jest.Mock).mockResolvedValue(null);

      await expect(AuthService.changePassword('not@found.com', 'newPass')).rejects.toThrow(HttpError);
    });
  });
});