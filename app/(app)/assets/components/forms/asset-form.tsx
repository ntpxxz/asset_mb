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
  category?: 'computer' | 'network';
}

export default function AssetForm({ mode = 'create', initialData, assetId, onSubmit, onCancel, onSaved, loading, category }: Props) {
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
    // New fields from spreadsheet
    building: '',
    division: '',
    section: '',
    area: '',
    pc_name: '',
    os_key: '',
    os_version: '',
    ms_office_apps: '',
    ms_office_version: '',
    is_legally_purchased: '',
    ...(initialData || {}),
  });
  const router = useRouter();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ===== Logic แยกประเภท =====
  const typeLower = (formData.type || '').toLowerCase();

  // กลุ่มประเภท
  const computerTypes = new Set(['laptop', 'desktop', 'server', 'workstation', 'tablet', 'pc']);
  const networkTypes = new Set(['router', 'switch', 'firewall', 'access-point', 'gateway']);

  const isComputer = computerTypes.has(typeLower);
  const isNetwork = networkTypes.has(typeLower);

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
      const redirectPath = category ? `/assets/${category}` : "/assets";
      setTimeout(() => router.push(redirectPath), 2100);

      if (mode === "create") {
        setFormData(prev => ({
          ...prev,
          asset_tag: "", manufacturer: "", model: "", serialnumber: "",
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
          <span>{mode === 'create' ? 'Add Asset (เพิ่มทรัพย์สิน)' : 'Edit Asset (แก้ไขทรัพย์สิน)'}</span>
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
          {/* 1. Location & Organization */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Location & Organization (ที่ตั้งและหน่วยงาน)</h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="building">Building or Factory (อาคารหรือโรงงาน)</Label>
                <Input
                  id="building"
                  placeholder="เช่น Spindle Assembly"
                  value={formData.building || ''}
                  onChange={(e) => handleInputChange('building', e.target.value)}
                  disabled={submitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="division">Division (ฝ่าย)</Label>
                <Input
                  id="division"
                  placeholder="เช่น Production"
                  value={formData.division || ''}
                  onChange={(e) => handleInputChange('division', e.target.value)}
                  disabled={submitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="section">Section (แผนก)</Label>
                <Input
                  id="section"
                  placeholder="เช่น Big Office"
                  value={formData.section || ''}
                  onChange={(e) => handleInputChange('section', e.target.value)}
                  disabled={submitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="area">Area (พื้นที่)</Label>
                <Input
                  id="area"
                  placeholder="เช่น CALL_02"
                  value={formData.area || ''}
                  onChange={(e) => handleInputChange('area', e.target.value)}
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pc_name">PC Name (ชื่อเครื่อง)</Label>
                <Input
                  id="pc_name"
                  placeholder="เช่น BAS-999"
                  value={formData.pc_name || ''}
                  onChange={(e) => handleInputChange('pc_name', e.target.value)}
                  disabled={submitting}
                />
              </div>
            </div>
          </div>

          {/* 2. Basic Hardware Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Hardware Information (ข้อมูลฮาร์ดแวร์)</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type (ประเภท) *</Label>
                <Select
                  value={formData.type || ''}
                  onValueChange={(value) => handleInputChange('type', value)}
                  disabled={submitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกประเภท" />
                  </SelectTrigger>
                  <SelectContent>
                    {(!category || category === 'computer') && (
                      <SelectGroup>
                        <SelectLabel>Computer</SelectLabel>
                        <SelectItem value="pc">PC</SelectItem>
                        <SelectItem value="laptop">Laptop / NB</SelectItem>
                        <SelectItem value="desktop">Desktop</SelectItem>
                        <SelectItem value="server">Server</SelectItem>
                        <SelectItem value="tablet">Tablet</SelectItem>
                      </SelectGroup>
                    )}
                    {(!category || category === 'network') && (
                      <SelectGroup>
                        <SelectLabel>Network</SelectLabel>
                        <SelectItem value="router">Router</SelectItem>
                        <SelectItem value="switch">Switch</SelectItem>
                        <SelectItem value="firewall">Firewall</SelectItem>
                        <SelectItem value="access-point">Access Point</SelectItem>
                      </SelectGroup>
                    )}
                    {!category && (
                      <SelectGroup>
                        <SelectLabel>Peripherals & Others</SelectLabel>
                        <SelectItem value="monitor">Monitor</SelectItem>
                        <SelectItem value="printer">Printer</SelectItem>
                        <SelectItem value="projector">Projector</SelectItem>
                        <SelectItem value="storage">Storage</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectGroup>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="manufacturer">Maker (ยี่ห้อ) *</Label>
                <Input
                  id="manufacturer"
                  placeholder="เช่น Lenovo, Dell, HP"
                  value={formData.manufacturer || ''}
                  onChange={(e) => handleInputChange('manufacturer', e.target.value)}
                  disabled={submitting}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="model">Model (รุ่น) *</Label>
                <Input
                  id="model"
                  placeholder="เช่น Lenovo 105X"
                  value={formData.model || ''}
                  onChange={(e) => handleInputChange('model', e.target.value)}
                  disabled={submitting}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="serialnumber">Serial Number (หมายเลขซีเรียล) *</Label>
                <Input
                  id="serialnumber"
                  placeholder="เช่น NXB7-SB17-4X2F-8ZTM"
                  value={formData.serialnumber || ''}
                  onChange={(e) => handleInputChange('serialnumber', e.target.value)}
                  disabled={submitting}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="assigneduser">User Owner (ผู้ใช้งาน)</Label>
                <Input
                  id="assigneduser"
                  placeholder="ชื่อผู้ใช้งาน"
                  value={formData.assigneduser || ''}
                  onChange={(e) => handleInputChange('assigneduser', e.target.value)}
                  disabled={submitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status (สถานะ)</Label>
                <Select
                  value={formData.status || 'available'}
                  onValueChange={(value) => handleInputChange('status', value as any)}
                  disabled={submitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกสถานะ" />
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
          </div>

          {/* 3. Operating System & Software */}
          {isComputer && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Operating System & Software (ระบบปฏิบัติการและซอ

                ฟต์แวร์)</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="operatingsystem">Operating System (OS) (ระบบปฏิบัติการ)</Label>
                  <Input
                    id="operatingsystem"
                    placeholder="เช่น Win10, Win11"
                    value={formData.operatingsystem || ''}
                    onChange={(e) => handleInputChange('operatingsystem', e.target.value)}
                    disabled={submitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="os_version">Window Ver (เวอร์ชัน Windows)</Label>
                  <Input
                    id="os_version"
                    placeholder="เช่น Win10, Win11"
                    value={formData.os_version || ''}
                    onChange={(e) => handleInputChange('os_version', e.target.value)}
                    disabled={submitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="os_key">Key (รหัสลิขสิทธิ์ Windows)</Label>
                  <Input
                    id="os_key"
                    placeholder="เช่น Free, XXXXX-XXXXX-XXXXX"
                    value={formData.os_key || ''}
                    onChange={(e) => handleInputChange('os_key', e.target.value)}
                    disabled={submitting}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ms_office_apps">MS Office (แอปพลิเคชัน)</Label>
                  <Input
                    id="ms_office_apps"
                    placeholder="เช่น Excel,PowerPoint,Word"
                    value={formData.ms_office_apps || ''}
                    onChange={(e) => handleInputChange('ms_office_apps', e.target.value)}
                    disabled={submitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ms_office_version">Version (เวอร์ชัน MS Office)</Label>
                  <Input
                    id="ms_office_version"
                    placeholder="เช่น 2013, 2007"
                    value={formData.ms_office_version || ''}
                    onChange={(e) => handleInputChange('ms_office_version', e.target.value)}
                    disabled={submitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="is_legally_purchased">Legally Purchased (ซื้อถูกต้องตามกฎหมาย)</Label>
                  <Select
                    value={formData.is_legally_purchased || ''}
                    onValueChange={(value) => handleInputChange('is_legally_purchased', value)}
                    disabled={submitting}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="เลือก" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes (ใช่)</SelectItem>
                      <SelectItem value="no">No (ไม่ใช่)</SelectItem>
                      <SelectItem value="unknown">Unknown (ไม่ทราบ)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* 4. Technical Specs (for computers) */}
          {isComputer && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Technical Specifications (ข้อมูลทางเทคนิค)</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="processor">CPU / Processor (หน่วยประมวลผล)</Label>
                  <Input
                    id="processor"
                    placeholder="เช่น Intel Core i7"
                    value={formData.processor || ''}
                    onChange={(e) => handleInputChange('processor', e.target.value)}
                    disabled={submitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="memory">Memory (RAM) (หน่วยความจำ)</Label>
                  <Input
                    id="memory"
                    placeholder="เช่น 16GB"
                    value={formData.memory || ''}
                    onChange={(e) => handleInputChange('memory', e.target.value)}
                    disabled={submitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="storage">Storage (พื้นที่จัดเก็บ)</Label>
                  <Input
                    id="storage"
                    placeholder="เช่น 512GB SSD"
                    value={formData.storage || ''}
                    onChange={(e) => handleInputChange('storage', e.target.value)}
                    disabled={submitting}
                  />
                </div>
              </div>
            </div>
          )}

          {/* 5. Network Information (for both computer and network) */}
          {(isComputer || isNetwork) && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Network Configuration (การตั้งค่าเครือข่าย)</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hostname">Hostname (ชื่อเครื่อง)</Label>
                  <Input
                    id="hostname"
                    value={formData.hostname || ''}
                    onChange={(e) => handleInputChange('hostname', e.target.value)}
                    disabled={submitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ipaddress">IP Address (ที่อยู่ IP)</Label>
                  <Input
                    id="ipaddress"
                    value={formData.ipaddress || ''}
                    onChange={(e) => handleInputChange('ipaddress', e.target.value)}
                    disabled={submitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="macaddress">MAC Address (ที่อยู่ MAC)</Label>
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

          {/* 6. Purchase & Warranty */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Purchase & Warranty (การจัดซื้อและประกัน)</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="purchasedate">Purchase Date (วันที่ซื้อ)</Label>
                <Input
                  id="purchasedate"
                  type="date"
                  value={formData.purchasedate || ''}
                  onChange={(e) => handleInputChange('purchasedate', e.target.value)}
                  disabled={submitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="purchaseprice">Price (ราคา)</Label>
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
                <Label htmlFor="supplier">Supplier (ผู้จัดจำหน่าย)</Label>
                <Input
                  id="supplier"
                  value={formData.supplier || ''}
                  onChange={(e) => handleInputChange('supplier', e.target.value)}
                  disabled={submitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="warrantyexpiry">Warranty Expiry (วันหมดประกัน)</Label>
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

          {/* 7. Additional Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Additional Information (ข้อมูลเพิ่มเติม)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="description">Description (รายละเอียด)</Label>
                <Textarea
                  id="description"
                  rows={3}
                  value={formData.description || ''}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  disabled={submitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (หมายเหตุ)</Label>
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
              <Label htmlFor="isloanable">Available for loan (สามารถยืมได้)</Label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-2 pt-4 border-t">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
                Cancel (ยกเลิก)
              </Button>
            )}
            <Button type="submit" disabled={submitting || loading}>
              <Save className="h-4 w-4 mr-2" />
              {submitting ? 'Saving... (กำลังบันทึก)' : mode === 'create' ? 'Add Asset (เพิ่มทรัพย์สิน)' : 'Save Changes (บันทึกการเปลี่ยนแปลง)'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export { AssetForm };