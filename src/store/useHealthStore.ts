import { create } from "zustand";
import { resolveAvailableProvider } from "@/services/health";
import type { HealthSourceKind } from "@/types";
import type { ActivitySample, SleepSample } from "@/types";
import { addDays, todayIso } from "@/utils/date";

const TREND_DAYS = 14;

interface HealthState {
  sourceKind: HealthSourceKind | null;
  todayActivity: ActivitySample | null;
  todaySleep: SleepSample | null;
  activityTrend: ActivitySample[];
  sleepTrend: SleepSample[];
  loading: boolean;
  hasLoadedOnce: boolean;
  load: () => Promise<void>;
}

export const useHealthStore = create<HealthState>()((set) => ({
  sourceKind: null,
  todayActivity: null,
  todaySleep: null,
  activityTrend: [],
  sleepTrend: [],
  loading: false,
  hasLoadedOnce: false,

  load: async () => {
    set({ loading: true });
    const provider = await resolveAvailableProvider();
    const today = todayIso();
    const startDate = addDays(today, -(TREND_DAYS - 1));

    const [todayActivity, todaySleep, activityTrend, sleepTrend] = await Promise.all([
      provider.getActivity(today),
      provider.getSleep(today),
      provider.getActivityRange(startDate, today),
      provider.getSleepRange(startDate, today),
    ]);

    set({
      sourceKind: provider.kind,
      todayActivity,
      todaySleep,
      activityTrend,
      sleepTrend,
      loading: false,
      hasLoadedOnce: true,
    });
  },
}));
