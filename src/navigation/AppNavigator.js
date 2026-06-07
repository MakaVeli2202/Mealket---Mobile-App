import React, { useRef } from 'react';
import { Platform, StyleSheet, Animated, View } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme, getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import PasteScreen from '../screens/PasteScreen';
import ReviewScreen from '../screens/ReviewScreen';
import ChecklistScreen from '../screens/ChecklistScreen';
import HistoryScreen from '../screens/HistoryScreen';
import SettingsScreen from '../screens/SettingsScreen';
import CaloriesScreen from '../screens/CaloriesScreen';
import MealDetailScreen from '../screens/MealDetailScreen';
import AddFoodScreen from '../screens/AddFoodScreen';
import CalorieHistoryScreen from '../screens/CalorieHistoryScreen';
import CameraLabelScreen from '../screens/CameraLabelScreen';
import BarcodeScannerScreen from '../screens/BarcodeScannerScreen';
import ProfilScreen from '../screens/ProfilScreen';
import FastingScreen from '../screens/FastingScreen';
import DayDetailScreen from '../screens/DayDetailScreen';
import { useSettings } from '../context/SettingsContext';

const Stack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();

function ShoppingStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Paste" component={PasteScreen} />
      <Stack.Screen name="Review" component={ReviewScreen} />
      <Stack.Screen name="Checklist" component={ChecklistScreen} />
      <Stack.Screen name="History" component={HistoryScreen} />
    </Stack.Navigator>
  );
}

function CalorieStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Calories" component={CaloriesScreen} />
      <Stack.Screen name="DayDetail" component={DayDetailScreen} />
      <Stack.Screen name="MealDetail" component={MealDetailScreen} />
      <Stack.Screen name="AddFood" component={AddFoodScreen} />
      <Stack.Screen name="CalorieHistory" component={CalorieHistoryScreen} />
      <Stack.Screen name="CameraLabel" component={CameraLabelScreen} />
      <Stack.Screen name="BarcodeScanner" component={BarcodeScannerScreen} />
    </Stack.Navigator>
  );
}

function FastingStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Fasting" component={FastingScreen} />
    </Stack.Navigator>
  );
}

function ProfilStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Profil" component={ProfilScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
    </Stack.Navigator>
  );
}

export default function AppNavigator({ navigationRef }) {
  const { theme, tr, isDark } = useSettings();

  const navTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      background: theme.bg,
      card: theme.bg,
      text: theme.text,
      border: theme.border,
    },
  };

  const tabIcons = {
    ShoppingTab: { focused: 'cart-sharp', outline: 'cart-outline' },
    CalorieTab:  { focused: 'journal-sharp', outline: 'journal-outline' },
    FastingTab:  { focused: 'time-sharp', outline: 'time-outline' },
    ProfilTab:   { focused: 'person-sharp', outline: 'person-outline' },
  };

  return (
    <NavigationContainer ref={navigationRef} theme={navTheme}>
      <Tabs.Navigator
        screenOptions={({ route }) => {
          const focusedRoute = getFocusedRouteNameFromRoute(route);
          const hideTab = focusedRoute === 'CameraLabel' || focusedRoute === 'BarcodeScanner';
          return {
            headerShown: false,
            tabBarStyle: {
              display: hideTab ? 'none' : 'flex',
              backgroundColor: 'transparent',
              position: 'absolute',
              borderTopWidth: 0,
              height: Platform.OS === 'ios' ? 96 : 78,
              paddingBottom: Platform.OS === 'ios' ? 28 : 8,
              paddingTop: 10,
              elevation: 0,
            },
            tabBarBackground: () => (
              <LinearGradient
                colors={[theme.bg + 'F2', theme.bg]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={{ flex: 1 }}
              />
            ),
            tabBarActiveTintColor: theme.accent,
            tabBarInactiveTintColor: theme.textMuted,
            tabBarLabelStyle: { fontSize: 11, fontWeight: '700', letterSpacing: 0.2 },
            tabBarIcon: ({ color, focused, size }) => {
              const ico = tabIcons[route.name];
              if (!ico) return null;
              return (
                <View style={styles.tabIconWrap}>
                  {focused && <View style={[styles.tabPill, { backgroundColor: theme.accent }]} />}
                  <Ionicons
                    name={focused ? ico.focused : ico.outline}
                    size={focused ? 26 : 22}
                    color={color}
                  />
                </View>
              );
            },
          };
        }}
      >
        <Tabs.Screen
          name="ShoppingTab"
          component={ShoppingStack}
          options={{ tabBarLabel: tr.tabs.shopping }}
        />
        <Tabs.Screen
          name="CalorieTab"
          component={CalorieStack}
          options={{ tabBarLabel: tr.tabs.calories }}
        />
        <Tabs.Screen
          name="FastingTab"
          component={FastingStack}
          options={{ tabBarLabel: tr.tabs.fasting ?? 'Fasten' }}
        />
        <Tabs.Screen
          name="ProfilTab"
          component={ProfilStack}
          options={{ tabBarLabel: tr.tabs.profil ?? 'Profil' }}
        />
      </Tabs.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabIconWrap: {
    width: 44, height: 32,
    alignItems: 'center', justifyContent: 'center',
  },
  tabPill: {
    position: 'absolute',
    width: 28, height: 4,
    borderRadius: 2,
    bottom: -2,
  },
});
