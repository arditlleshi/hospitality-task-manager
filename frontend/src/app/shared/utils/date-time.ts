const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const LOCAL_DATE_TIME_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?$/;

export function parseDateTimeValue(value: string): Date | null {
  if (!value) {
    return null;
  }

  const dateOnlyMatch = DATE_ONLY_PATTERN.exec(value);
  if (dateOnlyMatch) {
    return new Date(
      Number(dateOnlyMatch[1]),
      Number(dateOnlyMatch[2]) - 1,
      Number(dateOnlyMatch[3]),
    );
  }

  const localDateTimeMatch = LOCAL_DATE_TIME_PATTERN.exec(value);
  if (localDateTimeMatch) {
    return new Date(
      Number(localDateTimeMatch[1]),
      Number(localDateTimeMatch[2]) - 1,
      Number(localDateTimeMatch[3]),
      Number(localDateTimeMatch[4]),
      Number(localDateTimeMatch[5]),
      Number(localDateTimeMatch[6] ?? '0'),
    );
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.valueOf()) ? null : parsed;
}

export function hasTimeComponent(value: string): boolean {
  return /T\d{2}:\d{2}/.test(value);
}

export function toDateTimeInputValue(value: string, fallbackTime = '09:00'): string {
  const parsed = parseDateTimeValue(value);
  if (!parsed) {
    return '';
  }

  const dateKey = formatDateKey(parsed);
  const timeValue = hasTimeComponent(value) ? formatTimeValue(parsed) : fallbackTime;

  return `${dateKey}T${timeValue}`;
}

export function toApiDateTimeValue(value: string, fallbackTime = '09:00'): string | undefined {
  const normalized = value.trim();
  if (!normalized) {
    return undefined;
  }

  const dateOnlyMatch = DATE_ONLY_PATTERN.exec(normalized);
  if (dateOnlyMatch) {
    return `${normalized}T${fallbackTime}:00`;
  }

  const localDateTimeMatch = LOCAL_DATE_TIME_PATTERN.exec(normalized);
  if (localDateTimeMatch) {
    const seconds = localDateTimeMatch[6] ?? '00';
    return `${localDateTimeMatch[1]}-${localDateTimeMatch[2]}-${localDateTimeMatch[3]}T${localDateTimeMatch[4]}:${localDateTimeMatch[5]}:${seconds}`;
  }

  const parsed = parseDateTimeValue(normalized);
  if (!parsed) {
    return undefined;
  }

  return `${formatDateKey(parsed)}T${formatTimeValue(parsed)}:00`;
}

export function formatDateKey(date: Date): string {
  return `${date.getFullYear()}-${padNumber(date.getMonth() + 1)}-${padNumber(date.getDate())}`;
}

export function formatTimeValue(date: Date): string {
  return `${padNumber(date.getHours())}:${padNumber(date.getMinutes())}`;
}

function padNumber(value: number): string {
  return `${value}`.padStart(2, '0');
}
