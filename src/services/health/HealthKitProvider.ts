import AppleHealthKit, {
  HealthInputOptions,
  HealthKitPermissions,
  HealthPermission,
  HealthValue,
} from "react-native-health";
import type { HealthDataProvider } from "./HealthDataProvider";
import { deniedPermissions } from "./HealthDataProvider";
import type {
  ActivitySample,
  HealthPermissions,
  HeartRateSample,
  IsoDate,
  SleepSample,
  SleepStageBreakdown,
} from "@/types";
import { emptyActivitySample } from "./HealthDataProvider";

const PERMS = AppleHealthKit.Constants.Permissions;

const HEALTHKIT_PERMISSIONS: HealthKitPermissions = {
  permissions: {
    read: [
      PERMS.StepCount,
      PERMS.DistanceWalkingRunning,
      PERMS.ActiveEnergyBurned,
      PERMS.SleepAnalysis,
      PERMS.HeartRate,
      PERMS.RestingHeartRate,
      PERMS.Workout,
    ],
    write: [],
  },
};

function dayRange(date: IsoDate) {
  return {
    startDate: `${date}T00:00:00.000Z`,
    endDate: `${date}T23:59:59.999Z`,
  };
}

function isLinked(): boolean {
  return typeof AppleHealthKit.initHealthKit === "function";
}

function initOnce(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!isLinked()) {
      reject(new Error("HealthKit native module is not linked in this build."));
      return;
    }
    AppleHealthKit.initHealthKit(HEALTHKIT_PERMISSIONS, (error) => {
      if (error) {
        reject(new Error(error));
      } else {
        resolve();
      }
    });
  });
}

// Raw sleep-analysis category values HealthKit returns, keyed off the
// package's actual runtime shape (its .d.ts under-types `value` as a
// number, but AppleHealthKit reports these as strings).
type RawSleepSample = { value: string; startDate: string; endDate: string };

function stagesFromSamples(samples: RawSleepSample[]): SleepStageBreakdown {
  const stages: SleepStageBreakdown = {
    lightMinutes: 0,
    deepMinutes: 0,
    remMinutes: 0,
    awakeMinutes: 0,
  };
  for (const sample of samples) {
    const minutes =
      (new Date(sample.endDate).getTime() - new Date(sample.startDate).getTime()) / 60000;
    switch (sample.value) {
      case "AWAKE":
        stages.awakeMinutes += minutes;
        break;
      case "DEEP":
        stages.deepMinutes += minutes;
        break;
      case "REM":
        stages.remMinutes += minutes;
        break;
      case "CORE":
      case "ASLEEP":
        stages.lightMinutes += minutes;
        break;
      default:
        break;
    }
  }
  return stages;
}

function scoreFromSleep(totalMinutes: number, stages: SleepStageBreakdown): number {
  if (totalMinutes <= 0) return 0;
  const deepRatio = stages.deepMinutes / totalMinutes;
  return Math.max(0, Math.min(100, Math.round((totalMinutes / 480) * 70 + deepRatio * 120)));
}

/**
 * Reads from Apple HealthKit. Requires the `expo-health-kit`/react-native-health
 * config plugin, an Info.plist NSHealthShareUsageDescription entry, and a
 * custom EAS dev client build (HealthKit is unavailable in Expo Go and on
 * simulators without a paired Apple Watch / manually entered data).
 */
export class HealthKitProvider implements HealthDataProvider {
  readonly kind = "healthkit" as const;

  async isAvailable(): Promise<boolean> {
    if (!isLinked()) return false;
    return new Promise((resolve) => {
      AppleHealthKit.isAvailable((_err, available) => resolve(Boolean(available)));
    });
  }

  async requestPermissions(): Promise<HealthPermissions> {
    try {
      await initOnce();
      return {
        steps: "granted",
        sleep: "granted",
        heartRate: "granted",
        workouts: "granted",
      };
    } catch {
      return deniedPermissions;
    }
  }

  async getPermissionStatus(): Promise<HealthPermissions> {
    if (!isLinked()) return deniedPermissions;
    // The requested `read` array order below must match HEALTHKIT_PERMISSIONS
    // above — getAuthStatus returns parallel status codes, not a keyed map.
    const readOrder = HEALTHKIT_PERMISSIONS.permissions.read;
    return new Promise((resolve) => {
      AppleHealthKit.getAuthStatus(HEALTHKIT_PERMISSIONS, (error, result) => {
        if (error || !result) {
          resolve(deniedPermissions);
          return;
        }
        // SharingAuthorized === 2 per HealthKit's HKAuthorizationStatus enum
        const statusFor = (perm: HealthPermission): "granted" | "denied" => {
          const index = readOrder.indexOf(perm);
          return index >= 0 && result.permissions.read[index] === 2 ? "granted" : "denied";
        };
        resolve({
          steps: statusFor(PERMS.StepCount),
          sleep: statusFor(PERMS.SleepAnalysis),
          heartRate: statusFor(PERMS.HeartRate),
          workouts: statusFor(PERMS.Workout),
        });
      });
    });
  }

  async getActivity(date: IsoDate): Promise<ActivitySample> {
    if (!isLinked()) return emptyActivitySample(date);
    const options: HealthInputOptions = { ...dayRange(date) };

    const [steps, distance, energy] = await Promise.all([
      this.queryValue(AppleHealthKit.getStepCount, options),
      this.queryValue(AppleHealthKit.getDistanceWalkingRunning, options),
      this.querySum(AppleHealthKit.getActiveEnergyBurned, options),
    ]);

    return {
      date,
      steps: Math.round(steps ?? 0),
      distanceKm: Math.round(((distance ?? 0) / 1000) * 100) / 100,
      activeMinutes: 0,
      activeEnergyKcal: Math.round(energy ?? 0),
      workouts: [],
    };
  }

  async getActivityRange(startDate: IsoDate, endDate: IsoDate): Promise<ActivitySample[]> {
    const dates = enumerateDates(startDate, endDate);
    return Promise.all(dates.map((d) => this.getActivity(d)));
  }

  async getSleep(date: IsoDate): Promise<SleepSample | null> {
    if (!isLinked()) return null;
    const options: HealthInputOptions = { ...dayRange(date) };

    return new Promise((resolve) => {
      AppleHealthKit.getSleepSamples(options, (error, results) => {
        if (error || !results || results.length === 0) {
          resolve(null);
          return;
        }
        const raw = results as unknown as RawSleepSample[];
        const stages = stagesFromSamples(raw);
        const totalMinutes =
          stages.lightMinutes + stages.deepMinutes + stages.remMinutes;
        const bedtime = raw[0].startDate;
        const wakeTime = raw[raw.length - 1].endDate;

        resolve({
          date,
          bedtime,
          wakeTime,
          totalMinutes: Math.round(totalMinutes),
          stages,
          score: scoreFromSleep(totalMinutes, stages),
        });
      });
    });
  }

  async getSleepRange(startDate: IsoDate, endDate: IsoDate): Promise<SleepSample[]> {
    const dates = enumerateDates(startDate, endDate);
    const samples = await Promise.all(dates.map((d) => this.getSleep(d)));
    return samples.filter((s): s is SleepSample => s !== null);
  }

  async getHeartRate(date: IsoDate): Promise<HeartRateSample | null> {
    if (!isLinked()) return null;
    const options: HealthInputOptions = { ...dayRange(date) };
    const [resting, avg] = await Promise.all([
      this.queryValue(AppleHealthKit.getRestingHeartRate, options),
      this.queryAverage(AppleHealthKit.getHeartRateSamples, options),
    ]);
    if (resting === null && avg === null) return null;
    return { date, restingBpm: resting, avgBpm: avg };
  }

  private queryValue(
    fn: (options: HealthInputOptions, cb: (err: string, res: HealthValue) => void) => void,
    options: HealthInputOptions
  ): Promise<number | null> {
    return new Promise((resolve) => {
      fn(options, (error, result) => {
        if (error || !result) resolve(null);
        else resolve(result.value);
      });
    });
  }

  private querySum(
    fn: (options: HealthInputOptions, cb: (err: string, res: HealthValue[]) => void) => void,
    options: HealthInputOptions
  ): Promise<number | null> {
    return new Promise((resolve) => {
      fn(options, (error, results) => {
        if (error || !results) resolve(null);
        else resolve(results.reduce((sum, r) => sum + r.value, 0));
      });
    });
  }

  private queryAverage(
    fn: (options: HealthInputOptions, cb: (err: string, res: HealthValue[]) => void) => void,
    options: HealthInputOptions
  ): Promise<number | null> {
    return new Promise((resolve) => {
      fn(options, (error, results) => {
        if (error || !results || results.length === 0) resolve(null);
        else resolve(Math.round(results.reduce((sum, r) => sum + r.value, 0) / results.length));
      });
    });
  }
}

function enumerateDates(start: IsoDate, end: IsoDate): IsoDate[] {
  const dates: IsoDate[] = [];
  const cursor = new Date(`${start}T12:00:00`);
  const last = new Date(`${end}T12:00:00`);
  while (cursor <= last) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}
