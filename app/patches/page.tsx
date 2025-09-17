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
  RefreshCw,
  Eye,
  X
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
import { useRouter } from 'next/navigation';

import { PatchRecord } from '@/lib/data-store'

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
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [patchData, setPatchData] = useState<PatchRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query parameters
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      const response = await fetch(`/api/patches?${params.toString()}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch patch data');
      }

      if (result.success) {
        setPatchData(result.data || []);
      } else {
        throw new Error(result.error || 'Failed to load patch data');
      }
    } catch (err) {
      console.error('Error loading patch data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load patch data');
      
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadData();
  };

  const handleViewDetails = (patch: PatchRecord) => {
    router.push(`/patches/${patch.id}`);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredAssets = patchData.filter(patch => {
    const matchesSearch = patch.assetId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patch.operatingSystem.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || patch.patchStatus === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Calculate statistics
  const stats = {
    upToDate: patchData.filter(p => p.patchStatus === 'up-to-date').length,
    needsReview: patchData.filter(p => p.patchStatus === 'needs-review').length,
    updatePending: patchData.filter(p => p.patchStatus === 'update-pending').length,
    totalVulnerabilities: patchData.reduce((sum, p) => sum + (p.vulnerabilities || 0), 0)
  };

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
          <Button size="sm" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
              <div>
                <p className="text-sm font-medium text-red-800">Error Loading Data</p>
                <p className="text-sm text-red-600">{error}</p>
                <p className="text-xs text-red-500 mt-1">Showing mock data for demonstration</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
                <p className="text-2xl font-bold">{stats.upToDate}</p>
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
                <p className="text-2xl font-bold">{stats.needsReview}</p>
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
                <p className="text-2xl font-bold">{stats.updatePending}</p>
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
                <p className="text-2xl font-bold">{stats.totalVulnerabilities}</p>
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
                  placeholder="Search by asset ID or operating system..."
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
          <CardTitle>
            Asset Patch Status ({filteredAssets.length})
            {loading && <span className="text-sm font-normal text-gray-500 ml-2">Loading...</span>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset ID</TableHead>
                  <TableHead>Operating System</TableHead>
                  <TableHead>Patch Status</TableHead>
                  <TableHead>Last Checked</TableHead>
                  <TableHead>Vulnerabilities</TableHead>
                  <TableHead>Pending Updates</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                        Loading patch data...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredAssets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No patch records found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAssets.map((patch) => (
                    <TableRow key={patch.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{patch.assetId}</p>
                          <p className="text-sm text-gray-500">ID: {patch.id}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm">{patch.operatingSystem}</span>
                      </TableCell>
                      <TableCell>{getStatusBadge(patch.patchStatus)}</TableCell>
                      <TableCell>{patch.lastPatchCheck}</TableCell>
                      <TableCell>{getVulnerabilityBadge(patch.vulnerabilities)}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {patch.pendingUpdates > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {patch.pendingUpdates} Total
                            </Badge>
                          )}
                          {patch.criticalUpdates > 0 && (
                            <Badge className="bg-red-100 text-red-800 text-xs">
                              {patch.criticalUpdates} Critical
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleViewDetails(patch)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <RefreshCw className="h-4 w-4 mr-1" />
                            Check
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}