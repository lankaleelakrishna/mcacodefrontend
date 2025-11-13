import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
// Removed static products import
import { ApiClient } from "@/lib/api-client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, SlidersHorizontal } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const isNewProduct = (createdAt: string): boolean => {
  if (!createdAt) return false;
  const productDate = new Date(createdAt);
  const currentDate = new Date();
  const differenceInDays = (currentDate.getTime() - productDate.getTime()) / (1000 * 3600 * 24);
  return differenceInDays <= 30; // Consider products added within last 30 days as new
};

const Products = () => {
  const [searchParams] = useSearchParams();
  const section = searchParams.get("section");
  
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [fragranceFilter, setFragranceFilter] = useState("all");
  const [sortBy, setSortBy] = useState(section === "new-arrivals" ? "newest" : "popular");
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        let response;
        switch (section) {
          case 'best-sellers':
            response = await ApiClient.getBestSellers();
            break;
          case 'new-arrivals':
            response = await ApiClient.getNewArrivals();
            break;
          case 'special-offers':
            response = await ApiClient.getSpecialOffers();
            break;
          default:
            response = await ApiClient.getPerfumes();
        }

        if (response && response.perfumes) {
          let perfumes = response.perfumes;

          // Ensure discounts from special-offers are applied across all sections.
          try {
            const specialRes = await ApiClient.getSpecialOffers();
            const specialMap = new Map<number, any>();
            (specialRes?.perfumes || []).forEach((s: any) => specialMap.set(Number(s.id), s));
            perfumes = (perfumes || []).map((p: any) => {
              const s = specialMap.get(Number(p.id));
              if (!s) return p;
              return {
                ...p,
                // prefer explicit discounted fields from special offers endpoint
                price: s.discounted_price ?? s.price ?? p.price,
                originalPrice: s.original_price ?? s.originalPrice ?? p.originalPrice ?? p.original_price,
                discountPercentage: s.discount_percentage ?? s.discountPercentage ?? p.discountPercentage,
                discountEndDate: s.end_date ? new Date(s.end_date) : (s.discountEndDate ?? p.discountEndDate ?? p.end_date),
              };
            });
          } catch (e) {
            // ignore special offers merge failures
          }

          setAllProducts(perfumes);
        }
      } catch (err) {
        console.error('Failed to load products:', err);
        setAllProducts([]);
      } finally {
        setLoading(false);
      }
    };
    load();
    // Polling: refresh products periodically to pick up backend changes
    const interval = setInterval(() => {
      load();
    }, 30000); // 30s

    // Listen to storage events so admin actions in other tabs trigger immediate reload
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'products:updated') {
        load();
      }
    };
    window.addEventListener('storage', onStorage);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', onStorage);
    };
  }, [section]);

  const filteredProducts = allProducts
    .filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           product.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === "all" || product.category.toLowerCase() === categoryFilter.toLowerCase();
      const matchesFragrance = fragranceFilter === "all" || product.fragranceType === fragranceFilter;
      
      // Section filtering
      const matchesSection = !section || (
        (section === "best-sellers" && product.isBestSeller) ||
        (section === "new-arrivals" && product.isNew) ||
        (section === "special-offers" && product.isSale)
      );

      return matchesSearch && matchesCategory && matchesFragrance && matchesSection;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return Number(a.price) - Number(b.price);
        case "price-high":
          return Number(b.price) - Number(a.price);
        case "rating":
          return b.rating - a.rating;
        case "newest":
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateB - dateA;
        default: // popular
          return b.reviews - a.reviews;
      }
    });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {section === "best-sellers" ? "Best Sellers" :
             section === "new-arrivals" ? "New Arrivals" :
             section === "special-offers" ? "Special Offers" :
             "All Perfumes"}
          </h1>
          <p className="text-lg text-muted-foreground">
            {section === "best-sellers" ? "Our most popular fragrances loved by customers" :
             section === "new-arrivals" ? "The latest additions to our luxury collection" :
             section === "special-offers" ? "Exclusive deals on premium fragrances" :
             "Discover our complete collection of luxury fragrances"}
          </p>
        </div>

        {/* Filters */}
        <div className="bg-card rounded-lg p-6 mb-8 shadow-elegant">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search perfumes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Category Filter */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Men">Men</SelectItem>
                <SelectItem value="Women">Women</SelectItem>
                <SelectItem value="Unisex">Unisex</SelectItem>
              </SelectContent>
            </Select>

            {/* Fragrance Type Filter */}
            <Select value={fragranceFilter} onValueChange={setFragranceFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Fragrance Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Floral">Floral</SelectItem>
                <SelectItem value="Woody">Woody</SelectItem>
                <SelectItem value="Fresh">Fresh</SelectItem>
                <SelectItem value="Oriental">Oriental</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort By */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-muted-foreground">
            Showing {filteredProducts.length} of {allProducts.length} perfumes
          </p>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {/* No Results */}
        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-xl text-muted-foreground mb-4">No perfumes found matching your criteria</p>
            <Button onClick={() => {
              setSearchQuery("");
              setCategoryFilter("all");
              setFragranceFilter("all");
            }}>
              Clear Filters
            </Button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Products;
