import { getDatabase, newId } from "./database";
import type { MoodEntry, MoodLevel } from "@/types";

interface MoodRow {
  id: string;
  date: string;
  level: number;
  note: string | null;
  created_at: string;
}

function fromRow(row: MoodRow): MoodEntry {
  return {
    id: row.id,
    date: row.date,
    level: row.level as MoodLevel,
    note: row.note,
    createdAt: row.created_at,
  };
}

export async function getMoodForDate(date: string): Promise<MoodEntry | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<MoodRow>("SELECT * FROM mood_entries WHERE date = ?;", [date]);
  return row ? fromRow(row) : null;
}

export async function listMoodSince(sinceDate: string): Promise<MoodEntry[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<MoodRow>(
    "SELECT * FROM mood_entries WHERE date >= ? ORDER BY date ASC;",
    [sinceDate]
  );
  return rows.map(fromRow);
}

export async function upsertMood(date: string, level: MoodLevel, note?: string | null): Promise<MoodEntry> {
  const db = await getDatabase();
  const existing = await db.getFirstAsync<MoodRow>("SELECT * FROM mood_entries WHERE date = ?;", [date]);

  if (existing) {
    await db.runAsync("UPDATE mood_entries SET level = ?, note = ? WHERE id = ?;", [
      level,
      note ?? null,
      existing.id,
    ]);
    return { id: existing.id, date, level, note: note ?? null, createdAt: existing.created_at };
  }

  const id = newId("mood");
  const createdAt = new Date().toISOString();
  await db.runAsync(
    "INSERT INTO mood_entries (id, date, level, note, created_at) VALUES (?, ?, ?, ?, ?);",
    [id, date, level, note ?? null, createdAt]
  );
  return { id, date, level, note: note ?? null, createdAt };
}
