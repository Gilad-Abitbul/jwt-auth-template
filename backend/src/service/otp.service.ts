import { UserDocument } from '../models/user';
import { EmailService } from '../utils/email/emailService';
import { encrypt, compare } from '../utils/encryption/aes.encryption';
import { OtpRedisService } from './redis.service';

type VerifyOtpResult =
  | { success: true }
  | { success: false; attemptsLeft?: number };

export class OtpService {
  static generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  static async generateAndSendOtp(user: UserDocument): Promise<void> {

    const otp = this.generateOtp();
    const hashedOtp = encrypt(otp);

    await OtpRedisService.setOtp(user, hashedOtp);

    await EmailService.sendEmail('OTP', {
      user,
      otp,
    });
  }

  static async verifyOtp(email: string, otp: string): Promise<VerifyOtpResult> {
    const data = await OtpRedisService.getOtpData(email);
    if (!data) {
      return { success: false }
    }

    const isMatch = compare(otp, data.hashedOtp);

    if (!isMatch) {
      const attemptsLeft = await OtpRedisService.decreaseAttempts(email);
      if (attemptsLeft) {
        return { success: false, attemptsLeft }
      }
      return { success: false };
    }

    await OtpRedisService.deleteOtp(email);
    return { success: true };
  }

  static maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    return local.length <= 3
      ? local[0] + '***@' + domain
      : local.substring(0, 3) + '***@' + domain;
  }
}