import { hash, compare } from '../../../src/utils/encryption/bcrypt.encryption';

describe('Bcrypt Encryption', () => {
  let plainText: string;
  let hashedText: string;

  beforeAll(async () => {
    plainText = 'password123';
    hashedText = await hash(plainText);
  });

  describe('hash', () => {
    it('should hash a plain text correctly', async () => {
      const result = await hash(plainText);
      expect(result).not.toBe(plainText);
    });
  });

  describe('compare', () => {
    it('should return true for matching plain text and hashed text', async () => {
      const result = await compare(plainText, hashedText);
      expect(result).toBe(true);
    });

    it('should return false for non-matching plain text and hashed text', async () => {
      const result = await compare('wrongPassword', hashedText);
      expect(result).toBe(false);
    });
  });
});