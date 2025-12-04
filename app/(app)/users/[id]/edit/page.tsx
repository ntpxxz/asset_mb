'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { UserForm } from '../../components/forms/user-form';
import { User } from '@/lib/data-store';
import { toast } from 'sonner';
import { useI18n } from '@/lib/i18n-context';

export default function EditUserPage() {
  const router = useRouter();
  const { t } = useI18n();
  const params = useParams();
  const userId = params.id as string;

  const [initialData, setInitialData] = useState<Partial<User> | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!userId) return;

    const fetchUser = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/users/${userId}`);
        const result = await response.json();
        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Failed to fetch user data');
        }
        setInitialData(result.data);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Could not load user data.');
        router.push('/users');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId, router]);

  const handleSubmit = async (formData: Partial<User>) => {
    setIsSubmitting(true);
    const tid = toast.loading('Saving changes...');

    // Do not send password on update
    const { password, ...updateData } = formData as any;

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update user');
      }

      toast.success('User updated successfully', { id: tid });
      router.push(`/users`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save changes.', { id: tid });
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
          <h1 className="text-3xl font-bold tracking-tight">Edit User</h1>
          <p className="text-gray-600">{initialData?.firstname || 'Loading...'}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <UserForm
          mode="edit"
          initialData={initialData}
          onSubmit={handleSubmit}
          onCancel={() => router.back()}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}