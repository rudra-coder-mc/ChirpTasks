// src/db/index.ts
export * from './schema';
export * from './db.constants';
export * from './db.module';
// Export the type alias for convenience if needed frequently
import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
export type DrizzleDatabase = BetterSQLite3Database<typeof schema>;
