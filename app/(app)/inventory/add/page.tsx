"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import InventoryForm from "../components/forms/inventory-form";
import { useI18n } from "@/lib/i18n-context";

export default function AddInventoryPage() {
  const router = useRouter();
  const { t } = useI18n();

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('back')}
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('addInventoryTitle')}</h1>
          <p className="text-gray-600">{t('addInventorySubtitle')}</p>
        </div>
      </div>

      <InventoryForm onSave={() => router.push('/inventory')} />
    </div>
  );
}