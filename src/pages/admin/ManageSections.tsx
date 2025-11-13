import { useState, useEffect } from "react";
import { ApiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ManageSections = () => {
  const [bestSellers, setBestSellers] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [specialOffers, setSpecialOffers] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [allProducts, setAllProducts] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [bestSellersRes, newArrivalsRes, specialOffersRes, allProductsRes] = await Promise.all([
        ApiClient.getBestSellers(),
        ApiClient.getNewArrivals(),
        ApiClient.getSpecialOffers(),
        ApiClient.adminGetPerfumes()
      ]);

      setBestSellers(bestSellersRes.perfumes || []);
      setNewArrivals(newArrivalsRes.perfumes || []);
      setSpecialOffers(specialOffersRes.perfumes || []);
      setAllProducts(allProductsRes.perfumes || []);
    } catch (err) {
      console.error('Failed to load section data:', err);
      toast({
        title: 'Error',
        description: 'Failed to load product sections.',
        variant: 'destructive',
      });
    }
  };

  const handleAddSpecialOffer = async (productId: number, discountPercentage: number, endDate: string) => {
    try {
      const formData = new FormData();
      formData.append('perfume_id', String(productId));
      formData.append('discount_percentage', String(discountPercentage));
      formData.append('end_date', endDate);

      await ApiClient.adminAddSpecialOffer(formData);
      toast({
        title: 'Success',
        description: 'Special offer added successfully.',
      });
      loadData();
      setIsDialogOpen(false);
    } catch (err) {
      console.error('Failed to add special offer:', err);
      toast({
        title: 'Error',
        description: 'Failed to add special offer.',
        variant: 'destructive',
      });
    }
  };

  const handleRemoveSpecialOffer = async (productId: number) => {
    try {
      await ApiClient.adminRemoveSpecialOffer(productId);
      toast({
        title: 'Success',
        description: 'Special offer removed successfully.',
      });
      loadData();
    } catch (err) {
      console.error('Failed to remove special offer:', err);
      toast({
        title: 'Error',
        description: 'Failed to remove special offer.',
        variant: 'destructive',
      });
    }
  };

  const handleMarkBestSeller = async (productId: number, isBestSeller: boolean) => {
    try {
      const formData = new FormData();
      formData.append('perfume_id', String(productId));
      formData.append('is_best_seller', String(isBestSeller ? 1 : 0));

      await ApiClient.adminUpdatePerfumeBestSeller(formData);
      toast({
        title: 'Success',
        description: `Product ${isBestSeller ? 'marked' : 'unmarked'} as best seller.`,
      });
      loadData();
    } catch (err) {
      console.error('Failed to update best seller status:', err);
      toast({
        title: 'Error',
        description: 'Failed to update best seller status.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-4xl font-bold mb-8">Manage Sections</h1>

      {/* Best Sellers Section */}
      <section className="mb-12">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Best Sellers</h2>
          <p className="text-sm text-muted-foreground">
            Automatically updated based on sales data. You can manually override.
          </p>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product Name</TableHead>
              <TableHead>Total Sold</TableHead>
              <TableHead>Current Stock</TableHead>
              <TableHead>Best Seller Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bestSellers.map((product) => (
              <TableRow key={product.id}>
                <TableCell>{product.name}</TableCell>
                <TableCell>{product.totalSold}</TableCell>
                <TableCell>
                  <span className={product.stockLevel === 'low' ? 'text-red-500' : ''}>
                    {product.stockLevel}
                  </span>
                </TableCell>
                <TableCell>
                  <Switch
                    checked={product.isBestSeller}
                    onCheckedChange={(checked) => handleMarkBestSeller(product.id, checked)}
                  />
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm">View Details</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>

      {/* New Arrivals Section */}
      <section className="mb-12">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">New Arrivals</h2>
          <p className="text-sm text-muted-foreground">
            Automatically managed based on product creation date (last 30 days)
          </p>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product Name</TableHead>
              <TableHead>Added Date</TableHead>
              <TableHead>Current Stock</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {newArrivals.map((product) => (
              <TableRow key={product.id}>
                <TableCell>{product.name}</TableCell>
                <TableCell>{new Date(product.created_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  <span className={product.stockLevel === 'low' ? 'text-red-500' : ''}>
                    {product.stockLevel}
                  </span>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm">View Details</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>

      {/* Special Offers Section */}
      <section className="mb-12">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Special Offers</h2>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>Add Special Offer</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Special Offer</DialogTitle>
                <DialogDescription>
                  Select a product and set the discount details.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <Select
                  onValueChange={(value) => setSelectedProduct(allProducts.find(p => p.id === Number(value)))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a product" />
                  </SelectTrigger>
                  <SelectContent>
                    {allProducts.map((product) => (
                      <SelectItem key={product.id} value={String(product.id)}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div>
                  <Input
                    type="number"
                    placeholder="Discount percentage"
                    min="0"
                    max="100"
                    className="mb-2"
                    id="discountPercentage"
                  />
                  <Input
                    type="date"
                    placeholder="End date"
                    min={new Date().toISOString().split('T')[0]}
                    id="endDate"
                  />
                </div>
                <Button 
                  onClick={() => {
                    const discountPercentage = Number((document.getElementById('discountPercentage') as HTMLInputElement).value);
                    const endDate = (document.getElementById('endDate') as HTMLInputElement).value;
                    if (selectedProduct && discountPercentage && endDate) {
                      handleAddSpecialOffer(selectedProduct.id, discountPercentage, endDate);
                    }
                  }}
                  className="w-full"
                >
                  Add Offer
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product Name</TableHead>
              <TableHead>Original Price</TableHead>
              <TableHead>Discount</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {specialOffers.map((product) => (
              <TableRow key={product.id}>
                <TableCell>{product.name}</TableCell>
                <TableCell>₹{product.originalPrice}</TableCell>
                <TableCell>{product.discountPercentage}%</TableCell>
                <TableCell>{product.discountEndDate?.toLocaleDateString()}</TableCell>
                <TableCell>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => handleRemoveSpecialOffer(product.id)}
                  >
                    Remove Offer
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>
    </div>
  );
};

export default ManageSections;