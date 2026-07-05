import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getTheme } from '../theme/theme';
import { translations } from '../constants/i18n';

const SETTINGS_KEY = '@mealket_settings';
const SettingsContext = createContext(null);

// Mifflin-St Jeor BMR
function calcBMR(weightKg, heightCm, age, sex) {
  const w = weightKg || 70;
  const h = heightCm || 173;
  const a = age || 25;
  if (sex === 'female') return Math.round(10 * w + 6.25 * h - 5 * a - 161);
  return Math.round(10 * w + 6.25 * h - 5 * a + 5);
}

// TDEE from BMR × activity multiplier
const ACTIVITY_FACTORS = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export function computeTDEE(weightKg, heightCm, age, sex, activity = 'moderate') {
  const bmr = calcBMR(weightKg, heightCm, age, sex);
  return Math.round(bmr * (ACTIVITY_FACTORS[activity] || 1.55));
}

export function computeBMI(weightKg, heightCm) {
  if (!weightKg || !heightCm) return null;
  return Math.round((weightKg / Math.pow(heightCm / 100, 2)) * 10) / 10;
}

export function bmiCategory(bmi) {
  if (!bmi) return '';
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
}

export function SettingsProvider({ children }) {
  const [isDark, setIsDark] = useState(true);
  const [language, setLanguageState] = useState('en');
  const [calorieGoal, setCalorieGoalState] = useState(2000);
  const [carbGoal, setCarbGoalState] = useState(250);
  const [proteinGoal, setProteinGoalState] = useState(150);
  const [fatGoal, setFatGoalState] = useState(65);
  const [heightCm, setHeightCmState] = useState(173);
  const [age, setAgeState] = useState(25);
  const [sex, setSexState] = useState('male');
  const [activityLevel, setActivityLevelState] = useState('moderate');
  const [geminiKey, setGeminiKeyState] = useState('');
  const [userName, setUserNameState] = useState('');
  const [onboardingComplete, setOnboardingCompleteState] = useState(false);
  const [stepsGoal, setStepsGoalState] = useState(10000);

  // In-memory cache to avoid async read-then-merge race on rapid persist calls
  const settingsCache = React.useRef({});

  useEffect(() => {
    AsyncStorage.getItem(SETTINGS_KEY).then((raw) => {
      if (!raw) return;
      try {
        const s = JSON.parse(raw);
        settingsCache.current = s;
        if (s.isDark !== undefined) setIsDark(s.isDark);
        if (s.language) setLanguageState(s.language);
        if (s.calorieGoal != null) setCalorieGoalState(s.calorieGoal);
        if (s.carbGoal != null) setCarbGoalState(s.carbGoal);
        if (s.proteinGoal != null) setProteinGoalState(s.proteinGoal);
        if (s.fatGoal != null) setFatGoalState(s.fatGoal);
        if (s.heightCm != null) setHeightCmState(s.heightCm);
        if (s.age != null) setAgeState(s.age);
        if (s.sex != null) setSexState(s.sex);
        if (s.activityLevel != null) setActivityLevelState(s.activityLevel);
        if (s.geminiKey != null) setGeminiKeyState(s.geminiKey);
        if (s.userName != null) setUserNameState(s.userName);
        if (s.onboardingComplete != null) setOnboardingCompleteState(s.onboardingComplete);
        if (s.stepsGoal != null) setStepsGoalState(s.stepsGoal);
      } catch (_) {}
    });
  }, []);

  const persist = useCallback((patch) => {
    settingsCache.current = { ...settingsCache.current, ...patch };
    AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settingsCache.current)).catch(() => {});
  }, []);

  const toggleDark = () => {
    setIsDark((prev) => { const next = !prev; persist({ isDark: next }); return next; });
  };

  const setLanguage = (lang) => { setLanguageState(lang); persist({ language: lang }); };
  const setCalorieGoal = (val) => { setCalorieGoalState(val); persist({ calorieGoal: val }); };
  const setCarbGoal = (val) => { setCarbGoalState(val); persist({ carbGoal: val }); };
  const setProteinGoal = (val) => { setProteinGoalState(val); persist({ proteinGoal: val }); };
  const setFatGoal = (val) => { setFatGoalState(val); persist({ fatGoal: val }); };
  const setHeightCm = (val) => { setHeightCmState(val); persist({ heightCm: val }); };
  const setAge = (val) => { setAgeState(val); persist({ age: val }); };
  const setSex = (val) => { setSexState(val); persist({ sex: val }); };
  const setActivityLevel = (val) => { setActivityLevelState(val); persist({ activityLevel: val }); };
  const setGeminiKey = (key) => { setGeminiKeyState(key); persist({ geminiKey: key }); };
  const setUserName = (name) => { setUserNameState(name); persist({ userName: name }); };
  const setOnboardingComplete = (val) => { setOnboardingCompleteState(val); persist({ onboardingComplete: val }); };
  const setStepsGoal = (val) => { setStepsGoalState(val); persist({ stepsGoal: val }); };

  // Legacy alias
  const computeBMR = useCallback((weightKg) => calcBMR(weightKg, heightCm, age, sex), [heightCm, age, sex]);

  const theme = getTheme(isDark);
  const tr = translations[language] || translations.en;

  return (
    <SettingsContext.Provider value={{
      isDark, toggleDark,
      language, setLanguage,
      theme, tr,
      calorieGoal, setCalorieGoal,
      carbGoal, setCarbGoal,
      proteinGoal, setProteinGoal,
      fatGoal, setFatGoal,
      heightCm, setHeightCm,
      age, setAge,
      sex, setSex,
      activityLevel, setActivityLevel,
      computeBMR,
      geminiKey, setGeminiKey,
      userName, setUserName,
      onboardingComplete, setOnboardingComplete,
      stepsGoal, setStepsGoal,
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
