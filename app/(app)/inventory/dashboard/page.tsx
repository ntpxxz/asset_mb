"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, DollarSign, Archive, AlertTriangle, Boxes, Loader2, TrendingUp } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { toast } from "sonner";

// FIX 1: Update types to reflect that API can send numbers as strings
type InventoryStats = {
    total_stock_value: string | number;
    items_running_low: string | number;
    total_unique_items: string | number;
    total_quantity: string | number;
};

type ValueByCategory = {
    category: string;
    value: string | number;
}

type MostDispensed = {
    name: string;
    dispensed_count: string | number;
}

type DashboardData = {
    stats: InventoryStats;
    valueByCategory: ValueByCategory[];
    mostDispensed: MostDispensed[];
}

export default function InventoryDashboardPage() {
    const router = useRouter();
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);
            try {
                const response = await fetch('/api/inventory/dashboard');
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const result = await response.json();
                if (result.success) {
                    setData(result.data);
                } else {
                    toast.error("Failed to load dashboard data: " + (result.error || 'Unknown error'));
                }
            } catch (error: any) {
                toast.error("An error occurred while fetching data: " + error.message);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    // FIX 2: Create a robust currency formatter that handles both strings and numbers
    const formatCurrency = (value: number | string | null | undefined) => {
        if (value === null || value === undefined) return '฿0.00';
        const numValue = typeof value === 'string' ? parseFloat(value) : value;
        if (isNaN(numValue)) return '฿0.00';
        return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(numValue);
    };

    // FIX 3: Memoize and parse chart data, ensuring 'value' is a number
    const chartData = useMemo(() => {
        if (!data?.valueByCategory) return [];
        return data.valueByCategory.map(item => ({
            ...item,
            value: parseFloat(item.value as string),
        }));
    }, [data]);

    const stats = data?.stats;
    const kpiCards = [
        { title: "Total Stock Value", value: stats ? formatCurrency(stats.total_stock_value) : '฿0.00', icon: DollarSign, color: "text-green-600" },
        { title: "Items Running Low", value: stats ? Number(stats.items_running_low) : 0, icon: AlertTriangle, color: "text-orange-600" },
        { title: "Total Unique Items", value: stats ? Number(stats.total_unique_items) : 0, icon: Archive, color: "text-blue-600" },
        { title: "Total Quantity", value: stats ? Number(stats.total_quantity) : 0, icon: Boxes, color: "text-purple-600" },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center space-x-4">
                <Button variant="ghost" size="sm" onClick={() => router.push('/inventory')}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Inventory
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Inventory Dashboard</h1>
                    <p className="text-gray-600">A quick overview of your stock status.</p>
                </div>
            </div>

            {loading ? (
                 <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                 </div>
            ) : !data ? (
                 <div className="text-center py-10">
                    <p className="text-muted-foreground">Could not load dashboard data. Please try again.</p>
                 </div>
            ) : (
                <>
                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {kpiCards.map((card, index) => {
                            const Icon = card.icon;
                            return (
                                <Card key={index}>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                                        <Icon className={`h-4 w-4 ${card.color}`} />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{card.value}</div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                    
                    {/* Charts and Lists */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Stock Value by Category</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={chartData}  margin={{ left: 20, right: 30, top: 5, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" opacity={0.5}/>
                                        <XAxis 
                                            dataKey="category" 
                                            angle={-45} // Rotate labels
                                            textAnchor="end" // Align rotated labels
                                            height={60} // Increase height to fit labels
                                            interval={0}
                                            tick={{ fontSize: 12 }}
                                        />
                                        <YAxis 
                                            tickFormatter={(value) => `฿${value / 1000}k`}
                                        />                                   
                                        <Tooltip formatter={(value) => [formatCurrency(value as number), "Value"]} cursor={{ fill: 'rgba(243, 244, 246, 0.5)' }}/>
                                        <Bar dataKey="value" fill="#3b82f6" barSize={20} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <TrendingUp className="h-5 w-5 mr-2" />
                                    Most Dispensed Items (Last 90 Days)
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Item Name</TableHead>
                                            <TableHead className="text-right">Quantity Dispensed</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data.mostDispensed.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={2} className="h-24 text-center text-muted-foreground">No dispense data in the last 90 days.</TableCell>
                                            </TableRow>
                                        ) : data.mostDispensed.map((item, index) => (
                                            <TableRow key={index}>
                                                <TableCell className="font-medium">{item.name}</TableCell>
                                                <TableCell className="text-right">{String(item.dispensed_count)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>
                </>
            )}
        </div>
    );
}