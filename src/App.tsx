import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { LikedProvider } from "@/contexts/LikedContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminProtectedRoute from "@/components/AdminProtectedRoute";
import Index from "./pages/Index";
import Products from "./pages/Products";
import AdminProducts from "./pages/AdminProducts";
import AdminAnalytics from "./pages/AdminAnalytics";
import ManageSections from "@/components/admin/ManageSections";
import AdminReviews from "@/components/admin/AdminReviews";
import AdminOrders from "@/components/admin/AdminOrders";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import ProductDetail from "./pages/ProductDetail";
import Checkout from "./pages/Checkout";
import About from "./pages/About";
import Login from "@/components/account/Login";
import Signup from "./pages/Signup";
import AdminSignup from "@/components/account/AdminSignup";
import CustomerSignup from "@/components/account/CustomerSignup";
import AdminLogin from "./pages/AdminLogin";
import NotFound from "./pages/NotFound";
import LikedProducts from "./pages/LikedProducts";
import ContactUs from "./pages/ContactUs";
import AgePolicy from "./pages/AgePolicy";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import CookiePolicy from "./pages/CookiePolicy";
import RecentOrders from "./pages/RecentOrders";

const queryClient = new QueryClient();

const RoleRedirect = ({ children }) => {
  const { user } = useAuth();
  // if logged in as admin (role_id === 1) send to admin console
  if (user && (user.role_id === 1 || String(user.role_id) === '1')) {
    return <Navigate to="/admin/products" replace />;
  }
  return children;
};

const PublicProviders = ({ children }: { children: any }) => (
  <CartProvider>
    <LikedProvider>
      {children}
    </LikedProvider>
  </CartProvider>
);

const App = () => (
  <BrowserRouter>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Routes>
              {/* Redirect admins away from customer pages to admin console */}
              <Route
                path="/"
                element={
                  <PublicProviders>
                    <RoleRedirect>
                      <Index />
                    </RoleRedirect>
                  </PublicProviders>
                }
              />
              <Route
                path="/products"
                element={
                  <PublicProviders>
                    <RoleRedirect>
                      <Products />
                    </RoleRedirect>
                  </PublicProviders>
                }
              />
              <Route path="/collections" element={<ContactUs />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<ContactUs />} />
              <Route path="/ages" element={<AgePolicy />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/cookies" element={<CookiePolicy />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/checkout" element={
                <PublicProviders>
                  <ProtectedRoute>
                    <Checkout />
                  </ProtectedRoute>
                </PublicProviders>
              } />
              <Route path="/login" element={<Login />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/signup" element={<Signup />} />
                <Route path="/admin/signup" element={<AdminSignup />} />
                <Route path="/customer/signup" element={<CustomerSignup />} />
              <Route path="/liked" element={
                <PublicProviders>
                  <ProtectedRoute>
                    <LikedProducts />
                  </ProtectedRoute>
                </PublicProviders>
              } />
              <Route path="/recent-orders" element={
                <PublicProviders>
                  <ProtectedRoute>
                    <RecentOrders />
                  </ProtectedRoute>
                </PublicProviders>
              } />
              <Route path="/admin/products" element={
                <AdminProtectedRoute>
                  <AdminProducts />
                </AdminProtectedRoute>
              } />
              <Route path="/admin/analytics" element={
                <AdminProtectedRoute>
                  <AdminAnalytics />
                </AdminProtectedRoute>
              } />
              <Route path="/admin/sections" element={
                <AdminProtectedRoute>
                  <ManageSections />
                </AdminProtectedRoute>
              } />
              <Route path="/admin/orders" element={
                <AdminProtectedRoute>
                  <AdminOrders />
                </AdminProtectedRoute>
              } />
              <Route path="/admin/reviews" element={
                <AdminProtectedRoute>
                  <AdminReviews />
                </AdminProtectedRoute>
              } />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </BrowserRouter>
);

export default App;
