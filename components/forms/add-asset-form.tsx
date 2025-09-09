"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { X, Package, Save } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { hardwareService, HardwareAsset } from "@/lib/data-store";

interface AddAssetFormProps {
  onClose: () => void;
  onSave: () => void;
}

export function AddAssetForm({ onClose, onSave }: AddAssetFormProps) {
  const [formData, setFormData] = useState({
    // Basic Information
    assetTag: "",
    assetType: "",
    manufacturer: "",
    model: "",
    serialNumber: "",

    // Purchase Information
    purchaseDate: "",
    purchasePrice: "",
    supplier: "",
    warrantyExpiry: "",

    // Assignment & Location
    assignedUser: "",
    location: "",
    department: "",
    status: "in-stock",

    // Technical Specifications
    operatingSystem: "",
    processor: "",
    memory: "",
    storage: "",

    // Network Information
    hostname: "",
    ipAddress: "",
    macAddress: "",

    // Patch Management
    patchStatus: "needs-review",
    lastPatchCheck: "",

    // Borrowing
    isLoanable: false,
    condition: "good",
    // Additional
    description: "",
    notes: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Create the asset using the data service
    hardwareService.create({
      assetTag: formData.assetTag || `AST-${Date.now()}`,
      type: formData.assetType,
      manufacturer: formData.manufacturer,
      model: formData.model,
      serialNumber: formData.serialNumber,
      purchaseDate: formData.purchaseDate,
      purchasePrice: formData.purchasePrice,
      supplier: formData.supplier,
      warrantyExpiry: formData.warrantyExpiry,
      assignedUser: formData.assignedUser,
      location: formData.location,
      department: formData.department,
      status: formData.status as any,
      operatingSystem: formData.operatingSystem,
      processor: formData.processor,
      memory: formData.memory,
      storage: formData.storage,
      hostname: formData.hostname,
      ipAddress: formData.ipAddress,
      macAddress: formData.macAddress,
      patchStatus: formData.patchStatus as any,
      lastPatchCheck: formData.lastPatchCheck,
      isLoanable: formData.isLoanable,
      condition: formData.condition as HardwareAsset["condition"],
      description: formData.description,
      notes: formData.notes,
    });

    onSave();
    onClose();
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5" />
            <span>Add Hardware Asset</span>
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="asset-tag">Asset Tag</Label>
                  <Input
                    id="asset-tag"
                    placeholder="Auto-generated or manual (e.g., AST-001)"
                    value={formData.assetTag}
                    onChange={(e) =>
                      handleInputChange("assetTag", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="asset-type">Asset Type *</Label>
                  <Select
                    value={formData.assetType}
                    onValueChange={(value) =>
                      handleInputChange("assetType", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select asset type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="laptop">Laptop</SelectItem>
                      <SelectItem value="desktop">Desktop</SelectItem>
                      <SelectItem value="monitor">Monitor</SelectItem>
                      <SelectItem value="printer">Printer</SelectItem>
                      <SelectItem value="phone">Phone</SelectItem>
                      <SelectItem value="tablet">Tablet</SelectItem>
                      <SelectItem value="server">Server</SelectItem>
                      <SelectItem value="router">Router</SelectItem>
                      <SelectItem value="switch">Network Switch</SelectItem>
                      <SelectItem value="firewall">Firewall</SelectItem>
                      <SelectItem value="storage">Storage Device</SelectItem>
                      <SelectItem value="projector">Projector</SelectItem>
                      <SelectItem value="camera">Camera</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="manufacturer">Manufacturer *</Label>
                  <Input
                    id="manufacturer"
                    placeholder="e.g., Apple, Dell, HP, Lenovo"
                    value={formData.manufacturer}
                    onChange={(e) =>
                      handleInputChange("manufacturer", e.target.value)
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model">Model *</Label>
                  <Input
                    id="model"
                    placeholder="e.g., MacBook Pro M2, OptiPlex 7090"
                    value={formData.model}
                    onChange={(e) => handleInputChange("model", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="serial-number">Serial Number *</Label>
                  <Input
                    id="serial-number"
                    placeholder="Unique serial number"
                    value={formData.serialNumber}
                    onChange={(e) =>
                      handleInputChange("serialNumber", e.target.value)
                    }
                    required
                  />
                </div>
              </div>
            </div>

            {/* Purchase Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Purchase Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="purchase-date">Purchase Date</Label>
                  <Input
                    id="purchase-date"
                    type="date"
                    value={formData.purchaseDate}
                    onChange={(e) =>
                      handleInputChange("purchaseDate", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="purchase-price">Purchase Price</Label>
                  <Input
                    id="purchase-price"
                    placeholder="$0.00"
                    value={formData.purchasePrice}
                    onChange={(e) =>
                      handleInputChange("purchasePrice", e.target.value)
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="supplier">Supplier</Label>
                  <Input
                    id="supplier"
                    placeholder="e.g., Best Buy Business, CDW, Amazon"
                    value={formData.supplier}
                    onChange={(e) =>
                      handleInputChange("supplier", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="warranty-expiry">Warranty Expiry Date</Label>
                  <Input
                    id="warranty-expiry"
                    type="date"
                    value={formData.warrantyExpiry}
                    onChange={(e) =>
                      handleInputChange("warrantyExpiry", e.target.value)
                    }
                  />
                </div>
              </div>
            </div>

            {/* Assignment & Location */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Assignment & Location
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="assigned-user">Assigned User</Label>
                  <Select
                    value={formData.assignedUser}
                    onValueChange={(value) =>
                      handleInputChange("assignedUser", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select user (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="john-smith">
                        John Smith - Engineering
                      </SelectItem>
                      <SelectItem value="sarah-johnson">
                        Sarah Johnson - Marketing
                      </SelectItem>
                      <SelectItem value="mike-wilson">
                        Mike Wilson - Sales
                      </SelectItem>
                      <SelectItem value="lisa-chen">Lisa Chen - IT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status *</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) =>
                      handleInputChange("status", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in-stock">In Stock</SelectItem>
                      <SelectItem value="in-use">In Use</SelectItem>
                      <SelectItem value="under-repair">Under Repair</SelectItem>
                      <SelectItem value="retired">Retired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Location/Department *</Label>
                  <Select
                    value={formData.location}
                    onValueChange={(value) =>
                      handleInputChange("location", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ny-office">New York Office</SelectItem>
                      <SelectItem value="chicago-office">
                        Chicago Office
                      </SelectItem>
                      <SelectItem value="la-office">
                        Los Angeles Office
                      </SelectItem>
                      <SelectItem value="it-storage">
                        IT Storage Room
                      </SelectItem>
                      <SelectItem value="warehouse">Warehouse</SelectItem>
                      <SelectItem value="remote">Remote Location</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Select
                    value={formData.department}
                    onValueChange={(value) =>
                      handleInputChange("department", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="engineering">Engineering</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="sales">Sales</SelectItem>
                      <SelectItem value="hr">Human Resources</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                      <SelectItem value="it">Information Technology</SelectItem>
                      <SelectItem value="operations">Operations</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Technical Specifications */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Technical Specifications
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="operating-system">Operating System</Label>
                  <Input
                    id="operating-system"
                    placeholder="e.g., Windows 11 Pro, macOS Ventura"
                    value={formData.operatingSystem}
                    onChange={(e) =>
                      handleInputChange("operatingSystem", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="processor">Processor</Label>
                  <Input
                    id="processor"
                    placeholder="e.g., Intel i7-12700, Apple M2 Pro"
                    value={formData.processor}
                    onChange={(e) =>
                      handleInputChange("processor", e.target.value)
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="memory">Memory (RAM)</Label>
                  <Input
                    id="memory"
                    placeholder="e.g., 16GB DDR4, 32GB"
                    value={formData.memory}
                    onChange={(e) =>
                      handleInputChange("memory", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="storage">Storage</Label>
                  <Input
                    id="storage"
                    placeholder="e.g., 512GB SSD, 1TB NVMe"
                    value={formData.storage}
                    onChange={(e) =>
                      handleInputChange("storage", e.target.value)
                    }
                  />
                </div>
              </div>
            </div>

            {/* Network Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Network Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hostname">Hostname</Label>
                  <Input
                    id="hostname"
                    placeholder="e.g., LAPTOP-001, DESK-ENG-05"
                    value={formData.hostname}
                    onChange={(e) =>
                      handleInputChange("hostname", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ip-address">IP Address</Label>
                  <Input
                    id="ip-address"
                    placeholder="e.g., 192.168.1.100"
                    value={formData.ipAddress}
                    onChange={(e) =>
                      handleInputChange("ipAddress", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mac-address">MAC Address</Label>
                  <Input
                    id="mac-address"
                    placeholder="e.g., 00:1B:44:11:3A:B7"
                    value={formData.macAddress}
                    onChange={(e) =>
                      handleInputChange("macAddress", e.target.value)
                    }
                  />
                </div>
              </div>
            </div>

            {/* Patch Management */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Patch Management
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="patch-status">Patch Status</Label>
                  <Select
                    value={formData.patchStatus}
                    onValueChange={(value) =>
                      handleInputChange("patchStatus", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="up-to-date">Up-to-Date</SelectItem>
                      <SelectItem value="needs-review">Needs Review</SelectItem>
                      <SelectItem value="update-pending">
                        Update Pending
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last-patch-check">
                    Last Patch Check Date
                  </Label>
                  <Input
                    id="last-patch-check"
                    type="date"
                    value={formData.lastPatchCheck}
                    onChange={(e) =>
                      handleInputChange("lastPatchCheck", e.target.value)
                    }
                  />
                </div>
              </div>
            </div>

            {/* Borrowing Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Borrowing Settings
              </h3>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is-loanable"
                  checked={formData.isLoanable}
                  onCheckedChange={(checked) =>
                    handleInputChange("isLoanable", checked as boolean)
                  }
                />
                <Label htmlFor="is-loanable">
                  Mark as loanable asset (available for borrowing)
                </Label>
              </div>
            </div>

            {/* Additional Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Additional Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="condition">Condition</Label>
                  <Select
                    value={formData.condition}
                    onValueChange={(value) =>
                      handleInputChange("condition", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select condition" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="fair">Fair</SelectItem>
                      <SelectItem value="poor">Poor</SelectItem>
                      <SelectItem value="broken">Broken</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Brief description of the asset..."
                    value={formData.description}
                    onChange={(e) =>
                      handleInputChange("description", e.target.value)
                    }
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Internal Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Configuration details, special requirements, or other notes..."
                    value={formData.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    rows={2}
                  />
                </div>
              </div>
            </div>

            {/* Asset Summary */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-2">Asset Summary</h4>
              <div className="grid grid-cols-2 gap-4 text-sm text-blue-800">
                <div>
                  <p>Type: {formData.assetType || "Not selected"}</p>
                  <p>
                    Manufacturer: {formData.manufacturer || "Not specified"}
                  </p>
                  <p>Model: {formData.model || "Not specified"}</p>
                  <p>
                    Status: {formData.status.replace("-", " ").toUpperCase()}
                  </p>
                </div>
                <div>
                  <p>Assigned: {formData.assignedUser || "Unassigned"}</p>
                  <p>Location: {formData.location || "Not specified"}</p>
                  <p>Patch Status: {formData.patchStatus.replace("-", " ")}</p>
                  <p>Loanable: {formData.isLoanable ? "Yes" : "No"}</p>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">
                <Save className="h-4 w-4 mr-2" />
                Add Hardware Asset
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
