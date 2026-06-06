import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@einkauf_calories';
const NINETY = 90 * 24 * 60 * 60 * 1000;

const CalorieContext = createContext(null);

function todayStr() { return new Date().toISOString().slice(0, 10); }

export function CalorieProvider({ children }) {
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((raw) => {
      if (!raw) return;
      try {
        const all = JSON.parse(raw);
        const cutoff = Date.now() - NINETY;
        const fresh = all.filter((e) => new Date(e.date).getTime() > cutoff);
        setEntries(fresh);
        if (fresh.length !== all.length) AsyncStorage.setItem(KEY, JSON.stringify(fresh));
      } catch (_) {}
    });
  }, []);

  const persist = useCallback((updated) => {
    setEntries(updated);
    AsyncStorage.setItem(KEY, JSON.stringify(updated)).catch(() => {});
  }, []);

  const addEntry = useCallback((entry) => {
    const amountG = entry.amountG || 100;
    const full = {
      id: Date.now().toString(),
      date: todayStr(),
      time: new Date().toLocaleTimeString('de-AT', { hour: '2-digit', minute: '2-digit' }),
      meal: entry.meal || 'snack',
      calories: Math.round((amountG / 100) * (entry.kcalPer100g || 0)),
      fatG: Math.round((amountG / 100) * (entry.fatPer100g || 0) * 10) / 10,
      carbsG: Math.round((amountG / 100) * (entry.carbsPer100g || 0) * 10) / 10,
      sugarG: Math.round((amountG / 100) * (entry.sugarPer100g || 0) * 10) / 10,
      proteinG: Math.round((amountG / 100) * (entry.proteinPer100g || 0) * 10) / 10,
      ...entry,
    };
    persist([full, ...entries]);
  }, [entries, persist]);

  const removeEntry = useCallback((id) => {
    persist(entries.filter((e) => e.id !== id));
  }, [entries, persist]);

  const todayEntries = useMemo(() =>
    entries.filter((e) => e.date === todayStr()), [entries]);

  const todayByMeal = useMemo(() => ({
    breakfast: todayEntries.filter((e) => e.meal === 'breakfast'),
    lunch: todayEntries.filter((e) => e.meal === 'lunch'),
    dinner: todayEntries.filter((e) => e.meal === 'dinner'),
    snack: todayEntries.filter((e) => e.meal === 'snack'),
  }), [todayEntries]);

  const entriesByDate = useMemo(() => entries.reduce((acc, e) => {
    if (!acc[e.date]) acc[e.date] = [];
    acc[e.date].push(e);
    return acc;
  }, {}), [entries]);

  return (
    <CalorieContext.Provider value={{
      entries, addEntry, removeEntry,
      todayEntries, todayByMeal, entriesByDate,
    }}>
      {children}
    </CalorieContext.Provider>
  );
}

export function useCalories() { return useContext(CalorieContext); }
