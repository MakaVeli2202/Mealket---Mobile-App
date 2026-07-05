import React, { createContext, useContext, useState } from 'react';

const ShoppingContext = createContext(null);

export function ShoppingProvider({ children }) {
  const [currentList, setCurrentList] = useState(null);
  const [history, setHistory] = useState([]);

  const loadList = (list) => setCurrentList(list);
  const toggleItem = () => {};
  const updateItemPrice = () => {};
  const moveItemToNextStore = () => {};
  const restoreItem = () => {};
  const saveToHistory = () => {};
  const loadHistory = () => {};
  const deleteFromHistory = () => {};

  return (
    <ShoppingContext.Provider value={{
      currentList, setCurrentList, loadList,
      toggleItem, updateItemPrice, moveItemToNextStore, restoreItem,
      history, saveToHistory, loadHistory, deleteFromHistory,
    }}>
      {children}
    </ShoppingContext.Provider>
  );
}

export function useShopping() {
  return useContext(ShoppingContext);
}
