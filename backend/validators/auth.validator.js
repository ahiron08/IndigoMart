import { z } from 'zod';

const passwordSchema = z
  .string()
  .min(8, 'Password must contain at least 8 characters.')
  .max(72, 'Password cannot exceed 72 characters.')
  .regex(/[a-z]/, 'Password must contain a lowercase letter.')
  .regex(/[A-Z]/, 'Password must contain an uppercase letter.')
  .regex(/\d/, 'Password must contain a number.');

export const registerSchema = z.object({
  body: z
    .object({
      name: z.string().trim().min(2).max(100),
      email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
      password: passwordSchema,
      passwordConfirm: z.string(),
      phone: z.string().trim().max(20).optional(),
    })
    .refine((data) => data.password === data.passwordConfirm, {
      message: 'Passwords do not match.',
      path: ['passwordConfirm'],
    }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().email().transform((value) => value.toLowerCase()),
    password: z.string().min(1, 'Password is required.'),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().trim().email().transform((value) => value.toLowerCase()),
  }),
});

export const customerRegisterSchema = z.object({
  body: z
    .object({
      name: z.string().trim().min(2).max(100),
      email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
      password: passwordSchema,
      passwordConfirm: z.string(),
      phone: z.string().trim().max(20).optional(),
    })
    .refine((data) => data.password === data.passwordConfirm, {
      message: 'Passwords do not match.',
      path: ['passwordConfirm'],
    }),
});

export const sellerRegisterSchema = z.object({
  body: z
    .object({
      name: z.string().trim().min(2).max(100),
      email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
      password: passwordSchema,
      passwordConfirm: z.string(),
      phone: z.string().trim().max(20).optional(),
      shopName: z.string().trim().min(2).max(100),
      businessType: z.string().trim().min(2).max(100),
      gstNumber: z.string().trim().max(50).optional(),
      panNumber: z.string().trim().max(50).optional(),
      shopAddress: z.string().trim().min(5).max(500),
      city: z.string().trim().min(2).max(100),
      state: z.string().trim().min(2).max(100),
      pinCode: z.string().trim().min(3).max(20),
      shopDescription: z.string().trim().max(2000).optional(),
      categoriesSold: z.array(z.string().trim()).optional(),
      accountHolderName: z.string().trim().min(2).max(100),
      bankName: z.string().trim().min(2).max(100),
      accountNumber: z.string().trim().min(1).max(50),
      ifscCode: z.string().trim().min(1).max(20),
      govtIdType: z.enum(['Aadhaar', 'PAN', 'Voter ID', 'Passport', 'Driving Licence'], {
        errorMap: () => ({ message: 'Select a valid government ID type.' }),
      }),
      govtIdNumber: z.string().trim().min(2, 'Enter your government ID number.').max(100),
    })
    .refine((data) => data.password === data.passwordConfirm, {
      message: 'Passwords do not match.',
      path: ['passwordConfirm'],
    }),
});

export const resetPasswordSchema = z.object({
  params: z.object({ token: z.string().length(64) }),
  body: z
    .object({ password: passwordSchema, passwordConfirm: z.string() })
    .refine((data) => data.password === data.passwordConfirm, {
      message: 'Passwords do not match.',
      path: ['passwordConfirm'],
    }),
});