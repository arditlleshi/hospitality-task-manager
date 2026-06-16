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
import {
  TASK_DEPARTMENTS,
  TASK_STATUSES,
  TaskDepartment,
  TaskItem,
  TaskStatus,
} from '../../task.models';
import { Dropdown, type DropdownOption } from '../../../../shared/components/dropdown/dropdown';
import { Icon } from '../../../../shared/components/icon/icon';

type TaskStatusFilter = TaskStatus | 'All';
type TaskDepartmentFilter = TaskDepartment | 'All';

type SummaryCard = {
  readonly label: string;
  readonly value: string;
  readonly tone: 'sand' | 'ink' | 'olive' | 'wine';
};

type PageBanner = {
  readonly message: string;
  readonly tone: 'success' | 'error';
};

@Component({
  selector: 'app-task-list-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Dropdown, Icon],
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
  protected readonly searchQuery = computed(() => this.queryParamMap().get('search')?.trim() ?? '');
  protected readonly searchDraft = signal(this.searchQuery());
  protected readonly normalizedSearchDraft = computed(() => this.searchDraft().trim());

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

  protected readonly visibleTasks = computed(() => this.tasks());

  protected readonly taskBoardHeading = computed(() => {
    const count = this.visibleTasks().length;
    return `${integerFormatter.format(count)} ${count === 1 ? 'task' : 'tasks'} in view`;
  });

  constructor() {
    this.captureNavigationState();

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
  }

  protected dismissBanner(): void {
    this.pageBanner.set(null);
    this.clearTransientNavigationState();
  }

  protected retryLoad(): void {
    this.taskStore.clearError();
    void this.taskStore.loadTasks(this.currentTaskListQuery());
  }

  protected navigateToCreate(): void {
    void this.router.navigate(['/tasks/new'], {
      queryParams: this.route.snapshot.queryParams,
    });
  }

  protected navigateToEdit(taskId: number): void {
    void this.router.navigate(['/tasks', taskId, 'edit'], {
      queryParams: this.route.snapshot.queryParams,
    });
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
      search: '',
    });
    queueMicrotask(() => searchInput.focus());
  }

  protected setStatusFilter(status: TaskStatusFilter | ''): void {
    this.syncQueryState({
      status: normalizeStatusSelection(status),
      department: this.departmentFilter(),
      search: this.normalizedSearchDraft(),
    });
  }

  protected setDepartmentFilter(department: TaskDepartmentFilter | ''): void {
    this.syncQueryState({
      status: this.statusFilter(),
      department: normalizeDepartmentSelection(department),
      search: this.normalizedSearchDraft(),
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
    readonly search: string;
  }): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      replaceUrl: true,
      queryParams: {
        status: filters.status === 'All' ? null : filters.status,
        department: filters.department === 'All' ? null : filters.department,
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

function countByStatus(tasks: readonly TaskItem[], status: TaskStatus): number {
  return tasks.filter((task) => task.status === status).length;
}

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
