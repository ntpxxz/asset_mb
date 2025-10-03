'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Package, Save, Plus, CheckCircle, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { AssetFormData } from "@/lib/data-store";

type Mode = 'create' | 'edit';
interface Props {
  mode?: Mode;
  initialData?: Partial<AssetFormData> & { id?: string };
  assetId?: string;  
  onSubmit?: (formData: AssetFormData) => Promise<{ success: boolean; error?: string }>;
  onCancel?: () => void;
  onSaved?: (asset: any) => void;
  loading?: boolean;
}

export default function AssetForm({ mode = 'create', initialData, assetId, onSubmit, onCancel, onSaved, loading }: Props) {
  const [formData, setFormData] = useState<AssetFormData>({
    asset_tag: '',
    type: '',
    manufacturer: '',
    model: '',
    serialnumber: '',
    purchasedate: '',
    purchaseprice: null,
    supplier: '',
    warrantyexpiry: '',
    assigneduser: '',
    location: '',
    department: '',
    status: 'available',
    condition: 'good',
    operatingsystem: '',
    processor: '',
    memory: '',
    storage: '',
    hostname: '',
    ipaddress: '',
    macaddress: '',
    patchstatus: 'needs-review',
    lastpatch_check: '',
    isloanable: false,
    description: '',
    notes: '',
    ...(initialData || {}),
  });
  const router = useRouter();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ===== Derived flags for conditional UI (คงโครงสร้างเดิม + เติมเงื่อนไข) =====
  const typeLower = (formData.type || '').toLowerCase();
  const isPC = typeLower === 'desktop' || typeLower === 'laptop' || typeLower === 'pc';

  // กฎจาก form.tsx:
  const hideSpecsSet = new Set(['monitor', 'printer', 'router', 'switch', 'firewall', 'projector']);
  const showOnlyStorage = typeLower === 'storage';
  const hideNetworkSet = new Set(['monitor', 'storage', 'projector']);
  const hidePatchSet = new Set(['monitor', 'storage', 'projector']);

  // ===== Helpers =====
  const handleInputChange = (key: keyof AssetFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const normalizeDate = (v: unknown) => {
    if (!v) return '';
    const s = String(v);
    return s.includes('T') ? s.split('T')[0] : s;
  };

const normalizeNumber = (v: unknown): number | null => {
if (v === '' || v === null || v === undefined) return null;
const n = typeof v === 'number' ? v : Number(String(v).replace(/,/g, ''));
 return Number.isFinite(n) ? n : null;
};



  // ===== Validate (เติม dynamic required) =====
  const validateForm = (): boolean => {
    const missing: string[] = [];

    // พื้นฐาน
    (['type', 'manufacturer', 'model', 'serialnumber'] as Array<keyof AssetFormData>).forEach(
      (k) => {
        const v = (formData as any)[k];
        if (v === undefined || v === null || v === '') missing.push(String(k));
      }
    );

    // Desktop/Laptop ต้องมี CPU + IP
    if (isPC) {
      if (!formData.processor) missing.push('processor (CPU)');
      if (!formData.ipaddress) missing.push('ipaddress (IP Address)');
    }

    if (missing.length) {
      setError(`Please fill in required fields: ${missing.join(', ')}`);
      return false;
    }
    setError(null);
    return true;
  };

  // ===== Submit =====
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
  
    // ถ้ามี onSubmit prop ให้ใช้แทน (สำหรับ edit mode)
    if (onSubmit) {
      setSubmitting(true);
      const result = await onSubmit(formData);
      setSubmitting(false);
      if (!result.success) {
        setError(result.error || 'Failed to save asset');
      }
      return;
    }
  
    // ถ้าไม่มี onSubmit ให้ทำ default behavior (create mode)
    setSubmitting(true);
    setError(null);
  
    const tid = toast.loading("Saving asset...", {
      description: "Writing to database…",
      className: "rounded-2xl border bg-white/90 backdrop-blur shadow-lg",
      duration: 5000,
    });
  
    try {
      const payload: AssetFormData = {
        ...formData,
        purchasedate: normalizeDate(formData.purchasedate),
        warrantyexpiry: normalizeDate(formData.warrantyexpiry),
        lastpatch_check: normalizeDate(formData.lastpatch_check),
        purchaseprice: normalizeNumber(formData.purchaseprice),
      };
  
      const url = mode === 'edit' && assetId ? `/api/assets/${assetId}` : '/api/assets';
      const method = mode === 'edit' ? 'PUT' : 'POST';
  
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({} as any));
      if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`);
  
      toast.success(`Asset ${mode === "create"} successfully`, {
        id: tid,
        description: payload.asset_tag ? `Tag: ${payload.asset_tag}` : undefined,
        icon: "✅",
        className:
          "rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-900 shadow-lg",
        style: { boxShadow: "0 8px 24px rgba(16,185,129,.25)" },
        duration: 2000,
      });
  
      onSaved?.(json.data);
      setTimeout(() => router.push("/assets"), 2100);
  
      if (mode === "create") {
        setFormData((prev) => ({
          ...prev,
          asset_tag: "",
          manufacturer: "",
          model: "",
          serialnumber: "",
          purchasedate: "",
          purchaseprice: "" as any,
          supplier: "",
          warrantyexpiry: "",
          assigneduser: "",
          location: "",
          department: "",
          operatingsystem: "",
          processor: "",
          memory: "",
          storage: "",
          hostname: "",
          ipaddress: "",
          macaddress: "",
          description: "",
          notes: "",
        }));
      }
    } catch (err: any) {
      toast.error("Failed to save asset", {
        id: tid,
        description: err?.message ?? "Please try again.",
        icon: "⚠️",
        className:
          "rounded-2xl border border-rose-200 bg-rose-50 text-rose-900 shadow-lg",
        style: { boxShadow: "0 8px 24px rgba(244,63,94,.25)" },
        duration: 4000,
      });
      setError(err?.message || "Failed to save asset");
    } finally {
      setSubmitting(false);
    }
  };

  // Auto-generate asset_tag เมื่อ create และยังว่าง
  useEffect(() => {
    if (mode === 'create' && !formData.asset_tag) {
      handleInputChange('asset_tag', `AST-${Date.now()}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const Icon = Package;

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Icon className="h-5 w-5" />
            <span>{mode === 'create' ? 'Add Asset' : 'Edit Asset'}</span>
          </CardTitle>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-800 rounded flex items-center space-x-2">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* ===== Basic Information ===== */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="asset_tag">Asset Tag</Label>
                  <Input
                    id="asset_tag"
                    value={formData.asset_tag || ''}
                    onChange={(e) => handleInputChange('asset_tag', e.target.value)}
                    disabled={submitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Asset Type *</Label>
                  <Select
                    value={formData.type || ''}
                    onValueChange={(value) => handleInputChange('type', value)}
                    disabled={submitting}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select asset type" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* options เดิม */}
                      <SelectItem value="laptop">Laptop</SelectItem>
                      <SelectItem value="desktop">Desktop</SelectItem>
                      <SelectItem value="monitor">Monitor</SelectItem>
                      <SelectItem value="printer">Printer</SelectItem>
                      <SelectItem value="phone">Phone</SelectItem>
                      <SelectItem value="tablet">Tablet</SelectItem>
                      <SelectItem value="server">Server</SelectItem>
                      <SelectItem value="router">Router</SelectItem>
                      <SelectItem value="switch">Network Switch</SelectItem>
                      <SelectItem value="storage">Storage</SelectItem>
                      <SelectItem value="projector">Projector</SelectItem>
                      <SelectItem value="firewall">Firewall</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status || 'available'}
                    onValueChange={(value) => handleInputChange('status', value as any)}
                    disabled={submitting}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="assigned">Assigned</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="retired">Retired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="manufacturer">Manufacturer *</Label>
                  <Input
                    id="manufacturer"
                    value={formData.manufacturer || ''}
                    onChange={(e) => handleInputChange('manufacturer', e.target.value)}
                    disabled={submitting}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model">Model *</Label>
                  <Input
                    id="model"
                    value={formData.model || ''}
                    onChange={(e) => handleInputChange('model', e.target.value)}
                    disabled={submitting}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="serialnumber">Serial Number *</Label>
                  <Input
                    id="serialnumber"
                    value={formData.serialnumber || ''}
                    onChange={(e) => handleInputChange('serialnumber', e.target.value)}
                    disabled={submitting}
                    required
                  />
                </div>
              </div>
            </div>

            {/* ===== Assignment & Location ===== */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Assignment & Location</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="assigneduser">Assigned To</Label>
                  <Input
                    id="assigneduser"
                    placeholder="firstname or employee_id"
                    value={formData.assigneduser || ''}
                    onChange={(e) => handleInputChange('assigneduser', e.target.value)}
                    disabled={submitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location || ''}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    disabled={submitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    value={formData.department || ''}
                    onChange={(e) => handleInputChange('department', e.target.value)}
                    disabled={submitting}
                  />
                </div>
              </div>
            </div>

            {/* ===== Purchase & Warranty ===== */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Purchase & Warranty</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="purchasedate">Purchase Date</Label>
                  <Input
                    id="purchasedate"
                    type="date"
                    value={formData.purchasedate || ''}
                    onChange={(e) => handleInputChange('purchasedate', e.target.value)}
                    disabled={submitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="purchaseprice">Purchase Price</Label>
                  <Input
                    id="purchaseprice"
                    type="number"
                    step="0.01"
                    placeholder="e.g., 1200.00"
                    value={formData.purchaseprice ?? ''}
                   onChange={(e) => handleInputChange('purchaseprice', normalizeNumber(e.target.value))}
                    disabled={submitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supplier">Supplier</Label>
                  <Input
                    id="supplier"
                    value={formData.supplier || ''}
                    onChange={(e) => handleInputChange('supplier', e.target.value)}
                    disabled={submitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="warrantyexpiry">Warranty Expiry</Label>
                  <Input
                    id="warrantyexpiry"
                    type="date"
                    value={formData.warrantyexpiry || ''}
                    onChange={(e) => handleInputChange('warrantyexpiry', e.target.value)}
                    disabled={submitting}
                  />
                </div>
              </div>
            </div>

            {/* ===== Technical Specifications (conditional) ===== */}
            {(() => {
              if (showOnlyStorage) {
                return (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Technical Specifications</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="storage">Storage</Label>
                        <Input
                          id="storage"
                          placeholder="e.g., 12TB NAS, 4x3TB RAID5"
                          value={formData.storage || ''}
                          onChange={(e) => handleInputChange('storage', e.target.value)}
                          disabled={submitting}
                        />
                      </div>
                    </div>
                  </div>
                );
              }
              if (hideSpecsSet.has(typeLower)) return null;

              return (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Technical Specifications</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="operatingsystem">Operating System</Label>
                      <Input
                        id="operatingsystem"
                        placeholder="e.g., Windows 11 Pro, macOS Ventura"
                        value={formData.operatingsystem || ''}
                        onChange={(e) => handleInputChange('operatingsystem', e.target.value)}
                        disabled={submitting}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="processor">
                        CPU / Processor {isPC && <span className="text-red-600">*</span>}
                      </Label>
                      <Input
                        id="processor"
                        placeholder="e.g., Intel i7-12700, Apple M2 Pro"
                        value={formData.processor || ''}
                        onChange={(e) => handleInputChange('processor', e.target.value)}
                        disabled={submitting}
                        required={isPC}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="memory">Memory (RAM)</Label>
                      <Input
                        id="memory"
                        placeholder="e.g., 16GB DDR4, 32GB"
                        value={formData.memory || ''}
                        onChange={(e) => handleInputChange('memory', e.target.value)}
                        disabled={submitting}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="storage">Storage</Label>
                      <Input
                        id="storage"
                        placeholder="e.g., 512GB SSD, 1TB NVMe"
                        value={formData.storage || ''}
                        onChange={(e) => handleInputChange('storage', e.target.value)}
                        disabled={submitting}
                      />
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* ===== Network Information (conditional) ===== */}
            {!hideNetworkSet.has(typeLower) && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Network Information</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="hostname">Hostname</Label>
                    <Input
                      id="hostname"
                      placeholder="e.g., LAPTOP-001, DESK-ENG-05"
                      value={formData.hostname || ''}
                      onChange={(e) => handleInputChange('hostname', e.target.value)}
                      disabled={submitting}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ipaddress">
                      IP Address {isPC && <span className="text-red-600">*</span>}
                    </Label>
                    <Input
                      id="ipaddress"
                      placeholder="e.g., 192.168.1.100"
                      value={formData.ipaddress || ''}
                      onChange={(e) => handleInputChange('ipaddress', e.target.value)}
                      disabled={submitting}
                      required={isPC}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="macaddress">MAC Address</Label>
                    <Input
                      id="macaddress"
                      placeholder="e.g., 00:1B:44:11:3A:B7"
                      value={formData.macaddress || ''}
                      onChange={(e) => handleInputChange('macaddress', e.target.value)}
                      disabled={submitting}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ===== Patch Management (conditional) ===== */}
            {!hidePatchSet.has(typeLower) && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Patch Management</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="patchstatus">Patch Status</Label>
                    <Select
                      value={formData.patchstatus || ''}
                      onValueChange={(value) => handleInputChange('patchstatus', value as any)}
                      disabled={submitting}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select patch status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="up-to-date">Up-to-Date</SelectItem>
                        <SelectItem value="needs-review">Needs Review</SelectItem>
                        <SelectItem value="update-pending">Update Pending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastpatch_check">Last Patch Check Date</Label>
                    <Input
                      id="lastpatch_check"
                      type="date"
                      value={formData.lastpatch_check || ''}
                      onChange={(e) => handleInputChange('lastpatch_check', e.target.value)}
                      disabled={submitting}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ===== Additional Information ===== */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Additional Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="condition">Condition</Label>
                  <Select
                    value={formData.condition || 'good'}
                    onValueChange={(value) => handleInputChange('condition', value as any)}
                    disabled={submitting}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select condition" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="fair">Fair</SelectItem>
                      <SelectItem value="poor">Poor</SelectItem>
                      <SelectItem value="broken">Broken</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="isloanable">Loanable</Label>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isloanable"
                      checked={!!formData.isloanable}
                      onCheckedChange={(v) => handleInputChange('isloanable', !!v)}
                      disabled={submitting}
                    />
                    <span className="text-sm text-gray-600">Available for loan</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  rows={3}
                  placeholder="Optional description"
                  value={formData.description || ''}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  disabled={submitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  rows={3}
                  placeholder="Optional notes"
                  value={formData.notes || ''}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  disabled={submitting}
                />
              </div>
            </div>

            {/* ===== Actions ===== */}
            <div className="flex items-center justify-end space-x-2">
  {onCancel && (
    <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
      Cancel
    </Button>
  )}
  <Button type="submit" disabled={submitting || loading}>
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

// เผื่อกรณี import แบบ named
export { AssetForm };
