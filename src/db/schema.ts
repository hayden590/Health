import type { SQLiteDatabase } from "expo-sqlite";

export const DB_NAME = "wellbeing.db";
const SCHEMA_VERSION = 1;

const CREATE_STATEMENTS = `
CREATE TABLE IF NOT EXISTS habits (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL,
  color TEXT NOT NULL,
  target_per_week INTEGER NOT NULL DEFAULT 7,
  created_at TEXT NOT NULL,
  archived_at TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  reminder_time TEXT
);

CREATE TABLE IF NOT EXISTS habit_logs (
  id TEXT PRIMARY KEY NOT NULL,
  habit_id TEXT NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  completed_at TEXT NOT NULL,
  UNIQUE(habit_id, date)
);
CREATE INDEX IF NOT EXISTS idx_habit_logs_habit_date ON habit_logs(habit_id, date);

CREATE TABLE IF NOT EXISTS mood_entries (
  id TEXT PRIMARY KEY NOT NULL,
  date TEXT NOT NULL UNIQUE,
  level INTEGER NOT NULL,
  note TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS nutrition_entries (
  id TEXT PRIMARY KEY NOT NULL,
  date TEXT NOT NULL,
  name TEXT NOT NULL,
  brand TEXT,
  barcode TEXT,
  calories REAL NOT NULL DEFAULT 0,
  protein_g REAL NOT NULL DEFAULT 0,
  carbs_g REAL NOT NULL DEFAULT 0,
  fat_g REAL NOT NULL DEFAULT 0,
  serving_description TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_nutrition_date ON nutrition_entries(date);

CREATE TABLE IF NOT EXISTS health_cache (
  date TEXT PRIMARY KEY NOT NULL,
  steps INTEGER,
  distance_km REAL,
  active_minutes INTEGER,
  active_energy_kcal INTEGER,
  sleep_minutes INTEGER,
  sleep_score INTEGER,
  updated_at TEXT NOT NULL
);
`;

export async function runMigrations(db: SQLiteDatabase): Promise<void> {
  await db.execAsync("PRAGMA journal_mode = WAL;");
  await db.execAsync("PRAGMA foreign_keys = ON;");

  const row = await db.getFirstAsync<{ user_version: number }>("PRAGMA user_version;");
  const currentVersion = row?.user_version ?? 0;

  if (currentVersion < SCHEMA_VERSION) {
    await db.execAsync(CREATE_STATEMENTS);
    await db.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION};`);
  }
}
