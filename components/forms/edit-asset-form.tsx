'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { X, Package, Save } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { HardwareAsset, hardwareService } from '@/lib/data-store';

interface EditAssetFormProps {
  assetId: string;
  onClose: () => void;
  onSave: () => void;
}

export function EditAssetForm({ assetId, onClose, onSave }: EditAssetFormProps) {
  const [formData, setFormData] = useState<Partial<HardwareAsset>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const asset = hardwareService.getById(assetId);
    if (asset) {
      setFormData(asset);
    }
    setLoading(false);
  }, [assetId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.id) {
      hardwareService.update(formData.id, formData);
      onSave();
      onClose();
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5" />
            <span>Edit Asset: {formData.assetTag}</span>
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="asset-tag">Asset Tag</Label>
                  <Input
                    id="asset-tag"
                    value={formData.assetTag || ''}
                    onChange={(e) => handleInputChange('assetTag', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="asset-type">Asset Type</Label>
                  <Select value={formData.type || ''} onValueChange={(value) => handleInputChange('type', value)}>
                    <SelectTrigger>
                      <SelectValue />
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
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="manufacturer">Manufacturer</Label>
                  <Input
                    id="manufacturer"
                    value={formData.manufacturer || ''}
                    onChange={(e) => handleInputChange('manufacturer', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model">Model</Label>
                  <Input
                    id="model"
                    value={formData.model || ''}
                    onChange={(e) => handleInputChange('model', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="serial-number">Serial Number</Label>
                  <Input
                    id="serial-number"
                    value={formData.serialNumber || ''}
                    onChange={(e) => handleInputChange('serialNumber', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Status & Assignment */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Status & Assignment</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status || ''} onValueChange={(value) => handleInputChange('status', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in-stock">In Stock</SelectItem>
                      <SelectItem value="in-use">In Use</SelectItem>
                      <SelectItem value="under-repair">Under Repair</SelectItem>
                      <SelectItem value="retired">Retired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Select value={formData.location || ''} onValueChange={(value) => handleInputChange('location', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ny-office">New York Office</SelectItem>
                      <SelectItem value="chicago-office">Chicago Office</SelectItem>
                      <SelectItem value="la-office">Los Angeles Office</SelectItem>
                      <SelectItem value="it-storage">IT Storage</SelectItem>
                      <SelectItem value="remote">Remote</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Technical Specifications */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Technical Specifications</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="operating-system">Operating System</Label>
                  <Input
                    id="operating-system"
                    value={formData.operatingSystem || ''}
                    onChange={(e) => handleInputChange('operatingSystem', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="processor">Processor</Label>
                  <Input
                    id="processor"
                    value={formData.processor || ''}
                    onChange={(e) => handleInputChange('processor', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="memory">Memory (RAM)</Label>
                  <Input
                    id="memory"
                    value={formData.memory || ''}
                    onChange={(e) => handleInputChange('memory', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="storage">Storage</Label>
                  <Input
                    id="storage"
                    value={formData.storage || ''}
                    onChange={(e) => handleInputChange('storage', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Patch Management */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Patch Management</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="patch-status">Patch Status</Label>
                  <Select value={formData.patchStatus || ''} onValueChange={(value) => handleInputChange('patchStatus', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="up-to-date">Up-to-Date</SelectItem>
                      <SelectItem value="needs-review">Needs Review</SelectItem>
                      <SelectItem value="update-pending">Update Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last-patch-check">Last Patch Check</Label>
                  <Input
                    id="last-patch-check"
                    type="date"
                    value={formData.lastPatchCheck || ''}
                    onChange={(e) => handleInputChange('lastPatchCheck', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Additional Information</h3>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description || ''}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={2}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes || ''}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  rows={2}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is-loanable"
                  checked={formData.isLoanable || false}
                  onCheckedChange={(checked) => handleInputChange('isLoanable', checked as boolean)}
                />
                <Label htmlFor="is-loanable">Available for borrowing</Label>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}