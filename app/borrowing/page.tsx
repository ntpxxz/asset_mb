"use client";

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
import { User, AssetFormData, BorrowRecord, CheckedOutAsset } from '@/lib/data-store'; 



const getStatusBadge = (status: string) => {
  const s = (status || '').toLowerCase();
  switch (s) {
    case 'overdue':
      return <Badge className="bg-red-100 text-red-800">Overdue</Badge>;
    case 'checked-out':
      return <Badge className="bg-green-100 text-green-800">Checked Out</Badge>;
    case 'available':
      return <Badge className="bg-blue-100 text-blue-800">Available</Badge>;
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
  const [loanableAssets, setLoanableAssets] = useState<AssetFormData[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const assetsResponse = await fetch('/api/assets');
      if (!assetsResponse.ok) throw new Error(`Assets API error: ${assetsResponse.status}`);
      const assetsRes = await assetsResponse.json();

      const usersResponse = await fetch('/api/users');
      if (!usersResponse.ok) throw new Error(`Users API error: ${usersResponse.status}`);
      const usersRes = await usersResponse.json();

      const borrowsResponse = await fetch('/api/borrowing?status=checked-out');
      if (!borrowsResponse.ok) throw new Error(`Borrowing API error: ${borrowsResponse.status}`);
      const borrowsRes = await borrowsResponse.json();

      const allAssets: AssetFormData[] = assetsRes.success ? assetsRes.data : [];
      const allUsers: User[] = usersRes.success ? usersRes.data : [];
      const borrowRecords: BorrowRecord[] = borrowsRes.success ? borrowsRes.data : [];

      const checkedOutTags = new Set(
        (borrowRecords || [])
          .filter(r => (r.status || '').toLowerCase().replace(/\s+/g, '-') === 'checked-out')
          .map(r => r.asset_tag)
      );

      const today = new Date();
      const checkedOut: CheckedOutAsset[] = (borrowRecords || []).map((record) => {
        const asset = (allAssets || []).find((a) => a.asset_tag === record.asset_tag);
        const user = (allUsers || []).find((u) => u.id === record.borrowerId);
        const borrowerDisplay = record.borrowername 
          ? record.borrowername 
          : user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Unknown User';
        const isOverdue = record.due_date ? new Date(record.due_date) < today : false;

        return {
          id: record.id,
          asset_tag: record.asset_tag,
          name: asset ? `${asset.manufacturer || ''} ${asset.model || ''}`.trim() : 'Unknown Asset',
          borrowername: borrowerDisplay,
          department: user?.department ?? 'Unknown',
          checkout_date: record.checkout_date,
          due_date: record.due_date,
          status: isOverdue ? 'overdue' : 'checked-out',
          purpose: record.purpose,
        };
      });

      const loanable: AssetFormData[] = (allAssets || []).filter((a) => {
        const s = (a.status || '').toLowerCase();
        const isAvailable = s === 'available';
        return a.isloanable === true && isAvailable && !checkedOutTags.has(a.asset_tag);
      });

      setCheckedOutAssets(checkedOut);
      setLoanableAssets(loanable);
      setUsers(allUsers || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCheckin = async (recordId: string) => {
    try {
      setLoading(true);
        router.push(`/borrowing/checkin?id=${encodeURIComponent(recordId)}`);
    } finally {
      setLoading(false);
    }
  };

  const dateOnly = (s?: string | null) =>
    s ? new Date(s).toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' }) : '';

  const filteredCheckedOut = checkedOutAssets.filter(asset =>
    asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.borrowername.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.asset_tag.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredLoanable = loanableAssets.filter(asset =>
    `${asset.manufacturer} ${asset.model}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.asset_tag.toLowerCase().includes(searchTerm.toLowerCase())
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
                    if (!a.due_date) return false;
                    const due_date = new Date(a.due_date);
                    const threeDaysFromNow = new Date();
                    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
                    return due_date <= threeDaysFromNow && a.status !== 'overdue';
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
              placeholder="Search by asset, tag, or borrower..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Checked Out */}
      <Card>
        <CardHeader>
          <CardTitle>Currently Checked Out ({filteredCheckedOut.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredCheckedOut.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No checked out assets found</div>
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
                          <p className="text-sm text-gray-500">{asset.asset_tag}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{asset.borrowername}</p>
                      </TableCell>
                      <TableCell>{dateOnly(asset.checkout_date)}</TableCell>
                      <TableCell>{asset.due_date ? dateOnly(asset.due_date) : "No due date"}</TableCell>
                      <TableCell>{getStatusBadge(asset.status)}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" onClick={() => handleCheckin(asset.id)}>
                          <RotateCcw className="h-4 w-4 mr-1" />
                          Return
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

      {/* Available */}
      <Card>
        <CardHeader>
          <CardTitle>Available for Borrowing ({filteredLoanable.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredLoanable.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No assets available for borrowing</div>
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
                    <TableRow key={asset.asset_tag}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{asset.manufacturer} {asset.model}</p>
                          <p className="text-sm text-gray-500">{asset.asset_tag}</p>
                        </div>
                      </TableCell>
                      <TableCell>{asset.location}</TableCell>
                      <TableCell>{getStatusBadge(asset.status)}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/borrowing/checkout?asset_tag=${encodeURIComponent(asset.asset_tag)}`)}
                        >
                          <Activity className="h-4 w-4 mr-1" />
                         Borrow
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
