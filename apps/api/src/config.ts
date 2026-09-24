import dotenv from 'dotenv';
import { resolve } from 'node:path';
import { z } from 'zod';

dotenv.config({ path: resolve(process.cwd(), '.env') });
dotenv.config({ path: resolve(process.cwd(), '../../.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  JWT_ACCESS_SECRET: z.string().min(32).default('development-only-secret-change-me-123456'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  MONGODB_URI: z.string().min(1).optional(),
  MONGODB_CONNECT_TIMEOUT_MS: z.coerce.number().int().positive().default(5000)
});

export const config = envSchema.parse(process.env);