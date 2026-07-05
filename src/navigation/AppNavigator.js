import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import {
  NavigationContainer, DefaultTheme, DarkTheme,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { useSettings } from '../context/SettingsContext';

import ChecklistScreen from '../screens/ChecklistScreen';
import PasteScreen from '../screens/PasteScreen';
import ReviewScreen from '../screens/ReviewScreen';
import HistoryScreen from '../screens/HistoryScreen';
import CaloriesScreen from '../screens/CaloriesScreen';
import FastingScreen from '../screens/FastingScreen';
import ProfilScreen from '../screens/ProfilScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

const GOLD = '#d4a840';

const TAB_CFG = {
  ShoppingTab: { icon: 'cart-outline',          filled: 'cart',          labelKey: 'shopping' },
  DiaryTab:    { icon: 'journal-outline',       filled: 'journal',       labelKey: 'calories'  },
  FastingTab:  { icon: 'time-outline',          filled: 'time',          labelKey: 'fasting'   },
  ProfileTab:  { icon: 'person-circle-outline', filled: 'person-circle', labelKey: 'profil'    },
};

function FloatingTabBar({ state, navigation }) {
  const { tr } = useSettings();

  return (
    <View style={tb.outer} pointerEvents="box-none">
      <View style={tb.bar}>
        {Platform.OS === 'ios' ? (
          <BlurView
            intensity={88}
            tint="dark"
            style={[StyleSheet.absoluteFillObject, { borderRadius: 28, overflow: 'hidden' }]}
          />
        ) : (
          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(10,10,21,0.97)' }]} />
        )}
        <LinearGradient
          colors={['transparent', 'rgba(212,168,64,0.35)', 'rgba(180,180,200,0.20)', 'transparent']}
          locations={[0, 0.38, 0.62, 1]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={tb.shimmerLine}
          pointerEvents="none"
        />
        {state.routes.map((route, index) => {
          const cfg = TAB_CFG[route.name];
          if (!cfg) return null;
          const focused = state.index === index;
          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
          };

          return (
            <TouchableOpacity key={route.key} onPress={onPress} style={tb.tab} activeOpacity={0.7}>
              <View style={[tb.iconPill, focused && tb.iconPillActive]}>
                <Ionicons
                  name={focused ? cfg.filled : cfg.icon}
                  size={focused ? 24 : 21}
                  color={focused ? GOLD : 'rgba(255,255,255,0.58)'}
                />
              </View>
              <Text style={[tb.label, focused && tb.labelActive]}>
                {tr.tabs[cfg.labelKey]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{ headerShown: false }}
      sceneContainerStyle={{ backgroundColor: 'transparent' }}
    >
      <Tab.Screen name="ShoppingTab" component={ChecklistScreen} />
      <Tab.Screen name="DiaryTab"    component={CaloriesScreen} />
      <Tab.Screen name="FastingTab"  component={FastingScreen} />
      <Tab.Screen name="ProfileTab"  component={ProfilScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator({ navigationRef }) {
  const { theme, isDark } = useSettings();

  const navTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      primary:    GOLD,
      background: theme.bg,
      card:       theme.bg,
      text:       theme.text,
      border:     theme.border,
    },
  };

  return (
    <NavigationContainer ref={navigationRef} theme={navTheme}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="Main"           component={MainTabs} />
        <Stack.Screen name="Paste"          component={PasteScreen} />
        <Stack.Screen name="Review"         component={ReviewScreen} />
        <Stack.Screen name="Checklist"      component={ChecklistScreen} />
        <Stack.Screen name="History"        component={HistoryScreen} />
        <Stack.Screen name="Settings"       component={SettingsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const tb = StyleSheet.create({
  outer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 16, paddingBottom: 20,
  },
  bar: {
    flexDirection: 'row', alignItems: 'center',
    height: 72, borderRadius: 28, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(212,168,64,0.25)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.72, shadowRadius: 48, elevation: 30,
    backgroundColor: 'rgba(13,13,13,0.88)',
  },
  shimmerLine: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 1.5, zIndex: 2,
  },
  tab:           { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2, paddingVertical: 8 },
  iconPill:      { width: 46, height: 34, borderRadius: 13, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  iconPillActive:{ backgroundColor: 'rgba(212,168,64,0.18)', borderWidth: 1, borderColor: 'rgba(212,168,64,0.35)' },
  label:         { fontSize: 10, fontWeight: '600', color: 'rgba(255,255,255,0.58)', letterSpacing: 0.1 },
  labelActive:   { color: GOLD, fontWeight: '800' },
});
