import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load .env from root project directory or local backend directory
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const envSchema = z.object({
  PORT: z.string().transform(val => parseInt(val, 10)).default('3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  MONGODB_URI: z.string().default('mongodb://localhost:27017/map_aitd'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  GEMINI_API_KEY: z.string().optional(),
  GROQ_API_KEY: z.string().optional()
});

export const env = envSchema.parse(process.env);
export type Env = z.infer<typeof envSchema>;
