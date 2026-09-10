import {
  getSdkStatus,
  initialize,
  requestPermission,
  getGrantedPermissions,
  readRecords,
  SdkAvailabilityStatus,
  type Permission,
  type RecordType,
} from "react-native-health-connect";
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

const RECORD_TYPES: RecordType[] = [
  "Steps",
  "Distance",
  "ActiveCaloriesBurned",
  "SleepSession",
  "HeartRate",
  "ExerciseSession",
];

const READ_PERMISSIONS: Permission[] = RECORD_TYPES.map((recordType) => ({
  accessType: "read",
  recordType,
}));

function dayTimeRange(date: IsoDate) {
  return {
    operator: "between" as const,
    startTime: `${date}T00:00:00.000Z`,
    endTime: `${date}T23:59:59.999Z`,
  };
}

// SleepStageType per react-native-health-connect's constants module.
const SLEEP_STAGE = { AWAKE: 1, OUT_OF_BED: 3, LIGHT: 4, DEEP: 5, REM: 6 };

function stagesFromSleepRecord(stages: { startTime: string; endTime: string; stage: number }[]) {
  const result: SleepStageBreakdown = {
    lightMinutes: 0,
    deepMinutes: 0,
    remMinutes: 0,
    awakeMinutes: 0,
  };
  for (const stage of stages) {
    const minutes = (new Date(stage.endTime).getTime() - new Date(stage.startTime).getTime()) / 60000;
    switch (stage.stage) {
      case SLEEP_STAGE.DEEP:
        result.deepMinutes += minutes;
        break;
      case SLEEP_STAGE.REM:
        result.remMinutes += minutes;
        break;
      case SLEEP_STAGE.LIGHT:
        result.lightMinutes += minutes;
        break;
      case SLEEP_STAGE.AWAKE:
      case SLEEP_STAGE.OUT_OF_BED:
        result.awakeMinutes += minutes;
        break;
      default:
        break;
    }
  }
  return result;
}

function scoreFromSleep(totalMinutes: number, stages: SleepStageBreakdown): number {
  if (totalMinutes <= 0) return 0;
  const deepRatio = stages.deepMinutes / totalMinutes;
  return Math.max(0, Math.min(100, Math.round((totalMinutes / 480) * 70 + deepRatio * 120)));
}

let initialized = false;

async function ensureInitialized(): Promise<boolean> {
  if (initialized) return true;
  try {
    const status = await getSdkStatus();
    if (status !== SdkAvailabilityStatus.SDK_AVAILABLE) return false;
    initialized = await initialize();
    return initialized;
  } catch {
    return false;
  }
}

/**
 * Reads from Android's Health Connect, the OS-level aggregator that Fitbit,
 * Garmin, Samsung Health and most Wear OS devices write into. Requires the
 * `react-native-health-connect` config plugin and a custom EAS dev client
 * build (not available inside Expo Go).
 */
export class HealthConnectProvider implements HealthDataProvider {
  readonly kind = "health_connect" as const;

  async isAvailable(): Promise<boolean> {
    try {
      const status = await getSdkStatus();
      return status === SdkAvailabilityStatus.SDK_AVAILABLE;
    } catch {
      return false;
    }
  }

  async requestPermissions(): Promise<HealthPermissions> {
    const ready = await ensureInitialized();
    if (!ready) return deniedPermissions;
    try {
      const granted = await requestPermission(READ_PERMISSIONS);
      return permissionsFromGranted(granted.map((p) => (p as Permission).recordType));
    } catch {
      return deniedPermissions;
    }
  }

  async getPermissionStatus(): Promise<HealthPermissions> {
    const ready = await ensureInitialized();
    if (!ready) return deniedPermissions;
    try {
      const granted = await getGrantedPermissions();
      return permissionsFromGranted(granted.map((p) => (p as Permission).recordType));
    } catch {
      return deniedPermissions;
    }
  }

  async getActivity(date: IsoDate): Promise<ActivitySample> {
    const ready = await ensureInitialized();
    if (!ready) return emptyActivitySample(date);
    const timeRangeFilter = dayTimeRange(date);

    const [steps, distance, energy, exercise] = await Promise.all([
      readRecords("Steps", { timeRangeFilter }),
      readRecords("Distance", { timeRangeFilter }),
      readRecords("ActiveCaloriesBurned", { timeRangeFilter }),
      readRecords("ExerciseSession", { timeRangeFilter }),
    ]);

    const totalSteps = steps.records.reduce((sum, r) => sum + r.count, 0);
    const totalDistanceM = distance.records.reduce((sum, r) => sum + r.distance.inMeters, 0);
    const totalEnergy = energy.records.reduce((sum, r) => sum + r.energy.inKilocalories, 0);
    const activeMinutes = exercise.records.reduce(
      (sum, r) => sum + (new Date(r.endTime).getTime() - new Date(r.startTime).getTime()) / 60000,
      0
    );

    return {
      date,
      steps: Math.round(totalSteps),
      distanceKm: Math.round((totalDistanceM / 1000) * 100) / 100,
      activeMinutes: Math.round(activeMinutes),
      activeEnergyKcal: Math.round(totalEnergy),
      workouts: exercise.records.map((r) => ({
        id: r.metadata?.id ?? `${r.startTime}-${r.endTime}`,
        type: r.title ?? "Workout",
        startTime: r.startTime,
        durationMinutes: Math.round(
          (new Date(r.endTime).getTime() - new Date(r.startTime).getTime()) / 60000
        ),
        energyKcal: 0,
      })),
    };
  }

  async getActivityRange(startDate: IsoDate, endDate: IsoDate): Promise<ActivitySample[]> {
    const dates = enumerateDates(startDate, endDate);
    return Promise.all(dates.map((d) => this.getActivity(d)));
  }

  async getSleep(date: IsoDate): Promise<SleepSample | null> {
    const ready = await ensureInitialized();
    if (!ready) return null;

    const { records } = await readRecords("SleepSession", { timeRangeFilter: dayTimeRange(date) });
    if (records.length === 0) return null;

    const session = records[0];
    const stages = stagesFromSleepRecord(session.stages ?? []);
    const totalMinutes =
      (new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / 60000;

    return {
      date,
      bedtime: session.startTime,
      wakeTime: session.endTime,
      totalMinutes: Math.round(totalMinutes),
      stages,
      score: scoreFromSleep(totalMinutes, stages),
    };
  }

  async getSleepRange(startDate: IsoDate, endDate: IsoDate): Promise<SleepSample[]> {
    const dates = enumerateDates(startDate, endDate);
    const samples = await Promise.all(dates.map((d) => this.getSleep(d)));
    return samples.filter((s): s is SleepSample => s !== null);
  }

  async getHeartRate(date: IsoDate): Promise<HeartRateSample | null> {
    const ready = await ensureInitialized();
    if (!ready) return null;

    const { records } = await readRecords("HeartRate", { timeRangeFilter: dayTimeRange(date) });
    const allSamples = records.flatMap((r) => r.samples);
    if (allSamples.length === 0) return null;

    const avgBpm = Math.round(
      allSamples.reduce((sum, s) => sum + s.beatsPerMinute, 0) / allSamples.length
    );
    const restingBpm = Math.min(...allSamples.map((s) => s.beatsPerMinute));

    return { date, restingBpm, avgBpm };
  }
}

function permissionsFromGranted(grantedTypes: RecordType[]): HealthPermissions {
  const has = (type: RecordType) => (grantedTypes.includes(type) ? "granted" : "denied");
  return {
    steps: has("Steps"),
    sleep: has("SleepSession"),
    heartRate: has("HeartRate"),
    workouts: has("ExerciseSession"),
  };
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
