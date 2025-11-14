import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { ApiClient } from '../lib/api-client';
import { useToast } from '../hooks/use-toast';
import { useAuth } from './AuthContext';

const CartContext = createContext(undefined);

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { isAuthenticated, token, user } = useAuth();

  // Fetch cart items from the server
  const fetchCartItems = useCallback(async () => {
    // Do not call customer-only endpoints for admin users
    if (!isAuthenticated || user?.isAdmin) {
      setCartItems([]);
      return;
    }

    try {
      setIsLoading(true);
      console.debug('[CartContext] fetchCartItems token:', token);
      const response = await ApiClient.getCart(token);
      setCartItems(response.cart_items || []);
    } catch (error) {
      console.error('Error fetching cart:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch cart items',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, toast, token]);


  // Add item to cart
  const addItem = async (product, size) => {
    if (!isAuthenticated) {
      toast({
        title: 'Authentication Required',
        description: 'Please login to add items to cart',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsLoading(true);
      console.debug('[CartContext] addItem token:', token, 'productId:', product.id);
      const res = await ApiClient.addToCart([{ perfume_id: product.id, quantity: 1 }], token);
      console.debug('[CartContext] addItem response:', res);
      await fetchCartItems(); // Refresh cart after adding
      toast({
        title: 'Success',
        description: 'Item added to cart',
      });
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast({
        title: 'Error',
        description: error.data?.error || 'Failed to add item to cart',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Remove item from cart
  const removeItem = async (productId, size) => {
    if (!isAuthenticated) return;

    try {
      setIsLoading(true);
      console.debug('[CartContext] removeItem', { productId, size, token });
      
      // First update local state to maintain order
      setCartItems(current => 
        current.filter(item => 
          !(item.perfume_id === productId && item.size === size)
        )
      );
      
      // Ensure productId is numeric when sending to server
      const res = await ApiClient.removeFromCart(Number(productId), token);
      console.debug('[CartContext] removeItem response:', res);
      
      toast({
        title: 'Success',
        description: 'Item removed from cart',
      });
    } catch (error) {
      console.error('Error removing from cart:', error);
      if (error.data) {
        console.debug('Server error details:', error.data);
      }
      toast({
        title: 'Error',
        description: error.data?.message || 'Failed to remove item from cart',
        variant: 'destructive',
      });
      // Only refresh from server on error
      await fetchCartItems();
    } finally {
      setIsLoading(false);
    }
  };

  // Update quantity
  const updateQuantity = async (productId, size, quantity) => {
    if (!isAuthenticated) return;
    if (quantity <= 0) {
      await removeItem(productId, size);
      return;
    }

    try {
      setIsLoading(true);
      console.debug('[CartContext] updateQuantity', { productId, size, quantity, token });
      
      // First update local state to maintain order
      setCartItems(current => 
        current.map(item =>
          item.perfume_id === productId && item.size === size
            ? { ...item, quantity }
            : item
        )
      );

      // First remove existing item
      await ApiClient.removeFromCart(productId, token);
      
      // Then add with new quantity - wrap perfume_id in Number() to ensure it's numeric
      const res = await ApiClient.addToCart([{
        perfume_id: Number(productId),
        quantity: Number(quantity),
        size: String(size)
      }], token);
      
      console.debug('[CartContext] updateQuantity response:', res);
    } catch (error) {
      console.error('Error updating cart:', error);
      if (error.data) {
        console.debug('Server error details:', error.data);
      }
      toast({
        title: 'Error',
        description: error.data?.message || 'Failed to update cart',
        variant: 'destructive',
      });
      // Only refresh from server on error
      await fetchCartItems();
    } finally {
      setIsLoading(false);
    }
  };

  const clearCart = async () => {
    if (!isAuthenticated) return;
    
    try {
      setIsLoading(true);
      for (const item of cartItems) {
        try {
          await ApiClient.removeFromCart(item.perfume_id, token);
        } catch (err) {
          // Ignore 404 (item not in cart) errors during clearing — proceed to clear local state
          if (err instanceof Error && /404|not in your cart/i.test(err.message)) {
            console.debug(`Item ${item.perfume_id} not in cart, skipping.`);
          } else {
            throw err; // Re-throw other errors
          }
        }
      }
      setCartItems([]);
    } catch (error) {
      console.error('Error clearing cart:', error);
      toast({
        title: 'Error',
        description: 'Failed to clear cart',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate totals
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Fetch cart items when authentication status changes
  useEffect(() => {
    if (isAuthenticated) {
      fetchCartItems();
    } else {
      setCartItems([]);
    }
  }, [isAuthenticated, fetchCartItems]);

  return (
    <CartContext.Provider
      value={{ 
        items: cartItems,
        isLoading,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
        refreshCart: fetchCartItems
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

CartProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
}