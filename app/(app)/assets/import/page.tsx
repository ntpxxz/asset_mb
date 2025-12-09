'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FileSpreadsheet, Upload, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ImportPage() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);

    const handleImport = async () => {
        setLoading(true);
        setResult(null);
        const tid = toast.loading('Reading Excel file...');

        try {
            const res = await fetch('/api/assets/import', { method: 'POST' });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Import failed');

            setResult(data);
            toast.success(data.message, { id: tid });
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Failed to import';
            toast.error(msg, { id: tid });
            setResult({ error: msg });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-2xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">Import Assets</h1>
                <p className="text-gray-500">Update your inventory from a local Excel file.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileSpreadsheet className="h-5 w-5 text-green-600" />
                        Excel Import
                    </CardTitle>
                    <CardDescription>
                        The system will read the file from the server&apos;s local path.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-sm">
                        <p className="font-medium text-slate-700 mb-2">Instructions:</p>
                        <ol className="list-decimal list-inside space-y-1 text-slate-600">
                            <li>Ensure your Excel file is named <strong>assets.xlsx</strong></li>
                            <li>Place it in the server&apos;s document folder (e.g., <code>Documents/assets.xlsx</code>)</li>
                            <li>The file should have headers like: <em>Asset Tag, Serial Number, Model, Type, Status</em></li>
                        </ol>
                    </div>

                    <div className="flex justify-end">
                        <Button onClick={handleImport} disabled={loading} className="w-full sm:w-auto">
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Importing...
                                </>
                            ) : (
                                <>
                                    <Upload className="mr-2 h-4 w-4" />
                                    Start Import
                                </>
                            )}
                        </Button>
                    </div>

                    {result && (
                        <div className={`mt-4 p-4 rounded-lg border ${result.error ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                            {result.error ? (
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                                    <div>
                                        <h4 className="font-medium text-red-900">Import Failed</h4>
                                        <p className="text-red-700 text-sm mt-1">{result.error}</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-start gap-3">
                                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                                    <div>
                                        <h4 className="font-medium text-green-900">Import Successful</h4>
                                        <p className="text-green-700 text-sm mt-1">{result.message}</p>
                                        {result.stats && (
                                            <div className="mt-2 text-xs text-green-800 flex gap-4">
                                                <span>Success: <strong>{result.stats.success}</strong></span>
                                                <span>Errors: <strong>{result.stats.errors}</strong></span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
