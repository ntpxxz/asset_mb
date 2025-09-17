'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { AssetForm } from '../components/forms/asset-form'; // ← ปรับ path ให้ถูกกับโปรเจกต์คุณ

export default function AddAssetPage() {
  const router = useRouter();

  const handleSubmit = async (formData: any) => {
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
      // แสดง toast ใน AssetForm แล้วพาออกภายหลังได้
      setTimeout(() => router.push('/assets'), 1200);
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to create asset' };
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
