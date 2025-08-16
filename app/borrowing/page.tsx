import { borrowingApi, hardwareApi, usersApi } from '@/lib/api-client';
import { BorrowingDashboard } from '@/components/borrowing/borrowing-dashboard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RotateCcw, Activity, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import Link from 'next/link';

async function getBorrowingData() {
  const [borrowingResponse, assetsResponse, usersResponse] = await Promise.all([
    borrowingApi.getAll(),
    hardwareApi.getAll(),
    usersApi.getAll()
  ]);

  const borrowRecords = borrowingResponse.data || [];
  const allAssets = assetsResponse.data || [];
  const allUsers = usersResponse.data || [];

  const checkedOut = borrowRecords
    .filter(r => r.status === 'checked-out')
    .map(record => {
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

  const loanableAssets = allAssets.filter(asset => asset.isLoanable && asset.status === 'in-stock');

  return {
    checkedOutAssets: checkedOut,
    loanableAssets: loanableAssets,
    users: allUsers,
  };
}

export default async function BorrowingPage() {
  const { checkedOutAssets, loanableAssets, users } = await getBorrowingData();

  const overdueCount = checkedOutAssets.filter(a => a.status === 'overdue').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Asset Borrowing</h1>
          <p className="text-gray-600">Track borrowed assets and manage returns</p>
        </div>
        <div className="flex gap-3">
          <Link href="/borrowing/checkin">
            <Button variant="outline" size="sm">
              <RotateCcw className="h-4 w-4 mr-2" />
              Check In
            </Button>
          </Link>
          <Link href="/borrowing/checkout">
            <Button size="sm">
              <Activity className="h-4 w-4 mr-2" />
              Check Out
            </Button>
          </Link>
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
                <p className="text-2xl font-bold">{overdueCount}</p>
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

      <BorrowingDashboard
        initialCheckedOutAssets={checkedOutAssets}
        initialLoanableAssets={loanableAssets}
        initialUsers={users}
      />
    </div>
  );
}
