'use client';

import { useRef, useState } from 'react';

import { Network, Server, Router, Info, Trash2, Save } from 'lucide-react';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { FloorPlan } from './FloorPlanSelector';
import { Asset } from './AssetSidebar';

export type Placement = {
    id: number;
    asset_id: number;
    floor_plan_id: number;
    x_position: number;
    y_position: number;
    asset_tag: string;
    model: string;
    type: string;
    ipaddress: string;
};

interface LayoutEditorProps {
    floorPlan: FloorPlan;
    placements: Placement[];
    onDropAsset: (assetId: number, x: number, y: number) => void;
    onRemovePlacement: (assetId: number) => void;
}

export function LayoutEditor({
    floorPlan,
    placements,
    onDropAsset,
    onRemovePlacement,
}: LayoutEditorProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const [draggedPlacementId, setDraggedPlacementId] = useState<number | null>(null);

    // Zoom and Pan state
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [startPan, setStartPan] = useState({ x: 0, y: 0 });

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        if (!contentRef.current) return;

        const rect = contentRef.current.getBoundingClientRect();

        // Calculate relative position within the scaled content
        // We need to account for the scale and current pan position
        // But wait, the drop target IS the scaled content div?
        // If we drop on the container, we need to transform.
        // Let's assume the drop target is the content div (the one with the image).

        // Actually, if we use the content div as drop target, the coordinates are relative to it.
        // But `e.clientX` is global.

        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        // Clamp values to 0-100
        const clampedX = Math.max(0, Math.min(100, x));
        const clampedY = Math.max(0, Math.min(100, y));

        const assetIdStr = e.dataTransfer.getData('assetId');
        if (assetIdStr) {
            onDropAsset(parseInt(assetIdStr), clampedX, clampedY);
        } else if (draggedPlacementId) {
            const placement = placements.find(p => p.id === draggedPlacementId);
            if (placement) {
                onDropAsset(placement.asset_id, clampedX, clampedY);
            }
            setDraggedPlacementId(null);
        }
    };

    // Pan Handlers
    const handleMouseDown = (e: React.MouseEvent) => {
        // Check if we clicked on an interactive element (asset, button, etc.)
        const target = e.target as HTMLElement;
        const isInteractive = target.closest('button') || target.closest('.asset-marker') || target.closest('.popover-trigger');

        if (!isInteractive) {
            setIsPanning(true);
            setStartPan({ x: e.clientX - position.x, y: e.clientY - position.y });
            // Prevent text selection
            e.preventDefault();
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isPanning) {
            e.preventDefault();
            setPosition({
                x: e.clientX - startPan.x,
                y: e.clientY - startPan.y
            });
        }
    };

    const handleMouseUp = () => {
        setIsPanning(false);
    };

    // Zoom Handlers
    const handleWheel = (e: React.WheelEvent) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const delta = e.deltaY * -0.01;
            const newScale = Math.min(Math.max(0.5, scale + delta), 4);
            setScale(newScale);
        }
    };

    const zoomIn = () => setScale(s => Math.min(s + 0.2, 4));
    const zoomOut = () => setScale(s => Math.max(s - 0.2, 0.5));
    const resetView = () => {
        setScale(1);
        setPosition({ x: 0, y: 0 });
    };

    const getIcon = (type: string) => {
        const t = type?.toLowerCase() || '';
        if (t.includes('server')) return Server;
        if (t.includes('router') || t.includes('gateway')) return Router;
        return Network;
    };

    return (
        <div className="flex-1 flex flex-col h-full relative overflow-hidden bg-muted/20 border rounded-lg">
            {/* Toolbar */}
            <div className="absolute top-4 right-4 z-20 flex flex-col gap-2 bg-background/90 backdrop-blur p-2 rounded-lg border shadow-sm">
                <Button variant="outline" size="icon" onClick={zoomIn} title="Zoom In">
                    <span className="text-lg">+</span>
                </Button>
                <Button variant="outline" size="icon" onClick={zoomOut} title="Zoom Out">
                    <span className="text-lg">-</span>
                </Button>
                <Button variant="outline" size="icon" onClick={resetView} title="Reset View">
                    <span className="text-xs">1:1</span>
                </Button>
            </div>

            {/* Canvas Container */}
            <div
                ref={containerRef}
                className={cn(
                    "flex-1 overflow-hidden relative cursor-grab active:cursor-grabbing",
                    isPanning && "cursor-grabbing"
                )}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onWheel={handleWheel}
            >
                {/* Scalable Content */}
                <div
                    ref={contentRef}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    className="absolute origin-center transition-transform duration-75 ease-out"
                    style={{
                        transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                        // Center initially if position is 0,0? 
                        // Actually, let's just start at top-left or center.
                        // To center, we might need to know content size vs container size.
                        // For now, let's rely on manual pan.
                        left: '50%',
                        top: '50%',
                        marginLeft: floorPlan ? '-400px' : 0, // Approximate centering logic or just rely on flex
                        marginTop: floorPlan ? '-300px' : 0,
                    }}
                >
                    <div className="relative shadow-lg bg-white inline-block">
                        <img
                            src={floorPlan.image_url}
                            alt={floorPlan.name}
                            className="max-w-none pointer-events-none select-none"
                            style={{ maxHeight: '800px' }} // Base size
                            draggable={false}
                        />

                        {/* Placements */}
                        {placements.map((p) => {
                            const Icon = getIcon(p.type);
                            return (
                                <Popover key={p.id}>
                                    <PopoverTrigger asChild>
                                        <div
                                            draggable
                                            onDragStart={(e) => {
                                                e.stopPropagation(); // Prevent panning start
                                                setDraggedPlacementId(p.id);
                                            }}
                                            className="asset-marker absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer hover:scale-110 transition-transform z-10"
                                            style={{ left: `${p.x_position}%`, top: `${p.y_position}%` }}
                                            // Prevent panning when clicking asset
                                            onMouseDown={(e) => e.stopPropagation()}
                                        >
                                            <div className="bg-primary text-primary-foreground p-2 rounded-full shadow-md border-2 border-white">
                                                <Icon className="h-5 w-5" />
                                            </div>
                                            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-black/75 text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap pointer-events-none">
                                                {p.asset_tag}
                                            </div>
                                        </div>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-64 p-3">
                                        <div className="space-y-2">
                                            <h4 className="font-medium leading-none">{p.asset_tag}</h4>
                                            <p className="text-sm text-muted-foreground">{p.model}</p>
                                            <div className="text-xs text-muted-foreground grid grid-cols-2 gap-1">
                                                <span>IP:</span> <span className="font-mono">{p.ipaddress || 'N/A'}</span>
                                                <span>Type:</span> <span>{p.type}</span>
                                            </div>
                                            <div className="pt-2 flex justify-between">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8 px-2"
                                                    asChild
                                                >
                                                    <a href={`/assets/network/${p.asset_id}/edit`} target="_blank" rel="noopener noreferrer">
                                                        <Info className="h-3 w-3 mr-1" /> Details
                                                    </a>
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    className="h-8 px-2"
                                                    onClick={() => onRemovePlacement(p.asset_id)}
                                                >
                                                    <Trash2 className="h-3 w-3 mr-1" /> Remove
                                                </Button>
                                            </div>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Overlay instructions */}
            <div className="absolute bottom-4 left-4 bg-background/80 backdrop-blur p-2 rounded text-xs text-muted-foreground border pointer-events-none">
                Scroll to zoom • Drag to pan • Drag assets to move
            </div>
        </div>
    );
}
