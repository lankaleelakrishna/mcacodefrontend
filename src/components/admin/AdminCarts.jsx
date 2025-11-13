import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ApiClient } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function AdminCarts() {
  const [carts, setCarts] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchCarts = async () => {
      if (!isAuthenticated || !user?.isAdmin) return;

      try {
        setIsLoading(true);
        const response = await ApiClient.adminGetAllCarts();
        setCarts(response.carts_by_user || {});
      } catch (error) {
        console.error('Error fetching carts:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch cart data',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchCarts();
  }, [isAuthenticated, user, toast]);

  if (!isAuthenticated || !user?.isAdmin) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
        <p>You need to be logged in as an admin to view this page.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Loading cart data...</h2>
      </div>
    );
  }

  const totalCarts = Object.keys(carts).length;
  const totalItems = Object.values(carts).reduce((total, userCart) => {
    return total + userCart.cart_items.reduce((sum, item) => sum + item.quantity, 0);
  }, 0);

  return (
    <div className="container mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Carts Overview</CardTitle>
          <CardDescription>
            Total Active Carts: {totalCarts} | Total Items: {totalItems}
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Customer Carts</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px] pr-4">
            <Accordion type="single" collapsible className="space-y-4">
              {Object.entries(carts).map(([userId, userData]) => {
                const cartTotal = userData.cart_items.reduce(
                  (total, item) => total + item.price * item.quantity,
                  0
                );

                return (
                  <AccordionItem
                    key={userId}
                    value={userId}
                    className="border rounded-lg p-4"
                  >
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex flex-col items-start space-y-1">
                        <div className="text-lg font-semibold">
                          {userData.username}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {userData.email}
                        </div>
                        <div className="text-sm">
                          Items: {userData.cart_items.length} | Total: ₹{cartTotal.toFixed(2)}
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4 mt-4">
                        {userData.cart_items.map((item) => (
                          <div
                            key={item.id}
                            className="flex gap-4 border-b pb-4 last:border-0"
                          >
                            <div className="w-24 h-24">
                              <img
                                src={item.photo_url}
                                alt={item.perfume_name}
                                className="w-full h-full object-cover rounded-md"
                              />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold">{item.perfume_name}</h4>
                              <div className="text-sm text-muted-foreground space-y-1">
                                <p>Size: {item.size}ml</p>
                                <p>Quantity: {item.quantity}</p>
                                <p>Price: ₹{item.price}</p>
                                <p>Subtotal: ₹{(item.price * item.quantity).toFixed(2)}</p>
                                <p>Added: {new Date(item.added_at).toLocaleString()}</p>
                                <p className={item.in_stock ? 'text-green-600' : 'text-red-600'}>
                                  {item.in_stock ? 'In Stock' : 'Out of Stock'}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}