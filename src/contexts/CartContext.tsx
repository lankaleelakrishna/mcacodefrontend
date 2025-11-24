import { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { Product } from "@/data/products";
import { useAuth } from "./AuthContext";
import { ApiClient } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";


interface CartItem {
  id: number;
  perfume_id: number;
  name: string;
  price: number;
  quantity: number;
  size?: string;
  photo_url?: string;
  in_stock?: boolean;
}

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, size?: string) => Promise<void>;
  removeItem: (productId: number, size?: string) => Promise<void>;
  updateQuantity: (productId: number, size: string | undefined, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  totalItems: number;
  totalPrice: number;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);


export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user, token, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch cart items from backend
  const fetchCart = useCallback(async () => {
    if (!isAuthenticated || !token) {
      setItems([]);
      return;
    }
    try {
      setIsLoading(true);
      const res = await ApiClient.getCart(token);
      setItems(res.cart_items || []);
    } catch (err) {
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, token]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // Add item to cart (backend)
  const addItem = async (product: Product, size?: string) => {
    if (!isAuthenticated || !token) {
      toast({ title: 'Login required', description: 'Please login to add items to cart', variant: 'destructive' });
      return;
    }
    try {
      setIsLoading(true);
      await ApiClient.addToCart([
        { perfume_id: product.id, quantity: 1, size }
      ], token);
      await fetchCart();
      toast({ title: 'Added to cart', description: `${product.name}${size ? ` (${size})` : ''} added to cart.` });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to add to cart', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  // Remove item from cart (backend)
  const removeItem = async (productId: number, size?: string) => {
    if (!isAuthenticated || !token) return;
    try {
      setIsLoading(true);
      await ApiClient.removeFromCart(productId, token);
      await fetchCart();
      toast({ title: 'Removed', description: 'Item removed from cart.' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to remove item', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  // Update quantity (remove then add with new quantity)
  const updateQuantity = async (productId: number, size: string | undefined, quantity: number) => {
    if (!isAuthenticated || !token) return;
    if (quantity <= 0) {
      await removeItem(productId, size);
      return;
    }
    try {
      setIsLoading(true);
      await ApiClient.removeFromCart(productId, token);
      await ApiClient.addToCart([{ perfume_id: productId, quantity, size }], token);
      await fetchCart();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to update cart', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  // Clear cart (remove all items)
  const clearCart = async () => {
    if (!isAuthenticated || !token) return;
    try {
      setIsLoading(true);
      for (const item of items) {
        await ApiClient.removeFromCart(item.perfume_id, token);
      }
      await fetchCart();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to clear cart', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, clearCart, totalItems, totalPrice, refreshCart: fetchCart }}
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