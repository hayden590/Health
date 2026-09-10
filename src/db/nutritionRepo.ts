import { getDatabase, newId } from "./database";
import type { NutritionEntry } from "@/types";

interface NutritionRow {
  id: string;
  date: string;
  name: string;
  brand: string | null;
  barcode: string | null;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  serving_description: string | null;
  created_at: string;
  amount: number | null;
  unit: string | null;
  calories_per_100: number | null;
  protein_per_100: number | null;
  carbs_per_100: number | null;
  fat_per_100: number | null;
}

function fromRow(row: NutritionRow): NutritionEntry {
  return {
    id: row.id,
    date: row.date,
    name: row.name,
    brand: row.brand,
    barcode: row.barcode,
    calories: row.calories,
    proteinG: row.protein_g,
    carbsG: row.carbs_g,
    fatG: row.fat_g,
    servingDescription: row.serving_description,
    createdAt: row.created_at,
    amount: row.amount,
    unit: row.unit === "ml" ? "ml" : row.unit === "g" ? "g" : null,
    per100:
      row.calories_per_100 === null
        ? null
        : {
            calories: row.calories_per_100,
            proteinG: row.protein_per_100 ?? 0,
            carbsG: row.carbs_per_100 ?? 0,
            fatG: row.fat_per_100 ?? 0,
          },
  };
}

export async function listNutritionForDate(date: string): Promise<NutritionEntry[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<NutritionRow>(
    "SELECT * FROM nutrition_entries WHERE date = ? ORDER BY created_at ASC;",
    [date]
  );
  return rows.map(fromRow);
}

export async function listNutritionSince(sinceDate: string): Promise<NutritionEntry[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<NutritionRow>(
    "SELECT * FROM nutrition_entries WHERE date >= ? ORDER BY date ASC;",
    [sinceDate]
  );
  return rows.map(fromRow);
}

export interface AddNutritionEntryInput {
  date: string;
  name: string;
  brand?: string | null;
  barcode?: string | null;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  servingDescription?: string | null;
  amount?: number | null;
  unit?: "g" | "ml" | null;
  per100?: { calories: number; proteinG: number; carbsG: number; fatG: number } | null;
}

export async function addNutritionEntry(input: AddNutritionEntryInput): Promise<NutritionEntry> {
  const db = await getDatabase();
  const id = newId("food");
  const createdAt = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO nutrition_entries
      (id, date, name, brand, barcode, calories, protein_g, carbs_g, fat_g,
       serving_description, created_at, amount, unit,
       calories_per_100, protein_per_100, carbs_per_100, fat_per_100)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      id,
      input.date,
      input.name,
      input.brand ?? null,
      input.barcode ?? null,
      input.calories,
      input.proteinG,
      input.carbsG,
      input.fatG,
      input.servingDescription ?? null,
      createdAt,
      input.amount ?? null,
      input.unit ?? null,
      input.per100?.calories ?? null,
      input.per100?.proteinG ?? null,
      input.per100?.carbsG ?? null,
      input.per100?.fatG ?? null,
    ]
  );

  return {
    id,
    date: input.date,
    name: input.name,
    brand: input.brand ?? null,
    barcode: input.barcode ?? null,
    calories: input.calories,
    proteinG: input.proteinG,
    carbsG: input.carbsG,
    fatG: input.fatG,
    servingDescription: input.servingDescription ?? null,
    createdAt,
    amount: input.amount ?? null,
    unit: input.unit ?? null,
    per100: input.per100 ?? null,
  };
}

export async function deleteNutritionEntry(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync("DELETE FROM nutrition_entries WHERE id = ?;", [id]);
}
