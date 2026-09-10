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
}

export async function addNutritionEntry(input: AddNutritionEntryInput): Promise<NutritionEntry> {
  const db = await getDatabase();
  const id = newId("food");
  const createdAt = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO nutrition_entries
      (id, date, name, brand, barcode, calories, protein_g, carbs_g, fat_g, serving_description, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
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
  };
}

export async function deleteNutritionEntry(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync("DELETE FROM nutrition_entries WHERE id = ?;", [id]);
}
