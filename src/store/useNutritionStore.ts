import { create } from "zustand";
import {
  addNutritionEntry,
  deleteNutritionEntry,
  listNutritionForDate,
  listNutritionSince,
  type AddNutritionEntryInput,
} from "@/db/nutritionRepo";
import type { NutritionEntry } from "@/types";
import { addDays, todayIso } from "@/utils/date";

interface NutritionState {
  today: NutritionEntry[];
  recent: NutritionEntry[];
  loading: boolean;
  load: () => Promise<void>;
  addEntry: (input: AddNutritionEntryInput) => Promise<void>;
  removeEntry: (id: string) => Promise<void>;
}

export const useNutritionStore = create<NutritionState>()((set) => ({
  today: [],
  recent: [],
  loading: false,

  load: async () => {
    set({ loading: true });
    const since = addDays(todayIso(), -13);
    const [today, recent] = await Promise.all([
      listNutritionForDate(todayIso()),
      listNutritionSince(since),
    ]);
    set({ today, recent, loading: false });
  },

  addEntry: async (input) => {
    const entry = await addNutritionEntry(input);
    set((state) => ({
      today: entry.date === todayIso() ? [...state.today, entry] : state.today,
      recent: [...state.recent, entry],
    }));
  },

  removeEntry: async (id) => {
    await deleteNutritionEntry(id);
    set((state) => ({
      today: state.today.filter((e) => e.id !== id),
      recent: state.recent.filter((e) => e.id !== id),
    }));
  },
}));
