'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { X, Activity, Save, Search } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { borrowService } from '@/lib/data-store';

interface CheckoutAssetFormProps {
  onClose: () => void;
  onSave: () => void;
}

export function CheckoutAssetForm({ onClose, onSave }: CheckoutAssetFormProps) {
  const [formData, setFormData] = useState({
    assetId: '',
    userId: '',
    checkout_date: new Date().toISOString().split('T')[0],
    expectedReturnDate: '',
    notes: '',
    location: '',
    purpose: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create checkout record using the borrow service
    borrowService.checkout(
      formData.assetId,
      formData.userId,
      formData.expectedReturnDate,
      formData.purpose,
      formData.notes
    );
    
    onSave();
    onClose();
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Mock data for dropdowns
  const availableAssets = [
    { id: 'AST-001', name: 'MacBook Pro 16" - MBP16-2023-001' },
    { id: 'AST-002', name: 'Dell OptiPlex 7090 - DELL-7090-002' },
    { id: 'AST-006', name: 'iPad Pro 12.9" - IPD-2023-006' },
    { id: 'AST-007', name: 'ThinkPad X1 Carbon - TP-X1C-007' },
  ];

  const users = [
    { id: 'USR-001', name: 'John Smith - Engineering' },
    { id: 'USR-002', name: 'Sarah Johnson - Marketing' },
    { id: 'USR-003', name: 'Mike Wilson - Sales' },
    { id: 'USR-004', name: 'Lisa Chen - IT' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Asset Checkout</span>
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Asset Selection */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Asset & User Selection</h3>
              <div className="space-y-2">
                <Label htmlFor="asset">Select Asset *</Label>
                <Select value={formData.assetId} onValueChange={(value) => handleInputChange('assetId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an available asset" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableAssets.map((asset) => (
                      <SelectItem key={asset.id} value={asset.id}>
                        {asset.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="user">Assign to User *</Label>
                <Select value={formData.userId} onValueChange={(value) => handleInputChange('userId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a user" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Checkout Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Checkout Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="checkout-date">Checkout Date *</Label>
                  <Input
                    id="checkout-date"
                    type="date"
                    value={formData.checkout_date}
                    onChange={(e) => handleInputChange('checkout_date', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="return-date">Expected Return Date</Label>
                  <Input
                    id="return-date"
                    type="date"
                    value={formData.expectedReturnDate}
                    onChange={(e) => handleInputChange('expectedReturnDate', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="purpose">Purpose</Label>
                  <Select value={formData.purpose} onValueChange={(value) => handleInputChange('purpose', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select purpose" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="work">Work Assignment</SelectItem>
                      <SelectItem value="project">Project Use</SelectItem>
                      <SelectItem value="temporary">Temporary Assignment</SelectItem>
                      <SelectItem value="replacement">Equipment Replacement</SelectItem>
                      <SelectItem value="travel">Business Travel</SelectItem>
                      <SelectItem value="training">Training/Learning</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="checkout-location">Deployment Location</Label>
                  <Select value={formData.location} onValueChange={(value) => handleInputChange('location', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ny-office">New York Office</SelectItem>
                      <SelectItem value="chicago-office">Chicago Office</SelectItem>
                      <SelectItem value="la-office">Los Angeles Office</SelectItem>
                      <SelectItem value="remote">Remote Work</SelectItem>
                      <SelectItem value="client-site">Client Site</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Any special instructions or notes for this checkout..."
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            {/* Checkout Summary */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Checkout Summary</h4>
              <div className="space-y-1 text-sm text-gray-600">
                <p>Asset: {formData.assetId ? availableAssets.find(a => a.id === formData.assetId)?.name : 'Not selected'}</p>
                <p>User: {formData.userId ? users.find(u => u.id === formData.userId)?.name : 'Not selected'}</p>
                <p>Date: {formData.checkout_date}</p>
                <p>Purpose: {formData.purpose || 'Not specified'}</p>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">
                <Save className="h-4 w-4 mr-2" />
                Checkout Asset
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}