'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Shield, 
  Edit, 
  Trash2,
  Calendar,
  DollarSign,
  Users,
  Key,
  Package
} from 'lucide-react';
import { softwareService, SoftwareLicense } from '@/lib/data-store';
import { EditSoftwareForm } from '@/components/forms/edit-software-form';

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'active':
      return <Badge className="bg-green-100 text-green-800">Active</Badge>;
    case 'expiring-soon':
      return <Badge className="bg-yellow-100 text-yellow-800">Expiring Soon</Badge>;
    case 'expired':
      return <Badge className="bg-red-100 text-red-800">Expired</Badge>;
    case 'inactive':
      return <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

const getLicenseTypeBadge = (type: string) => {
  const colors = {
    'subscription': 'bg-blue-100 text-blue-800',
    'perpetual': 'bg-green-100 text-green-800',
    'volume': 'bg-purple-100 text-purple-800',
    'oem': 'bg-orange-100 text-orange-800',
    'trial': 'bg-gray-100 text-gray-800',
    'educational': 'bg-indigo-100 text-indigo-800',
  };
  return <Badge className={colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>{type}</Badge>;
};

export default function SoftwareViewPage() {
  const router = useRouter();
  const params = useParams();
  const [software, setSoftware] = useState<SoftwareLicense | null>(null);
  const [editingSoftware, setEditingSoftware] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      const softwareData = softwareService.getById(params.id as string);
      if (softwareData) {
        setSoftware(softwareData);
      }
      setLoading(false);
    }
  }, [params.id]);

  const handleDelete = () => {
    if (software && confirm('Are you sure you want to delete this software license?')) {
      softwareService.delete(software.id);
      router.push('/software');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading software details...</p>
        </div>
      </div>
    );
  }

  if (!software) {
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
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Software Not Found</h3>
            <p className="text-gray-600">The requested software license could not be found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const utilizationPercent = Math.round((software.licensesAssigned / software.licensesTotal) * 100);
  const availableLicenses = software.licensesTotal - software.licensesAssigned;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{software.softwareName}</h1>
            <p className="text-gray-600">{software.publisher} • {software.version}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={() => router.push(`/software/${software.id}/edit`)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Software Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Software Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Software Name</label>
                  <p className="text-lg font-medium">{software.softwareName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Publisher</label>
                  <p className="text-lg">{software.publisher}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Version</label>
                  <p className="text-lg">{software.version}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Category</label>
                  <p className="text-lg capitalize">{software.category}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">License Type</label>
                  <div className="mt-1">{getLicenseTypeBadge(software.licenseType)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <div className="mt-1">{getStatusBadge(software.status)}</div>
                </div>
              </div>

              {software.description && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Description</label>
                  <p className="text-lg">{software.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* License Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Key className="h-5 w-5" />
                <span>License Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Purchase Date</label>
                  <p className="text-lg">{software.purchaseDate || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Expiry Date</label>
                  <p className="text-lg">{software.expiryDate || 'Perpetual'}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Total Licenses</label>
                  <p className="text-2xl font-bold text-blue-600">{software.licensesTotal}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Assigned</label>
                  <p className="text-2xl font-bold text-green-600">{software.licensesAssigned}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Available</label>
                  <p className="text-2xl font-bold text-orange-600">{availableLicenses}</p>
                </div>
              </div>

              {/* Usage Chart */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>License Utilization</span>
                  <span>{utilizationPercent}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-blue-600 h-3 rounded-full transition-all duration-300" 
                    style={{ width: `${utilizationPercent}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{software.licensesAssigned} used</span>
                  <span>{availableLicenses} available</span>
                </div>
              </div>

              {software.licenseKey && (
                <div>
                  <label className="text-sm font-medium text-gray-500">License Key</label>
                  <p className="text-lg font-mono bg-gray-50 p-2 rounded border">
                    {'*'.repeat(software.licenseKey.length - 4) + software.licenseKey.slice(-4)}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          {software.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">{software.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Usage Statistics</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-1">{utilizationPercent}%</div>
                <p className="text-sm text-gray-500">Utilization Rate</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-xl font-bold text-green-600">{software.licensesAssigned}</div>
                  <p className="text-xs text-gray-500">In Use</p>
                </div>
                <div>
                  <div className="text-xl font-bold text-orange-600">{availableLicenses}</div>
                  <p className="text-xs text-gray-500">Available</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* License Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>License Timeline</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Purchase Date</label>
                <p className="text-lg">{software.purchaseDate || 'Not specified'}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Expiry Date</label>
                <p className="text-lg">{software.expiryDate || 'Perpetual License'}</p>
              </div>
              
              {software.expiryDate && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Days Remaining</label>
                  <p className="text-lg">
                    {Math.max(0, Math.ceil((new Date(software.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))} days
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cost Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5" />
                <span>Cost Analysis</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Cost per License</label>
                <p className="text-lg">Estimated based on usage</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Utilization Efficiency</label>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${utilizationPercent >= 80 ? 'bg-green-500' : utilizationPercent >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                  <span className="text-sm">
                    {utilizationPercent >= 80 ? 'Excellent' : utilizationPercent >= 60 ? 'Good' : 'Poor'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" variant="outline">
                <Users className="h-4 w-4 mr-2" />
                Assign License
              </Button>
              <Button className="w-full" variant="outline">
                <Package className="h-4 w-4 mr-2" />
                View Assignments
              </Button>
              <Button className="w-full" variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                Renewal Reminder
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

    </div>
  );
}