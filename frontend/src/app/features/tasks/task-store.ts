import { computed, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { TaskApiService } from '../../core/services/task-api';
import { TaskItem, TaskListQuery } from './task.models';

@Injectable({ providedIn: 'root' })
export class TaskStore {
  private readonly taskApiService = inject(TaskApiService);
  private readonly taskItems = signal<readonly TaskItem[]>([]);
  private loadRequestId = 0;

  readonly tasks = computed(() => this.taskItems());
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
