'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Filter, 
  Download, 
  Edit, 
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { hardwareService, userService, HardwareAsset } from '@/lib/data-store';

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'up-to-date':
      return <Badge className="bg-green-100 text-green-800">Up-to-Date</Badge>;
    case 'needs-review':
      return <Badge className="bg-yellow-100 text-yellow-800">Needs Review</Badge>;
    case 'update-pending':
      return <Badge className="bg-red-100 text-red-800">Update Pending</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

const getVulnerabilityBadge = (count: number) => {
  if (count === 0) {
    return <Badge className="bg-green-100 text-green-800">None</Badge>;
  } else if (count <= 3) {
    return <Badge className="bg-yellow-100 text-yellow-800">{count} Low</Badge>;
  } else {
    return <Badge className="bg-red-100 text-red-800">{count} High</Badge>;
  }
};

export default function PatchesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [patchData, setPatchData] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const assets = hardwareService.getAll();
    const users = userService.getAll();
    
    const patchInfo = assets.map(asset => {
      const user = users.find(u => u.id === asset.assignedUser);
      return {
        assetId: asset.id,
        assetName: `${asset.manufacturer} ${asset.model}`,
        assignedUser: user ? `${user.firstName} ${user.lastName}` : 'Unassigned',
        operatingSystem: asset.operatingSystem || 'Not specified',
        patchStatus: asset.patchStatus,
        lastChecked: asset.lastPatchCheck || 'Never',
        location: asset.location,
        vulnerabilities: Math.floor(Math.random() * 10), // Mock vulnerability count
      };
    });
    
    setPatchData(patchInfo);
  };

  const filteredAssets = patchData.filter(asset => {
    const matchesSearch = asset.assetName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.assignedUser.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.operatingSystem.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || asset.patchStatus === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Patch Management</h1>
          <p className="text-gray-600">Monitor and track patch status across all assets</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Bulk Update
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Up-to-Date</p>
                <p className="text-2xl font-bold">{patchData.filter(a => a.patchStatus === 'up-to-date').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Needs Review</p>
                <p className="text-2xl font-bold">{patchData.filter(a => a.patchStatus === 'needs-review').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Update Pending</p>
                <p className="text-2xl font-bold">{patchData.filter(a => a.patchStatus === 'update-pending').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Shield className="h-5 w-5 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Vulnerabilities</p>
                <p className="text-2xl font-bold">{patchData.reduce((sum, a) => sum + a.vulnerabilities, 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by asset, user, or operating system..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Patch Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="up-to-date">Up-to-Date</SelectItem>
                <SelectItem value="needs-review">Needs Review</SelectItem>
                <SelectItem value="update-pending">Update Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Patch Status Table */}
      <Card>
        <CardHeader>
          <CardTitle>Asset Patch Status ({filteredAssets.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset</TableHead>
                  <TableHead>Operating System</TableHead>
                  <TableHead>Patch Status</TableHead>
                  <TableHead>Last Checked</TableHead>
                  <TableHead>Vulnerabilities</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssets.map((asset) => (
                  <TableRow key={asset.assetId}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{asset.assetName}</p>
                        <p className="text-sm text-gray-500">{asset.assignedUser} - {asset.location}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">{asset.operatingSystem}</span>
                    </TableCell>
                    <TableCell>{getStatusBadge(asset.patchStatus)}</TableCell>
                    <TableCell>{asset.lastChecked}</TableCell>
                    <TableCell>{getVulnerabilityBadge(asset.vulnerabilities)}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <RefreshCw className="h-4 w-4 mr-1" />
                          Check
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}