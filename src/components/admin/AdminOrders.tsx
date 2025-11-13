import React, { useEffect, useState } from 'react';
import { ApiClient } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const STATUS_OPTIONS = ['pending', 'processing', 'shipped', 'completed', 'cancelled', 'refunded'];

const AdminOrders: React.FC = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<Record<string, boolean>>({});

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await ApiClient.adminListOrders(undefined, token ?? undefined);
      // backend shape may vary; try common keys
  const list = res?.orders || res?.data || res?.results || res;
  setOrders(Array.isArray(list) ? list : []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // details view removed — status changes call the admin route directly

  // helpers to be resilient against different backend field names
  const getCustomer = (o: any) => {
    if (!o) return '—';
    const candidate = o.customer_name || o.user_name || o.name || o.full_name || o.email || o.billing_name || o.customer || (o.user && (o.user.name || o.user.email));
    if (candidate) return candidate;
    // try composing from first/last
    const first = o.first_name || o.billing_first_name || o.customer_first_name || '';
    const last = o.last_name || o.billing_last_name || o.customer_last_name || '';
    const combined = `${first} ${last}`.trim();
    return combined || '—';
  };

  const getTotal = (o: any) => {
    if (!o) return '—';
    return o.total ?? o.amount ?? o.grand_total ?? o.total_amount ?? o.order_total ?? '—';
  };

  const changeStatus = async (orderId: number | string, status: string) => {
    if (!confirm(`Change order ${orderId} status to "${status}"?`)) return;
    setUpdating((s) => ({ ...s, [orderId]: true }));
    try {
      await ApiClient.adminUpdateOrderStatus(orderId, status, token ?? undefined);
      setOrders((prev) => prev.map((o) => (String(o.id) === String(orderId) ? { ...o, status } : o)));
    } catch (err: any) {
      alert(err?.message || 'Failed to update order status');
    } finally {
      setUpdating((s) => ({ ...s, [orderId]: false }));
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <Button variant="default" size="sm" className="bg-primary text-white" onClick={() => navigate(-1)}>Back</Button>
        <h2 className="text-2xl font-semibold">Orders</h2>
        <div />
      </div>

      {loading && <div>Loading orders…</div>}
      {error && <div className="text-red-600">{error}</div>}

      {!loading && !error && (
        <div className="space-y-4">
          {orders.length === 0 && <div>No orders found.</div>}

          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border">
              <thead>
                <tr className="text-left">
                  <th className="px-3 py-2 border">ID</th>
                  <th className="px-3 py-2 border">Customer</th>
                  <th className="px-3 py-2 border">Total</th>
                  <th className="px-3 py-2 border">Status</th>
                  <th className="px-3 py-2 border">Created</th>
                  <th className="px-3 py-2 border">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o: any) => (
                  <React.Fragment key={o.id}>
                    <tr>
                      <td className="px-3 py-2 border">{o.id}</td>
                      <td className="px-3 py-2 border">{getCustomer(o)}</td>
                      <td className="px-3 py-2 border">₹{getTotal(o)}</td>
                      <td className="px-3 py-2 border">{o.status || '—'}</td>
                      <td className="px-3 py-2 border">{o.created_at ? new Date(o.created_at).toLocaleString() : '—'}</td>
                      <td className="px-3 py-2 border">
                        <div className="flex items-center gap-2">
                          {/* View button removed per request; details available via backend */}
                          <select
                            value={o.status || ''}
                            onChange={(e) => changeStatus(o.id, e.target.value)}
                            className="border rounded px-2 py-1 text-sm"
                            disabled={!!updating[o.id]}
                          >
                            <option value="">— change status —</option>
                            {STATUS_OPTIONS.map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </div>
                      </td>
                    </tr>
                    {/* details row removed */}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
