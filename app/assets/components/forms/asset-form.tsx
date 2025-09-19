'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Package, Save, Plus, CheckCircle, AlertCircle } from 'lucide-react';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { AssetFormData } from '@/lib/data-store';

interface AssetFormProps {
  mode: 'create' | 'edit' | 'duplicate';
  initialData?: AssetFormData;
  assetId?: string;
  onSubmit: (data: AssetFormData) => Promise<{ success: boolean; error?: string }>;
  onCancel: () => void;
  loading?: boolean;
}

const Toast = ({ message, type, onClose }:{
  message: string; type: 'success' | 'error'; onClose: () => void;
}) => (
  <div
    className={`
      fixed top-6 left-1/2 -translate-x-1/2 z-[10000]
      w-full max-w-md p-4 rounded-lg shadow-2xl border text-center
      ${type === 'success'
        ? 'bg-green-50 border-green-300 text-green-800'
        : 'bg-red-50 border-red-300 text-red-800'}
    `}
  >
    <div className="flex items-start gap-3">
      {type === 'success'
        ? <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
        : <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />}
      <div className="flex-1">
        <p className="font-semibold text-sm">{type === 'success' ? 'Success!' : 'Error!'}</p>
        <p className="text-sm mt-1">{message}</p>
      </div>
      <Button variant="ghost" size="sm" onClick={onClose} className="h-auto p-1">×</Button>
    </div>
  </div>
);

export function AssetForm({
  mode, initialData, assetId, onSubmit, onCancel, loading = false,
}: AssetFormProps) {
  const [formData, setFormData] = useState<AssetFormData>({
    status: mode === 'create' ? 'available' : undefined,
    patchstatus: mode === 'create' ? 'needs-review' : '',
    condition: mode === 'create' ? 'good' : undefined,
    isloanable: false,
    ...initialData,
  });

  const [originalData, setOriginalData] = useState<AssetFormData | undefined>(initialData);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (mode !== 'create' && initialData) {
      // ⬅️ เซ็ตตรง ๆ เพื่อให้ค่าไปลง <Select> แน่นอน
      setFormData(prev => ({ ...prev, ...initialData }));
      setOriginalData(initialData);
    }
  }, [initialData, mode]);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const showToast = (message: string, type: 'success' | 'error') => setToast({ message, type });

  const validateForm = (): boolean => {
    const required: (keyof AssetFormData)[] = ['type', 'manufacturer', 'model', 'serialnumber'];
    const missing = required.filter(k => !(formData[k] as any));
    if (missing.length) {
      setError(`Please fill in required fields: ${missing.join(', ')}`);
      return false;
    }
    setError(null);
    return true;
  };

  const normalizeDate = (v: unknown) => {
    if (!v) return '';
    const s = String(v);
    return s.includes('T') ? s.split('T')[0] : s;
  };
  const normalizeNumber = (v: unknown) => {
    if (v === '' || v === null || v === undefined) return null;
    const n = typeof v === 'number' ? v : parseFloat(String(v));
    return Number.isFinite(n) ? n : null;
  };
  const toNull = (v: unknown) => (v === undefined || v === null || v === '' || v === '-' ? null : v);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitting(true);
    setError(null);
    try {
      const base: any = {
        ...formData,
        purchasedate:     normalizeDate(formData.purchasedate),
        warrantyexpiry:   normalizeDate(formData.warrantyexpiry),
        lastpatch_check:  normalizeDate(formData.lastpatch_check),
        purchaseprice:    normalizeNumber(formData.purchaseprice),
        assigneduser:     toNull(formData.assigneduser),
        location:         toNull(formData.location),
        department:       toNull(formData.department),
      };

      let dataToSubmit: any;
      if (mode === 'edit') {
        const diff: any = {};
        Object.keys(base).forEach(k => {
          if ((base as any)[k] !== (originalData as any)?.[k]) diff[k] = (base as any)[k];
        });
        if (!Object.keys(diff).length) {
          showToast('No changes detected', 'error');
          setSubmitting(false);
          return;
        }
        dataToSubmit = diff;
      } else {
        const { id, ...rest } = base;
        dataToSubmit = rest;
        if (!dataToSubmit.asset_tag) dataToSubmit.asset_tag = `AST-${Date.now()}`;
      }

      const result = await onSubmit(dataToSubmit);
      if (result?.success) {
        showToast(`Asset ${mode === 'create' ? 'created' : 'updated'} successfully!`, 'success');
      } else {
        throw new Error(result?.error || `Failed to ${mode} asset`);
      }
    } catch (err: any) {
      const msg = err?.message || `Failed to ${mode} asset`;
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: any) =>
    setFormData(prev => ({ ...prev, [field]: value }));

  const Icon = mode === 'create' ? Plus : Package;

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading asset data...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Icon className="h-5 w-5" />
            <span>Asset Information</span>
          </CardTitle>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="mb-6 p-3 bg-red-100 border border-red-300 rounded-md text-red-800 flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 mr-2" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="asset_tag">Asset Tag</Label>
                <Input
                  id="asset_tag"
                  placeholder={mode === 'create' ? 'Auto-generated if empty' : ''}
                  value={formData.asset_tag ?? ''}
                  onChange={(e) => handleInputChange('asset_tag', e.target.value)}
                  disabled={submitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Asset Type *</Label>
                <Select
                  /** key บังคับ re-render ทุกครั้งที่ค่าเปลี่ยน */
                  key={`type-${formData.type ?? 'empty'}`}
                  value={formData.type ?? ''}
                  onValueChange={(v) => handleInputChange('type', v)}
                  disabled={submitting}
                >
                  <SelectTrigger><SelectValue placeholder="Select asset type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="laptop">Laptop</SelectItem>
                    <SelectItem value="desktop">Desktop</SelectItem>
                    <SelectItem value="monitor">Monitor</SelectItem>
                    <SelectItem value="printer">Printer</SelectItem>
                    <SelectItem value="phone">Phone</SelectItem>
                    <SelectItem value="tablet">Tablet</SelectItem>
                    <SelectItem value="server">Server</SelectItem>
                    <SelectItem value="router">Router</SelectItem>
                    <SelectItem value="switch">Network Switch</SelectItem>
                    <SelectItem value="firewall">Firewall</SelectItem>
                    <SelectItem value="storage">Storage Device</SelectItem>
                    <SelectItem value="projector">Projector</SelectItem>
                    <SelectItem value="camera">Camera</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="manufacturer">Manufacturer *</Label>
                <Input
                  id="manufacturer"
                  value={formData.manufacturer ?? ''}
                  onChange={(e) => handleInputChange('manufacturer', e.target.value)}
                  required disabled={submitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">Model *</Label>
                <Input
                  id="model"
                  value={formData.model ?? ''}
                  onChange={(e) => handleInputChange('model', e.target.value)}
                  required disabled={submitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="serialnumber">Serial Number *</Label>
                <Input
                  id="serialnumber"
                  value={formData.serialnumber ?? ''}
                  onChange={(e) => handleInputChange('serialnumber', e.target.value)}
                  required disabled={submitting}
                />
              </div>
            </div>

            {/* Purchase */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="purchasedate">Purchase Date</Label>
                <Input
                  id="purchasedate" type="date"
                  value={formData.purchasedate ?? ''}
                  onChange={(e) => handleInputChange('purchasedate', e.target.value)}
                  disabled={submitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="purchaseprice">Purchase Price</Label>
                <Input
                  id="purchaseprice" type="number" step="0.01" min="0"
                  value={formData.purchaseprice ?? ''}
                  onChange={(e) => handleInputChange('purchaseprice', e.target.value ? parseFloat(e.target.value) : null)}
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="supplier">Supplier</Label>
                <Input
                  id="supplier"
                  value={formData.supplier ?? ''}
                  onChange={(e) => handleInputChange('supplier', e.target.value)}
                  disabled={submitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="warrantyexpiry">Warranty Expiry Date</Label>
                <Input
                  id="warrantyexpiry" type="date"
                  value={formData.warrantyexpiry ?? ''}
                  onChange={(e) => handleInputChange('warrantyexpiry', e.target.value)}
                  disabled={submitting}
                />
              </div>
            </div>

            {/* Assignment & Location */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="assigneduser">Assigned User</Label>
                <Input
                  id="assigneduser"
                  value={formData.assigneduser ?? ''}
                  onChange={(e) => handleInputChange('assigneduser', e.target.value)}
                  disabled={submitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  key={`status-${formData.status ?? 'empty'}`}
                  value={formData.status ?? ''}
                  onValueChange={(v) => handleInputChange('status', v)}
                  disabled={submitting}
                >
                  <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="assigned">Assigned</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="retired">Retired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Select
                  key={`location-${formData.location ?? 'empty'}`}
                  value={formData.location ?? ''}
                  onValueChange={(v) => handleInputChange('location', v)}
                  disabled={submitting}
                >
                  <SelectTrigger><SelectValue placeholder="Select location" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="clean-room">Clean Room</SelectItem>
                    <SelectItem value="white-room">White Room</SelectItem>
                    <SelectItem value="spd-office">SPD Office</SelectItem>
                    <SelectItem value="it-storage">IT Room</SelectItem>
                    <SelectItem value="warehouse">Warehouse</SelectItem>
                    <SelectItem value="fdb-fan">FDB Fan</SelectItem>
                    <SelectItem value="remote">Remote Location</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Select
                  key={`dept-${formData.department ?? 'empty'}`}
                  value={formData.department ?? ''}
                  onValueChange={(v) => handleInputChange('department', v)}
                  disabled={submitting}
                >
                  <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="engineering">Engineering</SelectItem>
                    <SelectItem value="it">Information Technology</SelectItem>
                    <SelectItem value="production">Productions</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* (ส่วนอื่น ๆ คงเดิม: Technical/Network/Patch/Additional) */}
            {/* … ใส่โค้ดส่วนที่เหลือของคุณต่อจากนี้ (คงเดิมได้เลย) … */}

            <div className="flex justify-end space-x-3 pt-6 border-t">
              <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>Cancel</Button>
              <Button type="submit" disabled={submitting} className={submitting ? 'opacity-50' : ''}>
                <Save className="h-4 w-4 mr-2" />
                {submitting ? 'Saving...' : mode === 'create' ? 'Add Asset' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
