"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Package,
  Edit,
  Trash2,
  Monitor,
  Laptop,
  Smartphone,
  Printer,
  Calendar,
  DollarSign,
  MapPin,
  User,
  Shield,
  RefreshCw,
  Activity,
  Cpu,
} from "lucide-react";
import { HardwareAsset } from "@/lib/data-store";

const getStatusBadge = (status: string) => {
  switch (status) {
    case "in-use":
      return <Badge className="bg-green-100 text-green-800">Active</Badge>;
    case "in-stock":
      return <Badge className="bg-blue-100 text-blue-800">Available</Badge>;
    case "under-repair":
      return (
        <Badge className="bg-yellow-100 text-yellow-800">Maintenance</Badge>
      );
    case "retired":
      return <Badge className="bg-gray-100 text-gray-800">Retired</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

const getPatchStatusBadge = (status: string) => {
  switch (status) {
    case "up-to-date":
      return <Badge className="bg-green-100 text-green-800">Up-to-Date</Badge>;
    case "needs-review":
      return (
        <Badge className="bg-yellow-100 text-yellow-800">Needs Review</Badge>
      );
    case "update-pending":
      return <Badge className="bg-red-100 text-red-800">Update Pending</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

const getAssetIcon = (type: string) => {
  switch (type) {
    case "laptop":
      return Laptop;
    case "desktop":
      return Monitor;
    case "phone":
    case "tablet":
      return Smartphone;
    case "printer":
      return Printer;
    default:
      return Monitor;
  }
};

export default function AssetViewPage() {
  const router = useRouter();
  const params = useParams();
  const [asset, setAsset] = useState<HardwareAsset | null>(null);
  const [assignedUser, setAssignedUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.id) {
      fetchAsset(params.id as string);
    }
  }, [params.id]);

  const fetchAsset = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/assets/${id}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch asset");
      }

      if (result.success && result.data) {
        // Convert date strings to YYYY-MM-DD format for HTML date inputs
        const data = { ...result.data };
        if (data.purchaseDate) {
          data.purchaseDate = new Date(data.purchaseDate)
            .toISOString()
            .split("T")[0];
        }
        if (data.warrantyExpiry) {
          data.warrantyExpiry = new Date(data.warrantyExpiry)
            .toISOString()
            .split("T")[0];
        }
        if (data.lastPatchCheck) {
          data.lastPatchCheck = new Date(data.lastPatchCheck)
            .toISOString()
            .split("T")[0];
        }
        setAsset(data);
      } else {
        setError("Asset not found");
      }
    } catch (err) {
      console.error("Error fetching asset:", err);
      setError(err instanceof Error ? err.message : "Failed to load asset");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!asset) return;

    if (confirm("Are you sure you want to delete this asset?")) {
      try {
        const response = await fetch(`/api/assets/${asset.id}`, {
          method: "DELETE",
        });

        const result = await response.json();

        if (response.ok && result.success) {
          router.push("/assets");
        } else {
          alert(result.error || "Failed to delete asset");
        }
      } catch (err) {
        console.error("Error deleting asset:", err);
        alert("Failed to delete asset");
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading asset details...</p>
        </div>
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Asset Not Found
            </h3>
            <p className="text-gray-600">
              {error || "The requested asset could not be found."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const Icon = getAssetIcon(asset.type);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {asset.asset_tag}
            </h1>
            <p className="text-gray-600">
              {" "}
              {asset.manufacturer} • {asset.model}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/assets/${asset.id}/edit`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-red-600 hover:text-red-700"
            onClick={handleDelete}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Icon className="h-5 w-5" />
                <span>Asset Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Asset Tag
                  </label>
                  <p className="text-lg font-mono">{asset.asset_tag}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Serial Number
                  </label>
                  <p className="text-lg font-mono">{asset.serialnumber}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Manufacturer
                  </label>
                  <p className="text-lg">{asset.manufacturer}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Model
                  </label>
                  <p className="text-lg">{asset.model}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Status
                  </label>
                  <div className="mt-1">{getStatusBadge(asset.status)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Condition
                  </label>
                  <p className="text-lg capitalize">{asset.condition}</p>
                </div>
              </div>

              {asset.description && (
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Description
                  </label>
                  <p className="text-lg">{asset.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Technical Specifications */}
          {(() => {
            const t = (asset.type || "").toLowerCase();
            const hideAll = new Set([
              "monitor",
              "printer",
              "router",
              "switch",
              "firewall",
              "projector",
            ]);

            if (t === "storage") {
              return (
                <Card>
                  <CardHeader>
                    <CardTitle>
                      <Cpu className="h-5 w-5 inline-block mr-2" />
                      <span>Technical Specifications</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Storage
                      </label>
                      <p className="text-lg">
                        {asset.storage || "Not specified"}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            }

            if (hideAll.has(t)) return null;

            return (
              <Card>
                <CardHeader>
                  <CardTitle>
                    <Cpu className="h-5 w-5 inline-block mr-2" />
                    <span>Technical Specifications</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Operating System
                      </label>
                      <p className="text-lg">
                        {asset.operatingsystem || "Not specified"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Processor
                      </label>
                      <p className="text-lg">
                        {asset.processor || "Not specified"}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Memory
                      </label>
                      <p className="text-lg">
                        {asset.memory || "Not specified"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Storage
                      </label>
                      <p className="text-lg">
                        {asset.storage || "Not specified"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })()}
          {/* Network Informaion*/}
          {(() => {
            const t = (asset.type || "").toLowerCase();
            const hideNet = new Set(["monitor", "storage", "projector"]);
            if (hideNet.has(t)) return null;

            if (asset.hostname || asset.ipaddress || asset.macaddress) {
              return (
                <Card>
                  <CardHeader>
                    <CardTitle>Network Information</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Hostname
                      </label>
                      <p className="text-lg font-mono">
                        {asset.hostname || "-"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        IP Address
                      </label>
                      <p className="text-lg font-mono">
                        {asset.ipaddress || "-"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        MAC Address
                      </label>
                      <p className="text-lg font-mono">
                        {asset.macaddress || "-"}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            }
            return null;
          })()}

          {/* Purchase Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5" />
                <span>Purchase Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Purchase Date
                  </label>
                  <p className="text-lg">
                    $
                    {asset.purchasedate ? asset.purchasedate.split("T")[0] : ""}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Purchase Price
                  </label>
                  <p className="text-lg">${asset.purchaseprice || "0"}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Supplier
                  </label>
                  <p className="text-lg">{asset.supplier || "Not specified"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Warranty Expiry
                  </label>
                  <p className="text-lg">
                    {asset.warrantyexpiry
                      ? asset.warrantyexpiry.split("T")[0]
                      : ""}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Assignment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Assignment</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {assignedUser ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Assigned To
                    </label>
                    <p className="text-lg font-medium">
                      {assignedUser.firstName} {assignedUser.lastName}
                    </p>
                    <p className="text-sm text-gray-600">
                      {assignedUser.email}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Department
                    </label>
                    <p className="text-lg">{assignedUser.department}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Role
                    </label>
                    <p className="text-lg">{assignedUser.role}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <User className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">Not assigned</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="h-5 w-5" />
                <span>Location</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Current Location
                  </label>
                  <p className="text-lg">{asset.location}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Department
                  </label>
                  <p className="text-lg">
                    {asset.department || "Not specified"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Patch Status */}
          {(() => {
            const t = (asset.type || "").toLowerCase();
            const hidePatch = new Set(["monitor", "storage", "projector"]);
            if (hidePatch.has(t)) return null;

            return (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <RefreshCw className="h-5 w-5" />
                    <span>Patch Status</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Status
                      </label>
                      <div className="mt-1">
                        {getPatchStatusBadge(asset.patchstatus)}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Last Check
                      </label>
                      <p className="text-lg">
                        {asset.lastpatch_check || "Never"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })()}
          {/* Borrowing */}
          {asset.isloanable && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5" />
                  <span>Borrowing</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-4">
                  <Activity className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="text-green-600 font-medium">
                    Available for borrowing
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {asset.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {asset.notes}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
