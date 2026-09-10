import { getDatabase, newId } from "./database";
import type { Habit, HabitColor, HabitLog } from "@/types";
import { addDays, todayIso } from "@/utils/date";

interface HabitRow {
  id: string;
  name: string;
  emoji: string;
  color: HabitColor;
  target_per_week: number;
  created_at: string;
  archived_at: string | null;
  sort_order: number;
  reminder_time: string | null;
}

interface HabitLogRow {
  id: string;
  habit_id: string;
  date: string;
  completed_at: string;
}

function fromHabitRow(row: HabitRow): Habit {
  return {
    id: row.id,
    name: row.name,
    emoji: row.emoji,
    color: row.color,
    targetPerWeek: row.target_per_week,
    createdAt: row.created_at,
    archivedAt: row.archived_at,
    sortOrder: row.sort_order,
    reminderTime: row.reminder_time,
  };
}

function fromLogRow(row: HabitLogRow): HabitLog {
  return {
    id: row.id,
    habitId: row.habit_id,
    date: row.date,
    completedAt: row.completed_at,
  };
}

export async function listHabits(): Promise<Habit[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<HabitRow>(
    "SELECT * FROM habits WHERE archived_at IS NULL ORDER BY sort_order ASC, created_at ASC;"
  );
  return rows.map(fromHabitRow);
}

export interface CreateHabitInput {
  name: string;
  emoji: string;
  color: HabitColor;
  targetPerWeek?: number;
  reminderTime?: string | null;
}

export async function createHabit(input: CreateHabitInput): Promise<Habit> {
  const db = await getDatabase();
  const id = newId("habit");
  const createdAt = new Date().toISOString();
  const maxOrder = await db.getFirstAsync<{ n: number }>(
    "SELECT COALESCE(MAX(sort_order), -1) as n FROM habits;"
  );
  const sortOrder = (maxOrder?.n ?? -1) + 1;

  await db.runAsync(
    `INSERT INTO habits (id, name, emoji, color, target_per_week, created_at, archived_at, sort_order, reminder_time)
     VALUES (?, ?, ?, ?, ?, ?, NULL, ?, ?);`,
    [id, input.name, input.emoji, input.color, input.targetPerWeek ?? 7, createdAt, sortOrder, input.reminderTime ?? null]
  );

  return {
    id,
    name: input.name,
    emoji: input.emoji,
    color: input.color,
    targetPerWeek: input.targetPerWeek ?? 7,
    createdAt,
    archivedAt: null,
    sortOrder,
    reminderTime: input.reminderTime ?? null,
  };
}

export async function updateHabit(
  id: string,
  updates: Partial<Pick<Habit, "name" | "emoji" | "color" | "targetPerWeek" | "reminderTime">>
): Promise<void> {
  const db = await getDatabase();
  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  if (updates.name !== undefined) {
    fields.push("name = ?");
    values.push(updates.name);
  }
  if (updates.emoji !== undefined) {
    fields.push("emoji = ?");
    values.push(updates.emoji);
  }
  if (updates.color !== undefined) {
    fields.push("color = ?");
    values.push(updates.color);
  }
  if (updates.targetPerWeek !== undefined) {
    fields.push("target_per_week = ?");
    values.push(updates.targetPerWeek);
  }
  if (updates.reminderTime !== undefined) {
    fields.push("reminder_time = ?");
    values.push(updates.reminderTime);
  }
  if (fields.length === 0) return;

  values.push(id);
  await db.runAsync(`UPDATE habits SET ${fields.join(", ")} WHERE id = ?;`, values);
}

export async function archiveHabit(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync("UPDATE habits SET archived_at = ? WHERE id = ?;", [
    new Date().toISOString(),
    id,
  ]);
}

export async function deleteHabit(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync("DELETE FROM habit_logs WHERE habit_id = ?;", [id]);
  await db.runAsync("DELETE FROM habits WHERE id = ?;", [id]);
}

export async function reorderHabits(orderedIds: string[]): Promise<void> {
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    for (let i = 0; i < orderedIds.length; i++) {
      await db.runAsync("UPDATE habits SET sort_order = ? WHERE id = ?;", [i, orderedIds[i]]);
    }
  });
}

export async function listLogsForHabit(habitId: string, sinceDate?: string): Promise<HabitLog[]> {
  const db = await getDatabase();
  const rows = sinceDate
    ? await db.getAllAsync<HabitLogRow>(
        "SELECT * FROM habit_logs WHERE habit_id = ? AND date >= ? ORDER BY date ASC;",
        [habitId, sinceDate]
      )
    : await db.getAllAsync<HabitLogRow>(
        "SELECT * FROM habit_logs WHERE habit_id = ? ORDER BY date ASC;",
        [habitId]
      );
  return rows.map(fromLogRow);
}

export async function listAllLogsSince(sinceDate: string): Promise<HabitLog[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<HabitLogRow>(
    "SELECT * FROM habit_logs WHERE date >= ? ORDER BY date ASC;",
    [sinceDate]
  );
  return rows.map(fromLogRow);
}

export async function isHabitCompleted(habitId: string, date: string): Promise<boolean> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<HabitLogRow>(
    "SELECT * FROM habit_logs WHERE habit_id = ? AND date = ?;",
    [habitId, date]
  );
  return row !== null;
}

export async function toggleHabitCompletion(habitId: string, date: string): Promise<boolean> {
  const db = await getDatabase();
  const existing = await db.getFirstAsync<HabitLogRow>(
    "SELECT * FROM habit_logs WHERE habit_id = ? AND date = ?;",
    [habitId, date]
  );

  if (existing) {
    await db.runAsync("DELETE FROM habit_logs WHERE id = ?;", [existing.id]);
    return false;
  }

  await db.runAsync(
    "INSERT INTO habit_logs (id, habit_id, date, completed_at) VALUES (?, ?, ?, ?);",
    [newId("log"), habitId, date, new Date().toISOString()]
  );
  return true;
}

/** Longest run of consecutive completed days ending today or yesterday. */
export function computeCurrentStreak(completions: Set<string>, today = todayIso()): number {
  let streak = 0;
  let cursor = completions.has(today) ? today : addDays(today, -1);
  if (!completions.has(cursor)) return 0;
  while (completions.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export function computeBestStreak(completions: Set<string>): number {
  if (completions.size === 0) return 0;
  const sorted = Array.from(completions).sort();
  let best = 1;
  let current = 1;
  for (let i = 1; i < sorted.length; i++) {
    if (addDays(sorted[i - 1], 1) === sorted[i]) {
      current += 1;
      best = Math.max(best, current);
    } else {
      current = 1;
    }
  }
  return best;
}
