/**
 * Encryption Utility Module
 *
 * This module provides general-purpose AES-256-CBC encryption and decryption functions
 * for securely storing and retrieving sensitive plain text data.
 *
 * The encryption key must be a 64-character hex string (32 bytes),
 * and should be stored securely as an environment variable (ENCRYPTION_KEY).
 *
 * Example:
 * const { encrypt, decrypt } = require('./utils/encryption');
 * const cipher = encrypt('Hello World');
 * const plain = decrypt(cipher);
 */

// Loads environment variables from the .env file (***only in development environment***)
require('dotenv').config()
const crypto = require('crypto');

const algorithm = 'aes-256-cbc';
const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');

/**
 * Encrypts a plain text string using AES-256-CBC algorithm.
 *
 * @param {string} plainText - The plain text to encrypt.
 * @returns {string} A string combining IV and encrypted data, separated by ':'.
 *
 * @throws {Error} If the plainText is not a string.
 */
function encrypt(plainText) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
}

/**
 * Decrypts a cipher text string using AES-256-CBC algorithm.
 *
 * @param {string} cipherText - The cipher string in the format 'ivHex:encryptedHex'.
 * @returns {string} The decrypted plain text.
 *
 * @throws {Error} If the input format is invalid or decryption fails.
 */
function decrypt(cipherText) {
  const [ivHex, encryptedHex] = cipherText.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const encryptedText = Buffer.from(encryptedHex, 'hex');
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

module.exports = {
  encrypt,
  decrypt,
};