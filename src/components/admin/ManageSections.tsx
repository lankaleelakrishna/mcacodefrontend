import { useState, useEffect } from 'react';
import { ApiClient } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import AdminNavigation from './AdminNavigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  is_best_seller?: boolean;
  total_sold?: number;
  discount_percentage?: number;
  end_date?: string;
  updated_at?: string;
  discounted_price?: number;
}

const ManageSections = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [discountPercentage, setDiscountPercentage] = useState('');
  const [discountEndDate, setDiscountEndDate] = useState('');
  const { toast } = useToast();
  const { token } = useAuth();
  const [addingBestSellerIds, setAddingBestSellerIds] = useState<number[]>([]);
  const [confirmedBestSellerIds, setConfirmedBestSellerIds] = useState<number[]>([]);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const response = await ApiClient.adminGetPerfumes(token);
      if (response?.perfumes) {
        // Normalize product fields so UI can rely on a consistent shape
        const normalized = response.perfumes.map((p: any) => ({
          id: p.id,
          name: p.name || p.title,
          price: Number(p.price ?? p.discounted_price ?? 0),
          category: p.category ?? 'Uncategorized',
          // backend may return `is_best_seller` or `isBestSeller` depending on endpoint/transform
          is_best_seller: (p.is_best_seller ?? p.isBestSeller) ? true : false,
          total_sold: p.total_sold ?? p.totalSold ?? 0,
          discount_percentage: p.discount_percentage ?? p.discountPercentage ?? 0,
          end_date: p.end_date ?? p.endDate ?? null,
          updated_at: p.updated_at ?? p.updatedAt ?? null,
          discounted_price: p.discounted_price ?? p.discountedPrice ?? undefined,
        }));
        // Merge in any locally-confirmed best-seller flags to avoid flicker
        const merged = normalized.map((p: any) => ({
          ...p,
          is_best_seller: p.is_best_seller || confirmedBestSellerIds.includes(p.id),
        }));
        setProducts(merged);
        return;
      }
      // If response exists but doesn't include perfumes, log it for debugging
      console.warn('[ManageSections] adminGetPerfumes returned without perfumes:', response);
      throw new Error('Unexpected API response');
    } catch (err) {
      // Detailed error logging
      console.error('Failed to load products:', err);
      const anyErr = err as any;

      // Handle authentication error explicitly
      if (anyErr?.status === 401 || (anyErr?.data && anyErr.data?.message && String(anyErr.data.message).toLowerCase().includes('unauthor'))) {
        toast({
          title: 'Unauthorized',
          description: 'You need to be logged in as an admin to view this page.',
          variant: 'destructive',
        });
        return;
      }

      // If network/server is down, fall back to local product data (developer convenience)
      const msg = String(anyErr?.message || anyErr);
      if (msg.includes('Unable to connect to the server') || msg.includes('Failed to fetch') || msg.includes('ERR_CONNECTION_REFUSED')) {
        try {
          const mod = await import('@/data/products');
          const localProducts = (mod.products || []).map((p: any) => ({
            id: p.id,
            name: p.name,
            price: p.price ?? (p.sizes ? (p.sizes[1]?.price ?? p.sizes[0]?.price ?? 0) : 0),
            category: p.category ?? 'Uncategorized',
            is_best_seller: p.isBestSeller ?? false,
            total_sold: p.totalSold ?? 0,
            discount_percentage: p.discountPercentage ?? 0,
            end_date: p.endDate ?? null,
            updated_at: p.updated_at ?? null,
            discounted_price: p.discounted_price ?? undefined,
          }));
          setProducts(localProducts);
          toast({
            title: 'Offline mode',
            description: 'Could not reach API; using local product data instead.',
          });
          return;
        } catch (localErr) {
          console.error('Failed to load local products fallback:', localErr);
        }
      }

      // Generic error toast
      toast({
        title: 'Error',
        description: anyErr?.data?.message || anyErr?.message || 'Failed to load products.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (product: Product) => {
    if (!window.confirm(`Are you sure you want to delete ${product.name}? This action cannot be undone.`)) {
      return;
    }

    try {
      await ApiClient.adminDeletePerfume(product.id, token);
      await loadProducts();
      
      toast({
        title: 'Success',
        description: `Successfully deleted ${product.name}`,
      });
    } catch (err) {
      console.error('Failed to delete product:', err);
      toast({
        title: 'Error',
        description: 'Failed to delete product.',
        variant: 'destructive',
      });
    }
  };

  const toggleBestSeller = async (product: Product) => {
    const id = product.id;
    // If already marked, do nothing (we show "Added" state instead of Remove)
    if (product.is_best_seller) return;

    // Optimistically mark as added and show spinner
    setProducts((prev) => prev.map((p) => p.id === id ? { ...p, is_best_seller: true } : p));
    setAddingBestSellerIds((s) => Array.from(new Set([...s, id])));

    try {
      const formData = new FormData();
      formData.append('id', String(id));
      formData.append('is_best_seller', 'true');

      await ApiClient.adminUpdatePerfumeBestSeller(formData, token);

      // Mark as confirmed locally so background refresh doesn't remove it
      setConfirmedBestSellerIds((s) => Array.from(new Set([...s, id])));

      // Refresh in background to keep data fully in sync
      loadProducts();

      toast({ title: 'Success', description: `${product.name} added to Best Sellers` });
    } catch (err) {
      console.error('Failed to add best seller:', err);
      // revert optimistic change
      setProducts((prev) => prev.map((p) => p.id === id ? { ...p, is_best_seller: false } : p));
      // make sure it's not marked confirmed
      setConfirmedBestSellerIds((s) => s.filter(x => x !== id));
      toast({ title: 'Error', description: 'Failed to add to Best Sellers', variant: 'destructive' });
    } finally {
      setAddingBestSellerIds((s) => s.filter((x) => x !== id));
    }
  };

  const addSpecialOffer = async () => {
    if (!selectedProduct) return;

    try {
      const formData = new FormData();
      formData.append('id', String(selectedProduct.id));
      formData.append('discount_percentage', discountPercentage);
      formData.append('end_date', discountEndDate);

      // Also include a computed discounted_price so backend or other clients can use it directly
      try {
        const pct = Number(discountPercentage) || 0;
        const orig = Number(selectedProduct.price) || 0;
        if (pct > 0 && orig > 0) {
          const discounted = orig * (1 - pct / 100);
          formData.append('discounted_price', String(discounted.toFixed(2)));
        }
      } catch (e) {
        // ignore computation errors
      }

      await ApiClient.adminAddSpecialOffer(formData, token);
      await loadProducts();
      
      setSelectedProduct(null);
      setDiscountPercentage('');
      setDiscountEndDate('');
      
      toast({
        title: 'Success',
        description: `Added special offer for ${selectedProduct.name}`,
      });
    } catch (err) {
      console.error('Failed to add special offer:', err);
      toast({
        title: 'Error',
        description: 'Failed to add special offer.',
        variant: 'destructive',
      });
    }
  };

  const removeSpecialOffer = async (product: Product) => {
    try {
      await ApiClient.adminRemoveSpecialOffer(product.id, token);
      await loadProducts();
      
      toast({
        title: 'Success',
        description: `Removed special offer from ${product.name}`,
      });
    } catch (err) {
      console.error('Failed to remove special offer:', err);
      toast({
        title: 'Error',
        description: 'Failed to remove special offer.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
        <AdminNavigation />
        
        <div className="space-y-6">
          {/* Best Sellers */}
          <Card>
            <CardHeader>
              <CardTitle>Best Sellers</CardTitle>
              <CardDescription>Manage products marked as best sellers</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map(product => (
                    <TableRow key={product.id}>
                      <TableCell>{product.name}</TableCell>
                      <TableCell>{product.category}</TableCell>
                      <TableCell>₹{product.price}</TableCell>
                      <TableCell>
                        {product.is_best_seller ? (
                          <span className="inline-flex items-center rounded-full bg-green-100 text-green-800 px-2 py-1 text-xs font-semibold">Added</span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-gray-100 text-gray-700 px-2 py-1 text-xs">Not added</span>
                        )}
                      </TableCell>
                      <TableCell className="space-x-2">
                        {/* Show Add button for non-best-sellers; show a disabled "Added" state for best-sellers */}
                        {!product.is_best_seller ? (
                          <Button
                            variant="default"
                            onClick={() => toggleBestSeller(product)}
                            disabled={addingBestSellerIds.includes(product.id)}
                          >
                            {addingBestSellerIds.includes(product.id) ? 'Adding…' : 'Add'}
                          </Button>
                        ) : (
                          <Button
                            variant="default"
                            className="bg-green-600 text-white"
                            disabled
                          >
                            Added
                          </Button>
                        )}

                        <Button
                          variant="destructive"
                          onClick={() => handleDelete(product)}
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Special Offers */}
          <Card>
            <CardHeader>
              <CardTitle>Special Offers</CardTitle>
              <CardDescription>Manage products with special discounts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>Add Special Offer</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Special Offer</DialogTitle>
                      <DialogDescription>
                        Set up a special offer for a product
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <label>Product</label>
                        <select
                          className="w-full px-3 py-2 border rounded-md"
                          onChange={(e) => {
                            const product = products.find(p => p.id === Number(e.target.value));
                            setSelectedProduct(product || null);
                          }}
                        >
                          <option value="">Select a product...</option>
                          {products
                            .filter(p => !p.discount_percentage)
                            .map(product => (
                              <option key={product.id} value={product.id}>
                                {product.name}
                              </option>
                            ))}
                        </select>
                      </div>
                      <div className="grid gap-2">
                        <label>Discount Percentage</label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={discountPercentage}
                          onChange={(e) => setDiscountPercentage(e.target.value)}
                          placeholder="Enter discount percentage"
                        />
                      </div>
                      {selectedProduct && (
                        <div className="p-3 rounded-md bg-muted border">
                          <div className="text-sm">Preview</div>
                          <div className="mt-2 flex items-baseline gap-3">
                            <div className="text-xs text-muted-foreground line-through">₹{typeof selectedProduct.price === 'number' ? selectedProduct.price.toFixed(2) : String(selectedProduct.price)}</div>
                            <div className="font-bold text-lg">
                              ₹{(() => {
                                const pct = Number(discountPercentage) || 0;
                                const orig = Number(selectedProduct.price) || 0;
                                if (pct > 0 && orig > 0) {
                                  const discounted = (orig * (1 - pct / 100));
                                  return discounted.toFixed(2);
                                }
                                return orig.toFixed(2);
                              })()}
                            </div>
                            <div className="ml-2 text-sm text-accent">{discountPercentage ? `-${Number(discountPercentage)}%` : ''}</div>
                          </div>
                          <div className="text-sm text-muted-foreground mt-2">This product will appear in the <strong>Special Offers</strong> section when created.</div>
                        </div>
                      )}
                      <div className="grid gap-2">
                        <label>End Date</label>
                        <Input
                          type="date"
                          value={discountEndDate}
                          onChange={(e) => setDiscountEndDate(e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                      <Button onClick={addSpecialOffer}>Create Special Offer</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Original Price</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products
                    .filter(p => p.discount_percentage)
                    .map(product => (
                      <TableRow key={product.id}>
                        <TableCell>{product.name}</TableCell>
                        <TableCell>₹{product.price}</TableCell>
                        <TableCell>{product.discount_percentage}%</TableCell>
                        <TableCell>{product.end_date ? new Date(product.end_date).toLocaleDateString() : '-'}</TableCell>
                        <TableCell>
                          <Button
                            variant="destructive"
                            onClick={() => removeSpecialOffer(product)}
                          >
                            Remove
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ManageSections;