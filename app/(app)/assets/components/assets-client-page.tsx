// app/(app)/assets/components/assets-client-page.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  Download,
  Edit,
  Trash2,
  Eye,
  Monitor,
  Laptop,
  Smartphone,
  Printer,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"; // Import Pagination
import type { AssetFormData } from "@/lib/data-store"; // Import type

// --- 1. สร้าง Interface สำหรับ Props ---
interface AssetsClientPageProps {
  initialData: {
    assets: AssetFormData[];
    total: number;
  };
}

// --- 2. แก้ไข Helper functions (เหมือนเดิม) ---
const getStatusBadge = (status: string) => {
  // ... (โค้ด getStatusBadge เหมือนเดิม) ...
  switch (status) {
    case "assigned":
      return <Badge className="bg-green-100 text-green-800">Assigned</Badge>;
    case "available":
      return <Badge className="bg-blue-100 text-blue-800">Available</Badge>;
    case "maintenance":
      return <Badge className="bg-yellow-100 text-yellow-800">Maintenance</Badge>;
    case "retired":
      return <Badge className="bg-gray-100 text-gray-800">Retired</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

const getAssetIcon = (type: string) => {
  // ... (โค้ด getAssetIcon เหมือนเดิม) ...
  switch (type) {
    case "laptop":
      return Laptop;
    case "desktop":
      return Monitor;
    case "phone":
    case "tablet":
      return Smartphone;
    case "printer":
      return Printer;
    case "server":
      return Monitor;
    case "router":
    case "switch":
      return Monitor;
    default:
      return Monitor;
  }
};

// --- 3. เปลี่ยนชื่อ Component และรับ Props ---
export default function AssetsClientPage({ initialData }: AssetsClientPageProps) {
  const router = useRouter();

  // --- 4. ใช้ initialData เป็นค่าเริ่มต้น ---
  const [assets, setAssets] = useState<AssetFormData[]>(initialData.assets);
  const [total, setTotal] = useState(initialData.total);
  const [loading, setLoading] = useState(false); // <-- เปลี่ยนเป็น false
  const [error, setError] = useState<string | null>(null);

  // (State อื่นๆ เหมือนเดิม)
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // --- 5. เพิ่ม Debounced Search (สำหรับ Server-side search) ---
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300); // หน่วง 300ms
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // --- 6. แก้ไข loadAssets ให้นำ search term ไปใช้ ---
  const loadAssets = async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const limit = itemsPerPage;
      const offset = (page - 1) * itemsPerPage;

      const qs = new URLSearchParams();
      qs.set("limit", String(limit));
      qs.set("offset", String(offset));
      if (statusFilter !== "all") qs.set("status", statusFilter);
      if (categoryFilter !== "all") qs.set("type", categoryFilter);
      if (debouncedSearchTerm) qs.set("search", debouncedSearchTerm); // <-- เพิ่ม Search

      const res = await fetch(`/api/assets?${qs.toString()}`);
      const json = await res.json();

      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);

      setAssets(Array.isArray(json.data) ? json.data : []);
      setTotal(Number(json.total ?? 0));
    } catch (err) {
      setAssets([]);
      setTotal(0);
      setError(err instanceof Error ? err.message : "Failed to load assets");
    } finally {
      setLoading(false);
    }
  };

  // --- 7. ลบ useEffect ตัวแรกทิ้ง (เพราะเราได้ initialData แล้ว) ---
  // useEffect(() => { loadAssets(1); }, []); // <-- ลบอันนี้

  // --- 8. แก้ไข useEffects ให้ทำงานกับ debouncedSearchTerm ---
  useEffect(() => {
    setCurrentPage(1); // กลับไปหน้า 1 เมื่อ Filter หรือ Search
    loadAssets(1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, categoryFilter, debouncedSearchTerm]); // <-- เพิ่ม debouncedSearchTerm

  useEffect(() => {
    loadAssets(currentPage);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]); // <-- ตัวนี้เหมือนเดิม

  // --- (ฟังก์ชัน handleDelete, handleView, handleEdit เหมือนเดิม) ---
  const handleDelete = async (assetId: string) => {
    if (!confirm("Are you sure you want to delete this asset?")) return;
    try {
      const response = await fetch(`/api/assets/${assetId}`, { method: "DELETE" });
      const result = await response.json();
      if (response.ok && result.success) {
        loadAssets(currentPage);
      } else {
        throw new Error(result.error || "Failed to delete asset");
      }
    } catch (err) {
      alert(`Failed to delete asset: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };
  
  const handleView = (asset: any) => router.push(`/assets/${asset.id}`);
  const handleEdit = (asset: any) => router.push(`/assets/${asset.id}/edit`);

  // --- 9. ลบ filteredAssets (เพราะเรากรองที่ Server แล้ว) ---
  // const filteredAssets = assets.filter(...) // <-- ลบส่วนนี้

  // --- 10. ใช้ 'assets' โดยตรง และคำนวณ totalPages ---
  const paginatedAssets = assets; // <-- ใช้ assets โดยตรง
  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(total / itemsPerPage));
  }, [total, itemsPerPage]);

  // (if (loading) ... ลบออกได้เลย เพราะเรามี Suspense ที่หน้า page)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Hardware Assets</h1>
          <p className="text-gray-600">Manage your IT assets and track their lifecycle</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={() => loadAssets(currentPage)} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button size="sm" onClick={() => router.push("/assets/add")}>
            <Plus className="h-4 w-4 mr-2" />
            Add Hardware
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <Card className="border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center text-red-700">
              <AlertCircle className="h-4 w-4 mr-2" />
              <span>{error}</span>
              <Button variant="outline" size="sm" className="ml-auto" onClick={() => loadAssets(currentPage)}>
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters (Search Input เปลี่ยนไปใช้ State ของตัวเอง) */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by model, serial, user, or tag..."
                  value={searchTerm} // <-- ใช้ searchTerm (State)
                  onChange={(e) => setSearchTerm(e.target.value)} // <-- อัปเดต searchTerm
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              {/* ... Select Status ... */}
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="retired">Retired</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              {/* ... Select Category ... */}
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
                <SelectItem value="server">Server</SelectItem>
                <SelectItem value="router">Router</SelectItem>
                <SelectItem value="switch">Network Switch</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Assets Table */}
      <Card>
        <CardHeader>
          <CardTitle>Hardware Inventory ({total} items)</CardTitle>
        </CardHeader>
        <CardContent>
          {paginatedAssets.length === 0 ? (
            <div className="text-center py-8">
              {/* ... (UI ตอนไม่มีข้อมูล เหมือนเดิม) ... */}
              <Monitor className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No assets found</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-md border">
                <Table>
                  {/* ... (TableHeader เหมือนเดิม) ... */}
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Model</TableHead>
                      <TableHead>Serial Number</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedAssets.map((asset) => {
                      // ... (การแสดง Row เหมือนเดิม) ...
                      const Icon = getAssetIcon(asset.type!);
                      return (
                        <TableRow key={asset.id}>
                          <TableCell className="font-mono text-sm">
                            <div className="flex items-center space-x-3">
                              <div className="p-2 bg-gray-100 rounded-lg">
                                <Icon className="h-4 w-4 text-gray-600" />
                              </div>
                              <div>
                                <p className="font-medium">{asset.asset_tag || "-"}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <div>
                                <p className="font-medium">{asset.manufacturer} {asset.model}</p>
                                <p className="text-sm text-gray-500 capitalize">{asset.type}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm">{asset.serialnumber || "-"}</TableCell>
                          <TableCell>{getStatusBadge(asset.status!)}</TableCell>
                          <TableCell>{asset.assigneduser || "-"}</TableCell>
                          <TableCell>{asset.location || "-"}</TableCell>
                          <TableCell className="font-medium">
                            {asset.purchaseprice ? `${asset.purchaseprice}฿` : "-"}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button variant="ghost" size="sm" onClick={() => handleView(asset)} title="View Details">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleEdit(asset)} title="Edit Asset">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleDelete(asset.id!)} title="Delete Asset">
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

              {/* Pagination controls */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
                <div className="space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    disabled={currentPage === 1 || loading}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    disabled={currentPage >= totalPages || loading}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}