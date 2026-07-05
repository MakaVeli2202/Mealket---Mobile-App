import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { todayStr } from '../utils/date';

const KEY = '@mealket_calories';
const FOODS_KEY = '@mealket_saved_foods';
const PLATES_KEY = '@mealket_saved_plates';
const NINETY = 90 * 24 * 60 * 60 * 1000;

const CalorieContext = createContext(null);


export function CalorieProvider({ children }) {
  const [entries, setEntries] = useState([]);
  const [savedFoods, setSavedFoods] = useState([]);
  const [savedPlates, setSavedPlates] = useState([]);

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
    AsyncStorage.getItem(FOODS_KEY).then((raw) => {
      if (!raw) return;
      try { setSavedFoods(JSON.parse(raw)); } catch (_) {}
    });
    AsyncStorage.getItem(PLATES_KEY).then((raw) => {
      if (!raw) return;
      try { setSavedPlates(JSON.parse(raw)); } catch (_) {}
    });
  }, []);

  const persist = useCallback((updated) => {
    setEntries(updated);
    AsyncStorage.setItem(KEY, JSON.stringify(updated)).catch(() => {});
  }, []);

  const saveFood = useCallback((food) => {
    if (!food.name) return;
    setSavedFoods((prev) => {
      const existing = prev.find((f) => f.name.toLowerCase() === food.name.toLowerCase());
      const dupes = prev.filter((f) => f.name.toLowerCase() !== food.name.toLowerCase());
      const next = [{ ...food, type: food.type || existing?.type || 'food' }, ...dupes];
      AsyncStorage.setItem(FOODS_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const removeSavedFood = useCallback((name) => {
    setSavedFoods((prev) => {
      const next = prev.filter((f) => f.name.toLowerCase() !== name.toLowerCase());
      AsyncStorage.setItem(FOODS_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const savePlate = useCallback((plate) => {
    setSavedPlates((prev) => {
      const deduped = prev.filter((p) => p.id !== plate.id);
      const next = [plate, ...deduped];
      AsyncStorage.setItem(PLATES_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const removePlate = useCallback((id) => {
    setSavedPlates((prev) => {
      const next = prev.filter((p) => p.id !== id);
      AsyncStorage.setItem(PLATES_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
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
    setEntries((prev) => {
      const next = [full, ...prev];
      AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const removeEntry = useCallback((id) => {
    setEntries((prev) => {
      const next = prev.filter((e) => e.id !== id);
      AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const updateEntry = useCallback((id, newAmountG) => {
    setEntries((prev) => {
      const next = prev.map((e) => {
        if (e.id !== id) return e;
        const factor = newAmountG / 100;
        // Derive per-100g from stored totals for legacy entries missing these fields
        const oldFactor = (e.amountG || 100) / 100;
        const kcalP100  = e.kcalPer100g    ?? (oldFactor > 0 ? (e.calories  || 0) / oldFactor : 0);
        const protP100  = e.proteinPer100g ?? (oldFactor > 0 ? (e.proteinG  || 0) / oldFactor : 0);
        const carbP100  = e.carbsPer100g   ?? (oldFactor > 0 ? (e.carbsG    || 0) / oldFactor : 0);
        const fatP100   = e.fatPer100g     ?? (oldFactor > 0 ? (e.fatG      || 0) / oldFactor : 0);
        const sugarP100 = e.sugarPer100g   ?? (oldFactor > 0 ? (e.sugarG    || 0) / oldFactor : 0);
        return {
          ...e,
          amountG: newAmountG,
          calories: Math.round(kcalP100  * factor),
          proteinG: Math.round(protP100  * factor * 10) / 10,
          carbsG:   Math.round(carbP100  * factor * 10) / 10,
          fatG:     Math.round(fatP100   * factor * 10) / 10,
          sugarG:   Math.round(sugarP100 * factor * 10) / 10,
        };
      });
      AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

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
      entries, addEntry, removeEntry, updateEntry,
      todayEntries, todayByMeal, entriesByDate,
      savedFoods, saveFood, removeSavedFood,
      savedPlates, savePlate, removePlate,
    }}>
      {children}
    </CalorieContext.Provider>
  );
}

export function useCalories() { return useContext(CalorieContext); }
