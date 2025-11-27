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
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Package, Save, AlertCircle } from 'lucide-react';
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

  // ===== Logic แยกประเภท =====
  const typeLower = (formData.type || '').toLowerCase();

  // กลุ่มประเภท
  const computerTypes = new Set(['laptop', 'desktop', 'server', 'workstation', 'tablet']);
  const networkTypes = new Set(['router', 'switch', 'firewall', 'access-point', 'gateway']);
  // const peripheralTypes = new Set(['monitor', 'printer', 'projector', 'scanner']);

  const isComputer = computerTypes.has(typeLower);
  const isNetwork = networkTypes.has(typeLower);

  // Logic การแสดงผลฟิลด์
  // Computer: แสดง Specs + Network
  // Network: แสดง Network (Specs อาจจะไม่จำเป็นมาก หรือแสดงแค่บางส่วน)
  // Other: ซ่อน Specs/Network

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

  // ===== Validate =====
  const validateForm = (): boolean => {
    const missing: string[] = [];

    // ฟิลด์บังคับพื้นฐาน
    (['type', 'manufacturer', 'model', 'serialnumber'] as Array<keyof AssetFormData>).forEach(
      (k) => {
        const v = (formData as any)[k];
        if (v === undefined || v === null || v === '') missing.push(String(k));
      }
    );

    // เงื่อนไขเฉพาะประเภท
    if (isComputer) {
      // Computer ควรมี Spec พื้นฐาน แต่บางทีอาจจะยังไม่ใส่ก็ได้ ปล่อยผ่านแต่แจ้งเตือน optional ได้
      // ถ้าต้องการบังคับ:
      // if (!formData.processor) missing.push('processor');
    }

    if (isNetwork) {
      // Network อุปกรณ์ network ควรมี IP หรือ MAC อย่างน้อย
      // if (!formData.ipaddress && !formData.macaddress) missing.push('IP Address or MAC Address');
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

    if (onSubmit) {
      setSubmitting(true);
      const result = await onSubmit(formData);
      setSubmitting(false);
      if (!result.success) setError(result.error || 'Failed to save asset');
      return;
    }

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

      toast.success(`Asset ${mode === "create" ? 'created' : 'updated'} successfully`, {
        id: tid,
        description: payload.asset_tag ? `Tag: ${payload.asset_tag}` : undefined,
        icon: "✅",
        className: "rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-900 shadow-lg",
        duration: 2000,
      });

      onSaved?.(json.data);
      setTimeout(() => router.push("/assets"), 2100);

      if (mode === "create") {
        // Reset form
        setFormData(prev => ({
          ...prev,
          asset_tag: "", manufacturer: "", model: "", serialnumber: "",
          // reset other fields...
          description: "", notes: ""
        }));
      }
    } catch (err: any) {
      toast.error("Failed to save asset", {
        id: tid,
        description: err?.message ?? "Please try again.",
        icon: "⚠️",
        className: "rounded-2xl border border-rose-200 bg-rose-50 text-rose-900 shadow-lg",
        duration: 4000,
      });
      setError(err?.message || "Failed to save asset");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (mode === 'create' && !formData.asset_tag) {
      handleInputChange('asset_tag', `AST-${Date.now()}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const Icon = Package;

  return (
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
          {/* 1. Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Asset Type *</Label>
                <Select
                  value={formData.type || ''}
                  onValueChange={(value) => handleInputChange('type', value)}
                  disabled={submitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Computer</SelectLabel>
                      <SelectItem value="laptop">Laptop</SelectItem>
                      <SelectItem value="desktop">Desktop</SelectItem>
                      <SelectItem value="server">Server</SelectItem>
                      <SelectItem value="tablet">Tablet</SelectItem>
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel>Network</SelectLabel>
                      <SelectItem value="router">Router</SelectItem>
                      <SelectItem value="switch">Switch</SelectItem>
                      <SelectItem value="firewall">Firewall</SelectItem>
                      <SelectItem value="access-point">Access Point</SelectItem>
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel>Peripherals & Others</SelectLabel>
                      <SelectItem value="monitor">Monitor</SelectItem>
                      <SelectItem value="printer">Printer</SelectItem>
                      <SelectItem value="projector">Projector</SelectItem>
                      <SelectItem value="storage">Storage</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

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

          {/* 2. Technical Specs (แสดงเฉพาะ Computer และบางส่วนของ Network) */}
          {(isComputer || isNetwork) && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {isNetwork ? "Network Specifications" : "Technical Specifications"}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* OS / Firmware - ใช้ร่วมกัน */}
                <div className="space-y-2">
                  <Label htmlFor="operatingsystem">{isNetwork ? 'Firmware / OS' : 'Operating System'}</Label>
                  <Input
                    id="operatingsystem"
                    placeholder={isNetwork ? "e.g., IOS 15, RouterOS" : "e.g., Windows 11, macOS"}
                    value={formData.operatingsystem || ''}
                    onChange={(e) => handleInputChange('operatingsystem', e.target.value)}
                    disabled={submitting}
                  />
                </div>

                {/* CPU - เฉพาะ Computer */}
                {isComputer && (
                  <div className="space-y-2">
                    <Label htmlFor="processor">CPU / Processor</Label>
                    <Input
                      id="processor"
                      placeholder="e.g., Intel Core i7"
                      value={formData.processor || ''}
                      onChange={(e) => handleInputChange('processor', e.target.value)}
                      disabled={submitting}
                    />
                  </div>
                )}
              </div>

              {/* Memory & Storage - เฉพาะ Computer หรือถ้า Network จำเป็นก็เพิ่มได้ */}
              {isComputer && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="memory">Memory (RAM)</Label>
                    <Input
                      id="memory"
                      placeholder="e.g., 16GB"
                      value={formData.memory || ''}
                      onChange={(e) => handleInputChange('memory', e.target.value)}
                      disabled={submitting}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="storage">Storage</Label>
                    <Input
                      id="storage"
                      placeholder="e.g., 512GB SSD"
                      value={formData.storage || ''}
                      onChange={(e) => handleInputChange('storage', e.target.value)}
                      disabled={submitting}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 3. Network Information (แสดงทั้ง Computer และ Network Equipment) */}
          {(isComputer || isNetwork) && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Network Configuration</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hostname">Hostname</Label>
                  <Input
                    id="hostname"
                    value={formData.hostname || ''}
                    onChange={(e) => handleInputChange('hostname', e.target.value)}
                    disabled={submitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ipaddress">IP Address</Label>
                  <Input
                    id="ipaddress"
                    value={formData.ipaddress || ''}
                    onChange={(e) => handleInputChange('ipaddress', e.target.value)}
                    disabled={submitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="macaddress">MAC Address</Label>
                  <Input
                    id="macaddress"
                    value={formData.macaddress || ''}
                    onChange={(e) => handleInputChange('macaddress', e.target.value)}
                    disabled={submitting}
                  />
                </div>
              </div>
            </div>
          )}

          {/* 4. Assignment & Purchase (ทุกประเภทมีเหมือนกัน) */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Assignment & Location</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="assigneduser">Assigned To (Employee ID)</Label>
                <Input
                  id="assigneduser"
                  placeholder="e.g., EMP-123"
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
                <Label htmlFor="purchaseprice">Price</Label>
                <Input
                  id="purchaseprice"
                  type="number"
                  step="0.01"
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

          {/* 5. Additional Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Additional Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  rows={3}
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
                  value={formData.notes || ''}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  disabled={submitting}
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isloanable"
                checked={!!formData.isloanable}
                onCheckedChange={(v) => handleInputChange('isloanable', !!v)}
                disabled={submitting}
              />
              <Label htmlFor="isloanable">Available for loan (Borrowable)</Label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-2 pt-4 border-t">
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
  );
}

export { AssetForm };