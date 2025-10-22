"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  PlusCircle,
  Save,
  Loader2,
  Search,
  Barcode,
  Edit,
  Upload,
  X,
  Trash,
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type FormData = {
  barcode: string;
  name: string;
  quantity: number;
  min_stock_level: number;
  price_per_unit: number;
  location: string;
  category: string;
  description: string;
  image_url?: string | null;
};

interface InventoryFormProps {
  onSave: () => void;
  mode?: "add" | "edit";
  initialData?: Partial<FormData> & { id?: string };
  onSubmit?: (data: Partial<FormData>) => Promise<void>;
}


export default function InventoryForm({
  onSave,
  mode = "add",
  initialData,
  onSubmit,
}: InventoryFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    barcode: "",
    name: "",
    price_per_unit: 0,
    quantity: 1,
    min_stock_level: 5,
    location: "",
    category: "",
    description: "",
    image_url: null,
    ...initialData,
  });

  const [submitting, setSubmitting] = useState(false);
  const [isExistingItem, setIsExistingItem] = useState(mode === "edit");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupMessage, setLookupMessage] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(
    initialData?.image_url || null
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialData) {
      setFormData((prev) => ({ ...prev, ...initialData }));
      if (initialData.image_url) {
        setImagePreview(initialData.image_url);
      }
    }
  }, [initialData]);

  const handleBarcodeLookup = useCallback(async () => {
    if (mode === "edit") return;
    const barcode = formData.barcode.trim();
    if (!barcode) return;

    setLookupLoading(true);
    setLookupMessage(null);
    setIsExistingItem(false);

    try {
      const response = await fetch(
        `/api/inventory?barcode=${encodeURIComponent(barcode)}`
      );
      const result = await response.json();

      if (response.ok && result.success && result.data) {
        setFormData((prev) => ({
          ...prev,
          name: result.data.name || "",
          price_per_unit:
            typeof result.data.price_per_unit === "number"
              ? result.data.price_per_unit
              : typeof result.data.price === "number"
              ? result.data.price
              : prev.price_per_unit ?? 0,
          category: result.data.category || "",
          location: result.data.location || "",
          description: result.data.description || "",
          image_url: result.data.image_url || null,
          quantity: 1,
          min_stock_level:
            typeof result.data.min_stock_level === "number"
              ? result.data.min_stock_level
              : prev.min_stock_level ?? 0,
        }));
        setImagePreview(result.data.image_url || null);
        setIsExistingItem(true);
        setLookupMessage(
          `Found: "${result.data.name}". Ready to add more stock.`
        );
        toast.success(`Item Found: ${result.data.name}`);
      } else {
        // not found -> reset details (but keep barcode)
        setFormData((prev) => ({
          ...prev,
          name: "",
          price_per_unit: 0,
          category: "",
          location: "",
          description: "",
          quantity: 1,
          min_stock_level: 0,
          image_url: null,
        }));
        setImagePreview(null);
        setLookupMessage("This is a new item. Please fill in the details.");
      }
    } catch (error) {
      setLookupMessage("Error looking up barcode.");
      toast.error("Error looking up barcode.");
    } finally {
      setLookupLoading(false);
    }
  }, [formData.barcode, mode]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        // 2MB limit
        toast.error("Image size should not exceed 2MB.");
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const toastId = toast.loading("Saving item...");

    try {
      let finalImageUrl = formData.image_url || null;

      if (imageFile) {
        const imageFormData = new FormData();
        imageFormData.append("file", imageFile);

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: imageFormData,
        });
        const uploadResult = await uploadResponse.json();

        if (!uploadResponse.ok || !uploadResult.success) {
          throw new Error(uploadResult.error || "Failed to upload image.");
        }
        // Use 'image_url' from upload result
        finalImageUrl = uploadResult.image_url;
      } else if (imagePreview === null) {
        finalImageUrl = null;
      }

      const payload = { ...formData, image_url: finalImageUrl };

      if (onSubmit) {
        await onSubmit(payload);
      } else {
        const response = await fetch("/api/inventory", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Failed to save item.");
        onSave();
      }

      toast.success("Item saved successfully!", { id: toastId });
    } catch (error: any) {
      toast.error(error.message, { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };
  const handleConfirmDelete = async () => {
    if (mode !== "edit" || !initialData?.id) return;

    setSubmitting(true);
    const toastId = toast.loading("Deleting item...");

    try {
      const response = await fetch(`/api/inventory/${initialData.id}`, {
        method: "DELETE",
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete item.");
      }

      toast.success("Item deleted successfully!", { id: toastId });
      setIsDeleteModalOpen(false);
      onSave(); // เรียก onSave เพื่อ redirect หรือ refresh
    } catch (error: any) {
      toast.error(error.message, { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const isEditMode = mode === "edit";
  const Icon = isEditMode ? Edit : PlusCircle;
  const title = isEditMode ? "Edit Item Details" : "Add or Receive Stock";

  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Icon className="h-5 w-5" />
          <span>{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Barcode Section */}
          <div className="space-y-2">
            <Label htmlFor="barcode">Barcode</Label>
            <div className="flex items-center gap-2">
              <Barcode className="h-5 w-5 text-muted-foreground" />
              <Input
                id="barcode"
                placeholder={
                  isEditMode
                    ? "Item barcode"
                    : "Scan or enter barcode then press Enter"
                }
                value={formData.barcode}
                onChange={(e) => {
                  handleInputChange("barcode", e.target.value);
                  if (e.target.value === "") {
                    setIsExistingItem(false);
                    setLookupMessage(null);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleBarcodeLookup();
                  }
                }}
                onBlur={handleBarcodeLookup}
                disabled={submitting || isEditMode}
                className={isEditMode ? "bg-gray-100" : ""}
              />
              {!isEditMode && (
                <Button
                  type="button"
                  onClick={handleBarcodeLookup}
                  disabled={lookupLoading || !formData.barcode}
                >
                  {lookupLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
            {lookupMessage && (
              <p
                className={`text-sm mt-2 ${
                  isExistingItem ? "text-green-600" : "text-blue-600"
                }`}
              >
                {lookupMessage}
              </p>
            )}
          </div>

          {/* Item Details Section */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Item Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  required
                  disabled={submitting || (isExistingItem && !isEditMode)}
                  className={isExistingItem && !isEditMode ? "bg-gray-100" : ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) =>
                    handleInputChange("category", e.target.value)
                  }
                  disabled={submitting || (isExistingItem && !isEditMode)}
                  className={isExistingItem && !isEditMode ? "bg-gray-100" : ""}
                />
              </div>
              {/* Location Input */}
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) =>
                    handleInputChange("location", e.target.value)
                  }
                  disabled={submitting || (isExistingItem && !isEditMode)}
                  className={isExistingItem && !isEditMode ? "bg-gray-100" : ""}
                />
              </div>
            </div>

            {/* Quantity / Min Stock / Price Per Unit (single responsive row) */}
            <div
              className={`grid grid-cols-1 ${
                isEditMode ? "md:grid-cols-2" : "md:grid-cols-3"
              } gap-4`}
            >
              {/* If not edit mode: Quantity; if edit mode: show min_stock_level only in first column */}
              {!isEditMode ? (
                <div className="space-y-2">
                  <Label htmlFor="quantity">
                    {isExistingItem ? "Quantity to Add *" : "Initial Qty *"}
                  </Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={formData.quantity}
                    onChange={(e) =>
                      handleInputChange("quantity", Number(e.target.value))
                    }
                    min="1"
                    required
                    disabled={submitting}
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="min_stock_level">Minimum Stock Level *</Label>
                  <Input
                    id="min_stock_level"
                    type="number"
                    value={formData.min_stock_level}
                    onChange={(e) =>
                      handleInputChange(
                        "min_stock_level",
                        Number(e.target.value)
                      )
                    }
                    min="0"
                    required
                    disabled={submitting}
                  />
                </div>
              )}

              {/* Min Stock (for add mode this is second column) */}
              {!isEditMode ? (
                <div className="space-y-2">
                  <Label htmlFor="min_stock_level">Min. Stock *</Label>
                  <Input
                    id="min_stock_level"
                    type="number"
                    value={formData.min_stock_level}
                    onChange={(e) =>
                      handleInputChange(
                        "min_stock_level",
                        Number(e.target.value)
                      )
                    }
                    min="0"
                    required
                    disabled={submitting}
                  />
                </div>
              ) : null}

              {/* Price Per Unit (always present as the last column in the row) */}
              <div className="space-y-2">
                <Label htmlFor="price_per_unit">Price Per Unit</Label>
                <Input
                  id="price_per_unit"
                  type="text"
              
                  value={formData.price_per_unit}
                  onChange={(e) =>
                    handleInputChange(
                      "price_per_unit",
                      Number(e.target.value || 0)
                    )
                  }
                  disabled={submitting || (isExistingItem && !isEditMode)}
                  placeholder="0.00"
                  className={isExistingItem && !isEditMode ? "bg-gray-100" : ""}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                disabled={submitting || (isExistingItem && !isEditMode)}
                className={isExistingItem && !isEditMode ? "bg-gray-100" : ""}
              />
            </div>
          </div>

          {/* Image Upload Section */}
          <div className="space-y-4 pt-6 border-t">
            <h3 className="text-lg font-semibold text-gray-900">Item Image</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              <div className="space-y-2">
                <Label htmlFor="item-image">Upload Image</Label>
                <Input
                  id="item-image"
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handleImageChange}
                  ref={fileInputRef}
                  disabled={submitting}
                />
                <p className="text-sm text-muted-foreground">
                  Max file size: 2MB.
                </p>
              </div>
              <div className="space-y-2">
                <Label>Image Preview</Label>
                <div className="w-full h-40 rounded-md border border-dashed flex items-center justify-center relative bg-muted/50">
                  {imagePreview ? (
                    <>
                      <Image
                        src={imagePreview}
                        alt="Item preview"
                        layout="fill"
                        objectFit="contain"
                        className="rounded-md p-2"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-7 w-7"
                        onClick={handleRemoveImage}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <div className="text-center text-muted-foreground">
                      <Upload className="mx-auto h-8 w-8" />
                      <p className="text-sm mt-2">No image selected</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between space-x-3 pt-6 border-t">
          <div>
              {mode === "edit" && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setIsDeleteModalOpen(true)}
                  disabled={submitting}
                >
                  <Trash className="h-4 w-4 mr-2" />
                  Delete Item
                </Button>
              )}
            </div>
            <div className="flex space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {submitting
                ? "Saving..."
                : isEditMode
                ? "Save Changes"
                : isExistingItem
                ? "Add Stock"
                : "Create New Item"}
            </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
    {/* +++ 7. เพิ่ม Delete Confirmation Dialog +++ */}
    <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Are you absolutely sure?</DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete
            <strong className="mx-1">{formData.name}</strong>
            and all its related history.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsDeleteModalOpen(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirmDelete}
            disabled={submitting}
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Trash className="h-4 w-4 mr-2" />
            )}
            Yes, delete item
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
