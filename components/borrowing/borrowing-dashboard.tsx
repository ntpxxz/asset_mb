'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  RotateCcw,
  Activity
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { borrowingApi } from '@/lib/api-client';

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

interface BorrowingDashboardProps {
  initialCheckedOutAssets: any[];
  initialLoanableAssets: any[];
  initialUsers: any[];
}

export function BorrowingDashboard({
  initialCheckedOutAssets,
  initialLoanableAssets,
  initialUsers
}: BorrowingDashboardProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [checkedOutAssets, setCheckedOutAssets] = useState(initialCheckedOutAssets);
  const [loanableAssets, setLoanableAssets] = useState(initialLoanableAssets);
  const [users, setUsers] = useState(initialUsers);

  const loadData = async () => {
    // This is a simplified load function. A real app might need more complex logic
    // to refresh all the data required by this dashboard.
    const checkedOutResponse = await borrowingApi.getAll({ status: 'checked-out' });
    if (checkedOutResponse.success && checkedOutResponse.data) {
      // This part is tricky because we need to enrich the borrow records
      // with asset and user details. For now, we'll just refresh the list.
      // A full implementation would require another fetch for users and assets.
    }
  };

  const handleCheckin = async (recordId: string) => {
    const response = await borrowingApi.checkin(recordId);
    if (response.success) {
      // For simplicity, we'll just reload the page to get fresh server-side data
      router.refresh();
    } else {
      alert('Failed to check in asset: ' + response.error);
    }
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
