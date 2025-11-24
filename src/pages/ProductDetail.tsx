import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ApiClient } from "@/lib/api-client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCarousel from "@/components/ProductCarousel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Star, ShoppingCart, Heart } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useLiked } from "@/contexts/LikedContext";
import { Reviews } from "@/components/Reviews";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const { isLiked, addToLiked, removeFromLiked } = useLiked();
  const [product, setProduct] = useState(null);
  // size selection removed
  const [loading, setLoading] = useState(true);
  const [relatedProducts, setRelatedProducts] = useState([]);

  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);

          const perfume = await ApiClient.getPerfumeDetails(Number(id));
          // Debug: log the perfume object to inspect rating fields
          if (import.meta.env.DEV) console.debug('[ProductDetail] perfume fetched:', perfume);

          if (perfume) {
          // size removed from product model; no size parsing required

          // Robustly normalize numeric rating and reviews from multiple possible API shapes
          const tryGetNumber = (obj: any, keys: string[]) => {
            for (const k of keys) {
              if (obj == null) continue;
              const val = obj[k];
              if (val !== undefined && val !== null && val !== "") return Number(val);
            }
            return undefined;
          };

          const normalizedTotalReviews = Number(
            tryGetNumber(perfume, ['total_reviews', 'totalReviews', 'reviews_count', 'review_count', 'reviews']) ??
            tryGetNumber(perfume.perfume, ['total_reviews', 'totalReviews', 'reviews_count', 'review_count', 'reviews']) ??
            0
          );

          let normalizedRating = Number(
            tryGetNumber(perfume, ['average_rating', 'averageRating', 'rating', 'avg_rating']) ??
            tryGetNumber(perfume.perfume, ['average_rating', 'averageRating', 'rating', 'avg_rating']) ??
            0
          );
          // Do NOT forcibly zero-out the rating for zero reviews if you want a visual placeholder.

          setProduct({
            id: perfume.id,
            name: perfume.name,
            price: Number(perfume.price || 0),
            category: perfume.category || "Uncategorized",
            description: perfume.description || "",
            image: perfume.photo_url || "",
            rating: normalizedRating,
            reviews: normalizedTotalReviews,
            quantity: perfume.quantity || 0,
            inStock: perfume.in_stock ?? perfume.quantity > 0,
            notes: {
              top: perfume.top_notes ? perfume.top_notes.split(",") : [],
              heart: perfume.heart_notes ? perfume.heart_notes.split(",") : [],
              base: perfume.base_notes ? perfume.base_notes.split(",") : [],
            },
            // size removed from product model
            isBestSeller: perfume.is_best_seller ?? false,
            isNew: perfume.is_new ?? false,
            isSale: perfume.is_sale ?? false,
          });

          // size removed: no preselection

          // Fetch reviews and compute average from actual review records (ensure product detail reflects true average)
          try {
            const reviewsRes = await ApiClient.getProductReviews(Number(id));
            // Normalize different possible response shapes
            const reviewsArray = Array.isArray(reviewsRes)
              ? reviewsRes
              : Array.isArray(reviewsRes.reviews)
                ? reviewsRes.reviews
                : Array.isArray(reviewsRes.data)
                  ? reviewsRes.data
                  : [];

            if (reviewsArray.length > 0) {
              const sum = reviewsArray.reduce((acc: number, r: any) => acc + (Number(r.rating) || 0), 0);
              const avg = Math.round((sum / reviewsArray.length) * 10) / 10;
              // Update product state to reflect computed average and exact review count
              setProduct((prev) => prev ? { ...prev, rating: avg, reviews: reviewsArray.length } : prev);
            } else {
              // If no reviews returned, ensure count is zero (kept by normalization earlier)
              setProduct((prev) => prev ? { ...prev, reviews: 0 } : prev);
            }
          } catch (err) {
            console.error('Failed to fetch reviews for product detail:', err);
          }

          // ✅ Fetch new arrivals using ApiClient so transforms (isNew) are applied
          try {
            const newArrivalsRes = await ApiClient.getNewArrivals();
            const perfumes = newArrivalsRes?.perfumes || [];
            const related = perfumes.filter((p: any) => p && p.id !== perfume.id).slice(0, 4);
            setRelatedProducts(related);
          } catch (e) {
            // Fallback: try fetching all perfumes and filter by created_at within 30 days
            try {
              const allRes = await ApiClient.getPerfumes();
              const perfumes = allRes?.perfumes || [];
              const related = perfumes
                .filter((p: any) => p && p.id !== perfume.id && p.isNew)
                .slice(0, 4);
              setRelatedProducts(related);
            } catch (err) {
              console.error('Failed to load related/new-arrival perfumes:', err);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load product:", err);
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [id]);

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-3xl font-bold mb-4">Product Not Found</h1>
          <Button onClick={() => navigate("/products")}>Back to Products</Button>
        </div>
        <Footer />
      </div>
    );
  }

  const handleAddToCart = () => {
    // addItem expects a single argument (the product); quantity is part of the product object
    addItem(product);
    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart.`,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Product Image */}
          <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              {product.isBestSeller && (
                <Badge className="gradient-primary text-primary-foreground">
                  Best Seller
                </Badge>
              )}
              {product.isNew && (
                <Badge className="gradient-gold text-foreground">New</Badge>
              )}
              {product.isSale && <Badge variant="destructive">Sale</Badge>}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-4xl font-serif font-bold mb-2">
                {product.name}
              </h1>
              <p className="text-lg text-muted-foreground">
                {product.category}
              </p>
            </div>

            <div className="flex items-center gap-1">
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => {
                    const showAllYellow = Number(product.reviews ?? 0) === 0; // placeholder yellow when no reviews
                    const filledByRating = Number(product.rating ?? 0) > 0 && i < Math.floor(Number(product.rating ?? 0));
                    const isYellow = showAllYellow || filledByRating;
                    return (
                      <Star
                        key={i}
                        className={`h-5 w-5 ${isYellow ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'}`}
                      />
                    );
                  })}
                </div>
              <span className="text-sm text-gray-600">
                ({product.reviews === 0 ? "0 reviews" : `${product.reviews} ${product.reviews === 1 ? 'review' : 'reviews'}`})
              </span>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold">₹{product.price}</span>
            </div>

            <p className="text-muted-foreground leading-relaxed">
              {product.description}
            </p>

            {/* ✅ Fragrance Notes */}
            <Card className="p-4 space-y-2">
              <h3 className="font-semibold">Fragrance Notes</h3>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <p className="font-medium text-muted-foreground">Top</p>
                  <p>{product.notes.top.join(", ") || "—"}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Heart</p>
                  <p>{product.notes.heart.join(", ") || "—"}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Base</p>
                  <p>{product.notes.base.join(", ") || "—"}</p>
                </div>
              </div>
            </Card>

            {/* Size selection removed */}

            {/* Buy Now replaces Add to Cart */}
            <div className="flex gap-3">
              <Button
                className="w-52 gradient-primary text-primary-foreground justify-center"
                size="lg"
                onClick={async () => {
                  await addItem(product);
                  navigate('/checkout');
                }}
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                Buy Now
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={async () => {
                  const pid = String(product.id);
                  if (!isAuthenticated) {
                    toast({ title: 'Please log in', description: 'You must be logged in to add favourites', variant: 'destructive' });
                    navigate('/login');
                    return;
                  }
                  try {
                    if (isLiked(pid)) {
                      await removeFromLiked(pid);
                    } else {
                      await addToLiked(pid);
                    }
                  } catch (e) {
                    console.error('Failed to toggle liked state', e);
                  }
                }}
                aria-pressed={isLiked(String(product.id))}
              >
                <Heart className={`h-5 w-5 ${isLiked(String(product.id)) ? 'text-red-500 fill-red-500' : ''}`} />
              </Button>
            </div>

            {/* Stock Status */}
            <p className="text-sm text-muted-foreground">
              {product.inStock ? "✓ In Stock" : "Out of Stock"}
            </p>
          </div>
        </div>

        {/* ✅ Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <ProductCarousel
              products={relatedProducts}
              title="You May Also Like"
            />
          </div>
        )}

        {/* ✅ Reviews Section */}
        <Reviews productId={id} />
      </main>

      <Footer />
    </div>
  );
}