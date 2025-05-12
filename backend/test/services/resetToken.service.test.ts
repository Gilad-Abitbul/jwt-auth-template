import { ResetTokenService } from '../../src/services/resetToken.service';
import { ResetTokenRedisService } from '../../src/services/redis.service';
import * as encryption from '../../src/utils/encryption/aes.encryption';
import { v4 as uuidv4 } from 'uuid';

jest.mock('../../src/services/redis.service', () => ({
  ResetTokenRedisService: {
    setResetToken: jest.fn(),
    getToken: jest.fn(),
    deleteToken: jest.fn(),
  },
}));

jest.mock('../../src/utils/encryption/aes.encryption');

jest.mock('uuid', () => ({
  v4: jest.fn(),
}));

describe('ResetTokenService', () => {
  const email = 'test@example.com';
  const token = 'reset-token';
  const encryptedToken = 'encrypted-reset-token';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createAndStore', () => {
    it('should generate, encrypt, and store a reset token', async () => {
      (uuidv4 as jest.Mock).mockReturnValue(token);
      (encryption.encrypt as jest.Mock).mockReturnValue(encryptedToken);

      const result = await ResetTokenService.createAndStore(email);

      expect(uuidv4).toHaveBeenCalled();
      expect(encryption.encrypt).toHaveBeenCalledWith(token);
      expect(ResetTokenRedisService.setResetToken).toHaveBeenCalledWith(email, encryptedToken);
      expect(result).toBe(token);
    });
  });

  describe('verify', () => {
    it('should return true if token matches stored encrypted token', async () => {
      (ResetTokenRedisService.getToken as jest.Mock).mockResolvedValue(encryptedToken);
      (encryption.compare as jest.Mock).mockReturnValue(true);

      const result = await ResetTokenService.verify(email, token);

      expect(ResetTokenRedisService.getToken).toHaveBeenCalledWith(email);
      expect(encryption.compare).toHaveBeenCalledWith(token, encryptedToken);
      expect(result).toBe(true);
    });

    it('should return false if no token is stored', async () => {
      (ResetTokenRedisService.getToken as jest.Mock).mockResolvedValue(null);

      const result = await ResetTokenService.verify(email, token);

      expect(result).toBe(false);
    });

    it('should return false if tokens do not match', async () => {
      (ResetTokenRedisService.getToken as jest.Mock).mockResolvedValue(encryptedToken);
      (encryption.compare as jest.Mock).mockReturnValue(false);

      const result = await ResetTokenService.verify(email, token);

      expect(result).toBe(false);
    });
  });

  describe('delete', () => {
    it('should delete the token', async () => {
      await ResetTokenService.delete(email);

      expect(ResetTokenRedisService.deleteToken).toHaveBeenCalledWith(email);
    });
  });
});