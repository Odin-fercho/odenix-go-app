import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import type { Product, Tenant } from '../services/baserow';

export type CartItem = {
  product: Product;
  quantity: number;
};

type CartContextValue = {
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: number) => void;
  setQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  /** Texto del pedido y total (para WhatsApp y registro en portal). */
  buildCheckoutSummary: (tenant: Tenant) => { message: string; total: number };
  buildWhatsappCheckoutUrl: (tenant: Tenant) => string;
};

const CartContext = createContext<CartContextValue | null>(null);

function normalizeQuantity(quantity: number): number {
  if (!Number.isFinite(quantity)) return 1;
  if (quantity < 1) return 1;
  return Math.floor(quantity);
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = (product: Product, quantity = 1) => {
    const safeQty = normalizeQuantity(quantity);
    setItems((prev) => {
      const index = prev.findIndex((item) => item.product.id === product.id);
      if (index < 0) {
        return [...prev, { product, quantity: safeQty }];
      }

      return prev.map((item, itemIndex) =>
        itemIndex === index
          ? { ...item, quantity: item.quantity + safeQty }
          : item,
      );
    });
  };

  const removeItem = (productId: number) => {
    setItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const setQuantity = (productId: number, quantity: number) => {
    setItems((prev) => {
      const nextQty = Math.floor(quantity);
      if (nextQty <= 0) {
        return prev.filter((item) => item.product.id !== productId);
      }

      return prev.map((item) =>
        item.product.id === productId ? { ...item, quantity: nextQty } : item,
      );
    });
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItems = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  );
  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity * item.product.precio, 0),
    [items],
  );

  const buildCheckoutSummary = (tenant: Tenant): { message: string; total: number } => {
    const lines = items.map(
      (item) =>
        `- ${item.product.nombre} x${item.quantity} (${new Intl.NumberFormat('es-CO', {
          style: 'currency',
          currency: 'COP',
          maximumFractionDigits: 0,
        }).format(item.product.precio * item.quantity)})`,
    );

    const totalFormatted = new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(subtotal);

    const message =
      `Hola ${tenant.nombre}, quiero pedir:\n` +
      `${lines.join('\n')}\n` +
      `Total estimado: ${totalFormatted}`;

    return { message, total: subtotal };
  };

  const buildWhatsappCheckoutUrl = (tenant: Tenant): string => {
    const cleanPhone = tenant.whatsapp.replace(/[^\d]/g, '');
    const { message } = buildCheckoutSummary(tenant);
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  };

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      totalItems,
      subtotal,
      addItem,
      removeItem,
      setQuantity,
      clearCart,
      buildCheckoutSummary,
      buildWhatsappCheckoutUrl,
    }),
    [items, totalItems, subtotal],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart debe usarse dentro de CartProvider');
  }
  return context;
}
