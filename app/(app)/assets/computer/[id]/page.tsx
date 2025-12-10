// app/(app)/assets/computer/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    ArrowLeft,
    Package,
    Edit,
    Trash2,
    Monitor,
    Laptop,
    Smartphone,
    Printer,
    MapPin,
    User,
    RefreshCw,
    Activity,
    Cpu,
    Coins,
} from "lucide-react";
import { HardwareAsset } from "@/lib/data-store";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useI18n } from "@/lib/i18n-context";

const getStatusBadge = (status: string) => {
    switch (status) {
        case "assigned":
            return <Badge className="bg-green-100 text-green-800">Assigned</Badge>;
        case "available":
            return <Badge className="bg-blue-100 text-blue-800">Available</Badge>;
        case "maintenance":
            return <Badge className="bg-yellow-100 text-yellow-800">Maintenance</Badge>;
        case "retired":
            return <Badge className="bg-gray-100 text-gray-800">Retired</Badge>;
        default:
            return <Badge variant="secondary">{status}</Badge>;
    }
};


const getPatchStatusBadge = (status: string) => {
    switch (status) {
        case "up-to-date":
            return <Badge className="bg-green-100 text-green-800">Up-to-Date</Badge>;
        case "needs-review":
            return (
                <Badge className="bg-yellow-100 text-yellow-800">Needs Review</Badge>
            );
        case "update-pending":
            return <Badge className="bg-red-100 text-red-800">Update Pending</Badge>;
        default:
            return <Badge variant="secondary">{status}</Badge>;
    }
};

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
        default:
            return Monitor;
    }
};

export default function ComputerAssetViewPage() {
    const router = useRouter();
    const { t } = useI18n();
    const params = useParams();
    const [asset, setAsset] = useState<HardwareAsset | null>(null);
    const [assignedUser, setAssignedUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [history, setHistory] = useState<any[]>([]);

    const fetchHistory = async (id: string) => {
        try {
            const response = await fetch(`/api/assets/${id}/history`);
            const result = await response.json();
            if (result.success) {
                setHistory(result.data);
            }
        } catch (err) {
            console.error("Error fetching asset history:", err);
        }
    };

    const fetchAsset = async (id: string) => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`/api/assets/${id}`);
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Failed to fetch asset");
            }

            if (result.success && result.data) {
                // Convert date strings to YYYY-MM-DD format for HTML date inputs
                const data = { ...result.data };
                if (data.purchaseDate) {
                    data.purchaseDate = new Date(data.purchaseDate)
                        .toISOString()
                        .split("T")[0];
                }
                if (data.warrantyExpiry) {
                    data.warrantyExpiry = new Date(data.warrantyExpiry)
                        .toISOString()
                        .split("T")[0];
                }
                if (data.lastPatchCheck) {
                    data.lastPatchCheck = new Date(data.lastPatchCheck)
                        .toISOString()
                        .split("T")[0];
                }
                setAsset(data);
            } else {
                setError("Asset not found");
            }
        } catch (err) {
            console.error("Error fetching asset:", err);
            setError(err instanceof Error ? err.message : "Failed to load asset");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (params.id) {
            const id = params.id as string;
            fetchAsset(id);
            fetchHistory(id);
        }
    }, [params.id]);


    const handleDelete = async () => {
        if (!asset) return;

        if (confirm("Are you sure you want to delete this asset?")) {
            try {
                const response = await fetch(`/api/assets/${asset.id}`, {
                    method: "DELETE",
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    router.push("/assets/computer");
                } else {
                    alert(result.error || "Failed to delete asset");
                }
            } catch (err) {
                console.error("Error deleting asset:", err);
                alert("Failed to delete asset");
            }
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading asset details...</p>
                </div>
            </div>
        );
    }

    if (error || !asset) {
        return (
            <div className="space-y-6">
                <div className="flex items-center space-x-4">
                    <Button variant="ghost" size="sm" onClick={() => router.push("/assets/computer")}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        {t('back')}
                    </Button>
                </div>
                <Card>
                    <CardContent className="p-6 text-center">
                        <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            Asset Not Found
                        </h3>
                        <p className="text-gray-600">
                            {error || "The requested asset could not be found."}
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const Icon = getAssetIcon(asset.type);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm" className="-ml-2" onClick={() => router.push("/assets/computer")}>
                            <ArrowLeft className="h-4 w-4 mr-1" />
                            {t('back')}
                        </Button>
                    </div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold tracking-tight">
                            {asset.asset_tag}
                        </h1>
                        {getStatusBadge(asset.status)}
                        <Badge variant="outline" className="capitalize">{asset.condition}</Badge>
                    </div>
                    <p className="text-muted-foreground flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {asset.manufacturer} {asset.model}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/assets/computer/${asset.id}/edit`)}
                    >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                    </Button>
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleDelete}
                    >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="details" className="w-full">
                <TabsList>
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="history">History</TabsTrigger>
                </TabsList>
                <TabsContent value="details">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                        {/* Main Information (Left Column) */}
                        <div className="lg:col-span-2 space-y-6">

                            {/* System Overview */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Activity className="h-5 w-5 text-primary" />
                                        System Overview
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                        <div className="space-y-1">
                                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Processor</span>
                                            <p className="font-medium truncate" title={asset.processor}>{asset.processor || "-"}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Memory</span>
                                            <p className="font-medium">{asset.memory || "-"}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Storage</span>
                                            <p className="font-medium">{asset.storage || "-"}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">OS</span>
                                            <p className="font-medium">{asset.operatingsystem || "-"}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Software & Licensing */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Monitor className="h-5 w-5 text-primary" />
                                        Software & Licensing
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-sm font-medium text-muted-foreground">PC Name</label>
                                                <p className="text-base font-medium">{asset.pc_name || "-"}</p>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-muted-foreground">OS Version</label>
                                                <p className="text-base">{asset.operatingsystem || "-"}</p>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-muted-foreground">LicenseKey</label>
                                                <p className="text-base font-mono bg-muted/50 p-1 rounded px-2 w-fit">{asset.os_key || "-"}</p>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-sm font-medium text-muted-foreground">MS Office Version</label>
                                                <p className="text-base">{asset.ms_office_version || "-"}</p>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-muted-foreground">MS Office Apps</label>
                                                <p className="text-base">{asset.ms_office_apps || "-"}</p>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-muted-foreground">Legally Purchased</label>
                                                <p className="text-base">{asset.is_legally_purchased || "-"}</p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Network Information */}
                            {(asset.hostname || asset.ipaddress || asset.macaddress) && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Activity className="h-5 w-5 text-primary" />
                                            Network Information
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div>
                                                <label className="text-sm font-medium text-muted-foreground">Hostname</label>
                                                <p className="text-base font-mono">{asset.hostname || "-"}</p>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-muted-foreground">IP Address</label>
                                                <p className="text-base font-mono">{asset.ipaddress || "-"}</p>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-muted-foreground">MAC Address</label>
                                                <p className="text-base font-mono">{asset.macaddress || "-"}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Detailed Specs (if needed, mostly covered in Overview but good for extra fields) */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Cpu className="h-5 w-5 text-primary" />
                                        Hardware Details
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">Serial Number</label>
                                            <p className="text-base font-mono">{asset.serialnumber}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">Manufacturer</label>
                                            <p className="text-base">{asset.manufacturer}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">Model</label>
                                            <p className="text-base">{asset.model}</p>
                                        </div>
                                        {asset.description && (
                                            <div className="col-span-full">
                                                <label className="text-sm font-medium text-muted-foreground">Description</label>
                                                <p className="text-base">{asset.description}</p>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                        </div>

                        {/* Sidebar (Right Column) */}
                        <div className="space-y-6">

                            {/* Status & Assignment */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <User className="h-5 w-5 text-primary" />
                                        Assignment
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {assignedUser ? (
                                        <div className="flex items-start gap-4">
                                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                                {assignedUser.firstName?.[0]}{assignedUser.lastName?.[0]}
                                            </div>
                                            <div>
                                                <p className="font-medium text-lg leading-none">{assignedUser.firstName} {assignedUser.lastName}</p>
                                                <p className="text-sm text-muted-foreground mt-1">{assignedUser.email}</p>
                                                <div className="flex gap-2 mt-2">
                                                    <Badge variant="secondary">{assignedUser.department}</Badge>
                                                    <Badge variant="outline">{assignedUser.role}</Badge>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-6 bg-muted/30 rounded-lg border border-dashed">
                                            <User className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                                            <p className="text-muted-foreground">No user assigned</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Location */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <MapPin className="h-5 w-5 text-primary" />
                                        Location
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-medium text-muted-foreground uppercase">Location</label>
                                            <p className="font-medium">{asset.location}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-muted-foreground uppercase">Building</label>
                                            <p className="font-medium">{asset.building || "-"}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-muted-foreground uppercase">Division</label>
                                            <p className="font-medium">{asset.division || "-"}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-muted-foreground uppercase">Section</label>
                                            <p className="font-medium">{asset.section || "-"}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-muted-foreground uppercase">Area</label>
                                            <p className="font-medium">{asset.area || "-"}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-muted-foreground uppercase">Department</label>
                                            <p className="font-medium">{asset.department || "-"}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Purchase Information */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Coins className="h-5 w-5 text-primary" />
                                        Purchase Info
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex justify-between items-center border-b pb-2">
                                        <span className="text-sm text-muted-foreground">Price</span>
                                        <span className="font-bold text-lg">{asset.purchaseprice ? `${asset.purchaseprice}฿` : "-"}</span>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex justify-between">
                                            <span className="text-sm text-muted-foreground">Date</span>
                                            <span className="text-sm font-medium">{asset.purchasedate ? asset.purchasedate.split("T")[0] : "-"}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-muted-foreground">Warranty</span>
                                            <span className="text-sm font-medium">{asset.warrantyexpiry ? asset.warrantyexpiry.split("T")[0] : "-"}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-muted-foreground">Supplier</span>
                                            <span className="text-sm font-medium">{asset.supplier || "-"}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Notes */}
                            {asset.notes && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <span>Notes</span>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/30 p-3 rounded-md">
                                            {asset.notes}
                                        </p>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>
                </TabsContent>
                <TabsContent value="history">
                    <Card className="mt-4">
                        <CardHeader>
                            <CardTitle>Asset History</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date/Time</TableHead>
                                        <TableHead>Action</TableHead>
                                        <TableHead>Field</TableHead>
                                        <TableHead>Old Value</TableHead>
                                        <TableHead>New Value</TableHead>
                                        <TableHead>Changed By</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {history.length > 0 ? (
                                        history.map((entry) => (
                                            <TableRow key={entry.id}>
                                                <TableCell>{new Date(entry.change_date).toLocaleString()}</TableCell>
                                                <TableCell><Badge variant="outline">{entry.action}</Badge></TableCell>
                                                <TableCell>{entry.field_changed}</TableCell>
                                                <TableCell>{entry.old_value}</TableCell>
                                                <TableCell>{entry.new_value}</TableCell>
                                                <TableCell>{entry.changed_by_user_id || 'System'}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-8">No history found.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
