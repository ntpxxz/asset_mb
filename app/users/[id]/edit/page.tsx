import { usersApi } from '@/lib/api-client';
import { EditUserForm } from '@/components/forms/edit-user-form';
import { Button } from '@/components/ui/button';
import { ArrowLeft, UserPlus } from 'lucide-react';
import Link from 'next/link';

async function getUserData(id: string) {
  const response = await usersApi.getById(id);
  return response.data;
}

export default async function EditUserPage({ params }: { params: { id: string } }) {
  const user = await getUserData(params.id);

  if (!user) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Link href="/users">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
        </div>
        <div className="text-center p-6">
          <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">User Not Found</h3>
          <p className="text-gray-600">The requested user could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link href={`/users/${user.id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit User</h1>
          <p className="text-gray-600">{user.firstName} {user.lastName}</p>
        </div>
      </div>

      <EditUserForm user={user} />
    </div>
  );
}
