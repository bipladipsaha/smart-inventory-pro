"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";

// Cart item type
export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  maxQuantity: number; // Available stock
  category: string;
}

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  totalAmount: number;
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  getItemQuantity: (id: string) => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "shopping_cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    if (stored) {
      try {
        setItems(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse cart from localStorage:", e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save cart to localStorage on change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    }
  }, [items, isLoaded]);

  // Calculate derived values
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const addItem = useCallback(
    (newItem: Omit<CartItem, "quantity"> & { quantity?: number }) => {
      const quantityToAdd = newItem.quantity || 1;

      setItems((current) => {
        const existingIndex = current.findIndex((item) => item.id === newItem.id);

        if (existingIndex >= 0) {
          // Update existing item
          const updated = [...current];
          const existing = updated[existingIndex];
          const newQuantity = Math.min(
            existing.quantity + quantityToAdd,
            newItem.maxQuantity
          );
          updated[existingIndex] = {
            ...existing,
            quantity: newQuantity,
            maxQuantity: newItem.maxQuantity, // Update max in case stock changed
          };
          return updated;
        } else {
          // Add new item
          return [
            ...current,
            {
              id: newItem.id,
              name: newItem.name,
              price: newItem.price,
              category: newItem.category,
              maxQuantity: newItem.maxQuantity,
              quantity: Math.min(quantityToAdd, newItem.maxQuantity),
            },
          ];
        }
      });
    },
    []
  );

  const updateQuantity = useCallback((id: string, quantity: number) => {
    setItems((current) => {
      if (quantity <= 0) {
        return current.filter((item) => item.id !== id);
      }

      return current.map((item) =>
        item.id === id
          ? { ...item, quantity: Math.min(quantity, item.maxQuantity) }
          : item
      );
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const getItemQuantity = useCallback(
    (id: string) => {
      const item = items.find((item) => item.id === id);
      return item?.quantity || 0;
    },
    [items]
  );

  const value: CartContextType = {
    items,
    itemCount,
    totalAmount,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    getItemQuantity,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
