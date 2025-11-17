import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useNavigate, useLocation } from "react-router-dom";

const Footer = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigation = (path: string, sectionId?: string) => {
    // If we're already on the home page and sectionId is provided, scroll to that section
    if (location.pathname === '/' && sectionId) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
      return;
    }
    
    // Otherwise navigate to the path
    window.scrollTo({ top: 0, behavior: 'smooth' });
    navigate(path);
  };
  return (
    <footer className="bg-card border-t">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <h3 className="text-2xl font-bold text-primary mb-4">
              MCA Fashion
            </h3>
            <p className="text-muted-foreground mb-4">
              Designer wear for women crafted with care. Discover your signature style.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="icon">
                <Facebook className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <Instagram className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <Twitter className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Shop</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li><button onClick={() => handleNavigation('/products')} className="hover:text-primary transition-colors text-left">All Products</button></li>
              <li><button onClick={() => handleNavigation('/', 'best-sellers')} className="hover:text-primary transition-colors text-left">Best Sellers</button></li>
              <li><button onClick={() => handleNavigation('/', 'new-arrivals')} className="hover:text-primary transition-colors text-left">New Arrivals</button></li>
              <li><button onClick={() => handleNavigation('/', 'special-offers')} className="hover:text-primary transition-colors text-left">Special Offers</button></li>
            </ul>
          </div>

          {/* Customer Care */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Customer Care</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li><button onClick={() => handleNavigation('/contact')} className="hover:text-primary transition-colors text-left">Contact Us</button></li>
              <li><button onClick={() => handleNavigation('/', 'faq')} className="hover:text-primary transition-colors text-left">FAQ</button></li>
              <li><a href="#" className="hover:text-primary transition-colors">Size Guide</a></li>
              <li><button onClick={() => handleNavigation('/orders')} className="hover:text-primary transition-colors text-left">Track Order</button></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Stay Connected</h4>
            <p className="text-muted-foreground mb-4 text-sm">
              Subscribe to receive exclusive offers and style tips
            </p>
            <div className="flex gap-2 mb-4">
              <Input type="email" placeholder="Your email" />
              <Button className="gradient-primary text-primary-foreground">
                Subscribe
              </Button>
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span>hello@mcafashion.com</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>New York, NY</span>
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <p>&copy; 2025 MCA Fashion. All rights reserved.</p>
          <div className="flex gap-6">
            <button onClick={() => handleNavigation('/privacy')} className="hover:text-primary transition-colors text-left">Privacy Policy</button>
            <button onClick={() => handleNavigation('/terms')} className="hover:text-primary transition-colors text-left">Terms of Service</button>
            <button onClick={() => handleNavigation('/cookies')} className="hover:text-primary transition-colors text-left">Cookie Policy</button>
            <button onClick={() => handleNavigation('/ages')} className="hover:text-primary transition-colors text-left">Age Policy</button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;