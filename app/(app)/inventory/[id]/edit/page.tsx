"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import InventoryForm from '../../components/forms/inventory-form'; // Re-use the form component!

type InventoryItem = {
  id: number;
  barcode: string;
  name: string;
  quantity: number;
  location: string;
  category: string;
  description: string;
};

export default function EditInventoryPage() {
  const router = useRouter();
  const params = useParams();
  const itemId = params.id as string;

  const [initialData, setInitialData] = useState<InventoryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    if (itemId) {
      const fetchItem = async () => {
        setLoading(true);
        try {
          const response = await fetch(`/api/inventory/${itemId}`);
          const result = await response.json();
          if (result.success) {
            setInitialData(result.data);
          } else {
            toast.error("Failed to load item data.");
          }
        } catch (error) {
          toast.error("An error occurred while fetching item data.");
        } finally {
          setLoading(false);
        }
      };
      fetchItem();
    }
  }, [itemId]);
  
  // Create a new handleSubmit for editing
  const handleEditSubmit = async (formData: any) => {
    const toastId = toast.loading("Saving changes...");
    try {
        const response = await fetch(`/api/inventory/${itemId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
        });
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.error || 'Failed to update item');
        }
        toast.success("Item updated successfully!", { id: toastId });
        router.push('/inventory');
    } catch(error: any) {
        toast.error(error.message, { id: toastId });
    }
  };

  if (loading) {
    return (
        <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    );
  }

  if (!initialData) {
      return <div>Item not found.</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Inventory Item</h1>
          <p className="text-gray-600">Editing: {initialData.name}</p>
        </div>
      </div>

      {/* Re-use the form component in "edit" mode */}
      <InventoryForm 
        onSave={() => router.push('/inventory')} 
        initialData={{ ...initialData, id: initialData.id.toString() }} 
        mode="edit"
        onSubmit={handleEditSubmit}
      />
    </div>
  );
}