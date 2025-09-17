'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';
import { usersApi } from '@/lib/api-client';

interface UserActionsProps {
  userId: string;
}

export function UserActions({ userId }: UserActionsProps) {
  const router = useRouter();

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this user?')) {
      const response = await usersApi.delete(userId);
      if(response.success) {
        router.push('/users');
        router.refresh(); // a good practice to refresh server-side data
      } else {
        alert('Failed to delete user: ' + response.error);
      }
    }
  };

  return (
    <div className="flex gap-3">
      <Button variant="outline" size="sm" onClick={() => router.push(`/users/${userId}/edit`)}>
        <Edit className="h-4 w-4 mr-2" />
        Edit
      </Button>
      <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" onClick={handleDelete}>
        <Trash2 className="h-4 w-4 mr-2" />
        Delete
      </Button>
    </div>
  );
}
