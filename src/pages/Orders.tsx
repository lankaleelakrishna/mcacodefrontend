import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

export default function Orders() {
  const { token, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      navigate('/login');
      return;
    }

    const load = async () => {
      setLoading(true);
        try {
        // Request all orders for the user (no limit param). If backend limits results, update backend to return full history.
        const res = await fetch(`${API_BASE}/recent-orders`, {
          headers: { Authorization: token }
        });
  const data = await res.json();
        const list = data.recent_orders || data.recentOrders || [];
        setOrders(list);
      } catch (e) {
        console.error('Failed to load recent orders', e);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [isAuthenticated, token, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
  <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Orders</h1>
        </div>

        {loading && <div className="text-sm text-muted-foreground">Loading your orders...</div>}

        {!loading && orders.length === 0 && (
          <div className="text-sm text-muted-foreground">You have not placed any orders yet.</div>
        )}

        <div className="space-y-6">
          {orders.map((o) => (
            <div key={o.order_id} className="border rounded-lg p-4 bg-card">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-sm text-muted-foreground">{o.date} • {o.time} • {o.city}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-lg">₹{o.grand_total}</div>
                  <div className="text-sm text-muted-foreground">{o.items_count} {o.items_count === 1 ? 'item' : 'items'}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {o.items.map((it) => (
                  <div key={it.photo} className="flex items-center gap-3">
                    <img src={it.photo} alt={it.name} className="w-16 h-16 object-cover rounded" />
                    <div>
                      <div className="font-medium">{it.name}</div>
                      <div className="text-sm text-muted-foreground">Qty: {it.quantity}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        
      </main>
      <Footer />
    </div>
  );
}