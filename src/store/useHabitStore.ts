import { create } from "zustand";
import type { CreateHabitInput } from "@/db/habitsRepo";
import {
  computeBestStreak,
  computeCurrentStreak,
  createHabit,
  archiveHabit,
  listAllLogsSince,
  listHabits,
  toggleHabitCompletion,
  updateHabit,
} from "@/db/habitsRepo";
import { syncHabitReminders } from "@/services/notifications";
import type { Habit, HabitWithStats } from "@/types";
import { addDays, todayIso } from "@/utils/date";

const HISTORY_DAYS = 120;

function buildStats(habit: Habit, dates: string[]): HabitWithStats {
  const set = new Set(dates);
  return {
    ...habit,
    completions: Object.fromEntries(dates.map((d) => [d, true])),
    currentStreak: computeCurrentStreak(set),
    bestStreak: computeBestStreak(set),
    completedToday: set.has(todayIso()),
    last90: dates.filter((d) => d >= addDays(todayIso(), -89)),
  };
}

interface HabitState {
  habits: HabitWithStats[];
  loading: boolean;
  hasLoadedOnce: boolean;
  load: () => Promise<void>;
  addHabit: (input: CreateHabitInput) => Promise<void>;
  renameHabit: (id: string, updates: Parameters<typeof updateHabit>[1]) => Promise<void>;
  removeHabit: (id: string) => Promise<void>;
  toggleToday: (id: string) => Promise<void>;
  toggleDate: (id: string, date: string) => Promise<void>;
}

export const useHabitStore = create<HabitState>()((set, get) => ({
  habits: [],
  loading: false,
  hasLoadedOnce: false,

  load: async () => {
    set({ loading: true });
    const sinceDate = addDays(todayIso(), -(HISTORY_DAYS - 1));
    const [habits, logs] = await Promise.all([listHabits(), listAllLogsSince(sinceDate)]);

    const logsByHabit = new Map<string, string[]>();
    for (const log of logs) {
      const arr = logsByHabit.get(log.habitId) ?? [];
      arr.push(log.date);
      logsByHabit.set(log.habitId, arr);
    }

    const withStats = habits.map((h) => buildStats(h, logsByHabit.get(h.id) ?? []));
    set({ habits: withStats, loading: false, hasLoadedOnce: true });
  },

  addHabit: async (input) => {
    await createHabit(input);
    await get().load();
    await syncHabitReminders(get().habits);
  },

  renameHabit: async (id, updates) => {
    await updateHabit(id, updates);
    await get().load();
    await syncHabitReminders(get().habits);
  },

  removeHabit: async (id) => {
    await archiveHabit(id);
    set({ habits: get().habits.filter((h) => h.id !== id) });
    await syncHabitReminders(get().habits);
  },

  toggleToday: async (id) => {
    await get().toggleDate(id, todayIso());
  },

  toggleDate: async (id, date) => {
    const habit = get().habits.find((h) => h.id === id);
    if (!habit) return;

    const wasCompleted = Boolean(habit.completions[date]);
    const optimisticCompletions = { ...habit.completions };
    if (wasCompleted) delete optimisticCompletions[date];
    else optimisticCompletions[date] = true;

    const optimisticSet = new Set(Object.keys(optimisticCompletions));
    const optimisticHabit: HabitWithStats = {
      ...habit,
      completions: optimisticCompletions,
      currentStreak: computeCurrentStreak(optimisticSet),
      bestStreak: computeBestStreak(optimisticSet),
      completedToday: date === todayIso() ? !wasCompleted : habit.completedToday,
    };

    set({
      habits: get().habits.map((h) => (h.id === id ? optimisticHabit : h)),
    });

    await toggleHabitCompletion(id, date);
  },
}));
