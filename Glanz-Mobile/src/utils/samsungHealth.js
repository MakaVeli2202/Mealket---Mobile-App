import { Platform, NativeModules } from 'react-native';
import { isHealthConnectAvailable } from './healthConnect';

const SH = NativeModules.SamsungHealth;

export async function isSamsungHealthAvailable() {
  if (Platform.OS !== 'android' || !SH) return false;
  try {
    return await SH.isAvailable();
  } catch {
    return false;
  }
}

export async function getSamsungTodaySteps() {
  if (Platform.OS !== 'android' || !SH) return { steps: 0, calories: 0 };
  try {
    const result = await SH.getTodaySteps();
    return {
      steps: result.steps ?? 0,
      calories: Math.round(result.calories ?? 0),
    };
  } catch {
    return { steps: 0, calories: 0 };
  }
}

export async function getSamsungTodayCalories() {
  if (Platform.OS !== 'android' || !SH) return 0;
  try {
    const result = await SH.getTodayCalories();
    return Math.round(result?.calories ?? result ?? 0);
  } catch {
    try {
      const steps = await SH.getTodaySteps();
      return Math.round(steps?.calories ?? 0);
    } catch {
      return 0;
    }
  }
}

export async function getSamsungTodayHeartRate() {
  if (Platform.OS !== 'android' || !SH) return 0;
  try {
    const result = await SH.getTodayHeartRate();
    return Math.round(result?.bpm ?? result ?? 0);
  } catch {
    return 0;
  }
}

export async function getSamsungTodayAll() {
  const [stepsRes, calRes, hrRes] = await Promise.all([
    getSamsungTodaySteps(),
    getSamsungTodayCalories(),
    getSamsungTodayHeartRate(),
  ]);
  return {
    steps: stepsRes.steps,
    stepCalories: stepsRes.calories,
    activeCalories: calRes,
    heartRate: hrRes,
  };
}

export async function getHealthDiag() {
  const diag = { hcAvailable: false, shAvailable: false, status: '' };
  diag.hcAvailable = await isHealthConnectAvailable();
  diag.shAvailable = await isSamsungHealthAvailable();
  if (diag.shAvailable) {
    diag.status = 'Samsung Health SDK ready';
  } else if (diag.hcAvailable) {
    diag.status = 'Health Connect ready (connect Samsung Health in settings)';
  } else {
    diag.status = 'No health data source available';
  }
  return diag;
}
