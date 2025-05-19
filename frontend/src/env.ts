import { z } from 'zod';

const envSchema = z.object({
  VITE_FRONTEND_DOMAIN: z.string().url(),
  VITE_BACKEND_DOMAIN: z.string().url(),
});

const _env = envSchema.safeParse(import.meta.env);

if (!_env.success) {
  console.error('Invalid environment variables:', _env.error.format());
  throw new Error('Invalid environment variables');
}

export const env = {
  frontendDomain: _env.data.VITE_FRONTEND_DOMAIN,
  backendDomain: _env.data.VITE_BACKEND_DOMAIN,
};