'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { UserForm } from '../components/forms/user-form';
import { toast } from 'sonner';
import { User } from '@/lib/data-store';

import { useI18n } from '@/lib/i18n-context';

export default function AddUserPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (formData: Partial<User>) => {
    setIsSubmitting(true);
    const tid = toast.loading('Creating user...');

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || 'Failed to create user');
      }

      toast.success('User created successfully', { id: tid });
      router.push('/users');
      router.refresh(); // To ensure the user list is updated
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'An error occurred', { id: tid });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('back')}
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add New User</h1>
          <p className="text-gray-600">Create a new user account</p>
        </div>
      </div>

      <UserForm
        mode="create"
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}