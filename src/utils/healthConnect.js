/**
 * Samsung Watch / Android Health Connect step counter.
 *
 * Requires: npx expo install react-native-health-connect
 * Then rebuild with EAS: eas build --platform android
 *
 * Samsung Health syncs automatically to Android Health Connect (Android 9+).
 * Galaxy Watch -> Samsung Health app -> Health Connect -> this app.
 */

let HC = null;
try {
  // Dynamic import so the app doesn't crash if the package isn't installed
  HC = require('react-native-health-connect');
} catch (_) {
  // Package not installed — graceful degradation
}

const STEPS_RECORD = 'Steps';

/**
 * Request Health Connect read permission for Steps.
 * Returns true if granted, false if denied or unavailable.
 */
export async function requestStepsPermission() {
  if (!HC) return false;
  try {
    const { initialize, requestPermission } = HC;
    const available = await initialize();
    if (!available) return false;
    const granted = await requestPermission([
      { accessType: 'read', recordType: STEPS_RECORD },
    ]);
    return granted.some((g) => g.recordType === STEPS_RECORD && g.accessType === 'read');
  } catch (_) {
    return false;
  }
}

/**
 * Read today's step count from Health Connect.
 * Returns the step count as a number, or 0 if unavailable.
 */
export async function getTodaySteps() {
  if (!HC) return 0;
  try {
    const { initialize, readRecords } = HC;
    const available = await initialize();
    if (!available) return 0;

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const result = await readRecords(STEPS_RECORD, {
      timeRangeFilter: {
        operator: 'between',
        startTime: startOfDay.toISOString(),
        endTime: now.toISOString(),
      },
    });

    const total = (result.records || []).reduce(
      (sum, r) => sum + (r.count ?? 0),
      0,
    );
    return total;
  } catch (_) {
    return 0;
  }
}

/** Rough kcal estimate: ~0.04 kcal per step (70kg person walking). */
export function stepsToKcal(steps) {
  return Math.round(steps * 0.04);
}
