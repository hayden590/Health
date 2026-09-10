import { create } from "zustand";
import { getMoodForDate, listMoodSince, upsertMood } from "@/db/moodRepo";
import type { MoodEntry, MoodLevel } from "@/types";
import { addDays, todayIso } from "@/utils/date";

interface MoodState {
  today: MoodEntry | null;
  recent: MoodEntry[];
  loading: boolean;
  load: () => Promise<void>;
  setTodayMood: (level: MoodLevel, note?: string | null) => Promise<void>;
}

export const useMoodStore = create<MoodState>()((set) => ({
  today: null,
  recent: [],
  loading: false,

  load: async () => {
    set({ loading: true });
    const since = addDays(todayIso(), -29);
    const [today, recent] = await Promise.all([getMoodForDate(todayIso()), listMoodSince(since)]);
    set({ today, recent, loading: false });
  },

  setTodayMood: async (level, note) => {
    const entry = await upsertMood(todayIso(), level, note ?? null);
    set((state) => ({
      today: entry,
      recent: [...state.recent.filter((m) => m.date !== entry.date), entry].sort((a, b) =>
        a.date.localeCompare(b.date)
      ),
    }));
  },
}));
