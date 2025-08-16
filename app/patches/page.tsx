import { patchesApi, hardwareApi, usersApi } from '@/lib/api-client';
import { PatchesTable } from '@/components/patches/patches-table';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download, RefreshCw, Shield, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import Link from 'next/link';

async function getPatchData() {
  const [patchesResponse, assetsResponse, usersResponse] = await Promise.all([
    patchesApi.getAll(),
    hardwareApi.getAll(),
    usersApi.getAll()
  ]);

  const patchRecords = patchesResponse.data || [];
  const allAssets = assetsResponse.data || [];
  const allUsers = usersResponse.data || [];

  const patchInfo = patchRecords.map(record => {
    const asset = allAssets.find(a => a.id === record.assetId);
    const user = allUsers.find(u => u.id === asset?.assignedUser);
    return {
      assetId: record.assetId,
      assetName: asset ? `${asset.manufacturer} ${asset.model}` : 'Unknown Asset',
      assignedUser: user ? `${user.firstName} ${user.lastName}` : 'Unassigned',
      operatingSystem: record.operatingSystem || 'Not specified',
      patchStatus: record.patchStatus,
      lastChecked: record.lastPatchCheck || 'Never',
      location: asset?.location || 'Unknown',
      vulnerabilities: record.vulnerabilities || 0,
    };
  });

  return patchInfo;
}

export default async function PatchesPage() {
  const patchData = await getPatchData();

  const upToDateCount = patchData.filter(a => a.patchStatus === 'up-to-date').length;
  const needsReviewCount = patchData.filter(a => a.patchStatus === 'needs-review').length;
  const updatePendingCount = patchData.filter(a => a.patchStatus === 'update-pending').length;
  const totalVulnerabilities = patchData.reduce((sum, a) => sum + a.vulnerabilities, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Patch Management</h1>
          <p className="text-gray-600">Monitor and track patch status across all assets</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Bulk Update
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Up-to-Date</p>
                <p className="text-2xl font-bold">{upToDateCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Needs Review</p>
                <p className="text-2xl font-bold">{needsReviewCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Update Pending</p>
                <p className="text-2xl font-bold">{updatePendingCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Shield className="h-5 w-5 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Vulnerabilities</p>
                <p className="text-2xl font-bold">{totalVulnerabilities}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <PatchesTable initialPatchData={patchData} />
    </div>
  );
}
