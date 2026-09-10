export type IsoDate = string; // YYYY-MM-DD
export type IsoDateTime = string; // ISO 8601

export type HabitColor =
  | "primary"
  | "sleep"
  | "activity"
  | "nutrition"
  | "mood"
  | "habits";

export interface Habit {
  id: string;
  name: string;
  emoji: string;
  color: HabitColor;
  targetPerWeek: number; // 1-7
  createdAt: IsoDateTime;
  archivedAt: IsoDateTime | null;
  sortOrder: number;
  reminderTime: string | null; // "HH:mm"
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: IsoDate;
  completedAt: IsoDateTime;
}

export interface HabitWithStats extends Habit {
  currentStreak: number;
  bestStreak: number;
  completions: Record<IsoDate, boolean>;
  completedToday: boolean;
  last90: IsoDate[];
}

export type MoodLevel = 1 | 2 | 3 | 4 | 5;

export interface MoodEntry {
  id: string;
  date: IsoDate;
  level: MoodLevel;
  note: string | null;
  createdAt: IsoDateTime;
}

export interface NutritionEntry {
  id: string;
  date: IsoDate;
  name: string;
  brand: string | null;
  barcode: string | null;
  /** Macros for the portion actually eaten. */
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  servingDescription: string | null;
  createdAt: IsoDateTime;
  /** Portion size in `unit`, and the per-100 basis it was scaled from. */
  amount: number | null;
  unit: "g" | "ml" | null;
  per100: {
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
  } | null;
}

export interface SleepStageBreakdown {
  lightMinutes: number;
  deepMinutes: number;
  remMinutes: number;
  awakeMinutes: number;
}

export interface SleepSample {
  date: IsoDate; // date the user woke up
  bedtime: IsoDateTime;
  wakeTime: IsoDateTime;
  totalMinutes: number;
  stages: SleepStageBreakdown | null;
  score: number | null; // 0-100
}

export interface ActivitySample {
  date: IsoDate;
  steps: number;
  distanceKm: number;
  activeMinutes: number;
  activeEnergyKcal: number;
  workouts: WorkoutSample[];
}

export interface WorkoutSample {
  id: string;
  type: string;
  startTime: IsoDateTime;
  durationMinutes: number;
  energyKcal: number;
}

export interface HeartRateSample {
  date: IsoDate;
  restingBpm: number | null;
  avgBpm: number | null;
}

export type HealthPermissionStatus = "granted" | "denied" | "not_determined";

export interface HealthPermissions {
  steps: HealthPermissionStatus;
  sleep: HealthPermissionStatus;
  heartRate: HealthPermissionStatus;
  workouts: HealthPermissionStatus;
}

export type HealthSourceKind = "healthkit" | "health_connect" | "mock" | "unavailable";

export interface OnboardingSelections {
  trackSleep: boolean;
  trackActivity: boolean;
  trackNutrition: boolean;
  trackHabits: boolean;
  trackMood: boolean;
  healthConnected: boolean;
  completed: boolean;
}

export interface DailySnapshot {
  date: IsoDate;
  steps: number;
  sleepMinutes: number;
  sleepScore: number | null;
  habitsCompleted: number;
  habitsTotal: number;
  mood: MoodLevel | null;
  caloriesLogged: number;
}
