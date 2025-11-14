import React from "react";
import { Star, Heart, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { Product } from "@/data/products";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useLiked } from "@/contexts/LikedContext";

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const { addToLiked, removeFromLiked, isLiked } = useLiked();
  const [localRating, setLocalRating] = React.useState<number>(product.rating ?? 0);
  const [localReviewsCount, setLocalReviewsCount] = React.useState<number>(product.reviews ?? 0);

  React.useEffect(() => {
    // keep local state in sync if parent product prop changes
    setLocalRating(product.rating ?? 0);
    setLocalReviewsCount(product.reviews ?? 0);
  }, [product.rating, product.reviews]);

  React.useEffect(() => {
    const handler = (e: any) => {
      const detail = e?.detail || {};
      if (!detail || (detail.perfumeId ?? detail.perfume_id) !== Number(product.id)) return;
      if (typeof detail.rating === 'number') setLocalRating(detail.rating);
      if (typeof detail.reviews === 'number') setLocalReviewsCount(detail.reviews);
    };
    window.addEventListener('perfume:reviews:updated', handler as EventListener);
    return () => window.removeEventListener('perfume:reviews:updated', handler as EventListener);
  }, [product.id]);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (product.sizes && product.sizes.length > 0) {
      if (!isAuthenticated) {
        toast({ title: "Please login", description: "You must be logged in to add items to the cart." });
        navigate('/login');
        return;
      }

      addItem(product, product.sizes[0]);
      toast({ title: "Added to cart", description: `${product.name} has been added to your cart.` });
    }
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Store the product and go directly to checkout
    const singleItemCart = {
      items: [{
        ...product,
        quantity: 1,
        selectedSize: product.sizes?.[0] || "",
        price: product.price
      }],
      totalPrice: product.price
    };
    sessionStorage.setItem('checkout-item', JSON.stringify(singleItemCart));
    // Immediately redirect to checkout and scroll to top smoothly
    navigate('/checkout');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <Card 
      className="group overflow-hidden hover:shadow-elegant transition-smooth cursor-pointer"
      onClick={(e: React.MouseEvent) => {
        // If the click originated from an interactive element (button/link), do not navigate to product page.
        const target = e.target as HTMLElement | null;
        if (target && (target.closest('button') || target.closest('a') || target.getAttribute('role') === 'button')) {
          return;
        }
        navigate(`/product/${product.id}`, { state: { product } });
      }}
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-smooth"
        />
        <Button
          size="icon"
          variant="secondary"
          className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-smooth"
          onClick={(e) => {
            e.stopPropagation();
            console.debug('[ProductCard] like clicked', { productId: product.id, isAuthenticated });
            if (!isAuthenticated) {
              toast({ title: "Please login", description: "You must be logged in to like products." });
              navigate('/login');
              return;
            }
            try {
              const idStr = String(product.id);
              if (isLiked(idStr)) {
                removeFromLiked(idStr);
                toast({ title: "Removed from liked", description: `${product.name} has been removed from your liked products.` });
              } else {
                addToLiked(idStr);
                toast({ title: "Added to liked", description: `${product.name} has been added to your liked products.` });
              }
            } catch (err) {
              console.error('[ProductCard] like handler error', err);
              toast({ title: 'Error', description: 'Could not update liked products.' });
            }
          }}
        >
          <Heart className={`h-4 w-4 ${isLiked(String(product.id)) ? 'fill-red-500 text-red-500' : ''}`} />
        </Button>
        
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          {product.isBestSeller && (
            <Badge className="gradient-primary text-primary-foreground">Best Seller</Badge>
          )}
          {product.isNew && (
            <Badge className="gradient-gold text-foreground">New</Badge>
          )}
          {product.isSale && (
            <Badge variant="destructive">Sale</Badge>
          )}
          {/* Show discount percent if available or compute from originalPrice */}
            {(() => {
              const orig = (product as any).originalPrice ?? null;
              const sale = Number(product.price ?? 0);
              const pctField = (product as any).discountPercentage ?? (product as any).discounted_percentage ?? null;
              const endDateField = (product as any).discountEndDate ?? (product as any).end_date ?? (product as any).endDate ?? null;

              // If an end date exists and it's in the past, don't show any discount
              if (endDateField) {
                const end = typeof endDateField === 'string' ? new Date(endDateField) : (endDateField instanceof Date ? endDateField : new Date(endDateField));
                if (isFinite(end.getTime()) && end.getTime() < Date.now()) return null;
              }

              let pct = null as number | null;
              if (typeof pctField === 'number') pct = pctField;
              else if (typeof pctField === 'string' && pctField !== '') pct = Number(pctField);
              else if (orig && Number(orig) > sale) {
                pct = Math.round(((Number(orig) - sale) / Number(orig)) * 100);
              }
              if (pct && pct > 0) {
                return <Badge className="bg-rose-500 text-white">-{pct}%</Badge>;
              }
              return null;
            })()}
        </div>
      </div>

      <CardContent className="p-4">
        <div className="mb-2">
          <h3 className="font-serif text-lg font-semibold line-clamp-1 mb-1">
            {product.name}
          </h3>
          <p className="text-sm text-muted-foreground">{product.category} • {product.fragranceType}</p>
        </div>

        <div className="flex items-center gap-1 mb-3">
          {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`h-3 w-3 ${
                  i < Math.floor(localRating)
                    ? "fill-accent text-accent"
                    : "text-muted"
                }`}
              />
            ))}
            <span className="text-xs text-muted-foreground ml-1">({localReviewsCount})</span>
        </div>

        <div className="flex items-center justify-between mb-3">
          <div>
            {(() => {
              // Try several possible original price fields
              const original = (product as any).originalPrice ?? (product as any).mrp ?? (product as any).listPrice ?? null;
              const sale = Number(product.price ?? 0);
              if (original && Number(original) > sale) {
                return (
                  <div className="flex items-baseline gap-3">
                    <span className="text-sm text-muted-foreground line-through">₹{Number(original).toFixed(2)}</span>
                    <span className="font-bold text-lg text-foreground">₹{sale.toFixed(2)}</span>
                  </div>
                );
              }
              // fallback: show price normally; if isSale flag present, still highlight
              return (
                  <div className="flex items-center gap-2">
                  <span className="font-bold text-lg">₹{sale.toFixed(2)}</span>
                  {(product as any).isSale && (
                    <Badge className="ml-2">Sale</Badge>
                  )}
                </div>
              );
            })()}
          </div>
          <Button
            size="icon"
            variant="secondary"
            onClick={handleAddToCart}
            className="h-8 w-8"
          >
            <ShoppingCart className="h-4 w-4" />
          </Button>
        </div>

        <Button 
          className="w-full bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white font-medium"
          onClick={handleBuyNow}
        >
          Buy Now
        </Button>
      </CardContent>
    </Card>
  );
};

export default ProductCard;

// Listen for global review changes and refresh product rating when they occur
// (This is separate from the component render to avoid re-registering handlers per instance)
if (typeof window !== 'undefined') {
  window.addEventListener('perfume:reviews:changed', async (e: any) => {
    try {
      const pid = e?.detail?.perfumeId;
      if (!pid) return;
      // find product card elements in DOM and update via a lightweight fetch
      // We'll update components by dispatching a secondary event with the fetched data
      const ApiClient = (await import('@/lib/api-client')).ApiClient;
      const data = await ApiClient.getPerfumeDetails(pid);
      window.dispatchEvent(new CustomEvent('perfume:reviews:updated', { detail: { perfumeId: pid, rating: data?.perfume?.rating ?? data?.rating ?? data?.perfume?.average_rating ?? null, reviews: data?.perfume?.reviews ?? data?.reviews ?? null } }));
    } catch (err) {
      // ignore errors
    }
  });
}