import type { HealthDataProvider } from "./HealthDataProvider";
import { grantedPermissions } from "./HealthDataProvider";
import type {
  ActivitySample,
  HealthPermissions,
  HeartRateSample,
  IsoDate,
  SleepSample,
} from "@/types";
import { daysBetween } from "@/utils/date";

// Deterministic pseudo-random generator seeded by a string so the same date
// always produces the same "wearable reading" across app restarts.
function seededRandom(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const x = Math.sin(hash) * 10000;
  return x - Math.floor(x);
}

function rangeFor(seed: string, min: number, max: number): number {
  return Math.round(min + seededRandom(seed) * (max - min));
}

/**
 * Development/demo data source. Produces believable steps/sleep/heart-rate
 * trends (weekday vs weekend variation, occasional low-activity days) without
 * needing a real device connected. Used automatically on web/simulators and
 * whenever the real HealthKit/Health Connect provider reports unavailable.
 */
export class MockHealthProvider implements HealthDataProvider {
  readonly kind = "mock" as const;

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async requestPermissions(): Promise<HealthPermissions> {
    return grantedPermissions;
  }

  async getPermissionStatus(): Promise<HealthPermissions> {
    return grantedPermissions;
  }

  async getActivity(date: IsoDate): Promise<ActivitySample> {
    const isWeekend = [0, 6].includes(new Date(`${date}T12:00:00`).getDay());
    const base = isWeekend ? 6500 : 8800;
    const steps = rangeFor(`steps-${date}`, base - 2500, base + 4500);
    const distanceKm = Math.round((steps / 1300) * 100) / 100;
    const activeMinutes = rangeFor(`active-${date}`, 20, isWeekend ? 70 : 55);
    const activeEnergyKcal = rangeFor(`energy-${date}`, 180, 520);

    const hasWorkout = seededRandom(`workout-${date}`) > 0.6;

    return {
      date,
      steps,
      distanceKm,
      activeMinutes,
      activeEnergyKcal,
      workouts: hasWorkout
        ? [
            {
              id: `mock-workout-${date}`,
              type: seededRandom(`workout-type-${date}`) > 0.5 ? "Running" : "Strength Training",
              startTime: `${date}T17:30:00`,
              durationMinutes: rangeFor(`workout-dur-${date}`, 20, 55),
              energyKcal: rangeFor(`workout-kcal-${date}`, 150, 400),
            },
          ]
        : [],
    };
  }

  async getActivityRange(startDate: IsoDate, endDate: IsoDate): Promise<ActivitySample[]> {
    const dates = daysBetween(startDate, endDate);
    return Promise.all(dates.map((d) => this.getActivity(d)));
  }

  async getSleep(date: IsoDate): Promise<SleepSample | null> {
    const totalMinutes = rangeFor(`sleep-${date}`, 340, 495);
    const deepMinutes = Math.round(totalMinutes * (0.13 + seededRandom(`deep-${date}`) * 0.08));
    const remMinutes = Math.round(totalMinutes * (0.16 + seededRandom(`rem-${date}`) * 0.08));
    const awakeMinutes = rangeFor(`awake-${date}`, 5, 25);
    const lightMinutes = totalMinutes - deepMinutes - remMinutes - awakeMinutes;

    const score = Math.max(
      40,
      Math.min(98, Math.round((totalMinutes / 480) * 70 + (deepMinutes / totalMinutes) * 120))
    );

    // Sleep is attributed to the morning the user woke up, so the bedtime that
    // produced it belongs to the previous evening.
    const wakeTime = new Date(`${date}T07:${String(rangeFor(`wake-${date}`, 0, 45)).padStart(2, "0")}:00`);
    const bedtime = new Date(wakeTime.getTime() - (totalMinutes + awakeMinutes) * 60000);

    return {
      date,
      bedtime: bedtime.toISOString(),
      wakeTime: wakeTime.toISOString(),
      totalMinutes,
      stages: {
        lightMinutes: Math.max(0, lightMinutes),
        deepMinutes,
        remMinutes,
        awakeMinutes,
      },
      score,
    };
  }

  async getSleepRange(startDate: IsoDate, endDate: IsoDate): Promise<SleepSample[]> {
    const dates = daysBetween(startDate, endDate);
    const samples = await Promise.all(dates.map((d) => this.getSleep(d)));
    return samples.filter((s): s is SleepSample => s !== null);
  }

  async getHeartRate(date: IsoDate): Promise<HeartRateSample | null> {
    return {
      date,
      restingBpm: rangeFor(`resting-hr-${date}`, 52, 68),
      avgBpm: rangeFor(`avg-hr-${date}`, 68, 92),
    };
  }
}
