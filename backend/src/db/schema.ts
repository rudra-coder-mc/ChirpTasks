// src/db/schema.ts
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { Role } from '../auth/enums/role.enum';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  role: text('role', {
    enum: Object.values(Role) as unknown as readonly [string, ...string[]],
  })
    .notNull()
    .default(Role.USER),
  resetPasswordToken: text('reset_password_token'),
  resetPasswordExpires: integer('reset_password_expires', {
    mode: 'timestamp_ms',
  }),
  refreshToken: text('refresh_token'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).$onUpdate(
    () => new Date(),
  ),
});

export type User = typeof users.$inferSelect;
