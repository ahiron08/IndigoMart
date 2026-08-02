import { z } from 'zod';

const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65_535).default(5000),
  CLIENT_URL: z
    .string()
    .default('http://localhost:5173')
    .transform((value) => value.split(',').map((origin) => origin.trim()).filter(Boolean))
    .pipe(z.array(z.string().url()).min(1)),
  MONGODB_URI: z
    .string({ required_error: 'MONGODB_URI is required.' })
    .min(1, 'MONGODB_URI is required.')
    .refine(
      (value) => value.startsWith('mongodb://') || value.startsWith('mongodb+srv://'),
      'MONGODB_URI must use the mongodb:// or mongodb+srv:// protocol.',
    ),
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must contain at least 32 characters.'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must contain at least 32 characters.'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  ACCESS_COOKIE_MS: z.coerce.number().int().positive().default(900_000),
  REFRESH_COOKIE_MS: z.coerce.number().int().positive().default(604_800_000),
  PASSWORD_RESET_URL: z.string().url().default('http://localhost:5173/reset-password'),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_SECURE: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  EMAIL_FROM: z.string().default('IndigoMart <no-reply@indigomart.local>'),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  DELHIVERY_API_KEY: z.string().optional(),
  QR_UPI_ID: z.string().optional().default('indigomart@upi'),
  QR_PAYEE_NAME: z.string().optional().default('IndigoMart'),
  OPENAI_API_KEY: z.string().optional(),
  QDRANT_URL: z.string().url().default('http://localhost:6333'),
  QDRANT_API_KEY: z.string().optional(),
  QDRANT_COLLECTION_NAME: z.string().default('indigomart_products'),
  EMBEDDING_MODEL: z.string().default('text-embedding-3-small'),
  EMBEDDING_DIMENSIONS: z.coerce.number().int().positive().default(1536),
  ENABLE_SEMANTIC_SEARCH: z.enum(['true', 'false']).default('true').transform((value) => value === 'true'),
  QUERY_EXPANSION_ENABLED: z.enum(['true', 'false']).default('true').transform((value) => value === 'true'),
}).superRefine((data, context) => {
  const cloudinaryValues = [data.CLOUDINARY_CLOUD_NAME, data.CLOUDINARY_API_KEY, data.CLOUDINARY_API_SECRET];
  const configuredCount = cloudinaryValues.filter(Boolean).length;
  if (configuredCount > 0 && configuredCount < cloudinaryValues.length) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['CLOUDINARY_CLOUD_NAME'],
      message: 'All Cloudinary credentials must be provided together.',
    });
  }
});

const parsedEnvironment = environmentSchema.safeParse(process.env);

if (!parsedEnvironment.success) {
  const issues = parsedEnvironment.error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join('\n');

  throw new Error(`Invalid environment configuration:\n${issues}`);
}

export const env = Object.freeze(parsedEnvironment.data);
