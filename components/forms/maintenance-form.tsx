'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { X, Calendar, Save, Wrench } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface MaintenanceFormProps {
  onClose: () => void;
}

export function MaintenanceForm({ onClose }: MaintenanceFormProps) {
  const [formData, setFormData] = useState({
    assetId: '',
    maintenanceType: '',
    priority: '',
    scheduledDate: '',
    estimatedDuration: '',
    assignedTechnician: '',
    description: '',
    cost: '',
    vendor: '',
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Maintenance data:', formData);
    onClose();
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const assets = [
    { id: 'AST-001', name: 'MacBook Pro 16" - MBP16-2023-001' },
    { id: 'AST-004', name: 'HP LaserJet Pro - HPLJ-2023-004' },
    { id: 'AST-008', name: 'Dell OptiPlex 7090 - DELL-7090-008' },
    { id: 'AST-012', name: 'Surface Laptop 5 - SL5-2023-012' },
  ];

  const technicians = [
    { id: 'TECH-001', name: 'Alex Rodriguez - Hardware Specialist' },
    { id: 'TECH-002', name: 'Maria Garcia - Software Technician' },
    { id: 'TECH-003', name: 'James Wilson - Network Engineer' },
    { id: 'TECH-004', name: 'Emily Chen - System Administrator' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center space-x-2">
            <Wrench className="h-5 w-5" />
            <span>Schedule Maintenance</span>
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Asset & Type Selection */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Maintenance Details</h3>
              <div className="space-y-2">
                <Label htmlFor="asset">Select Asset *</Label>
                <Select value={formData.assetId} onValueChange={(value) => handleInputChange('assetId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose asset for maintenance" />
                  </SelectTrigger>
                  <SelectContent>
                    {assets.map((asset) => (
                      <SelectItem key={asset.id} value={asset.id}>
                        {asset.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maintenance-type">Maintenance Type *</Label>
                  <Select value={formData.maintenanceType} onValueChange={(value) => handleInputChange('maintenanceType', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="preventive">Preventive Maintenance</SelectItem>
                      <SelectItem value="corrective">Corrective Maintenance</SelectItem>
                      <SelectItem value="upgrade">Hardware Upgrade</SelectItem>
                      <SelectItem value="software">Software Update</SelectItem>
                      <SelectItem value="cleaning">Cleaning & Inspection</SelectItem>
                      <SelectItem value="repair">Repair</SelectItem>
                      <SelectItem value="calibration">Calibration</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority *</Label>
                  <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Scheduling */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Scheduling</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="scheduled-date">Scheduled Date *</Label>
                  <Input
                    id="scheduled-date"
                    type="datetime-local"
                    value={formData.scheduledDate}
                    onChange={(e) => handleInputChange('scheduledDate', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Estimated Duration</Label>
                  <Select value={formData.estimatedDuration} onValueChange={(value) => handleInputChange('estimatedDuration', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30min">30 minutes</SelectItem>
                      <SelectItem value="1hour">1 hour</SelectItem>
                      <SelectItem value="2hours">2 hours</SelectItem>
                      <SelectItem value="4hours">4 hours</SelectItem>
                      <SelectItem value="1day">1 day</SelectItem>
                      <SelectItem value="2days">2 days</SelectItem>
                      <SelectItem value="1week">1 week</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="technician">Assigned Technician</Label>
                <Select value={formData.assignedTechnician} onValueChange={(value) => handleInputChange('assignedTechnician', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Assign to technician" />
                  </SelectTrigger>
                  <SelectContent>
                    {technicians.map((tech) => (
                      <SelectItem key={tech.id} value={tech.id}>
                        {tech.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Additional Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Additional Information</h3>
              <div className="space-y-2">
                <Label htmlFor="description">Maintenance Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the maintenance work to be performed..."
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cost">Estimated Cost</Label>
                  <Input
                    id="cost"
                    placeholder="$0.00"
                    value={formData.cost}
                    onChange={(e) => handleInputChange('cost', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vendor">Service Vendor</Label>
                  <Input
                    id="vendor"
                    placeholder="e.g., Internal IT, Dell Support"
                    value={formData.vendor}
                    onChange={(e) => handleInputChange('vendor', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Any special instructions or requirements..."
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  rows={2}
                />
              </div>
            </div>

            {/* Maintenance Summary */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-2 flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                Maintenance Summary
              </h4>
              <div className="space-y-1 text-sm text-blue-800">
                <p>Asset: {formData.assetId ? assets.find(a => a.id === formData.assetId)?.name : 'Not selected'}</p>
                <p>Type: {formData.maintenanceType || 'Not specified'}</p>
                <p>Priority: {formData.priority || 'Not set'}</p>
                <p>Scheduled: {formData.scheduledDate ? new Date(formData.scheduledDate).toLocaleString() : 'Not scheduled'}</p>
                <p>Technician: {formData.assignedTechnician ? technicians.find(t => t.id === formData.assignedTechnician)?.name : 'Not assigned'}</p>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">
                <Save className="h-4 w-4 mr-2" />
                Schedule Maintenance
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}