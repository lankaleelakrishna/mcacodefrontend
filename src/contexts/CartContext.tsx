import { createContext, useContext, useState, useEffect } from "react";
import type { Product } from "@/data/products";
import { useAuth } from "./AuthContext";

interface CartItem extends Partial<Product> {
  id: number;
  // cart_id is the local cart-row identifier (mirrors backend carts table id when synced)
  cart_id: number;
  quantity: number;
  // selectedSize may be undefined for products without variants
  selectedSize?: string | null;
  // price may come from Product but ensure it's present on cart items
  price: number;
  // optional image fields (different datasets use different keys)
  image?: string;
  images?: string[];
  photo_url?: string;
  name?: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, size: string) => void;
  // identify items by product id + selectedSize to support multiple variants of same product
  removeItem: (productId: number, selectedSize?: string) => void;
  updateQuantity: (productId: number, selectedSize: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { requireAuth, user } = useAuth();

  // keep cart per-user in localStorage using `vasa-cart-<userId>` key
  const [items, setItems] = useState<CartItem[]>([]);

  // Load cart when user changes (or on mount)
  useEffect(() => {
    try {
      if (user && user.id !== undefined && user.id !== null) {
        const key = `vasa-cart-${user.id}`;
        // migrate legacy cart saved under `vasa-cart` (if present)
        const legacy = localStorage.getItem('vasa-cart');
        if (legacy) {
          try {
            const legacyItems = JSON.parse(legacy);
            const existing = localStorage.getItem(key);
            if (!existing) {
              localStorage.setItem(key, JSON.stringify(legacyItems));
              localStorage.removeItem('vasa-cart');
              console.debug('[CartContext] migrated legacy cart to', key);
            }
          } catch (err) {
            console.error('[CartContext] failed to migrate legacy cart', err);
          }
        }
        const saved = localStorage.getItem(key);
        console.debug('[CartContext] loading cart for user', { key, saved });
        setItems(saved ? JSON.parse(saved) : []);
      } else {
        // no logged-in user => empty cart
        setItems([]);
      }
    } catch (err) {
      console.error('[CartContext] failed to load cart', err);
      setItems([]);
    }
  }, [user]);

  // Persist cart for current user
  useEffect(() => {
    try {
      if (user && user.id !== undefined && user.id !== null) {
        const key = `vasa-cart-${user.id}`;
        localStorage.setItem(key, JSON.stringify(items));
        console.debug('[CartContext] saved cart for user', { key, items });
      }
    } catch (err) {
      console.error('[CartContext] failed to save cart', err);
    }
  }, [items, user]);

  const addItem = (product: Product, size: string) => {
    // require a resolved user id to avoid writing into a wrong key
    if (!user || user.id === undefined || user.id === null) {
      console.warn('[CartContext] addItem aborted: user not resolved yet');
      return;
    }
    requireAuth(() => {
      setItems(current => {
        const existing = current.find(item => item.id === product.id && item.selectedSize === size);
        if (existing) {
          return current.map(item =>
            item.id === product.id && item.selectedSize === size
              ? { ...item, quantity: item.quantity + 1 }
              : item
          );
        }
        const maxCartId = Math.max(0, ...current.map(item => item.cart_id));
        return [...current, { ...product, quantity: 1, selectedSize: size, cart_id: maxCartId + 1 }];
      });
    });
  };

  const removeItem = (productId: number, selectedSize?: string) => {
    if (!user || user.id === undefined || user.id === null) {
      console.warn('[CartContext] removeItem aborted: user not resolved yet');
      return;
    }
    requireAuth(() => {
      // if selectedSize is provided, remove only that variant; otherwise remove all items with the id
      setItems(current =>
        current.filter(item => {
          if (item.id !== productId) return true;
          if (selectedSize) return item.selectedSize !== selectedSize;
          return false;
        })
      );
    });
  };

  const updateQuantity = (productId: number, selectedSize: string, quantity: number) => {
    if (!user || user.id === undefined || user.id === null) {
      console.warn('[CartContext] updateQuantity aborted: user not resolved yet');
      return;
    }
    requireAuth(() => {
      if (quantity <= 0) {
        removeItem(productId, selectedSize);
        return;
      }
      setItems(current =>
        current.map(item =>
          item.id === productId && item.selectedSize === selectedSize ? { ...item, quantity } : item
        )
      );
    });
  };

  const clearCart = () => {
    requireAuth(() => {
      setItems([]);
    });
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, clearCart, totalItems, totalPrice }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
}