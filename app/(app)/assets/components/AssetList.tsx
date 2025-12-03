// app/(app)/assets/components/AssetList.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Plus,
    Search,
    Download,
    Edit,
    Trash2,
    Eye,
    Monitor,
    Laptop,
    Smartphone,
    Printer,
    RefreshCw,
    AlertCircle,
} from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import type { AssetFormData } from "@/lib/data-store";
import { useI18n } from "@/lib/i18n-context";

interface AssetListProps {
    /** Optional default category (e.g. "computer" or "network") */
    defaultCategory?: string;
    /** Initial data can be passed for SSR – keep same shape as before */
    initialData?: {
        assets: AssetFormData[];
        total: number;
    };
    /** Base path for routing (e.g. "/assets/computer"), defaults to "/assets" */
    basePath?: string;
}

// Helper to render a colored badge based on asset status
const getStatusBadge = (status: string, t: (key: string) => string) => {
    switch (status) {
        case "assigned":
            return <Badge className="bg-green-100 text-green-800">{t('assigned')}</Badge>;
        case "available":
            return <Badge className="bg-blue-100 text-blue-800">{t('available')}</Badge>;
        case "maintenance":
            return <Badge className="bg-yellow-100 text-yellow-800">{t('maintenance')}</Badge>;
        case "retired":
            return <Badge className="bg-gray-100 text-gray-800">{t('retired')}</Badge>;
        default:
            return <Badge variant="secondary">{status}</Badge>;
    }
};

// Icon selector based on asset type
const getAssetIcon = (type: string) => {
    switch (type) {
        case "laptop":
            return Laptop;
        case "desktop":
            return Monitor;
        case "phone":
        case "tablet":
            return Smartphone;
        case "printer":
            return Printer;
        case "server":
            return Monitor;
        case "router":
        case "switch":
            return Monitor;
        default:
            return Monitor;
    }
};

export default function AssetList({ defaultCategory, initialData, basePath = "/assets" }: AssetListProps) {
    const router = useRouter();
    const { t } = useI18n();

    // If initial data is provided (SSR) use it, otherwise start empty
    const [assets, setAssets] = useState<AssetFormData[]>(initialData?.assets ?? []);
    const [total, setTotal] = useState<number>(initialData?.total ?? 0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // UI state
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [categoryFilter, setCategoryFilter] = useState(defaultCategory ?? "all");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    // Debounced search term for server queries
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedSearchTerm(searchTerm), 300);
        return () => clearTimeout(handler);
    }, [searchTerm]);

    // Load assets from API with filters & pagination
    const loadAssets = async (page = 1) => {
        setLoading(true);
        setError(null);
        try {
            const limit = itemsPerPage;
            const offset = (page - 1) * itemsPerPage;
            const qs = new URLSearchParams();
            qs.set("limit", String(limit));
            qs.set("offset", String(offset));
            if (statusFilter !== "all") qs.set("status", statusFilter);
            if (categoryFilter !== "all") qs.set("type", categoryFilter);
            if (debouncedSearchTerm) qs.set("search", debouncedSearchTerm);

            const res = await fetch(`/api/assets?${qs.toString()}`);
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);

            setAssets(Array.isArray(json.data) ? json.data : []);
            setTotal(Number(json.total ?? 0));
        } catch (err) {
            setAssets([]);
            setTotal(0);
            setError(err instanceof Error ? err.message : "Failed to load assets");
        } finally {
            setLoading(false);
        }
    };

    // Reload when filters change (reset to page 1)
    useEffect(() => {
        setCurrentPage(1);
        loadAssets(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [statusFilter, categoryFilter, debouncedSearchTerm]);

    // Reload when page changes
    useEffect(() => {
        loadAssets(currentPage);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage]);

    // CRUD helpers
    const handleDelete = async (assetId: string) => {
        if (!confirm(t('confirmDelete'))) return;
        try {
            const response = await fetch(`/api/assets/${assetId}`, { method: "DELETE" });
            const result = await response.json();
            if (response.ok && result.success) {
                loadAssets(currentPage);
            } else {
                throw new Error(result.error || t('deleteFailed'));
            }
        } catch (err) {
            alert(`${t('deleteFailed')}: ${err instanceof Error ? err.message : "Unknown error"}`);
        }
    };

    const handleView = (asset: any) => router.push(`${basePath}/${asset.id}`);
    const handleEdit = (asset: any) => router.push(`${basePath}/${asset.id}/edit`);

    // Export to CSV function
    const handleExportCSV = () => {
        if (assets.length === 0) {
            alert(t('noDataToExport'));
            return;
        }

        // Define CSV headers including new fields
        const headers = [
            'Asset Tag',
            'Type',
            'Manufacturer',
            'Model',
            'Serial Number',
            'Status',
            'Assigned User',
            'Building',
            'Division',
            'Section',
            'Area',
            'PC Name',
            'OS',
            'OS Version',
            'OS Key',
            'MS Office Apps',
            'MS Office Version',
            'Legally Purchased',
            'Processor',
            'Memory',
            'Storage',
            'Hostname',
            'IP Address',
            'MAC Address',
            'Purchase Date',
            'Purchase Price',
            'Supplier',
            'Warranty Expiry',
            'Location',
            'Department',
            'Description',
            'Notes'
        ];

        // Map assets to CSV rows
        const rows = assets.map(asset => [
            asset.asset_tag || '',
            asset.type || '',
            asset.manufacturer || '',
            asset.model || '',
            asset.serialnumber || '',
            asset.status || '',
            asset.assigneduser || '',
            asset.building || '',
            asset.division || '',
            asset.section || '',
            asset.area || '',
            asset.pc_name || '',
            asset.operatingsystem || '',
            asset.os_version || '',
            asset.os_key || '',
            asset.ms_office_apps || '',
            asset.ms_office_version || '',
            asset.is_legally_purchased || '',
            asset.processor || '',
            asset.memory || '',
            asset.storage || '',
            asset.hostname || '',
            asset.ipaddress || '',
            asset.macaddress || '',
            asset.purchasedate || '',
            asset.purchaseprice?.toString() || '',
            asset.supplier || '',
            asset.warrantyexpiry || '',
            asset.location || '',
            asset.department || '',
            asset.description || '',
            asset.notes || ''
        ]);

        // Create CSV content
        const csvContent = [
            headers.map(h => `"${h}"`).join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        // Create and download file
        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        const filename = `assets-${categoryFilter !== 'all' ? categoryFilter : 'all'}-${new Date().toISOString().split('T')[0]}.csv`;
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const totalPages = useMemo(() => Math.max(1, Math.ceil(total / itemsPerPage)), [total, itemsPerPage]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t('hardwareAssets')}</h1>
                    <p className="text-gray-600">{t('manageAssets')}</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" size="sm" onClick={() => loadAssets(currentPage)} disabled={loading}>
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                        {t('refresh')}
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleExportCSV}>
                        <Download className="h-4 w-4 mr-2" />
                        {t('exportCSV')}
                    </Button>
                    <Button size="sm" onClick={() => router.push(`${basePath}/add`)}>
                        <Plus className="h-4 w-4 mr-2" />
                        {t('addNew')}
                    </Button>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <Card className="border-red-200">
                    <CardContent className="p-4">
                        <div className="flex items-center text-red-700">
                            <AlertCircle className="h-4 w-4 mr-2" />
                            <span>{error}</span>
                            <Button variant="outline" size="sm" className="ml-auto" onClick={() => loadAssets(currentPage)}>
                                {t('retry')}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Filters */}
            <Card>
                <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder={t('searchPlaceholderAssets')}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[150px]">
                                <SelectValue placeholder={t('status')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t('allStatus')}</SelectItem>
                                <SelectItem value="available">{t('available')}</SelectItem>
                                <SelectItem value="assigned">{t('assigned')}</SelectItem>
                                <SelectItem value="maintenance">{t('maintenance')}</SelectItem>
                                <SelectItem value="retired">{t('retired')}</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                            <SelectTrigger className="w-[150px]">
                                <SelectValue placeholder={t('category')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t('allCategories')}</SelectItem>
                                <SelectItem value="laptop">{t('laptop')}</SelectItem>
                                <SelectItem value="desktop">{t('desktop')}</SelectItem>
                                <SelectItem value="phone">{t('phoneDevice')}</SelectItem>
                                <SelectItem value="tablet">{t('tablet')}</SelectItem>
                                <SelectItem value="printer">{t('printer')}</SelectItem>
                                <SelectItem value="monitor">{t('monitor')}</SelectItem>
                                <SelectItem value="server">{t('server')}</SelectItem>
                                <SelectItem value="router">{t('router')}</SelectItem>
                                <SelectItem value="switch">{t('networkSwitch')}</SelectItem>
                            </SelectContent>
                        </Select>
                        {(searchTerm || statusFilter !== 'all' || categoryFilter !== 'all') && (
                            <Button
                                variant="ghost"
                                onClick={() => {
                                    setSearchTerm('');
                                    setStatusFilter('all');
                                    setCategoryFilter('all');
                                }}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                                Clear Filters
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Assets Table */}
            <Card>
                <CardHeader>
                    <CardTitle>{t('hardwareInventory')} ({total} {t('items')})</CardTitle>
                </CardHeader>
                <CardContent>
                    {assets.length === 0 ? (
                        <div className="text-center py-8">
                            <Monitor className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500">{t('noAssetsFound')}</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader className="bg-gray-50/50">
                                        <TableRow>
                                            <TableHead className="font-semibold text-gray-700">{t('name')}</TableHead>
                                            <TableHead className="font-semibold text-gray-700">{t('model')}</TableHead>
                                            <TableHead className="font-semibold text-gray-700">{t('serialNumber')}</TableHead>
                                            <TableHead className="font-semibold text-gray-700">{t('status')}</TableHead>
                                            <TableHead className="font-semibold text-gray-700">{t('user')}</TableHead>
                                            <TableHead className="font-semibold text-gray-700">{t('location')}</TableHead>
                                            <TableHead className="font-semibold text-gray-700">{t('price')}</TableHead>
                                            <TableHead className="font-semibold text-gray-700">{t('actions')}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {assets.map((asset) => {
                                            const Icon = getAssetIcon(asset.type!);
                                            return (
                                                <TableRow key={asset.id} className="hover:bg-gray-50/80 transition-colors">
                                                    <TableCell className="font-mono text-sm">
                                                        <div className="flex items-center space-x-3">
                                                            <div className="p-2 bg-gray-100 rounded-lg">
                                                                <Icon className="h-4 w-4 text-gray-600" />
                                                            </div>
                                                            <div>
                                                                <p className="font-medium">{asset.asset_tag || "-"}</p>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center space-x-3">
                                                            <div>
                                                                <p className="font-medium">{asset.manufacturer} {asset.model}</p>
                                                                <p className="text-sm text-gray-500 capitalize">{asset.type}</p>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="font-mono text-sm">{asset.serialnumber || "-"}</TableCell>
                                                    <TableCell>{getStatusBadge(asset.status!, t)}</TableCell>
                                                    <TableCell>{asset.assigneduser || "-"}</TableCell>
                                                    <TableCell>{asset.location || "-"}</TableCell>
                                                    <TableCell className="font-medium">
                                                        {asset.purchaseprice ? `${asset.purchaseprice}฿` : "-"}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center space-x-2">
                                                            <Button variant="ghost" size="sm" onClick={() => handleView(asset)} title={t('viewDetails')}>
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                            <Button variant="ghost" size="sm" onClick={() => handleEdit(asset)} title={t('editAsset')}>
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                            <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleDelete(asset.id!)} title={t('deleteAsset')}>
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Pagination controls */}
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">
                                    {t('page')} {currentPage} {t('of')} {totalPages}
                                </span>
                                <div className="space-x-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                                        disabled={currentPage === 1 || loading}
                                    >
                                        {t('previous')}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                                        disabled={currentPage >= totalPages || loading}
                                    >
                                        {t('next')}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
