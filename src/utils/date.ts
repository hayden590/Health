import type { IsoDate } from "@/types";

export function toIsoDate(date: Date): IsoDate {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function todayIso(): IsoDate {
  return toIsoDate(new Date());
}

export function addDays(date: IsoDate, days: number): IsoDate {
  const d = new Date(`${date}T12:00:00`);
  d.setDate(d.getDate() + days);
  return toIsoDate(d);
}

export function daysBetween(start: IsoDate, end: IsoDate): IsoDate[] {
  const dates: IsoDate[] = [];
  let cursor = start;
  while (cursor <= end) {
    dates.push(cursor);
    cursor = addDays(cursor, 1);
  }
  return dates;
}

export function lastNDays(n: number, endDate: IsoDate = todayIso()): IsoDate[] {
  return daysBetween(addDays(endDate, -(n - 1)), endDate);
}

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function weekdayLabel(date: IsoDate): string {
  return WEEKDAY_LABELS[new Date(`${date}T12:00:00`).getDay()];
}

export function shortDayLabel(date: IsoDate): string {
  const d = new Date(`${date}T12:00:00`);
  return d.toLocaleDateString(undefined, { day: "numeric" });
}

export function monthDayLabel(date: IsoDate): string {
  const d = new Date(`${date}T12:00:00`);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function isToday(date: IsoDate): boolean {
  return date === todayIso();
}

export function isoWeekStart(date: IsoDate): IsoDate {
  const d = new Date(`${date}T12:00:00`);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return toIsoDate(d);
}

export function minutesToHoursLabel(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return `${h}h ${m}m`;
}
