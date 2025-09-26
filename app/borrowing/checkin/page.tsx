"use client";
import React, { Suspense, useEffect, useState, useMemo } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, RotateCcw, Save, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

/** ===== Types: ตรงกับฐานข้อมูล ===== **/
type BorrowRecord = {
  id: string;
  asset_tag: string;
  borrowername?: string;
  borrowercontact?: string;
  status: string;
  checkout_date?: string;
  checkin_date?: string | null;
  due_date?: string | null;
  purpose?: string;
  notes?: string;
  assetName?: string;
  assetManufacturer?: string;
  assetModel?: string;
};


// ✅ ใช้ id เป็นหลัก (รองรับ borrowid/borrowId เผื่อยังมีลิงก์เก่า)

function CheckinAssetPageInner() {
  const router = useRouter();
  const params = useParams() as { id?: string };
  const searchParams = useSearchParams();

  const borrowIdFromUrl = React.useMemo(() => {
    return (
      (params?.id as string) ||
      searchParams.get("id") || ""
    );
  }, [params, searchParams]);
  

  /** ===== Form state: ใช้ชื่อฟิลด์ตาม DB ===== **/
  const [formData, setFormData] = useState({
    returned_by_name: "", // เดิม: borrowerNameConfirmation
    checkin_date: new Date().toISOString().slice(0, 10),
    condition: "",
    damage_reported: false,
    damage_description: "",
    maintenance_required: false,
    maintenance_notes: "",
    notes: "",
  });

  const [loadingRecord, setLoadingRecord] = useState(true);
  const [borrowRecord, setBorrowRecord] = useState<BorrowRecord | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [nameMatchError, setNameMatchError] = useState<string | null>(null);

  /** ===== โหลดข้อมูลรายการยืม ===== **/
  useEffect(() => {
    const loadBorrowRecord = async () => {
      if (!borrowIdFromUrl) {
        setSubmitError("No borrow ID specified for check-in.");
        setLoadingRecord(false);
        return;
      }
      setLoadingRecord(true);
      try {
        const res = await fetch(
          `/api/borrowing?id=${encodeURIComponent(borrowIdFromUrl)}`,
          { cache: "no-store" }
        );
  
        const payload = await res.json();            // ✅ อ่านครั้งเดียว
        if (!res.ok || payload?.success === false) {
          throw new Error(payload?.error || `Failed to load (${res.status})`);
        }
  
        // ✅ รองรับหลายทรง: data:[], data:{}, row, rows:[]
        let rec: any =
          (Array.isArray(payload?.data) ? payload.data[0] : payload?.data) ??
          payload?.row ??
          (Array.isArray(payload?.rows) ? payload.rows[0] : undefined) ??
          (Array.isArray(payload) ? payload[0] : payload);
  
        if (!rec) throw new Error("API returned empty record.");
  
        // ✅ map alias ฟิลด์ asset ให้เข้ากับที่หน้าใช้
        rec = {
          ...rec,
          assetName: rec.assetName ?? rec.assetname ?? rec.name ?? rec.asset_tag ?? null,
          assetManufacturer: rec.assetManufacturer ?? rec.assetmanufacturer ?? rec.manufacturer ?? null,
          assetModel: rec.assetModel ?? rec.assetmodel ?? rec.model ?? null,
        };
  
        setBorrowRecord(rec);
  
        // แค่เตือนถ้าไม่ได้อยู่สถานะที่คืนได้ (อย่า throw)
        const normalized = String(rec.status || "").toLowerCase().replace(/[\s_]+/g, "-");
        const isCheckedOut = ["checked-out", "checkedout", "out", "borrowed"].includes(normalized);
        setSubmitError(isCheckedOut ? null :
          "This record is not currently checked out or has already been returned.");
      } catch (error: any) {
        console.error("Load borrow record failed:", error);
        setSubmitError(error?.message || "Failed to load checkout record.");
        setBorrowRecord(null);
      } finally {
        setLoadingRecord(false);
      }
    };
    loadBorrowRecord();
  }, [borrowIdFromUrl]);

  // คืนรูปแบบ YYYY-MM-DD (ตัดเวลา/โซนเวลาออก)
  const dateOnly = (v?: string | null) => {
    if (!v) return "";
    const s = String(v);
    const t = s.indexOf("T");
    if (t > 0) return s.slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
    const d = new Date(s);
    if (!isNaN(d.getTime()))
      return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 10);
    return s;
  };

  const validateNameConfirmation = (inputName: string) => {
    if (!borrowRecord?.borrowername || !inputName.trim()) {
      setNameMatchError(null);
      return false;
    }
    const originalName = borrowRecord.borrowername.toLowerCase().trim();
    const confirmedName = inputName.toLowerCase().trim();
    const isMatch =
      originalName === confirmedName ||
      originalName.includes(confirmedName) ||
      confirmedName.includes(originalName);

    if (!isMatch) {
      setNameMatchError(
        "Name does not match the original borrower name. Please verify."
      );
      return false;
    } else {
      setNameMatchError(null);
      return true;
    }
  };

  /** ===== Handlers ===== **/
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!borrowIdFromUrl) return setSubmitError("No borrowId specified.");
    if (!borrowRecord)
      return setSubmitError("Borrow record not found or not checked-out.");
    if (!formData.condition)
      return setSubmitError("Please assess the asset condition.");
    if (!formData.returned_by_name.trim())
      return setSubmitError("Please confirm the borrower's name.");
    if (!validateNameConfirmation(formData.returned_by_name)) {
      return setSubmitError(
        "Please verify the borrower's name matches the original checkout record."
      );
    }
    if (formData.damage_reported && !formData.damage_description.trim()) {
      return setSubmitError("Please describe the reported damage.");
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      // ส่งคีย์ตรงกับ DB
      const res = await fetch(`/api/borrowing/${borrowIdFromUrl}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "returned",
          checkin_date: formData.checkin_date,
          condition: formData.condition,
          damage_reported: formData.damage_reported,
          damage_description: formData.damage_reported
            ? formData.damage_description || null
            : null,
          maintenance_required: formData.maintenance_required,
          maintenance_notes: formData.maintenance_required
            ? formData.maintenance_notes || null
            : null,
          notes: formData.notes || null,
          returned_by_name: formData.returned_by_name.trim(),
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.success === false) {
        throw new Error(json?.error || `Check-in failed (${res.status})`);
      }

      router.push("/borrowing");
    } catch (err: any) {
      setSubmitError(err?.message || "Check-in failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (
    field: keyof typeof formData,
    value: string | boolean
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field === "returned_by_name" && nameMatchError) setNameMatchError(null);
  };

  const handleNameConfirmationBlur = () => {
    if (formData.returned_by_name.trim())
      validateNameConfirmation(formData.returned_by_name);
  };

  /** ===== Render ===== **/
  if (loadingRecord) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading checkout record...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Asset Check-in</h1>
          <p className="text-gray-600">Check in a returned asset</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <RotateCcw className="h-5 w-5" />
            <span>Check-in Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Borrow Record Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Checkout Record Information
              </h3>

              {borrowRecord ? (
                <div className="space-y-2">
                  <Label>Checkout Details</Label>
                  <div className="rounded-md border p-4 bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-gray-500">Borrow ID</div>
                        <div className="font-medium">{borrowIdFromUrl}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Status</div>
                        <div className="font-medium text-green-600">
                          Checked Out
                        </div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="text-xs text-gray-500">
                        Asset Information
                      </div>
                      <div className="font-medium">
                        {borrowRecord.asset_tag ??
                          borrowRecord.assetName ??
                          [
                            borrowRecord.assetManufacturer,
                            borrowRecord.assetModel,
                          ]
                            .filter(Boolean)
                            .join(" ") ??
                          borrowRecord.asset_tag ??
                          "Unknown Asset"}
                      </div>
                      {(borrowRecord.assetManufacturer ||
                        borrowRecord.assetModel) && (
                        <div className="text-sm">
                          {borrowRecord.assetManufacturer}{" "}
                          {borrowRecord.assetModel}
                        </div>
                      )}
                      <div className="text-sm text-gray-500">
                        ID: {borrowRecord.asset_tag}
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="text-xs text-gray-500">Borrower</div>
                      <div className="font-medium">
                        {borrowRecord.borrowername || "—"}
                      </div>
                      {borrowRecord.borrowercontact && (
                        <div className="text-sm text-gray-500">
                          {borrowRecord.borrowercontact}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <div className="text-xs text-gray-500">
                          Checked out on
                        </div>
                        <div className="font-medium">
                          {dateOnly(borrowRecord.checkout_date || "—")}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Due date</div>
                        <div
                          className={`font-medium ${
                            borrowRecord.due_date &&
                            new Date(borrowRecord.due_date) < new Date()
                              ? "text-red-600"
                              : ""
                          }`}
                        >
                          {borrowRecord.due_date
                            ? dateOnly(borrowRecord.due_date)
                            : "No due date"}
                          {borrowRecord.due_date &&
                            new Date(borrowRecord.due_date) < new Date() &&
                            " (OVERDUE)"}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="text-xs text-gray-500">Purpose</div>
                      <div className="font-medium">
                        {borrowRecord.purpose || "—"}
                      </div>
                    </div>

                    {borrowRecord.notes && (
                      <div className="mt-4">
                        <div className="text-xs text-gray-500">
                          Checkout notes
                        </div>
                        <div className="font-medium whitespace-pre-wrap break-words">
                          {borrowRecord.notes}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-red-600">
                  {submitError || "Unable to load checkout record"}
                </div>
              )}

              {/* Name Confirmation Field */}
              {borrowRecord && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="returned_by_name">
                      Confirm Borrower Name *
                    </Label>
                    <Input
                      id="returned_by_name"
                      placeholder={`Enter borrower's name to confirm (Original: ${
                        borrowRecord.borrowername || "Unknown"
                      })`}
                      value={formData.returned_by_name}
                      onChange={(e) =>
                        handleInputChange("returned_by_name", e.target.value)
                      }
                      onBlur={handleNameConfirmationBlur}
                      required
                      className={nameMatchError ? "border-red-500" : ""}
                    />
                    {nameMatchError && (
                      <p className="text-sm text-red-600">{nameMatchError}</p>
                    )}
                    <p className="text-sm text-gray-500">
                      Please enter the borrower name exactly as it appears in
                      the original checkout record.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="checkin_date">Check-in Date *</Label>
                    <Input
                      id="checkin_date"
                      type="date"
                      value={formData.checkin_date}
                      onChange={(e) =>
                        handleInputChange("checkin_date", e.target.value)
                      }
                      required
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Condition Assessment */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Condition Assessment
              </h3>
              <div className="space-y-2">
                <Label htmlFor="condition">Asset Condition *</Label>
                <Select
                  value={formData.condition}
                  onValueChange={(value) =>
                    handleInputChange("condition", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Assess asset condition" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excellent">
                      Excellent - Like new
                    </SelectItem>
                    <SelectItem value="good">Good - Minor wear</SelectItem>
                    <SelectItem value="fair">Fair - Noticeable wear</SelectItem>
                    <SelectItem value="poor">
                      Poor - Significant wear
                    </SelectItem>
                    <SelectItem value="damaged">
                      Damaged - Needs repair
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="damage_reported"
                    checked={formData.damage_reported}
                    onCheckedChange={(checked) =>
                      handleInputChange("damage_reported", checked as boolean)
                    }
                  />
                  <Label htmlFor="damage_reported">
                    Report damage or issues
                  </Label>
                </div>

                {formData.damage_reported && (
                  <div className="space-y-2 ml-6">
                    <Label htmlFor="damage_description">
                      Damage Description *
                    </Label>
                    <Textarea
                      id="damage_description"
                      placeholder="Describe any damage, missing parts, or issues..."
                      value={formData.damage_description}
                      onChange={(e) =>
                        handleInputChange("damage_description", e.target.value)
                      }
                      rows={3}
                    />
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="maintenance_required"
                    checked={formData.maintenance_required}
                    onCheckedChange={(checked) =>
                      handleInputChange(
                        "maintenance_required",
                        checked as boolean
                      )
                    }
                  />
                  <Label htmlFor="maintenance_required">
                    Maintenance required
                  </Label>
                </div>

                {formData.maintenance_required && (
                  <div className="space-y-2 ml-6">
                    <Label htmlFor="maintenance_notes">Maintenance Notes</Label>
                    <Textarea
                      id="maintenance_notes"
                      placeholder="Describe required maintenance work..."
                      value={formData.maintenance_notes}
                      onChange={(e) =>
                        handleInputChange("maintenance_notes", e.target.value)
                      }
                      rows={2}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Additional Notes */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Additional Information
              </h3>
              <div className="space-y-2">
                <Label htmlFor="notes">Check-in Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Any additional notes about the asset return..."
                  value={formData.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            {/* Check-in Summary */}
            {borrowRecord && (
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h4 className="font-medium text-green-900 mb-2 flex items-center">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Check-in Summary
                </h4>
                <div className="space-y-1 text-sm text-green-800">
                  <p>Asset: {borrowRecord.asset_tag}</p>
                  <p>Borrower: {borrowRecord.borrowername}</p>
                  <p>Return Date: {formData.checkin_date}</p>
                  <p>Condition: {formData.condition || "Not assessed"}</p>
                  <p>
                    Damage Reported: {formData.damage_reported ? "Yes" : "No"}
                  </p>
                  <p>
                    Maintenance Required:{" "}
                    {formData.maintenance_required ? "Yes" : "No"}
                  </p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  submitting ||
                  !borrowRecord ||
                  !formData.condition ||
                  !formData.returned_by_name.trim() ||
                  !!nameMatchError
                }
              >
                {submitting ? (
                  <>
                    <RotateCcw className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Complete Check-in
                  </>
                )}
              </Button>
            </div>

            {submitError && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{submitError}</p>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
export default function CheckinAssetPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading checkout record...</span>
        </div>
      }
    >
      <CheckinAssetPageInner />
    </Suspense>
  );
}
