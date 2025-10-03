'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Download, 
  Calendar, 
  FileText, 
  BarChart3, 
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Users,
  Shield,
  AlertTriangle,
  Clock,
  Eye,
  Filter,
  RefreshCw
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import { 
  hardwareService, 
  softwareService, 
  userService, 
  getAssetStats, 
  getSoftwareStats,
  getUserStats 
} from '@/lib/data-store';

const assetTypeData = [
  { name: 'Laptops', value: 45, color: '#3b82f6' },
  { name: 'Desktops', value: 32, color: '#10b981' },
  { name: 'Monitors', value: 28, color: '#f59e0b' },
  { name: 'Printers', value: 12, color: '#ef4444' },
  { name: 'Phones', value: 18, color: '#8b5cf6' },
  { name: 'Network', value: 8, color: '#06b6d4' },
];

const departmentData = [
  { department: 'Engineering', assets: 42, cost: 125000 },
  { department: 'Marketing', assets: 28, cost: 85000 },
  { department: 'Sales', assets: 35, cost: 95000 },
  { department: 'IT', assets: 15, cost: 65000 },
  { department: 'HR', assets: 12, cost: 35000 },
  { department: 'Finance', assets: 18, cost: 55000 },
];

const monthlyTrends = [
  { month: 'Jul', assets: 145, cost: 420000, utilization: 85 },
  { month: 'Aug', assets: 152, cost: 435000, utilization: 88 },
  { month: 'Sep', assets: 148, cost: 428000, utilization: 82 },
  { month: 'Oct', assets: 156, cost: 445000, utilization: 91 },
  { month: 'Nov', assets: 163, cost: 465000, utilization: 89 },
  { month: 'Dec', assets: 170, cost: 485000, utilization: 93 },
];

const softwareCategoryData = [
  { category: 'Productivity', licenses: 150, cost: 45000 },
  { category: 'Development', licenses: 85, cost: 65000 },
  { category: 'Design', licenses: 42, cost: 35000 },
  { category: 'Security', licenses: 200, cost: 25000 },
  { category: 'Communication', licenses: 180, cost: 15000 },
];

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState('last-6-months');
  const [reportType, setReportType] = useState('overview');
  const [stats, setStats] = useState({
    hardware: { total: 0, inUse: 0, available: 0, underRepair: 0, retired: 0 },
    software: { total: 0, totalLicenses: 0, assignedLicenses: 0, availableLicenses: 0 },
    users: { total: 0, active: 0, inactive: 0 }
  });

  useEffect(() => {
    setStats({
      hardware: getAssetStats(),
      software: getSoftwareStats(),
      users: getUserStats()
    });
  }, []);

  const totalAssetValue = departmentData.reduce((sum, dept) => sum + dept.cost, 0);
  const utilizationRate = Math.round((stats.hardware.inUse / stats.hardware.total) * 100) || 0;
  const licenseUtilization = Math.round((stats.software.assignedLicenses / stats.software.totalLicenses) * 100) || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
          <p className="text-gray-600">Comprehensive insights into your IT asset portfolio</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Data
          </Button>
          <Button size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Report Controls */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="report-type">Report Type</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="overview">Asset Overview</SelectItem>
                  <SelectItem value="utilization">Utilization Analysis</SelectItem>
                  <SelectItem value="financial">Financial Report</SelectItem>
                  <SelectItem value="compliance">Compliance Report</SelectItem>
                  <SelectItem value="lifecycle">Lifecycle Analysis</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label htmlFor="date-range">Date Range</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="last-30-days">Last 30 Days</SelectItem>
                  <SelectItem value="last-3-months">Last 3 Months</SelectItem>
                  <SelectItem value="last-6-months">Last 6 Months</SelectItem>
                  <SelectItem value="last-year">Last Year</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Apply Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Asset Value</p>
                <p className="text-2xl font-bold">${(totalAssetValue / 1000).toFixed(0)}K</p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                  <span className="text-xs text-green-600">+12% YoY</span>
                </div>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Asset Utilization</p>
                <p className="text-2xl font-bold">{utilizationRate}%</p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 text-blue-600 mr-1" />
                  <span className="text-xs text-blue-600">+5% vs last month</span>
                </div>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">License Utilization</p>
                <p className="text-2xl font-bold">{licenseUtilization}%</p>
                <div className="flex items-center mt-1">
                  <TrendingDown className="h-3 w-3 text-orange-600 mr-1" />
                  <span className="text-xs text-orange-600">-2% vs last month</span>
                </div>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Shield className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Compliance Score</p>
                <p className="text-2xl font-bold">94%</p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                  <span className="text-xs text-green-600">Excellent</span>
                </div>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Asset Distribution by Type */}
        <Card>
          <CardHeader>
            <CardTitle>Asset Distribution by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={assetTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {assetTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} assets`, 'Count']} />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {assetTypeData.map((item, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span className="text-sm text-gray-600">{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Department Asset Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Assets by Department</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={departmentData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="department" />
                <YAxis />
                <Tooltip formatter={(value, name) => [value, name === 'assets' ? 'Assets' : 'Cost ($)']} />
                <Bar dataKey="assets" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Asset Value Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Asset Value Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Total Value']} />
                <Area 
                  type="monotone" 
                  dataKey="cost" 
                  stroke="#10b981" 
                  fill="#10b981" 
                  fillOpacity={0.1} 
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Utilization Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Asset Utilization Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value}%`, 'Utilization']} />
                <Line 
                  type="monotone" 
                  dataKey="utilization" 
                  stroke="#8b5cf6" 
                  strokeWidth={3}
                  dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Software License Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Software License Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {softwareCategoryData.map((category, index) => {
              const utilizationPercent = Math.round((category.licenses * 0.7 / category.licenses) * 100);
              return (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{category.category}</h4>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-600">{category.licenses} licenses</span>
                        <span className="text-sm font-medium">${category.cost.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${utilizationPercent}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-gray-500">{utilizationPercent}% utilized</span>
                      <span className="text-xs text-gray-500">{category.licenses - Math.round(category.licenses * 0.7)} available</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Asset Health & Compliance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <span>Asset Health Overview</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div>
                    <p className="font-medium text-red-900">Critical Issues</p>
                    <p className="text-sm text-red-700">Assets requiring immediate attention</p>
                  </div>
                </div>
                <Badge className="bg-red-100 text-red-800">3</Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div>
                    <p className="font-medium text-yellow-900">Warranty Expiring</p>
                    <p className="text-sm text-yellow-700">Within next 30 days</p>
                  </div>
                </div>
                <Badge className="bg-yellow-100 text-yellow-800">7</Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <div>
                    <p className="font-medium text-blue-900">Patch Updates Needed</p>
                    <p className="text-sm text-blue-700">Security updates pending</p>
                  </div>
                </div>
                <Badge className="bg-blue-100 text-blue-800">12</Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="font-medium text-green-900">Healthy Assets</p>
                    <p className="text-sm text-green-700">No issues detected</p>
                  </div>
                </div>
                <Badge className="bg-green-100 text-green-800">{stats.hardware.total - 22}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 border-l-4 border-blue-500 bg-blue-50">
                <h4 className="font-medium text-blue-900">High Utilization</h4>
                <p className="text-sm text-blue-700 mt-1">Engineering department has 95% asset utilization - consider expanding inventory</p>
              </div>

              <div className="p-4 border-l-4 border-green-500 bg-green-50">
                <h4 className="font-medium text-green-900">Cost Optimization</h4>
                <p className="text-sm text-green-700 mt-1">15 unused software licenses detected - potential savings of $8,400/year</p>
              </div>

              <div className="p-4 border-l-4 border-orange-500 bg-orange-50">
                <h4 className="font-medium text-orange-900">Lifecycle Planning</h4>
                <p className="text-sm text-orange-700 mt-1">28 assets approaching end-of-life in next 6 months</p>
              </div>

              <div className="p-4 border-l-4 border-purple-500 bg-purple-50">
                <h4 className="font-medium text-purple-900">Security Focus</h4>
                <p className="text-sm text-purple-700 mt-1">12 assets need security patches - schedule maintenance window</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle>Available Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              {
                name: 'Asset Inventory Report',
                description: 'Complete list of all hardware and software assets with current status',
                type: 'Inventory',
                lastGenerated: '2024-01-15',
                size: '2.4 MB',
                status: 'Ready'
              },
              {
                name: 'Utilization Analysis',
                description: 'Asset usage patterns and optimization opportunities',
                type: 'Analytics',
                lastGenerated: '2024-01-14',
                size: '1.8 MB',
                status: 'Ready'
              },
              {
                name: 'Cost Analysis Report',
                description: 'Total cost of ownership and budget planning insights',
                type: 'Financial',
                lastGenerated: '2024-01-12',
                size: '3.1 MB',
                status: 'Ready'
              },
              {
                name: 'Compliance Audit',
                description: 'License compliance and warranty status overview',
                type: 'Compliance',
                lastGenerated: '2024-01-10',
                size: '1.2 MB',
                status: 'Generating'
              },
              {
                name: 'Security Assessment',
                description: 'Patch status and vulnerability assessment',
                type: 'Security',
                lastGenerated: '2024-01-08',
                size: '2.7 MB',
                status: 'Ready'
              },
              {
                name: 'Lifecycle Planning',
                description: 'Asset age analysis and replacement timeline',
                type: 'Planning',
                lastGenerated: '2024-01-05',
                size: '1.9 MB',
                status: 'Ready'
              }
            ].map((report, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="font-medium">{report.name}</h3>
                    <Badge variant="outline">{report.type}</Badge>
                    <Badge className={
                      report.status === 'Ready' ? 'bg-green-100 text-green-800' : 
                      report.status === 'Generating' ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-gray-100 text-gray-800'
                    }>
                      {report.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{report.description}</p>
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {report.lastGenerated}
                    </span>
                    <span className="flex items-center">
                      <FileText className="h-3 w-3 mr-1" />
                      {report.size}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" disabled={report.status !== 'Ready'}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Export Options */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Export Options</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <Package className="h-6 w-6 text-blue-600" />
              <span className="font-medium">Hardware Assets</span>
              <span className="text-xs text-gray-500">Export all hardware inventory</span>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <Shield className="h-6 w-6 text-green-600" />
              <span className="font-medium">Software Licenses</span>
              <span className="text-xs text-gray-500">Export license inventory</span>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <Users className="h-6 w-6 text-purple-600" />
              <span className="font-medium">User Directory</span>
              <span className="text-xs text-gray-500">Export user assignments</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}