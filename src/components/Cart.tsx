import { ShoppingCart, X, Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/contexts/CartContext";
import { useNavigate } from "react-router-dom";


export default function Cart() {
  const { items, totalItems, totalPrice, updateQuantity, removeItem } = useCart();
  const navigate = useNavigate();

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

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[80vh]">
            <ShoppingCart className="h-24 w-24 text-muted-foreground mb-4" />
            <p className="text-lg text-muted-foreground">Your cart is empty</p>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto py-6 space-y-4">
              {items.map((item) => (
                <div key={`${item.id}-${item.size}`} className="flex gap-4 border-b pb-4">
                  <img
                  src={item.photo_url ?? "/placeholder.png"}
                  alt={item.name ?? "Product"}
                  className="w-24 h-24 object-cover rounded-md"
                  />
                  <div className="flex-1">
                  <h3 className="font-semibold mb-1">{item.name ?? "Product"}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{item.size}</p>
                  <p className="font-bold">₹{item.price}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Button
                    size="icon"
                    variant="outline"
                    className="h-8 w-8"
                    onClick={() => updateQuantity(item.id, item.size, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                    >
                    <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <Button
                    size="icon"
                    variant="outline"
                    className="h-8 w-8"
                    onClick={() => updateQuantity(item.id, item.size, item.quantity + 1)}
                    >
                    <Plus className="h-3 w-3" />
                    </Button>
                    <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 ml-auto"
                    onClick={() => removeItem(item.id, item.size)}
                    >
                    <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t pt-4 space-y-4">
                <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>₹{totalPrice.toFixed(2)}</span>
              </div>
              <Button
                className="w-full gradient-primary text-primary-foreground"
                size="lg"
                onClick={() => navigate("/checkout")}
              >
                Proceed to Checkout
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}