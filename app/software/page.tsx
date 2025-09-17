'use client';

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Download, Edit, Trash2, Eye, Shield, Calendar, AlertTriangle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Row = {
  id: string;
  software_name: string;
  publisher: string | null;
  version: string | null;
  license_key: string | null;
  licenses_type: string | null;
  purchasedate: string | null;   // 'YYYY-MM-DD'
  expirydate: string | null;     // 'YYYY-MM-DD' | null (Perpetual)
  licenses_total: number;
  licenses_assigned: number;
  category: string | null;
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "active":
      return <Badge className="bg-green-100 text-green-800">Active</Badge>;
    case "expiring-soon":
      return <Badge className="bg-yellow-100 text-yellow-800">Expiring Soon</Badge>;
    case "expired":
      return <Badge className="bg-red-100 text-red-800">Expired</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

const getLicenseTypeBadge = (type?: string | null) => {
  const colors: Record<string, string> = {
    subscription: "bg-blue-100 text-blue-800",
    perpetual: "bg-green-100 text-green-800",
    "per-device": "bg-purple-100 text-purple-800",
    "per-user": "bg-orange-100 text-orange-800",
  };
  return <Badge className={type ? (colors[type] || "bg-gray-100 text-gray-800") : "bg-gray-100 text-gray-800"}>
    {type || "—"}
  </Badge>;
};

const formatDateOnly = (value?: string | null) => {
  if (!value) return "—";
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  const d = new Date(value);
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60 * 1000);
  return local.toISOString().slice(0, 10);
};

const deriveStatus = (expirydate: string | null) => {
  if (!expirydate) return "active"; // perpetual
  const today = new Date(); today.setHours(0,0,0,0);
  const exp = new Date(expirydate + "T00:00:00");
  const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000*60*60*24));
  if (diffDays < 0) return "expired";
  if (diffDays <= 30) return "expiring-soon";
  return "active";
};

export default function SoftwarePage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/software', { method: 'GET' });
      const json = await res.json();
      if (res.ok && json.success && Array.isArray(json.data)) {
        // คาดว่า API คืน snake_case ตรงกับคอลัมน์ DB
        setRows(json.data as Row[]);
      } else {
        setRows([]);
      }
    } catch (err) {
      console.error('Failed to load software:', err);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this software license?')) return;
    try {
      const res = await fetch(`/api/software/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      await loadData();
    } catch (e) {
      console.error(e);
      alert('Delete failed');
    }
  };

  const filtered = useMemo(() => {
    return rows.filter((sw) => {
      const matchesSearch =
        (sw.software_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (sw.publisher || '').toLowerCase().includes(searchTerm.toLowerCase());

      const st = deriveStatus(sw.expirydate);
      const matchesStatus = statusFilter === "all" || st === statusFilter;

      const lt = (sw.licenses_type || '').toLowerCase();
      const matchesType = typeFilter === "all" || lt === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [rows, searchTerm, statusFilter, typeFilter]);

  const totalLicenses = rows.reduce((sum, sw) => sum + (Number(sw.licenses_total) || 0), 0);
  const totalAssigned = rows.reduce((sum, sw) => sum + (Number(sw.licenses_assigned) || 0), 0);
  const totalAvailable = rows.reduce((sum, sw) => sum + ((Number(sw.licenses_total)||0) - (Number(sw.licenses_assigned)||0)), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Software Licenses</h1>
          <p className="text-gray-600">Manage software licenses and track usage</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button size="sm" onClick={() => router.push("/software/add")}>
            <Plus className="h-4 w-4 mr-2" />
            Add License
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card><CardContent className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Shield className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Licenses</p>
              <p className="text-2xl font-bold">{totalLicenses}</p>
            </div>
          </div>
        </CardContent></Card>

        <Card><CardContent className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Eye className="h-5 w-5 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">In Use</p>
              <p className="text-2xl font-bold">{totalAssigned}</p>
            </div>
          </div>
        </CardContent></Card>

        <Card><CardContent className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Calendar className="h-5 w-5 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Expiring Soon</p>
              <p className="text-2xl font-bold">
                {rows.filter(sw => deriveStatus(sw.expirydate) === 'expiring-soon').length}
              </p>
            </div>
          </div>
        </CardContent></Card>

        <Card><CardContent className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Available</p>
              <p className="text-2xl font-bold">{totalAvailable}</p>
            </div>
          </div>
        </CardContent></Card>
      </div>

      {/* Filters */}
      <Card><CardContent className="p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Search by software name or publisher..."
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                     className="pl-10" />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="expiring-soon">Expiring Soon</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="License Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="subscription">Subscription</SelectItem>
              <SelectItem value="perpetual">Perpetual</SelectItem>
              <SelectItem value="per-device">Per Device</SelectItem>
              <SelectItem value="per-user">Per User</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent></Card>

      {/* Table */}
      <Card>
        <CardHeader><CardTitle>Software Inventory ({filtered.length})</CardTitle></CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
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
                {filtered.map((sw) => {
                  const status = deriveStatus(sw.expirydate);
                  const assigned = Number(sw.licenses_assigned) || 0;
                  const total = Number(sw.licenses_total) || 0;
                  const pct = total > 0 ? Math.round((assigned / total) * 100) : 0;
                  return (
                    <TableRow key={sw.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-blue-100 rounded-lg"><Shield className="h-4 w-4 text-blue-600" /></div>
                          <div>
                            <p className="font-medium">{sw.software_name}</p>
                            <p className="text-sm text-gray-500">
                              {sw.publisher || '—'}{sw.publisher ? ' - ' : ''}{sw.version || ''}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getLicenseTypeBadge(sw.licenses_type)}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>{assigned} / {total}</span>
                            <span>{pct}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(status)}</TableCell>
                      <TableCell><span className="text-sm">{sw.expirydate ? formatDateOnly(sw.expirydate) : 'Perpetual'}</span></TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm" onClick={() => router.push(`/software/${sw.id}`)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => router.push(`/software/${sw.id}/edit`)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleDelete(sw.id)}>
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
