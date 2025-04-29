/**
 * @file encryption.ts
 * @description
 * This module provides functions for securely encrypting and decrypting strings
 * using the AES-256-CBC symmetric encryption algorithm.
 * 
 * Environment Variables:
 * - ENCRYPTION_KEY: A 64-character hex string representing the 256-bit encryption key.
 * 
 * Dependencies:
 * - Node.js 'crypto' module
 * - 'dotenv' for environment variable management (***only in development environment***)
 * 
 * Usage:
 * - Import { encrypt, decrypt } to encrypt/decrypt sensitive strings.
 * 
 */
import * as crypto from 'crypto';
import dotenv from 'dotenv';

// Loads environment variables from the .env file (***only in development environment***)
dotenv.config();

const algorithm = 'aes-256-cbc';
const key = Buffer.from(process.env.ENCRYPTION_KEY as string, 'hex');

/**
 * Encrypts a plain text string using AES-256-CBC encryption algorithm.
 *
 * This function generates a random 16-byte initialization vector (IV),
 * encrypts the provided plain text using the configured symmetric key and IV,
 * and returns the result as a concatenated string in the format 'iv:encryptedData',
 * where both parts are hex-encoded.
 *
 * @param {string} plainText - The plain text string to encrypt.
 * @returns {string} The resulting encrypted string, containing the IV and encrypted data separated by a colon.
 *
 * @throws {Error} If the input is not a string.
 *
 * @example
 * const cipherText = encrypt('Hello World');
 * console.log(cipherText); // Outputs: 'f3a1...:7b9c...'
 */
function encrypt(plainText: string): string {
  if (typeof plainText !== 'string') {
    throw new Error('The input must be a string.');
  }

  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  const encryptedBuffer = Buffer.concat([
    cipher.update(plainText, 'utf8'),
    cipher.final()
  ]);

  return `${iv.toString('hex')}:${encryptedBuffer.toString('hex')}`;
}

/**
 * Decrypts a cipher text string that was previously encrypted using AES-256-CBC algorithm.
 *
 * This function expects the input to be in the format 'ivHex:encryptedHex'.
 * It extracts the IV and the encrypted data, reconstructs the cipher,
 * and returns the original plain text after decryption.
 *
 * @param {string} cipherText - The cipher string to decrypt, formatted as 'iv:encryptedData' in hex.
 * @returns {string} The decrypted plain text.
 *
 * @throws {Error} If the input format is invalid or decryption fails.
 *
 * @example
 * const plainText = decrypt('f3a1...:7b9c...');
 * console.log(plainText); // Outputs: 'Hello World'
 */
function decrypt(cipherText: string): string {
  const [ivHex, encryptedHex] = cipherText.split(':');

  if (!ivHex || !encryptedHex) {
    throw new Error('Invalid input format for cipher text.');
  }

  const iv = Buffer.from(ivHex, 'hex');
  const encryptedText = Buffer.from(encryptedHex, 'hex');

  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  const decrypted = Buffer.concat([
    decipher.update(encryptedText),
    decipher.final()
  ]);

  return decrypted.toString('utf8');
}

export { encrypt, decrypt };