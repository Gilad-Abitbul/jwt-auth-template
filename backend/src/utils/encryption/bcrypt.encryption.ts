import bcrypt from 'bcryptjs';
import { env } from '../../env';

export async function hash(plainText: string): Promise<string> {
  return bcrypt.hash(plainText, env.bcryptSaltRounds);
}

export async function compare(
  plainText: string,
  hashedText: string
): Promise<boolean> {
  return bcrypt.compare(plainText, hashedText);
}