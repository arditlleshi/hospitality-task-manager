import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormField, form, maxLength, required, submit } from '@angular/forms/signals';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { TaskApiService } from '../../../../core/services/task-api';
import {
  TASK_DEPARTMENTS,
  TASK_PRIORITIES,
  TASK_STATUSES,
  TaskDepartment,
  TaskDraft,
  TaskPriority,
  TaskStatus,
  createEmptyTaskDraft,
  createTaskDraft,
} from '../../task.models';
import { DatePicker } from '../../../../shared/components/date-picker/date-picker';
import { Dropdown, type DropdownOption } from '../../../../shared/components/dropdown/dropdown';

type FieldStateLike = {
  readonly touched: () => boolean;
  readonly errors: () => readonly { readonly message?: string }[];
};

@Component({
  selector: 'app-task-form-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePicker, Dropdown, FormField],
  templateUrl: './task-form-page.html',
  styleUrl: './task-form-page.scss',
})
export class TaskFormPage {
  private readonly hostElement = inject(ElementRef<HTMLElement>);
  private readonly taskApiService = inject(TaskApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly paramMap = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });
  private loadRequestId = 0;

  protected readonly departmentOptions: readonly DropdownOption[] = TASK_DEPARTMENTS.map(
    (department) => ({ value: department, label: department }),
  );
  protected readonly statusOptions: readonly DropdownOption[] = TASK_STATUSES.map((status) => ({
    value: status,
    label: this.statusLabel(status),
  }));
  protected readonly priorityOptions: readonly DropdownOption[] = TASK_PRIORITIES.map(
    (priority) => ({ value: priority, label: priority }),
  );

  protected readonly submissionAttempted = signal(false);
  protected readonly isSubmitting = signal(false);
  protected readonly isLoadingTask = signal(false);
  protected readonly apiError = signal<string | null>(null);
  protected readonly announcement = signal('Task form ready.');
  protected readonly draftModel = signal<TaskDraft>(createEmptyTaskDraft());

  protected readonly taskId = computed(() => {
    const rawTaskId = this.paramMap().get('taskId');

    if (rawTaskId === null) {
      return null;
    }

    const parsedTaskId = Number(rawTaskId);
    return Number.isInteger(parsedTaskId) && parsedTaskId > 0 ? parsedTaskId : -1;
  });

  protected readonly isEditMode = computed(() => this.taskId() !== null);
  protected readonly pageTitle = computed(() =>
    this.taskId() ? 'Edit Task Details' : 'Create a New Task',
  );
  protected readonly pageSummary = computed(() =>
    this.taskId()
      ? 'Update the task details, save your changes, and return to the operational board.'
      : 'Log a new operational task with the same workflow options used by the dashboard.',
  );
  protected readonly submitLabel = computed(() =>
    this.taskId() ? 'Save Task Changes' : 'Create Task',
  );
  protected readonly validationAlert = computed(() => {
    if (!this.submissionAttempted() || !this.taskForm().invalid()) {
      return '';
    }

    const firstErrorField = [
      this.taskForm.title,
      this.taskForm.department,
      this.taskForm.status,
      this.taskForm.priority,
    ]
      .map((field) => field())
      .find((field) => field.errors().length > 0);

    return firstErrorField?.errors()[0]?.message ?? 'Please review the highlighted fields.';
  });

  protected readonly taskForm = form(this.draftModel, (task) => {
    required(task.title, { message: 'Title is required.' });
    maxLength(task.title, 150, { message: 'Title must stay under 150 characters.' });
    required(task.department, { message: 'Department is required.' });
    required(task.status, { message: 'Status is required.' });
    required(task.priority, { message: 'Priority is required.' });
    maxLength(task.description, 2000, {
      message: 'Description must stay under 2000 characters.',
    });
  });

  constructor() {
    effect(() => {
      const taskId = this.taskId();

      if (taskId === null) {
        this.prepareCreateMode();
        return;
      }

      if (taskId <= 0) {
        this.navigateBack({
          errorMessage: 'The requested task does not exist.',
        });
        return;
      }

      void this.loadTask(taskId);
    });
  }

  protected cancel(): void {
    this.navigateBack();
  }

  protected setDraftDepartment(department: TaskDepartment): void {
    this.draftModel.update((draft) => ({ ...draft, department }));
  }

  protected setDraftStatus(status: TaskStatus): void {
    this.draftModel.update((draft) => ({ ...draft, status }));
  }

  protected setDraftPriority(priority: TaskPriority): void {
    this.draftModel.update((draft) => ({ ...draft, priority }));
  }

  protected setDraftDueDate(dueDate: string): void {
    this.draftModel.update((draft) => ({ ...draft, dueDate }));
  }

  protected statusLabel(status: TaskStatus): string {
    return status === 'InProgress' ? 'In Progress' : status;
  }

  protected saveTask(): void {
    this.submissionAttempted.set(true);
    this.apiError.set(null);

    submit(this.taskForm, async () => {
      this.isSubmitting.set(true);

      try {
        const taskId = this.taskId();
        const draft = this.draftModel();

        if (taskId) {
          const task = await firstValueFrom(this.taskApiService.updateTask(taskId, draft));
          this.navigateBack({ announcement: `Saved changes to ${task.title}.` });
          return;
        }

        const task = await firstValueFrom(this.taskApiService.createTask(draft));
        this.navigateBack({ announcement: `Created ${task.title}.` });
      } catch (error) {
        this.handleSaveError(error);
      } finally {
        this.isSubmitting.set(false);
      }
    });

    if (this.taskForm().invalid()) {
      queueMicrotask(() => this.focusFirstInvalidField());
    }
  }

  protected shouldShowError(field: FieldStateLike): boolean {
    return field.errors().length > 0 && (field.touched() || this.submissionAttempted());
  }

  protected errorMessage(field: FieldStateLike): string {
    return field.errors()[0]?.message ?? '';
  }

  protected fieldShellClasses(hasError: boolean): string {
    return hasError ? 'grid gap-1.5' : 'grid gap-1.5';
  }

  protected inputClasses(hasError: boolean): string {
    return createFieldControlClasses(hasError);
  }

  protected textareaClasses(hasError: boolean): string {
    return `${createFieldControlClasses(hasError)} min-h-[7.5rem] resize-y`;
  }

  private prepareCreateMode(): void {
    this.isLoadingTask.set(false);
    this.apiError.set(null);
    this.submissionAttempted.set(false);
    this.draftModel.set(createEmptyTaskDraft());
    this.taskForm().reset();
    this.announcement.set('Ready to create a new task.');
  }

  private async loadTask(taskId: number): Promise<void> {
    const requestId = ++this.loadRequestId;

    this.isLoadingTask.set(true);
    this.apiError.set(null);

    try {
      const task = await firstValueFrom(this.taskApiService.getTaskById(taskId));

      if (requestId !== this.loadRequestId) {
        return;
      }

      this.draftModel.set(createTaskDraft(task));
      this.submissionAttempted.set(false);
      this.taskForm().reset();
      this.announcement.set(`Loaded ${task.title}.`);
    } catch (error) {
      if (requestId !== this.loadRequestId) {
        return;
      }

      if (error instanceof HttpErrorResponse && error.status === 404) {
        this.navigateBack({
          errorMessage: 'The requested task no longer exists.',
        });
        return;
      }

      this.apiError.set('Could not load the selected task.');
    } finally {
      if (requestId === this.loadRequestId) {
        this.isLoadingTask.set(false);
      }
    }
  }

  private handleSaveError(error: unknown): void {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 404) {
        this.navigateBack({
          errorMessage: 'The task could not be found when saving your changes.',
        });
        return;
      }

      if (error.status === 400) {
        this.apiError.set(extractProblemDetailsMessage(error));
        return;
      }
    }

    this.apiError.set('Could not save the task right now.');
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

  private focusFirstInvalidField(): void {
    const host = this.hostElement.nativeElement;
    const firstInvalidField = host.querySelector(
      '[data-invalid="true"] input, [data-invalid="true"] select, [data-invalid="true"] textarea, [data-invalid="true"] [data-dropdown-trigger], [data-invalid="true"] [data-date-picker-trigger]',
    ) as HTMLElement | null;

    firstInvalidField?.focus();
  }
}

function createFieldControlClasses(hasError: boolean): string {
  const base =
    'min-h-11 w-full rounded-[1.1rem] border px-3.5 py-2.5 text-[1rem] text-[var(--foreground)] transition-[border-color,background-color,transform] duration-200 placeholder:text-[var(--soft-ink)] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[var(--ring)] md:min-h-10 md:text-[0.95rem] motion-reduce:transition-none';

  return hasError
    ? `${base} border-[var(--accent-border)] focus-visible:outline-[var(--accent-border)]`
    : `${base} border-[var(--input)] bg-[var(--background)]`;
}

function extractProblemDetailsMessage(error: HttpErrorResponse): string {
  const errorBody = error.error as
    | {
        readonly title?: unknown;
        readonly errors?: Record<string, unknown>;
      }
    | undefined;

  if (errorBody?.errors) {
    for (const value of Object.values(errorBody.errors)) {
      if (Array.isArray(value)) {
        const firstMessage = value.find((entry) => typeof entry === 'string' && entry.trim());

        if (typeof firstMessage === 'string') {
          return firstMessage;
        }
      }
    }
  }

  if (typeof errorBody?.title === 'string' && errorBody.title.trim()) {
    return errorBody.title;
  }

  if (typeof error.error === 'string' && error.error.trim()) {
    return error.error;
  }

  return 'Please review the form values and try again.';
}
