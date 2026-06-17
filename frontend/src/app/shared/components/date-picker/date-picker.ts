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
  viewChild,
} from '@angular/core';

import { Dropdown, type DropdownOption } from '../dropdown/dropdown';
import {
  formatDateKey as formatDateValueKey,
  formatTimeValue,
  hasTimeComponent,
  parseDateTimeValue,
} from '../../utils/date-time';

type CalendarDay = {
  readonly dateKey: string;
  readonly dayNumber: number;
  readonly label: string;
  readonly inMonth: boolean;
  readonly isToday: boolean;
  readonly isSelected: boolean;
};

const DEFAULT_TIME_VALUE = '09:00';

@Component({
  selector: 'app-date-picker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Dropdown],
  templateUrl: './date-picker.html',
  styleUrl: './date-picker.scss',
  host: {
    '(document:pointerdown)': 'onDocumentPointerDown($event)',
  },
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
  protected readonly selectedDate = computed(() => parseDateTimeValue(this.value()));
  protected readonly selectedTimeValue = computed(() =>
    this.selectedDate()
      ? formatSelectedTime(this.value(), this.selectedDate()!)
      : DEFAULT_TIME_VALUE,
  );
  protected readonly displayValue = computed(() =>
    this.selectedDate()
      ? formatLongDateTime(this.selectedDate()!)
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
  protected readonly hourPickerId = computed(() => `${this.pickerId()}-hour`);
  protected readonly minutePickerId = computed(() => `${this.pickerId()}-minute`);
  protected readonly hourPickerName = computed(() => `${this.name()}-hour`);
  protected readonly minutePickerName = computed(() => `${this.name()}-minute`);
  protected readonly hourOptions = TIME_HOUR_OPTIONS;
  protected readonly minuteOptions = TIME_MINUTE_OPTIONS;
  protected readonly selectedHourValue = computed(() =>
    formatTimePart(this.selectedDate()?.getHours() ?? 9),
  );
  protected readonly selectedMinuteValue = computed(() =>
    formatTimePart(this.selectedDate()?.getMinutes() ?? 0),
  );

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
        this.activeDateKey.set(formatDateValueKey(selected));
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
    this.activeDateKey.set(formatDateValueKey(selected));
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

    const timeValue = this.selectedTimeValue();

    this.activeDateKey.set(day.dateKey);
    this.valueChange.emit(formatDateTimeValue(day.dateKey, timeValue));

    queueMicrotask(() => this.focusHourPicker());
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
    const target = event.target;

    if (event.key === 'Tab') {
      this.close(false);
      return;
    }

    if (
      target instanceof HTMLElement &&
      target.closest('[data-dropdown-menu], [data-dropdown-option]')
    ) {
      return;
    }

    if (target instanceof HTMLInputElement) {
      if (event.key === 'Escape') {
        event.preventDefault();
        this.close(true);
        return;
      }

      if (event.key === 'Tab') {
        this.close(false);
      }

      return;
    }

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

  protected updateHour(value: string): void {
    this.updateTimePart('hour', value);
  }

  protected updateMinute(value: string): void {
    this.updateTimePart('minute', value);
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

  private focusHourPicker(): void {
    const hourPicker = this.hostElement.nativeElement.querySelector(
      `[id="${this.hourPickerId()}"]`,
    ) as HTMLButtonElement | null;

    hourPicker?.focus();
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
      this.activeDateKey.set(formatDateValueKey(viewMonth));
    }
  }

  private moveActiveByDays(days: number): void {
    const current = parseDateKey(
      this.activeDateKey() || formatDateValueKey(this.selectedDate() ?? new Date()),
    );
    const next = new Date(current);
    next.setDate(next.getDate() + days);
    this.activeDateKey.set(formatDateValueKey(next));
    this.viewMonth.set(startOfMonth(next));
  }

  private moveActiveByMonths(months: number): void {
    const current = parseDateKey(
      this.activeDateKey() || formatDateValueKey(this.selectedDate() ?? new Date()),
    );
    const next = addMonths(current, months);
    this.activeDateKey.set(formatDateValueKey(next));
    this.viewMonth.set(startOfMonth(next));
  }

  private moveActiveToWeekStart(): void {
    const current = parseDateKey(
      this.activeDateKey() || formatDateValueKey(this.selectedDate() ?? new Date()),
    );
    const next = new Date(current);
    next.setDate(next.getDate() - next.getDay());
    this.activeDateKey.set(formatDateValueKey(next));
    this.viewMonth.set(startOfMonth(next));
  }

  private moveActiveToWeekEnd(): void {
    const current = parseDateKey(
      this.activeDateKey() || formatDateValueKey(this.selectedDate() ?? new Date()),
    );
    const next = new Date(current);
    next.setDate(next.getDate() + (6 - next.getDay()));
    this.activeDateKey.set(formatDateValueKey(next));
    this.viewMonth.set(startOfMonth(next));
  }

  private hostContains(target: Node): boolean {
    return this.hostElement.nativeElement.contains(target);
  }

  private updateTimePart(part: 'hour' | 'minute', value: string): void {
    const selectedDate = this.selectedDate();
    if (!selectedDate) {
      return;
    }

    const currentHour = formatTimePart(selectedDate.getHours());
    const currentMinute = formatTimePart(selectedDate.getMinutes());
    const nextHour = part === 'hour' ? value : currentHour;
    const nextMinute = part === 'minute' ? value : currentMinute;

    if (!isValidHourValue(nextHour) || !isValidMinuteValue(nextMinute)) {
      return;
    }

    this.valueChange.emit(
      formatDateTimeValue(formatDateValueKey(selectedDate), `${nextHour}:${nextMinute}`),
    );
  }
}

function buildCalendar(
  viewMonth: Date,
  selectedValue: string,
): readonly (readonly CalendarDay[])[] {
  const monthStart = startOfMonth(viewMonth);
  const gridStart = startOfWeek(monthStart);
  const todayKey = formatDateValueKey(new Date());
  const selectedKey = extractSelectedDateKey(selectedValue);
  const days: CalendarDay[] = [];

  for (let index = 0; index < 42; index += 1) {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    const dateKey = formatDateValueKey(date);

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
  return parseDateTimeValue(value);
}

function parseDateKey(value: string): Date {
  return parseDateString(value) ?? new Date();
}

function formatLongDateTime(date: Date): string {
  return longDateTimeFormatter.format(date);
}

function formatSelectedTime(value: string, selectedDate: Date): string {
  return hasTimeComponent(value) ? formatTimeValue(selectedDate) : DEFAULT_TIME_VALUE;
}

function formatDateTimeValue(dateKey: string, timeValue: string): string {
  return `${dateKey}T${timeValue}`;
}

function extractSelectedDateKey(value: string): string {
  const parsed = parseDateTimeValue(value);
  return parsed ? formatDateValueKey(parsed) : '';
}

function isValidHourValue(value: string): boolean {
  return /^(?:[01]\d|2[0-3])$/.test(value);
}

function isValidMinuteValue(value: string): boolean {
  return /^[0-5]\d$/.test(value);
}

function formatTimePart(value: number): string {
  return `${value}`.padStart(2, '0');
}

function buildTimeOptions(limit: number): readonly DropdownOption[] {
  return Array.from({ length: limit }, (_value, index) => {
    const formatted = formatTimePart(index);
    return { value: formatted, label: formatted };
  });
}

const TIME_HOUR_OPTIONS = buildTimeOptions(24);
const TIME_MINUTE_OPTIONS = buildTimeOptions(60);

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

const longDateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
  timeStyle: 'short',
});
