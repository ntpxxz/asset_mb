'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Package } from 'lucide-react';
import { AssetForm } from '../../components/forms/asset-form';
import { Card, CardContent } from '@/components/ui/card';
import { AssetFormData } from '@/lib/data-store';

/** ---------- Robust normalizer ---------- */
const toKey = (v?: string | null) =>
  String(v ?? '').trim().toLowerCase().replace(/\s+/g, ' ').replace(/_/g, ' ');

const mapBy = (val: any, aliases: Record<string, string>) => {
  if (val == null || val === '') return undefined;
  const key = toKey(String(val));
  const asSlug = key.replace(/\s+/g, '-');
  const knownSlugs = new Set(Object.values(aliases));
  if (knownSlugs.has(asSlug)) return asSlug;
  return aliases[key] ?? undefined;
};

const TYPE_ALIASES: Record<string,string> = {
  'laptop':'laptop','notebook':'laptop',
  'desktop':'desktop','pc':'desktop',
  'monitor':'monitor','display':'monitor',
  'printer':'printer',
  'phone':'phone','mobile phone':'phone','mobile':'phone','smartphone':'phone',
  'tablet':'tablet','server':'server','router':'router',
  'switch':'switch','network switch':'switch','network-switch':'switch',
  'firewall':'firewall',
  'storage':'storage','storage device':'storage','nas':'storage','san':'storage',
  'projector':'projector','camera':'camera','other':'other',
};
const STATUS_ALIASES: Record<string,string> = {
  'available':'available',
  'assigned':'assigned','in use':'assigned',
  'maintenance':'maintenance','repair':'maintenance','under maintenance':'maintenance',
  'retired':'retired','disposed':'retired',
};
const LOCATION_ALIASES: Record<string,string> = {
  'clean room':'clean-room','white room':'white-room','spd office':'spd-office',
  'it room':'it-storage','server room':'it-storage',
  'warehouse':'warehouse','fdb fan':'fdb-fan','remote':'remote','remote location':'remote',
};
const DEPT_ALIASES: Record<string,string> = {
  'engineering':'engineering','it':'it','information technology':'it',
  'production':'production','productions':'production',
};

function normalizeAssetData(raw: any): AssetFormData {
  const d: any = { ...raw };
  d.type       = mapBy(d.type, TYPE_ALIASES);
  d.status     = mapBy(d.status, STATUS_ALIASES);
  d.location   = mapBy(d.location, LOCATION_ALIASES);
  d.department = mapBy(d.department, DEPT_ALIASES);

  const toDate = (v: any) => (v ? new Date(v).toISOString().split('T')[0] : undefined);
  d.purchasedate    = toDate(d.purchasedate);
  d.warrantyexpiry  = toDate(d.warrantyexpiry);
  d.lastpatch_check = toDate(d.lastpatch_check);

  return d as AssetFormData;
}
/** -------------------------------------- */

export default function EditAssetPage() {
  const router = useRouter();
  const params = useParams();
  const [assetData, setAssetData] = useState<AssetFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.id) fetchAsset(params.id as string);
  }, [params.id]);

  const fetchAsset = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/assets/${id}`, { cache: 'no-store' });
      const result = await res.json();
      if (!res.ok) throw new Error(result?.error || 'Failed to fetch asset');

      if (result?.success && result?.data) {
        const data = normalizeAssetData(result.data);
        setAssetData(data);
      } else {
        setError('Asset not found');
      }
    } catch (e: any) {
      console.error('Error fetching asset:', e);
      setError(e?.message || 'Failed to load asset');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (formData: AssetFormData) => {
    try {
      const payload = normalizeAssetData(formData); // ส่ง slug กลับเสมอ
      const res = await fetch(`/api/assets/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!res.ok || !result?.success) throw new Error(result?.error || 'Failed to update asset');
      setTimeout(() => router.push(`/assets/${params.id}`), 300);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to update asset' };
    }
  };

  const handleCancel = () => router.back();

  if (error && !assetData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium">Asset Not Found</h3>
            <p className="text-gray-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Asset</h1>
          {assetData && <p className="text-gray-600">{assetData.asset_tag}</p>}
        </div>
      </div>

      {/* รอให้โหลดเสร็จก่อนค่อย render form เพื่อกัน hydration glitch */}
      {!loading && (
        <AssetForm
          mode="edit"
          initialData={assetData ?? undefined}
          assetId={params.id as string}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={loading}
        />
      )}
    </div>
  );
}
