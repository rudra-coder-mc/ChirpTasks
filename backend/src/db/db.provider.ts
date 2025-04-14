// src/db/db.provider.ts
import { FactoryProvider, Logger } from '@nestjs/common';
import { drizzle, BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as Database from 'better-sqlite3';
import { ConfigService } from '@nestjs/config';
import * as schema from './schema'; // Import all schema exports
import { DB_PROVIDER_TOKEN } from './db.constants';

export const dbProvider: FactoryProvider<BetterSQLite3Database<typeof schema>> =
  {
    provide: DB_PROVIDER_TOKEN,
    inject: [ConfigService], // Inject ConfigService to access env vars
    useFactory: (configService: ConfigService) => {
      const logger = new Logger('DrizzleProvider');
      const dbPath = configService.get<string>('DATABASE_URL');

      if (!dbPath) {
        throw new Error('DATABASE_URL environment variable is not set.');
      }
      logger.log(`Connecting to SQLite database at: ${dbPath}`);

      try {
        const sqlite = new Database(dbPath /* { verbose: console.log } */); // Optional: verbose logging from better-sqlite3
        // Optional: Enable Write-Ahead Logging for better concurrency
        sqlite.pragma('journal_mode = WAL;');

        // Pass the schema to drizzle. 'logger: true' enables Drizzle's query logging
        const db = drizzle(sqlite, { schema, logger: true });

        logger.log('Drizzle ORM initialized successfully with SQLite.');
        return db;
      } catch (error) {
        logger.error('Failed to initialize Drizzle ORM with SQLite:', error);
        throw error;
      }
    },
  };
