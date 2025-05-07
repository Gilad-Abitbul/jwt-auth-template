import { z } from 'zod';

export const createUserSchema = z.object({
  email: z.string()
    .min(1, 'Email is required.')
    .email({ message: 'Invalid email address.' })
    .transform((val) => val.trim().toLowerCase()),

  password: z.string()
    .min(5, { message: 'Password must be at least 5 characters.' })
    .max(12, { message: 'Password must be at most 12 characters.' })
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter.')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter.')
    .regex(/[0-9]/, 'Password must contain at least one number.')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character (e.g. @, #, $).')
    .refine(val => !val.includes(' '), 'Password must not contain spaces.'),

  firstName: z.string()
    .trim()
    .min(3).max(12)
    .refine(val => !val.includes(' '), 'First name must not contain spaces.'),

  lastName: z.string()
    .trim()
    .min(3).max(12)
    .refine(val => !val.includes(' '), 'Last name must not contain spaces.'),
});

export type CreateUserRequestBody = z.infer<typeof createUserSchema>;


export const loginUserSchema = z.object({
  email: z
    .string()
    .email({ message: 'Please enter a valid email address.' })
    .transform((val) => val.trim().toLowerCase()),

  password: z
    .string()
    .min(5, { message: 'Password must be at least 5 characters long.' })
    .max(12, { message: 'Password must be between 5 and 12 characters long.' })
    .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter.' })
    .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter.' })
    .regex(/[0-9]/, { message: 'Password must contain at least one number.' })
    .regex(/[^A-Za-z0-9]/, { message: 'Password must contain at least one special character (e.g. @, #, $).' })
    .refine(val => !val.includes(' '), 'Password must not contain spaces.'),
});

export type LoginUserRequestBody = z.infer<typeof loginUserSchema>;

export const requestPasswordResetOtpSchema = z.object({
  email: z.string()
    .min(1, 'Email is required.')
    .email({ message: 'Invalid email address.' })
    .transform((val) => val.trim().toLowerCase()),
});

export type RequestPasswordResetOtpBody = z.infer<typeof requestPasswordResetOtpSchema>;


export const verifyResetOtpSchema = z.object({
  otp: z
    .string()
    .length(6, { message: 'Incorrect OTP format' })
    .regex(/^\d+$/, { message: 'Incorrect OTP format' }),

  email: z
    .string()
    .email({ message: 'Invalid email address.' })
    .transform((val) => val.trim().toLowerCase()),
});

export type RequestVerifyResetOtpBody = z.infer<typeof verifyResetOtpSchema>;


export const resetPasswordSchema = z.object({
  email: z
    .string()
    .email({ message: 'Invalid email address.' })
    .transform((val) => val.trim().toLowerCase()),

  newPassword: z
    .string()
    .min(5, 'Password must be between 5 and 12 characters long.')
    .max(12, 'Password must be between 5 and 12 characters long.')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter.')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter.')
    .regex(/[0-9]/, 'Password must contain at least one number.')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character (e.g. @, #, $).')
    .refine(val => !/\s/.test(val), {
      message: 'Password must not contain spaces.',
    }),

  resetToken: z
    .string()
    .uuid('Invalid reset token.'),
});

export type RequestResetPasswordBody = z.infer<typeof resetPasswordSchema>;

export const verifyEmailQuerySchema = z.object({
  token: z.string().min(1, 'Required'),
});

export type RequestVerifyEmailQueryParam = z.infer<typeof verifyEmailQuerySchema>;


export const ResendVerifyEmailSchema = z.object({
  email: z
    .string()
    .email({ message: 'Invalid email address.' })
    .transform((val) => val.trim().toLowerCase()),
});

export type RequestVerifyEmailBody = z.infer<typeof ResendVerifyEmailSchema>;