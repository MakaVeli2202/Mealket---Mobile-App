import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@mealket_recipes';
const RecipeContext = createContext(null);

export function RecipeProvider({ children }) {
  const [recipes, setRecipes] = useState([]);

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((raw) => {
      if (!raw) return;
      try { setRecipes(JSON.parse(raw)); } catch (_) {}
    });
  }, []);

  const saveRecipe = useCallback((recipe) => {
    const isEdit = !!recipe.id;
    const full = isEdit
      ? { ...recipe, updatedAt: new Date().toISOString() }
      : { ...recipe, id: Date.now().toString(), createdAt: new Date().toISOString() };
    setRecipes((prev) => {
      const deduped = prev.filter((r) => r.id !== full.id);
      const next = [full, ...deduped];
      AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
    return full;
  }, []);

  const deleteRecipe = useCallback((id) => {
    setRecipes((prev) => {
      const next = prev.filter((r) => r.id !== id);
      AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  return (
    <RecipeContext.Provider value={{ recipes, saveRecipe, deleteRecipe }}>
      {children}
    </RecipeContext.Provider>
  );
}

export function useRecipes() { return useContext(RecipeContext); }
