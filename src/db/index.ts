import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '@/db/drizzle/schema';
import postgres from 'postgres';

// Select DATABASE_URL based on NODE_ENV
const nodeEnv = process.env.NODE_ENV || 'development';
const databaseUrl = nodeEnv === 'production' 
  ? process.env.DATABASE_URL_PROD 
  : process.env.DATABASE_URL_DEV;

if (!databaseUrl) {
  throw new Error(`DATABASE_URL_${nodeEnv === 'production' ? 'PROD' : 'DEV'} is not set`);
}

// Create a PostgreSQL client using the database URL
const client = postgres(databaseUrl);

// Create a Drizzle ORM instance
export const db = drizzle(client, { schema });

// Export the client for direct access if needed
export { client }; 