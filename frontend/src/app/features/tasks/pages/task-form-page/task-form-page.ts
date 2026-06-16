import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';

import { TaskEditorForm } from '../../components/task-editor-form/task-editor-form';

@Component({
  selector: 'app-task-form-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TaskEditorForm],
  templateUrl: './task-form-page.html',
  styleUrl: './task-form-page.scss',
})
export class TaskFormPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly paramMap = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });

  protected readonly taskId = computed(() => {
    const rawTaskId = this.paramMap().get('taskId');

    if (rawTaskId === null) {
      return null;
    }

    const parsedTaskId = Number(rawTaskId);
    return Number.isInteger(parsedTaskId) && parsedTaskId > 0 ? parsedTaskId : -1;
  });

  protected readonly pageTitle = computed(() =>
    this.taskId() ? 'Edit Task Details' : 'Create a New Task',
  );
  protected readonly pageSummary = computed(() =>
    this.taskId()
      ? 'Update the task details, save your changes, and return to the operational board.'
      : 'Log a new operational task with the same workflow options used by the dashboard.',
  );

  protected cancel(): void {
    this.navigateBack();
  }

  protected handleSaved(result: { readonly title: string; readonly isEdit: boolean }): void {
    this.navigateBack({
      announcement: result.isEdit ? `Saved changes to ${result.title}.` : `Created ${result.title}.`,
    });
  }

  protected handleTaskMissing(message: string): void {
    this.navigateBack({ errorMessage: message });
  }

  private navigateBack(state?: {
    readonly announcement?: string;
    readonly errorMessage?: string;
  }): void {
    void this.router.navigate(['/tasks'], {
      queryParams: this.route.snapshot.queryParams,
      state,
    });
  }
}
