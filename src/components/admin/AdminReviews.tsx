import React, { useEffect, useState } from 'react';
import { ApiClient } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const AdminReviews: React.FC = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<Record<string, any>>({});
  const [total, setTotal] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const fetchReviews = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await ApiClient.adminGetAllReviews(token ?? undefined);
      // Expecting { total_reviews, reviews_by_perfume }
      setTotal(res.total_reviews || 0);
      setGroups(res.reviews_by_perfume || {});
    } catch (err: any) {
      setError(err?.message || 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = async (reviewId: number) => {
    if (!confirm('Delete this review? This action cannot be undone.')) return;
    try {
      await ApiClient.adminDeleteReview(reviewId, token ?? undefined);
      // remove review from local state
      const newGroups: Record<string, any> = {};
      Object.entries(groups).forEach(([pid, grp]) => {
        newGroups[pid] = { ...grp, reviews: grp.reviews.filter((r: any) => r.id !== reviewId) };
      });
      setGroups(newGroups);
      setTotal((t) => Math.max(0, t - 1));
    } catch (err: any) {
      alert(err?.message || 'Failed to delete review');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <Button variant="default" size="sm" className="bg-primary text-white" onClick={() => navigate(-1)}>Back</Button>
        <h2 className="text-2xl font-semibold">Customer Reviews</h2>
        <div />
      </div>
      {loading && <div>Loading reviews…</div>}
      {error && <div className="text-red-600">{error}</div>}
      {!loading && !error && (
        <div>
          <div className="mb-4 text-sm text-muted-foreground">Total reviews: {total}</div>
          {Object.keys(groups).length === 0 && <div>No reviews found.</div>}
          {Object.entries(groups).map(([perfumeId, grp]) => (
            <section key={perfumeId} className="mb-6 border rounded-md p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-medium">{grp.perfume_name || `Perfume ${perfumeId}`}</h3>
                <div className="text-sm text-muted-foreground">{grp.reviews.length} review(s)</div>
              </div>

              <div className="space-y-3">
                {grp.reviews.map((r: any) => (
                  <div key={r.id} className="p-3 bg-white rounded-md border flex items-start justify-between">
                    <div>
                      <div className="text-sm font-semibold">{r.user_name || r.username || 'Customer'}</div>
                      <div className="text-xs text-muted-foreground">{r.email || ''} • {new Date(r.created_at).toLocaleString()}</div>
                      <div className="mt-2">Rating: {r.rating} / 5</div>
                      <div className="mt-1 text-sm">{r.comment}</div>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <button onClick={() => handleDelete(r.id)} className="rounded bg-red-600 text-white px-3 py-1 text-sm">Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminReviews;
