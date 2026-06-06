/**
 * Health Connect stub — react-native-health-connect removed due to Gradle
 * incompatibility with Expo SDK 56. Re-add when a compatible version is available.
 *
 * All functions return 0 / false — the UI gracefully shows '—' for steps.
 */

export async function requestStepsPermission() {
  return false;
}

export async function getTodaySteps() {
  return 0;
}

export function stepsToKcal(steps) {
  return Math.round(steps * 0.04);
}
