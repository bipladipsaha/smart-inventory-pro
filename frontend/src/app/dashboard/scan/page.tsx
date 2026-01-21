"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { InventoryItem, getItemByQrCode } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Camera, Loader2, X, Package } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";

export default function ScanPage() {
  const router = useRouter();
  const { isLoading: authLoading, isAuthenticated } = useAuth();

  const [showScanner, setShowScanner] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedItem, setScannedItem] = useState<InventoryItem | null>(null);
  const [isLoadingItem, setIsLoadingItem] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = "qr-scanner";

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  // Initialize scanner when container is shown
  useEffect(() => {
    if (showScanner && !isScanning && !scannerRef.current) {
      initScanner();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showScanner]);

  useEffect(() => {
    // Cleanup scanner on unmount
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
          // QR code found, stop scanning and look up the item
          await stopScanner();
          await lookupItem(decodedText);
        },
        () => {
          // QR code scanning in progress - do nothing
        }
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
      const item = await getItemByQrCode(qrCode);
      setScannedItem(item);
      toast.success(`Found: ${item.name}`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Item not found for this QR code"
      );
      toast.error("Item not found");
    } finally {
      setIsLoadingItem(false);
    }
  };

  const handleScanAgain = () => {
    setScannedItem(null);
    setError(null);
    startScanner();
  };

  if (authLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Scan QR Code</h1>
        <p className="text-muted-foreground">
          Use your camera to scan a product QR code
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          {/* Scanner Container */}
          {showScanner && (
            <div
              id={scannerContainerId}
              style={{ width: "100%", maxWidth: "400px", minHeight: "400px" }}
              className="mx-auto bg-gray-100 rounded-lg overflow-hidden"
            />
          )}

          {/* Start Button (when not scanning) */}
          {!showScanner && !scannedItem && !isLoadingItem && (
            <div className="flex flex-col items-center py-12">
              <Camera className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-6">
                Click the button below to start scanning
              </p>
              <Button onClick={startScanner} size="lg">
                <Camera className="h-4 w-4 mr-2" />
                Start Scanner
              </Button>
              {error && (
                <p className="text-red-500 text-sm mt-4 text-center">{error}</p>
              )}
            </div>
          )}

          {/* Scanning State */}
          {showScanner && (
            <div className="mt-4 flex justify-center">
              <Button variant="outline" onClick={stopScanner}>
                <X className="h-4 w-4 mr-2" />
                Stop Scanner
              </Button>
            </div>
          )}

          {/* Loading Item */}
          {isLoadingItem && (
            <div className="flex flex-col items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mb-4" />
              <p className="text-muted-foreground">Looking up item...</p>
            </div>
          )}

          {/* Error State */}
          {error && !showScanner && !isLoadingItem && !scannedItem && (
            <div className="text-center py-4">
              <p className="text-red-500 mb-4">{error}</p>
              <Button onClick={handleScanAgain}>Try Again</Button>
            </div>
          )}

          {/* Scanned Item Display */}
          {scannedItem && (
            <div className="py-6">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl">{scannedItem.name}</CardTitle>
                    {scannedItem.lowStock && (
                      <Badge variant="destructive">Low Stock</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Category</span>
                      <Badge variant="outline">{scannedItem.category}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Quantity</span>
                      <span className="font-semibold">
                        {scannedItem.quantity} units
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Price</span>
                      <span className="font-semibold text-lg">
                        ${scannedItem.price.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="text-muted-foreground">QR Code</span>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {scannedItem.qrCode}
                      </code>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <div className="flex gap-4 mt-6 justify-center">
                <Button onClick={handleScanAgain}>
                  <Camera className="h-4 w-4 mr-2" />
                  Scan Another
                </Button>
                <Button variant="outline" onClick={() => router.push("/dashboard")}>
                  <Package className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
