import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '@/db/drizzle/schema';
import postgres from 'postgres';

// Create a PostgreSQL client with Docker-aware configuration
const isDockerized = process.env.DOCKERIZED === 'true';

const client = postgres({
  host: isDockerized ? 'omnipath-next-postgres' : (process.env.DB_HOST || 'localhost'),
  port: parseInt(process.env.DB_PORT || '5432'),
  user: isDockerized ? (process.env.POSTGRES_USER || 'postgres') : (process.env.DB_USER || 'omnipathuser'),
  password: isDockerized ? (process.env.POSTGRES_PASSWORD || 'postgres') : (process.env.DB_PASSWORD || 'omnipath123'),
  database: 'omnipath', // Always use 'omnipath' database name
});

// Create a Drizzle ORM instance
export const db = drizzle(client, { schema });

// Export the client for direct access if needed
export { client }; 