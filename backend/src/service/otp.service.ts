import bcrypt from 'bcryptjs';
import { Types } from 'mongoose';
import { UserDocument } from '../models/user';
import redisClient from '../utils/redisClient';
import { EmailService } from '../utils/email/emailService';
import { config } from '../config'
import { encrypt } from '../utils/encryption/aes.encryption';

export class OtpService {
  static generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  static async generateAndSendOtp(user: UserDocument): Promise<void> {
    const email = user.email;

    const otp = this.generateOtp();
    const hashedOtp = encrypt(otp);

    const redisKey = `passwordResetOTP:${email}`;
    await redisClient.del(redisKey); // Invalidate previous OTP

    const redisValue = JSON.stringify({
      userId: (user._id as Types.ObjectId).toString(),
      hashedOtp,
      attemptsLeft: 3,
    });

    await redisClient.set(redisKey, redisValue, 'EX', 300); // 5 minutes TTL

    await EmailService.sendEmail('OTP', {
      user,
      otp,
    });
  }

  static maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    return local.length <= 3
      ? local[0] + '***@' + domain
      : local.substring(0, 3) + '***@' + domain;
  }
}