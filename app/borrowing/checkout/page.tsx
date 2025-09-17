"use client";

import React, { Suspense, useEffect, useState, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Activity, Save, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { borrowService } from "@/lib/data-store";

type Asset = {
  id: string;
  manufacturer?: string;
  model?: string;
  status?: string; // 'Active' | 'Maintenance' | 'Retired' | ...
  isLoanable?: boolean; // true | false
};

type User = {
  id: string;
  firstName?: string;
  lastName?: string;
  name?: string; // fallback in case API provides full name
  department?: string;
};

function CheckoutAssetPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const assetIdFromUrl = useMemo(
    () =>
      searchParams.get("assetId") ? String(searchParams.get("assetId")) : "",
    [searchParams]
  );
  const [formData, setFormData] = useState({
    assetId: '',
    borrowerName: '',
    borrowerContact: '',
    checkoutDate: new Date().toISOString().split('T')[0],
    expectedReturnDate: '',
    purpose: '',
    location: '',
    notes: '',
  });

  const [availableAssets, setAvailableAssets] = useState<Asset[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.assetId) {
      setSubmitError("Please select both Asset and User.");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch("/api/borrowing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assetId: formData.assetId,
          borrowerName: formData.borrowerName.trim(),
          borrowerContact: formData.borrowerContact.trim() || null,
          checkoutDate: formData.checkoutDate,
          dueDate: formData.expectedReturnDate || null,
          purpose: formData.purpose || null,
          location: formData.location || null,
          notes: formData.notes || null,
          status: 'checked-out',
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok || json?.success === false) {
        throw new Error(
          json?.error ||
            (res.status === 409
              ? "This asset is already checked out."
              : `Checkout failed (${res.status})`)
        );
      }

      router.push("/borrowing");
    } catch (err) {
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

      // 2) users
      const usersRes = await fetch("/api/users");
      const usersJson = await usersRes.json();
      const allUsers: User[] = usersJson?.success ? usersJson.data : [];

      // 3) currently checked-out borrow records
      const borrowsRes = await fetch("/api/borrowing?status=checked-out");
      const borrowsJson = await borrowsRes.json();
      const borrowRecords: { assetId: string; status: string }[] =
        borrowsJson?.success ? borrowsJson.data : [];

      // Build a set of assetIds that are currently checked out
      const checkedOutIds = new Set(
        (Array.isArray(borrowRecords) ? borrowRecords : [])
          .filter(
            (r) =>
              (r.status || "").toLowerCase().replace(/\s+/g, "-") ===
              "checked-out"
          )
          .map((r) => r.assetId)
      );

      // Available = Active + loanable + not checked-out
      const filtered = (Array.isArray(allAssets) ? allAssets : []).filter(
        (a) => {
          const isActive = (a.status || "").toLowerCase() === "active";
          return Boolean(a.isLoanable) && isActive && !checkedOutIds.has(a.id);
        }
      );

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

  // Prefill assetId from URL (first load)
  useEffect(() => {
    const id = searchParams.get("assetId");
    if (id) {
      setFormData((prev) => ({ ...prev, assetId: id }));
    }
  }, [searchParams]);
  useEffect(() => {
    if (!assetIdFromUrl) return;
    if (loadingAssets) return; // รอให้ availableAssets มาแล้วก่อน

    const exists = availableAssets.some((a) => String(a.id) === assetIdFromUrl);
    if (exists) {
      setFormData((p) => ({ ...p, assetId: assetIdFromUrl }));
    } else {
      // ไม่เจอในลิสต์: เคลียร์ค่าให้ผู้ใช้เลือกเอง (หรือจะ toast แจ้งก็ได้)
      setFormData((p) => ({ ...p, assetId: "" }));
    }
  }, [assetIdFromUrl, loadingAssets, availableAssets]);
  // If assetId from URL is not in the available list anymore, clear it
  useEffect(() => {
    if (loadingAssets) return;
    if (!formData.assetId) return;

    const found = availableAssets.find(
      (a) => String(a.id) === String(formData.assetId)
    );
    if (!found) {
      setFormData((p) => ({ ...p, assetId: "" }));
    }
  }, [loadingAssets, availableAssets, formData.assetId]);

  // Helpers

  const displayAssetName = (a: Asset) =>
    `${a.manufacturer ?? ""} ${a.model ?? ""}`.trim() || a.id;

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
          <h1 className="text-3xl font-bold tracking-tight">Asset Checkout</h1>
          <p className="text-gray-600">Check out an asset to a user</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Checkout Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Asset & User Selection */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Asset &amp; User Selection
              </h3>

              {/* Asset */}
              <div className="space-y-2">
                <Label htmlFor="asset">Select Asset *</Label>
                <Select
                  value={formData.assetId || undefined}
                  onValueChange={(value) =>
                    setFormData((p) => ({ ...p, assetId: value }))
                  }
                  disabled={loadingAssets}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        loadingAssets
                          ? "Loading assets..."
                          : "Choose an available asset"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {availableAssets.map((asset) => (
                      <SelectItem key={asset.id} value={String(asset.id)}>
                        {`${asset.manufacturer ?? ""} ${
                          asset.model ?? ""
                        }`.trim() || asset.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* User */}
              <div className="space-y-2">
  <Label htmlFor="borrowerName">Borrower Full Name *</Label>
  <Input
    id="borrowerName"
    placeholder="ชื่อ-นามสกุลผู้ยืม"
    value={formData.borrowerName}
    onChange={(e) => setFormData(p => ({ ...p, borrowerName: e.target.value }))}
    required
  />
</div>

<div className="space-y-2">
  <Label htmlFor="borrowerContact">Contact (phone/email/org)</Label>
  <Input
    id="borrowerContact"
    placeholder="เช่น 081-xxx-xxxx / malee@example.com / บริษัท ABC"
    value={formData.borrowerContact}
    onChange={(e) => setFormData(p => ({ ...p, borrowerContact: e.target.value }))}
  />
</div>

            </div>

            {/* Checkout Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Checkout Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="checkout-date">Checkout Date *</Label>
                  <Input
                    id="checkout-date"
                    type="date"
                    value={formData.checkoutDate}
                    onChange={(e) =>
                      handleInputChange("checkoutDate", e.target.value)
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="return-date">Expected Return Date</Label>
                  <Input
                    id="return-date"
                    type="date"
                    value={formData.expectedReturnDate}
                    onChange={(e) =>
                      handleInputChange("expectedReturnDate", e.target.value)
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="purpose">Purpose</Label>
                  <Select
                    value={formData.purpose || undefined}
                    onValueChange={(value) =>
                      handleInputChange("purpose", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select purpose" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="work">Work Assignment</SelectItem>
                      <SelectItem value="project">Project Use</SelectItem>
                      <SelectItem value="temporary">
                        Temporary Assignment
                      </SelectItem>
                      <SelectItem value="replacement">
                        Equipment Replacement
                      </SelectItem>
                      <SelectItem value="travel">Business Travel</SelectItem>
                      <SelectItem value="training">
                        Training/Learning
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="checkout-location">Deployment Location</Label>
                  <Select
                    value={formData.location || undefined}
                    onValueChange={(value) =>
                      handleInputChange("location", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
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
              <h4 className="font-medium text-gray-900 mb-2">
                Checkout Summary
              </h4>
              <div className="space-y-1 text-sm text-gray-600">
                <p>
                  Asset:{" "}
                  {formData.assetId
                    ? displayAssetName(
                        availableAssets.find(
                          (a) => a.id === formData.assetId
                        ) || { id: formData.assetId }
                      )
                    : "Not selected"}
                </p>
                <p>
                  User:{" "}
                  {formData.borrowerName
                    ? displayUserName(
                        users.find((u) => u.id === formData.borrowerName) || {
                          id: formData.borrowerName,
                        }
                      )
                    : "Not selected"}
                </p>
                <p>Date: {formData.checkoutDate}</p>
                <p>Purpose: {formData.purpose || "Not specified"}</p>
              </div>
            </div>
            {submitError && (
              <p className="text-sm text-red-600">{submitError}</p>
            )}
            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                onClick={handleSubmit}
                disabled={submitting || !formData.assetId || !formData.borrowerName.trim()}
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