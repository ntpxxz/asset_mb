'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  Users, 
  Shield,
  AlertTriangle,
  Activity,
  Plus,
  FileText,
  Download,
  Upload,
  Settings,
  RefreshCw,
  CheckCircle,
  Clock,
  RotateCcw
} from 'lucide-react';
import { AddAssetForm } from '@/components/forms/add-asset-form';
import { AddUserForm } from '@/components/forms/add-user-form';
import { AddSoftwareForm } from '@/components/forms/add-software-form';
import { 
  hardwareService, 
  softwareService, 
  userService, 
  borrowService,
  getAssetStats,
  getSoftwareStats,
  getUserStats,
  getUpcomingWarranties
} from '@/lib/data-store';

export default function Dashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({
    hardware: { total: 0, inUse: 0, available: 0, underRepair: 0, retired: 0 },
    software: { total: 0, totalLicenses: 0, assignedLicenses: 0, availableLicenses: 0 },
    users: { total: 0, active: 0, inactive: 0 },
    borrowing: { checkedOut: 0, overdue: 0 }
  });
  const [upcomingWarranties, setUpcomingWarranties] = useState<any[]>([]);

  useEffect(() => {
    // Load real-time stats
    setStats({
      hardware: getAssetStats(),
      software: getSoftwareStats(),
      users: getUserStats(),
      borrowing: {
        checkedOut: borrowService.getCheckedOut().length,
        overdue: borrowService.getOverdue().length
      }
    });
    setUpcomingWarranties(getUpcomingWarranties());
  }, []);

  const refreshStats = () => {
    setStats({
      hardware: getAssetStats(),
      software: getSoftwareStats(),
      users: getUserStats(),
      borrowing: {
        checkedOut: borrowService.getCheckedOut().length,
        overdue: borrowService.getOverdue().length
      }
    });
    setUpcomingWarranties(getUpcomingWarranties());
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">IT Asset Management Overview</p>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
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
        <Card>
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
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Users</p>
                <p className="text-xl font-bold">{stats.users.active}</p>
              </div>
              <Users className="h-6 w-6 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
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

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Plus className="h-5 w-5" />
            <span>Quick Actions</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Primary Actions */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Add New</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Button
                  onClick={() => router.push('/assets/add')}
                  className="h-20 flex flex-col space-y-2 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Package className="h-6 w-6" />
                  <div className="text-center">
                    <div className="font-medium">Hardware Asset</div>
                    <div className="text-xs opacity-90">Add laptops, desktops, etc.</div>
                  </div>
                </Button>
                <Button
                  onClick={() => router.push('/software/add')}
                  className="h-20 flex flex-col space-y-2 bg-green-600 hover:bg-green-700 text-white"
                >
                  <Shield className="h-6 w-6" />
                  <div className="text-center">
                    <div className="font-medium">Software License</div>
                    <div className="text-xs opacity-90">Track licenses & usage</div>
                  </div>
                </Button>
                <Button
                  onClick={() => router.push('/users/add')}
                  className="h-20 flex flex-col space-y-2 bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Users className="h-6 w-6" />
                  <div className="text-center">
                    <div className="font-medium">User Account</div>
                    <div className="text-xs opacity-90">Add team members</div>
                  </div>
                </Button>
              </div>
            </div>

            {/* Secondary Actions */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Asset Operations</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Button
                  variant="outline"
                  className="h-16 flex flex-col space-y-1 hover:bg-orange-50 hover:border-orange-300"
                >
                  <Activity className="h-5 w-5 text-orange-600" />
                  <span className="text-xs font-medium">Check Out</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-16 flex flex-col space-y-1 hover:bg-teal-50 hover:border-teal-300"
                >
                  <RotateCcw className="h-5 w-5 text-teal-600" />
                  <span className="text-xs font-medium">Check In</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-16 flex flex-col space-y-1 hover:bg-indigo-50 hover:border-indigo-300"
                >
                  <FileText className="h-5 w-5 text-indigo-600" />
                  <span className="text-xs font-medium">Generate Report</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-16 flex flex-col space-y-1 hover:bg-gray-50 hover:border-gray-300"
                >
                  <Settings className="h-5 w-5 text-gray-600" />
                  <span className="text-xs font-medium">Settings</span>
                </Button>
              </div>
            </div>

            {/* Data Management */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Data Management</h3>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="h-14 flex items-center justify-center space-x-2 hover:bg-emerald-50 hover:border-emerald-300"
                >
                  <Upload className="h-4 w-4 text-emerald-600" />
                  <div className="text-left">
                    <div className="text-sm font-medium">Import CSV</div>
                    <div className="text-xs text-gray-500">Bulk add assets</div>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="h-14 flex items-center justify-center space-x-2 hover:bg-cyan-50 hover:border-cyan-300"
                >
                  <Download className="h-4 w-4 text-cyan-600" />
                  <div className="text-left">
                    <div className="text-sm font-medium">Export Data</div>
                    <div className="text-xs text-gray-500">Download reports</div>
                  </div>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hardware Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-blue-600" />
              <span>Hardware Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">In Use</span>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <Badge className="bg-green-100 text-green-800">{stats.hardware.inUse}</Badge>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Available</span>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <Badge className="bg-blue-100 text-blue-800">{stats.hardware.available}</Badge>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Under Repair</span>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <Badge className="bg-yellow-100 text-yellow-800">{stats.hardware.underRepair}</Badge>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Retired</span>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                  <Badge className="bg-gray-100 text-gray-800">{stats.hardware.retired}</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Software Licenses */}
        <Card>
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
                  <span>{Math.round((stats.software.assignedLicenses / stats.software.totalLicenses) * 100) || 0}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                  <div 
                    className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${Math.round((stats.software.assignedLicenses / stats.software.totalLicenses) * 100) || 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Borrowing Status */}
        <Card>
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
        <Card>
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
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="font-medium text-green-900">Up-to-Date</p>
                    <p className="text-sm text-green-700">Systems current</p>
                  </div>
                </div>
                <Badge className="bg-green-100 text-green-800">12</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div>
                    <p className="font-medium text-yellow-900">Needs Review</p>
                    <p className="text-sm text-yellow-700">Manual check required</p>
                  </div>
                </div>
                <Badge className="bg-yellow-100 text-yellow-800">3</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div>
                    <p className="font-medium text-red-900">Update Pending</p>
                    <p className="text-sm text-red-700">Action required</p>
                  </div>
                </div>
                <Badge className="bg-red-100 text-red-800">2</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <span>Warranty Expiring Soon</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingWarranties.length > 0 ? (
              <div className="space-y-3">
                {upcomingWarranties.slice(0, 3).map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <div>
                      <p className="font-medium text-sm">{item.model}</p>
                      <p className="text-xs text-gray-600">{item.assetTag} • Expires: {item.warrantyExpiry}</p>
                    </div>
                    <Badge variant="outline" className="text-orange-700 border-orange-300">
                      {item.daysLeft} days
                    </Badge>
                  </div>
                ))}
                {upcomingWarranties.length > 3 && (
                  <div className="text-center pt-2">
                    <Button variant="ghost" size="sm" className="text-orange-600 hover:text-orange-700">
                      View all {upcomingWarranties.length} expiring warranties
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

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-gray-600" />
            <span>Recent Activity</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Button
              variant="ghost"
              className="w-full justify-start h-auto p-3 hover:bg-gray-50"
            >
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium">MacBook Pro added to inventory</p>
                  <p className="text-xs text-gray-500">2 hours ago • Engineering Department</p>
                </div>
              </div>
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start h-auto p-3 hover:bg-gray-50"
            >
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium">User John Smith created</p>
                  <p className="text-xs text-gray-500">4 hours ago • HR Department</p>
                </div>
              </div>
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start h-auto p-3 hover:bg-gray-50"
            >
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium">iPad Pro checked out</p>
                  <p className="text-xs text-gray-500">1 day ago • Sarah Johnson</p>
                </div>
              </div>
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start h-auto p-3 hover:bg-gray-50"
            >
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium">Office 365 license updated</p>
                  <p className="text-xs text-gray-500">2 days ago • IT Department</p>
                </div>
              </div>
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start h-auto p-3 hover:bg-gray-50"
            >
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium">Dell OptiPlex returned</p>
                  <p className="text-xs text-gray-500">3 days ago • Mike Wilson</p>
                </div>
              </div>
            </Button>
            <div className="text-center pt-3 border-t">
              <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
                View all activity
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}