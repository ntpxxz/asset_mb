'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Search,
  Filter,
  Download,
  Edit,
  Trash2,
  Eye,
  Monitor,
  Laptop,
  Smartphone,
  Printer,
  Activity,
  RotateCcw
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
import { hardwareApi, usersApi } from '@/lib/api-client';
import { AssetFormData } from '@/lib/data-store';

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'in-use':
      return <Badge className="bg-green-100 text-green-800">Active</Badge>;
    case 'in-stock':
      return <Badge className="bg-blue-100 text-blue-800">Available</Badge>;
    case 'under-repair':
      return <Badge className="bg-yellow-100 text-yellow-800">Maintenance</Badge>;
    case 'retired':
      return <Badge className="bg-gray-100 text-gray-800">Retired</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

const getAssetIcon = (type: string) => {
  switch (type) {
    case 'laptop':
      return Laptop;
    case 'desktop':
      return Monitor;
    case 'phone':
    case 'tablet':
      return Smartphone;
    case 'printer':
      return Printer;
    default:
      return Monitor;
  }
};

interface AssetsTableProps {
  initialAssets: AssetFormData[];
  initialUsers: any[];
}

export function AssetsTable({ initialAssets, initialUsers }: AssetsTableProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [assets, setAssets] = useState<AssetFormData[]>(initialAssets?? []);
  const [users, setUsers] = useState(initialUsers);

  const loadAssets = async () => {
    try{
      const response = await hardwareApi.getAll();
      if (response.success && Array.isArray(response.data)) {
        setAssets(response.data as AssetFormData[]);
      } else {
        console.error('softwareApi.getAll() returned unexpected shape', response);
        setAssets([]);
      }      
    } catch (error) {
      console.error('Failed to load software:', error);
    }
  };
   

  const handleDelete = async (assetId: string) => {
    if (confirm('Are you sure you want to delete this asset?')) {
      const response = await hardwareApi.delete(assetId);
      if (response.success) {
        loadAssets();
      } else {
        alert('Failed to delete asset: ' + response.error);
      }
    }
  };

  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : '-';
  };

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.serialnumber!.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         getUserName(asset.assigneduser!).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || asset.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || asset.type === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
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
                  placeholder="Search by name, serial number, or assigned user..."
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
                <SelectItem value="in-use">In Use</SelectItem>
                <SelectItem value="in-stock">Available</SelectItem>
                <SelectItem value="under-repair">Under Repair</SelectItem>
                <SelectItem value="retired">Retired</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="laptop">Laptop</SelectItem>
                <SelectItem value="desktop">Desktop</SelectItem>
                <SelectItem value="phone">Phone</SelectItem>
                <SelectItem value="tablet">Tablet</SelectItem>
                <SelectItem value="printer">Printer</SelectItem>
                <SelectItem value="monitor">Monitor</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              More Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Assets Table */}
      <Card>
        <CardHeader>
          <CardTitle>Asset Inventory ({filteredAssets.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset</TableHead>
                  <TableHead>Serial Number</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssets.map((asset) => {
                  const Icon = getAssetIcon(asset.type!);
                  return (
                    <TableRow key={asset.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-gray-100 rounded-lg">
                            <Icon className="h-4 w-4 text-gray-600" />
                          </div>
                          <div>
                            <p className="font-medium">{asset.manufacturer} {asset.model}</p>
                            <p className="text-sm text-gray-500">{asset.type}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{asset.serialnumber}</TableCell>
                      <TableCell>{getStatusBadge(asset.status!)}</TableCell>
                      <TableCell>{getUserName(asset.assigneduser!)}</TableCell>
                      <TableCell>{asset.location}</TableCell>
                      <TableCell className="font-medium">${asset.purchaseprice}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm" onClick={() => router.push(`/assets/${asset.id}`)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => router.push(`/assets/${asset.id}/edit`)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleDelete(asset.id!)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
