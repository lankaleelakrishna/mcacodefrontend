import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
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
import { Reviews } from "@/components/Reviews";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { addItem } = useCart();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const [product, setProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState("");
  const [loading, setLoading] = useState(true);
  const [relatedProducts, setRelatedProducts] = useState([]);

  // Scroll to top when product ID changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id]);

  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);
        // If navigation state provided a product (e.g., user clicked from a listing), use it immediately
        try {
          const initial = (location && (location as any).state && (location as any).state.product) || null;
          if (initial) {
            // compute display price similar to API handling so discounts show immediately
            const origInit = initial.originalPrice ?? initial.original_price ?? initial.listPrice ?? initial.list_price ?? null;
            const pctInit = Number(initial.discountPercentage ?? initial.discount_percentage ?? 0) || 0;
            const discountedInit = initial.discountedPrice ?? initial.discounted_price ?? null;
            let computedInit: number | null = null;
            if (discountedInit) computedInit = Number(discountedInit);
            else if (pctInit > 0 && origInit) computedInit = Number(origInit) * (1 - pctInit / 100);
            else if (origInit && Number(origInit) > Number(initial.price)) computedInit = Number(initial.price);

            const displayInit = computedInit ?? Number(initial.price || 0);

            setProduct({
              ...initial,
              price: displayInit,
              originalPrice: origInit,
              discountPercentage: pctInit,
              discountedPrice: discountedInit ?? (computedInit ? Number(computedInit.toFixed(2)) : null),
              discountEndDate: initial.end_date ? new Date(initial.end_date) : (initial.discountEndDate ?? initial.endDate ?? null),
            });
            // do not return; still fetch fresh data below to correct any stale info
          }
        } catch (e) {
          // ignore errors reading location state
        }

        // ✅ Fetch specific perfume details
        const res = await fetch(`http://localhost:5000/perfumes/${id}`);
        const data = await res.json();

        if (data && (data.perfume || data)) {
          let perfume = data.perfume || data;

          // If this product appears in the special-offers feed, prefer that discount info
          try {
            const specialsRes = await ApiClient.getSpecialOffers();
            const specials = specialsRes?.perfumes || [];
            const specialMatch = specials.find((s: any) => String(s.id) === String(perfume.id));
            if (specialMatch) {
              // overlay discount fields from the special offers feed
              perfume = {
                ...perfume,
                discounted_price: specialMatch.discounted_price ?? specialMatch.discountedPrice ?? specialMatch.price ?? perfume.discounted_price,
                original_price: specialMatch.original_price ?? specialMatch.originalPrice ?? perfume.original_price,
                discount_percentage: specialMatch.discount_percentage ?? specialMatch.discountPercentage ?? perfume.discount_percentage,
                end_date: specialMatch.end_date ?? specialMatch.discountEndDate ?? perfume.end_date,
              };
            }
          } catch (e) {
            // ignore failures to fetch specials — proceed with product data
          }

          // compute the effective (display) price so cart uses the discounted value
          const orig = perfume.original_price ?? perfume.list_price ?? null;
          const pct = Number(perfume.discount_percentage ?? perfume.discountPercentage ?? 0) || 0;
          const discountedField = perfume.discounted_price ?? perfume.discountedPrice ?? null;
          let computedDiscounted: number | null = null;
          if (discountedField) computedDiscounted = Number(discountedField);
          else if (pct > 0 && orig) computedDiscounted = Number(orig) * (1 - pct / 100);
          else if (perfume.price && orig && Number(orig) > Number(perfume.price)) computedDiscounted = Number(perfume.price);
          const displayPrice = computedDiscounted ?? Number(perfume.price || 0);

          setProduct({
            id: perfume.id,
            name: perfume.name,
            // price will be the effective selling price (discounted when applicable)
            price: displayPrice,
            // Preserve original price / discount metadata when available
            originalPrice: orig,
            discountPercentage: pct,
            discountedPrice: discountedField ?? (computedDiscounted ? Number(computedDiscounted.toFixed(2)) : null),
            // include discount end date if provided by API
            discountEndDate: perfume.end_date ? new Date(perfume.end_date) : (perfume.discountEndDate ?? perfume.endDate ?? null),
            category: perfume.category || "Uncategorized",
            description: perfume.description || "",
            image: perfume.photo_url || "",
            rating: perfume.average_rating || 5,
            reviews: perfume.total_reviews || 0,
            quantity: perfume.quantity || 0,
            inStock: perfume.in_stock ?? perfume.quantity > 0,
            notes: {
              top: perfume.top_notes ? perfume.top_notes.split(",") : [],
              heart: perfume.heart_notes ? perfume.heart_notes.split(",") : [],
              base: perfume.base_notes ? perfume.base_notes.split(",") : [],
            },
            // Prefer backend-provided `sizes` (normalized on server). Fall back to parsing `size` string.
            sizes: Array.isArray(perfume.sizes)
              ? perfume.sizes
              : (perfume.size ? String(perfume.size).split(',').map((s: string) => s.trim()).filter(Boolean) : ['One Size']),
            isBestSeller: perfume.is_best_seller ?? false,
            isNew: perfume.is_new ?? false,
            isSale: perfume.is_sale ?? false,
          });

          // ✅ Fetch new arrivals using ApiClient so transforms (isNew) are applied
          try {
            const newArrivalsRes = await ApiClient.getNewArrivals();
            const perfumes = newArrivalsRes?.perfumes || [];
            const related = perfumes.filter((p: any) => p && p.id !== product.id).slice(0, 4);
            setRelatedProducts(related);
          } catch (e) {
            // Fallback: try fetching all perfumes and filter by created_at within 30 days
              try {
              const allRes = await ApiClient.getPerfumes();
              const perfumes = allRes?.perfumes || [];
              const related = perfumes
                .filter((p: any) => p && p.id !== product.id && p.isNew)
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

  // Listen for external updates to this product's reviews/rating
  useEffect(() => {
    const handler = (e: any) => {
      try {
        const detail = e?.detail || {};
        const pid = detail?.perfumeId ?? detail?.perfume_id;
        if (!pid || String(pid) !== String(id)) return;
        // Update local product state with new rating/reviews if available
        setProduct((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            rating: typeof detail.rating === 'number' ? detail.rating : prev.rating,
            reviews: typeof detail.reviews === 'number' ? detail.reviews : prev.reviews,
          };
        });
      } catch (err) {
        // ignore
      }
    };

    window.addEventListener('perfume:reviews:updated', handler as EventListener);
    return () => window.removeEventListener('perfume:reviews:updated', handler as EventListener);
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
    if (!selectedSize) {
      toast({
        title: "Please select a size",
        variant: "destructive",
      });
      return;
    }
    addItem(product, selectedSize);
    toast({
      title: "Added to cart",
      description: `${product.name} (${selectedSize}) has been added to your cart.`,
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
              {/* Discount percent badge */}
              {(() => {
                const pct = Number((product as any).discountPercentage ?? 0) || 0;
                const orig = (product as any).originalPrice ?? null;
                const price = Number(product.price ?? 0);
                let pctComputed: number | null = null;
                if (pct > 0) pctComputed = pct;
                else if (orig && Number(orig) > price) pctComputed = Math.round(((Number(orig) - price) / Number(orig)) * 100);
                if (pctComputed && pctComputed > 0) {
                  return <Badge className="bg-rose-500 text-white">-{pctComputed}%</Badge>;
                }
                return null;
              })()}
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

              {/* Available in: badges for sections where this product appears */}
              <div className="mt-3 flex items-center gap-3">
                {product.isBestSeller && (
                  <button
                    onClick={() => navigate('/products?section=best-sellers')}
                    className="cursor-pointer"
                    aria-label="View Best Sellers"
                  >
                    <Badge className="gradient-primary">Best Sellers</Badge>
                  </button>
                )}

                {(() => {
                  // show special offers badge only when discount is active
                  const pct = Number((product as any).discountPercentage ?? 0) || 0;
                  const orig = (product as any).originalPrice ?? null;
                  const price = Number(product.price ?? 0);
                  const end = (product as any).discountEndDate ?? (product as any).end_date ?? null;
                  let endDateValid = true;
                  if (end) {
                    try {
                      const d = end instanceof Date ? end : new Date(end);
                      endDateValid = isFinite(d.getTime()) ? d.getTime() >= Date.now() : true;
                    } catch {
                      endDateValid = true;
                    }
                  }
                  const hasDiscount = (pct > 0 || (orig && Number(orig) > price));
                  if (hasDiscount && endDateValid) {
                    return (
                      <button onClick={() => navigate('/products?section=special-offers')} className="cursor-pointer">
                        <Badge className="bg-rose-500 text-white">Special Offer</Badge>
                      </button>
                    );
                  }
                  return null;
                })()}

                {product.isNew && (
                  <button onClick={() => navigate('/products?section=new-arrivals')} className="cursor-pointer">
                    <Badge className="gradient-gold text-foreground">New Arrivals</Badge>
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-5 w-5 ${
                    i < Math.floor(product.rating)
                      ? "fill-accent text-accent"
                      : "text-muted"
                  }`}
                />
              ))}
              <span className="ml-2 text-sm text-muted-foreground">
                ({product.reviews} reviews)
              </span>
            </div>

            <div className="flex items-baseline gap-3">
              {/* Compute display price and show original/discount when available */}
              {(() => {
                const orig = (product as any).originalPrice ?? null;
                const pct = Number((product as any).discountPercentage ?? 0) || 0;
                const discountedField = (product as any).discountedPrice ?? null;
                let computedDiscounted: number | null = null;
                if (discountedField) computedDiscounted = Number(discountedField);
                else if (pct > 0 && orig) {
                  computedDiscounted = Number(orig) * (1 - pct / 100);
                } else if (orig && Number(orig) > Number(product.price)) {
                  // infer discount from original and current price
                  computedDiscounted = Number(product.price);
                }

                const displayPrice = computedDiscounted ?? Number(product.price || 0);

                return (
                  <>
                    {orig && Number(orig) > Number(displayPrice) && (
                      <span className="text-sm text-muted-foreground line-through">₹{Number(orig).toFixed(2)}</span>
                    )}
                    <span className="text-3xl font-bold">₹{displayPrice.toFixed(2)}</span>
                    {pct > 0 && (
                      <span className="ml-2 text-sm text-accent">-{pct}%</span>
                    )}
                  </>
                );
              })()}
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

            {/* Size Selection */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Select Size</h3>
              <div className="flex gap-3 flex-wrap">
                {product.sizes.map((size) => (
                  <Button
                    key={size}
                    variant={selectedSize === size ? "default" : "outline"}
                    onClick={() => setSelectedSize(size)}
                    className={
                      selectedSize === size 
                        ? "gradient-primary text-white font-semibold px-6 py-2 rounded-lg" 
                        : "border-2 hover:border-primary px-6 py-2 rounded-lg"
                    }
                  >
                    {size}
                  </Button>
                ))}
              </div>
            </div>

            {/* Add to Cart */}
            <div className="flex gap-3">
              <Button
                className="flex-1 gradient-primary text-primary-foreground"
                size="lg"
                onClick={handleAddToCart}
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                Add to Cart
              </Button>
              <Button variant="outline" size="lg">
                <Heart className="h-5 w-5" />
              </Button>
            </div>
            {/* Savings summary and Stock Status */}
            {(() => {
              const orig = (product as any).originalPrice ?? null;
              const price = Number(product.price ?? 0);
              const quantity = product.quantity || 0;
              if (orig && Number(orig) > price) {
                const saved = Number(orig) - price;
                const pct = Math.round((saved / Number(orig)) * 100);
                return (
                  <div className="space-y-2">
                    <p className="text-sm text-success font-medium">You save ₹{saved.toFixed(2)} ({pct}% off)</p>
                    <p className="text-sm text-muted-foreground">
                      {product.inStock ? "✓ In Stock" : "Out of Stock"}
                    </p>
                    {product.inStock && (
                      <p className="text-sm text-muted-foreground">
                        <span className="font-semibold text-foreground">{quantity}</span> units available
                      </p>
                    )}
                  </div>
                );
              }
              return (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {product.inStock ? "✓ In Stock" : "Out of Stock"}
                  </p>
                  {product.inStock && (
                    <p className="text-sm text-muted-foreground">
                      <span className="font-semibold text-foreground">{quantity}</span> units available
                    </p>
                  )}
                </div>
              );
            })()}
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