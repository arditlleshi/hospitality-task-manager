import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormField, form, maxLength, required, submit } from '@angular/forms/signals';
import { ActivatedRoute, Router } from '@angular/router';

import { LocalTaskStore } from '../../features/tasks/local-task-store';
import {
  TASK_DEPARTMENTS,
  TASK_PRIORITIES,
  TASK_STATUSES,
  TaskDepartment,
  TaskDraft,
  TaskItem,
  TaskPriority,
  TaskStatus,
  createEmptyTaskDraft,
  createTaskDraft,
} from '../../features/tasks/task.models';
import { Icon } from '../../shared/components/icon/icon';
import { Dropdown, type DropdownOption } from '../../shared/components/dropdown/dropdown';

type TaskStatusFilter = TaskStatus | 'All';
type TaskDepartmentFilter = TaskDepartment | 'All';
type EditorMode = 'create' | 'edit' | null;

type SummaryCard = {
  readonly label: string;
  readonly value: string;
  readonly tone: 'sand' | 'ink' | 'olive' | 'wine';
};

type FieldStateLike = {
  readonly touched: () => boolean;
  readonly errors: () => readonly { readonly message?: string }[];
};

@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Dropdown, FormField, Icon],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  private readonly hostElement = inject(ElementRef<HTMLElement>);
  private readonly taskStore = inject(LocalTaskStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly taskDialog = viewChild.required<ElementRef<HTMLDialogElement>>('taskDialog');
  private readonly queryParamMap = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });

  protected readonly statusFilterOptions: readonly DropdownOption[] = [
    { value: 'All', label: 'All statuses' },
    ...TASK_STATUSES.map((status) => ({ value: status, label: this.statusLabel(status) })),
  ];
  protected readonly departmentFilterOptions: readonly DropdownOption[] = [
    { value: 'All', label: 'All departments' },
    ...TASK_DEPARTMENTS.map((department) => ({ value: department, label: department })),
  ];
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
  protected readonly priorities = TASK_PRIORITIES;
  protected readonly statuses = TASK_STATUSES;
  protected readonly departments = TASK_DEPARTMENTS;

  protected readonly statusFilter = signal<TaskStatusFilter>('All');
  protected readonly departmentFilter = signal<TaskDepartmentFilter>('All');
  protected readonly searchQuery = signal('');
  protected readonly editorMode = signal<EditorMode>('create');
  protected readonly activeTaskId = signal<number | null>(null);
  protected readonly pendingDeletionId = signal<number | null>(null);
  protected readonly announcement = signal('Sample task board ready.');
  protected readonly submissionAttempted = signal(false);
  protected readonly isTaskDialogOpen = signal(false);

  protected readonly draftModel = signal<TaskDraft>(createEmptyTaskDraft());

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

  protected readonly tasks = this.taskStore.tasks;

  protected readonly activeTask = computed(
    () => this.tasks().find((task) => task.id === this.activeTaskId()) ?? null,
  );

  protected readonly summaryCards = computed<readonly SummaryCard[]>(() => {
    const tasks = this.tasks();
    return [
      {
        label: 'Total Tasks',
        value: integerFormatter.format(tasks.length),
        tone: 'sand',
      },
      {
        label: 'Open Now',
        value: integerFormatter.format(countByStatus(tasks, 'Open')),
        tone: 'ink',
      },
      {
        label: 'In Progress',
        value: integerFormatter.format(countByStatus(tasks, 'InProgress')),
        tone: 'olive',
      },
      {
        label: 'Completed',
        value: integerFormatter.format(countByStatus(tasks, 'Done')),
        tone: 'wine',
      },
    ];
  });

  protected readonly visibleTasks = computed(() => {
    const query = this.searchQuery().trim().toLocaleLowerCase();

    return [...this.tasks()]
      .filter((task) =>
        this.statusFilter() === 'All' ? true : task.status === this.statusFilter(),
      )
      .filter((task) =>
        this.departmentFilter() === 'All' ? true : task.department === this.departmentFilter(),
      )
      .filter((task) => {
        if (!query) {
          return true;
        }

        return [task.title, task.description ?? '', task.department]
          .join(' ')
          .toLocaleLowerCase()
          .includes(query);
      })
      .sort(compareTasksForBoard);
  });

  protected readonly taskBoardHeading = computed(() => {
    const count = this.visibleTasks().length;
    return `${integerFormatter.format(count)} ${count === 1 ? 'task' : 'tasks'} in view`;
  });

  protected readonly panelTitle = computed(() =>
    this.editorMode() === 'edit' ? 'Edit Task Details' : 'Create a New Task',
  );

  protected readonly panelSummary = computed(() => {
    const activeTask = this.activeTask();
    if (activeTask) {
      return `Editing ${activeTask.title}. Save when you are done, or close the dialog to return to the board.`;
    }

    return 'Log a new operational task in a focused modal without leaving the board.';
  });

  protected readonly formAlert = computed(() => {
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

  constructor() {
    effect(() => {
      const queryParams = this.queryParamMap();
      this.statusFilter.set(normalizeStatusFilter(queryParams.get('status')));
      this.departmentFilter.set(normalizeDepartmentFilter(queryParams.get('department')));
      this.searchQuery.set(queryParams.get('search')?.trim() ?? '');
    });
  }

  protected beginCreate(): void {
    this.editorMode.set('create');
    this.activeTaskId.set(null);
    this.pendingDeletionId.set(null);
    this.draftModel.set(createEmptyTaskDraft());
    this.submissionAttempted.set(false);
    this.taskForm().reset();
    this.announcement.set('Ready to add a new task.');
    this.openTaskDialog();
  }

  protected beginEdit(task: TaskItem): void {
    this.editorMode.set('edit');
    this.activeTaskId.set(task.id);
    this.pendingDeletionId.set(null);
    this.draftModel.set(createTaskDraft(task));
    this.submissionAttempted.set(false);
    this.taskForm().reset();
    this.announcement.set(`Editing ${task.title}.`);
    this.openTaskDialog();
  }

  protected closeTaskDialog(): void {
    const dialog = this.taskDialog().nativeElement;
    if (dialog.open) {
      dialog.close();
    }

    this.isTaskDialogOpen.set(false);
    this.editorMode.set(null);
    this.activeTaskId.set(null);
    this.submissionAttempted.set(false);
    this.draftModel.set(createEmptyTaskDraft());
    this.taskForm().reset();
    this.announcement.set('Task dialog closed.');
  }

  protected saveTask(): void {
    this.submissionAttempted.set(true);

    submit(this.taskForm, async () => {
      const draft = this.draftModel();

      if (this.editorMode() === 'edit' && this.activeTaskId() !== null) {
        const updated = this.taskStore.updateTask(this.activeTaskId()!, draft);
        if (updated) {
          this.closeDialogAfterSave();
          this.submissionAttempted.set(false);
          this.announcement.set(`Saved changes to ${updated.title}.`);
        }
      } else {
        const created = this.taskStore.createTask(draft);
        this.closeDialogAfterSave();
        this.submissionAttempted.set(false);
        this.announcement.set(`Added ${created.title}.`);
      }
    });

    if (this.taskForm().invalid()) {
      queueMicrotask(() => this.focusFirstInvalidField());
    }
  }

  protected requestDelete(taskId: number): void {
    this.pendingDeletionId.set(taskId);
    this.announcement.set('Delete confirmation is open for the selected task.');
  }

  protected clearDeleteRequest(): void {
    this.pendingDeletionId.set(null);
    this.announcement.set('Delete confirmation cleared.');
  }

  protected confirmDelete(task: TaskItem): void {
    if (!this.taskStore.deleteTask(task.id)) {
      return;
    }

    if (this.activeTaskId() === task.id) {
      this.activeTaskId.set(null);
      this.editorMode.set('create');
      this.draftModel.set(createEmptyTaskDraft());
      this.taskForm().reset();
    }

    this.pendingDeletionId.set(null);
    this.announcement.set(`Deleted ${task.title}.`);
  }

  protected updateSearch(query: string): void {
    this.searchQuery.set(query);
    this.syncQueryState();
  }

  protected setStatusFilter(status: TaskStatusFilter): void {
    this.statusFilter.set(status);
    this.syncQueryState();
  }

  protected setDepartmentFilter(department: TaskDepartmentFilter): void {
    this.departmentFilter.set(department);
    this.syncQueryState();
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

  protected isEditingTask(taskId: number): boolean {
    return this.editorMode() === 'edit' && this.activeTaskId() === taskId;
  }

  protected statusLabel(status: TaskStatus): string {
    return status === 'InProgress' ? 'In Progress' : status;
  }

  protected preventDialogCancel(event: Event): void {
    event.preventDefault();
  }

  protected formatDate(date?: string): string {
    if (!date) {
      return 'No date set';
    }

    return dateFormatter.format(new Date(date));
  }

  protected formatShortDate(date?: string): string {
    if (!date) {
      return 'Flexible';
    }

    return shortDateFormatter.format(new Date(date));
  }

  protected priorityHint(priority: TaskPriority): string {
    switch (priority) {
      case 'Urgent':
        return 'Needs immediate follow-up';
      case 'High':
        return 'Should move this shift';
      case 'Medium':
        return 'Normal operating priority';
      case 'Low':
        return 'Can be scheduled later';
    }
  }

  protected shouldShowError(field: FieldStateLike): boolean {
    return field.errors().length > 0 && (field.touched() || this.submissionAttempted());
  }

  protected errorMessage(field: FieldStateLike): string {
    return field.errors()[0]?.message ?? '';
  }

  protected taskCardClasses(taskId: number): string {
    const base =
      'rounded-[1.25rem] border border-[var(--line)] bg-[var(--surface)] p-3.5 [contain:layout_style_paint] [contain-intrinsic-block-size:auto_15rem] [content-visibility:auto]';

    return this.isEditingTask(taskId)
      ? `${base} border-[var(--accent-border)] shadow-[0_0_0_1px_var(--accent-soft-border),inset_0_0_0_1px_var(--accent-soft-border)]`
      : base;
  }

  protected statusPillClasses(status: TaskStatus): string {
    const base =
      'inline-flex min-h-7 items-center justify-center rounded-full px-2.5 text-[0.68rem] font-semibold uppercase tracking-[0.14em]';

    switch (status) {
      case 'Open':
        return `${base} bg-[var(--muted)] text-[var(--muted-foreground)]`;
      case 'InProgress':
        return `${base} bg-[var(--accent-soft)] text-[var(--accent-text-strong)]`;
      case 'Done':
        return `${base} bg-[var(--status-done-soft)] text-[var(--status-done-text)]`;
      case 'Cancelled':
        return `${base} bg-[var(--destructive-soft)] text-[var(--destructive-text-strong)]`;
    }
  }

  protected priorityPillClasses(priority: TaskPriority): string {
    const base =
      'inline-flex min-h-7 items-center justify-center rounded-full px-2.5 text-[0.68rem] font-semibold uppercase tracking-[0.14em]';

    switch (priority) {
      case 'Urgent':
        return `${base} bg-[var(--destructive)] text-[var(--destructive-foreground)]`;
      case 'High':
        return `${base} bg-[var(--primary)] text-[var(--primary-foreground)]`;
      case 'Medium':
        return `${base} bg-[var(--accent-soft)] text-[var(--accent-text-strong)]`;
      case 'Low':
        return `${base} bg-[var(--secondary)] text-[var(--secondary-foreground)]`;
    }
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

  private focusFirstInvalidField(): void {
    const host = this.hostElement.nativeElement as HTMLElement;
    const firstInvalidField = host.querySelector(
      '[data-invalid="true"] input, [data-invalid="true"] select, [data-invalid="true"] textarea, [data-invalid="true"] [data-dropdown-trigger]',
    ) as HTMLElement | null;

    firstInvalidField?.focus();
  }

  private syncQueryState(): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      replaceUrl: true,
      queryParams: {
        status: this.statusFilter() === 'All' ? null : this.statusFilter(),
        department: this.departmentFilter() === 'All' ? null : this.departmentFilter(),
        search: this.searchQuery().trim() ? this.searchQuery().trim() : null,
      },
    });
  }

  private openTaskDialog(): void {
    const dialog = this.taskDialog().nativeElement;
    if (!dialog.open) {
      dialog.showModal();
    }

    this.isTaskDialogOpen.set(true);
  }

  private closeDialogAfterSave(): void {
    const dialog = this.taskDialog().nativeElement;
    if (dialog.open) {
      dialog.close();
    }

    this.isTaskDialogOpen.set(false);
    this.editorMode.set(null);
    this.activeTaskId.set(null);
    this.draftModel.set(createEmptyTaskDraft());
    this.taskForm().reset();
  }
}

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

const shortDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
});

const integerFormatter = new Intl.NumberFormat('en-US');

function countByStatus(tasks: readonly TaskItem[], status: TaskStatus): number {
  return tasks.filter((task) => task.status === status).length;
}

function compareTasksForBoard(left: TaskItem, right: TaskItem): number {
  const leftDue = left.dueDate ? new Date(left.dueDate).getTime() : Number.POSITIVE_INFINITY;
  const rightDue = right.dueDate ? new Date(right.dueDate).getTime() : Number.POSITIVE_INFINITY;

  if (leftDue !== rightDue) {
    return leftDue - rightDue;
  }

  return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
}

function normalizeStatusFilter(value: string | null): TaskStatusFilter {
  return TASK_STATUSES.includes(value as TaskStatus) ? (value as TaskStatus) : 'All';
}

function normalizeDepartmentFilter(value: string | null): TaskDepartmentFilter {
  return TASK_DEPARTMENTS.includes(value as TaskDepartment) ? (value as TaskDepartment) : 'All';
}

function createFieldControlClasses(hasError: boolean): string {
  const base =
    'min-h-11 w-full rounded-[1.1rem] border px-3.5 py-2.5 text-[1rem] text-[var(--foreground)] transition-[border-color,background-color,transform] duration-200 placeholder:text-[var(--soft-ink)] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[var(--ring)] md:min-h-10 md:text-[0.95rem] motion-reduce:transition-none';

  return hasError
    ? `${base} border-[var(--accent-border)] focus-visible:outline-[var(--accent-border)]`
    : `${base} border-[var(--input)] bg-[var(--background)]`;
}
