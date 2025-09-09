'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Shield,
  Calendar
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
import { softwareApi } from '@/lib/api-client';

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'active':
      return <Badge className="bg-green-100 text-green-800">Active</Badge>;
    case 'expiring-soon':
      return <Badge className="bg-yellow-100 text-yellow-800">Expiring Soon</Badge>;
    case 'expired':
      return <Badge className="bg-red-100 text-red-800">Expired</Badge>;
    case 'inactive':
      return <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

const getLicenseTypeBadge = (type: string) => {
  const colors = {
    'subscription': 'bg-blue-100 text-blue-800',
    'perpetual': 'bg-green-100 text-green-800',
    'volume': 'bg-purple-100 text-purple-800',
    'oem': 'bg-orange-100 text-orange-800',
    'trial': 'bg-gray-100 text-gray-800',
  };
  return <Badge className={colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>{type}</Badge>;
};

interface SoftwareTableProps {
  initialSoftware: any[];
}

export function SoftwareTable({ initialSoftware }: SoftwareTableProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [software, setSoftware] = useState(initialSoftware);

  const loadSoftware = async () => {
    const response = await softwareApi.getAll();
    if (response.success && response.data) {
      setSoftware(response.data);
    }
  }

  const handleDelete = async (softwareId: string) => {
    if (confirm('Are you sure you want to delete this software license?')) {
      const response = await softwareApi.delete(softwareId);
      if (response.success) {
        loadSoftware();
      } else {
        alert('Failed to delete software license: ' + response.error);
      }
    }
  };

  const filteredSoftware = software.filter(sw => {
    const matchesSearch = sw.softwareName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sw.publisher.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || sw.status === statusFilter;
    const matchesType = typeFilter === 'all' || sw.licenseType === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
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
                  placeholder="Search by software name or publisher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="expiring-soon">Expiring Soon</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="License Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="subscription">Subscription</SelectItem>
                <SelectItem value="perpetual">Perpetual</SelectItem>
                <SelectItem value="volume">Volume</SelectItem>
                <SelectItem value="oem">OEM</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Software Table */}
      <Card>
        <CardHeader>
          <CardTitle>Software Inventory ({filteredSoftware.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Software</TableHead>
                  <TableHead>License Type</TableHead>
                  <TableHead>License Usage</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSoftware.map((sw) => (
                  <TableRow key={sw.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Shield className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">{sw.softwareName}</p>
                          <p className="text-sm text-gray-500">{sw.publisher} - {sw.version}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getLicenseTypeBadge(sw.licenseType)}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>{sw.licensesAssigned} / {sw.licensesTotal}</span>
                          <span>{Math.round((sw.licensesAssigned / sw.licensesTotal) * 100)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${(sw.licensesAssigned / sw.licensesTotal) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(sw.status)}</TableCell>
                    <TableCell>
                      {sw.expiryDate ? (
                        <span className="text-sm">{sw.expiryDate}</span>
                      ) : (
                        <span className="text-sm text-gray-500">Perpetual</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => router.push(`/software/${sw.id}`)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => router.push(`/software/${sw.id}/edit`)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDelete(sw.id)}
                        >
                          <Trash2 className="h-4 w-4" />
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
