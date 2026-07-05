import React, { createContext, useContext, useState } from 'react';
import { getTheme } from '../theme/theme';
import { translations } from '../constants/i18n';

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [isDark, setIsDark] = useState(true);
  const [language, setLanguage] = useState('en');

  const toggleDark = () => setIsDark((prev) => !prev);

  const theme = getTheme(isDark);
  const tr = translations[language] || translations.en;

  return (
    <SettingsContext.Provider value={{
      isDark, toggleDark,
      language, setLanguage,
      theme, tr,
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
