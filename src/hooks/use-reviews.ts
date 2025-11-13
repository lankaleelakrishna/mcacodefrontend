import { useState, useEffect } from 'react';

interface Review {
  id: number;
  productId?: number;
  userId: number;
  rating: number;
  content: string;
  userName: string;
  createdAt: string;
}

interface UseReviewsReturn {
  reviews: Review[];
  loading: boolean;
  error: Error | null;
}

export function useReviews(productId?: number): UseReviewsReturn {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        const url = productId 
          ? `http://127.0.0.1:5000/perfumes/${productId}/reviews`
          : 'http://127.0.0.1:5000/reviews/recent';
          
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch reviews: ${response.statusText}`);
        }
        
        const data = await response.json();
        setReviews(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch reviews'));
        // Fallback data when API is not available
        setReviews([
          {
            id: 1,
            userId: 1,
            rating: 5,
            content: "Amazing fragrance! Long-lasting and unique.",
            userName: "Sarah Johnson",
            createdAt: new Date().toISOString(),
          },
          {
            id: 2,
            userId: 2,
            rating: 4,
            content: "Great scent profile, though a bit pricey.",
            userName: "Michael Chen",
            createdAt: new Date().toISOString(),
          },
          {
            id: 3,
            userId: 3,
            rating: 5,
            content: "Exactly what I was looking for in a signature scent.",
            userName: "Emily Rodriguez",
            createdAt: new Date().toISOString(),
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [productId]);

  return { reviews, loading, error };
}