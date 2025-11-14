import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
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
  // CamelCase aliases used throughout the component (backend may return snake_case or camelCase)
  discountEndDate?: string;
  discountPercentage?: number;
  originalPrice?: number;
}

const ManageSections = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [discountPercentage, setDiscountPercentage] = useState('');
  const [discountEndDate, setDiscountEndDate] = useState('');
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [specialOffers, setSpecialOffers] = useState<Product[]>([]);
  const { toast } = useToast();
  const { token } = useAuth();
  const location = useLocation();

  const loadQueuedProducts = () => {
    try {
      const key = 'addedBestSellers';
      const queued = JSON.parse(sessionStorage.getItem(key) || '[]') as Product[];
      console.log('Found queued products:', queued);
      
      if (Array.isArray(queued) && queued.length > 0) {
        setProducts(prev => {
          const updated = [...prev];
          queued.forEach(q => {
            const index = updated.findIndex(p => p.id === q.id);
            if (index === -1) updated.push(q);
            else updated[index] = { ...updated[index], ...q };
          });
          console.log('Updated products with queue:', updated);
          return updated;
        });

        setBestSellers(prev => {
          const updated = [...prev];
          queued.forEach(q => {
            if (!updated.find(p => p.id === q.id)) {
              updated.push(q);
            }
          });
          console.log('Updated best sellers with queue:', updated);
          return updated;
        });
      }
    } catch (e) {
      console.error('Error processing queue:', e);
    }
  };

  const loadSpecialOffers = async () => {
    try {
      const res = await ApiClient.getSpecialOffers();
      console.log('[ManageSections] getSpecialOffers response:', res);
      const offers = res.perfumes || [];

      // Auto-remove expired offers on load (backend cleanup)
      const now = new Date();
      const toRemove: number[] = [];
      offers.forEach((p: any) => {
        const end: Date | undefined = p.discountEndDate || (p.end_date ? new Date(p.end_date) : undefined);
        if (end && end < now) {
          toRemove.push(p.id);
        }
      });

      if (toRemove.length > 0 && token) {
        // remove expired offers on backend, run sequentially to avoid rate issues
        for (const id of toRemove) {
          try {
            await ApiClient.adminRemoveSpecialOffer(id, token);
            console.log('[SpecialOffers] Removed expired offer id=', id);
          } catch (e) {
            console.error('[SpecialOffers] Failed to remove expired offer id=', id, e);
          }
        }
        // reload offers after cleanup
        const refreshed = await ApiClient.getSpecialOffers();
        setSpecialOffers(refreshed.perfumes || []);
        return;
      }

      setSpecialOffers(offers);
    } catch (err) {
      console.error('Failed to load special offers:', err);
      setSpecialOffers([]);
    }
  };

  useEffect(() => {
    loadProducts();
    loadQueuedProducts();
    loadSpecialOffers();
  }, []);

  // Periodically refresh special offers to auto-clean expired entries while the page is open
  useEffect(() => {
    const interval = setInterval(() => {
      loadSpecialOffers();
    }, 60 * 1000); // every 60 seconds
    return () => clearInterval(interval);
  }, [token]);

  const loadProducts = async () => {
    try {
      // Load both regular products and best sellers
      console.log('Fetching products and best sellers...');
      const [productsResponse, bestSellersResponse] = await Promise.all([
        ApiClient.adminGetPerfumes(token),
        ApiClient.getBestSellers()
      ]);
      
      if (!productsResponse) {
        console.error('No response from products API');
        throw new Error('No response from products API');
      }

      if (productsResponse?.perfumes) {
        // Mark best sellers in the products list
        let fetched = productsResponse.perfumes as Product[];
        const bestSellerIds = new Set((bestSellersResponse?.best_sellers || []).map(b => b.id));
        
        // Update is_best_seller flag for each product
        fetched = fetched.map(p => ({
          ...p,
          is_best_seller: bestSellerIds.has(p.id)
        }));

        // Merge in addedProduct from location.state (if present) to avoid flashing empty list
        try {
          const added = (location && (location as any).state && (location as any).state.addedProduct) as Product | undefined;
          if (added && added.id) {
            // Ensure products contains the added product
            if (!fetched.find(p => p.id === added.id)) {
              fetched = [...fetched, added];
            } else {
              fetched = fetched.map(p => p.id === added.id ? { ...p, ...added } : p);
            }
          }
        } catch (e) {
          // ignore
        }

        // Also merge any products queued in sessionStorage (support adding multiple)
        try {
          const key = 'addedBestSellers';
          const queued = JSON.parse(sessionStorage.getItem(key) || '[]') as Product[];
          if (Array.isArray(queued) && queued.length) {
            queued.forEach(q => {
              if (!fetched.find(p => p.id === q.id)) fetched.push(q);
              else fetched = fetched.map(p => p.id === q.id ? { ...p, ...q } : p);
            });
            // clear the queue after merging
            sessionStorage.removeItem(key);
          }
        } catch (e) {
          // ignore session errors
        }

        setProducts(fetched);

        // Get all products marked as best sellers
        const bestSellerProducts = fetched.filter(p => p.is_best_seller);
        console.log('Best seller products:', bestSellerProducts);

        // Set both states
        setProducts(fetched);
        setBestSellers(bestSellerProducts);

        // Also handle any queued items
        const key = 'addedBestSellers';
        try {
          const queued = JSON.parse(sessionStorage.getItem(key) || '[]') as Product[];
          if (Array.isArray(queued) && queued.length > 0) {
            const newBestSellers = [...bestSellerProducts];
            queued.forEach(q => {
              if (!newBestSellers.find(p => p.id === q.id)) {
                newBestSellers.push({ ...q, is_best_seller: true });
              }
            });
            setBestSellers(newBestSellers);
          }
        } catch (e) {
          console.error('Error processing queued best sellers:', e);
        }
        return;
      }
      // If response exists but doesn't include perfumes, log it for debugging
      console.warn('[ManageSections] adminGetPerfumes returned without perfumes:', productsResponse);
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
          
          // Set best sellers from local data
          const localBestSellers = localProducts.filter(p => p.is_best_seller);
          setBestSellers(localBestSellers);

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
    try {
      const formData = new FormData();
      formData.append('id', String(product.id));
      formData.append('is_best_seller', (!product.is_best_seller).toString());
      
      await ApiClient.adminUpdatePerfumeBestSeller(formData, token);
      await loadProducts();
      
      toast({
        title: 'Success',
        description: `${product.name} ${product.is_best_seller ? 'removed from' : 'added to'} Best Sellers`,
      });
    } catch (err) {
      console.error('Failed to update best seller status:', err);
      toast({
        title: 'Error',
        description: 'Failed to update best seller status.',
        variant: 'destructive',
      });
    }
  };

  const removeFromBestSellers = async (product: Product) => {
    if (!confirm(`Remove ${product.name} from Best Sellers? This will not delete the product.`)) return;

    console.log('Removing from best sellers:', product);

    // Store current state before updating
    const prevBest = bestSellers;
    
    // Remove from UI immediately
    setBestSellers(prev => prev.filter(p => p.id !== product.id));
    setProducts(prev => prev.map(p => 
      p.id === product.id ? { ...p, is_best_seller: false } : p
    ));

    // Remove from sessionStorage if present
    const key = 'addedBestSellers';
    const queued = JSON.parse(sessionStorage.getItem(key) || '[]') as Product[];
    if (Array.isArray(queued) && queued.length > 0) {
      const filtered = queued.filter(q => q.id !== product.id);
      if (filtered.length > 0) {
        sessionStorage.setItem(key, JSON.stringify(filtered));
      } else {
        sessionStorage.removeItem(key);
      }
    }

    try {
      const formData = new FormData();
      formData.append('id', String(product.id));
      formData.append('is_best_seller', 'false');

      await ApiClient.adminUpdatePerfumeBestSeller(formData, token);
      
      // Only update products state after successful API call
      await loadProducts();

      toast({
        title: 'Success',
        description: `${product.name} removed from Best Sellers`,
      });
    } catch (err: any) {
      console.error('Failed to remove from best sellers:', err);
      // Rollback UI
      setBestSellers(prevBest);
      setProducts(products);

      if (err?.status === 401) {
        toast({
          title: 'Authentication Error',
          description: 'Please log in again as an admin.',
          variant: 'destructive',
        });
        return;
      }
      toast({
        title: 'Error',
        description: err?.data?.message || 'Failed to remove from Best Sellers.',
        variant: 'destructive',
      });
    }
  };

  const addSpecialOffer = async () => {
    if (!selectedProduct) return;

    try {
      const formData = new FormData();
      formData.append('id', String(selectedProduct.id));
      formData.append('discount_percentage', discountPercentage);
      formData.append('end_date', discountEndDate);

      const res = await ApiClient.adminAddSpecialOffer(formData, token);
      console.log('[ManageSections] adminAddSpecialOffer response:', res);
      await loadSpecialOffers();
      
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
      await loadSpecialOffers();
      
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
        
        <div className="space-y-6">
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
                  {bestSellers.map(product => (
                    <TableRow key={product.id}>
                      <TableCell>{product.name}</TableCell>
                      <TableCell>{product.category}</TableCell>
                      <TableCell>${product.price}</TableCell>
                      <TableCell>Best Seller</TableCell>
                      <TableCell>
                        <Button
                          variant="destructive"
                          onClick={() => removeFromBestSellers(product)}
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {bestSellers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4">
                        No best sellers yet
                      </TableCell>
                    </TableRow>
                  )}
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
                  value={selectedProduct?.id || ''}
                  onChange={(e) => setSelectedProduct(products.find(p => p.id === Number(e.target.value)) || null)}
                  className="w-full p-2 border rounded"
                >
                  <option value="">Select a product</option>
                  {products.map(product => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <label>Discount Percentage</label>
                <Input
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg"
                  type="number"
                  value={discountPercentage}
                  onChange={(e) => setDiscountPercentage(e.target.value)}
                  min="0"
                  max="100"
                />
              </div>
              <div className="grid gap-2">
                <label>End Date</label>
                <Input
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg"
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
                  {specialOffers.length > 0 ? (
                    specialOffers
                      .filter(product => {
                        // Only show offers with no end date or end date in the future
                        const endDate = product.discountEndDate;
                        if (!endDate) return true;
                        const end = new Date(endDate);
                        return end >= new Date();
                      })
                      .map(product => (
                        <TableRow key={product.id}>
                          <TableCell>{product.name}</TableCell>
                          <TableCell>${product.originalPrice ?? product.price}</TableCell>
                          <TableCell>{(product.discountPercentage != null && product.discountPercentage !== 0) ? `${product.discountPercentage}%` : '-'}</TableCell>
                          <TableCell>{product.discountEndDate ? new Date(product.discountEndDate).toLocaleDateString() : '-'}</TableCell>
                          <TableCell>
                            <Button
                              variant="destructive"
                              onClick={() => removeSpecialOffer(product)}
                            >
                              Delete
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4">
                        No special offers yet
                      </TableCell>
                    </TableRow>
                  )}
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