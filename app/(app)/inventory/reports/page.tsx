"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Download, Filter, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { User } from "@/lib/data-store";
import { useI18n } from "@/lib/i18n-context";

type Transaction = {
  id: number;
  item_name: string;
  user_name: string | null;
  transaction_type: 'dispense' | 'return' | 'adjust' | 'receive';
  quantity_change: number;
  notes: string | null;
  transaction_date: string;
};

export default function InventoryReportsPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination State
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    type: 'all',
    userId: 'all',
  });

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      if (data.success) {
        setUsers(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch users", error);
    }
  };

  const fetchTransactions = useCallback(async (page: number) => {
    setLoading(true);
    try {
      const offset = (page - 1) * itemsPerPage;
      const params = new URLSearchParams();

      params.append('limit', String(itemsPerPage));
      params.append('offset', String(offset));

      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.type !== 'all') params.append('type', filters.type);
      if (filters.userId !== 'all') params.append('userId', filters.userId);

      const response = await fetch(`/api/inventory/reports?${params.toString()}`);
      const data = await response.json();
      if (data.success) {
        setTransactions(data.data);
        setTotalItems(data.total || 0);
      } else {
        toast.error("Failed to load transactions.");
      }
    } catch (error) {
      toast.error(t('fetchError'));
    } finally {
      setLoading(false);
    }
  }, [filters, itemsPerPage, t]);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchTransactions(currentPage);
  }, [fetchTransactions, currentPage]);

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = () => {
    setCurrentPage(1); // Reset to page 1 when filtering
    fetchTransactions(1);
  };

  const handleExport = () => {
    const headers = ["Date", "Item Name", "Transaction Type", "Quantity Change", "User", "Notes"];
    const rows = transactions.map(t => [
      new Date(t.transaction_date).toLocaleString(),
      `"${t.item_name}"`,
      t.transaction_type,
      t.quantity_change,
      t.user_name || "System",
      `"${t.notes || ''}"`
    ]);
    let csvContent = "data:text/csv;charset=utf-8,"
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "inventory_transactions_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('back')}
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('inventoryReportsTitle')}</h1>
            <p className="text-gray-600">{t('inventoryReportsSubtitle')}</p>
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={handleExport} disabled={transactions.length === 0}>
          <Download className="h-4 w-4 mr-2" />
          {t('exportCSV')}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('filters')}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Input type="date" value={filters.startDate} onChange={e => handleFilterChange('startDate', e.target.value)} />
          <Input type="date" value={filters.endDate} onChange={e => handleFilterChange('endDate', e.target.value)} />
          <Select value={filters.type} onValueChange={value => handleFilterChange('type', value)}>
            <SelectTrigger><SelectValue placeholder={t('transactionTypeLabel')} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('allTypes')}</SelectItem>
              <SelectItem value="dispense">{t('dispense')}</SelectItem>
              <SelectItem value="return">{t('returnItem')}</SelectItem>
              <SelectItem value="adjust">{t('adjust')}</SelectItem>
              <SelectItem value="receive">{t('receive')}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.userId} onValueChange={value => handleFilterChange('userId', value)}>
            <SelectTrigger><SelectValue placeholder="User" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('allUsers')}</SelectItem>
              {users.map(user => <SelectItem key={user.id} value={user.id}>{user.firstname} {user.lastname}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={handleApplyFilters} variant="secondary" disabled={loading}>
            <Filter className="h-4 w-4 mr-2" />
            {t('applyFilters')}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('transactionLog')} ({totalItems})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('date')}</TableHead>
                  <TableHead>{t('item')}</TableHead>
                  <TableHead>{t('type')}</TableHead>
                  <TableHead className="text-right">{t('qtyChange')}</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>{t('notes')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} className="text-center h-24"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></TableCell></TableRow>
                ) : transactions.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="h-24 text-center">{t('noTransactionsFound')}</TableCell></TableRow>
                ) : (
                  transactions.map(t => (
                    <TableRow key={t.id}>
                      <TableCell>{new Date(t.transaction_date).toLocaleString()}</TableCell>
                      <TableCell>{t.item_name}</TableCell>
                      <TableCell><span className="capitalize">{t.transaction_type}</span></TableCell>
                      <TableCell className={`text-right font-medium ${t.quantity_change < 0 ? 'text-red-600' : 'text-green-600'}`}>{t.quantity_change}</TableCell>
                      <TableCell>{t.user_name || 'System'}</TableCell>
                      <TableCell>{t.notes}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between mt-4">
            <span className="text-sm text-gray-600">
              {t('page')} {currentPage} {t('of')} {totalPages}
            </span>
            <div className="space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1 || loading}
              >
                {t('previous')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage >= totalPages || loading}
              >
                {t('next')}
              </Button>
            </div>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}