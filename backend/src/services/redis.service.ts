import { UserDocument } from "../models/user";
import redisClient from "../utils/redisClient";

const OTP_TTL_SECONDS = 300;

export const OtpRedisService = {
  getKey: (email: string) => `auth:password-reset:otp:${email}`,

  async setOtp(user: UserDocument, hashedOtp: string): Promise<void> {

    const key = this.getKey(user.email);

    await redisClient.del(key);

    await redisClient.hset(key, {
      userId: user._id.toString(),
      hashedOtp,
      attemptsLeft: 3,
    });

    await redisClient.expire(key, OTP_TTL_SECONDS);
  },

  async getOtpData(email: string): Promise<{
    userId: string;
    hashedOtp: string;
    attemptsLeft: number;
  } | null> {
    const key = this.getKey(email);
    const data = await redisClient.hgetall(key);
    if (!data || Object.keys(data).length === 0) return null;

    return {
      userId: data.userId,
      hashedOtp: data.hashedOtp,
      attemptsLeft: parseInt(data.attemptsLeft, 10),
    };
  },

  async decreaseAttempts(email: string): Promise<number | null> {

    const key = this.getKey(email);

    const exists = await redisClient.exists(key);
    if (!exists) return null;

    const attemptsLeft = await redisClient.hincrby(key, 'attemptsLeft', -1);

    if (attemptsLeft <= 0) {
      await redisClient.del(key);
    }
    return attemptsLeft;
  },

  async deleteOtp(email: string): Promise<void> {
    const key = this.getKey(email);
    await redisClient.del(key);
  },
};


export const ResetTokenRedisService = {
  getKey: (email: string) => `auth:password-reset:token:${email}`,

  async setResetToken(email: string, hashedResetToken: string): Promise<void> {
    const key = this.getKey(email);
    await redisClient.set(key, hashedResetToken, 'EX', 600);
  },

  async getToken(email: string): Promise<string | null> {
    const key = this.getKey(email);
    return await redisClient.get(key);
  },

  async deleteToken(email: string): Promise<void> {
    const key = this.getKey(email);
    await redisClient.del(key);
  }
}