import React, { useEffect, useRef } from 'react';
import {
  Platform, StyleSheet, View, Text, TouchableOpacity, useWindowDimensions,
} from 'react-native';
import {
  NavigationContainer, DefaultTheme, DarkTheme, getFocusedRouteNameFromRoute,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming, withSequence,
} from 'react-native-reanimated';

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
import CreatePlateScreen from '../screens/CreatePlateScreen';
import { useSettings } from '../context/SettingsContext';
import LiquidGlassPill from '../components/LiquidGlassPill';

const Stack = createNativeStackNavigator();
const Tabs  = createBottomTabNavigator();

const TAB_COUNT  = 4;
const BAR_H      = Platform.OS === 'ios' ? 96 : 80;
const PILL_H     = 54;
const PILL_TOP   = Math.floor((BAR_H - PILL_H) / 2);

const TAB_CONFIG = [
  { name: 'ShoppingTab', icon: 'cart',    labelKey: 'shopping' },
  { name: 'CalorieTab',  icon: 'journal', labelKey: 'calories' },
  { name: 'FastingTab',  icon: 'time',    labelKey: 'fasting'  },
  { name: 'ProfilTab',   icon: 'person',  labelKey: 'profil'   },
];

// ─── Tab button ───────────────────────────────────────────────────────────────

function TabButton({ tab, focused, route, navigation }) {
  const { theme, tr } = useSettings();
  const label = tr.tabs[tab.labelKey] ?? tab.labelKey;

  const iconScale  = useSharedValue(focused ? 1.08 : 0.82);
  const iconOpac   = useSharedValue(focused ? 1    : 0.42);
  const pressScale = useSharedValue(1);

  useEffect(() => {
    iconScale.value = withSpring(focused ? 1.08 : 0.82, { damping: 14, stiffness: 260 });
    iconOpac.value  = withTiming(focused ? 1    : 0.42, { duration: 200 });
  }, [focused]);

  const iconAnim = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value * pressScale.value }],
    opacity:   iconOpac.value,
  }));

  return (
    <TouchableOpacity
      style={styles.tabBtn}
      activeOpacity={1}
      onPressIn={() => {
        pressScale.value = withSpring(0.84, { damping: 12, stiffness: 400 });
      }}
      onPressOut={() => {
        pressScale.value = withSpring(1.0,  { damping: 10, stiffness: 320 });
      }}
      onPress={() => {
        const event = navigation.emit({
          type: 'tabPress', target: route.key, canPreventDefault: true,
        });
        if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
      }}
      onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
    >
      <Animated.View style={[styles.iconWrap, iconAnim]}>
        <Ionicons
          name={focused ? `${tab.icon}-sharp` : `${tab.icon}-outline`}
          size={focused ? 22 : 20}
          color={focused ? theme.accent : theme.textMuted}
        />
      </Animated.View>
      <Text
        style={[styles.tabLabel, {
          color:      focused ? theme.accent    : theme.textMuted,
          opacity:    focused ? 1               : 0.48,
          fontWeight: focused ? '800'           : '600',
        }]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ─── Custom tab bar ───────────────────────────────────────────────────────────

function CustomTabBar({ state, navigation }) {
  const { theme } = useSettings();
  const { width: screenW } = useWindowDimensions();   // reactive to orientation changes

  const TAB_W  = screenW / TAB_COUNT;
  const PILL_W = Math.round(TAB_W - 10);

  const prevIdxRef = useRef(state.index);
  const pillX      = useSharedValue(state.index * TAB_W + 5);
  const pillSX     = useSharedValue(1);
  const pillSY     = useSharedValue(1);

  useEffect(() => {
    const prev = prevIdxRef.current;
    const next = state.index;
    prevIdxRef.current = next;

    const dist = Math.abs(next - prev);
    pillX.value = withSpring(next * TAB_W + 5, { damping: 16, stiffness: 180, mass: 0.85 });
    pillSX.value = withSequence(
      withTiming(1 + dist * 0.18,  { duration: 90 }),
      withSpring(1.0, { damping: 10, stiffness: 320 }),
    );
    pillSY.value = withSequence(
      withTiming(0.72, { duration: 90 }),
      withSpring(1.0,  { damping: 10, stiffness: 320 }),
    );
  }, [state.index, TAB_W]);

  const pillStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: pillX.value },
      { scaleX: pillSX.value },
      { scaleY: pillSY.value },
    ],
  }));

  const dark = theme.dark;

  return (
    <View style={[styles.tabBarOuter, { height: BAR_H }]} pointerEvents="box-none">

      {/* ── Bar blur — no overflow:hidden so dimezisBlurView works on Android ── */}
      <BlurView
        intensity={Platform.OS === 'ios' ? 100 : 60}
        tint={dark ? 'dark' : 'light'}
        experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
        style={StyleSheet.absoluteFill}
      />

      {/* ── Bar glass fill ── */}
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: dark
              ? 'rgba(255,255,255,0.04)'
              : 'rgba(255,255,255,0.12)',
          },
        ]}
      />

      {/* ── Kyant liquid glass pill ── */}
      <Animated.View
        style={[
          styles.pillWrap,
          { width: PILL_W, height: PILL_H, top: PILL_TOP },
          pillStyle,
        ]}
        pointerEvents="none"
      >
        <LiquidGlassPill
          dark={theme.dark}
          radius={PILL_H / 2}
        />
      </Animated.View>

      {/* ── Tab buttons ── */}
      <View style={styles.tabRow}>
        {TAB_CONFIG.map((tab, idx) => (
          <TabButton
            key={tab.name}
            tab={tab}
            idx={idx}
            focused={state.index === idx}
            route={state.routes[idx]}
            navigation={navigation}
          />
        ))}
      </View>
    </View>
  );
}

// ─── Stack navigators ─────────────────────────────────────────────────────────

function ShoppingStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="Paste"     component={PasteScreen} />
      <Stack.Screen name="Review"    component={ReviewScreen} />
      <Stack.Screen name="Checklist" component={ChecklistScreen} />
      <Stack.Screen name="History"   component={HistoryScreen} />
    </Stack.Navigator>
  );
}

function CalorieStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="Calories"       component={CaloriesScreen} />
      <Stack.Screen name="DayDetail"      component={DayDetailScreen} />
      <Stack.Screen name="MealDetail"     component={MealDetailScreen} />
      <Stack.Screen name="AddFood"        component={AddFoodScreen} />
      <Stack.Screen name="CalorieHistory" component={CalorieHistoryScreen} />
      <Stack.Screen name="CameraLabel"    component={CameraLabelScreen} />
      <Stack.Screen name="BarcodeScanner" component={BarcodeScannerScreen} />
      <Stack.Screen name="CreatePlate"    component={CreatePlateScreen} />
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
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="Profil"   component={ProfilScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
    </Stack.Navigator>
  );
}

// ─── Root navigator ───────────────────────────────────────────────────────────

function TabBarWrapper(props) {
  // Hide tab bar on camera/scanner screens
  const activeRoute = props.state.routes[props.state.index];
  const focusedName = getFocusedRouteNameFromRoute(activeRoute);
  if (focusedName === 'CameraLabel' || focusedName === 'BarcodeScanner') return null;
  return <CustomTabBar {...props} />;
}

export default function AppNavigator({ navigationRef }) {
  const { theme, isDark } = useSettings();

  const navTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      background: theme.bg,
      card:       theme.bg,
      text:       theme.text,
      border:     theme.border,
    },
  };

  return (
    <NavigationContainer ref={navigationRef} theme={navTheme}>
      <Tabs.Navigator
        tabBar={TabBarWrapper}
        screenOptions={{ headerShown: false }}
      >
        <Tabs.Screen name="ShoppingTab" component={ShoppingStack} />
        <Tabs.Screen name="CalorieTab"  component={CalorieStack} />
        <Tabs.Screen name="FastingTab"  component={FastingStack} />
        <Tabs.Screen name="ProfilTab"   component={ProfilStack} />
      </Tabs.Navigator>
    </NavigationContainer>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  tabBarOuter: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,

    elevation: 20,
    zIndex: 100,

    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 30,
    shadowOffset: {
      width: 0,
      height: -8,
    },
  },
  pillWrap: {
    position: 'absolute',
    // NO overflow:'hidden' — breaks Android BlurView
  },
  tabRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 22 : 0,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 10,
    letterSpacing: 0.2,
  },
});
