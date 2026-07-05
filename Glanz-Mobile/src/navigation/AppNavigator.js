import React, { useMemo, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import {
  NavigationContainer, DefaultTheme, DarkTheme,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { LinearGradient } from '../components/SafeGradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';

import { useSettings } from '../context/SettingsContext';

import ChecklistScreen from '../screens/ChecklistScreen';
import PasteScreen from '../screens/PasteScreen';
import ReviewScreen from '../screens/ReviewScreen';
import HistoryScreen from '../screens/HistoryScreen';
import CaloriesScreen from '../screens/CaloriesScreen';
import FastingScreen from '../screens/FastingScreen';
import ProfilScreen from '../screens/ProfilScreen';
import SettingsScreen from '../screens/SettingsScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import MealDetailScreen from '../screens/MealDetailScreen';
import AddFoodScreen from '../screens/AddFoodScreen';
import BarcodeScannerScreen from '../screens/BarcodeScannerScreen';
import CalorieHistoryScreen from '../screens/CalorieHistoryScreen';
import DayDetailScreen from '../screens/DayDetailScreen';
import CreatePlateScreen from '../screens/CreatePlateScreen';
import RecipeListScreen from '../screens/RecipeListScreen';
import RecipeDetailScreen from '../screens/RecipeDetailScreen';
import CreateRecipeScreen from '../screens/CreateRecipeScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import FoodDetailScreen from '../screens/FoodDetailScreen';
import MyFoodsScreen from '../screens/MyFoodsScreen';
import CameraLabelScreen from '../screens/CameraLabelScreen';
import CustomMealsScreen from '../screens/CustomMealsScreen';
import MeasurementScreen from '../screens/MeasurementScreen';
import ExportScreen from '../screens/ExportScreen';
import AchievementsScreen from '../screens/AchievementsScreen';
import BudgetScreen from '../screens/BudgetScreen';
import PriceDBScreen from '../screens/PriceDBScreen';

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

const TAB_CFG = {
  ShoppingTab:  { icon: 'cart-outline',            filled: 'cart',            labelKey: 'shopping' },
  DiaryTab:     { icon: 'journal-outline',         filled: 'journal',         labelKey: 'calories'  },
  RecipesTab:   { icon: 'fast-food-outline',            filled: 'fast-food',            labelKey: 'food'   },
  FastingTab:   { icon: 'time-outline',            filled: 'time',            labelKey: 'fasting'   },
  AnalyticsTab: { icon: 'stats-chart-outline',     filled: 'stats-chart',     labelKey: 'analytics' },
  ProfileTab:   { icon: 'person-circle-outline',   filled: 'person-circle',   labelKey: 'profil'    },
};

function FloatingTabBar({ state, navigation }) {
  const { tr, theme } = useSettings();
  const tabLayouts = useRef({});
  const indicatorX = useSharedValue(0);
  const indicatorOpa = useSharedValue(0);

  const PILL_W = 46;

  const onTabLayout = (index, e) => {
    const { x, width } = e.nativeEvent.layout;
    tabLayouts.current[index] = { x, width };
    if (index === state.index) {
      indicatorX.value = x + (width - PILL_W) / 2;
      indicatorOpa.value = withTiming(1, { duration: 300 });
    }
  };

  useEffect(() => {
    const target = tabLayouts.current[state.index];
    if (target) {
      indicatorX.value = withSpring(target.x + (target.width - PILL_W) / 2, {
        damping: 22, stiffness: 150, mass: 0.6,
      });
      indicatorOpa.value = withTiming(1, { duration: 200 });
    }
  }, [state.index]);

  const indicatorAnim = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
    opacity: indicatorOpa.value,
  }));

  return (
    <View style={tb.outer} pointerEvents="box-none">
      <View style={[tb.bar, { borderColor: theme.accent + '40' }]}>
        {Platform.OS === 'ios' ? (
          <BlurView
            intensity={88}
            tint="dark"
            style={[StyleSheet.absoluteFillObject, { borderRadius: 28, overflow: 'hidden' }]}
          />
        ) : (
          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(6,8,18,0.97)' }]} />
        )}
        <LinearGradient
          colors={['transparent', theme.accent + '59', 'rgba(180,180,200,0.20)', 'transparent']}
          locations={[0, 0.38, 0.62, 1]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={tb.shimmerLine}
          pointerEvents="none"
        />

        <Animated.View
          style={[{
            position: 'absolute', bottom: 17,
            width: PILL_W, height: 42, borderRadius: 16,
            overflow: 'hidden',
            zIndex: 1,
          }, indicatorAnim]}
          pointerEvents="none"
        >
          {/* vivid pill gradient */}
          <LinearGradient
            colors={[theme.accent + '60', theme.accentBlue ? theme.accentBlue + '44' : theme.accent + '44']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={[StyleSheet.absoluteFillObject, { borderRadius: 16 }]}
          />
          {/* bright top edge */}
          <LinearGradient
            colors={[theme.accent + 'AA', 'transparent']}
            start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
            style={[StyleSheet.absoluteFillObject, { borderRadius: 16, height: 2 }]}
          />
          <View style={[StyleSheet.absoluteFillObject, { borderRadius: 16, borderWidth: 1.5, borderColor: theme.accent + '90' }]} />
        </Animated.View>

        {state.routes.map((route, index) => {
          const cfg = TAB_CFG[route.name];
          if (!cfg) return null;
          const focused = state.index === index;
          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
          };

          return (
            <TouchableOpacity key={route.key} onPress={onPress} style={tb.tab} activeOpacity={0.7} onLayout={(e) => onTabLayout(index, e)}>
              <View style={tb.iconPill}>
                {focused && (
                  <View style={[tb.iconGlow, { backgroundColor: theme.accentGlow ?? theme.accent + '40' }]} />
                )}
                <Ionicons
                  name={focused ? cfg.filled : cfg.icon}
                  size={focused ? 25 : 21}
                  color={focused ? theme.accent : 'rgba(255,255,255,0.52)'}
                />
              </View>
              <Text style={[tb.label, focused && { color: theme.accent, fontWeight: '800', letterSpacing: 0 }]}>
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
      <Tab.Screen name="ShoppingTab"  component={ChecklistScreen} />
      <Tab.Screen name="DiaryTab"     component={CaloriesScreen} />
      <Tab.Screen name="RecipesTab"   component={RecipeListScreen} initialParams={{ hideBack: true }} />
      <Tab.Screen name="FastingTab"   component={FastingScreen} />
      <Tab.Screen name="AnalyticsTab" component={AnalyticsScreen} initialParams={{ hideBack: true }} />
      <Tab.Screen name="ProfileTab"   component={ProfilScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator({ navigationRef }) {
  const { theme, isDark } = useSettings();

  const navTheme = useMemo(() => ({
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      primary:    theme.accent,
      background: theme.bg,
      card:       theme.bg,
      text:       theme.text,
      border:     theme.border,
    },
  }), [isDark, theme]);

  return (
    <NavigationContainer ref={navigationRef} theme={navTheme}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          animationDuration: 250,
        }}
      >
        <Stack.Screen name="Main"           component={MainTabs} />
        <Stack.Screen name="Paste"          component={PasteScreen} />
        <Stack.Screen name="Review"         component={ReviewScreen} />
        <Stack.Screen name="Checklist"      component={ChecklistScreen} />
        <Stack.Screen name="History"        component={HistoryScreen} />
        <Stack.Screen name="Settings"       component={SettingsScreen} />
        <Stack.Screen name="Notifications"  component={NotificationsScreen} />
        <Stack.Screen name="MealDetail"     component={MealDetailScreen} />
        <Stack.Screen name="AddFood"        component={AddFoodScreen} />
        <Stack.Screen name="BarcodeScanner" component={BarcodeScannerScreen} />
        <Stack.Screen name="CalorieHistory" component={CalorieHistoryScreen} />
        <Stack.Screen name="DayDetail"      component={DayDetailScreen} />
        <Stack.Screen name="CreatePlate"    component={CreatePlateScreen} />
        <Stack.Screen name="RecipeList"     component={RecipeListScreen} />
        <Stack.Screen name="RecipeDetail"   component={RecipeDetailScreen} />
        <Stack.Screen name="CreateRecipe"   component={CreateRecipeScreen} />
        <Stack.Screen name="Analytics"      component={AnalyticsScreen} />
        <Stack.Screen name="FoodDetail"     component={FoodDetailScreen} />
        <Stack.Screen name="MyFoods"        component={MyFoodsScreen} />
        <Stack.Screen name="CameraLabel"    component={CameraLabelScreen} />
        <Stack.Screen name="CustomMeals"    component={CustomMealsScreen} />
        <Stack.Screen name="Measurements"   component={MeasurementScreen} />
        <Stack.Screen name="Export"         component={ExportScreen} />
        <Stack.Screen name="Achievements"   component={AchievementsScreen} />
        <Stack.Screen name="Budget"         component={BudgetScreen} />
        <Stack.Screen name="PriceDB"        component={PriceDBScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const tb = StyleSheet.create({
  outer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 14, paddingBottom: 22,
  },
  bar: {
    flexDirection: 'row', alignItems: 'center',
    height: 74, borderRadius: 30, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    shadowColor: '#00E5A8',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 32,
    elevation: 32,
    backgroundColor: 'rgba(8,10,26,0.94)',
  },
  shimmerLine: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 1.5, zIndex: 2,
  },
  tab:      { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3, paddingVertical: 8 },
  iconPill: { width: 48, height: 36, borderRadius: 14, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  iconGlow: { position: 'absolute', width: 42, height: 30, borderRadius: 12, opacity: 0.55 },
  label:    { fontSize: 10, fontWeight: '600', color: 'rgba(255,255,255,0.52)', letterSpacing: 0.2 },
});
