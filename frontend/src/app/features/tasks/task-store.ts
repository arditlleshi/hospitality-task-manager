import { computed, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { TaskApiService } from '../../core/services/task-api';
import { TaskItem, TaskListQuery, TaskSummary } from './task.models';

@Injectable({ providedIn: 'root' })
export class TaskStore {
  private readonly taskApiService = inject(TaskApiService);
  private readonly taskItems = signal<readonly TaskItem[]>([]);
  private readonly taskSummary = signal<TaskSummary | null>(null);
  private loadRequestId = 0;
  private loadSummaryRequestId = 0;

  readonly tasks = computed(() => this.taskItems());
  readonly summary = computed(() => this.taskSummary());
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  async loadTasks(query?: TaskListQuery): Promise<void> {
    const requestId = ++this.loadRequestId;

    this.loading.set(true);
    this.error.set(null);

    try {
      const tasks = await firstValueFrom(this.taskApiService.getTasks(query));

      if (requestId !== this.loadRequestId) {
        return;
      }

      this.taskItems.set(tasks);
    } catch {
      if (requestId !== this.loadRequestId) {
        return;
      }

      this.taskItems.set([]);
      this.error.set('Could not load tasks right now.');
    } finally {
      if (requestId === this.loadRequestId) {
        this.loading.set(false);
      }
    }
  }

  async loadSummary(query?: TaskListQuery): Promise<void> {
    const requestId = ++this.loadSummaryRequestId;

    try {
      const summary = await firstValueFrom(this.taskApiService.getTaskSummary(query));

      if (requestId !== this.loadSummaryRequestId) {
        return;
      }

      this.taskSummary.set(summary);
    } catch {
      if (requestId !== this.loadSummaryRequestId) {
        return;
      }

      this.taskSummary.set(null);
    }
  }

  async deleteTask(taskId: number): Promise<boolean> {
    try {
      await firstValueFrom(this.taskApiService.deleteTask(taskId));
      this.taskItems.update((items) => items.filter((task) => task.id !== taskId));
      this.error.set(null);
      return true;
    } catch {
      this.error.set('Could not delete the selected task.');
      return false;
    }
  }

  clearError(): void {
    this.error.set(null);
  }
}
