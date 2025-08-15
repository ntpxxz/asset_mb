'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Package, 
  Edit, 
  Trash2,
  Monitor,
  Laptop,
  Smartphone,
  Printer,
  Calendar,
  DollarSign,
  MapPin,
  User,
  Shield,
  RefreshCw,
  Activity
} from 'lucide-react';
import { hardwareService, userService, HardwareAsset } from '@/lib/data-store';
import { EditAssetForm } from '@/components/forms/edit-asset-form';

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'in-use':
      return <Badge className="bg-green-100 text-green-800">Active</Badge>;
    case 'in-stock':
      return <Badge className="bg-blue-100 text-blue-800">Available</Badge>;
    case 'under-repair':
      return <Badge className="bg-yellow-100 text-yellow-800">Maintenance</Badge>;
    case 'retired':
      return <Badge className="bg-gray-100 text-gray-800">Retired</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

const getPatchStatusBadge = (status: string) => {
  switch (status) {
    case 'up-to-date':
      return <Badge className="bg-green-100 text-green-800">Up-to-Date</Badge>;
    case 'needs-review':
      return <Badge className="bg-yellow-100 text-yellow-800">Needs Review</Badge>;
    case 'update-pending':
      return <Badge className="bg-red-100 text-red-800">Update Pending</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

const getAssetIcon = (type: string) => {
  switch (type) {
    case 'laptop':
      return Laptop;
    case 'desktop':
      return Monitor;
    case 'phone':
    case 'tablet':
      return Smartphone;
    case 'printer':
      return Printer;
    default:
      return Monitor;
  }
};

export default function AssetViewPage() {
  const router = useRouter();
  const params = useParams();
  const [asset, setAsset] = useState<HardwareAsset | null>(null);
  const [assignedUser, setAssignedUser] = useState<any>(null);
  const [editingAsset, setEditingAsset] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      const assetData = hardwareService.getById(params.id as string);
      if (assetData) {
        setAsset(assetData);
        if (assetData.assignedUser) {
          const user = userService.getById(assetData.assignedUser);
          setAssignedUser(user);
        }
      }
      setLoading(false);
    }
  }, [params.id]);

  const handleDelete = () => {
    if (asset && confirm('Are you sure you want to delete this asset?')) {
      hardwareService.delete(asset.id);
      router.push('/assets');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading asset details...</p>
        </div>
      </div>
    );
  }

  if (!asset) {
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
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Asset Not Found</h3>
            <p className="text-gray-600">The requested asset could not be found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const Icon = getAssetIcon(asset.type);

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
            <h1 className="text-3xl font-bold tracking-tight">{asset.manufacturer} {asset.model}</h1>
            <p className="text-gray-600">{asset.assetTag} • {asset.type}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={() => setEditingAsset(asset.id)}>
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
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Icon className="h-5 w-5" />
                <span>Asset Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Asset Tag</label>
                  <p className="text-lg font-mono">{asset.assetTag}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Serial Number</label>
                  <p className="text-lg font-mono">{asset.serialNumber}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Manufacturer</label>
                  <p className="text-lg">{asset.manufacturer}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Model</label>
                  <p className="text-lg">{asset.model}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <div className="mt-1">{getStatusBadge(asset.status)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Condition</label>
                  <p className="text-lg capitalize">{asset.condition}</p>
                </div>
              </div>

              {asset.description && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Description</label>
                  <p className="text-lg">{asset.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Technical Specifications */}
          <Card>
            <CardHeader>
              <CardTitle>Technical Specifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Operating System</label>
                  <p className="text-lg">{asset.operatingSystem || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Processor</label>
                  <p className="text-lg">{asset.processor || 'Not specified'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Memory</label>
                  <p className="text-lg">{asset.memory || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Storage</label>
                  <p className="text-lg">{asset.storage || 'Not specified'}</p>
                </div>
              </div>

              {(asset.hostname || asset.ipAddress || asset.macAddress) && (
                <>
                  <Separator />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Hostname</label>
                      <p className="text-lg font-mono">{asset.hostname || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">IP Address</label>
                      <p className="text-lg font-mono">{asset.ipAddress || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">MAC Address</label>
                      <p className="text-lg font-mono">{asset.macAddress || '-'}</p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Purchase Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5" />
                <span>Purchase Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Purchase Date</label>
                  <p className="text-lg">{asset.purchaseDate || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Purchase Price</label>
                  <p className="text-lg">${asset.purchasePrice || '0'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Supplier</label>
                  <p className="text-lg">{asset.supplier || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Warranty Expiry</label>
                  <p className="text-lg">{asset.warrantyExpiry || 'Not specified'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Assignment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Assignment</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {assignedUser ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Assigned To</label>
                    <p className="text-lg font-medium">{assignedUser.firstName} {assignedUser.lastName}</p>
                    <p className="text-sm text-gray-600">{assignedUser.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Department</label>
                    <p className="text-lg">{assignedUser.department}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Role</label>
                    <p className="text-lg">{assignedUser.role}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <User className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">Not assigned</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="h-5 w-5" />
                <span>Location</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Current Location</label>
                  <p className="text-lg">{asset.location}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Department</label>
                  <p className="text-lg">{asset.department || 'Not specified'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Patch Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <RefreshCw className="h-5 w-5" />
                <span>Patch Status</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <div className="mt-1">{getPatchStatusBadge(asset.patchStatus)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Last Check</label>
                  <p className="text-lg">{asset.lastPatchCheck || 'Never'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Borrowing */}
          {asset.isLoanable && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5" />
                  <span>Borrowing</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-4">
                  <Activity className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="text-green-600 font-medium">Available for borrowing</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {asset.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">{asset.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Edit Form */}
      {editingAsset && (
        <EditAssetForm 
          assetId={editingAsset}
          onClose={() => setEditingAsset(null)} 
          onSave={() => {
            const updatedAsset = hardwareService.getById(asset.id);
            if (updatedAsset) {
              setAsset(updatedAsset);
            }
          }}
        />
      )}
    </div>
  );
}