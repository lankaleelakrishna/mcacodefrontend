import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import HeroCarousel from "@/components/HeroCarousel";
import { Reviews } from "@/components/Reviews";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";
import { useEffect, useState } from "react";
import { ApiClient } from "@/lib/api-client";
import ProductCard from "@/components/ProductCard";

interface Product {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  category: string;
  fragranceType: string;
  description: string;
  image: string;
  rating: number;
  reviews: number;
  notes: {
    top: string[];
    heart: string[];
    base: string[];
  };
  sizes: string[];
  inStock: boolean;
  stockLevel: string;
  isBestSeller: boolean;
  isNew: boolean;
  isSale: boolean;
  discountPercentage: number;
  discountEndDate?: Date;
  totalSold: number;
}

const Index = () => {
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [specialOffers, setSpecialOffers] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadSections = async () => {
      setLoading(true);
      setError('');
      try {
        // Load all sections in parallel
        const [bestSellersRes, newArrivalsRes, specialOffersRes] = await Promise.all([
          ApiClient.getBestSellers(),
          ApiClient.getNewArrivals(),
          ApiClient.getSpecialOffers()
        ]);

        // Helper: fetch per-product reviews and compute averages
        const enrichWithCustomerAverages = async (products: any[]) => {
          if (!products || products.length === 0) return products;
          // Limit parallel requests to avoid overwhelming API in large lists
          const enriched = await Promise.all(products.map(async (p) => {
            try {
              const res: any = await ApiClient.getProductReviews(Number(p.id));
              const raw = res.reviews || [];
              // normalize review shapes and attempt to detect reviewer role
              const list = (raw as any[]).map((r: any) => ({
                rating: r.rating ?? r.stars ?? 0,
                user_id: r.user_id ?? r.user?.id ?? r.userId,
                role_id: r.role_id ?? r.user?.role_id ?? r.user?.role ?? r.user_role,
                role: r.role ?? r.user?.role ?? r.user_role
              }));

              // filter out admin-like reviewers when role info is present
              const customerOnly = list.filter((rv) => {
                const roleId = rv.role_id;
                const role = rv.role;
                if (typeof roleId === 'number') return roleId !== 1;
                if (typeof roleId === 'string') return roleId.toLowerCase() !== '1' && roleId.toLowerCase() !== 'admin';
                if (typeof role === 'string') return role.toLowerCase() !== 'admin';
                // role info not present — conservatively include the review
                return true;
              });

              const total = customerOnly.length;
              const avg = total > 0 ? (customerOnly.reduce((s, r) => s + (Number(r.rating) || 0), 0) / total) : null;

              return {
                ...p,
                // prefer client-computed customer-only avg when available, otherwise fall back to backend fields
                rating: avg ?? p.rating ?? (p as any).average_rating ?? 0,
                reviews: total > 0 ? total : (p.reviews ?? (p as any).total_reviews ?? 0)
              };
            } catch (err) {
              // if review fetch fails, return original product unchanged
              return p;
            }
          }));
          return enriched;
        };

        // Enrich each section's products with customer-only averages where possible
        const best = bestSellersRes.perfumes || [];
        const newArr = newArrivalsRes.perfumes || [];
        const special = specialOffersRes.perfumes || [];

        // Merge special offers data across all sections so discounted products show consistently
        try {
          const specialMap = new Map<number, any>();
          (special || []).forEach((s: any) => specialMap.set(Number(s.id), s));

          const mergeDiscounts = (list: any[]) => list.map((p: any) => {
            const s = specialMap.get(Number(p.id));
            if (!s) return p;
            return {
              ...p,
              price: s.discounted_price ?? s.price ?? p.price,
              originalPrice: s.original_price ?? s.originalPrice ?? p.originalPrice,
              discountPercentage: s.discount_percentage ?? s.discountPercentage ?? p.discountPercentage,
              discountEndDate: s.end_date ? new Date(s.end_date) : (s.discountEndDate ?? p.discountEndDate ?? p.end_date),
            };
          });

          const [bestEnriched, newEnriched, specialEnriched] = await Promise.all([
            enrichWithCustomerAverages(mergeDiscounts(best)),
            enrichWithCustomerAverages(mergeDiscounts(newArr)),
            enrichWithCustomerAverages(special)
          ]);

          setBestSellers(bestEnriched || []);
          setNewArrivals(newEnriched || []);
          setSpecialOffers(specialEnriched || []);
        } catch (e) {
          // fallback to enrichment without merging if something goes wrong
          const [bestEnriched, newEnriched, specialEnriched] = await Promise.all([
            enrichWithCustomerAverages(best),
            enrichWithCustomerAverages(newArr),
            enrichWithCustomerAverages(special)
          ]);

          setBestSellers(bestEnriched || []);
          setNewArrivals(newEnriched || []);
          setSpecialOffers(specialEnriched || []);
        }
      } catch (err) {
        console.error('Failed to load product sections:', err);
        setError('Failed to load products. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadSections();
  }, []);



  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1">
        <HeroCarousel />
        {/* Best Sellers Section */}
        <section className="container mx-auto px-4 py-16">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold">Best Sellers</h2>
            {bestSellers.length > 4 && (
              <Link to="/products?section=best-sellers" className="text-sm font-medium hover:text-accent">
                View All →
              </Link>
            )}
          </div>
          {error ? (
            <div className="text-center py-8">
              <p className="text-red-500">{error}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {loading ? (
                // Loading state
                Array(4).fill(0).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-muted rounded-lg h-48 mb-4"></div>
                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                  </div>
                ))
              ) : bestSellers.length > 0 ? (
                // Products found
                bestSellers.slice(0, 4).map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))
              ) : (
                // No products found
                <div className="col-span-full text-center py-8">
                  <p className="text-muted-foreground">No best sellers available at the moment.</p>
                </div>
              )}
            </div>
          )}
        </section>

        {/* New Arrivals Section */}
        <section className="container mx-auto px-4 py-16 bg-muted">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold">New Arrivals</h2>
            {newArrivals.length > 4 && (
              <Link to="/products?section=new-arrivals" className="text-sm font-medium hover:text-accent">
                View All →
              </Link>
            )}
          </div>
          {error ? (
            <div className="text-center py-8">
              <p className="text-red-500">{error}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {loading ? (
                Array(4).fill(0).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-muted rounded-lg h-48 mb-4"></div>
                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                  </div>
                ))
              ) : newArrivals.length > 0 ? (
                newArrivals.slice(0, 4).map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))
              ) : (
                <div className="col-span-full text-center py-8">
                  <p className="text-muted-foreground">No new arrivals available at the moment.</p>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Special Offers Section */}
        <section className="container mx-auto px-4 py-16">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold">Special Offers</h2>
            {specialOffers.length > 4 && (
              <Link to="/products?section=special-offers" className="text-sm font-medium hover:text-accent">
                View All →
              </Link>
            )}
          </div>
          {error ? (
            <div className="text-center py-8">
              <p className="text-red-500">{error}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {loading ? (
                Array(4).fill(0).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-muted rounded-lg h-48 mb-4"></div>
                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                  </div>
                ))
              ) : specialOffers.length > 0 ? (
                specialOffers.slice(0, 4).map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))
              ) : (
                <div className="col-span-full text-center py-8">
                  <p className="text-muted-foreground">No special offers available at the moment.</p>
                </div>
              )}
            </div>
          )}
        </section>

  {/* Customer Reviews Section */}
  <Reviews productId="all" />

  {/* FAQ Section */}
  <FAQ />

      </main>
      <Footer />
    </div>
  );
}

export default Index;
