import type {
  ActivitySample,
  HealthPermissions,
  HealthSourceKind,
  HeartRateSample,
  IsoDate,
  SleepSample,
} from "@/types";

/**
 * Every screen in the app talks to health data through this interface only —
 * never directly to HealthKit / Health Connect / a third-party wearable SDK.
 * Swapping in a unified provider (Terra, Spike, Vital) for deeper Garmin/Fitbit
 * metrics later means writing one new class here, nothing else changes.
 */
export interface HealthDataProvider {
  readonly kind: HealthSourceKind;

  /** Whether this provider's underlying data source exists on this device/platform. */
  isAvailable(): Promise<boolean>;

  /** Prompts the OS-level permission sheet (HealthKit) or Health Connect consent screen. */
  requestPermissions(): Promise<HealthPermissions>;

  /** Reads current permission state without prompting. */
  getPermissionStatus(): Promise<HealthPermissions>;

  getActivity(date: IsoDate): Promise<ActivitySample>;
  getActivityRange(startDate: IsoDate, endDate: IsoDate): Promise<ActivitySample[]>;

  getSleep(date: IsoDate): Promise<SleepSample | null>;
  getSleepRange(startDate: IsoDate, endDate: IsoDate): Promise<SleepSample[]>;

  getHeartRate(date: IsoDate): Promise<HeartRateSample | null>;
}

export const deniedPermissions: HealthPermissions = {
  steps: "denied",
  sleep: "denied",
  heartRate: "denied",
  workouts: "denied",
};

export const grantedPermissions: HealthPermissions = {
  steps: "granted",
  sleep: "granted",
  heartRate: "granted",
  workouts: "granted",
};

export function emptyActivitySample(date: IsoDate): ActivitySample {
  return {
    date,
    steps: 0,
    distanceKm: 0,
    activeMinutes: 0,
    activeEnergyKcal: 0,
    workouts: [],
  };
}
