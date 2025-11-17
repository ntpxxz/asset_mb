"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react"; // 1. Import useCallback, useMemo
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Box,
  Plus,
  Minus,
  History,
  Search,
  Edit,
  ImageIcon,
  AlertTriangle,
  ArrowRightLeft,
  Printer,
  Download,
  Trash,
  Loader2,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import { useReactToPrint } from "react-to-print";
import Barcode from "react-barcode";
import { BarcodePrintLayout } from "./components/barcode-print-layout";
import { toast } from "sonner";

// 2. Import Pagination components
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

type InventoryItem = {
  id: number;
  barcode: string | null;
  name: string;
  description: string | null;
  quantity: number;
  min_stock_level: number;
  price_per_unit: number;
  location: string | null;
  category: string | null;
  image_url: string | null;
  updated_at: string;
};

export default function InventoryPage() {
  const router = useRouter();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // --- 3. Add Pagination State ---
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20; // กำหนดจำนวนรายการต่อหน้า
  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(totalItems / itemsPerPage));
  }, [totalItems, itemsPerPage]);

  // --- 4. Add Debounced Search State ---
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);

  // (State สำหรับ Print และ Delete ไม่เปลี่ยนแปลง)
  const [itemToPrint, setItemToPrint] = useState<InventoryItem | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isDeleteModelOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const printComponentRef = useRef<HTMLDivElement | null>(null);

  // --- 5. Create Debounce Effect ---
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300); // 300ms delay

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);


  // --- 6. Update fetchItems to loadItems with pagination ---
  const loadItems = useCallback(async (page: number, search: string) => {
    setLoading(true);
    try {
      const offset = (page - 1) * itemsPerPage;
      
      const params = new URLSearchParams();
      params.set('limit', String(itemsPerPage));
      params.set('offset', String(offset));
      if (search) {
        params.set('search', search);
      }

      const response = await fetch(`/api/inventory?${params.toString()}`, { cache: "no-store" });
      const data = await response.json();
      
      if (data.success) {
        setItems(data.data);
        setTotalItems(data.total); // <-- รับ Total จาก API
      }
    } catch (error) {
      console.error("Failed to fetch inventory items", error);
      toast.error("Failed to load inventory items.");
    } finally {
      setLoading(false);
    }
  }, [itemsPerPage]); // <-- useCallback จะถูกสร้างใหม่ถ้า itemsPerPage เปลี่ยน

  // --- 7. Update main useEffects for data fetching ---
  useEffect(() => {
    // เมื่อ search term เปลี่ยน, ให้กลับไปหน้า 1
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [debouncedSearchTerm]);

  useEffect(() => {
    // ดึงข้อมูลใหม่ทุกครั้งที่ page หรือ search term เปลี่ยน
    loadItems(currentPage, debouncedSearchTerm);
  }, [currentPage, debouncedSearchTerm, loadItems]);
  
  // (ฟังก์ชัน Delete, Print, Export ไม่เปลี่ยนแปลง)
  const openDeleteModal = (item: InventoryItem) => {
    setItemToDelete(item);
    setIsDeleteModalOpen(true);
  };
  
  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    const toastId = toast.loading("Deleting item...");
    try {
      const response = await fetch(`/api/inventory/${itemToDelete.id}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to delete item.");
      toast.success("Item deleted successfully.", { id: toastId });
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
      // โหลดหน้าปัจจุบันใหม่
      loadItems(currentPage, debouncedSearchTerm);
    } catch (error: any) {
      toast.error(error.message, { id: toastId });
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePrintClick = useReactToPrint({
    contentRef: printComponentRef,
    documentTitle: itemToPrint?.name || "barcode",
    onAfterPrint: () => setIsPrintModalOpen(false),
  });

  const openPrintModal = (item: InventoryItem) => {
    setItemToPrint(item);
    setIsPrintModalOpen(true);
  };
  
  const handleExport = () => {
    // (ฟังก์ชันนี้ควรจะดึงข้อมูลทั้งหมดถ้าต้องการ export, แต่สำหรับตอนนี้จะ export แค่หน้าปัจจุบัน)
    const headers = ["ID", "Barcode", "Name", "Quantity", "Min Stock", "Unit Price", "Total Value", "Location", "Category"];
    const rows = items.map(item => [ // <-- 8. เปลี่ยนจาก filteredItems เป็น items
      item.id,
      item.barcode || '',
      `"${item.name}"`,
      item.quantity,
      item.min_stock_level,
      item.price_per_unit,
      item.quantity * item.price_per_unit,
      item.location || '',
      item.category || ''
    ]);
    let csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "inventory_stock.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- 9. ลบ filteredItems ---
  // const filteredItems = items.filter(...) // <--- ลบบรรทัดนี้

  const lowStockItems = useMemo(() => {
    // การคำนวณนี้ยังโอเค เพราะมันแค่ไฮไลท์ ไม่ได้กรอง
    return items.filter(
      (item) => item.quantity <= item.min_stock_level
    );
  }, [items]);


  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return "฿0.00";
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
    }).format(value);
  };
  
  // --- 10. Handler สำหรับปุ่ม Pagination ---
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };


  return (
    <div className="space-y-6">
      {/* (Header ไม่เปลี่ยนแปลง) */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
          <p className="text-gray-600">
            Manage consumable items and stock levels.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
            <Button size="sm" variant= "outline" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
            </Button>
            <Button size="sm" variant="outline" onClick={() => router.push('/inventory/transaction')}>
                <ArrowRightLeft className="h-4 w-4 mr-2" />
                New Transaction
            </Button>
            <Button size="sm"  onClick={() => router.push('/inventory/add')}>
                <Plus className="h-4 w-4 mr-2" />
                Add Stock
            </Button>
        </div>
      </div>

      {/* (Low Stock Alert ไม่เปลี่ยนแปลง) */}
      {lowStockItems.length > 0 && (
        <Card className="border-orange-400 bg-orange-50">
            <CardHeader><CardTitle className="flex items-center text-orange-800"><AlertTriangle className="h-5 w-5 mr-2" />Low Stock Alert</CardTitle></CardHeader>
            <CardContent>
                <p className="text-sm text-orange-700">The following {lowStockItems.length} item(s) are at or below the minimum stock level:</p>
                <div className="flex flex-wrap gap-2 mt-2">
                    {lowStockItems.map((item) => (<Badge key={item.id} variant="outline" className="border-orange-300 text-orange-800">{item.name} (Qty: {item.quantity})</Badge>))}
                </div>
            </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader>
          {/* 11. อัปเดต Title ให้แสดง totalItems */}
          <CardTitle>Stock Items ({totalItems} items)</CardTitle>
          <div className="relative pt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="Search by name, barcode, or category..." className="pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                {/* (TableHeader ไม่เปลี่ยนแปลง) */}
                <TableRow>
                  <TableHead className="w-[80px]">Image</TableHead>
                  <TableHead>Item Name</TableHead>
                  <TableHead>Barcode</TableHead>
                  <TableHead className="text-center">Quantity</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-right">Total Value</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={8} className="h-24 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></TableCell></TableRow>
                ) : items.length === 0 ? ( // <-- 12. เปลี่ยนเป็น items.length
                  <TableRow><TableCell colSpan={8} className="h-24 text-center">No items found.</TableCell></TableRow>
                ) : (
                  items.map((item) => { // <-- 13. เปลี่ยนเป็น items.map
                    const isLowStock = item.quantity <= item.min_stock_level;
                    return (
                      <TableRow key={item.id} className={isLowStock ? "bg-orange-50 hover:bg-orange-100" : ""}>
                        <TableCell>
                          <div className="w-16 h-16 relative rounded-md border bg-muted/50 flex items-center justify-center overflow-hidden">
                            {item.image_url ? (<Image key={`${item.id}-${item.updated_at}`} src={item.image_url} alt={item.name} width={64} height={64} className="object-contain" unoptimized />) : (<ImageIcon className="h-6 w-6 text-muted-foreground" />)}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell className="font-mono text-sm">{item.barcode || "N/A"}</TableCell>
                        <TableCell className={`text-center font-bold ${isLowStock ? "text-orange-600" : ""}`}>
                          {isLowStock && (<AlertTriangle className="h-4 w-4 inline-block mr-1 text-orange-500" />)}
                          {item.quantity}
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(item.price_per_unit)}</TableCell>
                        <TableCell className="text-right font-semibold">{formatCurrency(item.quantity * item.price_per_unit)}</TableCell>
                        <TableCell>{item.location || "N/A"}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center space-x-1">
                            <Button variant="ghost" size="sm" onClick={() => router.push(`/inventory/${item.id}/edit`)}><Edit className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="sm" onClick={() => router.push(`/inventory/history/${item.id}`)}><History className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="sm" onClick={() => openPrintModal(item)} disabled={!item.barcode}><Printer className="h-4 w-4" /></Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => openDeleteModal(item)}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* --- 14. Add Pagination Controls --- */}
          <div className="flex items-center justify-between mt-4">
                <span className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
                <div className="space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    disabled={currentPage >= totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
          {/* --- End Pagination Controls --- */}
          
        </CardContent>
      </Card>

      {/* (Print Modal ไม่เปลี่ยนแปลง) */}
      <Dialog open={isPrintModalOpen} onOpenChange={setIsPrintModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Print Barcode Label</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="mb-4 text-sm text-muted-foreground">
              Preview of the label for: <strong>{itemToPrint?.name}</strong>
            </p>
            <div className="hidden">
              {itemToPrint && (
                <BarcodePrintLayout ref={printComponentRef} items={[itemToPrint]} />
              )}
            </div>
            <div className="flex justify-center items-center p-4 border rounded-md">
              {itemToPrint && itemToPrint.barcode ? (
                <div className="flex flex-col items-center gap-2">
                  <p className="font-semibold text-center">{itemToPrint.name}</p>
                  <Barcode
                    value={itemToPrint.barcode}
                    displayValue={false}
                    width={2}
                    height={50}
                  />
                  <p className="font-mono tracking-widest text-lg">{itemToPrint.barcode}</p>
                </div>
              ) : (
                <p>No barcode available for this item.</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPrintModalOpen(false)}>Cancel</Button>
            <Button onClick={handlePrintClick}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* (Delete Modal ไม่เปลี่ยนแปลง) */}
      <Dialog open={isDeleteModelOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Are you absolutely sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete
              <strong className="mx-1">{itemToDelete?.name}</strong>
              and all its related history.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash className="h-4 w-4 mr-2" />
              )}
              Yes, delete item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}