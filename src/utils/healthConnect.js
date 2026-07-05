import { initialize, requestPermission, aggregateRecord } from 'react-native-health-connect';

export async function requestStepsPermission() {
  try {
    const ok = await initialize();
    if (!ok) return false;
    const granted = await requestPermission([{ accessType: 'read', recordType: 'Steps' }]);
    return granted.length > 0;
  } catch {
    return false;
  }
}

export async function getTodaySteps() {
  try {
    const ok = await initialize();
    if (!ok) return 0;
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();
    const result = await aggregateRecord({
      recordType: 'Steps',
      timeRangeFilter: {
        operator: 'between',
        startTime: start,
        endTime: end,
      },
    });
    return Math.round(result.COUNT_TOTAL ?? 0);
  } catch {
    return 0;
  }
}

export async function getTodayStepsAndCal() {
  const steps = await getTodaySteps();
  return { steps, cal: stepsToKcal(steps) };
}

export function stepsToKcal(steps) {
  return Math.round(steps * 0.04);
}
