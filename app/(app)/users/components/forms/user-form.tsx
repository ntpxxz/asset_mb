'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UserPlus, Save } from 'lucide-react';
import type { User } from '@/lib/data-store';

type Mode = 'create' | 'edit';
interface UserFormProps {
  mode: Mode;
  initialData?: Partial<User> | null;
  onSubmit: (formData: Partial<User>) => Promise<any>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function UserForm({ mode, initialData, onSubmit, onCancel, isSubmitting }: UserFormProps) {
  const [formData, setFormData] = useState<Partial<User>>({
    firstname: '',
    lastname: '',
    email: '',
    phone: '',
    department: '',
    role: 'user',
    location: '',
    employee_id: '',
    // manager field removed
    start_date: '',
    status: 'active',
  });

  const [password, setPassword] = useState('');

  useEffect(() => {
    if (mode === 'edit' && initialData) {
      const data = { ...initialData };
      if (data.start_date) {
        data.start_date = new Date(data.start_date).toISOString().split('T')[0];
      }
      setFormData(data);
    }
  }, [initialData, mode]);

  const handleInputChange = (field: keyof User, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submissionData = { ...formData };
    if (mode === 'create') {
      (submissionData as any).password = password;
    }
    onSubmit(submissionData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <UserPlus className="h-5 w-5" />
          <span>{mode === 'create' ? 'New User Information (ข้อมูลผู้ใช้ใหม่)' : 'Edit User Information (แก้ไขข้อมูลผู้ใช้)'}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Personal Information (ข้อมูลส่วนตัว)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstname">First Name (ชื่อจริง) *</Label>
                <Input
                  id="firstname"
                  placeholder="เช่น Somchai"
                  value={formData.firstname || ''}
                  onChange={(e) => handleInputChange('firstname', e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastname">Last Name (นามสกุล) *</Label>
                <Input
                  id="lastname"
                  placeholder="เช่น Jaidee"
                  value={formData.lastname || ''}
                  onChange={(e) => handleInputChange('lastname', e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address (อีเมล) *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="somchai.j@company.com"
                  value={formData.email || ''}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>
              {mode === 'create' && (
                <div className="space-y-2">
                  <Label htmlFor="password">Password (รหัสผ่าน) *</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="อย่างน้อย 8 ตัวอักษร"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number (เบอร์โทรศัพท์)</Label>
                <Input
                  id="phone"
                  placeholder="+66 81 234 5678"
                  value={formData.phone || ''}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>

          {/* Work Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Work Information (ข้อมูลการทำงาน)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role">Role (บทบาท) *</Label>
                <Select value={formData.role || 'user'} onValueChange={(value) => handleInputChange('role', value)} disabled={isSubmitting}>
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกบทบาท" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="employee_id">Employee ID (รหัสพนักงาน)</Label>
                <Input
                  id="employee_id"
                  placeholder="EMP-001"
                  value={formData.employee_id || ''}
                  onChange={(e) => handleInputChange('employee_id', e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="department">Department (แผนก)</Label>
                <Input
                  id="department"
                  placeholder="เช่น Engineering"
                  value={formData.department || ''}
                  onChange={(e) => handleInputChange('department', e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location (สถานที่)</Label>
                <Input
                  id="location"
                  placeholder="เช่น สำนักงานใหญ่"
                  value={formData.location || ''}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
              Cancel (ยกเลิก)
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              <Save className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Saving... (กำลังบันทึก)' : (mode === 'create' ? 'Create User (สร้างผู้ใช้)' : 'Save Changes (บันทึกการเปลี่ยนแปลง)')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}