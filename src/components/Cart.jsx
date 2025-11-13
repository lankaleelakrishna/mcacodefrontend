import { ShoppingCart, X, Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/contexts/CartContext";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export default function Cart() {
  const { items, totalItems, totalPrice, updateQuantity, removeItem, isLoading } = useCart();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleQuantityUpdate = async (productId, newQuantity) => {
    try {
      // Get the item to access its size
      const item = items.find(i => i.perfume_id === productId);
      if (!item) {
        console.error('Item not found:', productId);
        return;
      }
      await updateQuantity(productId, item.size, newQuantity);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update quantity",
        variant: "destructive",
      });
    }
  };

  const handleRemove = async (productId) => {
    try {
      // Get the item to access its size
      const item = items.find(i => i.perfume_id === productId);
      if (!item) {
        console.error('Item not found:', productId);
        return;
      }
      await removeItem(productId, item.size);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove item",
        variant: "destructive",
      });
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <ShoppingCart className="h-5 w-5" />
          {totalItems > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 gradient-primary">
              {totalItems}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="font-serif text-2xl">Shopping Cart</SheetTitle>
        </SheetHeader>

        {!isAuthenticated ? (
          <div className="flex flex-col items-center justify-center h-[80vh]">
            <ShoppingCart className="h-24 w-24 text-muted-foreground mb-4" />
            <p className="text-lg text-muted-foreground">Please login to view your cart</p>
            <Button className="mt-4" onClick={() => navigate("/login")}>
              Login
            </Button>
          </div>
        ) : isLoading ? (
          <div className="flex flex-col items-center justify-center h-[80vh]">
            <p className="text-lg text-muted-foreground">Loading cart...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[80vh]">
            <ShoppingCart className="h-24 w-24 text-muted-foreground mb-4" />
            <p className="text-lg text-muted-foreground">Your cart is empty</p>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto py-6 space-y-4">
              {items.map((item) => (
                <div key={item.perfume_id} className="flex gap-4 border-b pb-4">
                  <img
                    src={item.photo_url}
                    alt={item.perfume_name}
                    className="w-24 h-24 object-cover rounded-md"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">{item.perfume_name}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{item.size}ml</p>
                    <p className="font-bold">₹{item.price}</p>
                    
                    <div className="flex items-center gap-2 mt-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleQuantityUpdate(item.perfume_id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleQuantityUpdate(item.perfume_id, item.quantity + 1)}
                        disabled={!item.in_stock || (item.stock && item.quantity >= item.stock)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        className="h-8 w-8 ml-2"
                        onClick={() => handleRemove(item.perfume_id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    {(item.stock && item.quantity >= item.stock) && (
                      <p className="text-sm text-red-500 mt-2">Out of stock</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t py-4 space-y-4">
                <div className="flex justify-between text-lg font-semibold">
                <span>Total</span>
                <span>₹{totalPrice.toFixed(2)}</span>
              </div>
              <Button
                className="w-full gradient-primary"
                onClick={() => {
                  navigate("/checkout");
                }}
              >
                Checkout
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}