"use client";

import React, { Suspense, useEffect, useState, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Activity, Save, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

type Asset = {
  asset_tag: string;
  manufacturer?: string;
  model?: string;
  status?: string;      // 'available' | ...
  isloanable?: boolean; // ใช้ key นี้เท่านั้น
};

type User = {
  id: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  department?: string;
};

function CheckoutAssetPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();


  const [formData, setFormData] = useState({
    asset_tag: "",
    borrowername: "",
    borrowercontact: "",
    checkout_date: new Date().toISOString().split("T")[0],
    expected_returndate: "",
    purpose: "",
    location: "",
    notes: "",
  });

  const [availableAssets, setAvailableAssets] = useState<Asset[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.asset_tag) {
      setSubmitError("Please select an Asset.");
      return;
    }
    setSubmitting(true);
    setSubmitError(null);

    const tid = toast.loading("Processing check-out...", {
      description: "Saving return details…",
      className:
        "rounded-2xl border bg-white/90 backdrop-blur shadow-lg",
      duration: 1000, 
    });
    
    let finished = false; 
    try {
      const res = await fetch("/api/borrowing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          asset_tag: formData.asset_tag,
          borrowername: formData.borrowername.trim(),
          borrowercontact: formData.borrowercontact.trim() || null,
          checkout_date: formData.checkout_date,
          due_date: formData.expected_returndate || null,
          purpose: formData.purpose || null,
          location: formData.location || null,
          notes: formData.notes || null,
          status: "checked-out",
        }),
      });
  
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.success === false) {
        throw new Error(json?.error || (res.status === 409 ? "This asset is already checked out." : `Checkout failed (${res.status})`));
      }
      toast.success("Check-out complete", {
        id: tid, // อัปเดตแทนตัว loading
        description: `Asset ${formData.asset_tag} has been checked out.`,
        icon: "✅",
        className:
          "rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-900 shadow-lg",
        style: { boxShadow: "0 8px 24px rgba(16,185,129,.25)" },
        duration: 2000,
      });
      finished = true;
      setTimeout(() => router.push("/borrowing"), 2200);
    } catch (err: any) {

      toast.error("Check-out failed", {
        id: tid, // อัปเดตแทนตัว loading เช่นกัน
        description: err?.message ?? "Please try again.",
        icon: "⚠️",
        className:
          "rounded-2xl border border-rose-200 bg-rose-50 text-rose-900 shadow-lg",
        style: { boxShadow: "0 8px 24px rgba(244,63,94,.25)" },
        duration: 4000,
      });
      finished = true;
      
      setSubmitError(err instanceof Error ? err.message : "Checkout failed.");
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // ---------- Load data ----------
  const loadData = useCallback(async () => {
    setLoadingAssets(true);
    try {
      // 1) assets
      const assetsRes = await fetch("/api/assets");
      const assetsJson = await assetsRes.json();
      const allAssets: Asset[] = assetsJson?.success ? assetsJson.data : [];

      // 2) users (เผื่อสรุปชื่อใน Summary/อนาคต)
      const usersRes = await fetch("/api/users");
      const usersJson = await usersRes.json();
      const allUsers: User[] = usersJson?.success ? usersJson.data : [];

      // 3) currently checked-out
      const borrowsRes = await fetch("/api/borrowing?status=checked-out");
      const borrowsJson = await borrowsRes.json();
      const borrowRecords: { asset_tag: string; status: string }[] =
        borrowsJson?.success ? borrowsJson.data : [];

      // tag ที่ถูกยืมอยู่
      const checkedOutTags = new Set(
        (Array.isArray(borrowRecords) ? borrowRecords : [])
          .filter((r) => (r.status || "").toLowerCase().replace(/\s+/g, "-") === "checked-out")
          .map((r) => r.asset_tag)
      );

      // Available = isloanable && status === 'available' && ไม่ถูกยืม
      const filtered = (Array.isArray(allAssets) ? allAssets : []).filter((a) => {
        const isAvailable = (a.status || "").toLowerCase() === "available";
        return a.isloanable === true && isAvailable && !checkedOutTags.has(a.asset_tag);
      });

      setAvailableAssets(filtered);
      setUsers(allUsers);
    } catch (err) {
      console.error("Load data error:", err);
      setAvailableAssets([]);
      setUsers([]);
    } finally {
      setLoadingAssets(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);
  
// ---- Prefill from URL (asset_tag) ----
const assetTagFromUrl = useMemo(
  () => searchParams.get("asset_tag") ?? "",
  [searchParams]
);

  useEffect(() => {
    if (!assetTagFromUrl) return;
    setFormData((p) => ({ ...p, asset_tag: assetTagFromUrl }));
  }, [assetTagFromUrl]);
  
  // ---- Validate: ค่าที่เลือกต้องยังอยู่ใน availableAssets ----
  useEffect(() => {
    if (loadingAssets || !formData.asset_tag) return;
    const exists = availableAssets.some(
      (a) => String(a.asset_tag) === String(formData.asset_tag)
    );
    if (!exists) {
      setFormData((p) => ({ ...p, asset_tag: "" }));
    }
  }, [loadingAssets, availableAssets, formData.asset_tag]);

  const displayAssetName = (a: Asset) =>
    `${a.manufacturer ?? ""} ${a.model ?? ""}`.trim() || a.asset_tag;

  const displayUserName = (u: User) =>
    (u.name ?? `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim()) || u.id;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Asset Check-out</h1>
          <p className="text-gray-600">Check out an asset to a user</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Check-out Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Asset & User Selection */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Asset &amp; User Selection</h3>

              {/* Asset */}
              <div className="space-y-2">
                <Label htmlFor="asset">Select Asset *</Label>
                <Select
                  value={formData.asset_tag || undefined}
                  onValueChange={(value) => setFormData((p) => ({ ...p, asset_tag: value }))}
                  disabled={loadingAssets}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingAssets ? "Loading assets..." : "Choose an available asset"} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableAssets.map((asset) => (
                      <SelectItem key={asset.asset_tag} value={asset.asset_tag}>
                        {`${asset.manufacturer ?? ""} ${asset.model ?? ""}`.trim() || asset.asset_tag}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* User */}
              <div className="space-y-2">
                <Label htmlFor="borrowername">Borrower Name *</Label>
                <Input
                  id="borrowername"
                  placeholder="Firstname Lastname"
                  value={formData.borrowername}
                  onChange={(e) => setFormData((p) => ({ ...p, borrowername: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="borrowercontact">Contact (phone/email/org)</Label>
                <Input
                  id="borrowercontact"
                  placeholder="เช่น 081-xxx-xxxx / malee@example.com / บริษัท ABC"
                  value={formData.borrowercontact}
                  onChange={(e) => setFormData((p) => ({ ...p, borrowercontact: e.target.value }))}
                />
              </div>
            </div>

            {/* Checkout Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Check-out Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="checkout_date">Checkout Date *</Label>
                  <Input
                    id="checkout_date"
                    type="date"
                    value={formData.checkout_date}
                    onChange={(e) => handleInputChange("checkout_date", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="return_date">Expected Return Date</Label>
                  <Input
                    id="return_date"
                    type="date"
                    value={formData.expected_returndate}
                    onChange={(e) => handleInputChange("expected_returndate", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="purpose">Purpose</Label>
                  <Select value={formData.purpose || undefined} onValueChange={(v) => handleInputChange("purpose", v)}>
                    <SelectTrigger><SelectValue placeholder="Select purpose" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="work">Work Assignment</SelectItem>
                      <SelectItem value="project">Project Use</SelectItem>
                      <SelectItem value="temporary">Temporary Assignment</SelectItem>
                      <SelectItem value="replacement">Equipment Replacement</SelectItem>
                      <SelectItem value="travel">Business Travel</SelectItem>
                      <SelectItem value="training">Training/Learning</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="checkout-location">Deployment Location</Label>
                  <Select value={formData.location || undefined} onValueChange={(v) => handleInputChange("location", v)}>
                    <SelectTrigger><SelectValue placeholder="Select location" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fdb">FDB</SelectItem>
                      <SelectItem value="pom">POM</SelectItem>
                      <SelectItem value="fac2">FAC2</SelectItem>
                      <SelectItem value="Cleanroom">Cleanroom</SelectItem>
                      <SelectItem value="Whiteroom">Whiteroom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Any special instructions or notes for this checkout..."
                  value={formData.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            {/* Checkout Summary */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Checkout Summary</h4>
              <div className="space-y-1 text-sm text-gray-600">
                <p>
                  Asset:{" "}
                  {formData.asset_tag
                    ? displayAssetName(
                        availableAssets.find((a) => a.asset_tag === formData.asset_tag) ||
                          { asset_tag: formData.asset_tag }
                      )
                    : "Not selected"}
                </p>
                <p>
                  User:{" "}
                  {formData.borrowername
                    ? displayUserName(
                        users.find((u) => u.id === formData.borrowername) || { id: formData.borrowername }
                      )
                    : "Not selected"}
                </p>
                <p>Date: {formData.checkout_date}</p>
                <p>Purpose: {formData.purpose || "Not specified"}</p>
              </div>
            </div>

            {submitError && <p className="text-sm text-red-600">{submitError}</p>}

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button
                type="submit"
                onClick={handleSubmit}
                disabled={submitting || !formData.asset_tag || !formData.borrowername.trim()}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Checkout Asset
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CheckoutAssetPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading checkout record...</span>
        </div>
      }
    >
      <CheckoutAssetPageInner />
    </Suspense>
  );
}
