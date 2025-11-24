import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiClient } from "@/lib/api-client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

export default function RecentOrders() {
  const { token, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [limit, setLimit] = useState<number>(5);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      navigate('/login');
      return;
    }

    // If navigation provided prefetched recent orders via state, use them
    const prefetched = (location.state as any)?.recentOrders;
    if (prefetched && Array.isArray(prefetched)) {
      const normalized = (prefetched || []).map((o: any) => {
        const trackingVal = o.shipment_id || o.tracking_id || o.tracking_number || o.tracking || o.trackingId || o.shipmentId || o.shipment;
        if (o.order_id && !o.id) {
          return {
            id: o.order_id,
            created_at: o.date && o.time ? `${o.date} ${o.time}` : o.created_at,
            shipping_city: o.city || o.shipping_city,
            status: o.status,
            total_amount: o.grand_total ?? o.total_amount ?? o.total,
            tracking: trackingVal,
            items: (o.items || []).map((it: any) => ({
              name: it.name,
              quantity: it.quantity,
              photo_url: it.photo || it.photo_url,
              unit_price: it.unit_price ?? it.price ?? 0,
            })),
          };
        }
        return {
          id: o.id ?? o.order_id,
          created_at: o.created_at,
          shipping_city: o.shipping_city || o.city,
          status: o.status,
          total_amount: o.total_amount ?? o.total ?? o.grand_total,
          tracking: trackingVal,
          items: (o.items || []).map((it: any) => ({
            name: it.name,
            quantity: it.quantity,
            photo_url: it.photo_url ?? it.photo,
            unit_price: it.unit_price ?? it.unit_price ?? it.price ?? 0,
          })),
        };
      });
      setOrders(normalized);
      setLoading(false);
      return;
    }

    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const res = await ApiClient.getRecentOrders(token as string, limit);
        const data = res?.recent_orders || res?.orders || res || [];
        if (!mounted) return;
        // Normalize compact shape if necessary
        const normalized = (Array.isArray(data) ? data : []).map((o: any) => {
          const trackingVal = o.shipment_id || o.tracking_id || o.tracking_number || o.tracking || o.trackingId || o.shipmentId || o.shipment;
          // If backend returned compact recent_orders (order_id, date, time, grand_total, items)
          if (o.order_id && !o.id) {
            return {
              id: o.order_id,
              created_at: o.date && o.time ? `${o.date} ${o.time}` : o.created_at,
              shipping_city: o.city || o.shipping_city,
              status: o.status,
              total_amount: o.grand_total ?? o.total_amount ?? o.total,
              tracking: trackingVal,
              items: (o.items || []).map((it: any) => ({
                name: it.name,
                quantity: it.quantity,
                photo_url: it.photo || it.photo_url,
                unit_price: it.unit_price ?? it.price ?? 0,
              })),
            };
          }
          // Otherwise assume it's already the full shape
          return {
            id: o.id ?? o.order_id,
            created_at: o.created_at,
            shipping_city: o.shipping_city || o.city,
            status: o.status,
            total_amount: o.total_amount ?? o.total ?? o.grand_total,
            tracking: trackingVal,
            items: (o.items || []).map((it: any) => ({
              name: it.name,
              quantity: it.quantity,
              photo_url: it.photo_url ?? it.photo,
              unit_price: it.unit_price ?? it.unit_price ?? it.price ?? 0,
            })),
          };
        });
        setOrders(normalized);
      } catch (err) {
        console.error('Failed to load recent orders', err);
        setOrders([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, [isAuthenticated, token, limit]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Recent Orders</h1>
          <div className="flex items-center gap-2">
            <label className="text-sm">Show</label>
            <select value={limit} onChange={(e) => setLimit(Number(e.target.value))} className="border rounded px-2 py-1">
              <option value={3}>3</option>
              <option value={5}>5</option>
              <option value={10}>10</option>
            </select>
          </div>
        </div>

        {loading ? (
          <p>Loading recent orders…</p>
        ) : orders.length === 0 ? (
          <p className="text-muted-foreground">You have no recent orders.</p>
        ) : (
          <div className="space-y-4">
            {orders.map((order: any) => (
              <Card key={order.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      {/* Show first item name as the main title (hide order id) */}
                      <CardTitle>
                        {order.items && order.items.length > 0
                          ? (order.items.length === 1
                              ? order.items[0].name
                              : `${order.items[0].name} +${order.items.length - 1} more`)
                          : `Order`}
                      </CardTitle>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">
                        {order.created_at ? (
                          // If created_at already ISO or parseable, show localized Hyderabad time
                          (() => {
                            try {
                              const dt = new Date(order.created_at);
                              return dt.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
                            } catch (e) {
                              return String(order.created_at);
                            }
                          })()
                        ) : ('')}
                      </div>
                      <div className={`px-2 py-1 rounded text-xs font-medium ${order.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {order.status}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between mb-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Ship to</div>
                      <div className="font-medium">{order.shipping_city || '—'}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Total</div>
                      <div className="font-medium">₹{parseFloat(order.total_amount ?? 0).toFixed(2)}</div>
                    </div>
                  </div>

                  <div className="grid gap-3">
                    {order.tracking ? (
                      <div className="mb-2">
                        <strong className="mr-2">Tracking:</strong>
                        <a href={`https://www.dtdc.com/track-your-shipment/`} target="_blank" rel="noopener noreferrer" className="text-primary underline">{order.tracking}</a>
                      </div>
                    ) : null}
                    {(order.items || []).map((it: any, idx: number) => (
                      <div key={idx} className="flex gap-3 items-center border-b pb-2">
                        <img src={it.photo_url ?? '/images/placeholder.png'} alt={it.name} className="w-16 h-16 object-cover rounded" />
                        <div className="flex-1">
                          <div className="font-medium">{it.name}</div>
                          <div className="text-sm text-muted-foreground">Qty: {it.quantity}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">₹{parseFloat(it.unit_price ?? 0).toFixed(2)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
