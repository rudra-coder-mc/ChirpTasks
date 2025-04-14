// ./drizzle.config.js
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config({ path: '.env' });

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required.');
}

export default {
  schema: './src/db/schema.ts', // Path to your schema file
  out: './drizzle/migrations', // Directory to store migration files
  // driver: 'pglite', // Specify the driver (SQLite)
  dialect: 'sqlite',
  dbCredentials: {
    url: process.env.DATABASE_URL, // Get the URL from environment variable
  },
  verbose: true, // Optional: Enable verbose logging
  strict: true, // Optional: Enable strict mode for schema checks
};
