import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiClient } from "@/lib/api-client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export default function Orders() {
	const { token, isAuthenticated } = useAuth();
	const navigate = useNavigate();
	const location = useLocation();
	const { toast } = useToast();

	const [orders, setOrders] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (!isAuthenticated || !token) {
			navigate('/login');
			return;
		}

		// If navigation provided prefetched recent orders via state, use them to avoid extra fetch
		const prefetched = (location.state as any)?.recentOrders;
		if (prefetched && Array.isArray(prefetched)) {
			// Detect compact recent_orders shape (order_id, date, time, grand_total, items)
			const looksCompact = prefetched.length > 0 && (prefetched[0].order_id || prefetched[0].grand_total);
			if (looksCompact) {
				const mapped = prefetched.map((p: any) => {
					const id = p.order_id ?? p.id;
					// build a created_at ISO if possible from date+time, otherwise use provided created_at
					let created_at: any = p.created_at ?? undefined;
					if (!created_at && p.date) {
						try {
							created_at = new Date(`${p.date} ${p.time ?? ''}`).toISOString();
						} catch (e) {
							created_at = `${p.date} ${p.time ?? ''}`;
						}
					}

					return {
						id,
						created_at,
						total_amount: p.grand_total ?? p.total_amount ?? p.total,
						shipping_city: p.city ?? p.shipping_city,
						status: p.status,
						payment_method: p.payment_method,
						items: (p.items || []).map((it: any) => ({
							name: it.name,
							quantity: it.quantity,
							photo_url: it.photo ?? it.photo_url,
							unit_price: it.unit_price ?? it.price ?? 0,
							subtotal: it.subtotal ?? (it.quantity * (it.unit_price ?? it.price ?? 0)),
						})),
					};
				});
				setOrders(mapped);
				setLoading(false);
				return;
			}

			// otherwise assume the prefetched array already matches the page shape
			setOrders(prefetched || []);
			setLoading(false);
			return;
		}

		const load = async () => {
			try {
				setLoading(true);
				const res = await ApiClient.getOrders(token as string);
				// backend returns { orders: [...] } or array directly
				const data = res?.orders || res;
				setOrders(data || []);
			} catch (err: any) {
				console.error('Failed to load orders', err);
				toast({ title: 'Error', description: err?.message || 'Failed to load orders', variant: 'destructive' });
			} finally {
				setLoading(false);
			}
		};

		load();
	}, [isAuthenticated, token]);

	return (
		<div className="min-h-screen bg-background">
			<Navbar />
			<main className="container mx-auto px-4 py-8">
				<h1 className="text-3xl font-bold mb-6">My Orders</h1>

				{loading ? (
					<p>Loading...</p>
				) : orders.length === 0 ? (
					<p className="text-muted-foreground">You have no previous orders.</p>
				) : (
					<div className="space-y-4">
						{orders.map((order: any) => (
							<Card key={order.id}>
								<CardHeader>
									<div className="flex items-center justify-between">
										<CardTitle>Order #{order.id}</CardTitle>
										<div className="text-sm">
											<span className={`px-2 py-1 rounded text-xs font-medium ${order.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
												{order.status}
											</span>
										</div>
									</div>
								</CardHeader>
								<CardContent>
									<div className="flex justify-between mb-2">
										<div>
											<div className="text-sm text-muted-foreground">Placed</div>
											<div className="font-medium">{new Date(order.created_at).toLocaleString()}</div>
											<div className="text-sm text-muted-foreground">{order.shipping_first_name} {order.shipping_last_name} • {order.shipping_city}</div>
										</div>
										<div className="text-right">
											<div className="text-sm text-muted-foreground">Total</div>
											<div className="font-medium">₹{parseFloat(order.total_amount ?? order.total ?? 0).toFixed(2)}</div>
											<div className="text-xs text-muted-foreground">Payment: {order.payment_method}</div>
										</div>
									</div>

									<div className="grid gap-2">
										{(order.items || []).map((it: any, idx: number) => (
											<div key={idx} className="flex gap-3 items-center border-b pb-2">
												<img src={it.photo_url ?? '/images/placeholder.png'} alt={it.name} className="w-16 h-16 object-cover rounded" />
												<div className="flex-1">
													<div className="font-medium">{it.name}</div>
													<div className="text-sm text-muted-foreground">{it.size ?? '—'}</div>
													<div className="text-sm text-muted-foreground">{it.quantity} × ₹{parseFloat(it.unit_price ?? it.price ?? 0).toFixed(2)}</div>
												</div>
												<div className="text-right">
													<div className="font-medium">₹{parseFloat(it.subtotal ?? (it.quantity * (it.unit_price ?? it.price ?? 0))).toFixed(2)}</div>
												</div>
											</div>
										))}
									</div>

									{order.shipping_address && (
										<div className="mt-4 text-sm text-muted-foreground">
											<div><strong>Ship to:</strong> {order.shipping_first_name} {order.shipping_last_name}</div>
											<div>{order.shipping_address}, {order.shipping_city} {order.shipping_zip}</div>
										</div>
									)}
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

