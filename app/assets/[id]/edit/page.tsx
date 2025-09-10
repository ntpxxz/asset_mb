'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Package } from 'lucide-react';
import { AssetForm } from '../../components/forms/asset-form';
import { Card, CardContent } from '@/components/ui/card';

export default function EditAssetPage() {
  const router = useRouter();
  const params = useParams();
  const [assetData, setAssetData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.id) {
      fetchAsset(params.id as string);
    }
  }, [params.id]);

  const fetchAsset = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/assets/${id}`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch asset');
      }
      
      if (result.success && result.data) {
        // Convert date fields for HTML inputs
        const data = { ...result.data };
        if (data.purchasedate) {
          data.purchasedate = new Date(data.purchasedate).toISOString().split('T')[0];
        }
        if (data.warrantyexpiry) {
          data.warrantyexpiry = new Date(data.warrantyexpiry).toISOString().split('T')[0];
        }
        if (data.lastpatch_check) {
          data.lastpatch_check = new Date(data.lastpatch_check).toISOString().split('T')[0];
        }
        
        setAssetData(data);
      } else {
        setError('Asset not found');
      }
    } catch (err) {
      console.error('Error fetching asset:', err);
      setError(err instanceof Error ? err.message : 'Failed to load asset');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (formData: any) => {
    try {
      const response = await fetch(`/api/assets/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update asset');
      }
      
      if (result.success) {
        // Success - redirect after a delay to show toast
        setTimeout(() => {
          router.push(`/assets/${params.id}`);
        }, 2000);
        
        return { success: true };
      } else {
        throw new Error(result.error || 'Failed to update asset');
      }
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to update asset' 
      };
    }
  };

  const handleCancel = () => {
    router.back();
  };

  if (error && !assetData) {
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
            <p className="text-gray-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Asset</h1>
          {assetData && (
            <p className="text-gray-600">
              {assetData.asset_tag}
            </p>
          )}
        </div>
      </div>

      {/* Form */}
      <AssetForm
        mode="edit"
        initialData={assetData}
        assetId={params.id as string}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={loading}
      />
    </div>
  );
}