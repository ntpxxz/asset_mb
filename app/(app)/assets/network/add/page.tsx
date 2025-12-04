'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { AssetForm } from '../../components/forms/asset-form';
import { toast } from 'sonner';
import { useI18n } from '@/lib/i18n-context';

export default function AddNetworkAssetPage() {
    const router = useRouter();
    const { t } = useI18n();

    const handleSubmit = async (formData: any) => {
        const tid = toast.loading("Adding network asset...", {
            description: "Saving to database",
            className: "rounded-2xl border bg-white/90 backdrop-blur shadow-lg",
            duration: 10000,
        });

        try {
            const res = await fetch('/api/assets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const result = await res.json();
            if (!res.ok || !result.success) {
                throw new Error(result.error || 'Failed to create asset');
            }

            toast.success("Network asset added successfully", {
                id: tid,
                description: `New Network Device Added Successfully`,
                icon: "✅",
                className: "rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-900 shadow-lg",
                duration: 2000,
            });

            setTimeout(() => router.push('/assets/network'), 2200);
            return { success: true };
        } catch (err) {
            toast.error("Failed to add asset", {
                id: tid,
                description: "Please try again.",
                icon: "⚠️",
                className: "rounded-2xl border border-rose-200 bg-rose-50 text-rose-900 shadow-lg",
                duration: 4000,
            });

            return { success: false, error: err instanceof Error ? err.message : 'Failed to create asset' };
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center space-x-4">
                <Button variant="ghost" size="sm" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    {t('back')}
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Add Network Asset</h1>
                    <p className="text-gray-600">Create a new network device record</p>
                </div>
            </div>

            <AssetForm
                mode="create"
                category="network"
                onSubmit={handleSubmit}
                onCancel={() => router.back()}
            />
        </div>
    );
}
