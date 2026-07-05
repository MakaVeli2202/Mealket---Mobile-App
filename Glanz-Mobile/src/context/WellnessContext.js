import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { todayStr } from '../utils/date';

const WATER_KEY = '@mealket_water';
const MOOD_KEY = '@mealket_mood';
const NOTES_KEY = '@mealket_notes';

const WellnessContext = createContext(null);


export function WellnessProvider({ children }) {
  const [waterLogs, setWaterLogs] = useState([]);
  const [moodLogs, setMoodLogs] = useState({});
  const [notesLogs, setNotesLogs] = useState({});

  useEffect(() => {
    AsyncStorage.getItem(WATER_KEY).then((raw) => {
      if (!raw) return;
      try { setWaterLogs(JSON.parse(raw)); } catch (_) {}
    });
    AsyncStorage.getItem(MOOD_KEY).then((raw) => {
      if (!raw) return;
      try { setMoodLogs(JSON.parse(raw)); } catch (_) {}
    });
    AsyncStorage.getItem(NOTES_KEY).then((raw) => {
      if (!raw) return;
      try { setNotesLogs(JSON.parse(raw)); } catch (_) {}
    });
  }, []);

  const todayWater = useMemo(() =>
    waterLogs.filter((w) => w.date === todayStr()).reduce((s, w) => s + (w.amountMl || 0), 0),
    [waterLogs]);

  const addWater = useCallback((amountMl) => {
    const entry = { id: Date.now().toString(), date: todayStr(), amountMl, time: new Date().toISOString() };
    setWaterLogs((prev) => {
      const next = [entry, ...prev];
      AsyncStorage.setItem(WATER_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const removeWater = useCallback((id) => {
    setWaterLogs((prev) => {
      const next = prev.filter((w) => w.id !== id);
      AsyncStorage.setItem(WATER_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const setMood = useCallback((mood) => {
    setMoodLogs((prev) => {
      const next = { ...prev, [todayStr()]: mood };
      AsyncStorage.setItem(MOOD_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const todayMood = useMemo(() => moodLogs[todayStr()] ?? null, [moodLogs]);

  const setNotes = useCallback((text) => {
    setNotesLogs((prev) => {
      const next = { ...prev, [todayStr()]: text };
      AsyncStorage.setItem(NOTES_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const todayNotes = useMemo(() => notesLogs[todayStr()] ?? '', [notesLogs]);
  const notesByDate = useMemo(() => notesLogs, [notesLogs]);

  return (
    <WellnessContext.Provider value={{
      waterLogs, addWater, removeWater, todayWater,
      setMood, todayMood,
      setNotes, todayNotes, notesByDate,
    }}>
      {children}
    </WellnessContext.Provider>
  );
}

export function useWellness() { return useContext(WellnessContext); }
