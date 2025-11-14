import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { ApiClient } from "@/lib/api-client";

export default function Checkout() {
  const navigate = useNavigate();
  const { items: cartItems, totalPrice: cartTotal, clearCart } = useCart();
  const { toast } = useToast();
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cod'>('card');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    cardNumber: "",
    cardName: "",
    expiry: "",
    cvv: "",
  });

  // Support single-item checkout initiated from product "Buy Now" button
  let checkoutItems = cartItems;
  let checkoutTotal = cartTotal;
  try {
    const raw = typeof window !== 'undefined' ? sessionStorage.getItem('checkout-item') : null;
    if (raw) {
      const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.items) && parsed.items.length > 0) {
      checkoutItems = parsed.items;
      // support both totalPrice and total
      checkoutTotal = Number(parsed.totalPrice ?? parsed.total ?? 0);
      // keep checkout-item in sessionStorage until order completes
    }
    }
  } catch (err) {
    console.debug('[Checkout] failed to parse checkout-item from sessionStorage', err);
  }

  if (!checkoutItems || checkoutItems.length === 0) {
    navigate("/products");
    return null;
  }

  const shippingCost = 10;
  const tax = checkoutTotal * 0.1;
  const finalTotal = checkoutTotal + shippingCost + tax;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all required shipping fields first
    const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'address', 'city', 'state', 'zip'];
    for (const field of requiredFields) {
      if (!formData[field]?.trim()) {
        toast({ 
          title: 'Missing Information', 
          description: `Please fill in your ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`,
          variant: 'destructive' 
        });
        return;
      }
    }

    // If payment method is card, validate card fields
    if (paymentMethod === 'card') {
      if (!formData.cardNumber || !formData.cardName || !formData.expiry || !formData.cvv) {
        toast({ 
          title: 'Payment Required', 
          description: 'Please complete your card details or choose Cash on Delivery.', 
          variant: 'destructive' 
        });
        return;
      }

      // Card validation as required by backend
      const cardNumber = formData.cardNumber.replace(/\s/g, '');
      if (cardNumber.length < 13 || cardNumber.length > 19) {
        toast({ 
          title: 'Invalid Card', 
          description: 'Please enter a valid card number', 
          variant: 'destructive' 
        });
        return;
      }

      if (!/^\d{3,4}$/.test(formData.cvv)) {
        toast({ 
          title: 'Invalid CVV', 
          description: 'CVV must be 3 or 4 digits', 
          variant: 'destructive' 
        });
        return;
      }
    }

    // Validate cart is not empty
    if (!checkoutItems.length) {
      toast({
        title: 'Empty Cart',
        description: 'Your cart is empty. Please add items before checkout.',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:5000";
      
      // Format data exactly as expected by the backend
      const orderData = {
        shipping: {
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone.trim(),
          address: formData.address.trim(),
          city: formData.city.trim(),
          state: formData.state.trim(),
          zip: formData.zip.trim()
        },
        payment_method: paymentMethod,
        items: checkoutItems.map((item: any) => ({
          // match backend expected shape
          perfume_id: Number(item.perfume_id ?? item.id),
          quantity: Number(item.quantity || 1),
          selectedSize: item.selectedSize ?? item.size ?? null,
          price: Number(item.price ?? item.unit_price ?? 0)
        })),
        totalPrice: parseFloat(checkoutTotal.toFixed(2)),
        tax: parseFloat(tax.toFixed(2)),
        shippingCost: parseFloat(shippingCost.toFixed(2)),
        card_details: paymentMethod === 'card' ? {
          cardName: formData.cardName.trim(),
          cardNumber: formData.cardNumber.replace(/\s/g, ''),
          expiry: formData.expiry.trim(),
          cvv: formData.cvv.trim()
        } : undefined
      };

      // Client-side validation for order payload to prevent backend 400s
      const validateOrderData = (data: any) => {
        const errors: string[] = [];
        if (!data || !Array.isArray(data.items) || data.items.length === 0) {
          errors.push('No items in the order');
        } else {
          data.items.forEach((it: any, idx: number) => {
            const id = Number(it.perfume_id);
            const qty = Number(it.quantity);
            const price = Number(it.price);
            if (!id || Number.isNaN(id) || id <= 0) errors.push(`Item ${idx + 1}: invalid perfume_id`);
            if (!qty || Number.isNaN(qty) || qty <= 0) errors.push(`Item ${idx + 1}: invalid quantity`);
            if (Number.isNaN(price) || price < 0) errors.push(`Item ${idx + 1}: invalid price`);
          });
        }
        return { ok: errors.length === 0, errors };
      };

      const validation = validateOrderData(orderData);
      if (!validation.ok) {
        console.debug('Order validation failed', validation.errors, orderData);
        setIsSubmitting(false);
        toast({ title: 'Invalid order payload', description: validation.errors.join('; '), variant: 'destructive' });
        return;
      }

  const token = localStorage.getItem('token');
      if (!token) {
        toast({
          title: "Authentication Required",
          description: "Please log in to place an order.",
          variant: "destructive"
        });
        navigate('/login');
        return;
      }

  // Debug: log payload so you can inspect what will be sent to the backend
  console.debug('Checkout payload', orderData);

  // Send the order payload to the backend directly (include raw token)
  const res = await fetch(`${API_BASE}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token as string
    },
    body: JSON.stringify(orderData)
  });

  if (!res.ok) {
    // Try to surface error from server if available
    const errText = await res.text().catch(() => null);
    throw new Error(errText || `Failed to place order (status ${res.status})`);
  }

  const data = await res.json();

      // Show success message based on payment method and status
      if (data.status === 'paid') {
        toast({
          title: "Payment Successful",
          description: `Order #${data.order_id} has been placed and payment is confirmed.`,
        });
      } else if (data.status === 'cod_pending') {
        toast({
          title: "Order Placed Successfully",
          description: `Order #${data.order_id} has been placed. Please pay ₹${data.total.toFixed(2)} on delivery.`,
        });
      }

  // Clear cart only after successful order
  clearCart();

  // Remove the single-item checkout marker if present (order completed)
  try { sessionStorage.removeItem('checkout-item'); } catch {}

  // Redirect to home page with success message (no order detail page implemented)
  navigate('/');
      
    } catch (error) {
      // If token expired, clear it and redirect to login
      if (error instanceof Error && /token expired/i.test(error.message)) {
        localStorage.removeItem('token');
        navigate('/login');
      }

      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to place order",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-serif font-bold mb-8">Checkout</h1>

        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Checkout Form */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Shipping Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zip">ZIP Code</Label>
                      <Input
                        id="zip"
                        name="zip"
                        value={formData.zip}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Payment Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Payment method selector */}
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('card')}
                      className={`px-3 py-2 rounded border ${paymentMethod === 'card' ? 'bg-primary text-primary-foreground' : 'bg-card'}`}>
                      Pay with Card
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('cod')}
                      className={`px-3 py-2 rounded border ${paymentMethod === 'cod' ? 'bg-primary text-primary-foreground' : 'bg-card'}`}>
                      Cash on Delivery
                    </button>
                  </div>

                  {paymentMethod === 'cod' ? (
                    <div className="p-4 rounded border bg-muted text-sm">
                      <strong>Cash on Delivery selected.</strong>
                      <p className="text-muted-foreground mt-2">You will pay the courier when your order is delivered. No card details required.</p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="cardName">Name on Card</Label>
                        <Input
                          id="cardName"
                          name="cardName"
                          value={formData.cardName}
                          onChange={handleChange}
                          required={paymentMethod === 'card'}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cardNumber">Card Number</Label>
                        <Input
                          id="cardNumber"
                          name="cardNumber"
                          placeholder="1234 5678 9012 3456"
                          value={formData.cardNumber}
                          onChange={handleChange}
                          required={paymentMethod === 'card'}
                        />
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="expiry">Expiry Date</Label>
                          <Input
                            id="expiry"
                            name="expiry"
                            placeholder="MM/YY"
                            value={formData.expiry}
                            onChange={handleChange}
                            required={paymentMethod === 'card'}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cvv">CVV</Label>
                          <Input
                            id="cvv"
                            name="cvv"
                            placeholder="123"
                            value={formData.cvv}
                            onChange={handleChange}
                            required={paymentMethod === 'card'}
                          />
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div>
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {checkoutItems.map((item: any, index: number) => {
                      const id = item.perfume_id ?? item.id ?? index;
                      const size = item.selectedSize ?? item.size ?? 'default';
                      const imgSrc = item.image ?? item.images?.[0] ?? item.photo_url ?? '/images/placeholder.png';
                      const name = item.name ?? item.perfume_name ?? 'Product';
                      return (
                        <div key={`${id}-${size}-${index}`} className="flex gap-3">
                          <img
                            src={imgSrc}
                            alt={name}
                            className="w-16 h-16 object-cover rounded"
                            onError={(e) => {
                              const img = e.target as HTMLImageElement;
                              if (img.src !== '/images/placeholder.png') img.src = '/images/placeholder.png';
                            }}
                          />
                          <div className="flex-1">
                            <p className="font-medium text-sm">{name}</p>
                            <p className="text-xs text-muted-foreground">
                              {size} × {item.quantity}
                            </p>
                            <p className="text-sm font-semibold">
                              ₹{(item.price * item.quantity).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <Separator />

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>₹{checkoutTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping</span>
                      <span>₹{shippingCost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax</span>
                      <span>₹{tax.toFixed(2)}</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>₹{finalTotal.toFixed(2)}</span>
                  </div>

                  <Button
                    type="submit"
                    className="w-full gradient-primary text-primary-foreground"
                    size="lg"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Processing...' : 'Place Order'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </main>

      <Footer />
    </div>
  );
}