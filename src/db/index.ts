import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '@/db/drizzle/schema';
import postgres from 'postgres';

// Create a PostgreSQL client
const client = postgres({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'omnipath',
  password: process.env.DB_PASSWORD || 'omnipath123',
  database: process.env.DB_NAME || 'omnipath',
});

// Create a Drizzle ORM instance
export const db = drizzle(client, { schema });

// Export the client for direct access if needed
export { client }; 