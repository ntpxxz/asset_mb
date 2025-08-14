'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { X, Shield, Save } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AddSoftwareFormProps {
  onClose: () => void;
  onSave: () => void;
}

export function AddSoftwareForm({ onClose, onSave }: AddSoftwareFormProps) {
  const [formData, setFormData] = useState({
    softwareName: '',
    publisher: '',
    version: '',
    licenseKey: '',
    licenseType: '',
    purchaseDate: '',
    expiryDate: '',
    licensesTotal: '',
    licensesAssigned: '',
    category: '',
    description: '',
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create the software license using the data service
    softwareService.create({
      softwareName: formData.softwareName,
      publisher: formData.publisher,
      version: formData.version,
      licenseKey: formData.licenseKey,
      licenseType: formData.licenseType as any,
      purchaseDate: formData.purchaseDate,
      expiryDate: formData.expiryDate,
      licensesTotal: parseInt(formData.licensesTotal) || 0,
      licensesAssigned: parseInt(formData.licensesAssigned) || 0,
      category: formData.category,
      description: formData.description,
      notes: formData.notes,
      status: 'active',
    });
    
    onSave();
    onClose();
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Add Software License</span>
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Software Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Software Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="software-name">Software Name *</Label>
                  <Input
                    id="software-name"
                    placeholder="e.g., Microsoft Office 365"
                    value={formData.softwareName}
                    onChange={(e) => handleInputChange('softwareName', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="publisher">Publisher *</Label>
                  <Input
                    id="publisher"
                    placeholder="e.g., Microsoft, Adobe, Autodesk"
                    value={formData.publisher}
                    onChange={(e) => handleInputChange('publisher', e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="version">Version</Label>
                  <Input
                    id="version"
                    placeholder="e.g., 2023, v15.2, CC 2024"
                    value={formData.version}
                    onChange={(e) => handleInputChange('version', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="productivity">Productivity Suite</SelectItem>
                      <SelectItem value="design">Design & Creative</SelectItem>
                      <SelectItem value="development">Development Tools</SelectItem>
                      <SelectItem value="security">Security Software</SelectItem>
                      <SelectItem value="operating-system">Operating System</SelectItem>
                      <SelectItem value="database">Database Software</SelectItem>
                      <SelectItem value="communication">Communication</SelectItem>
                      <SelectItem value="utility">Utility Software</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* License Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">License Details</h3>
              <div className="space-y-2">
                <Label htmlFor="license-key">License Key</Label>
                <Input
                  id="license-key"
                  placeholder="Enter license key or activation code"
                  value={formData.licenseKey}
                  onChange={(e) => handleInputChange('licenseKey', e.target.value)}
                  type="password"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="license-type">License Type *</Label>
                  <Select value={formData.licenseType} onValueChange={(value) => handleInputChange('licenseType', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select license type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="perpetual">Perpetual License</SelectItem>
                      <SelectItem value="subscription">Subscription</SelectItem>
                      <SelectItem value="volume">Volume License</SelectItem>
                      <SelectItem value="oem">OEM License</SelectItem>
                      <SelectItem value="trial">Trial License</SelectItem>
                      <SelectItem value="educational">Educational License</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="purchase-date">Purchase Date</Label>
                  <Input
                    id="purchase-date"
                    type="date"
                    value={formData.purchaseDate}
                    onChange={(e) => handleInputChange('purchaseDate', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expiry-date">Expiry Date (if applicable)</Label>
                  <Input
                    id="expiry-date"
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="licenses-total">Total Licenses Purchased *</Label>
                  <Input
                    id="licenses-total"
                    type="number"
                    placeholder="e.g., 50"
                    value={formData.licensesTotal}
                    onChange={(e) => handleInputChange('licensesTotal', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="licenses-assigned">Licenses Currently Assigned</Label>
                <Input
                  id="licenses-assigned"
                  type="number"
                  placeholder="e.g., 35"
                  value={formData.licensesAssigned}
                  onChange={(e) => handleInputChange('licensesAssigned', e.target.value)}
                />
              </div>
            </div>

            {/* Additional Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Additional Information</h3>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of the software and its purpose..."
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={2}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">Internal Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Installation notes, special requirements, or other details..."
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  rows={2}
                />
              </div>
            </div>

            {/* License Summary */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-2">License Summary</h4>
              <div className="space-y-1 text-sm text-blue-800">
                <p>Software: {formData.softwareName || 'Not specified'}</p>
                <p>Publisher: {formData.publisher || 'Not specified'}</p>
                <p>License Type: {formData.licenseType || 'Not selected'}</p>
                <p>Total Licenses: {formData.licensesTotal || '0'}</p>
                <p>Available: {formData.licensesTotal && formData.licensesAssigned ? 
                  (parseInt(formData.licensesTotal) - parseInt(formData.licensesAssigned || '0')) : 'N/A'}</p>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">
                <Save className="h-4 w-4 mr-2" />
                Add Software License
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}