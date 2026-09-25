import dotenv from 'dotenv';
import { resolve } from 'node:path';
import { z } from 'zod';

dotenv.config({ path: resolve(process.cwd(), '.env') });
dotenv.config({ path: resolve(process.cwd(), '../../.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  JWT_ACCESS_SECRET: z.string().min(32).optional(),
  JWT_REFRESH_SECRET: z.string().min(32).optional(),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
  JWT_REFRESH_DAYS: z.coerce.number().int().positive().default(30),
  MONGODB_URI: z.string().min(1).optional(),
  MONGODB_CONNECT_TIMEOUT_MS: z.coerce.number().int().positive().default(5000)
}).superRefine((value, context) => {
  if (value.NODE_ENV === 'production') {
    if (!value.JWT_ACCESS_SECRET) context.addIssue({ code: z.ZodIssueCode.custom, path: ['JWT_ACCESS_SECRET'], message: 'JWT_ACCESS_SECRET is required in production' });
    if (!value.JWT_REFRESH_SECRET) context.addIssue({ code: z.ZodIssueCode.custom, path: ['JWT_REFRESH_SECRET'], message: 'JWT_REFRESH_SECRET is required in production' });
  }
});

export const config = envSchema.parse(process.env);
export const accessSecret = config.JWT_ACCESS_SECRET ?? 'development-only-access-secret-change-me-123456';
export const refreshSecret = config.JWT_REFRESH_SECRET ?? 'development-only-refresh-secret-change-me-123456';
