import {
  initialize,
  requestPermission,
  readRecords,
  aggregateRecord,
  getSdkStatus,
  SdkAvailabilityStatus,
} from 'react-native-health-connect';
import { Platform } from 'react-native';

const SAMSUNG_PKG = 'com.sec.android.app.shealth';

// ─── today's local-midnight range ────────────────────────────────────────────
function getTodayRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const end   = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();
  return { start, end };
}

// ─── SDK check: getSdkStatus returns a number (3 = available) ────────────────
export async function isHealthConnectAvailable() {
  if (Platform.OS !== 'android') return false;
  try {
    const status = await getSdkStatus();
    return status === SdkAvailabilityStatus.SDK_AVAILABLE;
  } catch {
    return false;
  }
}

// ─── Request ALL health permissions at once ───────────────────────────────────
export async function requestHealthPermissions() {
  try {
    await initialize();
    const requested = [
      { accessType: 'read', recordType: 'Steps' },
      { accessType: 'read', recordType: 'HeartRate' },
      { accessType: 'read', recordType: 'ActiveCaloriesBurned' },
      { accessType: 'read', recordType: 'TotalCaloriesBurned' },
    ];
    const granted = await requestPermission(requested);
    // Check that at least Steps is granted (minimum for core functionality)
    return granted.some(
      (g) => g.recordType === 'Steps' && g.accessType === 'read',
    );
  } catch {
    return false;
  }
}

// Keep for compatibility but now routes to full request
export async function requestStepsPermission() {
  return requestHealthPermissions();
}

// ─── Steps ────────────────────────────────────────────────────────────────────
// aggregateRecord gives an authoritative single total from Health Connect,
// avoiding the under-counting that occurs when readRecords hits pagination
// limits and Samsung Health syncs step batches that span multiple records.
export async function getTodaySteps() {
  if (Platform.OS !== 'android') return 0;
  try {
    await initialize();
    const { start, end } = getTodayRange();
    const timeRangeFilter = { operator: 'between', startTime: start, endTime: end };

    const [allResult, samsungResult] = await Promise.allSettled([
      aggregateRecord({
        recordType: 'Steps',
        timeRangeFilter,
      }),
      aggregateRecord({
        recordType: 'Steps',
        timeRangeFilter,
        dataOriginFilter: [SAMSUNG_PKG],
      }),
    ]);

    const allSteps = allResult.status === 'fulfilled'
      ? (allResult.value?.COUNT_TOTAL ?? 0)
      : 0;

    const samsungSteps = samsungResult.status === 'fulfilled'
      ? (samsungResult.value?.COUNT_TOTAL ?? 0)
      : 0;

    // Take max: Samsung Health authoritative total may differ from all-sources
    return Math.max(allSteps, samsungSteps);
  } catch {
    return 0;
  }
}

// ─── Heart rate ───────────────────────────────────────────────────────────────
// HeartRateRecord has a samples[] array with { beatsPerMinute } per measurement.
// Average all samples from all records for the day.
export async function getTodayHeartRate() {
  if (Platform.OS !== 'android') return 0;
  try {
    await initialize();
    const { start, end } = getTodayRange();

    const { records } = await readRecords('HeartRate', {
      timeRangeFilter: { operator: 'between', startTime: start, endTime: end },
    });

    let total = 0;
    let count = 0;
    for (const rec of (records || [])) {
      for (const sample of (rec.samples || [])) {
        if (sample.beatsPerMinute > 0) {
          total += sample.beatsPerMinute;
          count++;
        }
      }
    }
    return count > 0 ? Math.round(total / count) : 0;
  } catch {
    return 0;
  }
}

// ─── Calories burned ──────────────────────────────────────────────────────────
// Try ActiveCaloriesBurned first; fall back to TotalCaloriesBurned.
// Each record has an `energy: { inKilocalories }` field.
export async function getTodayActiveCalories() {
  if (Platform.OS !== 'android') return 0;
  try {
    await initialize();
    const { start, end } = getTodayRange();

    const [activeResult, totalResult] = await Promise.allSettled([
      readRecords('ActiveCaloriesBurned', {
        timeRangeFilter: { operator: 'between', startTime: start, endTime: end },
      }),
      readRecords('TotalCaloriesBurned', {
        timeRangeFilter: { operator: 'between', startTime: start, endTime: end },
      }),
    ]);

    const active = activeResult.status === 'fulfilled'
      ? Math.round(
          (activeResult.value.records || []).reduce(
            (s, r) => s + (r.energy?.inKilocalories ?? 0), 0
          )
        )
      : 0;

    const total = totalResult.status === 'fulfilled'
      ? Math.round(
          (totalResult.value.records || []).reduce(
            (s, r) => s + (r.energy?.inKilocalories ?? 0), 0
          )
        )
      : 0;

    return active > 0 ? active : total;
  } catch {
    return 0;
  }
}

// ─── Combined fetch ───────────────────────────────────────────────────────────
export async function getTodayStepsAndCal() {
  const [steps, cal] = await Promise.all([getTodaySteps(), getTodayActiveCalories()]);
  return { steps, cal };
}

// ─── Step → kcal estimate (fallback when Health Connect has no calories) ──────
export function stepsToKcal(steps) {
  return Math.round(steps * 0.04);
}

// ─── Diagnostic helper (for debugging) ───────────────────────────────────────
export async function getHealthDiag() {
  if (Platform.OS !== 'android') {
    return { ok: false, sdkStatus: 'not_android', steps: 0, hr: 0, cal: 0, error: null };
  }
  try {
    const sdkStatus = await getSdkStatus();
    await initialize();
    const [steps, hr, cal] = await Promise.all([
      getTodaySteps(),
      getTodayHeartRate(),
      getTodayActiveCalories(),
    ]);
    return { ok: true, sdkStatus, steps, hr, cal, error: null };
  } catch (e) {
    return { ok: false, sdkStatus: 'error', steps: 0, hr: 0, cal: 0, error: e?.message ?? String(e) };
  }
}
