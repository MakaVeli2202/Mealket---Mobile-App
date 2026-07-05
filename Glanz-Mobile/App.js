import 'react-native-gesture-handler';
import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, Poppins_600SemiBold } from '@expo-google-fonts/poppins';
import { Inter_400Regular, Inter_700Bold } from '@expo-google-fonts/inter';
import { SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk';

import { SettingsProvider, useSettings } from './src/context/SettingsContext';
import { ShoppingProvider } from './src/context/ShoppingContext';
import { CalorieProvider } from './src/context/CalorieContext';
import { FastingProvider } from './src/context/FastingContext';
import { WeightProvider } from './src/context/WeightContext';
import { WellnessProvider } from './src/context/WellnessContext';
import { MeasurementProvider } from './src/context/MeasurementContext';
import { RecipeProvider } from './src/context/RecipeContext';
import { NotificationProvider } from './src/context/NotificationContext';
import { BudgetProvider } from './src/context/BudgetContext';
import AppNavigator from './src/navigation/AppNavigator';
import PermissionsGate from './src/screens/PermissionsGate';
import OnboardingScreen from './src/screens/OnboardingScreen';

function Root() {
  const { isDark, onboardingComplete } = useSettings();
  const [showPermissions, setShowPermissions] = useState(true);
  const [fontsLoaded] = useFonts({ Poppins_600SemiBold, Inter_400Regular, Inter_700Bold, SpaceGrotesk_700Bold });
  const [fontTimeout, setFontTimeout] = useState(false);
  useEffect(() => { const t = setTimeout(() => setFontTimeout(true), 5000); return () => clearTimeout(t); }, []);

  if (!fontsLoaded && !fontTimeout) return null;

  if (showPermissions) {
    return (
      <>
        <PermissionsGate onDone={() => setShowPermissions(false)} />
        <StatusBar style="light" />
      </>
    );
  }

  if (!onboardingComplete) {
    return (
      <>
        <OnboardingScreen />
        <StatusBar style="light" />
      </>
    );
  }

  return (
    <>
      <AppNavigator />
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SettingsProvider>
          <WeightProvider>
            <ShoppingProvider>
              <CalorieProvider>
                <FastingProvider>
                  <WellnessProvider>
                    <MeasurementProvider>
                      <RecipeProvider>
                        <NotificationProvider>
                          <BudgetProvider>
                            <Root />
                          </BudgetProvider>
                        </NotificationProvider>
                      </RecipeProvider>
                    </MeasurementProvider>
                  </WellnessProvider>
                </FastingProvider>
              </CalorieProvider>
            </ShoppingProvider>
          </WeightProvider>
        </SettingsProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
