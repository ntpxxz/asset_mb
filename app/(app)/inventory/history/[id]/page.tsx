"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  History,
  Plus,
  Minus,
  Loader2,
  Download,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

type Transaction = {
  id: number;
  item_id: number;
  user_id: string | null;
  transaction_type: "dispense" | "receive" | "return";
  quantity_change: number;
  price_per_unit: number;
  value_change: number | string; // Can be string from DB
  notes: string | null;
  transaction_date: string;
  user_name?: string;
};

export default function TransactionHistoryPage() {
  const router = useRouter();
  const params = useParams();
  const itemId = params.id as string;

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [itemName, setItemName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (itemId) {
      const fetchHistory = async () => {
        setLoading(true);
        try {
          const response = await fetch(`/api/inventory/history/${itemId}`);
          const data = await response.json();
          if (data.success) {
            setItemName(data.data.itemName);
            setTransactions(data.data.transactions);
          } else {
            toast.error("Failed to load history.");
          }
        } catch (error) {
          toast.error("An error occurred while fetching history.");
        } finally {
          setLoading(false);
        }
      };
      fetchHistory();
    }
  }, [itemId]);

  const getTransactionTypeUI = (
    type: Transaction["transaction_type"],
    quantity: number
  ) => {
    if (type === "dispense") {
      return (
        <Badge variant="destructive">
          <Minus className="h-3 w-3 mr-1" />
          Dispensed ({quantity})
        </Badge>
      );
    }
    if (type === "receive") {
      return (
        <Badge className="bg-green-100 text-green-800">
          <Plus className="h-3 w-3 mr-1" />
          Received (+{quantity})
        </Badge>
      );
    }
    return <Badge variant="secondary">Return (+{quantity})</Badge>;
  };
  const handleExport = () => {
    const headers = [
      "Date",
      "Type",
      "Quantity Change",
      "Unit Price",
      "Total Value",
      "User",
      "Notes",
    ];
    const rows = transactions.map((tx) => [
      new Date(tx.transaction_date).toLocaleString(),
      tx.transaction_type,
      tx.quantity_change,
      tx.price_per_unit,
      tx.value_change,
      tx.user_name || "System",
      `"${tx.notes || ""}"`,
    ]);
    let csvContent =
      "data:text/csv;charset=utf-8," +
      headers.join(",") +
      "\n" +
      rows.map((e) => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `history_${itemName.replace(/\s+/g, "_")}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return "฿0.00";
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
    }).format(value);
  };

  // --- FIX IS HERE: Use parseFloat to ensure values are treated as numbers ---
  const totalValueChange = transactions.reduce((acc, tx) => {
    const value = parseFloat(tx.value_change as string);
    return acc + (isNaN(value) ? 0 : value);
  }, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Transaction History
            </h1>
            <p className="text-gray-600">
              History for: {itemName || `Item ID ${itemId}`}
            </p>
          </div>
          </div>
          <Button
            size="sm"
            onClick={handleExport}
            disabled={transactions.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <History className="h-5 w-5" />
            <span>History Log</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-right p-4">Total Value</TableHead>
                  <TableHead className="text-center">User</TableHead>
                  <TableHead className="text-center">Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-24">
                      <div className="flex justify-center items-center">
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                        Loading history...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-24">
                      No transaction history for this item.
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell>
                        {new Date(tx.transaction_date).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {getTransactionTypeUI(
                          tx.transaction_type,
                          tx.quantity_change
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(tx.price_per_unit)}
                      </TableCell>
                      <TableCell
                        className={`text-right font-semibold ${
                          Number(tx.value_change) < 0
                            ? "text-red-600"
                            : "text-green-600"
                        }`}
                      >
                        {formatCurrency(Number(tx.value_change))}
                      </TableCell>
                      <TableCell className="text-center">
                        {tx.user_name || "System"}
                      </TableCell>
                      <TableCell className="text-center">
                        {tx.notes || "N/A"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell
                    colSpan={1}
                    className="font-bold text-right"
                  ></TableCell>
                  <TableCell colSpan={2} className="font-bold text-right">
                    Net Value Change
                  </TableCell>
                  <TableCell
                    colSpan={1}
                    className={`text-right font-bold ${
                      totalValueChange < 0 ? "text-red-600" : "text-green-600"
                    }`}
                  >
                    {formatCurrency(totalValueChange)}
                  </TableCell>
                  <TableCell
                    colSpan={2}
                    className="font-bold text-right"
                  ></TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
