import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { OnboardingSelections } from "@/types";

interface OnboardingState extends OnboardingSelections {
  setSelections: (selections: Partial<OnboardingSelections>) => void;
  complete: () => void;
  reset: () => void;
}

const defaults: OnboardingSelections = {
  trackSleep: true,
  trackActivity: true,
  trackNutrition: true,
  trackHabits: true,
  trackMood: true,
  healthConnected: false,
  completed: false,
};

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      ...defaults,
      setSelections: (selections) => set(selections),
      complete: () => set({ completed: true }),
      reset: () => set({ ...defaults }),
    }),
    {
      name: "onboarding-selections",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
