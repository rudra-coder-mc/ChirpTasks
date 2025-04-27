export const TaskStage = {
  TODO: 'todo',
  IN_PROGRESS: 'in_progress',
  DONE: 'done',
  BACKLOG: 'backlog',
} as const; // Use 'as const' for stricter typing

export const TaskUrgency = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;
