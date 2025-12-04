"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Package } from "lucide-react";
import { AssetForm } from "../../components/forms/asset-form";
import { Card, CardContent } from "@/components/ui/card";
import type { AssetFormData } from "@/lib/data-store";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n-context";

/** ---------- Robust normalizer ---------- */
const toKey = (v?: string | null) =>
  String(v ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/_/g, " ");

const mapBy = (val: any, aliases: Record<string, string>) => {
  if (val == null || val === "") return undefined;
  const key = toKey(String(val));
  const asSlug = key.replace(/\s+/g, "-");
  const knownSlugs = new Set(Object.values(aliases));
  if (knownSlugs.has(asSlug)) return asSlug;
  return aliases[key] ?? undefined;
};

const TYPE_ALIASES: Record<string, string> = {
  laptop: "laptop",
  notebook: "laptop",
  desktop: "desktop",
  pc: "desktop",
  monitor: "monitor",
  display: "monitor",
  printer: "printer",
  phone: "phone",
  "mobile phone": "phone",
  mobile: "phone",
  smartphone: "phone",
  tablet: "tablet",
  server: "server",
  router: "router",
  switch: "switch",
  "network switch": "switch",
  "network-switch": "switch",
  firewall: "firewall",
  storage: "storage",
  "storage device": "storage",
  nas: "storage",
  san: "storage",
  projector: "projector",
  camera: "camera",
  other: "other",
};
const STATUS_ALIASES: Record<string, string> = {
  available: "available",
  assigned: "assigned",
  "in use": "assigned",
  maintenance: "maintenance",
  repair: "maintenance",
  "under maintenance": "maintenance",
  retired: "retired",
  disposed: "retired",
};
const LOCATION_ALIASES: Record<string, string> = {
  "clean room": "clean-room",
  "white room": "white-room",
  "spd office": "spd-office",
  "it room": "it-storage",
  "server room": "it-storage",
  warehouse: "warehouse",
  "fdb fan": "fdb-fan",
  remote: "remote",
  "remote location": "remote",
};
const DEPT_ALIASES: Record<string, string> = {
  engineering: "engineering",
  it: "it",
  "information technology": "it",
  production: "production",
  productions: "production",
};

function normalizeAssetData(raw: any): AssetFormData {
  const d: any = { ...raw };
  d.type = mapBy(d.type, TYPE_ALIASES);
  d.status = mapBy(d.status, STATUS_ALIASES);
  d.location = mapBy(d.location, LOCATION_ALIASES);
  d.department = mapBy(d.department, DEPT_ALIASES);

  const toDate = (v: any) => (v ? new Date(v).toISOString().split("T")[0] : undefined);
  d.purchasedate = toDate(d.purchasedate);
  d.warrantyexpiry = toDate(d.warrantyexpiry);
  d.lastpatch_check = toDate(d.lastpatch_check);

  return d as AssetFormData;
}
/** -------------------------------------- */

export default function EditAssetPage() {
  const router = useRouter();
  const { t } = useI18n();
  const { id } = useParams() as { id?: string }; // ✅ type ชัด

  const [assetData, setAssetData] = useState<AssetFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) void fetchAsset(id);
  }, [id]);

  const fetchAsset = async (assetId: string) => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/assets/${assetId}`, { cache: "no-store" });
      const result = await res.json().catch(() => ({} as any));
      if (!res.ok) throw new Error(result?.error || "Failed to fetch asset");

      if (result?.success && result?.data) {
        const data = normalizeAssetData(result.data);
        setAssetData(data);
      } else {
        setError("Asset not found");
      }
    } catch (e: any) {
      console.error("Error fetching asset:", e);
      setError(e?.message || "Failed to load asset");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (formData: AssetFormData) => {

    const payload = normalizeAssetData(formData);

    const tid = toast.loading("Updating asset...", {
      description: "Saving changes to database",
      className: "rounded-2xl border bg-white/90 backdrop-blur shadow-lg",
      duration: 5000,
    });

    let finished = false;

    try {
      const res = await fetch(`/api/assets/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json().catch(() => ({} as any));
      if (!res.ok || !result?.success) {
        throw new Error(result?.error || "Failed to update asset");
      }

      toast.success("Asset updated successfully", {
        id: tid,
        description: payload.asset_tag ? `Tag: ${payload.asset_tag}` : undefined,
        icon: "✅",
        className:
          "rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-900 shadow-lg",
        style: { boxShadow: "0 8px 24px rgba(16,185,129,.25)" },
        duration: 2000,
      });
      finished = true;
      setTimeout(() => router.push(`/assets/${id}`), 2200);
      return { success: true };
    } catch (err: any) {
      toast.error("Failed to update asset", {
        id: tid,
        description: err?.message || "Please try again.",
        icon: "⚠️",
        className:
          "rounded-2xl border border-rose-200 bg-rose-50 text-rose-900 shadow-lg",
        style: { boxShadow: "0 8px 24px rgba(244,63,94,.25)" },
        duration: 4000,
      });
      finished = true;
      return { success: false, error: err?.message || "Failed to update asset" };
    }
    finally {
      // safety: ถ้าเกิดกรณีผิดปกติที่ไม่เข้า try/catch หรือยังไม่แทนที่ toast
      if (!finished) {
        toast.dismiss(tid);
      }
    }
  };

  const handleCancel = () => router.back();

  if (error && !assetData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" /> {t('back')}
          </Button>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium">Asset Not Found</h3>
            <p className="text-gray-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" onClick={() => router.push("/assets")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> {t('back')}
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Asset</h1>
          {assetData && <p className="text-gray-600">{assetData.asset_tag}</p>}
        </div>
      </div>

      {/* รอให้โหลดเสร็จก่อนค่อย render form เพื่อกัน hydration glitch */}
      {!loading && (
        <AssetForm
          mode="edit"
          initialData={assetData ?? undefined}
          assetId={id as string}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={loading}
        />
      )}
    </div>
  );
}
