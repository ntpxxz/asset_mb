"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, Loader2, Barcode, Search, Undo2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

type InventoryItem = {
  id: number;
  name: string;
  quantity: number;
};

type User = {
  id: string;
  firstname: string;
  lastname: string;
}

export default function ReturnPage() {
  const router = useRouter();
  
  const [barcode, setBarcode] = useState('');
  const [foundItem, setFoundItem] = useState<InventoryItem | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [returner, setReturner] = useState('');
  const [notes, setNotes] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersRes = await fetch('/api/users');
        const usersData = await usersRes.json();
        if (usersData.success) setUsers(usersData.data);
      } catch (error) {
        toast.error("Failed to load user list.");
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);
  
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
    if (!foundItem || quantity <= 0) {
      toast.error("Please find an item and enter a valid quantity.");
      return;
    }

    setSubmitting(true);
    const toastId = toast.loading("Returning item to stock...");

    try {
      const response = await fetch('/api/inventory/return', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: foundItem.id,
          quantityToReturn: quantity,
          userId: returner || null,
          notes: notes,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "An unknown error occurred.");
      }

      toast.success("Item returned successfully!", { id: toastId });
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
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Return Item to Stock</h1>
          <p className="text-gray-600">Record an item being returned to the inventory.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Barcode className="h-5 w-5" />
            <span>Find Item by Barcode</span>
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
              <Undo2 className="h-5 w-5" />
              <span>Return Details for: {foundItem.name}</span>
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Currently in stock: <span className="font-bold text-primary">{foundItem.quantity}</span>
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity to Return *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value, 10))}
                    min="1"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="returner">Returned By (Optional)</Label>
                  <Select value={returner} onValueChange={setReturner}>
                    <SelectTrigger id="returner">
                      <SelectValue placeholder="Select a user" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map(user => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.firstname} {user.lastname}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="e.g., Returned from Project Phoenix, unused items..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-6 border-t">
                <Button type="button" variant="outline" onClick={() => router.back()} disabled={submitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  {submitting ? 'Saving...' : 'Confirm Return'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}