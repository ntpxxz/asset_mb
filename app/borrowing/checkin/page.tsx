"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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

// types
type BorrowRecord = {
  id: string;
  assetId: string;
  borrowerId?: string;
  borrowername?: string;
  borrowercontact?: string;
  status: string;
  checkoutDate?: string;
  checkinDate?: string | null;
  dueDate?: string | null;
  purpose?: string;
  notes?: string;
  assetName?: string;
  assetTag?: string;
  assetType?: string;
  assetManufacturer?: string;
  assetModel?: string;
  assetSerial?: string;
  assetDescription?: string;
  assetStatus?: string;
  assetLocation?: string;
  assetCondition?: string;
};

export default function CheckinAssetPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const borrowIdFromUrl = useMemo(
    () => String(searchParams.get("borrowId") ?? ""),
    [searchParams]
  );

  const [formData, setFormData] = useState({
    borrowerNameConfirmation: "", // New field for name confirmation
    checkinDate: new Date().toISOString().split("T")[0],
    condition: "",
    damageReported: false,
    damageDescription: "",
    maintenanceRequired: false,
    maintenanceNotes: "",
    notes: "",
  });

  const [loadingRecord, setLoadingRecord] = useState(true);
  const [borrowRecord, setBorrowRecord] = useState<BorrowRecord | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [nameMatchError, setNameMatchError] = useState<string | null>(null);

  // Load specific borrow record
  useEffect(() => {
    const loadBorrowRecord = async () => {
      if (!borrowIdFromUrl) {
        setSubmitError("No borrow ID specified for check-in.");
        setLoadingRecord(false);
        return;
      }

      setLoadingRecord(true);
      try {
        const response = await fetch(`/api/borrowing/${borrowIdFromUrl}`);
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.error || `Failed to load borrow record (${response.status})`
          );
        }

        const record = result.data;

        // Verify this is a checked-out record
        if (
          (record.status || "").toLowerCase().replace(/\s+/g, "-") !==
          "checked-out"
        ) {
          throw new Error(
            "This record is not currently checked out or has already been returned."
          );
        }

        setBorrowRecord(record);
        setSubmitError(null);
      } catch (error) {
        console.error("Load borrow record failed:", error);
        setSubmitError(
          error instanceof Error
            ? error.message
            : "Failed to load checkout record."
        );
        setBorrowRecord(null);
      } finally {
        setLoadingRecord(false);
      }
    };

    loadBorrowRecord();
  }, [borrowIdFromUrl]);

  // Validate name confirmation
  const validateNameConfirmation = (inputName: string) => {
    if (!borrowRecord?.borrowername || !inputName.trim()) {
      setNameMatchError(null);
      return false;
    }

    const originalName = borrowRecord.borrowername.toLowerCase().trim();
    const confirmedName = inputName.toLowerCase().trim();

    // Check if names match (allowing for minor variations)
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
  // แปลงสตริงวันที่ให้เหลือรูปแบบ YYYY-MM-DD
  const dateOnly = (v?: string | null) => {
    if (!v) return "";
    const s = String(v);
    // กรณีเป็น ISO "2025-09-03T12:34:56Z"
    const t = s.indexOf("T");
    if (t > 0) return s.slice(0, t);
    // กรณีต้นฉบับมีเวลาแต่คั่นด้วยช่องว่าง และขึ้นต้นด้วย yyyy-mm-dd
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
    // พยายาม parse แล้ว format เอง (กัน timezone)
    const d = new Date(s);
    if (!isNaN(d.getTime())) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const d2 = String(d.getDate()).padStart(2, "0");
      return `${d2}-${m}-${y}`;
    }
    return s; // fallback
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!borrowIdFromUrl) {
      setSubmitError("No borrowId specified.");
      return;
    }

    if (!borrowRecord) {
      setSubmitError("Borrow record not found or not checked-out.");
      return;
    }

    if (!formData.condition) {
      setSubmitError("Please assess the asset condition.");
      return;
    }

    if (!formData.borrowerNameConfirmation.trim()) {
      setSubmitError("Please confirm the borrower's name.");
      return;
    }

    // Validate name confirmation
    if (!validateNameConfirmation(formData.borrowerNameConfirmation)) {
      setSubmitError(
        "Please verify the borrower's name matches the original checkout record."
      );
      return;
    }

    if (formData.damageReported && !formData.damageDescription.trim()) {
      setSubmitError("Please describe the reported damage.");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch(`/api/borrowing/${borrowIdFromUrl}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "returned",
          checkinDate: formData.checkinDate,
          condition: formData.condition,
          damageReported: formData.damageReported,
          damageDescription: formData.damageDescription || null,
          maintenanceRequired: formData.maintenanceRequired,
          maintenanceNotes: formData.maintenanceRequired
            ? formData.maintenanceNotes || null
            : null,
          location: formData.location || null,
          notes: formData.notes || null,
          returnedByName: formData.borrowerNameConfirmation.trim(), // Include confirmed name
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

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear name match error when user types
    if (field === "borrowerNameConfirmation" && nameMatchError) {
      setNameMatchError(null);
    }
  };

  // Handle name confirmation blur event
  const handleNameConfirmationBlur = () => {
    if (formData.borrowerNameConfirmation.trim()) {
      validateNameConfirmation(formData.borrowerNameConfirmation);
    }
  };

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
                        {borrowRecord.assetTag ??
                          borrowRecord.assetName ??
                          [
                            borrowRecord.assetManufacturer,
                            borrowRecord.assetModel,
                          ]
                            .filter(Boolean)
                            .join(" ") ??
                          borrowRecord.assetId ??
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
                        ID: {borrowRecord.assetId}
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
                          {dateOnly(borrowRecord.checkoutDate || "—")}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Due date</div>
                        <div
                          className={`font-medium ${
                            borrowRecord.dueDate &&
                            new Date(borrowRecord.dueDate) < new Date()
                              ? "text-red-600"
                              : ""
                          }`}
                        >
                          {borrowRecord.dueDate
                            ? dateOnly(borrowRecord.dueDate)
                            : "No due date"}
                          {borrowRecord.dueDate &&
                            new Date(borrowRecord.dueDate) < new Date() &&
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
                    <Label htmlFor="borrower-name-confirmation">
                      Confirm Borrower Name *
                    </Label>
                    <Input
                      id="borrower-name-confirmation"
                      placeholder={`Enter borrower's name to confirm (Original: ${
                        borrowRecord.borrowername || "Unknown"
                      })`}
                      value={formData.borrowerNameConfirmation}
                      onChange={(e) =>
                        handleInputChange(
                          "borrowerNameConfirmation",
                          e.target.value
                        )
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
                    <Label htmlFor="checkinDate">Check-in Date *</Label>
                    <Input
                      id="checkinDate"
                      type="date"
                      value={formData.checkinDate}
                      onChange={(e) =>
                        handleInputChange("checkinDate", e.target.value)
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
                    id="damage-reported"
                    checked={formData.damageReported}
                    onCheckedChange={(checked) =>
                      handleInputChange("damageReported", checked as boolean)
                    }
                  />
                  <Label htmlFor="damage-reported">
                    Report damage or issues
                  </Label>
                </div>

                {formData.damageReported && (
                  <div className="space-y-2 ml-6">
                    <Label htmlFor="damage-description">
                      Damage Description *
                    </Label>
                    <Textarea
                      id="damage-description"
                      placeholder="Describe any damage, missing parts, or issues..."
                      value={formData.damageDescription}
                      onChange={(e) =>
                        handleInputChange("damageDescription", e.target.value)
                      }
                      rows={3}
                    />
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="maintenance-required"
                    checked={formData.maintenanceRequired}
                    onCheckedChange={(checked) =>
                      handleInputChange(
                        "maintenanceRequired",
                        checked as boolean
                      )
                    }
                  />
                  <Label htmlFor="maintenance-required">
                    Maintenance required
                  </Label>
                </div>

                {formData.maintenanceRequired && (
                  <div className="space-y-2 ml-6">
                    <Label htmlFor="maintenance-notes">Maintenance Notes</Label>
                    <Textarea
                      id="maintenance-notes"
                      placeholder="Describe required maintenance work..."
                      value={formData.maintenanceNotes}
                      onChange={(e) =>
                        handleInputChange("maintenanceNotes", e.target.value)
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
                  <p>Asset: {borrowRecord.assetTag || borrowRecord.assetId}</p>
                  <p>Borrower: {borrowRecord.borrowername}</p>
                  <p>Return Date: {formData.checkinDate}</p>
                  <p>Condition: {formData.condition || "Not assessed"}</p>
                  <p>
                    Damage Reported: {formData.damageReported ? "Yes" : "No"}
                  </p>
                  <p>
                    Maintenance Required:{" "}
                    {formData.maintenanceRequired ? "Yes" : "No"}
                  </p>
                </div>
              </div>
            )}

            {/* Form Actions */}
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
                  !formData.borrowerNameConfirmation.trim() ||
                  !!nameMatchError
                }
                onClick={handleSubmit}
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
