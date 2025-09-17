'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Shield, Edit, Trash2, Calendar, Users, Key, Package } from 'lucide-react';

type Row = {
  id: string;
  software_name: string;
  publisher: string | null;
  version: string | null;
  license_key: string | null;
  licenses_type: string | null;
  purchasedate: string | null;
  expirydate: string | null;
  licenses_total: number;
  licenses_assigned: number;
  category: string | null;
};

const getLicenseTypeBadge = (type?: string | null) => {
  const colors: Record<string, string> = {
    subscription: 'bg-blue-100 text-blue-800',
    perpetual: 'bg-green-100 text-green-800',
    'per-device': 'bg-purple-100 text-purple-800',
    'per-user': 'bg-orange-100 text-orange-800',
  };
  return <Badge className={type ? (colors[type] || 'bg-gray-100 text-gray-800') : 'bg-gray-100 text-gray-800'}>{type || '—'}</Badge>;
};

const formatDateOnly = (v?: string | null) => (!v ? '—' : /^\d{4}-\d{2}-\d{2}/.test(v) ? v.slice(0,10) : new Date(v).toISOString().slice(0,10));

const deriveStatus = (expirydate: string | null) => {
  if (!expirydate) return 'active';
  const today = new Date(); today.setHours(0,0,0,0);
  const exp = new Date(expirydate + 'T00:00:00');
  const diff = Math.ceil((exp.getTime() - today.getTime()) / (1000*60*60*24));
  if (diff < 0) return 'expired';
  if (diff <= 30) return 'expiring-soon';
  return 'active';
};

export default function SoftwareViewPage() {
  const router = useRouter();
  const params = useParams();
  const [software, setSoftware] = useState<Row | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) fetchSoftware(params.id as string);
  }, [params.id]);

  const fetchSoftware = async (id: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/software/${id}`);
      const json = await res.json();
      if (!res.ok || !json.success || !json.data) throw new Error(json.error || 'Failed to fetch');
      const data = json.data as Row;
      // ให้แน่ใจว่าเป็น YYYY-MM-DD
      data.purchasedate = data.purchasedate ? formatDateOnly(data.purchasedate) : null;
      data.expirydate = data.expirydate ? formatDateOnly(data.expirydate) : null;
      setSoftware(data);
    } catch (e) {
      console.error(e);
      setSoftware(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!software) return;
    if (!confirm('Delete this software license?')) return;
    try {
      const res = await fetch(`/api/software/${software.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      router.push('/software');
    } catch (e) {
      console.error(e);
      alert('Delete failed');
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
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
        </div>
        <Card><CardContent className="p-6 text-center">
          <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Software Not Found</h3>
          <p className="text-gray-600">The requested software license could not be found.</p>
        </CardContent></Card>
      </div>
    );
  }

  const assigned = Number(software.licenses_assigned) || 0;
  const total = Number(software.licenses_total) || 0;
  const utilizationPercent = total > 0 ? Math.round((assigned / total) * 100) : 0;
  const availableLicenses = total - assigned;
  const status = deriveStatus(software.expirydate);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{software.software_name}</h1>
            <p className="text-gray-600">{software.publisher || '—'}{software.publisher ? ' • ' : ' '} {software.version || ''}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={() => router.push(`/software/${software.id}/edit`)}>
            <Edit className="h-4 w-4 mr-2" /> Edit
          </Button>
          <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-2" /> Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" /><span>Software Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Software Name</label>
                  <p className="text-lg font-medium">{software.software_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Publisher</label>
                  <p className="text-lg">{software.publisher || '—'}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Version</label>
                  <p className="text-lg">{software.version || '—'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Category</label>
                  <p className="text-lg capitalize">{software.category || '—'}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">License Type</label>
                  <div className="mt-1">{getLicenseTypeBadge(software.licenses_type)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <div className="mt-1">
                    {status === 'active' && <Badge className="bg-green-100 text-green-800">Active</Badge>}
                    {status === 'expiring-soon' && <Badge className="bg-yellow-100 text-yellow-800">Expiring Soon</Badge>}
                    {status === 'expired' && <Badge className="bg-red-100 text-red-800">Expired</Badge>}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Key className="h-5 w-5" /><span>License Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Purchase Date</label>
                  <p className="text-lg">{formatDateOnly(software.purchasedate)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Expiry Date</label>
                  <p className="text-lg">{software.expirydate ? formatDateOnly(software.expirydate) : 'Perpetual'}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Total Licenses</label>
                  <p className="text-2xl font-bold text-blue-600">{total}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Assigned</label>
                  <p className="text-2xl font-bold text-green-600">{assigned}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Available</label>
                  <p className="text-2xl font-bold text-orange-600">{total - assigned}</p>
                </div>
              </div>

              {software.license_key && (
                <div>
                  <label className="text-sm font-medium text-gray-500">License Key</label>
                  <p className="text-lg font-mono bg-gray-50 p-2 rounded border">
                    {'*'.repeat(Math.max(0, software.license_key.length - 4)) + software.license_key.slice(-4)}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" /><span>Usage Statistics</span>
            </CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-1">{utilizationPercent}%</div>
                <p className="text-sm text-gray-500">Utilization Rate</p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div><div className="text-xl font-bold text-green-600">{assigned}</div><p className="text-xs text-gray-500">In Use</p></div>
                <div><div className="text-xl font-bold text-orange-600">{availableLicenses}</div><p className="text-xs text-gray-500">Available</p></div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" /><span>License Timeline</span>
            </CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div><label className="text-sm font-medium text-gray-500">Purchase Date</label>
                <p className="text-lg">{formatDateOnly(software.purchasedate)}</p></div>
              <div><label className="text-sm font-medium text-gray-500">Expiry Date</label>
                <p className="text-lg">{software.expirydate ? formatDateOnly(software.expirydate) : 'Perpetual License'}</p></div>
              {software.expirydate && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Days Remaining</label>
                  <p className="text-lg">
                    {Math.max(0, Math.ceil((new Date(software.expirydate).getTime() - new Date().getTime()) / (1000*60*60*24)))} days
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions (placeholder) */}
          {/* <Card>
            <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" variant="outline"><Users className="h-4 w-4 mr-2" /> Assign License</Button>
              <Button className="w-full" variant="outline"><Package className="h-4 w-4 mr-2" /> View Assignments</Button>
              <Button className="w-full" variant="outline"><Calendar className="h-4 w-4 mr-2" /> Renewal Reminder</Button>
            </CardContent>
          </Card>*/}
        </div>
      </div>
    </div>
  );
}
