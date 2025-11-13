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
import { useParams } from "react-router-dom"; // ✅ to get perfume ID from URL

const Testimonials = () => {
  const { id } = useParams(); // e.g., /perfumes/16 → id = "16"
  const [recentReviews, setRecentReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [emblaApi, setEmblaApi] = useState(null);

  useEffect(() => {
    const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:5000";
    setLoadingReviews(true);

    const fetchReviews = async () => {
      try {
        let res;

        // ✅ If URL has perfume ID, fetch reviews for that perfume
        if (id) {
          res = await fetch(`${API_BASE}/perfumes/${id}/reviews`);
        } else {
          // ✅ Otherwise, show general recent reviews
          res = await fetch(`${API_BASE}/perfumes/recent-reviews`);
        }

        if (res.ok) {
          const data = await res.json();
          setRecentReviews(data.reviews || data || []);
        } else {
          console.error("Failed to fetch reviews:", res.status);
        }
      } catch (error) {
        console.error("Error fetching reviews:", error);
      } finally {
        setLoadingReviews(false);
      }
    };

    fetchReviews();
  }, [id]);

  // ✅ Auto-slide carousel every 4.5s
  useEffect(() => {
    if (!emblaApi || !recentReviews || recentReviews.length === 0) return;

    const id = setInterval(() => {
      try {
        emblaApi?.scrollNext();
      } catch (e) {
        // ignore
      }
    }, 4500);

    return () => clearInterval(id);
  }, [emblaApi, recentReviews]);

  // ✅ If no reviews, don’t render section
  if (!recentReviews || recentReviews.length === 0) return null;

  return (
    <section className="py-16 md:py-24 bg-muted/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">What Our Customers Say</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Join thousands of satisfied customers who have discovered their signature scent
          </p>
        </div>

        <Carousel opts={{ align: "center", loop: true }} setApi={setEmblaApi} className="w-full">
          <CarouselContent className="-ml-2 md:-ml-4">
            {recentReviews.map((item, idx) => {
              const content = item.content || item.comment || "";
              const name = item.name || item.user_name || item.username || "Anonymous";
              const roleOrDate = item.role || (item.created_at ? new Date(item.created_at).toLocaleDateString() : "");
              const rating = item.rating || 0;
              const initials = (name.split(" ").map((n) => n[0]).slice(0, 2).join("") || "A").toUpperCase();

              return (
                <CarouselItem key={item.id ?? `r-${idx}`} className="basis-full">
                  <Card className="h-full shadow-elegant">
                    <CardContent className="p-6">
                      <Quote className="h-8 w-8 text-accent mb-4" />
                      <p className="text-foreground mb-6 leading-relaxed">{content}</p>
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
      </div>
    </section>
  );
};

export default Testimonials;
