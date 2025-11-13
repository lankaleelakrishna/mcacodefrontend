"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { ApiClient } from "@/lib/api-client";

interface Review {
  review_id: number;
  perfume_id: number;
  perfume_name: string;
  user_id: number;
  user_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

interface PerfumeStats {
  perfume_id: number;
  perfume_name: string;
  average_rating: number;
  total_reviews: number;
}

interface ReviewsProps {
  productId: string | "all";
}

export function Reviews({ productId }: ReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [totalReviews, setTotalReviews] = useState<number>(0);
  const [newRating, setNewRating] = useState<number>(5);
  const [newComment, setNewComment] = useState<string>("");
  const [loadingReviews, setLoadingReviews] = useState(false);
  const { token, user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

  useEffect(() => {
    if (!productId) return;

    const fetchReviews = async () => {
      setLoadingReviews(true);
      try {
        if (productId === "all") {
          const res = await ApiClient.getAllReviews();
          console.debug('[Reviews] getAllReviews response:', res);

          setReviews(res.reviews);
          setAvgRating(res.global_average_rating);
          setTotalReviews(res.total_reviews);
          return;
        }

        const pid = Number(productId);
        const res: any = await ApiClient.getProductReviews(pid);
        const rawList = res.reviews || res || [];
        // Normalize product-specific reviews into the common Review shape
        const list = (rawList as any[]).map((r: any) => ({
          review_id: r.review_id ?? r.id,
          perfume_id: r.perfume_id ?? pid,
          perfume_name: r.perfume_name ?? res.perfume?.name ?? "",
          user_id: r.user_id ?? r.user_id,
          user_name: r.user_name ?? r.username ?? "",
          rating: r.rating,
          comment: r.comment,
          created_at: r.created_at,
        })) as Review[];

        setReviews(list);
        // compute average & total from fetched reviews when backend doesn't provide summary
        const computedTotal = list.length ?? 0;
        const computedAvg = computedTotal > 0 ? (list.reduce((s, r) => s + (r.rating || 0), 0) / computedTotal) : null;
        setAvgRating(res.perfume?.average_rating ?? computedAvg ?? null);
        setTotalReviews(res.perfume?.total_reviews ?? computedTotal ?? 0);
        // publish update so product cards and product detail can refresh immediately
        try {
          const pidNum = Number(pid);
          window.dispatchEvent(new CustomEvent('perfume:reviews:updated', { detail: { perfumeId: pidNum, rating: res.perfume?.average_rating ?? computedAvg, reviews: res.perfume?.total_reviews ?? computedTotal } }));
        } catch (e) {
          // ignore
        }
      } catch (err) {
        // Fallback mock data
  const fallback = [
          {
            review_id: 1,
            perfume_id: 1,
            perfume_name: "Sample Perfume 1",
            user_id: 1,
            user_name: "Sarah Johnson",
            rating: 5,
            comment: "Amazing fragrance! Long-lasting and beautiful.",
            created_at: new Date().toISOString(),
          },
          {
            review_id: 2,
            perfume_id: 2,
            perfume_name: "Sample Perfume 2",
            user_id: 2,
            user_name: "Michael Chen",
            rating: 4,
            comment: "Great scent, though a bit pricey.",
            created_at: new Date().toISOString(),
          },
        ];
        setReviews(fallback);
        // compute average for fallback data
        const computedTotal = fallback.length;
        const computedAvg = computedTotal > 0 ? (fallback.reduce((s, r) => s + (r.rating || 0), 0) / computedTotal) : null;
        setAvgRating(computedAvg);
        setTotalReviews(computedTotal);
        try {
          window.dispatchEvent(new CustomEvent('perfume:reviews:updated', { detail: { perfumeId: Number(productId), rating: computedAvg, reviews: computedTotal } }));
        } catch (e) {}
      } finally {
        setLoadingReviews(false);
      }
    };

    fetchReviews();
  }, [productId, API_BASE]);

  // Auto-scroll removed per user request — reviews will display inline and the
  // user can scroll manually if the list overflows horizontally.

  const refreshReviews = async () => {
    try {
      if (productId === "all") {
        // reload all reviews
        const res = await fetch(`${API_BASE}/reviews`);
        const data = await res.json();
        if (data.reviews) {
          setReviews(data.reviews);
          const computedTotal = (data.reviews as any[]).length ?? 0;
          const computedAvg = computedTotal > 0 ? ((data.reviews as any[]).reduce((s, r) => s + (r.rating || 0), 0) / computedTotal) : null;
          setAvgRating(data.global_average_rating ?? computedAvg ?? null);
          setTotalReviews(data.total_reviews ?? computedTotal ?? 0);
          try {
            window.dispatchEvent(new CustomEvent('perfume:reviews:updated', { detail: { perfumeId: NaN, rating: data.global_average_rating ?? computedAvg, reviews: data.total_reviews ?? computedTotal } }));
          } catch (e) {}
        }
      } else {
        const res = await fetch(`${API_BASE}/perfumes/${productId}/reviews`);
        const data = await res.json();
        if (data.reviews) {
          // normalize product reviews
          const list = (data.reviews as any[]).map((r) => ({
            review_id: r.review_id ?? r.id,
            perfume_id: r.perfume_id ?? Number(productId),
            perfume_name: r.perfume_name ?? data.perfume?.name ?? "",
            user_id: r.user_id,
            user_name: r.user_name ?? r.username ?? "",
            rating: r.rating,
            comment: r.comment,
            created_at: r.created_at,
          }));
          setReviews(list as Review[]);
          const computedTotal = list.length ?? 0;
          const computedAvg = computedTotal > 0 ? (list.reduce((s, r) => s + (r.rating || 0), 0) / computedTotal) : null;
          setAvgRating(data.perfume?.average_rating ?? computedAvg ?? null);
          setTotalReviews(data.perfume?.total_reviews ?? computedTotal ?? 0);
          try {
            const pidNum = Number(productId);
            window.dispatchEvent(new CustomEvent('perfume:reviews:updated', { detail: { perfumeId: pidNum, rating: data.perfume?.average_rating ?? computedAvg, reviews: data.perfume?.total_reviews ?? computedTotal } }));
          } catch (e) {}
        }
      }
    } catch (err) {
      // Silently fail
    }
  };

  const handleSubmitReview = async () => {
    if (!isAuthenticated || !token) {
      toast({
        title: "Login required",
        description: "You must be logged in to add a review.",
      });
      navigate("/login");
      return;
    }

    const comment = newComment.trim();
    if (!comment) {
      toast({ title: "Error", description: "Comment is required." });
      return;
    }

    const form = new FormData();
    form.append("rating", String(newRating));
    form.append("comment", comment);

    try {
      const res = await fetch(`${API_BASE}/perfumes/${productId}/reviews`, {
        method: "POST",
        headers: {
          Authorization: token,
        },
        body: form,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit review");
      }

      toast({
        title: "Success!",
        description: "Your review has been added.",
      });

      setNewComment("");
      setNewRating(5);
      await refreshReviews();
      // Notify other parts of the app (product cards, listings) that reviews changed for this perfume
      try {
        const pid = Number(productId);
        window.dispatchEvent(new CustomEvent('perfume:reviews:changed', { detail: { perfumeId: pid } }));
      } catch (e) {
        // ignore
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Could not submit review.",
      });
    }
  };

  // reviewId: numeric id of review (review_id),
  // perfumeId: numeric perfume id to target the delete endpoint when viewing all reviews
  const handleDeleteReview = async (reviewId: number, perfumeId?: number) => {
    if (!confirm("Are you sure you want to delete this review?")) return;

    if (!token) {
      toast({ title: "Error", description: "Authentication required." });
      return;
    }

    // Determine which perfume id to use for the endpoint. When the component is
    // rendered for all reviews (productId === 'all') we must use the review's
    // perfume_id; otherwise use the page's productId.
    const targetPerfumeId = productId === "all" ? perfumeId : Number(productId);
    if (!targetPerfumeId) {
      toast({ title: "Error", description: "Cannot determine perfume id for deletion." });
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/perfumes/${targetPerfumeId}/reviews/${reviewId}`, {
        method: "DELETE",
        headers: {
          Authorization: token,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to delete review");
      }

      toast({ title: "Deleted", description: "Review removed successfully." });
      refreshReviews();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Could not delete review.",
      });
    }
  };

  return (
    <div className="mt-12 container mx-auto px-4">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-semibold mb-2">What Our Customers Say</h2>
        <p className="text-lg text-muted-foreground">
          Join thousands of satisfied customers who have shared their experiences
        </p>
        
        <div className="mt-6 flex items-center justify-center gap-6">
          <div className="text-center">
            <div className="text-4xl font-bold mb-1">{avgRating ? avgRating.toFixed(1) : "-"}</div>
            <div className="text-sm text-muted-foreground">Average Rating</div>
          </div>
          <div className="h-12 w-px bg-border"></div>
          <div className="text-center">
            <div className="text-4xl font-bold mb-1">{totalReviews}</div>
            <div className="text-sm text-muted-foreground">Total Reviews</div>
          </div>
        </div>
      </div>

      <div className="relative">
        {loadingReviews && (
          <div className="text-center py-12 text-muted-foreground">
            Loading reviews...
          </div>
        )}

        {!loadingReviews && reviews.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No reviews yet. Be the first to review!
          </div>
        )}

        {/* Horizontal scroll container: single-line layout */}
        <div className="flex gap-6 py-6 overflow-x-auto">
        {reviews.map((r) => (
          <div key={r.review_id} className="relative p-6 rounded-xl bg-background border shadow-sm min-w-[320px] flex-shrink-0">
            {/* Large quote marks */}
            <div className="absolute top-4 left-4 text-4xl text-yellow-400 opacity-30 font-serif">"</div>
            
            {/* Review content */}
            <div className="relative z-10">
              <p className="text-lg text-muted-foreground mb-4 pl-4">{r.comment}</p>
              
              <div className="flex items-center gap-4">
                {/* User avatar */}
                <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-medium">
                  {r.user_name.charAt(0).toUpperCase()}
                </div>
                
                <div className="flex-grow">
                  <div className="font-medium">{r.user_name}</div>
                  <div className="text-sm text-muted-foreground">
                    {r.perfume_name && `Review for ${r.perfume_name} • `}
                    {new Date(r.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>
                
                <div className="flex items-center gap-1">
                  <span className="text-yellow-400">★</span>
                  <span className="font-medium">{r.rating}</span>
                </div>
              </div>

              {(user?.id === r.user_id || user?.role_id === 1) && (
                <div className="mt-3">
                  <button
                    onClick={() => handleDeleteReview(r.review_id, r.perfume_id)}
                    className="text-red-600 hover:text-red-700 text-sm font-medium"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        </div>
      </div>

      {productId !== "all" && (
        <div className="mt-10 border-t pt-8">
          <h3 className="text-lg font-medium mb-4">Write a Review</h3>
          <div className="space-y-4 max-w-2xl">
            <div>
              <label className="block text-sm font-medium mb-1">Rating</label>
              <select
                value={newRating}
                onChange={(e) => setNewRating(Number(e.target.value))}
                className="w-full max-w-xs border rounded-md px-3 py-2 text-sm"
              >
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>
                    {n} Star{n > 1 ? "s" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Your Review</label>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Share your experience..."
                className="w-full border rounded-md p-3 text-sm"
                rows={4}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {newComment.length}/500 characters
              </p>
            </div>

            <Button onClick={handleSubmitReview} className="gradient-primary">
              Submit Review
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Reviews;