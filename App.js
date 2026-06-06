import 'react-native-gesture-handler';
import React, { useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Linking } from 'react-native';

import { SettingsProvider, useSettings } from './src/context/SettingsContext';
import { ShoppingProvider } from './src/context/ShoppingContext';
import { CalorieProvider } from './src/context/CalorieContext';
import { WeightProvider } from './src/context/WeightContext';
import { FastingProvider } from './src/context/FastingContext';
import AppNavigator from './src/navigation/AppNavigator';

function useShareHandler(navigationRef) {
  useEffect(() => {
    const handle = (url) => {
      if (!url) return;
      try {
        const parsed = new URL(url);
        const text = parsed.searchParams.get('text');
        if (text && navigationRef.current) {
          navigationRef.current.navigate('Shopping', {
            screen: 'Paste',
            params: { sharedText: decodeURIComponent(text) },
          });
        }
      } catch (_) {}
    };
    Linking.getInitialURL().then(handle);
    const sub = Linking.addEventListener('url', ({ url }) => handle(url));
    return () => sub.remove();
  }, [navigationRef]);
}

function Root({ navigationRef }) {
  const { isDark } = useSettings();
  useShareHandler(navigationRef);
  return (
    <>
      <ShoppingProvider>
        <CalorieProvider>
          <WeightProvider>
            <FastingProvider>
              <AppNavigator navigationRef={navigationRef} />
            </FastingProvider>
          </WeightProvider>
        </CalorieProvider>
      </ShoppingProvider>
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </>
  );
}

export default function App() {
  const navigationRef = useRef(null);
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SettingsProvider>
          <Root navigationRef={navigationRef} />
        </SettingsProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
