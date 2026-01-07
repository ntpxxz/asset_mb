'use client';

import { useState, useEffect } from 'react';
import { useI18n } from '@/lib/i18n-context';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { FloorPlanSelector, FloorPlan } from './components/FloorPlanSelector';
import { AssetSidebar, Asset } from './components/AssetSidebar';
import { LayoutEditor, Placement } from './components/LayoutEditor';

export default function NetworkLayoutPage() {
    const { t } = useI18n();

    const [selectedPlan, setSelectedPlan] = useState<FloorPlan | null>(null);
    const [placements, setPlacements] = useState<Placement[]>([]);
    const [allAssets, setAllAssets] = useState<Asset[]>([]);
    const [loadingAssets, setLoadingAssets] = useState(true);

    // Fetch all network assets on mount
    useEffect(() => {
        fetchAssets();
    }, []);

    // Fetch placements when selected plan changes
    useEffect(() => {
        if (selectedPlan) {
            fetchPlacements(selectedPlan.id);
        } else {
            setPlacements([]);
        }
    }, [selectedPlan]);

    const fetchAssets = async () => {
        try {
            // We assume there's an API to get network assets. 
            // If not, we might need to use the existing assets API with a filter?
            // Let's try fetching all and filtering client side if API doesn't support type filter well
            // Or use the existing /api/assets route
            const res = await fetch('/api/assets?type=network'); // Assuming this works or returns all
            if (res.ok) {
                const responseData = await res.json();
                const assets = responseData.data || [];
                // Filter for network types if API returns everything
                const networkTypes = ['router', 'switch', 'firewall', 'access-point', 'gateway', 'server'];
                const networkAssets = assets.filter((a: any) =>
                    networkTypes.some(t => a.type.toLowerCase().includes(t)) ||
                    a.type.toLowerCase() === 'network'
                );
                setAllAssets(networkAssets);
            }
        } catch (error) {
            console.error('Failed to fetch assets', error);
            toast.error('Failed to load assets');
        } finally {
            setLoadingAssets(false);
        }
    };

    const fetchPlacements = async (planId: number) => {
        try {
            const res = await fetch(`/api/floor-plans/${planId}/placements`);
            if (res.ok) {
                const data = await res.json();
                setPlacements(data);
            }
        } catch (error) {
            console.error('Failed to fetch placements', error);
        }
    };

    const handleDropAsset = async (assetId: number, x: number, y: number) => {
        if (!selectedPlan) return;

        // Optimistic update
        const asset = allAssets.find(a => a.id === assetId);
        if (!asset) return;

        const newPlacement: Placement = {
            id: Date.now(), // Temp ID
            asset_id: assetId,
            floor_plan_id: selectedPlan.id,
            x_position: x,
            y_position: y,
            asset_tag: asset.asset_tag,
            model: asset.model,
            type: asset.type,
            ipaddress: asset.ipaddress
        };

        // Remove existing placement for this asset if it was already on this floor
        const otherPlacements = placements.filter(p => p.asset_id !== assetId);
        setPlacements([...otherPlacements, newPlacement]);

        try {
            const res = await fetch(`/api/floor-plans/${selectedPlan.id}/placements`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ assetId, x, y }),
            });

            if (res.ok) {
                const savedPlacement = await res.json();
                // Update with real ID
                setPlacements(prev => prev.map(p => p.asset_id === assetId ? { ...p, id: savedPlacement.id } : p));
                toast.success('Asset placed');
            } else {
                throw new Error('Failed to save');
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to save placement');
            // Revert
            fetchPlacements(selectedPlan.id);
        }
    };

    const handleRemovePlacement = async (assetId: number) => {
        if (!selectedPlan) return;

        // Optimistic update
        setPlacements(prev => prev.filter(p => p.asset_id !== assetId));

        try {
            const res = await fetch(`/api/floor-plans/${selectedPlan.id}/placements?assetId=${assetId}`, {
                method: 'DELETE',
            });

            if (!res.ok) {
                throw new Error('Failed to remove');
            }
            toast.success('Placement removed');
        } catch (error) {
            console.error(error);
            toast.error('Failed to remove placement');
            fetchPlacements(selectedPlan.id);
        }
    };

    // Filter out assets that are already placed on THIS floor
    // (Or globally if we enforce single placement, but for now let's just hide from sidebar if on this floor)
    // Actually, if we enforce single placement globally, we should check if asset is in ANY placement?
    // But we only have placements for current floor loaded.
    // Ideally, the asset list should indicate if it's placed somewhere else.
    // For now, let's just hide if it's on the CURRENT floor.
    const unplacedAssets = allAssets.filter(
        (asset) => !placements.some((p) => p.asset_id === asset.id)
    );

    return (
        <div className="space-y-6 h-[calc(100vh-100px)] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between flex-shrink-0">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t('networkLayout')}</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage network equipment locations
                    </p>
                </div>
                <FloorPlanSelector
                    selectedId={selectedPlan?.id || null}
                    onSelect={setSelectedPlan}
                />
            </div>

            {/* Main Content */}
            <div className="flex-1 flex gap-6 overflow-hidden">
                {/* Sidebar */}
                <div className="flex-shrink-0">
                    <AssetSidebar
                        assets={unplacedAssets}
                        onDragStart={(e, asset) => {
                            e.dataTransfer.setData('assetId', asset.id.toString());
                        }}
                    />
                </div>

                {/* Editor Area */}
                <div className="flex-1 flex flex-col min-w-0 bg-background rounded-lg border shadow-sm overflow-hidden">
                    {selectedPlan ? (
                        <LayoutEditor
                            floorPlan={selectedPlan}
                            placements={placements}
                            onDropAsset={handleDropAsset}
                            onRemovePlacement={handleRemovePlacement}
                        />
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-muted-foreground">
                            <div className="text-center">
                                <p className="text-lg font-medium">No Floor Plan Selected</p>
                                <p className="text-sm">Select or create a floor plan to get started</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
