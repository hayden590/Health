export interface FoodProduct {
  barcode: string;
  name: string;
  brand: string | null;
  servingDescription: string | null;
  caloriesPerServing: number;
  proteinPerServing: number;
  carbsPerServing: number;
  fatPerServing: number;
}

interface OpenFoodFactsNutriments {
  "energy-kcal_100g"?: number;
  "energy-kcal_serving"?: number;
  proteins_100g?: number;
  proteins_serving?: number;
  carbohydrates_100g?: number;
  carbohydrates_serving?: number;
  fat_100g?: number;
  fat_serving?: number;
}

interface OpenFoodFactsProduct {
  product_name?: string;
  generic_name?: string;
  brands?: string;
  serving_size?: string;
  nutriments?: OpenFoodFactsNutriments;
}

interface OpenFoodFactsResponse {
  status: number;
  product?: OpenFoodFactsProduct;
}

/**
 * Looks up a scanned barcode against Open Food Facts' free, crowd-sourced
 * food database. Returns null when the product isn't found rather than
 * throwing, so callers can fall back to manual entry.
 */
export async function lookupBarcode(barcode: string): Promise<FoodProduct | null> {
  const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json?fields=product_name,generic_name,brands,serving_size,nutriments`;

  const response = await fetch(url, {
    headers: { "User-Agent": "Vitalis - React Native App - vitalis.health" },
  });
  if (!response.ok) return null;

  const data: OpenFoodFactsResponse = await response.json();
  if (data.status !== 1 || !data.product) return null;

  const p = data.product;
  const n = p.nutriments ?? {};
  const hasServingData = n["energy-kcal_serving"] !== undefined;

  return {
    barcode,
    name: p.product_name || p.generic_name || "Unknown item",
    brand: p.brands ? p.brands.split(",")[0].trim() : null,
    servingDescription: p.serving_size ?? (hasServingData ? null : "per 100g"),
    caloriesPerServing: round(hasServingData ? n["energy-kcal_serving"] : n["energy-kcal_100g"]),
    proteinPerServing: round(hasServingData ? n.proteins_serving : n.proteins_100g),
    carbsPerServing: round(hasServingData ? n.carbohydrates_serving : n.carbohydrates_100g),
    fatPerServing: round(hasServingData ? n.fat_serving : n.fat_100g),
  };
}

function round(value: number | undefined): number {
  return Math.round((value ?? 0) * 10) / 10;
}
