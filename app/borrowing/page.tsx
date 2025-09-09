'use client';

import { useState, useEffect, useCallback } from 'react';
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
  Clock,
  Loader2
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Asset {
  id: string;
  manufacturer: string;
  model: string;
  status: string;
  isLoanable: boolean;
  location: string;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  department: string;
}

interface BorrowRecord {
  id: string;
  assetId: string;
  borrowerId: string;
  checkoutDate: string;
  dueDate: string;
  status: string;
  purpose?: string;
  borrowername?: string; // Added to hold borrower name

}

interface CheckedOutAsset {
  id: string; // This is the borrow record ID (e.g., BOR-175678547387)
  assetId: string;
  name: string;
  borrowername: string;
  department: string;
  checkoutDate: string;
  dueDate: string;
  status: string;
  purpose?: string;
}

const getStatusBadge = (status: string) => {
  const s = (status || '').toLowerCase();
  switch (s) {
    case 'overdue':
      return <Badge className="bg-red-100 text-red-800">Overdue</Badge>;
    case 'checked-out':
      return <Badge className="bg-green-100 text-green-800">Checked Out</Badge>;
    case 'active':
      return <Badge className="bg-blue-100 text-blue-800">Active</Badge>;
    case 'maintenance':
      return <Badge className="bg-yellow-100 text-yellow-800">Maintenance</Badge>;
    case 'retired':
      return <Badge className="bg-gray-100 text-gray-800">Retired</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

export default function BorrowingPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [checkedOutAssets, setCheckedOutAssets] = useState<CheckedOutAsset[]>([]);
  const [loanableAssets, setLoanableAssets] = useState<Asset[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Starting to load data...');

      // Load data step by step for better error handling
      console.log('Fetching assets...');
      const assetsResponse = await fetch('/api/assets');
      if (!assetsResponse.ok) {
        throw new Error(`Assets API error: ${assetsResponse.status} ${assetsResponse.statusText}`);
      }
      const assetsRes = await assetsResponse.json();
      console.log('Assets response:', assetsRes);

      console.log('Fetching users...');
      const usersResponse = await fetch('/api/users');
      if (!usersResponse.ok) {
        throw new Error(`Users API error: ${usersResponse.status} ${usersResponse.statusText}`);
      }
      const usersRes = await usersResponse.json();
      console.log('Users response:', usersRes);

      console.log('Fetching borrowing records...');
      const borrowsResponse = await fetch('/api/borrowing?status=checked-out');
      if (!borrowsResponse.ok) {
        throw new Error(`Borrowing API error: ${borrowsResponse.status} ${borrowsResponse.statusText}`);
      }
      const borrowsRes = await borrowsResponse.json();
      console.log('Borrowing response:', borrowsRes);
      
      
      // Extract data with better error handling
      const allAssets = assetsRes.success ? assetsRes.data : [];
      const allUsers = usersRes.success ? usersRes.data : [];
      const borrowRecords = borrowsRes.success ? borrowsRes.data : [];
      const checkedOutIds = new Set(
        (Array.isArray(borrowRecords) ? borrowRecords : [])
          .filter(r => (r.status || '').toLowerCase().replace(/\s+/g, '-') === 'checked-out')
          .map(r => r.assetId)
      );
      console.log('Processed data:');
      console.log('- Assets count:', Array.isArray(allAssets) ? allAssets.length : 'Not an array');
      console.log('- Users count:', Array.isArray(allUsers) ? allUsers.length : 'Not an array');
      console.log('- Borrow records count:', Array.isArray(borrowRecords) ? borrowRecords.length : 'Not an array');

      // Ensure we have arrays
      if (!Array.isArray(allAssets)) {
        console.error('Assets is not an array:', allAssets);
      }
      if (!Array.isArray(allUsers)) {
        console.error('Users is not an array:', allUsers);
      }
      if (!Array.isArray(borrowRecords)) {
        console.error('Borrow records is not an array:', borrowRecords);
      }

      const today = new Date();
      let checkedOut: CheckedOutAsset[] = [];

      if (Array.isArray(borrowRecords) && borrowRecords.length > 0) {
        checkedOut = borrowRecords.map((record: BorrowRecord) => {
          const asset = Array.isArray(allAssets) 
            ? allAssets.find((a: Asset) => a.id === record.assetId)
            : undefined;
          const user = Array.isArray(allUsers) && record.borrowerId
            ? allUsers.find((u: User) => u.id === record.borrowerId)
            : undefined;
          const isOverdue = record.dueDate ? new Date(record.dueDate) < today : false;

          const borrowerDisplay = 
          record.borrowername ? record.borrowername :
          user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Unknown User';
          
          
          
          return {
            id: record.id, // This is the borrow record ID like BOR-175678547387
            assetId: record.assetId,
            name: asset ? `${asset.manufacturer || ''} ${asset.model || ''}`.trim() : 'Unknown Asset',
            borrowername:borrowerDisplay,
            department: user?.department ?? 'Unknown',
            checkoutDate: record.checkoutDate,
            dueDate: record.dueDate,
            status: isOverdue ? 'overdue' : 'checked out',
            purpose: record.purpose,
          };
        });
        console.log('Processed checked out assets:', checkedOut);
      }

      // Replace the loanable filtering block
      let loanable: Asset[] = [];
      if (Array.isArray(allAssets) && allAssets.length > 0) {
        loanable = allAssets.filter((a: Asset) => {
          const s = (a.status || '').toLowerCase();
          const isActive = s === 'active';
          return a.isLoanable === true && isActive && !checkedOutIds.has(a.id);
        });
        console.log('Filtered loanable assets:', loanable.length);
      }

      setCheckedOutAssets(checkedOut);
      setLoanableAssets(loanable);
      setUsers(Array.isArray(allUsers) ? allUsers : []);

      console.log('Final state:');
      console.log('- Checked out assets:', checkedOut.length);
      console.log('- Loanable assets:', loanable.length);
      console.log('- Users:', Array.isArray(allUsers) ? allUsers.length : 0);
    } catch (e) {
      console.error('loadData error:', e);
      setError(e instanceof Error ? e.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCheckin = async (recordId: string) => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/borrowing/${recordId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'checkin'
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to check in asset');
      }

      // Reload data after successful checkin
      await loadData();
    } catch (error) {
      console.error('Checkin error:', error);
      setError(error instanceof Error ? error.message : 'Failed to check in asset');
    }
  };
  const dateOnly = (s?: string | null) =>
    s ? new Date(s).toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' }) : '';

  
  const filteredCheckedOut = checkedOutAssets.filter(asset =>
    asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.borrowername.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredLoanable = loanableAssets.filter(asset =>
    `${asset.manufacturer} ${asset.model}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && checkedOutAssets.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Asset Borrowing</h1>
          <p className="text-gray-600">Track borrowed assets and manage returns</p>
        </div>
        <div className="flex gap-3">
         
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
                <p className="text-2xl font-bold">
                  {checkedOutAssets.filter(a => {
                    if (!a.dueDate) return false;
                    const dueDate = new Date(a.dueDate);
                    const threeDaysFromNow = new Date();
                    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
                    return dueDate <= threeDaysFromNow && a.status !== 'overdue';
                  }).length}
                </p>
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
          {filteredCheckedOut.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No checked out assets found
            </div>
          ) : (
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
                          <p className="font-medium">{asset.borrowername}</p>
                        </div>
                      </TableCell>
                      <TableCell>{dateOnly(asset.checkoutDate)}</TableCell>
                      <TableCell>{asset.dueDate ? dateOnly(asset.dueDate) : "No due date"}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getStatusBadge(asset.status)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => router.push(`/borrowing/checkin?borrowId=${encodeURIComponent(asset.id)}`)}
                          disabled={loading}
                        >
                          {loading ? (
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <RotateCcw className="h-4 w-4 mr-1" />
                          )}
                          Check In
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available for Borrowing */}
      <Card>
        <CardHeader>
          <CardTitle>Available for Borrowing ({filteredLoanable.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredLoanable.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No assets available for borrowing
            </div>
          ) : (
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
                      <TableCell>{getStatusBadge(asset.status)}</TableCell>
                      <TableCell>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => router.push(`/borrowing/checkout?assetId=${encodeURIComponent(asset.id)}`)}
                        >
                          <Activity className="h-4 w-4 mr-1" />
                          Check Out
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
}