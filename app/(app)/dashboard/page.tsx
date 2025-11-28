'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Package, Laptop, Network, AlertTriangle, Box,
  CheckCircle, Loader2,
} from 'lucide-react';

type Stats = {
  hardware: { total: number; inUse: number; available: number; underRepair: number; retired: number };
  computerAssets: { total: number; laptop: number; desktop: number; server: number };
  networkAssets: { total: number; router: number; switch: number; other: number };
  inventory: { totalItems: number; totalQuantity: number; lowStock: number; outOfStock: number };
};

type DashboardData = {
  stats: Stats;
  warranties: Array<{
    id: string;
    asset_tag: string;
    model: string;
    warranty_expiry: string;
    days_left: number;
  }>;
  daysWindow: number;
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/dashboard?days=60', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          next: { revalidate: 60 }
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const json = await response.json();

        if (!json.success) {
          throw new Error(json.error || 'API returned success: false');
        }

        setData(json.data);
      } catch (err: any) {
        console.error('Dashboard fetch error:', err);
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    }

    fetchDashboard();
  }, []);

  // Default stats when loading or error
  const stats: Stats = data?.stats ?? {
    hardware: { total: 0, inUse: 0, available: 0, underRepair: 0, retired: 0 },
    computerAssets: { total: 0, laptop: 0, desktop: 0, server: 0 },
    networkAssets: { total: 0, router: 0, switch: 0, other: 0 },
    inventory: { totalItems: 0, totalQuantity: 0, lowStock: 0, outOfStock: 0 },
  };

  const warranties = data?.warranties ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">IT Asset Management Overview</p>

        {loading && (
          <div className="mt-3 rounded-md border border-blue-500/20 bg-blue-500/10 p-3 text-blue-700 dark:text-blue-400 text-sm">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading dashboard data...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-3 rounded-md border border-red-500/20 bg-red-500/10 p-3 text-red-700 dark:text-red-400 text-sm">
            <strong>Error:</strong> {error}
            <div className="mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
                className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              >
                Retry
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className={loading ? 'opacity-50' : ''}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Hardware</p>
                <p className="text-2xl font-bold">{stats.hardware.total}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card className={loading ? 'opacity-50' : ''}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Computer Assets</p>
                <p className="text-2xl font-bold">{stats.computerAssets.total}</p>
              </div>
              <Laptop className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card className={loading ? 'opacity-50' : ''}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Network Assets</p>
                <p className="text-2xl font-bold">{stats.networkAssets.total}</p>
              </div>
              <Network className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card className={loading ? 'opacity-50' : ''}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Stock Items</p>
                <p className="text-2xl font-bold">{stats.inventory.totalItems}</p>
              </div>
              <Box className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3 Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hardware Status */}
        <Card className={loading ? 'opacity-50' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-blue-600" />
              <span>Hardware Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { label: 'In Use', color: 'bg-green-500', badge: 'bg-green-500/10 text-green-700 dark:text-green-400', value: stats.hardware.inUse },
                { label: 'Available', color: 'bg-blue-500', badge: 'bg-blue-500/10 text-blue-700 dark:text-blue-400', value: stats.hardware.available },
                { label: 'Under Repair', color: 'bg-yellow-500', badge: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400', value: stats.hardware.underRepair },
                { label: 'Retired', color: 'bg-gray-500', badge: 'bg-gray-500/10 text-gray-700 dark:text-gray-400', value: stats.hardware.retired },
              ].map((row) => (
                <div key={row.label} className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{row.label}</span>
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${row.color}`} />
                    <Badge className={row.badge} variant="outline">{row.value}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Computer Assets Breakdown */}
        <Card className={loading ? 'opacity-50' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Laptop className="h-5 w-5 text-green-600" />
              <span>Computer Assets</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total</span>
                <Badge className="bg-green-500/10 text-green-700 dark:text-green-400" variant="outline">{stats.computerAssets.total}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Laptops</span>
                <Badge className="bg-blue-500/10 text-blue-700 dark:text-blue-400" variant="outline">{stats.computerAssets.laptop}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Desktops</span>
                <Badge className="bg-purple-500/10 text-purple-700 dark:text-purple-400" variant="outline">{stats.computerAssets.desktop}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Servers</span>
                <Badge className="bg-orange-500/10 text-orange-700 dark:text-orange-400" variant="outline">{stats.computerAssets.server}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Network Assets Breakdown */}
        <Card className={loading ? 'opacity-50' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Network className="h-5 w-5 text-purple-600" />
              <span>Network Assets</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total</span>
                <Badge className="bg-purple-500/10 text-purple-700 dark:text-purple-400" variant="outline">{stats.networkAssets.total}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Routers</span>
                <Badge className="bg-blue-500/10 text-blue-700 dark:text-blue-400" variant="outline">{stats.networkAssets.router}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Switches</span>
                <Badge className="bg-green-500/10 text-green-700 dark:text-green-400" variant="outline">{stats.networkAssets.switch}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Others</span>
                <Badge className="bg-gray-500/10 text-gray-700 dark:text-gray-400" variant="outline">{stats.networkAssets.other}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lower Section: Inventory/Stock Status & Warranty Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inventory/Stock Status */}
        <Card className={loading ? 'opacity-50' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Box className="h-5 w-5 text-orange-600" />
              <span>Inventory Stock</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Items</span>
                <Badge className="bg-blue-500/10 text-blue-700 dark:text-blue-400" variant="outline">{stats.inventory.totalItems}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Quantity</span>
                <Badge className="bg-green-500/10 text-green-700 dark:text-green-400" variant="outline">{stats.inventory.totalQuantity}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Low Stock</span>
                <Badge className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400" variant="outline">{stats.inventory.lowStock}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Out of Stock</span>
                <Badge className="bg-red-500/10 text-red-700 dark:text-red-400" variant="outline">{stats.inventory.outOfStock}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Warranty Alerts */}
        <Card className={loading ? 'opacity-50' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <span>Warranty Expiring Soon</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {warranties.length > 0 ? (
              <div className="space-y-3">
                {warranties.slice(0, 3).map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-orange-500/10 rounded-lg border border-orange-500/20">
                    <div>
                      <p className="font-medium text-sm">{item.model}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.asset_tag} • Expires: {item.warranty_expiry}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-orange-700 dark:text-orange-400 border-orange-500/30">
                      {item.days_left} days
                    </Badge>
                  </div>
                ))}
                {warranties.length > 3 && (
                  <div className="text-center pt-2">
                    <Button variant="ghost" size="sm" className="text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300">
                      View all {warranties.length} expiring warranties
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No warranties expiring soon</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}