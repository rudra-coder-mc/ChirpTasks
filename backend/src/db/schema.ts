// src/db/schema.ts
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'; // CORRECTED import path
// import { sql } from 'drizzle-orm'; // REMOVED unused import (or uncomment if you use sql.CURRENT_TIMESTAMP)

export const users = sqliteTable(
  'users',
  {
    id: integer('id').primaryKey({ autoIncrement: true }), // Auto-incrementing primary key
    name: text('name').notNull(),
    email: text('email').notNull().unique(), // Unique constraint on email

    createdAt: integer('created_at', { mode: 'timestamp_ms' }) // Store as JS Date object (milliseconds)
      .notNull()
      // Use Drizzle's client-side default function generation
      .$defaultFn(() => new Date()),
    // Alternative using SQL directly (requires sql import):
    // .default(sql`(strftime('%s', 'now') * 1000)`), // SQLite way to get ms timestamp
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).$onUpdate(
      () => new Date(),
    ), // Automatically update on modification (Drizzle specific)
  } /* , // REMOVED unused 'table' parameter if index is commented out
(table) => ({
  // Example index if needed (email already has unique constraint)
  // emailIdx: uniqueIndex('email_idx').on(table.email), // If you uncomment this, re-add 'uniqueIndex' to import and the 'table' parameter above
}) */,
);

// Define types for easy use in services/controllers
export type User = typeof users.$inferSelect; // Type for selecting users
export type NewUser = typeof users.$inferInsert; // Type for inserting users
