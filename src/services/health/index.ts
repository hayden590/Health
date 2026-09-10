import { Platform } from "react-native";
import type { HealthDataProvider } from "./HealthDataProvider";
import { MockHealthProvider } from "./MockHealthProvider";

export type { HealthDataProvider } from "./HealthDataProvider";
export * from "@/types";

// Set to false to force mock data even on-device — handy while a screen is
// still being built out and real permissions haven't been wired up yet.
const USE_REAL_HEALTH_SOURCE = true;

let cachedProvider: HealthDataProvider | null = null;

/**
 * Returns the singleton HealthDataProvider for this platform: HealthKit on
 * iOS, Health Connect on Android, mock data everywhere else (web, or when a
 * native module isn't linked because we're running inside Expo Go). Callers
 * never need to branch on Platform.OS themselves.
 */
export function getHealthDataProvider(): HealthDataProvider {
  if (cachedProvider) return cachedProvider;

  if (USE_REAL_HEALTH_SOURCE) {
    if (Platform.OS === "ios") {
      const { HealthKitProvider } = require("./HealthKitProvider");
      cachedProvider = new HealthKitProvider();
    } else if (Platform.OS === "android") {
      const { HealthConnectProvider } = require("./HealthConnectProvider");
      cachedProvider = new HealthConnectProvider();
    }
  }

  cachedProvider = cachedProvider ?? new MockHealthProvider();
  return cachedProvider;
}

/**
 * Resolves a provider that is actually available right now, falling back to
 * mock data if the platform-native source can't be reached (native module
 * not linked, permissions never granted a device, running in Expo Go, etc).
 * Screens should call this once on mount rather than getHealthDataProvider()
 * directly so they always get *something* to render.
 */
export async function resolveAvailableProvider(): Promise<HealthDataProvider> {
  const primary = getHealthDataProvider();
  if (primary.kind === "mock") return primary;

  const available = await primary.isAvailable().catch(() => false);
  if (available) return primary;

  return new MockHealthProvider();
}
