'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Package, Users, Shield, AlertTriangle, Activity,
  CheckCircle, Clock, RefreshCw, Loader2,
} from 'lucide-react';

type Stats = {
  hardware: { total: number; inUse: number; available: number; underRepair: number; retired: number };
  software: { total: number; totalLicenses: number; assignedLicenses: number; availableLicenses: number };
  users: { total: number; active: number; inactive: number };
  borrowing: { checkedOut: number; overdue: number };
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
        
        console.log('Fetching dashboard data from client...');
        
        // ใน Client-Side ใช้ relative URL ได้เลย
        const response = await fetch('/api/dashboard?days=60', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          next: { revalidate: 60 }
         
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Response error:', errorText);
          throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
        }

        const json = await response.json();
        console.log('Response data:', json);
        
        if (!json.success) {
          throw new Error(json.error || 'API returned success: false');
        }

        console.log('Dashboard data loaded successfully');
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
    software: { total: 0, totalLicenses: 0, assignedLicenses: 0, availableLicenses: 0 },
    users: { total: 0, active: 0, inactive: 0 },
    borrowing: { checkedOut: 0, overdue: 0 },
  };
  
  const warranties = data?.warranties ?? [];
  const utilization =
    stats.software.totalLicenses > 0
      ? Math.round((stats.software.assignedLicenses / stats.software.totalLicenses) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">IT Asset Management Overview</p>
        
        {loading && (
          <div className="mt-3 rounded-md border border-blue-300 bg-blue-50 p-3 text-blue-700 text-sm">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading dashboard data...</span>
            </div>
          </div>
        )}
        
        {error && (
          <div className="mt-3 rounded-md border border-red-300 bg-red-50 p-3 text-red-700 text-sm">
            <strong>Error:</strong> {error}
            <div className="mt-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.location.reload()}
                className="text-red-600 hover:text-red-700"
              >
                Retry
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className={loading ? 'opacity-50' : ''}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Hardware</p>
                <p className="text-xl font-bold">{stats.hardware.total}</p>
              </div>
              <Package className="h-6 w-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card className={loading ? 'opacity-50' : ''}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Software Licenses</p>
                <p className="text-xl font-bold">{stats.software.totalLicenses}</p>
              </div>
              <Shield className="h-6 w-6 text-green-600" />
            </div>
          </CardContent>
        </Card>
        {/* <Card className={loading ? 'opacity-50' : ''}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Users</p>
                <p className="text-xl font-bold">{stats.users.active}</p>
              </div>
              <Users className="h-6 w-6 text-purple-600" />
            </div>
          </CardContent>
        </Card> */}
        <Card className={loading ? 'opacity-50' : ''}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Items on Loan</p>
                <p className="text-xl font-bold">{stats.borrowing.checkedOut}</p>
              </div>
              <Activity className="h-6 w-6 text-orange-600" />
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
                { label: 'In Use', color: 'bg-green-500', badge: 'bg-green-100 text-green-800', value: stats.hardware.inUse },
                { label: 'Available', color: 'bg-blue-500', badge: 'bg-blue-100 text-blue-800', value: stats.hardware.available },
                { label: 'Under Repair', color: 'bg-yellow-500', badge: 'bg-yellow-100 text-yellow-800', value: stats.hardware.underRepair },
                { label: 'Retired', color: 'bg-gray-500', badge: 'bg-gray-100 text-gray-800', value: stats.hardware.retired },
              ].map((row) => (
                <div key={row.label} className="flex justify-between items-center">
                  <span className="text-sm">{row.label}</span>
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${row.color}`} />
                    <Badge className={row.badge}>{row.value}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Software Licenses */}
        <Card className={loading ? 'opacity-50' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-green-600" />
              <span>Software Licenses</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Total Licenses</span>
                <Badge className="bg-blue-100 text-blue-800">{stats.software.totalLicenses}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Assigned</span>
                <Badge className="bg-green-100 text-green-800">{stats.software.assignedLicenses}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Available</span>
                <Badge className="bg-orange-100 text-orange-800">{stats.software.availableLicenses}</Badge>
              </div>
              <div className="mt-4 pt-3 border-t">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Utilization</span>
                  <span>{utilization}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${utilization}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Borrowing Status */}
        <Card className={loading ? 'opacity-50' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-orange-600" />
              <span>Borrowing Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Checked Out</span>
                <Badge className="bg-orange-100 text-orange-800">{stats.borrowing.checkedOut}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Overdue</span>
                <Badge className="bg-red-100 text-red-800">{stats.borrowing.overdue}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Available to Borrow</span>
                <Badge className="bg-blue-100 text-blue-800">{stats.hardware.available}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Patch Management & Warranty Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className={loading ? 'opacity-50' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <RefreshCw className="h-5 w-5 text-purple-600" />
              <span>Patch Management</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full" />
                  <div>
                    <p className="font-medium text-green-900">Up-to-Date</p>
                    <p className="text-sm text-green-700">Systems current</p>
                  </div>
                </div>
                <Badge className="bg-green-100 text-green-800">—</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                  <div>
                    <p className="font-medium text-yellow-900">Needs Review</p>
                    <p className="text-sm text-yellow-700">Manual check required</p>
                  </div>
                </div>
                <Badge className="bg-yellow-100 text-yellow-800">—</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full" />
                  <div>
                    <p className="font-medium text-red-900">Update Pending</p>
                    <p className="text-sm text-red-700">Action required</p>
                  </div>
                </div>
                <Badge className="bg-red-100 text-red-800">—</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

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
                  <div key={item.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <div>
                      <p className="font-medium text-sm">{item.model}</p>
                      <p className="text-xs text-gray-600">
                        {item.asset_tag} • Expires: {item.warranty_expiry}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-orange-700 border-orange-300">
                      {item.days_left} days
                    </Badge>
                  </div>
                ))}
                {warranties.length > 3 && (
                  <div className="text-center pt-2">
                    <Button variant="ghost" size="sm" className="text-orange-600 hover:text-orange-700">
                      View all {warranties.length} expiring warranties
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No warranties expiring soon</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      
    </div>
  );
}