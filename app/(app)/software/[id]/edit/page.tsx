'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Package } from 'lucide-react';
import { SoftwareFormData } from '@/lib/data-store';
import SoftwareForm from '../../components/forms/software-form';
import { Card, CardContent } from '@/components/ui/card';
import { useI18n } from '@/lib/i18n-context';

export default function EditSoftwarePage() {
  const router = useRouter();
  const { t } = useI18n();
  const params = useParams();
  const [softwareData, setSoftwareData] = useState<Partial<SoftwareFormData> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.id) {
      fetchSoftware(params.id as string);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  // แปลงค่าวันที่จาก DB -> YYYY-MM-DD สำหรับ input[type=date]
  const toDateOnly = (v?: string | null) => {
    if (!v) return '';
    try {
      // รองรับทั้ง ISO และ timestamp string
      const d = new Date(v);
      if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
      // ถ้าส่งมาเป็น 'YYYY-MM-DD' อยู่แล้ว
      if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
    } catch { }
    return '';
  };

  const fetchSoftware = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/software/${id}`, { cache: "no-store" });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || 'Failed to fetch software');
      }

      if (result.success && result.data) {
        const data = { ...result.data };

        // ✅ ให้ตรงกับฟอร์ม: ใช้ snake_case และตัดเวลาออก
        data.purchasedate = toDateOnly(data.purchasedate);
        data.expirydate = toDateOnly(data.expirydate);

        setSoftwareData(data);
      } else {
        setError('Software not found');
      }
    } catch (err) {
      console.error('Error fetching software:', err);
      setError(err instanceof Error ? err.message : 'Failed to load software');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (formData: Partial<SoftwareFormData>) => {
    try {
      const response = await fetch(`/api/software/${params.id}`, {
        method: 'PUT', // เหมือนหน้า Asset (PUT), ฝั่ง API เรารองรับทั้ง PUT/PATCH
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      // กันเคส API ตอบ 204 -> ไม่มี body
      const text = await response.text();
      const result = text ? JSON.parse(text) : { success: response.ok };

      if (!response.ok || !result.success) {
        throw new Error(result?.error || 'Failed to update software');
      }

      // ให้เวลาฟอร์มโชว์ toast แล้วค่อยกลับหน้า view
      setTimeout(() => router.push(`/software/${params.id}`), 2000);
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to update software',
      };
    }
  };

  const handleCancel = () => router.back();

  // Error state เหมือนของ Asset
  if (error && !softwareData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('back')}
          </Button>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Software Not Found</h3>
            <p className="text-gray-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header —— ให้หน้าตาแบบเดียวกับ Asset */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('back')}
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Software</h1>
          {softwareData && (
            <p className="text-gray-600">{softwareData.software_name || ''}</p>
          )}
        </div>
      </div>

      {/* Form */}
      {!loading && softwareData && (
        <SoftwareForm
          mode="edit"
          initialData={softwareData}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
}
