import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormField, form, maxLength, required, submit } from '@angular/forms/signals';
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
  selector: 'app-task-editor-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePicker, Dropdown, FormField],
  templateUrl: './task-editor-form.html',
  styleUrl: './task-editor-form.scss',
})
export class TaskEditorForm {
  private readonly hostElement = inject(ElementRef<HTMLElement>);
  private readonly taskApiService = inject(TaskApiService);
  private loadRequestId = 0;

  readonly taskId = input<number | null>(null);

  readonly cancelled = output<void>();
  readonly saved = output<{ readonly title: string; readonly isEdit: boolean }>();
  readonly taskMissing = output<string>();

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
        this.reportMissingTask('The requested task does not exist.');
        return;
      }

      void this.loadTask(taskId);
    });
  }

  protected cancel(): void {
    this.cancelled.emit();
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
          this.saved.emit({
            title: task.title,
            isEdit: true,
          });
          return;
        }

        const task = await firstValueFrom(this.taskApiService.createTask(draft));
        this.saved.emit({
          title: task.title,
          isEdit: false,
        });
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
        this.reportMissingTask('The requested task no longer exists.');
        return;
      }

      this.apiError.set('Could not load the selected task.');
    } finally {
      if (requestId === this.loadRequestId) {
        this.isLoadingTask.set(false);
      }
    }
  }

  private reportMissingTask(message: string): void {
    this.apiError.set(message);
    this.taskMissing.emit(message);
  }

  private handleSaveError(error: unknown): void {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 404) {
        this.reportMissingTask('The task could not be found when saving your changes.');
        return;
      }

      if (error.status === 400) {
        this.apiError.set(extractProblemDetailsMessage(error));
        return;
      }
    }

    this.apiError.set('Could not save the task right now.');
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
