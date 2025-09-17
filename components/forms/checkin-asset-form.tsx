'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { X, RotateCcw, Save } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { borrowService } from '@/lib/data-store';

interface CheckinAssetFormProps {
  onClose: () => void;
  onSave: () => void;
}

export function CheckinAssetForm({ onClose, onSave }: CheckinAssetFormProps) {
  const [formData, setFormData] = useState({
    assetId: '',
    checkinDate: new Date().toISOString().split('T')[0],
    condition: '',
    damageReported: false,
    damageDescription: '',
    maintenanceRequired: false,
    maintenanceNotes: '',
    location: '',
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Complete checkin using the borrow service
    borrowService.checkin(formData.assetId);
    
    onSave();
    onClose();
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const checkedOutAssets = [
    { id: 'AST-001', name: 'MacBook Pro 16" - John Smith', user: 'John Smith' },
    { id: 'AST-003', name: 'iPhone 14 Pro - Sarah Johnson', user: 'Sarah Johnson' },
    { id: 'AST-005', name: 'Surface Laptop 5 - Mike Wilson', user: 'Mike Wilson' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center space-x-2">
            <RotateCcw className="h-5 w-5" />
            <span>Asset Check-in</span>
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Asset Selection */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Asset Information</h3>
              <div className="space-y-2">
                <Label htmlFor="asset">Select Asset to Check In *</Label>
                <Select value={formData.assetId} onValueChange={(value) => handleInputChange('assetId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a checked-out asset" />
                  </SelectTrigger>
                  <SelectContent>
                    {checkedOutAssets.map((asset) => (
                      <SelectItem key={asset.id} value={asset.id}>
                        {asset.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="checkin-date">Check-in Date *</Label>
                  <Input
                    id="checkin-date"
                    type="date"
                    value={formData.checkinDate}
                    onChange={(e) => handleInputChange('checkinDate', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Return Location</Label>
                  <Select value={formData.location} onValueChange={(value) => handleInputChange('location', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="it-storage">IT Storage</SelectItem>
                      <SelectItem value="ny-office">New York Office</SelectItem>
                      <SelectItem value="chicago-office">Chicago Office</SelectItem>
                      <SelectItem value="la-office">Los Angeles Office</SelectItem>
                      <SelectItem value="warehouse">Warehouse</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Condition Assessment */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Condition Assessment</h3>
              <div className="space-y-2">
                <Label htmlFor="condition">Asset Condition *</Label>
                <Select value={formData.condition} onValueChange={(value) => handleInputChange('condition', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Assess asset condition" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excellent">Excellent - Like new</SelectItem>
                    <SelectItem value="good">Good - Minor wear</SelectItem>
                    <SelectItem value="fair">Fair - Noticeable wear</SelectItem>
                    <SelectItem value="poor">Poor - Significant wear</SelectItem>
                    <SelectItem value="damaged">Damaged - Needs repair</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="damage-reported"
                    checked={formData.damageReported}
                    onCheckedChange={(checked) => handleInputChange('damageReported', checked as boolean)}
                  />
                  <Label htmlFor="damage-reported">Report damage or issues</Label>
                </div>

                {formData.damageReported && (
                  <div className="space-y-2 ml-6">
                    <Label htmlFor="damage-description">Damage Description *</Label>
                    <Textarea
                      id="damage-description"
                      placeholder="Describe any damage, missing parts, or issues..."
                      value={formData.damageDescription}
                      onChange={(e) => handleInputChange('damageDescription', e.target.value)}
                      rows={3}
                    />
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="maintenance-required"
                    checked={formData.maintenanceRequired}
                    onCheckedChange={(checked) => handleInputChange('maintenanceRequired', checked as boolean)}
                  />
                  <Label htmlFor="maintenance-required">Maintenance required</Label>
                </div>

                {formData.maintenanceRequired && (
                  <div className="space-y-2 ml-6">
                    <Label htmlFor="maintenance-notes">Maintenance Notes</Label>
                    <Textarea
                      id="maintenance-notes"
                      placeholder="Describe required maintenance work..."
                      value={formData.maintenanceNotes}
                      onChange={(e) => handleInputChange('maintenanceNotes', e.target.value)}
                      rows={2}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Additional Notes */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Additional Information</h3>
              <div className="space-y-2">
                <Label htmlFor="notes">Check-in Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Any additional notes about the asset return..."
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            {/* Check-in Summary */}
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h4 className="font-medium text-green-900 mb-2 flex items-center">
                <RotateCcw className="h-4 w-4 mr-2" />
                Check-in Summary
              </h4>
              <div className="space-y-1 text-sm text-green-800">
                <p>Asset: {formData.assetId ? checkedOutAssets.find(a => a.id === formData.assetId)?.name : 'Not selected'}</p>
                <p>Date: {formData.checkinDate}</p>
                <p>Condition: {formData.condition || 'Not assessed'}</p>
                <p>Damage Reported: {formData.damageReported ? 'Yes' : 'No'}</p>
                <p>Maintenance Required: {formData.maintenanceRequired ? 'Yes' : 'No'}</p>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">
                <Save className="h-4 w-4 mr-2" />
                Complete Check-in
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}