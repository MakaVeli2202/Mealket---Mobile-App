import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { todayStr } from '../utils/date';

const KEY = '@mealket_measurements';

const MeasurementContext = createContext(null);

const MEASUREMENT_TYPES = ['waist', 'chest', 'hips', 'neck', 'arms', 'thighs'];

const TYPE_UNITS = {
  waist: 'cm',
  chest: 'cm',
  hips: 'cm',
  neck: 'cm',
  arms: 'cm',
  thighs: 'cm',
};


export function MeasurementProvider({ children }) {
  const [measurements, setMeasurements] = useState([]);

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((raw) => {
      if (!raw) return;
      try { setMeasurements(JSON.parse(raw)); } catch (_) {}
    });
  }, []);

  const addMeasurement = useCallback((type, value) => {
    const entry = {
      id: Date.now().toString(),
      type,
      value: Math.round(value * 10) / 10,
      date: todayStr(),
      unit: TYPE_UNITS[type] || 'cm',
    };
    setMeasurements((prev) => {
      const next = [entry, ...prev];
      AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const removeMeasurement = useCallback((id) => {
    setMeasurements((prev) => {
      const next = prev.filter((m) => m.id !== id);
      AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const getMeasurementsByType = useCallback((type) => {
    return measurements.filter((m) => m.type === type).sort((a, b) => b.date.localeCompare(a.date));
  }, [measurements]);

  const latestByType = useMemo(() => {
    const map = {};
    measurements.forEach((m) => {
      if (!map[m.type] || m.date > map[m.type].date) map[m.type] = m;
    });
    return map;
  }, [measurements]);

  return (
    <MeasurementContext.Provider value={{
      measurements, addMeasurement, removeMeasurement, getMeasurementsByType,
      latestByType, MEASUREMENT_TYPES, TYPE_UNITS,
    }}>
      {children}
    </MeasurementContext.Provider>
  );
}

export function useMeasurements() { return useContext(MeasurementContext); }
