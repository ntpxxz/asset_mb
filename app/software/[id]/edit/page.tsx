'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Shield, Save } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SoftwareLicense, softwareService } from '@/lib/data-store';


export default function EditSoftwarePage() {
  const router = useRouter();
  const params = useParams();
  const [formData, setFormData] = useState<Partial<SoftwareLicense>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  

  useEffect(() => {
    if (params.id) {
      fetchSoftware(params.id as string)
    }
  }, [params.id]);
  const fetchSoftware = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/software/${id}`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch asset');
      }
      
      if (result.success && result.data) {
        // Convert date strings to YYYY-MM-DD format for HTML date inputs
        const data = { ...result.data };
        if (data.purchaseDate) {
          data.purchaseDate = new Date(data.purchaseDate).toISOString().split('T')[0];
        }
        if (data.expiryDate) {
          data.expiryDate = new Date(data.expiryDate).toISOString().split('T')[0];
        }
        
        // Debug log to check data
        console.log('Asset data from API:', data);
        console.log('Status:', data.status, 'Location:', data.location);
        
        setFormData(data);
      } else {
        setError('Asset not found');
      }
    } catch (err) {
      console.error('Error fetching asset:', err);
      setError(err instanceof Error ? err.message : 'Failed to load asset');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.id) {
      softwareService.update(formData.id, formData);
      router.push(`/software/${formData.id}`);
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading software details...</p>
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
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Software Not Found</h3>
            <p className="text-gray-600">The requested software license could not be found.</p>
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
          <h1 className="text-3xl font-bold tracking-tight">Edit Software License</h1>
          <p className="text-gray-600">{formData.softwareName}</p>
        </div>
      </div>

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
              <div className="space-y-2">
                  <Label htmlFor="license-type">License Type *</Label>
                  <Select value={formData.licenseType || ''} onValueChange={(value) => handleInputChange('licenseType', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Perpetual">Perpetual License</SelectItem>
                      <SelectItem value="Subscription">Subscription</SelectItem>
                      <SelectItem value="Volume">Volume License</SelectItem>
                      <SelectItem value="OEM">OEM License</SelectItem>
                      <SelectItem value="Trial">Trial License</SelectItem>
                      <SelectItem value="Educational">Educational License</SelectItem>
                      <SelectItem value="Bundled">Bundled License</SelectItem>

                      
                    </SelectContent>
                  </Select>
                </div>


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
    </div>
  );
}