"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { PublicItemInfo, getPublicItemByQrToken } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Camera,
  Loader2,
  X,
  Upload,
  ShoppingCart,
  LogIn,
  Check,
  Plus,
  Minus,
} from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";

// Stock status helper
function getStockStatus(item: PublicItemInfo) {
  if (item.quantity === 0) {
    return { label: "Out of Stock", class: "stock-out" };
  }
  if (item.quantity < 10) {
    return { label: "Low Stock", class: "stock-low" };
  }
  return { label: "In Stock", class: "stock-in" };
}

export default function PublicScanPage() {
  const router = useRouter();
  const { isAuthenticated, isOwner } = useAuth();
  const { addItem, getItemQuantity } = useCart();

  const [showScanner, setShowScanner] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedItem, setScannedItem] = useState<PublicItemInfo | null>(null);
  const [isLoadingItem, setIsLoadingItem] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scannerContainerId = "qr-scanner-public";

  // Reset quantity when item changes
  useEffect(() => {
    if (scannedItem) {
      setQuantity(1);
    }
  }, [scannedItem]);

  // Initialize scanner when container is shown
  useEffect(() => {
    if (showScanner && !isScanning && !scannerRef.current) {
      initScanner();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showScanner]);

  useEffect(() => {
    return () => {
      stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initScanner = async () => {
    try {
      const html5QrCode = new Html5Qrcode(scannerContainerId);
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        async (decodedText) => {
          await stopScanner();
          await lookupItem(decodedText);
        },
        () => { }
      );
      setIsScanning(true);
    } catch (err) {
      console.error("Scanner error:", err);
      setShowScanner(false);
      setError(
        "Failed to start camera. Please ensure camera permissions are granted."
      );
      toast.error("Failed to start camera");
    }
  };

  const startScanner = () => {
    setError(null);
    setScannedItem(null);
    setShowScanner(true);
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (err) {
        console.error("Error stopping scanner:", err);
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
    setShowScanner(false);
  };

  const lookupItem = async (qrCode: string) => {
    setIsLoadingItem(true);
    setError(null);

    try {
      const item = await getPublicItemByQrToken(qrCode);
      setScannedItem(item);
      toast.success(`Found: ${item.name}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Item not found for this QR code"
      );
      toast.error("Item not found");
    } finally {
      setIsLoadingItem(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);
    setScannedItem(null);

    try {
      const html5QrCode = new Html5Qrcode("qr-upload-temp");
      const result = await html5QrCode.scanFile(file, true);
      html5QrCode.clear();
      await lookupItem(result);
    } catch (err) {
      console.error("QR scan error:", err);
      setError("Could not read QR code from image. Please try another image.");
      toast.error("Failed to read QR code");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleAddToCart = () => {
    if (!scannedItem) return;

    if (!isAuthenticated) {
      toast.error("Please login to add items to cart");
      router.push("/login");
      return;
    }

    if (isOwner) {
      toast.error("Owners cannot add items to cart");
      return;
    }

    addItem({
      id: scannedItem.id,
      name: scannedItem.name,
      price: scannedItem.price,
      category: scannedItem.category,
      maxQuantity: scannedItem.quantity,
      quantity: quantity,
    });

    toast.success(`${quantity}x ${scannedItem.name} added to cart!`);
  };

  const handleScanAgain = () => {
    setScannedItem(null);
    setError(null);
    setQuantity(1);
  };

  const itemInCart = scannedItem ? getItemQuantity(scannedItem.id) : 0;
  const maxCanAdd = scannedItem ? scannedItem.quantity - itemInCart : 0;

  const incrementQuantity = () => {
    if (quantity < maxCanAdd) {
      setQuantity(q => q + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(q => q - 1);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          <span className="text-gradient">Scan Product</span>
        </h1>
        <p className="text-muted-foreground">
          Use camera or upload an image to view product details
        </p>
      </div>

      {/* Hidden elements for QR processing */}
      <div id="qr-upload-temp" className="hidden" />

      <Card className="border-border/50">
        <CardContent className="pt-6">
          {/* Scanner Container */}
          {showScanner && (
            <div
              id={scannerContainerId}
              style={{ width: "100%", maxWidth: "400px", minHeight: "400px" }}
              className="mx-auto bg-muted rounded-lg overflow-hidden"
            />
          )}

          {/* Scan Controls - when not scanning and no item */}
          {!showScanner && !scannedItem && !isLoadingItem && (
            <div className="flex flex-col items-center py-8">
              <div className="p-4 rounded-2xl bg-primary/10 mb-4">
                <Camera className="h-12 w-12 text-primary" />
              </div>
              <p className="text-muted-foreground mb-6 text-center">
                Scan a QR code to view product price and availability
              </p>

              <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
                <Button onClick={startScanner} size="lg" className="flex-1 bg-gradient-primary hover:opacity-90">
                  <Camera className="h-4 w-4 mr-2" />
                  Use Camera
                </Button>

                <div className="flex-1">
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="qr-upload"
                  />
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full border-primary/30 hover:bg-primary/10"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    Upload Image
                  </Button>
                </div>
              </div>

              {error && (
                <p className="text-destructive text-sm mt-4 text-center">{error}</p>
              )}
            </div>
          )}

          {/* Scanning State */}
          {showScanner && (
            <div className="mt-4 flex justify-center">
              <Button variant="outline" onClick={stopScanner} className="border-primary/30">
                <X className="h-4 w-4 mr-2" />
                Stop Scanner
              </Button>
            </div>
          )}

          {/* Loading Item */}
          {isLoadingItem && (
            <div className="flex flex-col items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Looking up product...</p>
            </div>
          )}

          {/* Scanned Item Display */}
          {scannedItem && (
            <div className="py-6">
              <Card className="border-border/50 overflow-hidden">
                <CardHeader className="bg-muted/30">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl">{scannedItem.name}</CardTitle>
                    {(() => {
                      const status = getStockStatus(scannedItem);
                      return (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.class}`}>
                          {status.label}
                        </span>
                      );
                    })()}
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Category</span>
                      <Badge variant="outline" className="bg-muted/50">{scannedItem.category}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Available</span>
                      <span className="font-semibold font-mono">
                        {scannedItem.quantity} units
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-lg border-t border-border/50 pt-3">
                      <span className="font-medium">Price</span>
                      <span className="font-bold text-2xl text-gradient">
                        ${scannedItem.price.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Add to Cart Section */}
                  <div className="mt-6 pt-4 border-t border-border/50">
                    {!isAuthenticated ? (
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground mb-3">
                          Login to add items to your cart
                        </p>
                        <Link href="/login">
                          <Button className="bg-gradient-primary hover:opacity-90">
                            <LogIn className="h-4 w-4 mr-2" />
                            Login to Purchase
                          </Button>
                        </Link>
                      </div>
                    ) : isOwner ? (
                      <p className="text-sm text-muted-foreground text-center">
                        Owners cannot make purchases
                      </p>
                    ) : !scannedItem.inStock ? (
                      <Button disabled className="w-full">
                        Out of Stock
                      </Button>
                    ) : (
                      <div className="space-y-4">
                        {/* Quantity Selector */}
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Quantity</span>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 border-primary/30"
                              onClick={decrementQuantity}
                              disabled={quantity <= 1}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <Input
                              type="number"
                              value={quantity}
                              onChange={(e) => {
                                const val = parseInt(e.target.value);
                                if (!isNaN(val) && val > 0 && val <= maxCanAdd) {
                                  setQuantity(val);
                                }
                              }}
                              className="w-16 h-8 text-center font-mono [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              min={1}
                              max={maxCanAdd}
                            />
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 border-primary/30"
                              onClick={incrementQuantity}
                              disabled={quantity >= maxCanAdd}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Subtotal */}
                        <div className="flex justify-between items-center py-2 px-3 rounded-lg bg-muted/50">
                          <span className="text-sm text-muted-foreground">Subtotal</span>
                          <span className="font-bold text-lg">
                            ${(scannedItem.price * quantity).toFixed(2)}
                          </span>
                        </div>

                        {itemInCart > 0 && (
                          <p className="text-sm text-muted-foreground text-center">
                            You already have {itemInCart} in cart
                          </p>
                        )}

                        <Button
                          onClick={handleAddToCart}
                          className="w-full bg-gradient-primary hover:opacity-90"
                          disabled={maxCanAdd <= 0}
                        >
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          {maxCanAdd <= 0 ? "Max Quantity Reached" : `Add ${quantity} to Cart`}
                        </Button>

                        {itemInCart > 0 && (
                          <Link href="/cart" className="block">
                            <Button variant="outline" className="w-full border-primary/30">
                              <Check className="h-4 w-4 mr-2 text-primary" />
                              View Cart ({itemInCart} items)
                            </Button>
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-center mt-6">
                <Button variant="outline" onClick={handleScanAgain} className="border-primary/30 hover:bg-primary/10">
                  <Camera className="h-4 w-4 mr-2" />
                  Scan Another
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
