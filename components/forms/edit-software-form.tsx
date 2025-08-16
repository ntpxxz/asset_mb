'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Shield, Save } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { softwareApi } from '@/lib/api-client';

interface EditSoftwareFormProps {
  software: any;
}

export function EditSoftwareForm({ software }: EditSoftwareFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState(software);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.id) {
      const response = await softwareApi.update(formData.id, formData);
      if(response.success) {
        router.push(`/software/${formData.id}`);
      } else {
        alert('Failed to update software: ' + response.error);
      }
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Shield className="h-5 w-5" />
          <span>License Information</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Software Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Software Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="software-name">Software Name *</Label>
                <Input
                  id="software-name"
                  value={formData.softwareName || ''}
                  onChange={(e) => handleInputChange('softwareName', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="publisher">Publisher *</Label>
                <Input
                  id="publisher"
                  value={formData.publisher || ''}
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
                  value={formData.version || ''}
                  onChange={(e) => handleInputChange('version', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={formData.category || ''} onValueChange={(value) => handleInputChange('category', value)}>
                  <SelectTrigger>
                    <SelectValue />
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
                type="password"
                value={formData.licenseKey || ''}
                onChange={(e) => handleInputChange('licenseKey', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="license-type">License Type *</Label>
                <Select value={formData.licenseType || ''} onValueChange={(value) => handleInputChange('licenseType', value)}>
                  <SelectTrigger>
                    <SelectValue />
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
                <Label htmlFor="expiry-date">Expiry Date</Label>
                <Input
                  id="expiry-date"
                  type="date"
                  value={formData.expiryDate || ''}
                  onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="licenses-total">Total Licenses *</Label>
                <Input
                  id="licenses-total"
                  type="number"
                  value={formData.licensesTotal || ''}
                  onChange={(e) => handleInputChange('licensesTotal', parseInt(e.target.value) || 0)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="licenses-assigned">Licenses Assigned</Label>
                <Input
                  id="licenses-assigned"
                  type="number"
                  value={formData.licensesAssigned || ''}
                  onChange={(e) => handleInputChange('licensesAssigned', parseInt(e.target.value) || 0)}
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
  );
}
