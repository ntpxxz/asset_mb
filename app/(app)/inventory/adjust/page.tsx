"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save, Loader2, Barcode, Search, PenSquare, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';     
import Image from 'next/image'; 
import { cn } from '@/lib/utils';

type InventoryItem = {
  id: number;
  name: string;
  quantity: number;
  image_url: string | null;
};

export default function AdjustStockPage() {
  const router = useRouter();
  
  const [barcode, setBarcode] = useState('');
  const [foundItem, setFoundItem] = useState<InventoryItem | null>(null);
  const [newQuantity, setNewQuantity] = useState(0);
  const [notes, setNotes] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const handleBarcodeLookup = useCallback(async () => {
    if (!barcode.trim()) {
      setLookupError("Please enter a barcode.");
      return;
    }
    
    setLoading(true);
    setLookupError(null);
    setFoundItem(null);

    try {
      const response = await fetch(`/api/inventory?barcode=${encodeURIComponent(barcode)}`);
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Item not found.");
      }
      setFoundItem(result.data);
      setNewQuantity(result.data.quantity); // Pre-fill with current quantity
      toast.success(`Found: ${result.data.name}`);

    } catch (error: any) {
      setLookupError(error.message);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }, [barcode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foundItem) {
      toast.error("Please find an item to adjust.");
      return;
    }
    if (notes.trim() === '') {
        toast.error("A reason for the adjustment is required.");
        return;
    }

    setSubmitting(true);
    const toastId = toast.loading("Adjusting stock...");

    try {
      const response = await fetch('/api/inventory/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: foundItem.id,
          newQuantity: newQuantity,
          notes: notes,
          // userId can be added here if you have user authentication
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "An unknown error occurred.");
      }

      toast.success("Stock adjusted successfully!", { id: toastId });
      router.push('/inventory');
      
    } catch (error: any) {
      toast.error(error.message, { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  const handleBarcodeKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleBarcodeLookup();
    }
  };

  const quantityChange = foundItem ? newQuantity - foundItem.quantity : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Stock Adjustment</h1>
          <p className="text-gray-600">Correct the stock quantity to match the physical count.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Barcode className="h-5 w-5" />
            <span>1. Find Item by Barcode</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              id="barcode"
              placeholder="Scan or enter barcode..."
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              onKeyPress={handleBarcodeKeyPress}
              disabled={loading}
              autoFocus
            />
            <Button onClick={handleBarcodeLookup} disabled={loading || !barcode.trim()}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin"/> : <Search className="h-4 w-4"/>}
            </Button>
          </div>
          {lookupError && <p className="text-sm text-red-500 mt-2">{lookupError}</p>}
        </CardContent>
      </Card>

      {foundItem && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
                <PenSquare className="h-5 w-5" />
                <span>2. Adjust Stock for: {foundItem.name}</span>
            </CardTitle>
            <CardDescription>
                Enter the new, physically counted quantity. The system will calculate the difference.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                    <div className="space-y-2">
                        <Label>Current System Quantity</Label>
                        <Input value={foundItem.quantity} disabled className="text-center text-lg font-bold bg-muted" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="newQuantity">New Physical Count *</Label>
                        <Input
                            id="newQuantity"
                            type="number"
                            value={newQuantity}
                            onChange={(e) => setNewQuantity(parseInt(e.target.value, 10))}
                            min="0"
                            required
                            className="text-center text-2xl font-bold h-12 border-blue-400 focus-visible:ring-blue-400"
                        />
                    </div>
                     <div className="space-y-2">
                        <Label>Adjustment</Label>
                        <Input 
                            value={quantityChange > 0 ? `+${quantityChange}` : quantityChange} 
                            disabled 
                            className={cn(
                                "text-center text-lg font-bold",
                                quantityChange < 0 && "bg-red-100 text-red-800",
                                quantityChange > 0 && "bg-green-100 text-green-800"
                            )} 
                        />
                    </div>
                </div>

              <div className="space-y-2 pt-4">
                <Label htmlFor="notes">Reason for Adjustment *</Label>
                <Textarea
                  id="notes"
                  placeholder="e.g., Annual stock count, found damaged items, data entry correction..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  required
                />
              </div>

                {quantityChange !== 0 && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-800 text-sm flex items-center">
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        You are about to change the stock from <strong className="mx-1">{foundItem.quantity}</strong> to <strong className="mx-1">{newQuantity}</strong>. This action will be recorded.
                    </div>
                )}
              
              <div className="flex justify-end space-x-3 pt-6 border-t">
                <Button type="button" variant="outline" onClick={() => router.back()} disabled={submitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting || quantityChange === 0}>
                  {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  {submitting ? 'Saving...' : 'Confirm Adjustment'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}