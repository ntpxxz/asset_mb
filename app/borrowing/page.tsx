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
  RotateCcw, 
  Activity,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock
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
  hardwareService, 
  userService, 
  borrowService, 
  HardwareAsset, 
  User, 
  BorrowRecord 
} from '@/lib/data-store';

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'overdue':
      return <Badge className="bg-red-100 text-red-800">Overdue</Badge>;
    case 'checked-out':
      return <Badge className="bg-green-100 text-green-800">Checked Out</Badge>;
    case 'returned':
      return <Badge className="bg-blue-100 text-blue-800">Returned</Badge>;
    case 'in-stock':
      return <Badge className="bg-blue-100 text-blue-800">Available</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

export default function BorrowingPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [checkedOutAssets, setCheckedOutAssets] = useState<any[]>([]);
  const [loanableAssets, setLoanableAssets] = useState<HardwareAsset[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const allAssets = hardwareService.getAll();
    const allUsers = userService.getAll();
    const borrowRecords = borrowService.getCheckedOut();
    
    // Get checked out assets with user info
    const checkedOut = borrowRecords.map(record => {
      const asset = allAssets.find(a => a.id === record.assetId);
      const user = allUsers.find(u => u.id === record.borrowerId);
      const today = new Date().toISOString().split('T')[0];
      const isOverdue = record.dueDate < today;
      
      return {
        id: record.id,
        assetId: record.assetId,
        name: asset ? `${asset.manufacturer} ${asset.model}` : 'Unknown Asset',
        borrower: user ? `${user.firstName} ${user.lastName}` : 'Unknown User',
        department: user?.department || 'Unknown',
        checkoutDate: record.checkoutDate,
        dueDate: record.dueDate,
        status: isOverdue ? 'overdue' : 'checked-out',
        purpose: record.purpose,
      };
    });
    
    setCheckedOutAssets(checkedOut);
    setLoanableAssets(allAssets.filter(asset => asset.isLoanable && asset.status === 'in-stock'));
    setUsers(allUsers);
  };

  const handleCheckin = (recordId: string) => {
    borrowService.checkin(recordId);
    loadData();
  };

  const filteredCheckedOut = checkedOutAssets.filter(asset =>
    asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.borrower.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredLoanable = loanableAssets.filter(asset =>
    `${asset.manufacturer} ${asset.model}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Asset Borrowing</h1>
          <p className="text-gray-600">Track borrowed assets and manage returns</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={() => router.push('/borrowing/checkin')}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Check In
          </Button>
          <Button size="sm" onClick={() => router.push('/borrowing/checkout')}>
            <Activity className="h-4 w-4 mr-2" />
            Check Out
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Activity className="h-5 w-5 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Checked Out</p>
                <p className="text-2xl font-bold">{checkedOutAssets.length}</p>
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
                <p className="text-sm font-medium text-gray-600">Overdue</p>
                <p className="text-2xl font-bold">{checkedOutAssets.filter(a => a.status === 'overdue').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Available</p>
                <p className="text-2xl font-bold">{loanableAssets.length}</p>
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
                <p className="text-sm font-medium text-gray-600">Due Soon</p>
                <p className="text-2xl font-bold">0</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by asset name or borrower..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Currently Checked Out */}
      <Card>
        <CardHeader>
          <CardTitle>Currently Checked Out ({filteredCheckedOut.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset</TableHead>
                  <TableHead>Borrower</TableHead>
                  <TableHead>Checkout Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCheckedOut.map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{asset.name}</p>
                        <p className="text-sm text-gray-500">{asset.assetId}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{asset.borrower}</p>
                        <p className="text-sm text-gray-500">{asset.department}</p>
                      </div>
                    </TableCell>
                    <TableCell>{asset.checkoutDate}</TableCell>
                    <TableCell>{asset.dueDate}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(asset.status)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => handleCheckin(asset.id)}>
                        <RotateCcw className="h-4 w-4 mr-1" />
                        Check In
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Available for Borrowing */}
      <Card>
        <CardHeader>
          <CardTitle>Available for Borrowing ({filteredLoanable.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLoanable.map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{asset.manufacturer} {asset.model}</p>
                        <p className="text-sm text-gray-500">{asset.id}</p>
                      </div>
                    </TableCell>
                    <TableCell>{asset.location}</TableCell>
                    <TableCell>{getStatusBadge('in-stock')}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => router.push('/borrowing/checkout')}>
                        <Activity className="h-4 w-4 mr-1" />
                        Check Out
                      </Button>
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