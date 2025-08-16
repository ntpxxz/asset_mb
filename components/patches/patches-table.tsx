'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Filter,
  Edit,
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

interface PatchesTableProps {
  initialPatchData: any[];
}

export function PatchesTable({ initialPatchData }: PatchesTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [patchData, setPatchData] = useState(initialPatchData);

  const filteredAssets = patchData.filter(asset => {
    const matchesSearch = asset.assetName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.assignedUser.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.operatingSystem.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || asset.patchStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
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
