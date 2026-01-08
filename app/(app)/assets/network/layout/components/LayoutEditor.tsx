'use client';

import { useRef, useState } from 'react';

import { Network, Server, Router, Info, Trash2, Save, Link as LinkIcon, X } from 'lucide-react';
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

export type Connection = {
    id: number;
    floor_plan_id: number;
    from_asset_id: number;
    to_asset_id: number;
};

interface LayoutEditorProps {
    floorPlan: FloorPlan;
    placements: Placement[];
    connections: Connection[];
    onDropAsset: (assetId: number, x: number, y: number) => void;
    onRemovePlacement: (assetId: number) => void;
    onConnectAssets: (fromId: number, toId: number) => void;
    onRemoveConnection: (connectionId: number) => void;
}

export function LayoutEditor({
    floorPlan,
    placements,
    connections,
    onDropAsset,
    onRemovePlacement,
    onConnectAssets,
    onRemoveConnection,
}: LayoutEditorProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const [draggedPlacementId, setDraggedPlacementId] = useState<number | null>(null);

    // Zoom and Pan state
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [startPan, setStartPan] = useState({ x: 0, y: 0 });

    // Drag-to-Connect state
    const [dragConnectionStart, setDragConnectionStart] = useState<number | null>(null);
    const [dragConnectionCurrent, setDragConnectionCurrent] = useState<{ x: number, y: number } | null>(null);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        if (!contentRef.current) return;

        const rect = contentRef.current.getBoundingClientRect();

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

        if (dragConnectionStart && contentRef.current) {
            e.preventDefault();
            const rect = contentRef.current.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            setDragConnectionCurrent({ x, y });
        }
    };

    const handleMouseUp = (e: React.MouseEvent) => {
        setIsPanning(false);

        if (dragConnectionStart) {
            // Check if we dropped on an asset
            const target = e.target as HTMLElement;
            const assetMarker = target.closest('.asset-marker');
            if (assetMarker) {
                const targetId = parseInt(assetMarker.getAttribute('data-asset-id') || '0');
                if (targetId && targetId !== dragConnectionStart) {
                    onConnectAssets(dragConnectionStart, targetId);
                }
            }
            setDragConnectionStart(null);
            setDragConnectionCurrent(null);
        }
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

    const handleConnectorMouseDown = (e: React.MouseEvent, assetId: number) => {
        e.stopPropagation();
        e.preventDefault();
        setDragConnectionStart(assetId);

        // Set initial position to the asset's position
        const placement = placements.find(p => p.asset_id === assetId);
        if (placement) {
            setDragConnectionCurrent({ x: placement.x_position, y: placement.y_position });
        }
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
                    isPanning && "cursor-grabbing",
                    dragConnectionStart && "cursor-crosshair"
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
                        left: '50%',
                        top: '50%',
                        marginLeft: floorPlan ? '-400px' : 0,
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

                        {/* Connections Layer (SVG) */}
                        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-visible">
                            {connections.map(conn => {
                                const from = placements.find(p => p.asset_id === conn.from_asset_id);
                                const to = placements.find(p => p.asset_id === conn.to_asset_id);
                                if (!from || !to) return null;
                                return (
                                    <g key={conn.id} className="group cursor-pointer pointer-events-auto" onClick={(e) => {
                                        e.stopPropagation();
                                        if (confirm('Delete connection?')) {
                                            onRemoveConnection(conn.id);
                                        }
                                    }}>
                                        <line
                                            x1={`${from.x_position}%`}
                                            y1={`${from.y_position}%`}
                                            x2={`${to.x_position}%`}
                                            y2={`${to.y_position}%`}
                                            stroke="#3b82f6"
                                            strokeWidth="2"
                                            strokeDasharray="4,4"
                                            className="opacity-60 group-hover:opacity-100 group-hover:stroke-red-500 transition-all animate-flow"
                                        />
                                        {/* Invisible wider line for easier clicking */}
                                        <line
                                            x1={`${from.x_position}%`}
                                            y1={`${from.y_position}%`}
                                            x2={`${to.x_position}%`}
                                            y2={`${to.y_position}%`}
                                            stroke="transparent"
                                            strokeWidth="10"
                                        />
                                    </g>
                                );
                            })}
                            {/* Dragging Line */}
                            {dragConnectionStart && dragConnectionCurrent && (
                                (() => {
                                    const from = placements.find(p => p.asset_id === dragConnectionStart);
                                    if (!from) return null;
                                    return (
                                        <line
                                            x1={`${from.x_position}%`}
                                            y1={`${from.y_position}%`}
                                            x2={`${dragConnectionCurrent.x}%`}
                                            y2={`${dragConnectionCurrent.y}%`}
                                            stroke="#3b82f6"
                                            strokeWidth="2"
                                            strokeDasharray="4,4"
                                            className="animate-pulse"
                                        />
                                    );
                                })()
                            )}
                        </svg>

                        {/* Placements */}
                        {placements.map((p) => {
                            const Icon = getIcon(p.type);

                            return (
                                <Popover key={p.id}>
                                    <PopoverTrigger asChild>
                                        <div
                                            draggable={!dragConnectionStart}
                                            onDragStart={(e) => {
                                                e.stopPropagation();
                                                setDraggedPlacementId(p.id);
                                            }}
                                            className={cn(
                                                "asset-marker absolute transform -translate-x-1/2 -translate-y-1/2 transition-transform z-10 group",
                                                "cursor-pointer hover:scale-110"
                                            )}
                                            style={{ left: `${p.x_position}%`, top: `${p.y_position}%` }}
                                            onMouseDown={(e) => e.stopPropagation()}
                                            data-asset-id={p.asset_id}
                                        >
                                            <div className="bg-primary text-primary-foreground p-2 rounded-full shadow-md border-2 border-white relative">
                                                <Icon className="h-5 w-5" />

                                                {/* Connector Handle */}
                                                <div
                                                    className="absolute -right-1 top-1/2 -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full border border-white opacity-0 group-hover:opacity-100 cursor-crosshair transition-opacity hover:scale-125"
                                                    onMouseDown={(e) => handleConnectorMouseDown(e, p.asset_id)}
                                                    title="Drag to connect"
                                                />
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
                Scroll to zoom • Drag to pan • Drag assets to move • Drag blue dot to connect
            </div>
        </div>
    );
}
