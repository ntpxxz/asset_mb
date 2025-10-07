'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  ArrowLeft, 
  User, 
  Edit, 
  Trash2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Package,
  Activity
} from 'lucide-react';
import { userService, hardwareService, User as UserType } from '@/lib/data-store';
import { EditUserForm } from '@/components/forms/edit-user-form';
import { HardwareAsset,  } from '@/lib/data-store';

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'active':
      return <Badge className="bg-green-100 text-green-800">Active</Badge>;
    case 'inactive':
      return <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>;
    case 'suspended':
      return <Badge className="bg-red-100 text-red-800">Suspended</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

export default function UserViewPage() {
  const router = useRouter();
  const params = useParams();
  const [user, setUser] = useState<UserType | null>(null);
  const [userAssets, setUserAssets] = useState<any[]>([]);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.id) {
      fetchUser(params.id as string);
    }
  }, [params.id]);

  const fetchUser = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/users/${id}`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch user');
      }
      
      if (result.success && result.data) {
        setUser(result.data);
        // Fetch assets assigned to this user
        fetchUserAssets(result.data.id);
      } else {
        setError('User not found');
      }
    } catch (err) {
      console.error('Error fetching user:', err);
      setError(err instanceof Error ? err.message : 'Failed to load user');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserAssets = async (userId: string) => {
    try {
      const response = await fetch('/api/assets');
      const result = await response.json();
      
      if (response.ok && result.success && result.data) {
        const assignedAssets = result.data.filter((asset: HardwareAsset) => asset.assigneduser === userId);
        setUserAssets(assignedAssets);
      }
    } catch (err) {
      console.error('Error fetching user assets:', err);
    }
  };

  const handleDelete = () => {
    if (user && confirm('Are you sure you want to delete this user?')) {
      userService.delete(user.id);
      router.push('/users');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading user details...</p>
        </div>
      </div>
    );
  }

  if (!user) {
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
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">User Not Found</h3>
            <p className="text-gray-600">The requested user could not be found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center space-x-4">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="text-lg">
                {user.firstname}{user.lastname}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{user.firstname} {user.lastname}</h1>
              <p className="text-gray-600">{user.role} • {user.department}</p>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={() => router.push(`/users/${user.id}/edit`)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Personal Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">First Name</label>
                  <p className="text-lg">{user.firstname}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Last Name</label>
                  <p className="text-lg">{user.lastname}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="text-lg">{user.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Phone</label>
                  <p className="text-lg">{user.phone || 'Not provided'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Work Information */}
          <Card>
            <CardHeader>
              <CardTitle>Work Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Employee ID</label>
                  <p className="text-lg font-mono">{user.employee_id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <div className="mt-1">{getStatusBadge(user.status)}</div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Department</label>
                  <p className="text-lg capitalize">{user.department}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Job Title</label>
                  <p className="text-lg">{user.role}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Location</label>
                  <p className="text-lg">{user.location}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Start Date</label>
                  <p className="text-lg">{user.start_date || 'Not specified'}</p>
                </div>
              </div>

              
            </CardContent>
          </Card>

          {/* Assigned Assets */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Package className="h-5 w-5" />
                <span>Assigned Assets ({userAssets.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {userAssets.length > 0 ? (
                <div className="space-y-3">
                  {userAssets.map((asset) => (
                    <div key={asset.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Package className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">{asset.manufacturer} {asset.model}</p>
                          <p className="text-sm text-gray-500">{asset.assetTag} • {asset.type}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className="bg-green-100 text-green-800">{asset.status}</Badge>
                        <Button variant="ghost" size="sm" onClick={() => router.push(`/assets/${asset.id}`)}>
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Package className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No assets assigned</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

    </div>
  );
}