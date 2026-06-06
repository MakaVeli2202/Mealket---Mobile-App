import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@mealket_fasting';

const FastingContext = createContext(null);

function addHoursToTime(timeStr, hours) {
  // timeStr = "HH:MM", returns "HH:MM"
  const [h, m] = timeStr.split(':').map(Number);
  const total = (h + hours) % 24;
  const hh = String(total).padStart(2, '0');
  const mm = String(m).padStart(2, '0');
  return `${hh}:${mm}`;
}

export function FastingProvider({ children }) {
  const [isFasting, setIsFasting] = useState(false);
  const [fastingStart, setFastingStart] = useState(null);
  const [eatingWindowHours, setEatingWindowHoursState] = useState(8);
  const [eatStart, setEatStartState] = useState('12:00');
  const [timeElapsedSeconds, setTimeElapsedSeconds] = useState(0);

  const intervalRef = useRef(null);

  // Load from storage
  useEffect(() => {
    AsyncStorage.getItem(KEY).then((raw) => {
      if (!raw) return;
      try {
        const saved = JSON.parse(raw);
        if (saved.isFasting !== undefined) setIsFasting(saved.isFasting);
        if (saved.fastingStart !== undefined) setFastingStart(saved.fastingStart);
        if (saved.eatingWindowHours !== undefined) setEatingWindowHoursState(saved.eatingWindowHours);
        if (saved.eatStart !== undefined) setEatStartState(saved.eatStart);
      } catch (_) {}
    });
  }, []);

  // Interval for elapsed seconds
  useEffect(() => {
    if (isFasting && fastingStart) {
      const tick = () => {
        const elapsed = Math.floor((Date.now() - new Date(fastingStart).getTime()) / 1000);
        setTimeElapsedSeconds(Math.max(0, elapsed));
      };
      tick(); // immediate
      intervalRef.current = setInterval(tick, 1000);
    } else {
      setTimeElapsedSeconds(0);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isFasting, fastingStart]);

  const persist = useCallback((patch) => {
    AsyncStorage.getItem(KEY).then((raw) => {
      const existing = raw ? JSON.parse(raw) : {};
      const updated = { ...existing, ...patch };
      AsyncStorage.setItem(KEY, JSON.stringify(updated)).catch(() => {});
    }).catch(() => {});
  }, []);

  const startFasting = useCallback(() => {
    const now = new Date().toISOString();
    setIsFasting(true);
    setFastingStart(now);
    persist({ isFasting: true, fastingStart: now });
  }, [persist]);

  const stopFasting = useCallback(() => {
    setIsFasting(false);
    setFastingStart(null);
    persist({ isFasting: false, fastingStart: null });
  }, [persist]);

  const setEatingWindow = useCallback((hours) => {
    setEatingWindowHoursState(hours);
    persist({ eatingWindowHours: hours });
  }, [persist]);

  const setEatStart = useCallback((time) => {
    setEatStartState(time);
    persist({ eatStart: time });
  }, [persist]);

  const fastingWindowHours = 24 - eatingWindowHours;
  const eatEndTime = addHoursToTime(eatStart, eatingWindowHours);
  // fastEndTime = when fasting ends = eating window starts (eatStart)
  const fastEndTime = eatStart;

  return (
    <FastingContext.Provider value={{
      isFasting,
      fastingStart,
      eatingWindowHours,
      fastingWindowHours,
      eatStart,
      eatEndTime,
      fastEndTime,
      timeElapsedSeconds,
      startFasting,
      stopFasting,
      setEatingWindow,
      setEatStart,
    }}>
      {children}
    </FastingContext.Provider>
  );
}

export function useFasting() {
  return useContext(FastingContext);
}
