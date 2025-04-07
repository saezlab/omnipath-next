import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './src/db/drizzle',
  schema: './src/db/drizzle/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'omnipath',
    password: process.env.DB_PASSWORD || 'omnipath123',
    database: process.env.DB_NAME || 'omnipath',
    ssl: false,
  },
});
