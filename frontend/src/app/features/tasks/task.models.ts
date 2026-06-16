export const TASK_DEPARTMENTS = [
  'Reception',
  'Housekeeping',
  'Kitchen',
  'Maintenance',
  'Management',
] as const;

export const TASK_STATUSES = ['Open', 'InProgress', 'Done', 'Cancelled'] as const;

export const TASK_PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'] as const;

export type TaskDepartment = (typeof TASK_DEPARTMENTS)[number];
export type TaskStatus = (typeof TASK_STATUSES)[number];
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export type TaskItem = {
  readonly id: number;
  readonly title: string;
  readonly description?: string;
  readonly department: TaskDepartment;
  readonly status: TaskStatus;
  readonly priority: TaskPriority;
  readonly dueDate?: string;
  readonly createdAt: string;
  readonly updatedAt?: string;
};

export type TaskListQuery = {
  readonly status?: TaskStatus;
  readonly department?: TaskDepartment;
  readonly search?: string;
};

export type TaskSummary = {
  readonly totalTasks: number;
  readonly openTasks: number;
  readonly inProgressTasks: number;
  readonly completedTasks: number;
};

export type TaskDraft = {
  readonly title: string;
  readonly description: string;
  readonly department: TaskDepartment;
  readonly status: TaskStatus;
  readonly priority: TaskPriority;
  readonly dueDate: string;
};

export function createEmptyTaskDraft(): TaskDraft {
  return {
    title: '',
    description: '',
    department: 'Reception',
    status: 'Open',
    priority: 'Medium',
    dueDate: '',
  };
}

export function createTaskDraft(task: TaskItem): TaskDraft {
  return {
    title: task.title,
    description: task.description ?? '',
    department: task.department,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '',
  };
}

export type TaskSaveRequest = {
  readonly title: string;
  readonly description?: string;
  readonly department: TaskDepartment;
  readonly status: TaskStatus;
  readonly priority: TaskPriority;
  readonly dueDate?: string;
};

export function createTaskSaveRequest(draft: TaskDraft): TaskSaveRequest {
  return {
    title: draft.title.trim(),
    description: normalizeOptionalText(draft.description),
    department: draft.department,
    status: draft.status,
    priority: draft.priority,
    dueDate: normalizeOptionalDate(draft.dueDate),
  };
}

function normalizeOptionalText(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function normalizeOptionalDate(value: string): string | undefined {
  return value ? new Date(`${value}T09:00:00`).toISOString() : undefined;
}
