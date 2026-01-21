"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { InventoryItem, getItems, deleteItem } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ItemDialog } from "@/components/ItemDialog";
import { QRModal } from "@/components/QRModal";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  QrCode,
  Loader2,
  Package,
  AlertTriangle,
  ShoppingCart,
  TrendingUp,
  Check,
} from "lucide-react";

// Stock status helper
function getStockStatus(item: InventoryItem) {
  if (item.quantity === 0) {
    return { label: "Out of Stock", class: "stock-out", variant: "destructive" as const };
  }
  if (item.lowStock) {
    return { label: "Low Stock", class: "stock-low", variant: "secondary" as const };
  }
  return { label: "In Stock", class: "stock-in", variant: "default" as const };
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated, isOwner } = useAuth();
  const { addItem, getItemQuantity } = useCart();

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchItems();
    }
  }, [isAuthenticated]);

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      const data = await getItems();
      setItems(data);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to load inventory"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddItem = () => {
    setSelectedItem(null);
    setItemDialogOpen(true);
  };

  const handleEditItem = (item: InventoryItem) => {
    setSelectedItem(item);
    setItemDialogOpen(true);
  };

  const handleDeleteClick = (item: InventoryItem) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;

    setDeletingId(itemToDelete.id);
    try {
      await deleteItem(itemToDelete.id);
      toast.success("Item deleted successfully");
      setDeleteDialogOpen(false);
      setItemToDelete(null);
      fetchItems();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete item"
      );
    } finally {
      setDeletingId(null);
    }
  };

  const handleShowQR = (item: InventoryItem) => {
    setSelectedItem(item);
    setQrModalOpen(true);
  };

  const handleAddToCart = (item: InventoryItem) => {
    addItem({
      id: item.id,
      name: item.name,
      price: item.price,
      category: item.category,
      maxQuantity: item.quantity,
    });
    toast.success(`${item.name} added to cart!`);
  };

  if (authLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const lowStockCount = items.filter((i) => i.lowStock).length;
  const outOfStockCount = items.filter((i) => i.quantity === 0).length;
  const totalValue = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">
            <span className="text-gradient">Dashboard</span>
          </h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.name}!{" "}
            {isOwner
              ? "Manage your inventory below."
              : "Browse the inventory below."}
          </p>
        </div>
        {isOwner && (
          <Button onClick={handleAddItem} className="bg-gradient-primary hover:opacity-90">
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="border-border/50 card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <div className="p-2 rounded-lg bg-primary/10">
              <Package className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{items.length}</div>
            <p className="text-xs text-muted-foreground">Products in inventory</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <div className="p-2 rounded-lg bg-yellow-500/10">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {lowStockCount}
            </div>
            <p className="text-xs text-muted-foreground">Need restocking</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <div className="p-2 rounded-lg bg-red-500/10">
              <Package className="h-4 w-4 text-red-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {outOfStockCount}
            </div>
            <p className="text-xs text-muted-foreground">Unavailable items</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <div className="p-2 rounded-lg bg-green-500/10">
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${totalValue.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Inventory worth</p>
          </CardContent>
        </Card>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : items.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No items yet</h3>
            <p className="text-muted-foreground mb-4">
              {isOwner
                ? "Start by adding your first inventory item."
                : "No inventory items available."}
            </p>
            {isOwner && (
              <Button onClick={handleAddItem} className="bg-gradient-primary hover:opacity-90">
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            )}
          </CardContent>
        </Card>
      ) : isOwner ? (
        // Owner: Table View
        <Card className="border-border/50">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => {
                const status = getStockStatus(item);
                return (
                  <TableRow key={item.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-muted/50">{item.category}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">{item.quantity}</TableCell>
                    <TableCell className="text-right font-mono">
                      ${item.price.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.class}`}>
                        {status.label}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleShowQR(item)}
                          title="View QR Code"
                          className="hover:bg-primary/10"
                        >
                          <QrCode className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditItem(item)}
                          title="Edit"
                          className="hover:bg-primary/10"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(item)}
                          disabled={deletingId === item.id}
                          title="Delete"
                          className="hover:bg-destructive/10 hover:text-destructive"
                        >
                          {deletingId === item.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      ) : (
        // Buyer: Grid View with Add to Cart
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => {
            const status = getStockStatus(item);
            const inCart = getItemQuantity(item.id);
            const canAdd = item.quantity > 0 && inCart < item.quantity;

            return (
              <Card key={item.id} className="border-border/50 card-hover overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start gap-2">
                    <CardTitle className="text-lg">{item.name}</CardTitle>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${status.class}`}>
                      {status.label}
                    </span>
                  </div>
                  <Badge variant="outline" className="w-fit bg-muted/50">{item.category}</Badge>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Available:</span>
                      <span className="font-medium font-mono">{item.quantity} units</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground text-sm">Price:</span>
                      <span className="text-xl font-bold text-gradient">${item.price.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-border/50 space-y-2">
                    {inCart > 0 ? (
                      <Button
                        variant="outline"
                        className="w-full border-primary/30"
                        onClick={() => handleAddToCart(item)}
                        disabled={!canAdd}
                      >
                        <Check className="h-4 w-4 mr-2 text-primary" />
                        In Cart ({inCart}) {canAdd && "+ Add More"}
                      </Button>
                    ) : (
                      <Button
                        className="w-full bg-gradient-primary hover:opacity-90"
                        onClick={() => handleAddToCart(item)}
                        disabled={!canAdd}
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        {canAdd ? "Add to Cart" : "Out of Stock"}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      className="w-full hover:bg-primary/10"
                      onClick={() => handleShowQR(item)}
                    >
                      <QrCode className="h-4 w-4 mr-2" />
                      View QR Code
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Dialogs */}
      <ItemDialog
        open={itemDialogOpen}
        onOpenChange={setItemDialogOpen}
        item={selectedItem}
        onSuccess={fetchItems}
      />

      <QRModal
        open={qrModalOpen}
        onOpenChange={setQrModalOpen}
        item={selectedItem}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Item"
        description={`Are you sure you want to delete "${itemToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="destructive"
        isLoading={!!deletingId}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
