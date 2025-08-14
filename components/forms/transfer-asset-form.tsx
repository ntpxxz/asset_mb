'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { X, ArrowRightLeft, Save } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface TransferAssetFormProps {
  onClose: () => void;
}

export function TransferAssetForm({ onClose }: TransferAssetFormProps) {
  const [formData, setFormData] = useState({
    assetId: '',
    fromUser: '',
    toUser: '',
    transferDate: new Date().toISOString().split('T')[0],
    reason: '',
    newLocation: '',
    notes: '',
    approvedBy: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Transfer data:', formData);
    onClose();
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const assignedAssets = [
    { id: 'AST-001', name: 'MacBook Pro 16" - MBP16-2023-001', currentUser: 'John Smith' },
    { id: 'AST-003', name: 'iPhone 14 Pro - IP14P-2023-003', currentUser: 'Sarah Johnson' },
    { id: 'AST-005', name: 'Surface Laptop 5 - SL5-2023-005', currentUser: 'Mike Wilson' },
  ];

  const users = [
    { id: 'USR-001', name: 'John Smith - Engineering' },
    { id: 'USR-002', name: 'Sarah Johnson - Marketing' },
    { id: 'USR-003', name: 'Mike Wilson - Sales' },
    { id: 'USR-004', name: 'Lisa Chen - IT' },
    { id: 'USR-005', name: 'David Brown - HR' },
  ];

  const managers = [
    { id: 'MGR-001', name: 'Jane Doe - Engineering Manager' },
    { id: 'MGR-002', name: 'Bob Johnson - IT Director' },
    { id: 'MGR-003', name: 'Alice Williams - Operations Manager' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center space-x-2">
            <ArrowRightLeft className="h-5 w-5" />
            <span>Transfer Asset</span>
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Asset & Transfer Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Transfer Details</h3>
              <div className="space-y-2">
                <Label htmlFor="asset">Select Asset *</Label>
                <Select value={formData.assetId} onValueChange={(value) => handleInputChange('assetId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose asset to transfer" />
                  </SelectTrigger>
                  <SelectContent>
                    {assignedAssets.map((asset) => (
                      <SelectItem key={asset.id} value={asset.id}>
                        {asset.name} (Currently: {asset.currentUser})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="from-user">From User</Label>
                  <Input
                    id="from-user"
                    value={formData.assetId ? assignedAssets.find(a => a.id === formData.assetId)?.currentUser || '' : ''}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="to-user">To User *</Label>
                  <Select value={formData.toUser} onValueChange={(value) => handleInputChange('toUser', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select new user" />
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="transfer-date">Transfer Date *</Label>
                  <Input
                    id="transfer-date"
                    type="date"
                    value={formData.transferDate}
                    onChange={(e) => handleInputChange('transferDate', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-location">New Location</Label>
                  <Select value={formData.newLocation} onValueChange={(value) => handleInputChange('newLocation', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select new location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ny-office">New York Office</SelectItem>
                      <SelectItem value="chicago-office">Chicago Office</SelectItem>
                      <SelectItem value="la-office">Los Angeles Office</SelectItem>
                      <SelectItem value="remote">Remote</SelectItem>
                      <SelectItem value="client-site">Client Site</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Transfer Reason */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Transfer Reason</h3>
              <div className="space-y-2">
                <Label htmlFor="reason">Reason for Transfer *</Label>
                <Select value={formData.reason} onValueChange={(value) => handleInputChange('reason', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select transfer reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="role-change">Role Change</SelectItem>
                    <SelectItem value="department-transfer">Department Transfer</SelectItem>
                    <SelectItem value="location-change">Location Change</SelectItem>
                    <SelectItem value="equipment-upgrade">Equipment Upgrade</SelectItem>
                    <SelectItem value="project-assignment">Project Assignment</SelectItem>
                    <SelectItem value="replacement">Equipment Replacement</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="approved-by">Approved By</Label>
                <Select value={formData.approvedBy} onValueChange={(value) => handleInputChange('approvedBy', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select approving manager" />
                  </SelectTrigger>
                  <SelectContent>
                    {managers.map((manager) => (
                      <SelectItem key={manager.id} value={manager.id}>
                        {manager.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Transfer Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional details about the transfer..."
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            {/* Transfer Summary */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-2 flex items-center">
                <ArrowRightLeft className="h-4 w-4 mr-2" />
                Transfer Summary
              </h4>
              <div className="space-y-1 text-sm text-blue-800">
                <p>Asset: {formData.assetId ? assignedAssets.find(a => a.id === formData.assetId)?.name : 'Not selected'}</p>
                <p>From: {formData.assetId ? assignedAssets.find(a => a.id === formData.assetId)?.currentUser : 'N/A'}</p>
                <p>To: {formData.toUser ? users.find(u => u.id === formData.toUser)?.name : 'Not selected'}</p>
                <p>Date: {formData.transferDate}</p>
                <p>Reason: {formData.reason || 'Not specified'}</p>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">
                <Save className="h-4 w-4 mr-2" />
                Complete Transfer
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}