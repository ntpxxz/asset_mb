// app/(app)/inventory/reports/page.tsx
"use client";

import { useState, useEffect } from "react";
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
import { ArrowLeft, Download, Filter, Loader2, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { User } from "@/lib/data-store";

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
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
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

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.type !== 'all') params.append('type', filters.type);
      if (filters.userId !== 'all') params.append('userId', filters.userId);

      const response = await fetch(`/api/inventory/reports?${params.toString()}`);
      const data = await response.json();
      if (data.success) {
        setTransactions(data.data);
      } else {
        toast.error("Failed to load transactions.");
      }
    } catch (error) {
      toast.error("An error occurred while fetching transactions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchTransactions();
  }, []);

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };
  
  const handleApplyFilters = () => {
    fetchTransactions();
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Inventory Reports</h1>
            <p className="text-gray-600">View and export inventory transaction history.</p>
          </div>
        </div>
        <Button size="sm" variant = "outline" onClick={handleExport} disabled={transactions.length === 0}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Input type="date" value={filters.startDate} onChange={e => handleFilterChange('startDate', e.target.value)} />
          <Input type="date" value={filters.endDate} onChange={e => handleFilterChange('endDate', e.target.value)} />
          <Select value={filters.type} onValueChange={value => handleFilterChange('type', value)}>
            <SelectTrigger><SelectValue placeholder="Transaction Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="dispense">Dispense</SelectItem>
              <SelectItem value="return">Return</SelectItem>
              <SelectItem value="adjust">Adjust</SelectItem>
              <SelectItem value="receive">Receive</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.userId} onValueChange={value => handleFilterChange('userId', value)}>
            <SelectTrigger><SelectValue placeholder="User" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              {users.map(user => <SelectItem key={user.id} value={user.id}>{user.firstname} {user.lastname}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={handleApplyFilters} variant="secondary" disabled={loading}>
            <Filter className="h-4 w-4 mr-2" />
            Apply Filters
          </Button>

        </CardContent>       
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Transaction Log</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Quantity Change</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} className="text-center h-24"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></TableCell></TableRow>
                ) : transactions.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="h-24 text-center">No transactions found for the selected filters.</TableCell></TableRow>
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
        </CardContent>
      </Card>
    </div>
  );
}