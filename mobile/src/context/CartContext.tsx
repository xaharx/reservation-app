import React, { createContext, useContext, useMemo, useState } from 'react';
import type { MenuItem } from '../api/menu';

export type CartLine = {
  menuItemId: string;
  name: string;
  unitCents: number;
  currency: string;
  quantity: number;
};

type CartContextValue = {
  lines: CartLine[];
  itemCount: number;
  subtotalCents: number;
  currency: string | null;
  addItem: (item: MenuItem, quantity?: number) => void;
  updateQuantity: (menuItemId: string, quantity: number) => void;
  removeItem: (menuItemId: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

/**
 * In-memory cart shared across the Menu and Cart screens. Not persisted
 * across app restarts — no storage dependency is installed, and per the
 * MVP scope (see task history) that's an accepted limitation for v1.
 */
export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);

  function addItem(item: MenuItem, quantity = 1) {
    setLines((current) => {
      const existing = current.find((line) => line.menuItemId === item.id);
      if (existing) {
        return current.map((line) =>
          line.menuItemId === item.id ? { ...line, quantity: line.quantity + quantity } : line,
        );
      }
      return [
        ...current,
        {
          menuItemId: item.id,
          name: item.name,
          unitCents: item.priceCents,
          currency: item.currency,
          quantity,
        },
      ];
    });
  }

  function updateQuantity(menuItemId: string, quantity: number) {
    setLines((current) => {
      if (quantity <= 0) {
        return current.filter((line) => line.menuItemId !== menuItemId);
      }
      return current.map((line) => (line.menuItemId === menuItemId ? { ...line, quantity } : line));
    });
  }

  function removeItem(menuItemId: string) {
    setLines((current) => current.filter((line) => line.menuItemId !== menuItemId));
  }

  function clear() {
    setLines([]);
  }

  const itemCount = useMemo(() => lines.reduce((sum, line) => sum + line.quantity, 0), [lines]);
  const subtotalCents = useMemo(
    () => lines.reduce((sum, line) => sum + line.unitCents * line.quantity, 0),
    [lines],
  );
  const currency = lines[0]?.currency ?? null;

  const value: CartContextValue = {
    lines,
    itemCount,
    subtotalCents,
    currency,
    addItem,
    updateQuantity,
    removeItem,
    clear,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider.');
  }
  return context;
}
