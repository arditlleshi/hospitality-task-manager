import { Injectable, computed, signal } from '@angular/core';

import { TaskDraft, TaskItem } from './task.models';

@Injectable({ providedIn: 'root' })
export class LocalTaskStore {
  private readonly taskItems = signal<readonly TaskItem[]>(createSeedTasks());

  readonly tasks = computed(() => this.taskItems());

  createTask(draft: TaskDraft): TaskItem {
    const timestamp = new Date().toISOString();
    const task: TaskItem = {
      id: this.nextTaskId(),
      title: draft.title.trim(),
      description: normalizeOptionalText(draft.description),
      department: draft.department,
      status: draft.status,
      priority: draft.priority,
      dueDate: normalizeOptionalDate(draft.dueDate),
      createdAt: timestamp,
    };

    this.taskItems.update((items) => [task, ...items]);
    return task;
  }

  updateTask(taskId: number, draft: TaskDraft): TaskItem | undefined {
    let updatedTask: TaskItem | undefined;

    this.taskItems.update((items) =>
      items.map((task) => {
        if (task.id !== taskId) {
          return task;
        }

        updatedTask = {
          ...task,
          title: draft.title.trim(),
          description: normalizeOptionalText(draft.description),
          department: draft.department,
          status: draft.status,
          priority: draft.priority,
          dueDate: normalizeOptionalDate(draft.dueDate),
          updatedAt: new Date().toISOString(),
        };

        return updatedTask;
      }),
    );

    return updatedTask;
  }

  deleteTask(taskId: number): boolean {
    const before = this.taskItems().length;
    this.taskItems.update((items) => items.filter((task) => task.id !== taskId));
    return this.taskItems().length < before;
  }

  private nextTaskId(): number {
    return this.taskItems().reduce((maxId, task) => Math.max(maxId, task.id), 0) + 1;
  }
}

function normalizeOptionalText(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function normalizeOptionalDate(value: string): string | undefined {
  return value ? new Date(`${value}T09:00:00`).toISOString() : undefined;
}

function createSeedTasks(): readonly TaskItem[] {
  return [
    {
      id: 101,
      title: 'Prepare room 312 for early check-in',
      description: 'Guest arrives before noon. Refresh linens, minibar, and welcome note.',
      department: 'Housekeeping',
      status: 'Open',
      priority: 'High',
      dueDate: createDateOffset(0, 11),
      createdAt: createDateOffset(-1, 8),
    },
    {
      id: 102,
      title: 'Replace terrace heater near the evening dining section',
      description: 'Unit powers on but shuts down after a few minutes. Inspect gas line first.',
      department: 'Maintenance',
      status: 'InProgress',
      priority: 'Urgent',
      dueDate: createDateOffset(0, 17),
      createdAt: createDateOffset(-2, 9),
      updatedAt: createDateOffset(0, 10),
    },
    {
      id: 103,
      title: 'Confirm vegan tasting menu for conference group',
      description: 'Need final headcount and plating notes before service briefing.',
      department: 'Kitchen',
      status: 'Done',
      priority: 'Medium',
      dueDate: createDateOffset(-1, 15),
      createdAt: createDateOffset(-3, 12),
      updatedAt: createDateOffset(-1, 16),
    },
    {
      id: 104,
      title: 'Review VIP arrival notes with front desk team',
      description: 'Coordinate transport timing, room keys, and personalized greeting.',
      department: 'Reception',
      status: 'Open',
      priority: 'Medium',
      dueDate: createDateOffset(1, 9),
      createdAt: createDateOffset(0, 7),
    },
    {
      id: 105,
      title: 'Approve revised pool staffing rota',
      description: 'Shift swap request conflicts with weekend events coverage.',
      department: 'Management',
      status: 'Cancelled',
      priority: 'Low',
      dueDate: createDateOffset(2, 14),
      createdAt: createDateOffset(-4, 10),
      updatedAt: createDateOffset(-3, 13),
    },
    {
      id: 106,
      title: 'Restock breakfast station ceramics',
      description: 'Mugs and side plates are running low ahead of the morning rush.',
      department: 'Kitchen',
      status: 'InProgress',
      priority: 'High',
      dueDate: createDateOffset(0, 6),
      createdAt: createDateOffset(-1, 5),
    },
  ];
}

function createDateOffset(dayOffset: number, hour: number): string {
  const date = new Date();
  date.setHours(hour, 0, 0, 0);
  date.setDate(date.getDate() + dayOffset);
  return date.toISOString();
}
