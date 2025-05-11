
import { encrypt, decrypt, compare } from '../../../src/utils/encryption/aes.encryption';

describe('AES Encryption', () => {
  // Test encryption and decryption
  describe('encrypt and decrypt', () => {
    it('should encrypt and then decrypt a string correctly', () => {
      const plainText = 'Hello World';
      const encryptedText = encrypt(plainText);  // Encrypt the string
      const decryptedText = decrypt(encryptedText);  // Decrypt it back

      expect(decryptedText).toBe(plainText);  // Ensure the decrypted text matches the original
    });

    it('should throw an error if the input to decrypt is invalid', () => {
      expect(() => decrypt('invalidCipherText')).toThrow('Invalid input format for cipher text.');
    });
  });

  // Test comparison function
  describe('compare', () => {
    it('should return true for matching plain text and encrypted text', () => {
      const plainText = 'SecretPassword';
      const encryptedText = encrypt(plainText);

      const result = compare(plainText, encryptedText);  // Compare plain and encrypted
      expect(result).toBe(true);  // Should return true
    });

    it('should return false for non-matching plain text and encrypted text', () => {
      const plainText = 'SecretPassword';
      const encryptedText = encrypt('OtherPassword');

      const result = compare(plainText, encryptedText);  // Compare different plain text
      expect(result).toBe(false);  // Should return false
    });
  });
});