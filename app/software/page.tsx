import { softwareApi } from '@/lib/api-client';
import { SoftwareTable } from '@/components/software/software-table';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download, Plus, Shield, Eye, Calendar, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

async function getSoftwareData() {
  // This fetch now happens on the server
  const softwareResponse = await softwareApi.getAll();
  return softwareResponse.data || [];
}

export default async function SoftwarePage() {
  const software = await getSoftwareData();

  const totalLicenses = software.reduce((sum, sw) => sum + (sw.licensesTotal || 0), 0);
  const assignedLicenses = software.reduce((sum, sw) => sum + (sw.licensesAssigned || 0), 0);
  const availableLicenses = totalLicenses - assignedLicenses;
  // This is a placeholder. Real logic would be needed to determine expiring soon.
  const expiringSoon = software.filter(sw => sw.status === 'expiring-soon').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Software Licenses</h1>
          <p className="text-gray-600">Manage software licenses and track usage</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Link href="/software/add">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add License
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Shield className="h-5 w-5 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Licenses</p>
                <p className="text-2xl font-bold">{totalLicenses}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Eye className="h-5 w-5 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">In Use</p>
                <p className="text-2xl font-bold">{assignedLicenses}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Calendar className="h-5 w-5 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Expiring Soon</p>
                <p className="text-2xl font-bold">{expiringSoon}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Available</p>
                <p className="text-2xl font-bold">{availableLicenses}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <SoftwareTable initialSoftware={software} />
    </div>
  );
}
