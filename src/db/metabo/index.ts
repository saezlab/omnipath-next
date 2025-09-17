import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '@/db/metabo/schema';
import postgres from 'postgres';

// Select DATABASE_URL based on NODE_ENV
const nodeEnv = process.env.NODE_ENV || 'development';
const databaseUrl = nodeEnv === 'production'
  ? process.env.DATABASE_URL_PROD
  : process.env.DATABASE_URL_METABO_DEV;

if (!databaseUrl) {
  throw new Error(`DATABASE_URL_METABO_${nodeEnv === 'production' ? 'PROD' : 'DEV'} is not set`);
}

// Create a PostgreSQL client using the database URL
const metaboClient = postgres(databaseUrl);

// Create a Drizzle ORM instance for metabo database
export const metaboDB = drizzle(metaboClient, { schema });

// Export the client for direct access if needed (for raw SQL queries)
export { metaboClient };