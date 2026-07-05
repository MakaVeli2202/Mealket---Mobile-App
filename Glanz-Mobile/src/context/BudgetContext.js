import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@budget_v1';

const DEFAULT_CATEGORIES = [
  { id: 'food',      name: 'Food & Groceries', icon: 'cart-outline',        budget: 0, color: '#00E5A8' },
  { id: 'transport', name: 'Transport',         icon: 'car-outline',         budget: 0, color: '#00B8FF' },
  { id: 'rent',      name: 'Rent / Housing',    icon: 'home-outline',        budget: 0, color: '#8B5CF6' },
  { id: 'health',    name: 'Health',            icon: 'heart-outline',       budget: 0, color: '#EC4899' },
  { id: 'utilities', name: 'Utilities',         icon: 'flash-outline',       budget: 0, color: '#F59E0B' },
  { id: 'other',     name: 'Other',             icon: 'ellipsis-horizontal-outline', budget: 0, color: '#6B7280' },
];

const DEFAULT_STATE = {
  periodStartDay: 1,
  totalBudget: 0,
  categories: DEFAULT_CATEGORIES,
  expenses: [],
};

export function getCurrentPeriod(startDay) {
  const today = new Date();
  const y = today.getFullYear();
  const m = today.getMonth();
  const d = today.getDate();
  let start, end;
  if (d >= startDay) {
    start = new Date(y, m, startDay);
    const nextM = new Date(y, m + 1, startDay);
    end = new Date(nextM.getTime() - 86400000);
  } else {
    start = new Date(y, m - 1, startDay);
    const thisM = new Date(y, m, startDay);
    end = new Date(thisM.getTime() - 86400000);
  }
  return { start, end };
}

export function isInPeriod(dateStr, startDay) {
  const { start, end } = getCurrentPeriod(startDay);
  const d = new Date(dateStr);
  return d >= start && d <= end;
}

const BudgetContext = createContext(null);

export function BudgetProvider({ children }) {
  const [state, setState] = useState(DEFAULT_STATE);

  useEffect(() => {
    AsyncStorage.getItem(KEY).then(raw => {
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          setState(prev => ({ ...DEFAULT_STATE, ...prev, ...parsed }));
        } catch {}
      }
    });
  }, []);

  const save = useCallback((next) => {
    setState(next);
    AsyncStorage.setItem(KEY, JSON.stringify(next));
  }, []);

  const setPeriodStartDay = useCallback((day) => {
    save({ ...state, periodStartDay: day });
  }, [state, save]);

  const setTotalBudget = useCallback((amount) => {
    save({ ...state, totalBudget: amount });
  }, [state, save]);

  const addCategory = useCallback((cat) => {
    const id = Date.now().toString();
    save({ ...state, categories: [...state.categories, { ...cat, id }] });
  }, [state, save]);

  const updateCategory = useCallback((id, updates) => {
    save({ ...state, categories: state.categories.map(c => c.id === id ? { ...c, ...updates } : c) });
  }, [state, save]);

  const deleteCategory = useCallback((id) => {
    save({
      ...state,
      categories: state.categories.filter(c => c.id !== id),
      expenses: state.expenses.filter(e => e.categoryId !== id),
    });
  }, [state, save]);

  const addExpense = useCallback((exp) => {
    const id = Date.now().toString();
    const date = exp.date || new Date().toISOString().slice(0, 10);
    save({ ...state, expenses: [...state.expenses, { ...exp, id, date }] });
  }, [state, save]);

  const deleteExpense = useCallback((id) => {
    save({ ...state, expenses: state.expenses.filter(e => e.id !== id) });
  }, [state, save]);

  const periodExpenses = useCallback(() => {
    return state.expenses.filter(e => isInPeriod(e.date, state.periodStartDay));
  }, [state]);

  const spentByCategory = useCallback(() => {
    const period = periodExpenses();
    const map = {};
    for (const e of period) {
      map[e.categoryId] = (map[e.categoryId] || 0) + e.amount;
    }
    return map;
  }, [periodExpenses]);

  const totalSpent = useCallback(() => {
    return periodExpenses().reduce((s, e) => s + e.amount, 0);
  }, [periodExpenses]);

  return (
    <BudgetContext.Provider value={{
      ...state,
      setPeriodStartDay,
      setTotalBudget,
      addCategory,
      updateCategory,
      deleteCategory,
      addExpense,
      deleteExpense,
      periodExpenses,
      spentByCategory,
      totalSpent,
      getCurrentPeriod: () => getCurrentPeriod(state.periodStartDay),
    }}>
      {children}
    </BudgetContext.Provider>
  );
}

export const useBudget = () => useContext(BudgetContext);
