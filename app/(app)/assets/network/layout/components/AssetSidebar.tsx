'use client';

import { useState } from 'react';
import { Search, Network, Server, Router, ImageIcon } from 'lucide-react';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export type Asset = {
    id: number;
    asset_tag: string;
    model: string;
    type: string;
    ip_address: string;
    image_url?: string | null;
};

interface AssetSidebarProps {
    assets: Asset[];
    onDragStart: (e: React.DragEvent, asset: Asset) => void;
}

export function AssetSidebar({ assets, onDragStart }: AssetSidebarProps) {
    const [search, setSearch] = useState('');

    const filteredAssets = assets.filter(
        (a) =>
            a.asset_tag.toLowerCase().includes(search.toLowerCase()) ||
            a.model.toLowerCase().includes(search.toLowerCase()) ||
            (a.ip_address && a.ip_address.includes(search))
    );

    const getIcon = (type: string) => {
        const t = type.toLowerCase();
        if (t.includes('server')) return Server;
        if (t.includes('router') || t.includes('gateway')) return Router;
        return Network; // Default switch/other
    };

    return (
        <Card className="h-full flex flex-col w-80">
            <CardHeader className="p-4 border-b">
                <CardTitle className="text-lg">Available Assets</CardTitle>
                <div className="relative mt-2">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search assets..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-8"
                    />
                </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-hidden">
                <ScrollArea className="h-[calc(100vh-300px)]">
                    <div className="p-4 space-y-2">
                        {filteredAssets.length === 0 ? (
                            <div className="text-center text-muted-foreground py-8">
                                No assets found
                            </div>
                        ) : (
                            filteredAssets.map((asset) => {
                                const Icon = getIcon(asset.type);
                                return (
                                    <div
                                        key={asset.id}
                                        draggable
                                        onDragStart={(e) => onDragStart(e, asset)}
                                        className={cn(
                                            "flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent cursor-grab active:cursor-grabbing transition-colors"
                                        )}
                                    >
                                        <div className="h-10 w-10 rounded-md bg-muted/50 border flex items-center justify-center overflow-hidden relative flex-shrink-0">
                                            {asset.image_url ? (
                                                <Image
                                                    src={asset.image_url}
                                                    alt={asset.asset_tag}
                                                    fill
                                                    className="object-contain p-1"
                                                    unoptimized
                                                />
                                            ) : (
                                                <Icon className="h-5 w-5 text-muted-foreground" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm truncate">{asset.asset_tag}</p>
                                            <p className="text-xs text-muted-foreground truncate">{asset.model}</p>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
