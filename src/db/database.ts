import { openDatabaseAsync, type SQLiteDatabase } from "expo-sqlite";
import { DB_NAME, runMigrations } from "./schema";

let dbPromise: Promise<SQLiteDatabase> | null = null;

export function getDatabase(): Promise<SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = openDatabaseAsync(DB_NAME).then(async (db) => {
      await runMigrations(db);
      return db;
    });
  }
  return dbPromise;
}

export function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}
