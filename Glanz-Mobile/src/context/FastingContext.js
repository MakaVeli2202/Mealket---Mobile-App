import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@mealket_fasting';
const HISTORY_KEY = '@mealket_fasting_history';

const FastingContext = createContext(null);

function addHoursToTime(timeStr, hours) {
  const [h, m] = timeStr.split(':').map(Number);
  const total = (h + hours) % 24;
  const hh = String(total).padStart(2, '0');
  const mm = String(m).padStart(2, '0');
  return `${hh}:${mm}`;
}

function getTodaySeconds() {
  const n = new Date();
  return n.getHours() * 3600 + n.getMinutes() * 60 + n.getSeconds();
}

function getPhaseAtSecond(daySeconds, eatStartStr, eatWindowHours) {
  const [eh, em] = eatStartStr.split(':').map(Number);
  const eatStartSec = eh * 3600 + em * 60;
  const eatEndSec = (eatStartSec + eatWindowHours * 3600) % 86400;
  const fastWindowHours = 24 - eatWindowHours;

  let isFasting;
  let phaseStartSec;
  let phaseDurationSec;

  if (eatEndSec > eatStartSec) {
    if (daySeconds >= eatStartSec && daySeconds < eatEndSec) {
      isFasting = false;
      phaseStartSec = eatStartSec;
      phaseDurationSec = eatWindowHours * 3600;
    } else {
      isFasting = true;
      phaseStartSec = eatEndSec;
      phaseDurationSec = fastWindowHours * 3600;
      if (daySeconds < eatStartSec) {
        phaseStartSec = -(86400 - eatEndSec);
      }
    }
  } else {
    if (daySeconds >= eatStartSec || daySeconds < eatEndSec) {
      isFasting = false;
      phaseStartSec = daySeconds >= eatStartSec ? eatStartSec : eatStartSec - 86400;
      phaseDurationSec = eatWindowHours * 3600;
    } else {
      isFasting = true;
      phaseStartSec = eatEndSec;
      phaseDurationSec = fastWindowHours * 3600;
    }
  }

  let elapsedSec = daySeconds - phaseStartSec;
  if (elapsedSec < 0) elapsedSec += 86400;

  return { isFasting, elapsedSec, phaseDurationSec };
}

export function FastingProvider({ children }) {
  const [tracking, setTracking] = useState(false);
  const [eatingWindowHours, setEatingWindowHoursState] = useState(8);
  const [eatStart, setEatStartState] = useState('12:00');
  const [timeElapsedSeconds, setTimeElapsedSeconds] = useState(0);
  const [paused, setPaused] = useState(false);
  const [fastingHistory, setFastingHistory] = useState([]);

  const intervalRef    = useRef(null);
  const pauseStartRef  = useRef(null);
  const totalPausedRef = useRef(0);

  const fastingWindowHours = 24 - eatingWindowHours;
  const eatEndTime = addHoursToTime(eatStart, eatingWindowHours);
  const fastEndTime = eatStart;

  const phase = useMemo(() => {
    const daySec = getTodaySeconds();
    return getPhaseAtSecond(daySec, eatStart, eatingWindowHours);
  }, [eatStart, eatingWindowHours, timeElapsedSeconds]);

  // isFasting is only meaningful when the user has started tracking.
  // When not tracking, treat it as false so the UI shows the idle/start state.
  const isFasting = tracking ? phase.isFasting : false;

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(KEY),
      AsyncStorage.getItem(HISTORY_KEY),
    ]).then(([rawFasting, rawHistory]) => {
      if (rawFasting) {
        try {
          const saved = JSON.parse(rawFasting);
          if (saved.tracking !== undefined) setTracking(saved.tracking);
          if (saved.eatingWindowHours !== undefined) setEatingWindowHoursState(saved.eatingWindowHours);
          if (saved.eatStart !== undefined) setEatStartState(saved.eatStart);
        } catch (_) {}
      }
      if (rawHistory) {
        try {
          const parsed = JSON.parse(rawHistory);
          if (Array.isArray(parsed)) setFastingHistory(parsed);
        } catch (_) {}
      }
    });
  }, []);

  useEffect(() => {
    // Only run the timer when the user has explicitly started a fast.
    // When not tracking, reset elapsed time to 0 so the display is clean.
    if (!tracking) {
      setTimeElapsedSeconds(0);
      return;
    }

    const tick = () => {
      if (paused) return;
      const daySec = getTodaySeconds();
      const p = getPhaseAtSecond(daySec, eatStart, eatingWindowHours);
      setTimeElapsedSeconds(p.elapsedSec);
    };
    tick();
    intervalRef.current = setInterval(tick, 1000);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [tracking, paused, eatStart, eatingWindowHours]);

  const persist = useCallback((patch) => {
    AsyncStorage.getItem(KEY).then((raw) => {
      const existing = raw ? JSON.parse(raw) : {};
      AsyncStorage.setItem(KEY, JSON.stringify({ ...existing, ...patch })).catch(() => {});
    }).catch(() => {});
  }, []);

  const persistHistory = useCallback((history) => {
    AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history)).catch(() => {});
  }, []);

  const startFasting = useCallback(() => {
    totalPausedRef.current = 0;
    pauseStartRef.current = null;
    const daySec = getTodaySeconds();
    const p = getPhaseAtSecond(daySec, eatStart, eatingWindowHours);
    setTracking(true);
    setTimeElapsedSeconds(p.elapsedSec);
    setPaused(false);
    persist({ tracking: true });
  }, [persist, eatStart, eatingWindowHours]);

  const stopFasting = useCallback(() => {
    // Accumulate any remaining paused time before stopping
    if (pauseStartRef.current) {
      totalPausedRef.current += (Date.now() - pauseStartRef.current) / 1000;
      pauseStartRef.current = null;
    }
    const daySec = getTodaySeconds();
    const p = getPhaseAtSecond(daySec, eatStart, eatingWindowHours);
    const durationSeconds = Math.max(0, p.elapsedSec - Math.round(totalPausedRef.current));
    totalPausedRef.current = 0;

    const today = new Date();
    const entry = {
      id: Date.now().toString(),
      date: today.toISOString().slice(0, 10),
      startTime: new Date(Date.now() - durationSeconds * 1000).toISOString(),
      endTime: today.toISOString(),
      durationSeconds,
      eatingWindowHours,
      fastingWindowHours,
      completed: true,
    };

    setFastingHistory((prev) => {
      const updated = [entry, ...prev];
      persistHistory(updated);
      return updated;
    });

    setTracking(false);
    setPaused(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    persist({ tracking: false });
  }, [persist, persistHistory, eatStart, eatingWindowHours, fastingWindowHours]);

  const pauseFasting = useCallback(() => {
    if (!tracking || paused) return;
    pauseStartRef.current = Date.now();
    setPaused(true);
  }, [tracking, paused]);

  const resumeFasting = useCallback(() => {
    if (!tracking || !paused) return;
    if (pauseStartRef.current) {
      totalPausedRef.current += (Date.now() - pauseStartRef.current) / 1000;
      pauseStartRef.current = null;
    }
    setPaused(false);
  }, [tracking, paused]);

  const setEatingWindow = useCallback((hours) => {
    setEatingWindowHoursState(hours);
    persist({ eatingWindowHours: hours });
  }, [persist]);

  const setEatStart = useCallback((time) => {
    setEatStartState(time);
    persist({ eatStart: time });
  }, [persist]);

  return (
    <FastingContext.Provider value={{
      isFasting,
      tracking,
      eatingWindowHours,
      fastingWindowHours,
      eatStart,
      eatEndTime,
      fastEndTime,
      timeElapsedSeconds,
      phaseDurationSeconds: phase.phaseDurationSec,
      phaseProgress: phase.phaseDurationSec > 0 ? phase.elapsedSec / phase.phaseDurationSec : 0,
      paused,
      fastingHistory,
      startFasting,
      stopFasting,
      pauseFasting,
      resumeFasting,
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
