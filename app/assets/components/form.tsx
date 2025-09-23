'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Package, Save, Plus, CheckCircle, AlertCircle } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
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

// Toast Component
const Toast = ({ 
  message, 
  type, 
  onClose 
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
      : 'bg-red-50 border-red-300 text-red-800 shadow-red-200'
    }
    `}
  >
    <div className="flex items-start gap-3">
      {type === 'success' ? (
        <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
      ) : (
        <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
      )}
      <div className="flex-1">
        <p className="font-semibold text-sm">
          {type === 'success' ? 'Success!' : 'Error!'}
        </p>
        <p className="text-sm mt-1">{message}</p>
      </div>
      <Button
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

export function AssetForm({ mode, initialData, assetId, onSubmit, onCancel, loading = false }: AssetFormProps) {
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
    status: mode === 'create' ? 'in-stock' : '',
    operatingsystem: '',
    processor: '',
    memory: '',
    storage: '',
    hostname: '',
    ipaddress: '',
    macaddress: '',
    patchstatus: mode === 'create' ? 'needs-review' : '',
    lastpatch_check: '',
    isloanable: false,
    condition: mode === 'create' ? 'good' : '',
    description: '',
    notes: '',
    ...initialData
  });

  const [originalData, setOriginalData] = useState<AssetFormData>();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Auto-hide toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    if ((mode === 'edit' || mode === 'duplicate') && initialData) {
      // เติมค่าเก่าลงฟอร์มทันทีที่โหลดได้
      setFormData(prev => ({ ...prev, ...initialData }));
      setOriginalData(initialData);
    }
  }, [initialData, mode]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  };

  const validateForm = (): boolean => {
    const required = ['type', 'manufacturer', 'model', 'serialnumber'];
    const missing = required.filter(field => !formData[field as keyof AssetFormData]);
    
    if (missing.length > 0) {
      setError(`Please fill in required fields: ${missing.join(', ')}`);
      return false;
    }
    
    setError(null);
    return true;
  };

  // วางแทน handleSubmit เดิม
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

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!validateForm()) return;

  setSubmitting(true);
  setError(null);
  const toNull = (v: unknown) => (v === undefined || v === null || v === '' || v === '-' ? null : v);
  try {
    // ทำสำเนาและ normalize ค่า base ให้เรียบร้อยก่อน
    const base: any = {
      ...formData,
      purchasedate: normalizeDate(formData.purchasedate),
      warrantyexpiry: normalizeDate(formData.warrantyexpiry),
      lastpatch_check: normalizeDate(formData.lastpatch_check),
      purchaseprice: normalizeNumber(formData.purchaseprice),

      assigneduser: toNull(formData.assigneduser),
      location: toNull(formData.location),
      department: toNull(formData.department),
    };

    let dataToSubmit: any;

    if (mode === 'edit') {
      const diff: any = {};
      Object.keys(base).forEach((k) => {
        if (base[k] !== (originalData as any)[k]) {
          diff[k] = base[k];
        }
      });
      if (Object.keys(diff).length === 0) {
        showToast('No changes detected', 'error');
        setSubmitting(false);
        return;
      }
      dataToSubmit = diff;
    } else {
      // CREATE: ไม่ส่ง id ให้ DB สร้างเอง
      const { id, ...rest } = base;
      dataToSubmit = rest;

      if (!dataToSubmit.asset_tag) {
        dataToSubmit.asset_tag = `AST-${Date.now()}`;
      }
    }

    // ⬇️ ถ้า DB ใช้ชื่อคอลัมน์อื่นสำหรับ loanable ให้ map ตรงนี้
    // dataToSubmit.is_loanable = dataToSubmit.isloanable;
    // delete dataToSubmit.isloanable;

    const result = await onSubmit(dataToSubmit);
    if (result?.success) {
      const action = mode === 'create' ? 'created' : 'updated';
      showToast(`Asset ${action} successfully!`, 'success');
    } else {
      throw new Error(result?.error || `Failed to ${mode} asset`);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : `Failed to ${mode} asset`;
    setError(msg);
    showToast(msg, 'error');
    console.error('[AssetForm submit error]', err);
  } finally {
    setSubmitting(false);
  }
};


  const handleInputChange = (field: string, value: string | boolean | number | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  {/*const getTitle = () => {
    switch (mode) {
      case 'create': return 'Add Hardware Asset';
      case 'edit': return `Edit Asset: ${formData.asset_tag || assetId}`;
      case 'duplicate': return 'Duplicate Hardware Asset';
      default: return 'Asset Form';
    }
  };*/}

  const getIcon = () => {
    return mode === 'create' ? Plus : Package;
  };
  const Icon = getIcon();

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading asset data...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      
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
              <div className="flex items-center">
                <AlertCircle className="h-4 w-4 mr-2" />
                {error}
              </div>
            </div>
          )}          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="asset_tag">Asset Tag</Label>
                  <Input
                    id="asset_tag"
                    placeholder={mode === 'create' ? 'Auto-generated if empty' : ''}
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
                    placeholder="e.g., Apple, Dell, HP, Lenovo"
                    value={formData.manufacturer || ''}
                    onChange={(e) => handleInputChange('manufacturer', e.target.value)}
                    required
                    disabled={submitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model">Model *</Label>
                  <Input
                    id="model"
                    placeholder="e.g., MacBook Pro M2, OptiPlex 7090"
                    value={formData.model || ''}
                    onChange={(e) => handleInputChange('model', e.target.value)}
                    required
                    disabled={submitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="serialnumber">Serial Number *</Label>
                  <Input
                    id="serialnumber"
                    placeholder="Unique serial number"
                    value={formData.serialnumber || ''}
                    onChange={(e) => handleInputChange('serialnumber', e.target.value)}
                    required
                    disabled={submitting}
                  />
                </div>
              </div>
            </div>

            {/* Purchase Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Purchase Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    min="0"
                    placeholder="0.00"
                    value={formData.purchaseprice || ''}
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
                    placeholder="e.g., Best Buy Business, CDW, Amazon"
                    value={formData.supplier || ''}
                    onChange={(e) => handleInputChange('supplier', e.target.value)}
                    disabled={submitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="warrantyexpiry">Warranty Expiry Date</Label>
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

            {/* Assignment & Location */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Assignment & Location</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="assigneduser">Assigned User</Label>
                  <Input
                    id="assigneduser"
                    placeholder="Username or email"
                    value={formData.assigneduser || ''}
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
                    value={formData.location || ''} 
                    onValueChange={(value) => handleInputChange('location', value)}
                    disabled={submitting}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ny-office">New York Office</SelectItem>
                      <SelectItem value="chicago-office">Chicago Office</SelectItem>
                      <SelectItem value="la-office">Los Angeles Office</SelectItem>
                      <SelectItem value="it-storage">IT Storage Room</SelectItem>
                      <SelectItem value="warehouse">Warehouse</SelectItem>
                      <SelectItem value="remote">Remote Location</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Select 
                    value={formData.department || ''} 
                    onValueChange={(value) => handleInputChange('department', value)}
                    disabled={submitting}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="engineering">Engineering</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="sales">Sales</SelectItem>
                      <SelectItem value="hr">Human Resources</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                      <SelectItem value="it">Information Technology</SelectItem>
                      <SelectItem value="operations">Operations</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Technical Specifications */}
            <div className="space-y-4">
              {/* === Technical Specifications (conditional) === */}
{(() => {
  const t = (formData.type || '').toLowerCase();
  const hideAll = new Set(['monitor', 'printer', 'router', 'switch', 'firewall', 'projector']);

  // กรณี storage: แสดงเฉพาะฟิลด์ Storage
  if (t === 'storage') {
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

  // กรณีประเภทที่ต้องซ่อนทั้งหมด
  if (hideAll.has(t)) return null;

  // กรณีอื่น ๆ: แสดงครบ OS/CPU/RAM/Storage
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
          <Label htmlFor="processor">Processor</Label>
          <Input
            id="processor"
            placeholder="e.g., Intel i7-12700, Apple M2 Pro"
            value={formData.processor || ''}
            onChange={(e) => handleInputChange('processor', e.target.value)}
            disabled={submitting}
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

            </div>

{/* === Network Information (conditional) === */}
{(() => {
  const t = (formData.type || '').toLowerCase();
  const hideNet = new Set(['monitor', 'storage', 'projector']);
  if (hideNet.has(t)) return null;

  return (
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
          <Label htmlFor="ipaddress">IP Address</Label>
          <Input
            id="ipaddress"
            placeholder="e.g., 192.168.1.100"
            value={formData.ipaddress || ''}
            onChange={(e) => handleInputChange('ipaddress', e.target.value)}
            disabled={submitting}
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
  );
})()}


{/* === Patch Management (conditional) === */}
{(() => {
  const t = (formData.type || '').toLowerCase();
  const hidePatch = new Set(['monitor', 'storage', 'projector']);
  if (hidePatch.has(t)) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Patch Management</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="patchstatus">Patch Status</Label>
          <Select
            value={formData.patchstatus || ''}
            onValueChange={(value) => handleInputChange('patchstatus', value)}
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
  );
})()}

            {/* Additional Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Additional Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="condition">Condition</Label>
                  <Select 
                    value={formData.condition || ''} 
                    onValueChange={(value) => handleInputChange('condition', value)}
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
                <div className="flex items-center space-x-2 mt-8">
                  <Checkbox
                    id="isloanable"
                    checked={formData.isloanable || false}
                    onCheckedChange={(checked) => handleInputChange('isloanable', checked as boolean)}
                    disabled={submitting}
                  />
                  <Label htmlFor="isloanable">Available for borrowing</Label>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Brief description of the asset..."
                    value={formData.description || ''}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={2}
                    disabled={submitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Internal Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Configuration details, special requirements, or other notes..."
                    value={formData.notes || ''}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    rows={2}
                    disabled={submitting}
                  />
                </div>
              </div>
            </div>

            {/* Asset Summary */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-2">Asset Summary</h4>
              <div className="grid grid-cols-2 gap-4 text-sm text-blue-800">
                <div>
                  <p><strong>Type:</strong> {formData.type || 'Not selected'}</p>
                  <p><strong>Manufacturer:</strong> {formData.manufacturer || 'Not specified'}</p>
                  <p><strong>Model:</strong> {formData.model || 'Not specified'}</p>
                  <p><strong>Status:</strong> {formData.status ? formData.status.replace('-', ' ').toUpperCase() : 'Not specified'}</p>
                </div>
                <div>
                  <p><strong>Assigned:</strong> {formData.assigneduser || 'Unassigned'}</p>
                  <p><strong>Location:</strong> {formData.location || 'Not specified'}</p>
                  <p><strong>Patch Status:</strong> {formData.patchstatus ? formData.patchstatus.replace('-', ' ') : 'Not specified'}</p>
                  <p><strong>Loanable:</strong> {formData.isloanable ? 'Yes' : 'No'}</p>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={submitting}
                className={submitting ? 'opacity-50 cursor-not-allowed' : ''}
              >
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