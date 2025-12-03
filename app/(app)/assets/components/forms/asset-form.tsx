'use client';

import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Package, Save, AlertCircle, MapPin, Monitor, ShieldCheck,
  Receipt, RefreshCw, Cpu, Network, Server, Info
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { AssetFormData } from "@/lib/data-store";
import { Separator } from '@radix-ui/react-dropdown-menu';
import { useI18n } from '@/lib/i18n-context';

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

export function AssetForm({ mode = 'create', initialData, assetId, onSubmit, onCancel, onSaved, loading, category }: Props) {
  const router = useRouter();
  const { t } = useI18n();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});

  const [formData, setFormData] = useState<AssetFormData>({
    asset_tag: '',
    serialnumber: '',
    type: '',
    manufacturer: '',
    model: '',
    status: 'available',
    condition: 'good',
    image_url: null,
    assigneduser: '',
    location: '',
    building: '',
    division: '',
    section: '',
    area: '',
    department: '',
    pc_name: '',
    hostname: '',
    ipaddress: '',
    macaddress: '',
    processor: '',
    memory: '',
    storage: '',
    operatingsystem: '',
    os_version: '',
    os_key: '',
    ms_office_apps: '',
    ms_office_version: '',
    is_legally_purchased: 'unknown',
    purchasedate: '',
    purchaseprice: null,
    supplier: '',
    warrantyexpiry: '',
    patchstatus: 'needs-review',
    lastpatch_check: '',
    isloanable: false,
    description: '',
    notes: '',
    ...(initialData || {}),
  });

  const showComputerOptions = !category || category === 'computer';
  const showNetworkOptions = !category || category === 'network';
  const showPeripheralOptions = !category || category === 'computer';

  const isComputer = useMemo(() => {
    const t = (formData.type || '').toLowerCase();
    if (category === 'computer' && !t) return true;
    return ['laptop', 'desktop', 'server', 'workstation', 'pc', 'notebook', 'all-in-one', 'aio', 'computer', 'mac', 'tablet'].includes(t);
  }, [formData.type, category]);

  const isNetwork = useMemo(() => {
    const t = (formData.type || '').toLowerCase();
    if (category === 'network' && !t) return true;
    return ['router', 'switch', 'firewall', 'access-point', 'gateway', 'modem'].includes(t);
  }, [formData.type, category]);

  const handleInputChange = (key: keyof AssetFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (fieldErrors[key]) setFieldErrors(prev => ({ ...prev, [key]: false }));
  };

  const normalizeNumber = (v: unknown): number | null => {
    if (v === '' || v === null || v === undefined) return null;
    const n = typeof v === 'number' ? v : Number(String(v).replace(/,/g, ''));
    return Number.isFinite(n) ? n : null;
  };

  const validateForm = (): boolean => {
    const errors: Record<string, boolean> = {};
    let hasError = false;
    const requiredFields = ['type', 'manufacturer', 'model', 'serialnumber', 'asset_tag'];

    requiredFields.forEach((k) => {
      // @ts-ignore
      if (!formData[k] || String(formData[k]).trim() === '') {
        errors[k] = true;
        hasError = true;
      }
    });

    setFieldErrors(errors);
    if (hasError) {
      setError(t('requiredFields'));
      toast.error(t('validationError'), { description: t('checkFields') });
      return false;
    }
    setError(null);
    return true;
  };

  const handleGenerateTag = () => {
    const prefix = category === 'network' ? "NET" : "AST";
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    handleInputChange('asset_tag', `${prefix}-${timestamp}${random}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    const tid = toast.loading(t('saving'));

    try {
      const payload = {
        ...formData,
        purchaseprice: normalizeNumber(formData.purchaseprice),
        purchasedate: formData.purchasedate || null,
        warrantyexpiry: formData.warrantyexpiry || null,
        lastpatch_check: formData.lastpatch_check || null,
      };

      if (onSubmit) {
        const res = await onSubmit(payload);
        if (!res.success) throw new Error(res.error);
        setSubmitting(false);
        return;
      }

      const url = mode === 'edit' && assetId ? `/api/assets/${assetId}` : '/api/assets';
      const method = mode === 'edit' ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (!res.ok) throw new Error(json.error || t('saveFailed'));

      toast.success(t('savedSuccess'), { id: tid });
      onSaved?.(json.data);
      setTimeout(() => router.back(), 1000);

    } catch (err: any) {
      toast.error(t('saveFailed'), { id: tid, description: err.message });
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (mode === 'create') {
      if (!formData.asset_tag) handleGenerateTag();
      if (!formData.type && category) {
        if (category === 'computer') handleInputChange('type', 'laptop');
        if (category === 'network') handleInputChange('type', 'switch');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, category]);

  const FormIcon = category === 'network' ? Network : (category === 'computer' ? Monitor : Package);
  const formTitle = category === 'network' ? t('deviceName') : (category === 'computer' ? t('computerName') : t('assetName'));

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-8xl mx-auto space-y-8 pb-24">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-md flex items-center gap-2">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* --- 1. General Information (Combined Identity & Status) --- */}
      <Card className="shadow-sm">
        <CardHeader className="pb-4 border-b bg-gray-50/50">
          <CardTitle className="flex items-center gap-2 text-primary">
            <FormIcon className="h-5 w-5" />
            {formTitle}
          </CardTitle>
          <CardDescription>{t('description')}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 pt-6">
          {/* Row 1: Tag, Type, Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="asset_tag" className="after:content-['*'] after:ml-0.5 after:text-red-500">{t('pcName')}</Label>
              <div className="flex gap-2">
                <Input
                  id="asset_tag"
                  value={formData.asset_tag}
                  onChange={(e) => handleInputChange('asset_tag', e.target.value)}
                  className={`font-mono font-medium ${fieldErrors.asset_tag ? "border-red-500" : ""}`}
                />
                <Button type="button" variant="outline" size="icon" onClick={handleGenerateTag} title={t('generateReport')}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type" className="after:content-['*'] after:ml-0.5 after:text-red-500">{t('type')}</Label>
              <Select value={formData.type} onValueChange={(v) => handleInputChange('type', v)}>
                <SelectTrigger className={fieldErrors.type ? "border-red-500" : ""}><SelectValue placeholder={t('selectType')} /></SelectTrigger>
                <SelectContent>
                  {showComputerOptions && (
                    <SelectGroup>
                      <SelectLabel>{t('computerAssets')}</SelectLabel>
                      <SelectItem value="laptop">{t('laptop')}</SelectItem>
                      <SelectItem value="desktop">{t('desktop')}</SelectItem>
                      <SelectItem value="workstation">Workstation</SelectItem>
                      <SelectItem value="server">{t('server')}</SelectItem>
                      <SelectItem value="tablet">{t('tablet')}</SelectItem>
                    </SelectGroup>
                  )}
                  {showNetworkOptions && (
                    <SelectGroup>
                      <SelectLabel>{t('networkAssets')}</SelectLabel>
                      <SelectItem value="router">{t('router')}</SelectItem>
                      <SelectItem value="switch">{t('networkSwitch')}</SelectItem>
                      <SelectItem value="firewall">Firewall</SelectItem>
                      <SelectItem value="access-point">Access Point</SelectItem>
                    </SelectGroup>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">{t('status')}</Label>
              <Select value={formData.status} onValueChange={(v) => handleInputChange('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">🟢 {t('available')}</SelectItem>
                  <SelectItem value="assigned">🔵 {t('assigned')}</SelectItem>
                  <SelectItem value="maintenance">🟠 {t('maintenance')}</SelectItem>
                  <SelectItem value="retired">⚫ {t('retired')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 2: Manufacturer, Model, Serial */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="manufacturer" className="after:content-['*'] after:ml-0.5 after:text-red-500">{t('manufacturer')}</Label>
              <Input
                id="manufacturer"
                value={formData.manufacturer}
                onChange={(e) => handleInputChange('manufacturer', e.target.value)}
                placeholder="e.g. Dell"
                className={fieldErrors.manufacturer ? "border-red-500" : ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="model" className="after:content-['*'] after:ml-0.5 after:text-red-500">{t('model')}</Label>
              <Input
                id="model"
                value={formData.model}
                onChange={(e) => handleInputChange('model', e.target.value)}
                placeholder="e.g. Latitude 5420"
                className={fieldErrors.model ? "border-red-500" : ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="serialnumber" className="after:content-['*'] after:ml-0.5 after:text-red-500">{t('serialNumber')}</Label>
              <Input
                id="serialnumber"
                value={formData.serialnumber}
                onChange={(e) => handleInputChange('serialnumber', e.target.value)}
                placeholder="Unique S/N"
                className={fieldErrors.serialnumber ? "border-red-500" : ""}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* --- 2. Location & Assignment --- */}
      <Card className="shadow-sm">
        <CardHeader className="pb-4 border-b bg-gray-50/50">
          <CardTitle className="flex items-center gap-2 text-base text-orange-600">
            <MapPin className="h-5 w-5" /> {t('locationAssignment')}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="assigneduser">{t('assignedUser')}</Label>
              <Input
                id="assigneduser"
                value={formData.assigneduser || ''}
                onChange={(e) => handleInputChange('assigneduser', e.target.value)}
                placeholder={t('usernamePlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="building">{t('building')}</Label>
              <Input id="building" value={formData.building || ''} onChange={(e) => handleInputChange('building', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="division">{t('division')}</Label>
              <Input id="division" value={formData.division || ''} onChange={(e) => handleInputChange('division', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">{t('department')}</Label>
              <Input id="department" value={formData.department || ''} onChange={(e) => handleInputChange('department', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">{t('location')}</Label>
              <Input id="location" value={formData.location || ''} onChange={(e) => handleInputChange('location', e.target.value)} placeholder="e.g. Server Room" />
            </div>
          </div>
        </CardContent>
      </Card>

      {(isComputer || isNetwork) && (
        <Card className="shadow-sm">
          <CardHeader className="pb-4 border-b bg-gray-50/50">
            <CardTitle className="flex items-center gap-2 text-base text-slate-800">
              {isNetwork ? <Server className="h-5 w-5" /> : <Cpu className="h-5 w-5" />}
              {isNetwork ? t('deviceConfiguration') : t('systemSpecifications')}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6 pt-6">

            {/* A. Hardware (Computers Only) */}
            {isComputer && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <Cpu className="h-4 w-4" /> {t('hardware')}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label>{t('processor')}</Label>
                    <Input value={formData.processor || ''} onChange={(e) => handleInputChange('processor', e.target.value)} placeholder="e.g. i7-12700" />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('memory')}</Label>
                    <Input value={formData.memory || ''} onChange={(e) => handleInputChange('memory', e.target.value)} placeholder="e.g. 16GB" />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('storage')}</Label>
                    <Input value={formData.storage || ''} onChange={(e) => handleInputChange('storage', e.target.value)} placeholder="e.g. 512GB SSD" />
                  </div>
                </div>
                <Separator />
              </div>
            )}

            {/* B. Software (Computers Only) */}
            {isComputer && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <ShieldCheck className="h-4 w-4" /> {t('softwareLicense')}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>{t('osUsage')}</Label>
                    <Input value={formData.operatingsystem || ''} onChange={(e) => handleInputChange('operatingsystem', e.target.value)} placeholder="e.g. Windows 11" />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('osVersion')}</Label>
                    <Input value={formData.os_version || ''} onChange={(e) => handleInputChange('os_version', e.target.value)} placeholder="e.g. win11" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{t('productKey')}</Label>
                  <Input value={formData.os_key || ''} onChange={(e) => handleInputChange('os_key', e.target.value)} className="font-mono text-sm" placeholder="XXXXX-XXXXX-XXXXX-XXXXX" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>{t('officeVersion')}</Label>
                    <Input value={formData.ms_office_version || ''} onChange={(e) => handleInputChange('ms_office_version', e.target.value)} placeholder="e.g. Office 2021" />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('legallyPurchased')}</Label>
                    <Select value={formData.is_legally_purchased || 'unknown'} onValueChange={(v) => handleInputChange('is_legally_purchased', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">{t('yes')}</SelectItem>
                        <SelectItem value="no">{t('no')}</SelectItem>
                        <SelectItem value="unknown">{t('unknown')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Separator />
              </div>
            )}

            {/* C. Network (Both) */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <Network className="h-4 w-4" /> {t('networkSettings')}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>{isComputer ? t('computerName') : t('deviceName')}</Label>
                  <Input
                    value={formData.pc_name || ''}
                    onChange={(e) => {
                      handleInputChange('pc_name', e.target.value);
                      if (!formData.hostname) handleInputChange('hostname', e.target.value);
                    }}
                    placeholder={isComputer ? "DESKTOP-ABC" : "SW-CORE-01"}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('hostname')}</Label>
                  <Input value={formData.hostname || ''} onChange={(e) => handleInputChange('hostname', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>{t('ipAddress')}</Label>
                  <Input value={formData.ipaddress || ''} onChange={(e) => handleInputChange('ipaddress', e.target.value)} placeholder="192.168.x.x" className="font-mono" />
                </div>
                <div className="space-y-2">
                  <Label>{t('macAddress')}</Label>
                  <Input value={formData.macaddress || ''} onChange={(e) => handleInputChange('macaddress', e.target.value)} placeholder="AA:BB:CC:DD:EE:FF" className="font-mono" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>)}



      {/* --- 4. Financial Info --- */}
      <Card className="shadow-sm">
        <CardHeader className="pb-4 border-b bg-gray-50/50">
          <CardTitle className="flex items-center gap-2 text-base text-green-600">
            <Receipt className="h-5 w-5" /> {t('financialWarranty')}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-6">
          <div className="space-y-2">
            <Label>{t('purchaseDate')}</Label>
            <Input type="date" value={formData.purchasedate || ''} onChange={(e) => handleInputChange('purchasedate', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>{t('price')}</Label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-gray-500">฿</span>
              <Input type="number" className="pl-8" value={formData.purchaseprice ?? ''} onChange={(e) => handleInputChange('purchaseprice', normalizeNumber(e.target.value))} placeholder="0.00" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>{t('supplier')}</Label>
            <Input value={formData.supplier || ''} onChange={(e) => handleInputChange('supplier', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>{t('warrantyExpiry')}</Label>
            <Input type="date" value={formData.warrantyexpiry || ''} onChange={(e) => handleInputChange('warrantyexpiry', e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {/* --- 5. Remarks --- */}
      <Card className="shadow-sm">
        <CardHeader className="pb-4 border-b bg-gray-50/50">
          <CardTitle className="flex items-center gap-2 text-base text-gray-600">
            <Info className="h-5 w-5" /> {t('remarks')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-2">
            <Label>{t('description')}</Label>
            <Textarea rows={2} value={formData.description || ''} onChange={(e) => handleInputChange('description', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>{t('internalNotes')}</Label>
            <Textarea rows={2} value={formData.notes || ''} onChange={(e) => handleInputChange('notes', e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {/* --- Footer Actions --- */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-lg z-10 md:pl-64">
        <div className="max-w-4xl mx-auto flex items-center justify-end gap-4">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
              {t('cancel')}
            </Button>
          )}
          <Button type="submit" disabled={submitting || loading} className="min-w-[120px]">
            <Save className="h-4 w-4 mr-2" />
            {submitting ? t('saving') : mode === 'create' ? t('create') : t('save')}
          </Button>
        </div>
      </div>
    </form >
  );
}