"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Order, getOrders, updateOrderStatus } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Receipt,
  Loader2,
  QrCode,
  Calendar,
  Package,
  ChevronRight,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";

// Status badge helper
function getStatusBadge(status: string) {
  switch (status) {
    case "completed":
      return {
        label: "Completed",
        class: "stock-in",
        icon: CheckCircle2,
      };
    case "pending":
      return {
        label: "Pending",
        class: "stock-low",
        icon: Clock,
      };
    case "cancelled":
      return {
        label: "Cancelled",
        class: "stock-out",
        icon: XCircle,
      };
    default:
      return {
        label: status,
        class: "stock-in",
        icon: CheckCircle2,
      };
  }
}

export default function OrdersPage() {
  const router = useRouter();
  const { isAuthenticated, isOwner, isLoading: authLoading } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders();
    }
  }, [isAuthenticated]);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const data = await getOrders();
      setOrders(data);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to load orders"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: "pending" | "completed" | "cancelled") => {
    setUpdatingStatus(orderId);
    try {
      const updated = await updateOrderStatus(orderId, newStatus);
      setOrders(orders.map(o => o.id === orderId ? updated : o));
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(updated);
      }
      toast.success(`Order status updated to ${newStatus}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update status"
      );
    } finally {
      setUpdatingStatus(null);
    }
  };

  if (authLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredOrders = statusFilter === "all"
    ? orders
    : orders.filter(o => o.status === statusFilter);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          <span className="text-gradient">
            {isOwner ? "Sales History" : "Order History"}
          </span>
        </h1>
        <p className="text-muted-foreground">
          {isOwner
            ? "View and manage all customer purchases"
            : "View your past purchases and bills"}
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px] border-border/50">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Orders</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredOrders.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="flex flex-col items-center py-12">
            <div className="p-4 rounded-2xl bg-primary/10 mb-4">
              <Receipt className="h-12 w-12 text-primary" />
            </div>
            <h2 className="text-xl font-semibold mb-2">
              {orders.length === 0
                ? (isOwner ? "No Sales Yet" : "No Orders Yet")
                : "No Orders Match Filter"}
            </h2>
            <p className="text-muted-foreground mb-6 text-center">
              {orders.length === 0
                ? (isOwner
                  ? "Sales will appear here when customers make purchases"
                  : "Your purchase history will appear here")
                : "Try changing the filter to see more orders"}
            </p>
            {!isOwner && orders.length === 0 && (
              <Link href="/scan">
                <Button className="bg-gradient-primary hover:opacity-90">
                  <QrCode className="h-4 w-4 mr-2" />
                  Start Shopping
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const status = getStatusBadge(order.status);
            const StatusIcon = status.icon;

            return (
              <Card
                key={order.id}
                className="cursor-pointer border-border/50 card-hover"
                onClick={() => setSelectedOrder(order)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <div className="p-1.5 rounded-lg bg-primary/10">
                          <Receipt className="h-4 w-4 text-primary" />
                        </div>
                        <span className="font-mono text-sm font-medium">
                          #{order.id.slice(-8)}
                        </span>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${status.class}`}>
                          <StatusIcon className="h-3 w-3" />
                          {status.label}
                        </span>
                        {isOwner && (
                          <Badge variant="secondary" className="bg-muted/50">{order.buyerName}</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(order.createdAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Package className="h-4 w-4" />
                          {order.items.length}{" "}
                          {order.items.length === 1 ? "item" : "items"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-lg font-semibold text-gradient">
                        ${order.totalAmount.toFixed(2)}
                      </span>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Order Detail Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" />
              Order Details
            </DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4">
              {/* Order Info */}
              <div className="bg-muted/30 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">Order ID</span>
                  <span className="font-mono font-medium">
                    #{selectedOrder.id.slice(-8)}
                  </span>

                  <span className="text-muted-foreground">Date</span>
                  <span>{formatDate(selectedOrder.createdAt)}</span>

                  <span className="text-muted-foreground">Status</span>
                  {isOwner ? (
                    <Select
                      value={selectedOrder.status}
                      onValueChange={(value) => handleStatusUpdate(
                        selectedOrder.id,
                        value as "pending" | "completed" | "cancelled"
                      )}
                      disabled={!!updatingStatus}
                    >
                      <SelectTrigger className="h-7 w-full text-xs">
                        {updatingStatus === selectedOrder.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <SelectValue />
                        )}
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(selectedOrder.status).class}`}>
                      {getStatusBadge(selectedOrder.status).label}
                    </span>
                  )}

                  {isOwner && (
                    <>
                      <span className="text-muted-foreground">Customer</span>
                      <span>{selectedOrder.buyerName}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Items */}
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Items Purchased
                </h4>
                <div className="space-y-2">
                  {selectedOrder.items.map((item, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center py-2 border-b border-border/50 last:border-0"
                    >
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground font-mono">
                          ${item.price.toFixed(2)} x {item.quantity}
                        </p>
                      </div>
                      <span className="font-semibold font-mono">
                        ${item.subtotal.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="border-t border-border/50 pt-4">
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span className="text-gradient">${selectedOrder.totalAmount.toFixed(2)}</span>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full border-primary/30"
                onClick




                ={() => setSelectedOrder(null)}
              >
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
