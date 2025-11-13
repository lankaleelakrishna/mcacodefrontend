import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLiked } from "@/contexts/LikedContext";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Heart, Menu, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import Cart from "@/components/Cart";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

const Navbar = () => {
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const { likedProducts } = useLiked();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout, token } = useAuth ? useAuth() : { user: null, isAuthenticated: false, logout: () => {}, token: null };
  const [recentOrders, setRecentOrders] = useState<any[] | null>(null);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Close dropdown on outside click
  useEffect(() => {
    if (!showAccountMenu) return;
    function handle(e) {
      setShowAccountMenu(false);
    }
    window.addEventListener("click", handle);
    return () => window.removeEventListener("click", handle);
  }, [showAccountMenu]);

  // Load recent orders when account menu opens
  useEffect(() => {
    if (!showAccountMenu || !isAuthenticated || !token) return;
    let mounted = true;
    const load = async () => {
      try {
        setOrdersLoading(true);
        const ApiClient = (await import('@/lib/api-client')).ApiClient;
        const res = await ApiClient.getRecentOrders(token as string, 3);
        const data = res?.recent_orders || res?.orders || res || [];
        if (!mounted) return;
        setRecentOrders(Array.isArray(data) ? data : []);
      } catch (err) {
        console.debug('Failed to load recent orders for account dropdown', err);
        if (!mounted) return;
        setRecentOrders([]);
      } finally {
        if (mounted) setOrdersLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [showAccountMenu, isAuthenticated, token]);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center">
            <h1 className="text-3xl md:text-4xl font-brand font-black tracking-wider bg-gradient-to-r from-accent to-yellow-600 bg-clip-text text-transparent">
              MCA Fasion
            </h1>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-sm font-medium hover:text-primary transition-colors">
              Home
            </Link>
            <Link to="/products" className="text-sm font-medium hover:text-primary transition-colors">
              Products
            </Link>
            <Link to="/collections" className="text-sm font-medium hover:text-primary transition-colors">
              Collections
            </Link>
            <Link to="/about" className="text-sm font-medium hover:text-primary transition-colors">
              About
            </Link>
            <Link to="/contact" className="text-sm font-medium hover:text-primary transition-colors">
              Contact
            </Link>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2 md:space-x-4">
              {/* Recent Orders (navigate to SPA page) */}
              <Button
                variant="ghost"
                size="sm"
                className="hidden md:inline-flex"
                onClick={() => {
                  if (!isAuthenticated) {
                    navigate('/login');
                    return;
                  }
                  navigate('/recent-orders');
                }}
              >
                Recent Orders
              </Button>

            {/* Liked Products & Cart - hide on admin pages or for admin users */}
            {!(user?.isAdmin || location.pathname.startsWith('/admin')) && (
              <>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="relative"
                  onClick={() => {
                    if (!isAuthenticated) {
                      navigate('/login');
                      return;
                    }
                    navigate('/liked');
                  }}
                >
                  <Heart className="h-5 w-5" />
                  {likedProducts.length > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-accent text-accent-foreground text-xs flex items-center justify-center font-medium">
                      {likedProducts.length}
                    </span>
                  )}
                </Button>

                {/* Cart */}
                <Cart />
              </>
            )}

            {/* User Account Dropdown (Desktop) */}
            <div className="relative hidden md:flex">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowAccountMenu((v) => !v)}
                aria-label="Account"
              >
                <User className="h-5 w-5" />
              </Button>
              {showAccountMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white border rounded shadow-lg z-50">
                  {isAuthenticated ? (
                    <div className="px-4 py-2 text-sm">
                      <div className="font-medium mb-2">{user?.username}</div>

                      {/* Recent orders preview */}
                      <div className="mb-2">
                        {ordersLoading ? (
                          <div className="text-sm text-muted-foreground">Loading orders…</div>
                        ) : recentOrders && recentOrders.length > 0 ? (
                          <div className="space-y-2">
                            {recentOrders.map((o: any) => {
                              const id = o.id ?? o.order_id ?? o.orderId;
                              // Prefer a proper created_at timestamp if available, otherwise fall back to provided date/time
                              const createdAt = o.created_at ? new Date(o.created_at).toLocaleString() : (o.date ? `${o.date}${o.time ? ' • ' + o.time : ''}` : '');
                              const total = parseFloat(o.total_amount ?? o.total ?? o.grand_total ?? 0).toFixed(2);
                              return (
                                <button
                                  key={id}
                                  className="w-full text-left text-sm hover:bg-gray-50 px-2 py-1 rounded"
                                  onClick={() => { setShowAccountMenu(false); navigate('/orders'); }}
                                >
                                  <div className="font-medium">Order #{id}</div>
                                  <div className="text-xs text-muted-foreground">{createdAt} • ₹{total}</div>
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground">No recent orders</div>
                        )}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-1 w-full"
                        onClick={() => {
                          setShowAccountMenu(false);
                          if (!isAuthenticated) {
                            navigate('/login');
                            return;
                          }
                          navigate('/recent-orders');
                        }}
                      >
                        My Orders
                      </Button>

                      <Button variant="outline" size="sm" className="mt-2 w-full" onClick={() => { setShowAccountMenu(false); logout(); }}>
                        Logout
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Link to="/login" className="block px-4 py-2 hover:bg-gray-100 text-sm" onClick={() => setShowAccountMenu(false)}>
                        Login
                      </Link>
                      <Link to="/signup" className="block px-4 py-2 hover:bg-gray-100 text-sm" onClick={() => setShowAccountMenu(false)}>
                        Sign Up
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full sm:w-80">
                <div className="flex flex-col space-y-6 mt-8">
                  <Link
                    to="/"
                    className="text-lg font-medium hover:text-primary transition-colors"
                  >
                    Home
                  </Link>
                  <Link
                    to="/products"
                    className="text-lg font-medium hover:text-primary transition-colors"
                  >
                    Products
                  </Link>
                  <Link
                    to="/collections"
                    className="text-lg font-medium hover:text-primary transition-colors"
                  >
                    Collections
                  </Link>
                  <Link
                    to="/about"
                    className="text-lg font-medium hover:text-primary transition-colors"
                  >
                    About
                  </Link>
                  <Link
                    to="/contact"
                    className="text-lg font-medium hover:text-primary transition-colors"
                  >
                    Contact
                  </Link>
                  <div className="pt-4 border-t flex flex-col gap-2">
                    {isAuthenticated ? (
                      <>
                        <div className="px-2 py-1 text-sm font-medium">{user?.username}</div>
                        <Link to="/recent-orders" onClick={() => { /* close sheet by navigation */ }}>
                          <Button variant="outline" className="w-full justify-start mt-2" size="lg">
                            My Orders
                          </Button>
                        </Link>
                        <Button variant="outline" className="w-full justify-start mt-2" size="lg" onClick={logout}>
                          Logout
                        </Button>
                      </>
                    ) : (
                      <>
                        <Link to="/login">
                          <Button variant="outline" className="w-full justify-start" size="lg">
                            <User className="mr-2 h-5 w-5" />
                            Login
                          </Button>
                        </Link>
                        <Link to="/signup">
                          <Button variant="secondary" className="w-full justify-start" size="lg">
                            Sign Up
                          </Button>
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
