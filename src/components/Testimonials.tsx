import { Star, Quote } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { products } from "@/data/products";
import { useToast } from "@/hooks/use-toast";
import { Reviews } from "@/components/Reviews";
import { ApiClient } from "@/lib/api-client";

const testimonials = [
  {
    id: 1,
    name: "Sarah Johnson",
    role: "Fashion Blogger",
  content: "The fit and finish of MCA Fashion pieces are exceptional. I get compliments every time I wear the Emerald Dress.",
    rating: 5,
    initials: "SJ"
  },
  {
    id: 2,
    name: "Michael Chen",
    role: "Business Executive",
    content: "The tailoring is superb — these pieces are comfortable yet polished for work and events.",
    rating: 5,
    initials: "MC"
  },
  {
    id: 3,
    name: "Emma Williams",
    role: "Stylist",
    content: "I love the attention to detail and the way each garment holds its shape. The fabrics feel luxe.",
    rating: 5,
    initials: "EW"
  },
  {
    id: 4,
    name: "David Martinez",
    role: "Entrepreneur",
  content: "Beautiful packaging and thoughtful design — MCA Fashion makes gifting effortless.",
    rating: 5,
    initials: "DM"
  },
  {
    id: 5,
    name: "Lisa Anderson",
    role: "Interior Designer",
    content: "The seasonal pieces are timeless and elegant. I keep coming back for statement staples.",
    rating: 5,
    initials: "LA"
  },
  {
    id: 6,
    name: "James Taylor",
    role: "Photographer",
    content: "Consistent quality and design sensibility across the collection — very impressed.",
    rating: 5,
    initials: "JT"
  }
];

const Testimonials = ({ reviews }: { reviews?: any[] }) => {
  const [recentReviews, setRecentReviews] = useState<any[]>(reviews || []);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // If parent provided reviews, use them and skip fetching.
    if (reviews && reviews.length > 0) {
      setRecentReviews(reviews);
      setLoadingReviews(false);
      return;
    }

    setLoadingReviews(true);
    const load = async () => {
      try {
        const res: any = await ApiClient.getRecentReviews();
        // Debug: log raw backend response so we can inspect shape in browser console
        console.debug('[Testimonials] getRecentReviews response:', res);

        // Normalize different possible backend shapes into a flat reviews array
        let list: any[] = [];
        if (!res) {
          list = [];
        } else if (Array.isArray(res)) {
          list = res;
        } else if (Array.isArray(res.reviews)) {
          list = res.reviews;
        } else if (Array.isArray(res.recent_reviews)) {
          // backend returns { recent_reviews: [...] }
          list = res.recent_reviews;
        } else if (Array.isArray(res.recentReviews)) {
          // sometimes camelCase
          list = res.recentReviews;
        } else if (res.reviews_by_perfume && typeof res.reviews_by_perfume === 'object') {
          // backend may return grouped reviews: { reviews_by_perfume: { pid: { reviews: [...] } } }
          Object.values(res.reviews_by_perfume).forEach((g: any) => {
            if (g && Array.isArray(g.reviews)) list.push(...g.reviews);
          });
        } else if (res.reviews_by_perfumes && typeof res.reviews_by_perfumes === 'object') {
          // some APIs use pluralized key
          Object.values(res.reviews_by_perfumes).forEach((g: any) => {
            if (g && Array.isArray(g.reviews)) list.push(...g.reviews);
          });
        } else if (res.data && Array.isArray(res.data)) {
          list = res.data;
        } else if (res.recent && Array.isArray(res.recent)) {
          list = res.recent;
        } else {
          // try to find any array value in the response
          for (const v of Object.values(res)) {
            if (Array.isArray(v)) { list = v as any[]; break; }
          }
        }

  console.debug('[Testimonials] normalized reviews count:', list.length);
  setRecentReviews(list.slice(0, 6));
  setLoadingReviews(false);
  return;
      } catch (err) {
        console.warn('[Testimonials] getRecentReviews failed, will try fallback aggregation', err);
        // fallthrough to small sampled aggregation fallback
      }

      try {
        // fallback: sample fewer perfumes to reduce noisy requests
        const sample = products.slice(0, 4);
        const promises = sample.map(p => ApiClient.getProductReviews(p.id).catch(() => null));
        const results = await Promise.all(promises);
        const aggregated: any[] = [];
        results.forEach((r, idx) => {
          const list = r && r.reviews ? r.reviews : (Array.isArray(r) ? r : null);
          if (Array.isArray(list)) {
            list.forEach((rev: any) => aggregated.push({ ...rev, perfume_id: sample[idx].id }));
          }
        });
        aggregated.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setRecentReviews(aggregated.slice(0, 6));
      } catch (e) {
        // optional toast: toast({ title: 'Could not load reviews', variant: 'destructive' })
      } finally {
        setLoadingReviews(false);
      }
    };

    load();
  }, [reviews]);

  return (
    <>
      <section className="py-16 md:py-24 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">What Our Customers Say</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Join thousands of satisfied customers who have discovered their signature style
            </p>
          </div>

          {loadingReviews ? (
            <div className="text-center py-8">Loading reviews…</div>
          ) : recentReviews && recentReviews.length > 0 ? (
            <Carousel
              opts={{
                align: "start",
                loop: true,
              }}
              className="w-full"
            >
              <CarouselContent className="-ml-2 md:-ml-4">
                {recentReviews.map((item: any, idx: number) => {
                  const isReview = !!item.comment || !!item.rating;
                  const content = item.content || item.comment || '';
                  const name = item.user_name || item.username || item.name || 'Anonymous';
                  const roleOrDate = isReview ? (item.created_at ? new Date(item.created_at).toLocaleDateString() : '') : (item.role || 'Customer');
                  const rating = item.rating || 0;
                  const initials = (name || 'A').split(' ').map((n: string) => n[0]).slice(0,2).join('').toUpperCase();

                  return (
                    <CarouselItem key={item.id ?? `t-${idx}`} className="pl-2 md:pl-4 basis-full md:basis-1/2 lg:basis-1/3">
                      <Card className="h-full shadow-elegant">
                        <CardContent className="p-6">
                          <Quote className="h-8 w-8 text-accent mb-4" />
                          <p className="text-foreground mb-6 leading-relaxed">
                            {content}
                          </p>
                          <div className="flex items-center gap-1 mb-4">
                            {Array.from({ length: Math.max(0, rating) }).map((_, i) => (
                              <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                            ))}
                          </div>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback className="gradient-primary text-primary-foreground">
                                {initials}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-semibold">{name}</p>
                              <p className="text-sm text-muted-foreground">{roleOrDate}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </CarouselItem>
                  );
                })}
              </CarouselContent>
              <CarouselPrevious className="hidden md:flex" />
              <CarouselNext className="hidden md:flex" />
            </Carousel>
          ) : (
            <div className="text-center py-8">No customer reviews available yet.</div>
          )}
          
        </div>
      </section>

      {/* Product Reviews Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Customer Reviews</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Read detailed reviews from our valued customers about their shopping experience
            </p>
          </div>
          <Reviews productId="all" />
        </div>
      </section>
    </>
  );
};

export default Testimonials;
