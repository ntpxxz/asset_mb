'use client';

import { useState, useEffect } from 'react';
import { useI18n } from '@/lib/i18n-context';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { FloorPlanSelector, FloorPlan } from './components/FloorPlanSelector';
import { AssetSidebar, Asset } from './components/AssetSidebar';
import { LayoutEditor, Placement, Connection } from './components/LayoutEditor';

export default function NetworkLayoutPage() {
    const { t } = useI18n();

    const [selectedPlan, setSelectedPlan] = useState<FloorPlan | null>(null);
    const [placements, setPlacements] = useState<Placement[]>([]);
    const [connections, setConnections] = useState<Connection[]>([]);
    const [allAssets, setAllAssets] = useState<Asset[]>([]);
    const [loadingAssets, setLoadingAssets] = useState(true);

    // Fetch all network assets on mount
    useEffect(() => {
        fetchAssets();
    }, []);

    // Fetch placements and connections when selected plan changes
    useEffect(() => {
        if (selectedPlan) {
            fetchPlacements(selectedPlan.id);
            fetchConnections(selectedPlan.id);
        } else {
            setPlacements([]);
            setConnections([]);
        }
    }, [selectedPlan]);

    const fetchAssets = async () => {
        try {
            const res = await fetch('/api/assets?type=network');
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

    const fetchConnections = async (planId: number) => {
        try {
            const res = await fetch(`/api/floor-plans/${planId}/connections`);
            if (res.ok) {
                const data = await res.json();
                setConnections(data);
            }
        } catch (error) {
            console.error('Failed to fetch connections', error);
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
        // Also remove connections involving this asset
        setConnections(prev => prev.filter(c => c.from_asset_id !== assetId && c.to_asset_id !== assetId));

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
            fetchConnections(selectedPlan.id);
        }
    };

    const handleConnectAssets = async (fromId: number, toId: number) => {
        if (!selectedPlan) return;

        // Check if connection already exists
        const exists = connections.some(c =>
            (c.from_asset_id === fromId && c.to_asset_id === toId) ||
            (c.from_asset_id === toId && c.to_asset_id === fromId)
        );

        if (exists) {
            toast.error('Connection already exists');
            return;
        }

        // Optimistic update
        const newConnection: Connection = {
            id: Date.now(),
            floor_plan_id: selectedPlan.id,
            from_asset_id: fromId,
            to_asset_id: toId
        };
        setConnections(prev => [...prev, newConnection]);

        try {
            const res = await fetch(`/api/floor-plans/${selectedPlan.id}/connections`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fromAssetId: fromId, toAssetId: toId }),
            });

            if (res.ok) {
                const savedConnection = await res.json();
                setConnections(prev => prev.map(c => c.id === newConnection.id ? savedConnection : c));
                toast.success('Connection created');
            } else {
                throw new Error('Failed to create connection');
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to create connection');
            fetchConnections(selectedPlan.id);
        }
    };

    const handleRemoveConnection = async (connectionId: number) => {
        if (!selectedPlan) return;

        setConnections(prev => prev.filter(c => c.id !== connectionId));

        try {
            const res = await fetch(`/api/floor-plans/${selectedPlan.id}/connections?connectionId=${connectionId}`, {
                method: 'DELETE',
            });

            if (!res.ok) {
                throw new Error('Failed to remove connection');
            }
            toast.success('Connection removed');
        } catch (error) {
            console.error(error);
            toast.error('Failed to remove connection');
            fetchConnections(selectedPlan.id);
        }
    };

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
                            connections={connections}
                            onDropAsset={handleDropAsset}
                            onRemovePlacement={handleRemovePlacement}
                            onConnectAssets={handleConnectAssets}
                            onRemoveConnection={handleRemoveConnection}
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
