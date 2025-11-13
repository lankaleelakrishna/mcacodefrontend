import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
// Use images from the public/ folder. Files present: /logo.jpg, /logo1.jpg, /placeholder.svg
const slides = [
  {
    image: "/test1.jpg",
    title: "Discover Your Signature Style",
    subtitle: "Women's Designer Wear Crafted for the Exceptional",
    cta: "Shop Now",
    link: "/products"
  },
  {
    image: "/test3.jpg",
    title: "New Spring Collection",
    subtitle: "Fresh Fabrics & Elegant Silhouettes",
    cta: "Explore Collection",
    link: "/products"
  },
  {
    image: "/test2.jpg",
    title: "Exclusive Limited Edition",
    subtitle: "Premium Designer Pieces for Discerning Tastes",
    cta: "View Details",
    link: "/products"
  }
];

const HeroCarousel = () => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <section className="relative h-[500px] md:h-[600px] lg:h-[700px] overflow-hidden">
      {slides.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentSlide ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent z-10" />
          <img
            src={slide.image}
            alt={slide.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 z-20 flex items-center">
            <div className="container mx-auto px-4">
              <div className="max-w-2xl text-white animate-fade-in">
                <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-4">
                  {slide.title}
                </h2>
                <p className="text-xl md:text-2xl mb-8 font-light">
                  {slide.subtitle}
                </p>
                <Button 
                  size="lg" 
                  className="gradient-gold text-foreground hover:shadow-gold transition-smooth text-lg px-8 py-6"
                  onClick={() => navigate(slide.link)}
                >
                  {slide.cta}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation Arrows */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute left-4 top-1/2 -translate-y-1/2 z-30 bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm"
        onClick={prevSlide}
      >
        <ChevronLeft className="h-6 w-6" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-4 top-1/2 -translate-y-1/2 z-30 bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm"
        onClick={nextSlide}
      >
        <ChevronRight className="h-6 w-6" />
      </Button>

      {/* Dots Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex space-x-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`h-2 rounded-full transition-all ${
              index === currentSlide
                ? "w-8 bg-accent"
                : "w-2 bg-white/50 hover:bg-white/75"
            }`}
          />
        ))}
      </div>
    </section>
  );
};

export default HeroCarousel;
