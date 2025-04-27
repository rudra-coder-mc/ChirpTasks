import {
  sqliteTable,
  text,
  integer,
  primaryKey,
} from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';
import { Role } from '../auth/enums/role.enum';
import { TaskStage, TaskUrgency } from 'src/types/task';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  role: text('role', {
    enum: Object.values(Role) as [string, ...string[]],
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

export const taskTable = sqliteTable('task_table', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  description: text('description'),
  ownerId: integer('owner_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).$onUpdate(
    () => new Date(),
  ),
});

export const task = sqliteTable('task', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  description: text('description'),
  creatorId: integer('creator_id')
    .notNull()
    .references(() => users.id, { onDelete: 'set null' }),
  assigneeId: integer('assignee_id').references(() => users.id, {
    onDelete: 'set null',
  }),
  stage: text('stage', {
    enum: Object.values(TaskStage) as [string, ...string[]],
  })
    .notNull()
    .default(TaskStage.TODO),
  urgency: text('urgency', {
    enum: Object.values(TaskUrgency) as [string, ...string[]],
  })
    .notNull()
    .default(TaskUrgency.LOW),
  startingDate: integer('starting_date', { mode: 'timestamp_ms' }),
  completionDate: integer('completion_date', { mode: 'timestamp_ms' }),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).$onUpdate(
    () => new Date(),
  ),
});

// Junction Table: taskTableTasks (Many-to-Many relationship)
export const taskTableTasks = sqliteTable(
  'task_table_tasks',
  {
    taskTableId: integer('task_table_id')
      .notNull()
      .references(() => taskTable.id, { onDelete: 'cascade' }), // If table deleted, remove link
    taskId: integer('task_id')
      .notNull()
      .references(() => task.id, { onDelete: 'cascade' }), // If task deleted, remove link
  },
  (t) => ({
    // Composite primary key ensures a task is only linked once per table
    pk: primaryKey({ columns: [t.taskTableId, t.taskId] }),
  }),
);

// --- Define Relationships ---

export const usersRelations = relations(users, ({ many }) => ({
  ownedTaskTables: many(taskTable), // Tables owned by the user
  createdTasks: many(task, { relationName: 'creator' }), // Tasks created by the user
  assignedTasks: many(task, { relationName: 'assignee' }), // Tasks assigned to the user
}));

export const taskTableRelations = relations(taskTable, ({ one, many }) => ({
  owner: one(users, {
    fields: [taskTable.ownerId],
    references: [users.id],
  }),
  // Link to the junction table to eventually get the tasks
  taskTableTasks: many(taskTableTasks),
}));

export const taskRelations = relations(task, ({ one, many }) => ({
  creator: one(users, {
    fields: [task.creatorId],
    references: [users.id],
    relationName: 'creator',
  }),
  assignee: one(users, {
    fields: [task.assigneeId],
    references: [users.id],
    relationName: 'assignee',
  }),
  taskTableTasks: many(taskTableTasks),
}));

export const taskTableTasksRelations = relations(taskTableTasks, ({ one }) => ({
  taskTable: one(taskTable, {
    fields: [taskTableTasks.taskTableId],
    references: [taskTable.id],
  }),
  task: one(task, {
    fields: [taskTableTasks.taskId],
    references: [task.id],
  }),
}));

// --- Export Types ---
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Task = typeof task.$inferSelect;
export type NewTask = typeof task.$inferInsert;

export type TaskTable = typeof taskTable.$inferSelect;
export type NewTaskTable = typeof taskTable.$inferInsert;

// Type for the junction table entry if needed
export type TaskTableTask = typeof taskTableTasks.$inferSelect;
export type NewTaskTableTask = typeof taskTableTasks.$inferInsert;
