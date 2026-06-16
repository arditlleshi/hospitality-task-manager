import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  untracked,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';

import { TaskStore } from '../../task-store';
import { TaskEditorModal } from '../../components/task-editor-modal/task-editor-modal';
import {
  TASK_DEPARTMENTS,
  TASK_STATUSES,
  TaskDepartment,
  TaskItem,
  TaskStatus,
} from '../../task.models';
import { Dialog } from '../../../../shared/components/dialog/dialog';
import { Dropdown, type DropdownOption } from '../../../../shared/components/dropdown/dropdown';
import { Icon } from '../../../../shared/components/icon/icon';

type TaskStatusFilter = TaskStatus | 'All';
type TaskDepartmentFilter = TaskDepartment | 'All';
type TaskPresentationMode = 'Modal' | 'Page';
type TaskEditorTarget =
  | {
      readonly kind: 'create';
    }
  | {
      readonly kind: 'edit';
      readonly taskId: number;
    };

type SummaryCard = {
  readonly label: string;
  readonly value: string;
  readonly tone: 'sand' | 'ink' | 'olive' | 'wine';
};

type PresentationOption = {
  readonly value: TaskPresentationMode;
  readonly title: string;
};

type PageBanner = {
  readonly message: string;
  readonly tone: 'success' | 'error';
};

@Component({
  selector: 'app-task-list-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Dialog, Dropdown, Icon, TaskEditorModal],
  templateUrl: './task-list-page.html',
  styleUrl: './task-list-page.scss',
})
export class TaskListPage {
  private readonly taskStore = inject(TaskStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
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
  protected readonly presentationOptions: readonly PresentationOption[] = [
    {
      value: 'Modal',
      title: 'Modal',
    },
    {
      value: 'Page',
      title: 'Page',
    },
  ];

  protected readonly pendingDeletionId = signal<number | null>(null);
  protected readonly announcement = signal('Task board ready.');
  protected readonly pageBanner = signal<PageBanner | null>(null);

  protected readonly tasks = this.taskStore.tasks;
  protected readonly loading = this.taskStore.loading;
  protected readonly error = this.taskStore.error;

  protected readonly statusFilter = computed<TaskStatusFilter>(() =>
    normalizeStatusFilter(this.queryParamMap().get('status')),
  );
  protected readonly departmentFilter = computed<TaskDepartmentFilter>(() =>
    normalizeDepartmentFilter(this.queryParamMap().get('department')),
  );
  protected readonly presentationMode = computed<TaskPresentationMode>(() =>
    normalizePresentationMode(this.queryParamMap().get('mode')),
  );
  protected readonly taskEditorTarget = computed<TaskEditorTarget | null>(() =>
    normalizeTaskEditorTarget(this.queryParamMap().get('editor')),
  );
  protected readonly searchQuery = computed(() => this.queryParamMap().get('search')?.trim() ?? '');
  protected readonly searchDraft = signal(this.searchQuery());
  protected readonly normalizedSearchDraft = computed(() => this.searchDraft().trim());

  protected readonly summaryCards = computed<readonly SummaryCard[]>(() => {
    const summary = this.taskStore.summary();

    if (summary) {
      return [
        {
          label: 'Total Tasks',
          value: integerFormatter.format(summary.totalTasks),
          tone: 'sand',
        },
        {
          label: 'Open Now',
          value: integerFormatter.format(summary.openTasks),
          tone: 'ink',
        },
        {
          label: 'In Progress',
          value: integerFormatter.format(summary.inProgressTasks),
          tone: 'olive',
        },
        {
          label: 'Completed',
          value: integerFormatter.format(summary.completedTasks),
          tone: 'wine',
        },
      ];
    }

    return [
      {
        label: 'Total Tasks',
        value: '-',
        tone: 'sand',
      },
      {
        label: 'Open Now',
        value: '-',
        tone: 'ink',
      },
      {
        label: 'In Progress',
        value: '-',
        tone: 'olive',
      },
      {
        label: 'Completed',
        value: '-',
        tone: 'wine',
      },
    ];
  });

  protected readonly visibleTasks = computed(() => this.tasks());
  protected readonly pendingDeletionTask = computed(
    () => this.tasks().find((task) => task.id === this.pendingDeletionId()) ?? null,
  );

  protected readonly taskBoardHeading = computed(() => {
    const count = this.visibleTasks().length;
    return `${integerFormatter.format(count)} ${count === 1 ? 'task' : 'tasks'} in view`;
  });

  constructor() {
    this.captureNavigationState();
    void this.taskStore.loadSummary();

    effect(() => {
      const nextSearch = this.searchQuery();

      if (nextSearch !== untracked(() => this.searchDraft())) {
        this.searchDraft.set(nextSearch);
      }
    });

    effect((onCleanup) => {
      const search = this.normalizedSearchDraft();
      const currentSearch = this.searchQuery();

      if (search === currentSearch) {
        return;
      }

      const timeoutId = window.setTimeout(() => {
        this.syncQueryState({
          status: this.statusFilter(),
          department: this.departmentFilter(),
          presentationMode: this.presentationMode(),
          search,
        });
      }, 300);

      onCleanup(() => window.clearTimeout(timeoutId));
    });

    effect(() => {
      const query = createTaskListQuery({
        status: this.statusFilter(),
        department: this.departmentFilter(),
        search: this.searchQuery(),
      });

      void this.taskStore.loadTasks(query);
    });

    effect(() => {
      if (this.presentationMode() === 'Page' && this.taskEditorTarget()) {
        this.closeTaskEditor();
      }
    });
  }

  protected dismissBanner(): void {
    this.pageBanner.set(null);
    this.clearTransientNavigationState();
  }

  protected retryLoad(): void {
    this.taskStore.clearError();
    const query = this.currentTaskListQuery();
    void this.taskStore.loadTasks(query);
    void this.taskStore.loadSummary();
  }

  protected navigateToCreate(): void {
    if (this.presentationMode() === 'Modal') {
      this.openTaskEditor({ kind: 'create' });
      return;
    }

    void this.router.navigate(['/tasks/new'], {
      queryParams: this.route.snapshot.queryParams,
    });
  }

  protected navigateToEdit(taskId: number): void {
    if (this.presentationMode() === 'Modal') {
      this.openTaskEditor({ kind: 'edit', taskId });
      return;
    }

    void this.router.navigate(['/tasks', taskId, 'edit'], {
      queryParams: this.route.snapshot.queryParams,
    });
  }

  protected closeTaskEditor(): void {
    const queryParams = { ...this.route.snapshot.queryParams };
    delete queryParams['editor'];

    void this.router.navigate([], {
      relativeTo: this.route,
      replaceUrl: true,
      queryParams,
    });
  }

  protected handleTaskEditorSaved(result: { readonly title: string; readonly isEdit: boolean }): void {
    this.closeTaskEditor();
    void this.taskStore.loadTasks(this.currentTaskListQuery());
    void this.taskStore.loadSummary();
    this.pageBanner.set({
      message: result.isEdit ? `Saved changes to ${result.title}.` : `Created ${result.title}.`,
      tone: 'success',
    });
    this.announcement.set(result.isEdit ? `Saved changes to ${result.title}.` : `Created ${result.title}.`);
  }

  protected handleTaskEditorMissing(message: string): void {
    this.closeTaskEditor();
    this.pageBanner.set({
      message,
      tone: 'error',
    });
    this.announcement.set(message);
  }

  protected requestDelete(taskId: number): void {
    this.pendingDeletionId.set(taskId);
    this.announcement.set('Delete confirmation is open for the selected task.');
  }

  protected clearDeleteRequest(): void {
    this.pendingDeletionId.set(null);
    this.announcement.set('Delete confirmation cleared.');
  }

  protected async confirmDelete(task: TaskItem): Promise<void> {
    const deleted = await this.taskStore.deleteTask(task.id);

    if (!deleted) {
      this.announcement.set('Task deletion failed.');
      return;
    }

    void this.taskStore.loadSummary();
    this.pendingDeletionId.set(null);
    this.announcement.set(`Deleted ${task.title}.`);
    this.pageBanner.set({
      message: `${task.title} was deleted.`,
      tone: 'success',
    });
  }

  protected updateSearch(query: string): void {
    this.searchDraft.set(query);
  }

  protected clearSearch(searchInput: HTMLInputElement): void {
    this.searchDraft.set('');
    this.syncQueryState({
      status: this.statusFilter(),
      department: this.departmentFilter(),
      presentationMode: this.presentationMode(),
      search: '',
    });
    queueMicrotask(() => searchInput.focus());
  }

  protected setStatusFilter(status: TaskStatusFilter | ''): void {
    this.syncQueryState({
      status: normalizeStatusSelection(status),
      department: this.departmentFilter(),
      presentationMode: this.presentationMode(),
      search: this.normalizedSearchDraft(),
    });
  }

  protected setDepartmentFilter(department: TaskDepartmentFilter | ''): void {
    this.syncQueryState({
      status: this.statusFilter(),
      department: normalizeDepartmentSelection(department),
      presentationMode: this.presentationMode(),
      search: this.normalizedSearchDraft(),
    });
  }

  protected setPresentationMode(mode: TaskPresentationMode): void {
    this.syncQueryState({
      status: this.statusFilter(),
      department: this.departmentFilter(),
      presentationMode: mode,
      search: this.normalizedSearchDraft(),
    });
  }

  private openTaskEditor(target: TaskEditorTarget): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        ...this.route.snapshot.queryParams,
        editor: target.kind === 'create' ? 'create' : String(target.taskId),
      },
    });
  }

  protected statusLabel(status: TaskStatus): string {
    return status === 'InProgress' ? 'In Progress' : status;
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

  protected priorityHint(priority: TaskItem['priority']): string {
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

  protected taskCardClasses(taskId: number): string {
    const base =
      'rounded-[1.25rem] border border-[var(--line)] bg-[var(--surface)] p-3.5 [contain:layout_style_paint] [contain-intrinsic-block-size:auto_15rem] [content-visibility:auto]';

    return this.pendingDeletionId() === taskId
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

  protected priorityPillClasses(priority: TaskItem['priority']): string {
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

  protected bannerClasses(tone: PageBanner['tone']): string {
    return tone === 'success'
      ? 'task-banner task-banner--success'
      : 'task-banner task-banner--error';
  }

  private captureNavigationState(): void {
    const state = (this.router.getCurrentNavigation()?.extras.state ??
      window.history.state) as Record<string, unknown> | null;

    if (!state) {
      return;
    }

    if (typeof state['announcement'] === 'string' && state['announcement'].trim()) {
      this.pageBanner.set({
        message: state['announcement'],
        tone: 'success',
      });
      this.announcement.set(state['announcement']);
      this.clearTransientNavigationState();
      return;
    }

    if (typeof state['errorMessage'] === 'string' && state['errorMessage'].trim()) {
      this.pageBanner.set({
        message: state['errorMessage'],
        tone: 'error',
      });
      this.announcement.set(state['errorMessage']);
      this.clearTransientNavigationState();
    }
  }

  private clearTransientNavigationState(): void {
    const currentState = window.history.state as Record<string, unknown> | null;

    if (!currentState) {
      return;
    }

    if (!('announcement' in currentState) && !('errorMessage' in currentState)) {
      return;
    }

    const nextState = { ...currentState };
    delete nextState['announcement'];
    delete nextState['errorMessage'];

    window.history.replaceState(nextState, document.title, window.location.href);
  }

  private syncQueryState(filters: {
    readonly status: TaskStatusFilter;
    readonly department: TaskDepartmentFilter;
    readonly presentationMode: TaskPresentationMode;
    readonly search: string;
  }): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      replaceUrl: true,
      queryParams: {
        status: filters.status === 'All' ? null : filters.status,
        department: filters.department === 'All' ? null : filters.department,
        mode: filters.presentationMode === 'Page' ? 'page' : null,
        search: filters.search.trim() ? filters.search.trim() : null,
      },
    });
  }

  private currentTaskListQuery(): {
    readonly status?: TaskStatus;
    readonly department?: TaskDepartment;
    readonly search?: string;
  } {
    return createTaskListQuery({
      status: this.statusFilter(),
      department: this.departmentFilter(),
      search: this.normalizedSearchDraft(),
    });
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

function normalizeStatusFilter(value: string | null): TaskStatusFilter {
  return TASK_STATUSES.includes(value as TaskStatus) ? (value as TaskStatus) : 'All';
}

function normalizeDepartmentFilter(value: string | null): TaskDepartmentFilter {
  return TASK_DEPARTMENTS.includes(value as TaskDepartment) ? (value as TaskDepartment) : 'All';
}

function normalizeStatusSelection(value: TaskStatusFilter | ''): TaskStatusFilter {
  return value === '' ? 'All' : value;
}

function normalizeDepartmentSelection(value: TaskDepartmentFilter | ''): TaskDepartmentFilter {
  return value === '' ? 'All' : value;
}

function normalizePresentationMode(value: string | null): TaskPresentationMode {
  return value === 'page' ? 'Page' : 'Modal';
}

function normalizeTaskEditorTarget(value: string | null): TaskEditorTarget | null {
  if (!value) {
    return null;
  }

  if (value === 'create') {
    return { kind: 'create' };
  }

  const taskId = Number(value);
  return Number.isInteger(taskId) && taskId > 0 ? { kind: 'edit', taskId } : null;
}

function createTaskListQuery(filters: {
  readonly status: TaskStatusFilter;
  readonly department: TaskDepartmentFilter;
  readonly search: string;
}): {
  readonly status?: TaskStatus;
  readonly department?: TaskDepartment;
  readonly search?: string;
} {
  return {
    status: filters.status === 'All' ? undefined : filters.status,
    department: filters.department === 'All' ? undefined : filters.department,
    search: filters.search.trim() || undefined,
  };
}
