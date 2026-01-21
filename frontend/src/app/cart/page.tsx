"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { createOrder, Order } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { toast } from "sonner";
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Loader2,
  QrCode,
  ArrowRight,
  CheckCircle,
  Receipt,
  Package,
} from "lucide-react";

export default function CartPage() {
  const { isAuthenticated, isOwner } = useAuth();
  const { items, itemCount, totalAmount, updateQuantity, removeItem, clearCart } =
    useCart();

  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [checkoutDialogOpen, setCheckoutDialogOpen] = useState(false);

  // Redirect if not authenticated or is owner
  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Card className="border-border/50">
          <CardContent className="flex flex-col items-center py-12">
            <div className="p-4 rounded-2xl bg-primary/10 mb-4">
              <ShoppingCart className="h-12 w-12 text-primary" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Login Required</h2>
            <p className="text-muted-foreground mb-6 text-center">
              Please login to view your cart and make purchases
            </p>
            <Link href="/login">
              <Button className="bg-gradient-primary hover:opacity-90">Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isOwner) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Card className="border-border/50">
          <CardContent className="flex flex-col items-center py-12">
            <div className="p-4 rounded-2xl bg-muted mb-4">
              <ShoppingCart className="h-12 w-12 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Cart Not Available</h2>
            <p className="text-muted-foreground mb-6 text-center">
              Owners cannot make purchases. Use the dashboard to manage inventory.
            </p>
            <Link href="/dashboard">
              <Button className="bg-gradient-primary hover:opacity-90">Go to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleCheckout = async () => {
    if (items.length === 0) return;

    setIsCheckingOut(true);

    try {
      const orderItems = items.map((item) => ({
        productId: item.id,
        quantity: item.quantity,
      }));

      const order = await createOrder(orderItems);
      setCompletedOrder(order);
      clearCart();
      setCheckoutDialogOpen(false);
      toast.success("Order placed successfully!");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to place order"
      );
    } finally {
      setIsCheckingOut(false);
    }
  };

  // Show order confirmation
  if (completedOrder) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Card className="border-border/50 overflow-hidden">
          <CardHeader className="text-center bg-gradient-primary py-8">
            <CheckCircle className="h-16 w-16 text-white mx-auto mb-4" />
            <CardTitle className="text-2xl text-white">Order Confirmed!</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="bg-muted/50 rounded-lg p-4 mb-6">
              <div className="flex justify-between text-sm text-muted-foreground mb-2">
                <span>Order ID</span>
                <span className="font-mono font-medium">#{completedOrder.id.slice(-8)}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground mb-2">
                <span>Status</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium stock-in">
                  {completedOrder.status}
                </span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground mb-4">
                <span>Date</span>
                <span>
                  {new Date(completedOrder.createdAt).toLocaleDateString()}
                </span>
              </div>

              <div className="border-t border-border/50 pt-4">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Items Purchased
                </h4>
                {completedOrder.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex justify-between text-sm py-2 border-b border-border/30 last:border-0"
                  >
                    <span>
                      {item.name} <span className="text-muted-foreground">x {item.quantity}</span>
                    </span>
                    <span className="font-mono">${item.subtotal.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-border/50 mt-4 pt-4">
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total Paid</span>
                  <span className="text-gradient">${completedOrder.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/orders" className="flex-1">
                <Button variant="outline" className="w-full border-primary/30">
                  <Receipt className="h-4 w-4 mr-2" />
                  View Orders
                </Button>
              </Link>
              <Link href="/scan" className="flex-1">
                <Button className="w-full bg-gradient-primary hover:opacity-90">
                  <QrCode className="h-4 w-4 mr-2" />
                  Continue Shopping
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Empty cart
  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">
            <span className="text-gradient">Shopping Cart</span>
          </h1>
          <p className="text-muted-foreground">Your cart is empty</p>
        </div>

        <Card className="border-border/50">
          <CardContent className="flex flex-col items-center py-12">
            <div className="p-4 rounded-2xl bg-primary/10 mb-4">
              <ShoppingCart className="h-12 w-12 text-primary" />
            </div>
            <h2 className="text-xl font-semibold mb-2">No items in cart</h2>
            <p className="text-muted-foreground mb-6 text-center">
              Scan a product QR code to add items to your cart
            </p>
            <Link href="/scan">
              <Button className="bg-gradient-primary hover:opacity-90">
                <QrCode className="h-4 w-4 mr-2" />
                Scan Products
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          <span className="text-gradient">Shopping Cart</span>
        </h1>
        <p className="text-muted-foreground">
          {itemCount} {itemCount === 1 ? "item" : "items"} in your cart
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <Card key={item.id} className="border-border/50 card-hover">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold">{item.name}</h3>
                    <Badge variant="outline" className="mt-1 bg-muted/50">
                      {item.category}
                    </Badge>
                    <p className="text-lg font-medium mt-2 text-gradient">
                      ${item.price.toFixed(2)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Quantity Controls */}
                    <div className="flex items-center border border-border/50 rounded-lg overflow-hidden">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-none hover:bg-primary/10"
                        onClick={() =>
                          updateQuantity(item.id, item.quantity - 1)
                        }
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          if (!isNaN(val) && val > 0) {
                            updateQuantity(item.id, val);
                          }
                        }}
                        className="w-14 h-8 text-center border-0 rounded-none font-mono [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        min={1}
                        max={item.maxQuantity}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-none hover:bg-primary/10"
                        onClick={() =>
                          updateQuantity(item.id, item.quantity + 1)
                        }
                        disabled={item.quantity >= item.maxQuantity}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Remove Button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-4 pt-4 border-t border-border/50">
                  <span className="text-sm text-muted-foreground">
                    Max available: {item.maxQuantity}
                  </span>
                  <span className="font-semibold font-mono">
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24 border-border/50">
            <CardHeader className="bg-muted/30">
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="space-y-2">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {item.name} <span className="font-mono">x {item.quantity}</span>
                    </span>
                    <span className="font-mono">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-border/50 pt-4">
                <div className="flex justify-between text-xl font-semibold">
                  <span>Total</span>
                  <span className="text-gradient">${totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button
                className="w-full bg-gradient-primary hover:opacity-90"
                size="lg"
                onClick={() => setCheckoutDialogOpen(true)}
              >
                Checkout
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              <Link href="/scan" className="w-full">
                <Button variant="outline" className="w-full border-primary/30">
                  <QrCode className="h-4 w-4 mr-2" />
                  Add More Items
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* Checkout Confirmation Dialog */}
      <ConfirmDialog
        open={checkoutDialogOpen}
        onOpenChange={setCheckoutDialogOpen}
        title="Confirm Purchase"
        description={`You are about to purchase ${itemCount} ${itemCount === 1 ? "item" : "items"} for a total of $${totalAmount.toFixed(2)}. Do you want to proceed?`}
        confirmText="Place Order"
        isLoading={isCheckingOut}
        onConfirm={handleCheckout}
      />
    </div>
  );
}
