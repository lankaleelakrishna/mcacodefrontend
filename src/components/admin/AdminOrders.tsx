import React, { useEffect, useState } from 'react';
import AdminNavigation from '@/components/admin/AdminNavigation';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ApiClient } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { format } from 'date-fns';

const AdminOrders = () => {
  const { token } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [dateRange, setDateRange] = useState<any | undefined>(undefined);
  const { toast } = useToast();

  const formatDate = (d?: Date) => (d ? format(d, 'yyyy-MM-dd') : undefined);

  const loadOrders = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const start = dateRange?.from ? formatDate(dateRange.from) : undefined;
      const end = dateRange?.to ? formatDate(dateRange.to) : undefined;
      const res = await ApiClient.adminGetAllOrders(page, limit, statusFilter, start, end, token);
      // Expecting { orders: [...], meta: { page, limit, total, pages } }
      setOrders(res.orders || res.data || []);
      if (res.meta) {
        setTotalPages(res.meta.pages || 1);
      }
    } catch (err: any) {
      console.error('Failed to load admin orders', err);
      toast({ title: 'Error', description: 'Failed to load orders', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [token, page, statusFilter, dateRange]);

  const [shipmentInputs, setShipmentInputs] = useState<Record<string, string>>({});

  const handleShipmentChange = (orderId: string | number, value: string) => {
    setShipmentInputs(prev => ({ ...prev, [String(orderId)]: value }));
  };

  const saveShipmentId = async (orderId: string | number) => {
    if (!token) return;
    const sid = shipmentInputs[String(orderId)];
    if (!sid) return toast({ title: 'No Shipment ID', description: 'Please enter a shipment id', variant: 'default' });
    try {
      setLoading(true);
      await ApiClient.adminUpdateOrderShipment(orderId, sid, token as string);
      toast({ title: 'Saved', description: 'Shipment id saved', variant: 'default' });
      // Update local state to show shipment id
      setOrders(prev => prev.map(o => (o.id == orderId || o.order_id == orderId ? { ...o, shipment_id: sid, tracking_number: sid } : o)));
    } catch (err: any) {
      console.error('Failed to save shipment id', err);
      toast({ title: 'Error', description: 'Failed to save shipment id', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const prev = () => setPage(p => Math.max(1, p - 1));
  const next = () => setPage(p => Math.min(totalPages || 1, p + 1));

  return (
    <div>
      <Navbar />
      <div className="container mx-auto p-8">
        <AdminNavigation />
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">All Orders</h1>
          <div className="text-sm text-muted-foreground">Showing page {page}</div>
        </div>

        <div className="mb-6 bg-background border rounded p-4 flex flex-col md:flex-row md:items-center md:gap-4">
          <div className="flex items-center gap-3 mb-3 md:mb-0">
            <label className="text-sm font-medium mr-2">Status</label>
            <select
              className="h-10 rounded-md border px-3"
              value={statusFilter ?? ''}
              onChange={(e) => { setStatusFilter(e.target.value || undefined); setPage(1); }}
            >
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="flex items-center gap-3 mb-3 md:mb-0">
            <label className="text-sm font-medium mr-2">Date Range</label>
            <DatePickerWithRange date={dateRange} onDateChange={(d) => { setDateRange(d); setPage(1); }} />
          </div>

          <div className="ml-auto flex gap-2">
            <Button
              type="button"
              onClick={() => { setPage(1); loadOrders(); }}
            >Apply</Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => { setStatusFilter(undefined); setDateRange(undefined); setPage(1); }}
            >Clear</Button>
          </div>
        </div>

        {loading && <div>Loading...</div>}

        {orders.length === 0 && !loading && (
          <div className="text-muted-foreground">No orders found.</div>
        )}

        {orders.map((o: any) => (
          <section key={o.id} className="mb-8 border rounded p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-lg font-semibold">Order #{o.id}</div>
                <div className="text-sm text-muted-foreground">By {o.username || o.user_name || `User ${o.user_id}`}</div>
                <div className="text-sm">Status: {o.status}</div>
                <div className="text-sm">Total: {o.total_amount} | Shipping: {o.shipping_cost} | Tax: {o.tax_amount}</div>
                <div className="text-sm">Placed: {o.created_at}</div>
              </div>
              <div className="text-right">
                <div>{o.shipping_first_name} {o.shipping_last_name}</div>
                <div className="text-sm">{o.shipping_address}, {o.shipping_city} {o.shipping_state} {o.shipping_zip}</div>
                <div className="text-sm">{o.shipping_phone} • {o.shipping_email}</div>
              </div>
            </div>

            <div className="mt-4">
              <h4 className="font-medium mb-2">Shipment / Tracking</h4>
              <div className="flex items-center gap-3">
                {(o.shipment_id || o.tracking_number) ? (
                  <>
                    <a href={`https://www.dtdc.com/track-your-shipment/`} target="_blank" rel="noopener noreferrer" className="text-primary underline">{o.shipment_id || o.tracking_number}</a>
                    <Input
                      value={shipmentInputs[String(o.id)] ?? ''}
                      onChange={(e) => handleShipmentChange(o.id, (e.target as HTMLInputElement).value)}
                      placeholder="Edit shipment id"
                      className="w-56"
                    />
                    <Button onClick={() => saveShipmentId(o.id)}>Save</Button>
                  </>
                ) : (
                  <>
                    <Input
                      value={shipmentInputs[String(o.id)] ?? ''}
                      onChange={(e) => handleShipmentChange(o.id, (e.target as HTMLInputElement).value)}
                      placeholder="Enter shipment id"
                      className="w-56"
                    />
                    <Button onClick={() => saveShipmentId(o.id)}>Save</Button>
                  </>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2">Items</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item ID</TableHead>
                    <TableHead>Perfume</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(o.items || []).map((it: any) => (
                    <TableRow key={it.id || `${o.id}-${it.perfume_id}-${it.size}` }>
                      <TableCell>{it.id || ''}</TableCell>
                      <TableCell>{it.perfume_name || it.name || it.perfume_id}</TableCell>
                      <TableCell>{it.size}</TableCell>
                      <TableCell>{it.quantity || it.qty || it.q || 1}</TableCell>
                      <TableCell>{it.price || it.unit_price || it.total_price}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </section>
        ))}

        <div className="flex items-center justify-between mt-6">
          <div>Page {page} of {totalPages || 1}</div>
          <div className="flex gap-2">
            <Button type="button" onClick={prev} disabled={page <= 1}>Previous</Button>
            <Button type="button" onClick={next} disabled={page >= (totalPages || 1)}>Next</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOrders;