'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { AssetForm } from '../components/forms/asset-form'; // ← ปรับ path ให้ถูกกับโปรเจกต์คุณ
import { toast } from 'sonner';

export default function AddAssetPage() {
  const router = useRouter();

  const handleSubmit = async (formData: any) => {

    const tid = toast.loading("Adding asset...", {
      description: "Saving to database",
      className: "rounded-2xl border bg-white/90 backdrop-blur shadow-lg",
      duration: 10000,
    });

    let finished = false;
    try {
      const res = await fetch('/api/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData), // ใช้ snake_case ตาม AssetForm
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || 'Failed to create asset');
      }

      toast.success("Asset added successfully", {
        id: tid,
        description: `New Hardware Added Successfully`,
        icon: "✅",
        className:
          "rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-900 shadow-lg",
        style: { boxShadow: "0 8px 24px rgba(16,185,129,.25)" },
        duration: 2000,
      });
finished = true;
      setTimeout(() => router.push('/assets'), 2200);
      return { success: true };
    } catch (err) {
      toast.error("Failed to added asset", {
        id:tid,
        description:"Please try again.",
         icon: "⚠️",
         className:
           "rounded-2xl border border-rose-200 bg-rose-50 text-rose-900 shadow-lg",
         style: { boxShadow: "0 8px 24px rgba(244,63,94,.25)" },
         duration: 4000,
       });
 
      return { success: false, error: err instanceof Error ? err.message : 'Failed to create asset' };
    }
    finally {
  
  
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add Hardware Asset</h1>
          <p className="text-gray-600">Create a new hardware asset record</p>
        </div>
      </div>

      <AssetForm
        mode="create"
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
      />
    </div>
  );
}
