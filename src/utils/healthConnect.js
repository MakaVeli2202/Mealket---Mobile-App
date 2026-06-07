import { initialize, requestPermission, readRecords } from 'react-native-health-connect';

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
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const result = await readRecords('Steps', {
      timeRangeFilter: {
        operator: 'between',
        startTime: start.toISOString(),
        endTime: end.toISOString(),
      },
    });
    return result.records.reduce((sum, r) => sum + (r.count ?? 0), 0);
  } catch {
    return 0;
  }
}

export function stepsToKcal(steps) {
  return Math.round(steps * 0.04);
}
