"use client";

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, Loader2, Barcode, Search, MinusCircle, Undo2, PenSquare, Archive, AlertTriangle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useI18n } from "@/lib/i18n-context";

type TransactionType = 'dispense' | 'return' | 'adjust';

type InventoryItem = {
  id: number;
  name: string;
  quantity: number;
  image_url: string | null;
};

type User = {
  id: string;
  firstname: string;
  lastname: string;
}

// 1. Logic Component (Renamed from NewTransactionPage)
function TransactionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useI18n();

  const [transactionType, setTransactionType] = useState<TransactionType>('dispense');

  const [barcode, setBarcode] = useState('');
  const [foundItem, setFoundItem] = useState<InventoryItem | null>(null);
  const [quantity, setQuantity] = useState(1); // For dispense/return
  const [newQuantity, setNewQuantity] = useState(0); // For adjustment
  const [user, setUser] = useState('');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const [users, setUsers] = useState<User[]>([]);

  // Auto-fill from URL
  useEffect(() => {
    const barcodeParam = searchParams.get('barcode');
    if (barcodeParam) {
      setBarcode(barcodeParam);
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
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
    if (!barcode.trim()) return;
    setLoading(true);
    setLookupError(null);
    setFoundItem(null);
    try {
      const response = await fetch(`/api/inventory?barcode=${encodeURIComponent(barcode)}`);
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || t('itemNotFound'));

      setFoundItem(result.data);
      setNewQuantity(result.data.quantity); // Pre-fill for adjustment form
      toast.success(`${t('foundItem')} ${result.data.name}`);
    } catch (error: any) {
      setLookupError(error.message);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }, [barcode, t]);

  // Trigger lookup when barcode is set from URL
  useEffect(() => {
    const barcodeParam = searchParams.get('barcode');
    if (barcodeParam && barcode === barcodeParam && !foundItem && !lookupError) {
      handleBarcodeLookup();
    }
  }, [barcode, searchParams, foundItem, lookupError, handleBarcodeLookup]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foundItem) return toast.error(t('findItemFirst'));

    if (transactionType !== 'adjust' && quantity <= 0) {
      return toast.error(t('enterValidQty'));
    }
    if (transactionType === 'adjust' && notes.trim() === '') {
      return toast.error(t('reasonRequired'));
    }

    setSubmitting(true);
    const toastId = toast.loading(t('processingTransaction'));

    const url = `/api/inventory/${transactionType}`;
    let payload: any;

    if (transactionType === 'adjust') {
      payload = { itemId: foundItem.id, newQuantity, userId: user || null, notes };
    } else {
      payload = {
        itemId: foundItem.id,
        quantityToDispense: transactionType === 'dispense' ? quantity : undefined,
        quantityToReturn: transactionType === 'return' ? quantity : undefined,
        userId: user || null,
        notes,
      };
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "An unknown error occurred.");

      toast.success(t('transactionSuccess'), { id: toastId });
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

  const isDispense = transactionType === 'dispense';
  const isReturn = transactionType === 'return';
  const isAdjust = transactionType === 'adjust';

  const quantityChange = foundItem && isAdjust ? newQuantity - foundItem.quantity : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('back')}
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('transactionTitle')}</h1>
          <p className="text-gray-600">{t('transactionSubtitle')}</p>
        </div>
      </div>

      {/* Step 1: Select Type */}
      <Card>
        <CardHeader>
          <CardTitle>{t('selectTransactionType')}</CardTitle>
        </CardHeader>
        <CardContent>
          <ToggleGroup
            type="single"
            value={transactionType}
            onValueChange={(value: TransactionType) => value && setTransactionType(value)}
            className="grid grid-cols-3 gap-2"
          >
            <ToggleGroupItem value="dispense" className="h-12 data-[state=on]:bg-red-50 data-[state=on]:text-red-800 data-[state=on]:border-red-200">
              <MinusCircle className="h-4 w-4 mr-2" /> {t('dispenseType')}
            </ToggleGroupItem>
            <ToggleGroupItem value="return" className="h-12 data-[state=on]:bg-green-50 data-[state=on]:text-green-800 data-[state=on]:border-green-200">
              <Undo2 className="h-4 w-4 mr-2" /> {t('returnType')}
            </ToggleGroupItem>
            <ToggleGroupItem value="adjust" className="h-12 data-[state=on]:bg-yellow-50 data-[state=on]:text-yellow-800 data-[state=on]:border-yellow-200">
              <PenSquare className="h-4 w-4 mr-2" /> {t('adjustType')}
            </ToggleGroupItem>
          </ToggleGroup>
        </CardContent>
      </Card>

      {/* Step 2: Find Item */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Barcode className="h-5 w-5" />
            <span>{t('findItemByBarcode')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input id="barcode" placeholder={t('scanBarcodePlaceholder')} value={barcode} onChange={(e) => setBarcode(e.target.value)} onKeyPress={handleBarcodeKeyPress} disabled={loading} autoFocus />
            <Button onClick={handleBarcodeLookup} disabled={loading || !barcode.trim()}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}</Button>
          </div>
          {lookupError && <p className="text-sm text-red-500 mt-2">{lookupError}</p>}
        </CardContent>
      </Card>

      {/* Step 3: Fill Details */}
      {foundItem && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1 bg-slate-50">
            <CardHeader><CardTitle>{t('itemSummary')}</CardTitle></CardHeader>
            <CardContent className="flex flex-col items-center text-center space-y-4">
              <div className="w-32 h-32 relative rounded-md border bg-white flex items-center justify-center overflow-hidden">
                {foundItem.image_url ? (<Image src={foundItem.image_url} alt={foundItem.name} layout="fill" objectFit="contain" className="p-2" />) : (<Archive className="h-12 w-12 text-slate-400" />)}
              </div>
              <p className="font-semibold text-lg">{foundItem.name}</p>
              <div>
                <p className="text-sm text-muted-foreground">{t('currentlyInStock')}</p>
                <p className="text-5xl font-bold text-blue-600">{foundItem.quantity}</p>
              </div>
            </CardContent>
          </Card>

          <Card className={cn("lg:col-span-2", isDispense && "border-red-200", isReturn && "border-green-200", isAdjust && "border-yellow-200")}>
            <CardHeader>
              <CardTitle className={cn("flex items-center space-x-2", isDispense && "text-red-800", isReturn && "text-green-800", isAdjust && "text-yellow-800")}>
                {isDispense && <MinusCircle className="h-5 w-5" />}
                {isReturn && <Undo2 className="h-5 w-5" />}
                {isAdjust && <PenSquare className="h-5 w-5" />}
                {isAdjust && <span>{t('adjustStockDetails')}</span>}
                {!isAdjust && <span>{t('transactionDetails')}</span>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {isAdjust ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                      <div className="space-y-2">
                        <Label>{t('currentSystemQty')}</Label>
                        <Input value={foundItem.quantity} disabled className="text-center text-lg font-bold bg-muted" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="newQuantity">{t('newPhysicalCount')}</Label>
                        <Input id="newQuantity" type="number" value={newQuantity} onChange={(e) => setNewQuantity(parseInt(e.target.value, 10))} min="0" required className="text-center text-2xl font-bold h-12 border-blue-400 focus-visible:ring-blue-400" />
                      </div>
                      <div className="space-y-2">
                        <Label>{t('adjustment')}</Label>
                        <Input value={quantityChange > 0 ? `+${quantityChange}` : quantityChange} disabled className={cn("text-center text-lg font-bold", quantityChange < 0 && "bg-red-100 text-red-800", quantityChange > 0 && "bg-green-100 text-green-800")} />
                      </div>
                    </div>
                    {quantityChange !== 0 && (
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-800 text-sm flex items-center">
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        {t('stockChangeWarning').replace('X', String(foundItem.quantity)).replace('Y', String(newQuantity))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="quantity">{isDispense ? t('qtyToDispense') : t('qtyToReturn')}</Label>
                      <Input id="quantity" type="number" value={quantity} onChange={(e) => setQuantity(parseInt(e.target.value, 10))} min="1" max={isDispense ? foundItem.quantity : undefined} required className="text-lg h-12" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="user">{isDispense ? t('recipient') : t('returnedBy')}</Label>
                      <Input id="user" type="text" value={user} onChange={(e) => setUser(e.target.value)} required className="text-lg h-12" />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="notes">{isAdjust ? t('reasonForAdjustment') : t('notesOptional')}</Label>
                  <Textarea id="notes" placeholder="" value={notes} onChange={(e) => setNotes(e.target.value)} required={isAdjust} />
                </div>

                <div className="flex justify-end space-x-3 pt-6 border-t">
                  <Button type="button" variant="outline" onClick={() => router.back()} disabled={submitting}>{t('cancel')}</Button>
                  <Button type="submit" disabled={submitting || (isAdjust && quantityChange === 0)} className={cn(isDispense && "bg-red-600 hover:bg-red-700", isReturn && "bg-green-600 hover:bg-green-700", isAdjust && "bg-yellow-600 hover:bg-yellow-700", "text-white")}>
                    {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    {submitting ? t('saving') : (isAdjust ? t('confirmAdjustment') : (isDispense ? t('confirmDispense') : t('confirmReturn')))}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// 2. Main Page Component with Suspense Wrapper
export default function NewTransactionPage() {
  return (
    <Suspense fallback={
      <div className="flex h-[50vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    }>
      <TransactionContent />
    </Suspense>
  );
}