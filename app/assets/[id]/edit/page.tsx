'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Package, Save } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { HardwareAsset, hardwareService } from '@/lib/data-store';


export default function EditAssetPage() {
  const router = useRouter();
  const params = useParams();
  const [formData, setFormData] = useState<Partial<HardwareAsset>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      const asset = hardwareService.getById(params.id as string);
      if (asset) {
        setFormData(asset);
      }
      setLoading(false);
    }
  }, [params.id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.id) {
      hardwareService.update(formData.id, formData);
      router.push(`/assets/${formData.id}`);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading asset details...</p>
        </div>
      </div>
    );
  }

  if (!formData.id) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Asset Not Found</h3>
            <p className="text-gray-600">The requested asset could not be found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Asset</h1>
          <p className="text-gray-600">{formData.manufacturer} {formData.model}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5" />
            <span>Asset Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
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
                  <Label htmlFor="asset-type">Asset Type *</Label>
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
                  <Label htmlFor="manufacturer">Manufacturer *</Label>
                  <Input
                    id="manufacturer"
                    value={formData.manufacturer || ''}
                    onChange={(e) => handleInputChange('manufacturer', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model">Model *</Label>
                  <Input
                    id="model"
                    value={formData.model || ''}
                    onChange={(e) => handleInputChange('model', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="serial-number">Serial Number *</Label>
                  <Input
                    id="serial-number"
                    value={formData.serialNumber || ''}
                    onChange={(e) => handleInputChange('serialNumber', e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Purchase Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Purchase Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="purchase-date">Purchase Date</Label>
                  <Input
                    id="purchase-date"
                    type="date"
                    value={formData.purchaseDate || ''}
                    onChange={(e) => handleInputChange('purchaseDate', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="purchase-price">Purchase Price</Label>
                  <Input
                    id="purchase-price"
                    value={formData.purchasePrice || ''}
                    onChange={(e) => handleInputChange('purchasePrice', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="supplier">Supplier</Label>
                  <Input
                    id="supplier"
                    value={formData.supplier || ''}
                    onChange={(e) => handleInputChange('supplier', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="warranty-expiry">Warranty Expiry Date</Label>
                  <Input
                    id="warranty-expiry"
                    type="date"
                    value={formData.warrantyExpiry || ''}
                    onChange={(e) => handleInputChange('warrantyExpiry', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Status & Assignment */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Status & Assignment</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status *</Label>
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
                  <Label htmlFor="location">Location *</Label>
                  <Select value={formData.location || ''} onValueChange={(value) => handleInputChange('location', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ny-office">New York Office</SelectItem>
                      <SelectItem value="chicago-office">Chicago Office</SelectItem>
                      <SelectItem value="la-office">Los Angeles Office</SelectItem>
                      <SelectItem value="it-storage">IT Storage</SelectItem>
                      <SelectItem value="warehouse">Warehouse</SelectItem>
                      <SelectItem value="remote">Remote Location</SelectItem>
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
              <Button type="button" variant="outline" onClick={() => router.back()}>
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