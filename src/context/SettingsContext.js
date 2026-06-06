import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getTheme } from '../theme/theme';
import { translations } from '../constants/i18n';

const SETTINGS_KEY = '@einkauf_settings';

const GEMINI_DEFAULT = 'AQ.Ab8RN6Kgeuwrk5TwnS_cL0f6dU1FLENkBzkmD4-OddgNQb-DHQ';
const DEFAULT = { isDark: true, language: 'en', geminiKey: GEMINI_DEFAULT, calorieGoal: 2000 };

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [isDark, setIsDark] = useState(DEFAULT.isDark);
  const [language, setLanguage] = useState(DEFAULT.language);
  const [geminiKey, setGeminiKeyState] = useState(DEFAULT.geminiKey);
  const [calorieGoal, setCalorieGoalState] = useState(DEFAULT.calorieGoal);

  useEffect(() => {
    AsyncStorage.getItem(SETTINGS_KEY).then((raw) => {
      if (!raw) return;
      try {
        const saved = JSON.parse(raw);
        if (saved.isDark !== undefined) setIsDark(saved.isDark);
        if (saved.language) setLanguage(saved.language);
        if (saved.geminiKey !== undefined) setGeminiKeyState(saved.geminiKey || GEMINI_DEFAULT);
        if (saved.calorieGoal) setCalorieGoalState(Number(saved.calorieGoal) || 2000);
      } catch (_) {}
    });
  }, []);

  const buildState = useCallback((patch) => ({
    isDark, language, geminiKey, calorieGoal, ...patch,
  }), [isDark, language, geminiKey, calorieGoal]);

  const persist = useCallback((patch) => {
    AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(buildState(patch)));
  }, [buildState]);

  const toggleDark = useCallback(() => {
    setIsDark((prev) => { persist({ isDark: !prev }); return !prev; });
  }, [persist]);

  const setLang = useCallback((lang) => {
    setLanguage(lang);
    persist({ language: lang });
  }, [persist]);

  const setGeminiKey = useCallback((key) => {
    setGeminiKeyState(key);
    persist({ geminiKey: key });
  }, [persist]);

  const setCalorieGoal = useCallback((goal) => {
    const n = Number(goal) || 2000;
    setCalorieGoalState(n);
    persist({ calorieGoal: n });
  }, [persist]);

  const theme = getTheme(isDark);
  const tr = translations[language] || translations.en;

  return (
    <SettingsContext.Provider value={{
      isDark, toggleDark,
      language, setLanguage: setLang,
      geminiKey, setGeminiKey,
      calorieGoal, setCalorieGoal,
      theme, tr,
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
