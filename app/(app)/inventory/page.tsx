"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
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
import { useI18n } from "@/lib/i18n-context";

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
  const { t } = useI18n();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(totalItems / itemsPerPage));
  }, [totalItems, itemsPerPage]);

  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);

  const [itemToPrint, setItemToPrint] = useState<InventoryItem | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isDeleteModelOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const printComponentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

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
        setTotalItems(data.total);
      }
    } catch (error) {
      console.error("Failed to fetch inventory items", error);
      toast.error(t('loadInventoryFailed'));
    } finally {
      setLoading(false);
    }
  }, [itemsPerPage, t]);

  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [debouncedSearchTerm]);

  useEffect(() => {
    loadItems(currentPage, debouncedSearchTerm);
  }, [currentPage, debouncedSearchTerm, loadItems]);

  const openDeleteModal = (item: InventoryItem) => {
    setItemToDelete(item);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    const toastId = toast.loading(t('deletingItem'));
    try {
      const response = await fetch(`/api/inventory/${itemToDelete.id}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || t('deleteItemFailed'));
      toast.success(t('deleteItemSuccess'), { id: toastId });
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
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
    const headers = ["ID", "Barcode", "Name", "Quantity", "Min Stock", "Unit Price", "Total Value", "Location", "Category"];
    const rows = items.map(item => [
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

  const lowStockItems = useMemo(() => {
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('inventoryTitle')}</h1>
          <p className="text-gray-600">
            {t('inventorySubtitle')}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button size="sm" variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            {t('exportCSV')}
          </Button>
        </div>
      </div>

      {lowStockItems.length > 0 && (
        <Card className="border-orange-400 bg-orange-50">
          <CardHeader><CardTitle className="flex items-center text-orange-800"><AlertTriangle className="h-5 w-5 mr-2" />{t('lowStockAlert')}</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-orange-700">{t('lowStockMessage').replace('X', String(lowStockItems.length))}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {lowStockItems.map((item) => (<Badge key={item.id} variant="outline" className="border-orange-300 text-orange-800">{item.name} ({t('quantity')}: {item.quantity})</Badge>))}
            </div>
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader>
          <CardTitle>{t('stockItemsTitle')} ({totalItems} {t('items')})</CardTitle>
          <div className="relative pt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder={t('searchPlaceholderInventory')} className="pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">{t('image')}</TableHead>
                  <TableHead>{t('itemName')}</TableHead>
                  <TableHead>Barcode</TableHead>
                  <TableHead className="text-center">{t('quantity')}</TableHead>
                  <TableHead className="text-right">{t('unitPrice')}</TableHead>
                  <TableHead className="text-right">{t('totalValue')}</TableHead>
                  <TableHead>{t('location')}</TableHead>
                  <TableHead className="text-center">{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={8} className="h-24 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></TableCell></TableRow>
                ) : items.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="h-24 text-center">{t('noItemsFound')}</TableCell></TableRow>
                ) : (
                  items.map((item) => {
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
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/inventory/transaction?itemId=${item.id}&barcode=${item.barcode || ''}`)}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              title="Create Transaction"
                            >
                              <ArrowRightLeft className="h-4 w-4" />
                            </Button>
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

          <div className="flex items-center justify-between mt-4">
            <span className="text-sm text-gray-600">
              {t('page')} {currentPage} {t('of')} {totalPages}
            </span>
            <div className="space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
              >
                {t('previous')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage >= totalPages}
              >
                {t('next')}
              </Button>
            </div>
          </div>

        </CardContent>
      </Card>

      <Dialog open={isPrintModalOpen} onOpenChange={setIsPrintModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t('printBarcode')}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="mb-4 text-sm text-muted-foreground">
              {t('printPreview')} <strong>{itemToPrint?.name}</strong>
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
                <p>{t('noBarcode')}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPrintModalOpen(false)}>{t('cancel')}</Button>
            <Button onClick={handlePrintClick}>
              <Printer className="h-4 w-4 mr-2" />
              {t('print')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteModelOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t('confirmDeleteTitle')}</DialogTitle>
            <DialogDescription>
              {t('confirmDeleteMessage')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={isDeleting}
            >
              {t('cancel')}
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
              {t('deleteItem')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}