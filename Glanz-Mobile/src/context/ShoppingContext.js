import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LIST_KEY = '@mealket_current_list';
const HISTORY_KEY = '@mealket_history';
const PRICE_HISTORY_KEY = '@mealket_price_history';

const ShoppingContext = createContext(null);

export function ShoppingProvider({ children }) {
  const [currentList, setCurrentList] = useState(null);
  const [history, setHistory] = useState([]);
  const [priceHistory, setPriceHistory] = useState({});
  const listRef = useRef(null);
  const historyRef = useRef(history);
  const priceHistoryRef = useRef({});

  useEffect(() => {
    AsyncStorage.getItem(LIST_KEY).then((raw) => {
      if (!raw) return;
      try { const parsed = JSON.parse(raw); setCurrentList(parsed); listRef.current = parsed; } catch (_) {}
    });
    AsyncStorage.getItem(HISTORY_KEY).then((raw) => {
      if (!raw) return;
      try { setHistory(JSON.parse(raw)); } catch (_) {}
    });
    AsyncStorage.getItem(PRICE_HISTORY_KEY).then((raw) => {
      if (!raw) return;
      try {
        const parsed = JSON.parse(raw);
        setPriceHistory(parsed);
        priceHistoryRef.current = parsed;
      } catch (_) {}
    });
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background' || state === 'inactive') {
        if (listRef.current) {
          AsyncStorage.setItem(LIST_KEY, JSON.stringify(listRef.current)).catch(() => {});
        }
      }
    });
    return () => sub.remove();
  }, []);

  const saveList = useCallback((list) => {
    setCurrentList(list);
  }, []);

  const toggleItem = useCallback((storeIndex, itemId) => {
    setCurrentList((prev) => {
      if (!prev) return prev;
      const stores = prev.stores.map((store, si) => {
        if (si !== storeIndex) return store;
        const items = store.items.map((item) => {
          if (item.id !== itemId) return item;
          const nextChecked = !item.checked;
          return { ...item, checked: nextChecked, notFound: false };
        });
        const checkedCount = items.filter((i) => i.checked).length;
        const subtotal = items.filter((i) => i.checked).reduce((s, i) => s + (i.subtotal || 0), 0);
        return { ...store, items, checkedCount, subtotal };
      });
      return { ...prev, stores };
    });
  }, []);

  useEffect(() => {
    if (currentList) {
      listRef.current = currentList;
      AsyncStorage.setItem(LIST_KEY, JSON.stringify(currentList)).catch(() => {});
    }
  }, [currentList]);

  useEffect(() => {
    historyRef.current = history;
    AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history)).catch(() => {});
  }, [history]);

  const updateItemPrice = useCallback((storeIndex, itemId, price) => {
    setCurrentList((prev) => {
      if (!prev) return prev;
      const stores = prev.stores.map((store, si) => {
        if (si !== storeIndex) return store;
        const items = store.items.map((item) => {
          if (item.id !== itemId) return item;
          const unitPrice = price || 0;
          return { ...item, unitPrice, subtotal: item.quantity * unitPrice, priceFromMemory: false };
        });
        const subtotal = items.filter((i) => i.checked).reduce((s, i) => s + (i.subtotal || 0), 0);
        return { ...store, items, subtotal };
      });
      const grandTotal = stores.reduce((s, g) => s + (g.subtotal || 0), 0);
      return { ...prev, stores, grandTotal: Math.round(grandTotal * 100) / 100 };
    });
  }, []);

  const moveItemToNextStore = useCallback((storeIndex, itemId) => {
    setCurrentList((prev) => {
      if (!prev) return prev;
      let movedItem = null;
      const stores = prev.stores.map((store, si) => {
        if (si < storeIndex) return store;
        if (si === storeIndex) {
          const item = store.items.find((i) => i.id === itemId);
          if (item) movedItem = { ...item, notFound: true };
          const items = store.items.filter((i) => i.id !== itemId);
          const checkedCount = items.filter((i) => i.checked).length;
          const subtotal = items.filter((i) => i.checked).reduce((s, i) => s + (i.subtotal || 0), 0);
          return { ...store, items, checkedCount, subtotal };
        }
        return store;
      });

      const nextStoreIdx = storeIndex + 1;
      if (movedItem && nextStoreIdx < stores.length) {
        const nextItems = [movedItem, ...stores[nextStoreIdx].items];
        const nextCheckedCount = nextItems.filter((i) => i.checked).length;
        const nextSubtotal = nextItems.filter((i) => i.checked).reduce((s, i) => s + (i.subtotal || 0), 0);
        stores[nextStoreIdx] = {
          ...stores[nextStoreIdx],
          items: nextItems,
          checkedCount: nextCheckedCount,
          subtotal: nextSubtotal,
        };
      } else if (movedItem) {
        const lastStore = stores[stores.length - 1];
        if (lastStore && lastStore.id === '__not_found__') {
          const nextItems = [movedItem, ...lastStore.items];
          const nextCheckedCount = nextItems.filter((i) => i.checked).length;
          const nextSubtotal = nextItems.filter((i) => i.checked).reduce((s, i) => s + (i.subtotal || 0), 0);
          stores[stores.length - 1] = {
            ...lastStore,
            items: nextItems,
            checkedCount: nextCheckedCount,
            subtotal: nextSubtotal,
          };
        } else {
          const notFoundStore = {
            id: '__not_found__',
            name: null,
            color: '#868E96',
            textColor: '#FFFFFF',
            items: [movedItem],
            subtotal: 0,
            checkedCount: 0,
          };
          stores.push(notFoundStore);
        }
      }

      return { ...prev, stores };
    });
  }, []);

  const restoreItem = useCallback((itemId) => {
    setCurrentList((prev) => {
      if (!prev) return prev;
      let restoredItem = null;
      let notFoundIdx = -1;
      const stores = prev.stores.map((store, si) => {
        if (store.id !== '__not_found__') return store;
        notFoundIdx = si;
        const item = store.items.find((i) => i.id === itemId);
        if (item) restoredItem = { ...item, notFound: false };
        const items = store.items.filter((i) => i.id !== itemId);
        const checkedCount = items.filter((i) => i.checked).length;
        const subtotal = items.filter((i) => i.checked).reduce((s, i) => s + (i.subtotal || 0), 0);
        return { ...store, items, checkedCount, subtotal };
      });

      if (restoredItem) {
        const firstStore = stores[0];
        if (firstStore && firstStore.id !== '__not_found__') {
          const newItems = [restoredItem, ...firstStore.items];
          const newCheckedCount = newItems.filter((i) => i.checked).length;
          const newSubtotal = newItems.filter((i) => i.checked).reduce((s, i) => s + (i.subtotal || 0), 0);
          stores[0] = { ...firstStore, items: newItems, checkedCount: newCheckedCount, subtotal: newSubtotal };
        }
      }

      const filtered = stores.filter((s) => s.items.length > 0 || s.id !== '__not_found__');
      return { ...prev, stores: filtered };
    });
  }, []);

  const saveToHistory = useCallback(async (list) => {
    setHistory((prev) => {
      const next = [list, ...prev].slice(0, 50);
      return next;
    });
  }, []);

  const loadHistory = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(HISTORY_KEY);
      if (raw) setHistory(JSON.parse(raw));
    } catch (_) {}
  }, []);

  const deleteFromHistory = useCallback((id) => {
    setHistory((prev) => {
      const next = prev.filter((l) => l.id !== id);
      return next;
    });
  }, []);

  const loadList = useCallback((list) => {
    setCurrentList(list);
  }, []);

  const getPriceHistory = useCallback(() => priceHistoryRef.current, []);

  const updatePriceHistory = useCallback((name, price) => {
    if (!name || !price || price <= 0) return;
    const key = name.toLowerCase().trim();
    setPriceHistory((prev) => {
      const next = { ...prev, [key]: price };
      priceHistoryRef.current = next;
      AsyncStorage.setItem(PRICE_HISTORY_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const deletePriceEntry = useCallback((key) => {
    setPriceHistory((prev) => {
      const next = { ...prev };
      delete next[key];
      priceHistoryRef.current = next;
      AsyncStorage.setItem(PRICE_HISTORY_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const renamePriceEntry = useCallback((oldKey, newName, newPrice) => {
    const newKey = newName.toLowerCase().trim();
    if (!newKey) return;
    setPriceHistory((prev) => {
      const next = { ...prev };
      if (oldKey !== newKey) delete next[oldKey];
      next[newKey] = newPrice >= 0 ? newPrice : (prev[oldKey] || 0);
      priceHistoryRef.current = next;
      AsyncStorage.setItem(PRICE_HISTORY_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const closeList = useCallback(async () => {
    const list = listRef.current;
    if (list) {
      const closed = { ...list, closedAt: new Date().toISOString() };
      setHistory((prev) => {
        const existing = prev.findIndex((h) => h.id === list.id);
        let next;
        if (existing !== -1) {
          next = [...prev];
          next[existing] = closed;
        } else {
          next = [closed, ...prev];
        }
        return next.slice(0, 50);
      });
    }
    setCurrentList(null);
    listRef.current = null;
    await AsyncStorage.removeItem(LIST_KEY).catch(() => {});
  }, []);

  return (
    <ShoppingContext.Provider value={{
      currentList, setCurrentList, loadList, closeList,
      toggleItem, updateItemPrice, moveItemToNextStore, restoreItem,
      history, saveToHistory, loadHistory, deleteFromHistory,
      priceHistory, getPriceHistory, updatePriceHistory, deletePriceEntry, renamePriceEntry,
    }}>
      {children}
    </ShoppingContext.Provider>
  );
}

export function useShopping() {
  return useContext(ShoppingContext);
}
