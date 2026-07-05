import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

const NOTIFICATIONS_KEY = '@mealket_notifications';

const DEFAULT_PREFERENCES = {
  foodReminder: false,
  foodReminderTime: '08:00',
  waterReminder: true,
  waterReminderInterval: 60,
  weightReminder: false,
  weightReminderDay: 'Monday',
  weightReminderTime: '09:00',
  fastingReminder: true,
  fastingReminderTime: '16:00',
};

const DAY_NUM = { Sunday: 1, Monday: 2, Tuesday: 3, Wednesday: 4, Thursday: 5, Friday: 6, Saturday: 7 };

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const prefsRef = useRef(preferences);
  prefsRef.current = preferences;

  useEffect(() => {
    AsyncStorage.getItem(NOTIFICATIONS_KEY).then((raw) => {
      if (!raw) return;
      try { setPreferences((prev) => ({ ...prev, ...JSON.parse(raw) })); } catch (_) {}
    });
  }, []);

  const persist = useCallback((prefs) => {
    AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(prefs)).catch(() => {});
  }, []);

  const updateReminder = useCallback((type, settings) => {
    setPreferences((prev) => {
      const next = { ...prev, ...settings };
      persist(next);
      return next;
    });
  }, [persist]);

  const requestPermissions = useCallback(async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  }, []);

  const scheduleAllReminders = useCallback(async () => {
    const granted = await requestPermissions();
    if (!granted) return;

    await Notifications.cancelAllScheduledNotificationsAsync();

    const p = prefsRef.current;

    if (p.waterReminder) {
      try {
        await Notifications.scheduleNotificationAsync({
          content: { title: 'Water Reminder', body: 'Time to drink some water! Stay hydrated.' },
          trigger: { type: 'timeInterval', seconds: p.waterReminderInterval * 60, repeats: true },
        });
      } catch (_) {}
    }

    if (p.foodReminder) {
      const [h, m] = p.foodReminderTime.split(':').map(Number);
      try {
        await Notifications.scheduleNotificationAsync({
          content: { title: 'Food Reminder', body: 'Time to log your meal!' },
          trigger: { type: 'daily', hour: h, minute: m },
        });
      } catch (_) {}
    }

    if (p.weightReminder) {
      const [h, m] = (p.weightReminderTime || '09:00').split(':').map(Number);
      const weekday = DAY_NUM[p.weightReminderDay] || 2;
      try {
        await Notifications.scheduleNotificationAsync({
          content: { title: 'Weight Reminder', body: "Don't forget to log your weight today!" },
          trigger: { type: 'weekly', weekday, hour: h, minute: m },
        });
      } catch (_) {}
    }

    if (p.fastingReminder) {
      const [h, m] = p.fastingReminderTime.split(':').map(Number);
      try {
        await Notifications.scheduleNotificationAsync({
          content: { title: 'Fasting Reminder', body: 'Check your fasting status!' },
          trigger: { type: 'daily', hour: h, minute: m },
        });
      } catch (_) {}
    }
  }, [requestPermissions]);

  const cancelAllReminders = useCallback(async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }, []);

  return (
    <NotificationContext.Provider value={{
      preferences,
      updateReminder,
      scheduleAllReminders,
      cancelAllReminders,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
