import { encrypt, compare } from '../utils/encryption/aes.encryption';
import { ResetTokenRedisService } from './redis.service';
import { v4 as uuidv4 } from 'uuid';

export class ResetTokenService {

  static async createAndStore(email: string): Promise<string> {
    const resetToken = uuidv4();
    const encryptedToken = encrypt(resetToken);
    await ResetTokenRedisService.setResetToken(email, encryptedToken);
    return resetToken;
  }

  static async verify(email: string, token: string): Promise<boolean> {
    const storedEncryptedToken = await ResetTokenRedisService.getToken(email);
    if (!storedEncryptedToken) return false;

    return compare(token, storedEncryptedToken);
  }

  static async delete(email: string): Promise<void> {
    await ResetTokenRedisService.deleteToken(email);
  }
}