import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';

type CalendarDay = {
  readonly dateKey: string;
  readonly dayNumber: number;
  readonly label: string;
  readonly inMonth: boolean;
  readonly isToday: boolean;
  readonly isSelected: boolean;
};

@Component({
  selector: 'app-date-picker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './date-picker.html',
  styleUrl: './date-picker.scss',
})
export class DatePicker {
  private readonly hostElement = inject(ElementRef<HTMLElement>);

  readonly label = input.required<string>();
  readonly name = input.required<string>();
  readonly value = input<string>('');
  readonly id = input('');
  readonly hint = input<string | null>(null);
  readonly placeholder = input<string | null>(null);
  readonly disabled = input(false);
  readonly invalid = input(false);

  readonly valueChange = output<string>();

  protected readonly isOpen = signal(false);
  protected readonly menuTop = signal(0);
  protected readonly menuLeft = signal(0);
  protected readonly menuWidth = signal(0);
  protected readonly menuMaxHeight = signal(0);
  protected readonly activeDateKey = signal('');
  protected readonly viewMonth = signal(startOfMonth(new Date()));

  protected readonly triggerButton = viewChild.required<ElementRef<HTMLButtonElement>>('trigger');

  protected readonly pickerId = computed(() => this.id() || `${this.name()}-date-picker`);
  protected readonly labelId = computed(() => `${this.pickerId()}-label`);
  protected readonly menuId = computed(() => `${this.pickerId()}-menu`);
  protected readonly hintId = computed(() => `${this.pickerId()}-hint`);
  protected readonly selectedDate = computed(() => parseDateString(this.value()));
  protected readonly displayValue = computed(() =>
    this.selectedDate()
      ? formatLongDate(this.selectedDate()!)
      : (this.placeholder() ?? 'Select a date'),
  );
  protected readonly monthLabel = computed(() => monthYearFormatter.format(this.viewMonth()));
  protected readonly weeks = computed(() => buildCalendar(this.viewMonth(), this.value()));
  protected readonly activeDay = computed(
    () =>
      this.weeks()
        .flat()
        .find((day) => day.dateKey === this.activeDateKey()) ?? null,
  );
  protected readonly hasSelection = computed(() => Boolean(this.selectedDate()));

  constructor() {
    effect(() => {
      if (!this.isOpen()) {
        return;
      }

      this.updateMenuPosition();
      queueMicrotask(() => this.focusActiveDay());
    });

    effect((onCleanup) => {
      if (!this.isOpen()) {
        return;
      }

      const reposition = () => this.updateMenuPosition();
      window.addEventListener('resize', reposition);
      document.addEventListener('scroll', reposition, true);
      onCleanup(() => {
        window.removeEventListener('resize', reposition);
        document.removeEventListener('scroll', reposition, true);
      });
    });

    effect(() => {
      const selected = this.selectedDate();
      if (!selected) {
        return;
      }

      this.viewMonth.set(startOfMonth(selected));
      if (!this.activeDateKey()) {
        this.activeDateKey.set(formatDateKey(selected));
      }
    });
  }

  protected toggle(): void {
    if (this.disabled()) {
      return;
    }

    this.isOpen() ? this.close(true) : this.open();
  }

  protected open(): void {
    if (this.disabled()) {
      return;
    }

    const selected = this.selectedDate() ?? new Date();
    this.viewMonth.set(startOfMonth(selected));
    this.activeDateKey.set(formatDateKey(selected));
    this.updateMenuPosition();
    this.isOpen.set(true);
  }

  protected close(restoreFocus = false): void {
    this.isOpen.set(false);

    if (restoreFocus) {
      queueMicrotask(() => this.triggerButton().nativeElement.focus());
    }
  }

  protected chooseDay(day: CalendarDay): void {
    if (!day.inMonth) {
      this.viewMonth.set(startOfMonth(parseDateKey(day.dateKey)));
    }

    this.valueChange.emit(day.dateKey);
    this.close(true);
  }

  protected previousMonth(): void {
    this.viewMonth.set(addMonths(this.viewMonth(), -1));
    this.syncActiveDateToView();
  }

  protected nextMonth(): void {
    this.viewMonth.set(addMonths(this.viewMonth(), 1));
    this.syncActiveDateToView();
  }

  protected onTriggerKeydown(event: KeyboardEvent): void {
    if (this.disabled()) {
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp':
      case 'Enter':
      case ' ':
        event.preventDefault();
        this.open();
        break;
      case 'Escape':
        if (this.isOpen()) {
          event.preventDefault();
          this.close(true);
        }
        break;
    }
  }

  protected onMenuKeydown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        this.moveActiveByDays(-1);
        break;
      case 'ArrowRight':
        event.preventDefault();
        this.moveActiveByDays(1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.moveActiveByDays(-7);
        break;
      case 'ArrowDown':
        event.preventDefault();
        this.moveActiveByDays(7);
        break;
      case 'Home':
        event.preventDefault();
        this.moveActiveToWeekStart();
        break;
      case 'End':
        event.preventDefault();
        this.moveActiveToWeekEnd();
        break;
      case 'PageUp':
        event.preventDefault();
        this.moveActiveByMonths(-1);
        break;
      case 'PageDown':
        event.preventDefault();
        this.moveActiveByMonths(1);
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        this.commitActiveDay();
        break;
      case 'Escape':
        event.preventDefault();
        this.close(true);
        break;
      case 'Tab':
        this.close(false);
        break;
    }
  }

  protected dayId(dateKey: string): string {
    return `${this.pickerId()}-${dateKey}`;
  }

  protected isActiveDay(dateKey: string): boolean {
    return this.activeDateKey() === dateKey;
  }

  @HostListener('document:pointerdown', ['$event'])
  protected onDocumentPointerDown(event: PointerEvent): void {
    if (!this.isOpen()) {
      return;
    }

    const target = event.target;
    if (target instanceof Node && this.hostContains(target)) {
      return;
    }

    this.close(false);
  }

  private commitActiveDay(): void {
    const activeDay = this.activeDay();
    if (!activeDay) {
      return;
    }

    this.chooseDay(activeDay);
  }

  private focusActiveDay(): void {
    const activeButton = this.hostElement.nativeElement.querySelector(
      `[data-date-key="${this.activeDateKey()}"]`,
    ) as HTMLButtonElement | null;

    activeButton?.focus();
  }

  private updateMenuPosition(): void {
    const triggerRect = this.triggerButton().nativeElement.getBoundingClientRect();
    const viewportPadding = 12;
    const menuWidth = Math.max(0, triggerRect.width);
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const left = Math.min(
      Math.max(triggerRect.left, viewportPadding),
      Math.max(viewportPadding, viewportWidth - menuWidth - viewportPadding),
    );
    const top = triggerRect.bottom + 6;
    const maxHeight = Math.max(viewportPadding * 2, viewportHeight - top - viewportPadding);

    this.menuLeft.set(left);
    this.menuTop.set(top);
    this.menuWidth.set(menuWidth);
    this.menuMaxHeight.set(maxHeight);
  }

  private syncActiveDateToView(): void {
    const current = parseDateKey(this.activeDateKey());
    const viewMonth = this.viewMonth();
    if (
      current.getFullYear() !== viewMonth.getFullYear() ||
      current.getMonth() !== viewMonth.getMonth()
    ) {
      this.activeDateKey.set(formatDateKey(viewMonth));
    }
  }

  private moveActiveByDays(days: number): void {
    const current = parseDateKey(
      this.activeDateKey() || formatDateKey(this.selectedDate() ?? new Date()),
    );
    const next = new Date(current);
    next.setDate(next.getDate() + days);
    this.activeDateKey.set(formatDateKey(next));
    this.viewMonth.set(startOfMonth(next));
  }

  private moveActiveByMonths(months: number): void {
    const current = parseDateKey(
      this.activeDateKey() || formatDateKey(this.selectedDate() ?? new Date()),
    );
    const next = addMonths(current, months);
    this.activeDateKey.set(formatDateKey(next));
    this.viewMonth.set(startOfMonth(next));
  }

  private moveActiveToWeekStart(): void {
    const current = parseDateKey(
      this.activeDateKey() || formatDateKey(this.selectedDate() ?? new Date()),
    );
    const next = new Date(current);
    next.setDate(next.getDate() - next.getDay());
    this.activeDateKey.set(formatDateKey(next));
    this.viewMonth.set(startOfMonth(next));
  }

  private moveActiveToWeekEnd(): void {
    const current = parseDateKey(
      this.activeDateKey() || formatDateKey(this.selectedDate() ?? new Date()),
    );
    const next = new Date(current);
    next.setDate(next.getDate() + (6 - next.getDay()));
    this.activeDateKey.set(formatDateKey(next));
    this.viewMonth.set(startOfMonth(next));
  }

  private hostContains(target: Node): boolean {
    return this.hostElement.nativeElement.contains(target);
  }
}

function buildCalendar(
  viewMonth: Date,
  selectedValue: string,
): readonly (readonly CalendarDay[])[] {
  const monthStart = startOfMonth(viewMonth);
  const gridStart = startOfWeek(monthStart);
  const todayKey = formatDateKey(new Date());
  const selectedKey = selectedValue;
  const days: CalendarDay[] = [];

  for (let index = 0; index < 42; index += 1) {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    const dateKey = formatDateKey(date);

    days.push({
      dateKey,
      dayNumber: date.getDate(),
      label: dayFormatter.format(date),
      inMonth: date.getMonth() === monthStart.getMonth(),
      isToday: dateKey === todayKey,
      isSelected: dateKey === selectedKey,
    });
  }

  return chunk(days, 7);
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function startOfWeek(date: Date): Date {
  const result = new Date(date);
  result.setDate(result.getDate() - result.getDay());
  return result;
}

function addMonths(date: Date, months: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + months, date.getDate());
}

function parseDateString(value: string): Date | null {
  if (!value) {
    return null;
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return null;
  }

  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

function parseDateKey(value: string): Date {
  return parseDateString(value) ?? new Date();
}

function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatLongDate(date: Date): string {
  return longDateFormatter.format(date);
}

function chunk<T>(values: readonly T[], size: number): readonly T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }
  return chunks;
}

const monthYearFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  year: 'numeric',
});

const dayFormatter = new Intl.DateTimeFormat('en-US', {
  weekday: 'short',
  day: 'numeric',
});

const longDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});
