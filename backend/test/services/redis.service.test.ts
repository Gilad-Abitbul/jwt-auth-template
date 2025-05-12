import Redis from 'ioredis-mock';
import redisClient from '../../src/utils/redisClient';
import { OtpRedisService, ResetTokenRedisService } from '../../src/services/redis.service';
import { UserDocument } from '../../src/models/user';

jest.mock('../../src/utils/redisClient', () => new Redis());

describe('OtpRedisService', () => {
  const email = 'test@example.com';
  const user = {
    _id: 'user123',
    email,
  } as unknown as UserDocument;
  const hashedOtp = 'hashedOtp123';

  beforeEach(async () => {
    await redisClient.flushall();
  });

  it('should set OTP and retrieve it', async () => {
    await OtpRedisService.setOtp(user, hashedOtp);
    const data = await OtpRedisService.getOtpData(email);

    expect(data).not.toBeNull();
    expect(data?.userId).toBe(user._id);
    expect(data?.hashedOtp).toBe(hashedOtp);
    expect(data?.attemptsLeft).toBe(3);
  });

  it('should decrease attempts and delete key if attempts reach 0', async () => {
    await OtpRedisService.setOtp(user, hashedOtp);

    for (let i = 0; i < 3; i++) {
      const attemptsLeft = await OtpRedisService.decreaseAttempts(email);
      if (i < 2) {
        expect(attemptsLeft).toBe(2 - i);
      } else {
        expect(attemptsLeft).toBeLessThanOrEqual(0);
        const data = await OtpRedisService.getOtpData(email);
        expect(data).toBeNull();
      }
    }
  });

  it('should delete OTP', async () => {
    await OtpRedisService.setOtp(user, hashedOtp);
    await OtpRedisService.deleteOtp(email);
    const data = await OtpRedisService.getOtpData(email);
    expect(data).toBeNull();
  });
});

describe('ResetTokenRedisService', () => {
  const email = 'reset@example.com';
  const hashedResetToken = 'hashedResetToken123';

  beforeEach(async () => {
    await redisClient.flushall();
  });

  it('should set and get reset token', async () => {
    await ResetTokenRedisService.setResetToken(email, hashedResetToken);
    const token = await ResetTokenRedisService.getToken(email);
    expect(token).toBe(hashedResetToken);
  });

  it('should delete reset token', async () => {
    await ResetTokenRedisService.setResetToken(email, hashedResetToken);
    await ResetTokenRedisService.deleteToken(email);
    const token = await ResetTokenRedisService.getToken(email);
    expect(token).toBeNull();
  });
});