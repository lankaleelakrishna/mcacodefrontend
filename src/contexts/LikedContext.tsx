// src/contexts/LikedContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { toast } from '@/hooks/use-toast';
import { useLocation } from 'react-router-dom';

interface LikedContextType {
  likedProducts: string[];
  addToLiked: (productId: string) => Promise<void>;
  removeFromLiked: (productId: string) => Promise<void>;
  isLiked: (productId: string) => boolean;
  isLoading: boolean;
  error: string | null;
}

const LikedContext = createContext<LikedContextType | undefined>(undefined);

const API_BASE_URL = 'http://127.0.0.1:5000';

export function LikedProvider({ children }: { children: React.ReactNode }) {
  const [likedProducts, setLikedProducts] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, token } = useAuth();
  const location = useLocation();

  // Quick short-circuit: if admin user or admin route, provide a noop provider
  const isAdminUserQuick = user?.isAdmin || (user?.role && String(user.role).toLowerCase().includes('admin'));
  const isAdminRouteQuick = typeof window !== 'undefined' && window.location && String(window.location.pathname).startsWith('/admin');
  if (isAdminUserQuick || isAdminRouteQuick) {
    // Return provider immediately without mounting effects that call customer-only endpoints
    return (
      <LikedContext.Provider value={{
        likedProducts: [],
        addToLiked: async () => {},
        removeFromLiked: async () => {},
        isLiked: () => false,
        isLoading: false,
        error: null
      }}>
        {children}
      </LikedContext.Provider>
    );
  }

  // Load liked products from API when user logs in
  useEffect(() => {
    let isMounted = true;

    async function fetchLikedProducts() {
      // Skip fetching favorites for admin users or when on admin pages (customer-only endpoint)
      const isAdminUser = user?.isAdmin || (user?.role && String(user.role).toLowerCase().includes('admin'));
      const isAdminRoute = typeof window !== 'undefined' && window.location && String(window.location.pathname).startsWith('/admin');
      if (isAdminUser || location.pathname.startsWith('/admin') || isAdminRoute) {
        console.log('Admin context or admin route detected — skipping favorites fetch');
        setLikedProducts([]);
        setIsLoading(false);
        return;
      }

      if (!user?.id || !token) {
        console.log('No user or token, clearing liked products');
        setLikedProducts([]);
        return;
      }

      setIsLoading(true);
      setError(null);
      setLikedProducts([]); // Clear previous data
      
      console.log('Fetching favorites from backend...');

      try {
        const response = await fetch(`${API_BASE_URL}/favorites`, {
          headers: {
            'Authorization': token,
            'Accept': 'application/json',
          },
        });

        console.log('Response status:', response.status);

        let data;
        try {
          data = await response.json();
          console.log('Response data:', data);
        } catch (e) {
          console.error('Failed to parse response:', e);
          throw new Error('Invalid response from server');
        }
        
        if (!response.ok) {
          throw new Error(data.error || `Server error: ${response.status}`);
        }

        // Backend returns: { "favorites": [ { "perfume_id": "123", ... }, ... ] }
        const favorites = data.favorites || [];
        const ids = favorites.map((item: any) => item.perfume_id.toString());

        if (isMounted) {
          setLikedProducts(ids);
          try {
            localStorage.setItem(`liked-products-${user.id}`, JSON.stringify(ids));
          } catch (e) {
            console.warn('Failed to save to localStorage', e);
          }
          console.log('Updated liked products:', ids);
        }
      } catch (err) {
        if (isMounted) {
          const message = err instanceof Error ? err.message : 'Failed to fetch favorites';
          setError(message);
          toast({
            variant: "destructive",
            title: "Error",
            description: message,
          });

          // Fallback to local cache
          try {
            const stored = localStorage.getItem(`liked-products-${user?.id}`);
            if (stored) {
              const parsed = JSON.parse(stored);
              if (Array.isArray(parsed)) {
                setLikedProducts(parsed);
                console.log('Loaded from cache:', parsed);
              }
            }
          } catch (e) {
            console.warn('Failed to read cache', e);
          }
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchLikedProducts();

    return () => {
      isMounted = false;
    };
  }, [user?.id, token, location.pathname]);

  const addToLiked = async (productId: string) => {
    if (!user || !token) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to like products",
      });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/favorites`, {
        method: 'POST',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ perfume_ids: [parseInt(productId)] }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add to favorites');
      }

      setLikedProducts((prev) => 
        prev.includes(productId) ? prev : [...prev, productId]
      );

      toast({
        title: "Success",
        description: "Added to favorites",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add to favorites';
      setError(message);
      toast({
        variant: "destructive",
        title: "Error",
        description: message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const removeFromLiked = async (productId: string) => {
    if (!user || !token) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to manage favorites",
      });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/favorites`, {
        method: 'DELETE',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ perfume_ids: [parseInt(productId)] }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to remove from favorites');
      }

      setLikedProducts((prev) => prev.filter((id) => id !== productId));
      toast({
        title: "Success",
        description: "Removed from favorites",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to remove from favorites';
      setError(message);
      toast({
        variant: "destructive",
        title: "Error",
        description: message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isLiked = (productId: string) => {
    return likedProducts.includes(productId);
  };

  return (
    <LikedContext.Provider value={{ 
      likedProducts, 
      addToLiked, 
      removeFromLiked, 
      isLiked,
      isLoading,
      error
    }}>
      {children}
    </LikedContext.Provider>
  );
}

export function useLiked() {
  const context = useContext(LikedContext);
  if (context === undefined) {
    // Return a safe fallback so components can be rendered outside of provider (e.g., admin pages)
    return {
      likedProducts: [],
      addToLiked: async () => {},
      removeFromLiked: async () => {},
      isLiked: () => false,
      isLoading: false,
      error: null,
    } as any;
  }
  return context;
}