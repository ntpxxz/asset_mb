"use client";

import { useState, useEffect, useRef } from "react";
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
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// --- FIX 1: Import the correct hooks and components ---
import { useReactToPrint } from "react-to-print";
import Barcode from "react-barcode";
import { BarcodePrintLayout } from "./components/barcode-print-layout";


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
  const [itemToPrint, setItemToPrint] = useState<InventoryItem | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const printComponentRef = useRef<HTMLDivElement | null >(null);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/inventory", { cache: "no-store" });
      const data = await response.json();
      if (data.success) {
        setItems(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch inventory items", error);
    } finally {
      setLoading(false);
    }
  };
  
  const handlePrintClick = useReactToPrint({
    contentRef: printComponentRef,
    documentTitle: itemToPrint?.name || "barcode",
    onAfterPrint: () => {
      setIsPrintModalOpen(false);
    },
  });



  const openPrintModal = (item: InventoryItem) => {
    setItemToPrint(item);
    setIsPrintModalOpen(true);
  };
  const handleExport = () => {
    const headers = ["ID", "Barcode", "Name", "Quantity", "Min Stock", "Unit Price", "Total Value", "Location", "Category"];
    const rows = filteredItems.map(item => [
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
  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.barcode &&
        item.barcode.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.category &&
        item.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const lowStockItems = items.filter(
    (item) => item.quantity <= item.min_stock_level
  );

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
          <CardTitle>Stock Items</CardTitle>
          <div className="relative pt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="Search by name, barcode, or category..." className="pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
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
                  <TableRow><TableCell colSpan={8} className="h-24 text-center">Loading...</TableCell></TableRow>
                ) : filteredItems.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="h-24 text-center">No items found.</TableCell></TableRow>
                ) : (
                  filteredItems.map((item) => {
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
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
       {/* Print Modal Dialog */}
       <Dialog open={isPrintModalOpen} onOpenChange={setIsPrintModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Print Barcode Label</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="mb-4 text-sm text-muted-foreground">
              Preview of the label for: <strong>{itemToPrint?.name}</strong>
            </p>
            
            {/* The hidden component that will be printed */}
            <div className="hidden">
              {itemToPrint && (
                <BarcodePrintLayout ref={printComponentRef} items={[itemToPrint]} />
              )}
            </div>

            {/* A visible preview for the user, styled to be centered */}
            <div className="flex justify-center items-center p-4 border rounded-md">
                 {itemToPrint && itemToPrint.barcode ? (
                    <div className="flex flex-col items-center gap-2">
                        <p className="font-semibold text-center">{itemToPrint.name}</p>
                        <Barcode 
                            value={itemToPrint.barcode}
                            displayValue={false} // Hide the default text
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
                <Printer className="h-4 w-4 mr-2"/>
                Print
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

