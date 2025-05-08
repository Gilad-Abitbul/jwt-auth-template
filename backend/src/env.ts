import { z } from 'zod';

import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  MONGODB_URI: z.string().url({ message: 'MONGODB_URI must be a valid URL' }),
  BCRYPT_SALT_ROUNDS: z.string().regex(/^\d+$/, { message: 'Must be a number' }),
  ACCESS_TOKEN_SECRET: z.string().min(1, 'Missing ACCESS_TOKEN_SECRET'),
  REFRESH_TOKEN_SECRET: z.string().min(1, 'Missing REFRESH_TOKEN_SECRET'),
  VERIFICATION_TOKEN_SECRET: z.string().min(1, 'Missing VERIFICATION_TOKEN_SECRET'),
  AES_256_CBC_ENCRYPTION_KEY: z
    .string()
    .length(64, 'AES key must be 64 hex characters for AES-256-CBC')
    .regex(/^[0-9a-fA-F]+$/, 'AES key must contain only hex characters'),
  EMAIL_USER: z.string().min(1, 'Missing EMAIL_USER'),
  EMAIL_PASS: z.string().min(1, 'Missing EMAIL_PASS'),
  REDIS_HOST: z.string().min(1, 'Missing REDIS_HOST'),
  REDIS_PORT: z.string().regex(/^\d+$/, { message: 'REDIS_PORT must be a number' }),
  FRONTEND_DOMAIN: z.string().url({ message: 'FRONTEND_DOMAIN must be a valid URL' }),
  BACKEND_DOMAIN: z.string().url({ message: 'BACKEND_DOMAIN must be a valid URL' }),
  NODE_ENV: z.enum(['development', 'production', 'test']),
});

const _env = envSchema.safeParse(process.env);


if (!_env.success) {
  console.error('Invalid environment variables:\n', _env.error.format());
  process.exit(1);
}

export const env = {
  mongodbUri: _env.data.MONGODB_URI,
  bcryptSaltRounds: parseInt(_env.data.BCRYPT_SALT_ROUNDS, 10),
  accessTokenSecret: _env.data.ACCESS_TOKEN_SECRET,
  refreshTokenSecret: _env.data.REFRESH_TOKEN_SECRET,
  verificationTokenSecret: _env.data.VERIFICATION_TOKEN_SECRET,
  aesEncryptionKey: _env.data.AES_256_CBC_ENCRYPTION_KEY,
  emailUser: _env.data.EMAIL_USER,
  emailPass: _env.data.EMAIL_PASS,
  redisHost: _env.data.REDIS_HOST,
  redisPort: parseInt(_env.data.REDIS_PORT, 10),
  frontendDomain: _env.data.FRONTEND_DOMAIN,
  backendDomain: _env.data.BACKEND_DOMAIN,
  nodeEnv: _env.data.NODE_ENV,
};
