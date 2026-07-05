import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { todayStr } from '../utils/date';

const KEY = '@mealket_weight';

const WeightContext = createContext(null);


export function WeightProvider({ children }) {
  const [currentWeight, setCurrentWeightState] = useState(85);
  const [goalWeight, setGoalWeightState] = useState(75);
  const [weightHistory, setWeightHistoryState] = useState([]);

  const stateRef = useRef({ currentWeight: 85, goalWeight: 75, weightHistory: [] });

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((raw) => {
      if (!raw) return;
      try {
        const saved = JSON.parse(raw);
        if (saved.currentWeight !== undefined) {
          setCurrentWeightState(saved.currentWeight);
          stateRef.current.currentWeight = saved.currentWeight;
        }
        if (saved.goalWeight !== undefined) {
          setGoalWeightState(saved.goalWeight);
          stateRef.current.goalWeight = saved.goalWeight;
        }
        if (Array.isArray(saved.weightHistory)) {
          setWeightHistoryState(saved.weightHistory);
          stateRef.current.weightHistory = saved.weightHistory;
        }
      } catch (_) {}
    });
  }, []);

  const persist = useCallback(() => {
    AsyncStorage.setItem(KEY, JSON.stringify(stateRef.current)).catch(() => {});
  }, []);

  const setWeight = useCallback((kg) => {
    const rounded = Math.round(kg * 10) / 10;
    const today = todayStr();
    setCurrentWeightState(rounded);
    stateRef.current.currentWeight = rounded;

    const filtered = stateRef.current.weightHistory.filter((e) => e.date !== today);
    const updated = [{ date: today, kg: rounded }, ...filtered].slice(0, 365);
    setWeightHistoryState(updated);
    stateRef.current.weightHistory = updated;
    persist();
  }, [persist]);

  const setGoalWeight = useCallback((kg) => {
    const rounded = Math.round(kg * 10) / 10;
    setGoalWeightState(rounded);
    stateRef.current.goalWeight = rounded;
    persist();
  }, [persist]);

  return (
    <WeightContext.Provider value={{
      currentWeight,
      goalWeight,
      weightHistory,
      setWeight,
      setGoalWeight,
    }}>
      {children}
    </WeightContext.Provider>
  );
}

export function useWeight() { return useContext(WeightContext); }
