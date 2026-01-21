"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { InventoryItem, getQrImage } from "@/lib/api";
import { toast } from "sonner";
import { Download, Loader2 } from "lucide-react";

interface QRModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: InventoryItem | null;
}

export function QRModal({ open, onOpenChange, item }: QRModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [qrData, setQrData] = useState<{
    qrCode: string;
    qrImage: string;
  } | null>(null);

  useEffect(() => {
    if (open && item) {
      fetchQrCode();
    } else {
      setQrData(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, item]);

  const fetchQrCode = async () => {
    if (!item) return;

    setIsLoading(true);
    try {
      const data = await getQrImage(item.id);
      setQrData(data);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to load QR code"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!qrData || !item) return;

    // Create download link
    const link = document.createElement("a");
    link.href = qrData.qrImage;
    link.download = `qr-${item.name.replace(/\s+/g, "-").toLowerCase()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("QR code downloaded");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>QR Code</DialogTitle>
          <DialogDescription>
            {item?.name} - Scan or download this QR code
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center py-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : qrData ? (
            <>
              <img
                src={qrData.qrImage}
                alt={`QR Code for ${item?.name}`}
                className="w-64 h-64 border rounded-lg"
              />
              <p className="mt-4 text-sm text-muted-foreground font-mono">
                {qrData.qrCode}
              </p>
            </>
          ) : (
            <p className="text-muted-foreground">Failed to load QR code</p>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
          <Button
            type="button"
            onClick={handleDownload}
            disabled={!qrData || isLoading}
          >
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
