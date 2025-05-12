import { OtpService } from '../../src/services/otp.service';
import { OtpRedisService } from '../../src/services/redis.service';
import { EmailService } from '../../src/utils/email/emailService';
import * as encryption from '../../src/utils/encryption/aes.encryption';
import { UserDocument } from '../../src/models/user';

jest.mock('../../src/utils/redisClient', () => ({
  __esModule: true,
  default: {
    on: jest.fn(),
    quit: jest.fn(),
  },
}));

jest.mock('../../src/services/redis.service', () => ({
  OtpRedisService: {
    setOtp: jest.fn(),
    getOtpData: jest.fn(),
    decreaseAttempts: jest.fn(),
    deleteOtp: jest.fn(),
  },
}));
jest.mock('../../src/utils/email/emailService');
jest.mock('../../src/utils/encryption/aes.encryption');

const mockUser = {
  _id: 'user123',
  email: 'test@example.com',
} as unknown as UserDocument;

describe('OtpService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateOtp', () => {
    it('should generate a 6-digit OTP string', () => {
      const otp = OtpService.generateOtp();
      expect(typeof otp).toBe('string');
      expect(otp.length).toBe(6);
      expect(Number(otp)).not.toBeNaN();
    });
  });

  describe('generateAndSendOtp', () => {
    it('should generate, encrypt, store and send OTP', async () => {
      const encryptMock = encryption.encrypt as jest.Mock;
      encryptMock.mockReturnValue('encryptedOtp');

      await OtpService.generateAndSendOtp(mockUser);

      expect(encryptMock).toHaveBeenCalled();
      expect(OtpRedisService.setOtp).toHaveBeenCalledWith(mockUser, 'encryptedOtp');
      expect(EmailService.sendEmail).toHaveBeenCalledWith('OTP', {
        user: mockUser,
        otp: expect.any(String),
      });
    });
  });

  describe('verifyOtp', () => {
    it('should return success: true for correct OTP', async () => {
      (OtpRedisService.getOtpData as jest.Mock).mockResolvedValue({
        userId: mockUser._id,
        hashedOtp: 'hashedOtp',
        attemptsLeft: 3,
      });
      (encryption.compare as jest.Mock).mockReturnValue(true);

      const result = await OtpService.verifyOtp(mockUser.email, '123456');

      expect(result).toEqual({ success: true });
      expect(OtpRedisService.deleteOtp).toHaveBeenCalledWith(mockUser.email);
    });

    it('should return success: false and decrease attempts on incorrect OTP', async () => {
      (OtpRedisService.getOtpData as jest.Mock).mockResolvedValue({
        userId: mockUser._id,
        hashedOtp: 'wrongHash',
        attemptsLeft: 2,
      });
      (encryption.compare as jest.Mock).mockReturnValue(false);
      (OtpRedisService.decreaseAttempts as jest.Mock).mockResolvedValue(1);

      const result = await OtpService.verifyOtp(mockUser.email, '000000');

      expect(result).toEqual({ success: false, attemptsLeft: 1 });
    });

    it('should return success: false when no data found', async () => {
      (OtpRedisService.getOtpData as jest.Mock).mockResolvedValue(null);

      const result = await OtpService.verifyOtp(mockUser.email, '000000');

      expect(result).toEqual({ success: false });
    });

    it('should return success: false when attempts run out', async () => {
      (OtpRedisService.getOtpData as jest.Mock).mockResolvedValue({
        userId: mockUser._id,
        hashedOtp: 'wrongHash',
        attemptsLeft: 1,
      });
      (encryption.compare as jest.Mock).mockReturnValue(false);
      (OtpRedisService.decreaseAttempts as jest.Mock).mockResolvedValue(0);

      const result = await OtpService.verifyOtp(mockUser.email, '000000');

      expect(result).toEqual({ success: false });
    });
  });

  describe('maskEmail', () => {
    it('should mask short emails correctly', () => {
      expect(OtpService.maskEmail('a@domain.com')).toBe('a***@domain.com');
      expect(OtpService.maskEmail('ab@domain.com')).toBe('a***@domain.com');
    });

    it('should mask long emails correctly', () => {
      expect(OtpService.maskEmail('john.doe@example.com')).toBe('joh***@example.com');
    });
  });
});