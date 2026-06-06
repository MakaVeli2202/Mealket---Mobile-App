import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadPriceMemory, savePriceMemory, recordPrice, applyPriceMemory } from '../utils/priceMemory';

const HISTORY_KEY = '@einkauf_history';
const NOT_FOUND_STORE = {
  id: '__not_found__',
  name: 'Nicht gefunden',
  color: '#868E96',
  textColor: '#FFFFFF',
  items: [],
  subtotal: 0,
  checkedCount: 0,
};

const ShoppingContext = createContext(null);

function recalcStore(store) {
  const subtotal = store.items.reduce((s, i) => Math.round((s + i.subtotal) * 100) / 100, 0);
  const checkedCount = store.items.filter((i) => i.checked).length;
  return { ...store, subtotal, checkedCount };
}

export function ShoppingProvider({ children }) {
  const [currentList, setCurrentList] = useState(null);
  const [history, setHistory] = useState([]);
  const priceMemoryRef = useRef({});

  useEffect(() => {
    loadHistory();
    loadPriceMemory().then((m) => { priceMemoryRef.current = m; });
  }, []);

  const loadHistory = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(HISTORY_KEY);
      if (!raw) return;
      const all = JSON.parse(raw);
      const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000; // 30 days
      const fresh = all.filter((h) => new Date(h.createdAt).getTime() > cutoff);
      if (fresh.length !== all.length) {
        await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(fresh));
      }
      setHistory(fresh);
    } catch (_) {}
  }, []);

  const saveToHistory = useCallback(async (list) => {
    try {
      const updated = [list, ...history.filter((h) => h.id !== list.id)].slice(0, 50);
      setHistory(updated);
      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    } catch (_) {}
  }, [history]);

  const deleteFromHistory = useCallback(async (id) => {
    try {
      const updated = history.filter((h) => h.id !== id);
      setHistory(updated);
      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    } catch (_) {}
  }, [history]);

  const toggleItem = useCallback((storeIndex, itemId) => {
    setCurrentList((prev) => {
      if (!prev) return prev;
      const stores = prev.stores.map((store, si) => {
        if (si !== storeIndex) return store;
        const items = store.items.map((item) =>
          item.id === itemId ? { ...item, checked: !item.checked, notFound: false } : item
        );
        return recalcStore({ ...store, items });
      });
      const grandTotal = stores.reduce((s, g) => Math.round((s + g.subtotal) * 100) / 100, 0);
      return { ...prev, stores, grandTotal };
    });
  }, []);

  const updateItemPrice = useCallback((storeIndex, itemId, unitPrice) => {
    setCurrentList((prev) => {
      if (!prev) return prev;
      const stores = prev.stores.map((store, si) => {
        if (si !== storeIndex) return store;
        const items = store.items.map((item) => {
          if (item.id !== itemId) return item;
          const price = Math.max(0, parseFloat(unitPrice) || 0);
          // Persist to price memory
          const updated = recordPrice(priceMemoryRef.current, item.name, store.name, price);
          priceMemoryRef.current = updated;
          savePriceMemory(updated);
          return {
            ...item,
            unitPrice: price,
            subtotal: Math.round(item.quantity * price * 100) / 100,
            priceFromMemory: false,
          };
        });
        return recalcStore({ ...store, items });
      });
      const grandTotal = stores.reduce((s, g) => Math.round((s + g.subtotal) * 100) / 100, 0);
      return { ...prev, stores, grandTotal };
    });
  }, []);

  // Moves item to the next store in the list.
  // If there is no next regular store, it goes to the "Nicht gefunden" bucket.
  const moveItemToNextStore = useCallback((storeIndex, itemId) => {
    setCurrentList((prev) => {
      if (!prev) return prev;

      // Find and extract the item
      let movedItem = null;
      const stores = prev.stores.map((store, si) => {
        if (si !== storeIndex) return store;
        const item = store.items.find((i) => i.id === itemId);
        if (item) movedItem = { ...item, notFound: true, checked: false };
        const items = store.items.filter((i) => i.id !== itemId);
        return recalcStore({ ...store, items });
      });

      if (!movedItem) return prev;

      // Find next regular store (skip "Nicht gefunden")
      const nextStoreIndex = stores.findIndex(
        (s, i) => i > storeIndex && s.id !== '__not_found__'
      );

      if (nextStoreIndex !== -1) {
        // Move to next store (reset notFound since it's a new attempt)
        stores[nextStoreIndex] = recalcStore({
          ...stores[nextStoreIndex],
          items: [...stores[nextStoreIndex].items, { ...movedItem, notFound: false }],
        });
      } else {
        // No next store — move to "Nicht gefunden" bucket
        const nfIndex = stores.findIndex((s) => s.id === '__not_found__');
        if (nfIndex !== -1) {
          stores[nfIndex] = recalcStore({
            ...stores[nfIndex],
            items: [...stores[nfIndex].items, movedItem],
          });
        } else {
          stores.push(recalcStore({ ...NOT_FOUND_STORE, items: [movedItem] }));
        }
      }

      const grandTotal = stores.reduce((s, g) => Math.round((s + g.subtotal) * 100) / 100, 0);
      return { ...prev, stores, grandTotal };
    });
  }, []);

  // Use this instead of setCurrentList when loading a new parsed/history list
  const loadList = useCallback((list) => {
    const withPrices = {
      ...list,
      stores: applyPriceMemory(list.stores, priceMemoryRef.current),
    };
    const grandTotal = withPrices.stores.reduce((s, g) => Math.round((s + g.subtotal) * 100) / 100, 0);
    setCurrentList({ ...withPrices, grandTotal });
  }, []);

  return (
    <ShoppingContext.Provider
      value={{
        currentList,
        setCurrentList,
        loadList,
        toggleItem,
        updateItemPrice,
        moveItemToNextStore,
        history,
        saveToHistory,
        loadHistory,
        deleteFromHistory,
      }}
    >
      {children}
    </ShoppingContext.Provider>
  );
}

export function useShopping() {
  return useContext(ShoppingContext);
}
