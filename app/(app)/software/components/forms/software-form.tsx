'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Save, Plus, CheckCircle, AlertCircle, Shield } from 'lucide-react';
import { SoftwareFormData } from '@/lib/data-store';
type Mode = 'create' | 'edit';

export interface SoftwareFormProps {
  mode: Mode;
  initialData?: Partial<SoftwareFormData> | null;
  onSubmit: (payload: Partial<SoftwareFormData>) => Promise<{ success: boolean; error?: string }>;
  onCancel?: () => void;
}

/* ---------- Toast (เหมือน Asset) ---------- */
const Toast = ({
  message,
  type,
  onClose,
}: {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}) => (
  <div
    className={`
      fixed top-6 left-1/2 -translate-x-1/2 -translate-y-1/2
      z-[10000] w-full max-w-md p-4 rounded-lg shadow-2xl border
      transition-all duration-300 transform text-center
      ${type === 'success'
        ? 'bg-green-50 border-green-300 text-green-800 shadow-green-200'
        : 'bg-red-50 border-red-300 text-red-800 shadow-red-200'}
    `}
  >
    <div className="flex items-start gap-3">
      {type === 'success' ? (
        <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
      ) : (
        <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
      )}
      <div className="flex-1">
        <p className="font-semibold text-sm">{type === 'success' ? 'Success!' : 'Error!'}</p>
        <p className="text-sm mt-1">{message}</p>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onClose}
        className="h-auto p-1 hover:bg-transparent opacity-70 hover:opacity-100"
      >
        ×
      </Button>
    </div>
  </div>
);

/* ---------- Helpers ---------- */
const normalizeDate = (v: unknown) => {
  if (!v) return '';
  const s = String(v);
  return s.includes('T') ? s.split('T')[0] : s;
};
const toInt = (v: unknown) => {
  if (v === '' || v === null || v === undefined) return 0;
  const n = typeof v === 'number' ? v : parseInt(String(v), 10);
  return Number.isFinite(n) ? n : 0;
};
const toNull = (v: unknown): string | null => (v === '' || v === undefined || v === null ? null : String(v));

export default function SoftwareForm({ mode, initialData, onSubmit, onCancel }: SoftwareFormProps) {
  const [formData, setFormData] = useState<SoftwareFormData>({
    software_name: '',
    publisher: null,
    version: null,
    license_key: null,
    licenses_type: null,
    status: 'active',  // ค่าเริ่มต้นเป็น 'active'
    purchasedate: '',
    expirydate: '',
    licenses_total: 0,
    licenses_assigned: 0,
    category: null,
    description: null,
    notes: null,
    ...(initialData || {}),
  });
  const [originalData, setOriginalData] = useState<Partial<SoftwareFormData>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(t);
    }
  }, [toast]);
  const showToast = (message: string, type: 'success' | 'error') => setToast({ message, type });

  useEffect(() => {
    if (mode === 'edit' && initialData) {
      setFormData(prev => ({
        ...prev,
        ...initialData,
        purchasedate: normalizeDate((initialData as any)?.purchasedate),
        expirydate: normalizeDate((initialData as any)?.expirydate),
        licenses_total: toInt((initialData as any)?.licenses_total),
        licenses_assigned: toInt((initialData as any)?.licenses_assigned),
        status: (initialData as any)?.status ?? 'active', // กำหนดค่าเริ่มต้นถ้าไม่มี
      }));
      setOriginalData({
        ...(initialData || {}),
        purchasedate: normalizeDate((initialData as any)?.purchasedate),
        expirydate: normalizeDate((initialData as any)?.expirydate),
      });
    }
  }, [initialData, mode]);

  const handleInput = (key: keyof SoftwareFormData, value: any) =>
    setFormData(prev => ({ ...prev, [key]: value }));

  const validate = () => {
    if (!formData.software_name || formData.software_name.trim() === '') {
      setError('software_name is required');
      return false;
    }
    setError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const base: Partial<SoftwareFormData> = {
        ...formData,
        software_name: String(formData.software_name || '').trim(),
        publisher: toNull(formData.publisher || ''), // เพิ่ม || '' เพื่อให้แน่ใจว่าไม่เป็น undefined
        version: toNull(formData.version || ''),
        license_key: toNull(formData.license_key || ''),
        licenses_type: toNull(formData.licenses_type || '') as any,
        status: toNull(formData.status || '') as any,
        purchasedate: normalizeDate(formData.purchasedate || ''),
        expirydate: normalizeDate(formData.expirydate || ''),
        licenses_total: toInt(formData.licenses_total || 0),
        licenses_assigned: toInt(formData.licenses_assigned || 0),
        category: toNull(formData.category || ''),
        description: toNull(formData.description || ''),
        notes: toNull(formData.notes || ''),
      };

      let payload: Partial<SoftwareFormData>;
      if (mode === 'edit') {
        const diff: Partial<SoftwareFormData> = {};
        Object.keys(base).forEach(k => {
          const key = k as keyof SoftwareFormData;
          if ((base as any)[key] !== (originalData as any)[key]) {
            (diff as any)[key] = (base as any)[key];
          }
        });
        if (Object.keys(diff).length === 0) {
          setError('No changes detected');
          setSubmitting(false);
          return;
        }
        delete (diff as any).id;
        payload = diff;
      } else {
        const { id, ...rest } = base as any;
        payload = rest; // create: ส่งทั้งหมด
      }

      const result = (onSubmit ? await onSubmit(payload) : { success: true }) as
        | { success: true }
        | { success: false; error?: string };

      if (!result || (result as any).success !== true) {
        const msg = (result as any)?.error || 'Failed to submit';
        throw new Error(msg);
      }

      showToast(
        mode === 'edit' ? 'Software updated successfully!' : 'Software created successfully!',
        'success'
      );

      if (mode === 'create') {
        setFormData({
          software_name: '',
          publisher: null,
          version: null,
          license_key: null,
          licenses_type: null,
          purchasedate: '',
          expirydate: '',
          licenses_total: 0,
          licenses_assigned: 0,
          category: null,
          description: null,
          notes: null,
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to submit';
      setError(msg);
      showToast(msg, 'error');
      console.error('[SoftwareForm submit error]', err);
    } finally {
      setSubmitting(false);
    }
  };

  // ไอคอนหัวการ์ดให้เหมือน asset (สร้าง = Plus, แก้ไข = Shield)
  const Icon = mode === 'create' ? Plus : Shield;

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* ครอบทั้งหมดด้วย form เพื่อให้ onSubmit ทำงานแน่ๆ */}
      <form onSubmit={handleSubmit} noValidate className="w-full">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Icon className="h-5 w-5" />
              <span>{mode === 'create' ? 'Software Information (ข้อมูลซอฟต์แวร์)' : 'Edit Software (แก้ไขซอฟต์แวร์)'}</span>
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            {error && (
              <div className="mb-2 p-3 bg-red-100 border border-red-300 rounded-md text-red-800 flex items-center">
                <AlertCircle className="h-4 w-4 mr-2" />
                {error}
              </div>
            )}

            {/* Basic Info */}
            <div className="space-y-4">

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="software_name">Software Name (ชื่อซอฟต์แวร์)</Label>
                  <Input
                    id="software_name"
                    value={formData.software_name}
                    onChange={(e) => handleInput('software_name', e.target.value)}
                    disabled={submitting}
                    placeholder="เช่น Microsoft Office 365"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="publisher">Publisher (ผู้จัดจำหน่าย)</Label>
                  <Input
                    id="publisher"
                    value={formData.publisher || ''}
                    onChange={(e) => handleInput('publisher', e.target.value)}
                    disabled={submitting}
                    placeholder="เช่น Microsoft"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category (หมวดหมู่)</Label>
                  <Select
                    value={formData.category || undefined}
                    onValueChange={(v) => handleInput('category', v)}
                    disabled={submitting}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกหมวดหมู่" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="office">Office</SelectItem>
                      <SelectItem value="design">Design</SelectItem>
                      <SelectItem value="developer">Developer</SelectItem>
                      <SelectItem value="security">Security</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="version">Version (เวอร์ชัน)</Label>
                  <Input
                    id="version"
                    value={formData.version || ''}
                    onChange={(e) => handleInput('version', e.target.value)}
                    disabled={submitting}
                    placeholder="เช่น 23H2, 16.80"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="licenses_type">License Type (ประเภทลิขสิทธิ์)</Label>
                  <Select
                    value={(formData.licenses_type as any) || undefined}
                    onValueChange={(v) => handleInput('licenses_type', v)}
                    disabled={submitting}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกประเภทลิขสิทธิ์" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="per-user">Per User</SelectItem>
                      <SelectItem value="per-device">Per Device</SelectItem>
                      <SelectItem value="subscription">Subscription</SelectItem>
                      <SelectItem value="perpetual">Perpetual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status (สถานะ)</Label>
                  <Select
                    value={formData.status || undefined}
                    onValueChange={(v) => handleInput('status', v)}
                    disabled={submitting}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกสถานะ" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="s">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                      <SelectItem value="retired">Retired</SelectItem>
                      <SelectItem value="trial">Trial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>


              </div>
            </div>

            {/* License Keys & Counts */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">License Details (รายละเอียดลิขสิทธิ์)</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="license_key">License Key (รหัสลิขสิทธิ์)</Label>
                  <Input
                    id="license_key"
                    value={formData.license_key || ''}
                    onChange={(e) => handleInput('license_key', e.target.value)}
                    disabled={submitting}
                    placeholder="XXXX-XXXX-XXXX-XXXX"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="licenses_total">Total Licenses (จำนวนลิขสิทธิ์ทั้งหมด)</Label>
                  <Input
                    id="licenses_total"
                    type="number"
                    value={String(formData.licenses_total ?? 0)}
                    onChange={(e) => handleInput('licenses_total', e.target.value)}
                    disabled={submitting}
                    min={0}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="licenses_assigned">Assigned (มอบหมายแล้ว)</Label>
                  <Input
                    id="licenses_assigned"
                    type="number"
                    value={String(formData.licenses_assigned ?? 0)}
                    onChange={(e) => handleInput('licenses_assigned', e.target.value)}
                    disabled={submitting}
                    min={0}
                  />
                </div>
              </div>
            </div>

            {/* Purchase */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Purchase Information (ข้อมูลการจัดซื้อ)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="purchasedate">Purchase Date (วันที่ซื้อ)</Label>
                  <Input
                    id="purchasedate"
                    type="date"
                    value={formData.purchasedate || ''}
                    onChange={(e) => handleInput('purchasedate', e.target.value)}
                    disabled={submitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expirydate">Expiry / Renew Date (วันหมดอายุ / ต่ออายุ)</Label>
                  <Input
                    id="expirydate"
                    type="date"
                    value={formData.expirydate || ''}
                    onChange={(e) => handleInput('expirydate', e.target.value)}
                    disabled={submitting}
                  />
                </div>
              </div>
            </div>

            {/* Additional */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Additional Information (ข้อมูลเพิ่มเติม)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="description">Description (รายละเอียด)</Label>
                  <Textarea
                    id="description"
                    placeholder="รายละเอียดโดยย่อ..."
                    value={formData.description || ''}
                    onChange={(e) => handleInput('description', e.target.value)}
                    rows={2}
                    disabled={submitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (หมายเหตุ)</Label>
                  <Textarea
                    id="notes"
                    placeholder="บันทึกภายใน..."
                    value={formData.notes || ''}
                    onChange={(e) => handleInput('notes', e.target.value)}
                    rows={2}
                    disabled={submitting}
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t">
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
                  Cancel (ยกเลิก)
                </Button>
              )}
              <Button type="submit" disabled={submitting} className={submitting ? 'opacity-50' : ''}>
                <Save className="h-4 w-4 mr-2" />
                {submitting ? 'Saving… (กำลังบันทึก)' : mode === 'edit' ? 'Save Changes (บันทึกการเปลี่ยนแปลง)' : 'Create Software (สร้างซอฟต์แวร์)'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </>
  );
}
