export interface MacroSet {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export type MeasureUnit = "g" | "ml";

export interface FoodProduct {
  barcode: string;
  name: string;
  brand: string | null;
  /**
   * Open Food Facts reports every product per 100g (or 100ml for drinks),
   * so that's the canonical basis we keep. Any portion the user enters is
   * scaled from here rather than from a serving size, which is often missing.
   */
  per100: MacroSet;
  unit: MeasureUnit;
  /** Parsed grams/ml of one serving, when the product declares one. */
  servingSize: number | null;
  /** The raw serving text, e.g. "15 g" or "1 cup (240 ml)". */
  servingLabel: string | null;
}

interface OpenFoodFactsNutriments {
  "energy-kcal_100g"?: number;
  proteins_100g?: number;
  carbohydrates_100g?: number;
  fat_100g?: number;
}

interface OpenFoodFactsProduct {
  product_name?: string;
  generic_name?: string;
  brands?: string;
  serving_size?: string;
  quantity?: string;
  nutriments?: OpenFoodFactsNutriments;
}

interface OpenFoodFactsResponse {
  status: number;
  product?: OpenFoodFactsProduct;
}

const API_BASE = "https://world.openfoodfacts.org/api/v2/product";
const FIELDS = "product_name,generic_name,brands,serving_size,quantity,nutriments";

/**
 * Looks up a scanned barcode against Open Food Facts' free food database.
 * Returns null when the product isn't found or carries no usable nutrition,
 * so the caller can fall back to manual entry instead of showing zeroes.
 */
export async function lookupBarcode(barcode: string): Promise<FoodProduct | null> {
  const url = `${API_BASE}/${encodeURIComponent(barcode)}.json?fields=${FIELDS}`;

  const response = await fetch(url, {
    headers: { "User-Agent": "Vitalis/1.0 (habit and wellness tracker)" },
  });
  if (!response.ok) return null;

  const data: OpenFoodFactsResponse = await response.json();
  if (data.status !== 1 || !data.product) return null;

  const p = data.product;
  const n = p.nutriments ?? {};

  // A product with no energy value is useless for logging — treat it as a miss
  // so the user gets the manual form rather than a row of zeroes.
  if (n["energy-kcal_100g"] === undefined) return null;

  const servingLabel = p.serving_size?.trim() || null;
  const parsedServing = parseMeasure(servingLabel);

  return {
    barcode,
    name: p.product_name?.trim() || p.generic_name?.trim() || "Unknown item",
    brand: p.brands ? p.brands.split(",")[0].trim() : null,
    per100: {
      calories: round(n["energy-kcal_100g"]),
      proteinG: round(n.proteins_100g),
      carbsG: round(n.carbohydrates_100g),
      fatG: round(n.fat_100g),
    },
    unit: parsedServing?.unit ?? (looksLikeDrink(p.quantity) ? "ml" : "g"),
    servingSize: parsedServing?.amount ?? null,
    servingLabel,
  };
}

/** Scales a per-100 basis to an arbitrary portion. */
export function scaleMacros(per100: MacroSet, amount: number): MacroSet {
  const factor = amount / 100;
  return {
    calories: round(per100.calories * factor),
    proteinG: round(per100.proteinG * factor),
    carbsG: round(per100.carbsG * factor),
    fatG: round(per100.fatG * factor),
  };
}

/**
 * Pulls a gram/millilitre amount out of Open Food Facts' free-text serving
 * field. Values inside parentheses win, because entries like
 * "1 cup (240 ml)" put the useful number there.
 */
export function parseMeasure(text: string | null): { amount: number; unit: MeasureUnit } | null {
  if (!text) return null;

  const pattern = /(\d+(?:[.,]\d+)?)\s*(g|gram|grams|ml|millilitre|milliliter)\b/gi;
  const matches = [...text.matchAll(pattern)];
  if (matches.length === 0) return null;

  const parenthesised = matches.find((m) => {
    const index = m.index ?? 0;
    const before = text.slice(0, index);
    return before.lastIndexOf("(") > before.lastIndexOf(")");
  });

  const chosen = parenthesised ?? matches[0];
  const amount = parseFloat(chosen[1].replace(",", "."));
  if (!Number.isFinite(amount) || amount <= 0) return null;

  return { amount, unit: chosen[2].toLowerCase().startsWith("m") ? "ml" : "g" };
}

function looksLikeDrink(quantity: string | undefined): boolean {
  return Boolean(quantity && /\d\s*(ml|l|cl)\b/i.test(quantity));
}

function round(value: number | undefined): number {
  return Math.round((value ?? 0) * 10) / 10;
}
