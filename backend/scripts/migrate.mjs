import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import Database from 'better-sqlite3';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url'; // Needed for __dirname equivalent in ES modules

// Load .env file relative to the project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function runMigrations() {
  const dbPath = process.env.DATABASE_URL;
  if (!dbPath) {
    throw new Error(
      'DATABASE_URL environment variable is required for migrations.',
    );
  }

  // Resolve paths relative to the script location
  const resolvedDbPath = path.resolve(__dirname, '..', dbPath);
  const migrationsFolder = path.resolve(__dirname, '../drizzle/migrations');

  console.log(`Database path: ${resolvedDbPath}`);
  console.log(`Migrations folder: ${migrationsFolder}`);

  let sqlite;
  try {
    console.log('Connecting to database...');
    sqlite = new Database(resolvedDbPath);
    // Optional: set WAL mode during migration if needed
    sqlite.pragma('journal_mode = WAL;');

    const db = drizzle(sqlite); // No schema needed for migrator

    console.log('Running migrations...');
    // Point migrate to the 'drizzle/migrations' folder
    await migrate(db, { migrationsFolder: migrationsFolder });

    console.log('Migrations applied successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1); // Exit with error code
  } finally {
    if (sqlite) {
      sqlite.close(); // Ensure connection is closed
      console.log('Database connection closed.');
    }
    process.exit(0); // Exit successfully
  }
}

runMigrations();

/*
// --- OR ---
// scripts/migrate.js (CommonJS Syntax)
const { drizzle } = require('drizzle-orm/better-sqlite3');
const { migrate } = require('drizzle-orm/better-sqlite3/migrator');
const Database = require('better-sqlite3');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') }); // Adjust path if needed

async function runMigrations() {
  const dbPath = process.env.DATABASE_URL;
   if (!dbPath) {
    throw new Error('DATABASE_URL environment variable is required for migrations.');
  }
  const resolvedDbPath = path.resolve(__dirname, '..', dbPath);
  const migrationsFolder = path.resolve(__dirname, '../drizzle/migrations'); // Path to migrations folder

  console.log(`Database path: ${resolvedDbPath}`);
  console.log(`Migrations folder: ${migrationsFolder}`);

  let sqlite;
  try {
    console.log('Connecting to database...');
    sqlite = new Database(resolvedDbPath);
    sqlite.pragma('journal_mode = WAL;');
    const db = drizzle(sqlite);

    console.log('Running migrations...');
    await migrate(db, { migrationsFolder: migrationsFolder });

    console.log('Migrations applied successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    if (sqlite) {
      sqlite.close();
      console.log('Database connection closed.');
    }
    process.exit(0);
  }
}
runMigrations();
*/
