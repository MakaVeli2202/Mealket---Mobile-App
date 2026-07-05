import AsyncStorage from '@react-native-async-storage/async-storage';

function escapeCSV(val) {
  const str = String(val ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function rowsToCSV(headers, rows) {
  const headerLine = headers.map(escapeCSV).join(',');
  const dataLines = rows.map((row) => headers.map((h) => escapeCSV(row[h])).join(','));
  return [headerLine, ...dataLines].join('\n');
}

export async function exportDataToCSV() {
  const sections = [];

  try {
    const caloriesRaw = await AsyncStorage.getItem('@mealket_calories');
    const calories = caloriesRaw ? JSON.parse(caloriesRaw) : [];
    if (calories.length > 0) {
      const headers = ['date', 'meal', 'name', 'calories', 'fatG', 'carbsG', 'proteinG', 'sugarG'];
      sections.push('=== CALORIE ENTRIES ===');
      sections.push(rowsToCSV(headers, calories));
    }
  } catch (_) {}

  try {
    const weightRaw = await AsyncStorage.getItem('@mealket_weight');
    if (weightRaw) {
      const weight = JSON.parse(weightRaw);
      const history = weight.weightHistory || [];
      if (history.length > 0) {
        const headers = ['date', 'kg'];
        sections.push('=== WEIGHT HISTORY ===');
        sections.push(rowsToCSV(headers, history));
      }
      sections.push('=== WEIGHT GOALS ===');
      sections.push(`current,${weight.currentWeight ?? ''}`);
      sections.push(`goal,${weight.goalWeight ?? ''}`);
    }
  } catch (_) {}

  try {
    const waterRaw = await AsyncStorage.getItem('@mealket_water');
    const water = waterRaw ? JSON.parse(waterRaw) : [];
    if (water.length > 0) {
      const headers = ['id', 'date', 'amountMl', 'time'];
      sections.push('=== WATER LOGS ===');
      sections.push(rowsToCSV(headers, water));
    }
  } catch (_) {}

  try {
    const fastingRaw = await AsyncStorage.getItem('@mealket_fasting');
    if (fastingRaw) {
      const fasting = JSON.parse(fastingRaw);
      const history = fasting.fastingHistory || [];
      sections.push('=== FASTING HISTORY ===');
      if (history.length > 0) {
        const headers = ['date', 'startTime', 'endTime', 'durationSeconds', 'completed'];
        sections.push(rowsToCSV(headers, history));
      }
    }
  } catch (_) {}

  try {
    const measurementsRaw = await AsyncStorage.getItem('@mealket_measurements');
    const measurements = measurementsRaw ? JSON.parse(measurementsRaw) : [];
    if (measurements.length > 0) {
      const headers = ['id', 'type', 'value', 'date', 'unit'];
      sections.push('=== BODY MEASUREMENTS ===');
      sections.push(rowsToCSV(headers, measurements));
    }
  } catch (_) {}

  return sections.join('\n\n');
}

export async function exportDataToJSON() {
  const result = {};

  try {
    const caloriesRaw = await AsyncStorage.getItem('@mealket_calories');
    if (caloriesRaw) result.calorieEntries = JSON.parse(caloriesRaw);
  } catch (_) {}

  try {
    const weightRaw = await AsyncStorage.getItem('@mealket_weight');
    if (weightRaw) result.weightData = JSON.parse(weightRaw);
  } catch (_) {}

  try {
    const waterRaw = await AsyncStorage.getItem('@mealket_water');
    if (waterRaw) result.waterLogs = JSON.parse(waterRaw);
  } catch (_) {}

  try {
    const fastingRaw = await AsyncStorage.getItem('@mealket_fasting');
    if (fastingRaw) result.fasting = JSON.parse(fastingRaw);
  } catch (_) {}

  try {
    const measurementsRaw = await AsyncStorage.getItem('@mealket_measurements');
    if (measurementsRaw) result.bodyMeasurements = JSON.parse(measurementsRaw);
  } catch (_) {}

  try {
    const savedFoodsRaw = await AsyncStorage.getItem('@mealket_saved_foods');
    if (savedFoodsRaw) result.savedFoods = JSON.parse(savedFoodsRaw);
  } catch (_) {}

  try {
    const savedPlatesRaw = await AsyncStorage.getItem('@mealket_saved_plates');
    if (savedPlatesRaw) result.savedPlates = JSON.parse(savedPlatesRaw);
  } catch (_) {}

  try {
    const moodRaw = await AsyncStorage.getItem('@mealket_mood');
    if (moodRaw) result.moodLogs = JSON.parse(moodRaw);
  } catch (_) {}

  try {
    const notesRaw = await AsyncStorage.getItem('@mealket_notes');
    if (notesRaw) result.notes = JSON.parse(notesRaw);
  } catch (_) {}

  return result;
}
