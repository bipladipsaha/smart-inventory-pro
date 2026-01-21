"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Package, QrCode, Shield, Users, ArrowRight, Sparkles } from "lucide-react";

export default function HomePage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden bg-gradient-hero">
        {/* Decorative Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-float" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-float" style={{ animationDelay: "-3s" }} />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Sparkles className="h-4 w-4" />
            Smart Inventory Management
          </div>

          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            <span className="text-gradient">Inventory Pro</span>
            <br />
            <span className="text-foreground/80">Made Simple</span>
          </h1>

          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Track, manage, and organize your inventory with QR code scanning.
            Built for owners and buyers with role-based access control.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            {isAuthenticated ? (
              <Link href="/dashboard">
                <Button size="lg" className="bg-gradient-primary hover:opacity-90 transition-opacity glow-primary">
                  Go to Dashboard
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/register">
                  <Button size="lg" className="bg-gradient-primary hover:opacity-90 transition-opacity glow-primary">
                    Get Started
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline" className="border-primary/30 hover:bg-primary/10">
                    Login
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Quick Scan CTA */}
          <div className="mt-8 pt-8 border-t border-border/50">
            <p className="text-sm text-muted-foreground mb-3">
              Have a product QR code? Scan it now without logging in
            </p>
            <Link href="/scan">
              <Button variant="ghost" size="sm" className="hover:bg-primary/10">
                <QrCode className="h-4 w-4 mr-2" />
                Quick Scan
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-background">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              <span className="text-gradient">Powerful Features</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Everything you need to manage your inventory efficiently
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="group card-hover border-border/50 bg-card/50">
              <CardContent className="pt-6">
                <div className="p-3 rounded-lg bg-primary/10 w-fit mb-4 group-hover:bg-primary/20 transition-colors">
                  <Package className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  Inventory Tracking
                </h3>
                <p className="text-muted-foreground">
                  Complete CRUD operations with real-time stock updates and low
                  stock alerts.
                </p>
              </CardContent>
            </Card>

            <Card className="group card-hover border-border/50 bg-card/50">
              <CardContent className="pt-6">
                <div className="p-3 rounded-lg bg-primary/10 w-fit mb-4 group-hover:bg-primary/20 transition-colors">
                  <QrCode className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">QR Code Scanning</h3>
                <p className="text-muted-foreground">
                  Generate and scan QR codes using your device camera for quick
                  product lookup.
                </p>
              </CardContent>
            </Card>

            <Card className="group card-hover border-border/50 bg-card/50">
              <CardContent className="pt-6">
                <div className="p-3 rounded-lg bg-primary/10 w-fit mb-4 group-hover:bg-primary/20 transition-colors">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Secure Auth</h3>
                <p className="text-muted-foreground">
                  JWT-based authentication with bcrypt password hashing for
                  maximum security.
                </p>
              </CardContent>
            </Card>

            <Card className="group card-hover border-border/50 bg-card/50">
              <CardContent className="pt-6">
                <div className="p-3 rounded-lg bg-primary/10 w-fit mb-4 group-hover:bg-primary/20 transition-colors">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Role-Based Access</h3>
                <p className="text-muted-foreground">
                  Owner and Buyer roles with appropriate permissions for each
                  user type.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border/50 bg-muted/30">
        <div className="max-w-6xl mx-auto text-center text-muted-foreground">
          <p>&copy; 2026 InventoryPro. Smart Inventory Management System.</p>
        </div>
      </footer>
    </div>
  );
}
