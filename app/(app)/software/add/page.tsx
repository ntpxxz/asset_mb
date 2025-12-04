'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { SoftwareFormData } from '@/lib/data-store';
import SoftwareForm from '../components/forms/software-form';

import { useI18n } from '@/lib/i18n-context';

export default function AddSoftwarePage() {
  const router = useRouter();
  const { t } = useI18n();

  const handleSubmit = async (payload: Partial<SoftwareFormData>) => {
    try {
      const res = await fetch('/api/software', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload), // ใช้ snake_case จาก SoftwareForm โดยตรง
      });

      // กันเคสที่ API อาจตอบ 204 -> ไม่มี body
      const text = await res.text();
      const json = text ? JSON.parse(text) : { success: res.ok };

      if (!res.ok || !json.success) {
        throw new Error(json?.error || 'Failed to create software');
      }

      // ให้ toast จากฟอร์มแสดงก่อน แล้วค่อยกลับไปหน้ารายการ
      setTimeout(() => router.push('/software'), 1200);
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to create software',
      };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header เหมือน asset */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('back')}
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add Software</h1>
          <p className="text-gray-600">Create a new software license</p>
        </div>
      </div>

      {/* Form */}
      <SoftwareForm
        mode="create"
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
      />
    </div>
  );
}
