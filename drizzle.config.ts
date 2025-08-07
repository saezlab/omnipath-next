import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

// Select DATABASE_URL based on NODE_ENV
const nodeEnv = process.env.NODE_ENV || 'development';
const databaseUrl = nodeEnv === 'production' 
  ? process.env.DATABASE_URL_PROD 
  : process.env.DATABASE_URL_DEV;

if (!databaseUrl) {
  throw new Error(`DATABASE_URL_${nodeEnv === 'production' ? 'PROD' : 'DEV'} is not set`);
}

export default defineConfig({
  out: './src/db/drizzle',
  schema: './src/db/drizzle/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: databaseUrl,
  },
});
