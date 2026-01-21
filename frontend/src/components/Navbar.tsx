"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, QrCode, LogOut, ShoppingCart, Receipt, LayoutDashboard } from "lucide-react";

export function Navbar() {
  const { user, isAuthenticated, isOwner, logout } = useAuth();
  const { itemCount } = useCart();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo / App Name */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="p-2 rounded-lg bg-gradient-primary group-hover:scale-105 transition-transform">
              <Package className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-xl text-gradient">InventoryPro</span>
          </Link>

          {/* Navigation Links & User Info */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Public Scan Link - Always visible */}
            <Link href="/scan">
              <Button variant="ghost" size="sm" className="hover:bg-primary/10">
                <QrCode className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Scan</span>
              </Button>
            </Link>

            {isAuthenticated ? (
              <>
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm" className="hover:bg-primary/10">
                    <LayoutDashboard className="h-4 w-4 sm:mr-1" />
                    <span className="hidden sm:inline">Dashboard</span>
                  </Button>
                </Link>

                {/* Orders - visible to both owner and buyer */}
                <Link href="/orders">
                  <Button variant="ghost" size="sm" className="hover:bg-primary/10">
                    <Receipt className="h-4 w-4 sm:mr-1" />
                    <span className="hidden sm:inline">{isOwner ? "Sales" : "Orders"}</span>
                  </Button>
                </Link>

                {/* Cart - only for buyers */}
                {!isOwner && (
                  <Link href="/cart">
                    <Button variant="ghost" size="sm" className="relative hover:bg-primary/10">
                      <ShoppingCart className="h-4 w-4" />
                      {itemCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-gradient-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium animate-pulse">
                          {itemCount > 99 ? "99+" : itemCount}
                        </span>
                      )}
                    </Button>
                  </Link>
                )}

                <div className="flex items-center gap-2 border-l border-border/50 pl-2 sm:pl-3 ml-1 sm:ml-2">
                  <span className="text-sm text-muted-foreground hidden sm:inline">
                    {user?.name}
                  </span>
                  <Badge
                    variant={isOwner ? "default" : "secondary"}
                    className={isOwner ? "bg-gradient-primary" : ""}
                  >
                    {user?.role}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={logout}
                  className="hover:bg-destructive/10 hover:text-destructive"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="hover:bg-primary/10">
                    Login
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm" className="bg-gradient-primary hover:opacity-90 transition-opacity">
                    Register
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
