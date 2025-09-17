"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  Download,
  ExternalLink,
  FileText,
  Package,
  History as HistoryIcon,
  Activity,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface PatchRecord {
  id: string;
  assetId: string;
  patchStatus: string;
  lastPatchCheck: string;
  operatingSystem: string;
  vulnerabilities: number;
  pendingUpdates: number;
  criticalUpdates: number;
  securityUpdates: number;
  notes?: string;
  nextCheckDate?: string;
  createdAt: string;
  updatedAt: string;
}

interface PatchHistoryRecord {
  id: string;
  patchId: string;
  patchName: string;
  version: string;
  description: string;
  patchType: "security" | "critical" | "feature" | "bugfix" | string;
  severity: "low" | "medium" | "high" | "critical" | string;
  status: "installed" | "failed" | "pending" | "scheduled" | string;
  installDate?: string;
  scheduledDate?: string;
  size?: string;
  kbNumber?: string;
  cveIds?: string[];
  notes?: string;
  createdAt: string;
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case "up-to-date":
      return <Badge className="bg-green-100 text-green-800">Up-to-Date</Badge>;
    case "needs-review":
      return <Badge className="bg-yellow-100 text-yellow-800">Needs Review</Badge>;
    case "update-pending":
      return <Badge className="bg-red-100 text-red-800">Update Pending</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

const getPatchTypeBadge = (type: string) => {
  switch (type) {
    case "security":
      return <Badge className="bg-red-100 text-red-800">Security</Badge>;
    case "critical":
      return <Badge className="bg-orange-100 text-orange-800">Critical</Badge>;
    case "feature":
      return <Badge className="bg-blue-100 text-blue-800">Feature</Badge>;
    case "bugfix":
      return <Badge className="bg-purple-100 text-purple-800">Bug Fix</Badge>;
    default:
      return <Badge variant="secondary">{type}</Badge>;
  }
};

const getPatchStatusBadge = (status: string) => {
  switch (status) {
    case "installed":
      return <Badge className="bg-green-100 text-green-800">Installed</Badge>;
    case "failed":
      return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
    case "pending":
      return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
    case "scheduled":
      return <Badge className="bg-blue-100 text-blue-800">Scheduled</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

const getSeverityBadge = (severity: string) => {
  switch (severity) {
    case "critical":
      return <Badge className="bg-red-600 text-white">Critical</Badge>;
    case "high":
      return <Badge className="bg-red-100 text-red-800">High</Badge>;
    case "medium":
      return <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>;
    case "low":
      return <Badge className="bg-green-100 text-green-800">Low</Badge>;
    default:
      return <Badge variant="secondary">{severity}</Badge>;
  }
};

export default function PatchDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const patchId = params?.id as string;

  const [patchRecord, setPatchRecord] = useState<PatchRecord | null>(null);
  const [patchHistory, setPatchHistory] = useState<PatchHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!patchId) return;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`/api/patches/${patchId}?include=history`, { cache: "no-store" });
        const json = await res.json();
        if (!res.ok || !json?.success) throw new Error(json?.error || `Failed to load patch ${patchId}`);

        const record: PatchRecord = normalizeRecord(json.data);
        const history: PatchHistoryRecord[] = Array.isArray(json.history) ? json.history.map(normalizeHistory) : [];

        setPatchRecord(record);
        setPatchHistory(history);
      } catch (e: any) {
        console.error(e);
        setError(e?.message || "Failed to load patch details");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [patchId]);

  const toIso = (v: any) => (v ? new Date(v).toISOString() : "");
  const normalizeRecord = (raw: any): PatchRecord => ({
    id: String(raw.id),
    assetId: String(raw.assetId),
    patchStatus: raw.patchStatus,
    lastPatchCheck: toIso(raw.lastPatchCheck),
    operatingSystem: raw.operatingSystem || "",
    vulnerabilities: Number(raw.vulnerabilities || 0),
    pendingUpdates: Number(raw.pendingUpdates || 0),
    criticalUpdates: Number(raw.criticalUpdates || 0),
    securityUpdates: Number(raw.securityUpdates || 0),
    notes: raw.notes || undefined,
    nextCheckDate: toIso(raw.nextCheckDate),
    createdAt: toIso(raw.createdAt) || new Date().toISOString(),
    updatedAt: toIso(raw.updatedAt) || new Date().toISOString(),
  });

  const normalizeHistory = (raw: any): PatchHistoryRecord => {
    let cveIds: string[] | undefined;
    if (raw?.cveIds != null) {
      if (Array.isArray(raw.cveIds)) cveIds = raw.cveIds.map(String);
      else if (typeof raw.cveIds === "string") {
        const s = raw.cveIds.trim();
        if (s.startsWith("[") && s.endsWith("]")) {
          try { cveIds = JSON.parse(s); } catch { cveIds = undefined; }
        } else if (s) {
          cveIds = s.split(",").map((x: string) => x.trim()).filter(Boolean);
        }
      }
    }
    return {
      id: String(raw.id),
      patchId: String(raw.patchId),
      patchName: raw.patchName || "-",
      version: raw.version || "-",
      description: raw.description || "",
      patchType: raw.patchType || "feature",
      severity: raw.severity || "low",
      status: raw.status || "pending",
      installDate: toIso(raw.installDate) || undefined,
      scheduledDate: toIso(raw.scheduledDate) || undefined,
      size: raw.size || undefined,
      kbNumber: raw.kbNumber || undefined,
      cveIds,
      notes: raw.notes || undefined,
      createdAt: toIso(raw.createdAt) || new Date().toISOString(),
    };
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDateShort = (dateString: string) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString("th-TH", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading patch details...</p>
        </div>
      </div>
    );
  }

  if (error || !patchRecord) {
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
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Patch Record Not Found</h3>
            <p className="text-gray-600">{error || "The requested patch record could not be found."}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

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
            <h1 className="text-3xl font-bold tracking-tight">Patch Management Details</h1>
            <p className="text-gray-600">{patchRecord.assetId} • {patchRecord.operatingSystem}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button className="w-full" size="sm" onClick={() => router.refresh()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Run Patch Check
          </Button>
          <Button variant="outline" className="w-full" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
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
                <Shield className="h-5 w-5" />
                <span>Patch Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Asset ID</label>
                  <p className="text-lg font-mono">{patchRecord.assetId}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Patch Record ID</label>
                  <p className="text-lg font-mono">{patchRecord.id}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Operating System</label>
                  <p className="text-lg">{patchRecord.operatingSystem}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Current Status</label>
                  <div className="mt-1">{getStatusBadge(patchRecord.patchStatus)}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Last Check</label>
                  <p className="text-lg">{formatDate(patchRecord.lastPatchCheck)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Next Check</label>
                  <p className="text-lg">{formatDate(patchRecord.nextCheckDate || "")}</p>
                </div>
              </div>

              {patchRecord.notes && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Notes</label>
                  <p className="text-lg">{patchRecord.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Patch History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <HistoryIcon className="h-5 w-5" />
                <span>Patch History ({patchHistory.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patch Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {patchHistory.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                          No patch history found
                        </TableCell>
                      </TableRow>
                    ) : (
                      patchHistory.map((ph) => (
                        <TableRow key={ph.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{ph.patchName}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-gray-500">v{ph.version}</span>
                                {ph.kbNumber && (
                                  <Badge variant="outline" className="text-xs">{ph.kbNumber}</Badge>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{getPatchTypeBadge(ph.patchType)}</TableCell>
                          <TableCell>{getSeverityBadge(ph.severity)}</TableCell>
                          <TableCell>{getPatchStatusBadge(ph.status)}</TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {ph.status === "installed" && ph.installDate ? (
                                <>
                                  <p className="font-medium">Installed</p>
                                  <p className="text-gray-500">{formatDateShort(ph.installDate)}</p>
                                </>
                              ) : ph.status === "scheduled" && ph.scheduledDate ? (
                                <>
                                  <p className="font-medium">Scheduled</p>
                                  <p className="text-gray-500">{formatDateShort(ph.scheduledDate)}</p>
                                </>
                              ) : (
                                <p className="text-gray-500">{formatDateShort(ph.createdAt)}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{ph.size && <span className="text-sm text-gray-600">{ph.size}</span>}</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button variant="ghost" size="sm" title="View Details">
                                <FileText className="h-4 w-4" />
                              </Button>
                              {ph.cveIds && ph.cveIds.length > 0 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  title="View CVE Details"
                                  onClick={() => {
                                    const first = ph.cveIds![0];
                                    window.open(`https://nvd.nist.gov/vuln/detail/${first}`, "_blank");
                                  }}
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Recent Patch Details */}
          {patchHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Package className="h-5 w-5" />
                  <span>Recent Patch Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {patchHistory.slice(0, 3).map((ph, index) => (
                    <div key={ph.id}>
                      <div className="border-l-4 border-l-blue-500 pl-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-medium">{ph.patchName}</h4>
                            <p className="text-sm text-gray-600">Version {ph.version}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {getPatchTypeBadge(ph.patchType)}
                            {getSeverityBadge(ph.severity)}
                            {getPatchStatusBadge(ph.status)}
                          </div>
                        </div>

                        <p className="text-sm text-gray-700 mb-3">{ph.description}</p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-gray-500">Size:</span>
                            <span className="ml-2">{ph.size || "N/A"}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-500">KB Number:</span>
                            <span className="ml-2">{ph.kbNumber || "N/A"}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-500">CVE IDs:</span>
                            <span className="ml-2">{ph.cveIds && ph.cveIds.length > 0 ? ph.cveIds.join(", ") : "None"}</span>
                          </div>
                        </div>

                        {ph.notes && (
                          <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
                            <span className="font-medium text-gray-500">Notes:</span>
                            <span className="ml-2 text-gray-700">{ph.notes}</span>
                          </div>
                        )}
                      </div>
                      {index < 2 && <Separator className="mt-6" />}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Security Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5" />
                <span>Security Summary</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="text-2xl font-bold text-red-600">{patchRecord.vulnerabilities}</div>
                <div className="text-sm text-red-700">Vulnerabilities</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
                <div className="text-2xl font-bold text-orange-600">{patchRecord.pendingUpdates}</div>
                <div className="text-sm text-orange-700">Pending Updates</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="text-2xl font-bold text-red-600">{patchRecord.criticalUpdates}</div>
                <div className="text-sm text-red-700">Critical Updates</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="text-2xl font-bold text-purple-600">{patchRecord.securityUpdates}</div>
                <div className="text-sm text-purple-700">Security Updates</div>
              </div>
            </CardContent>
          </Card>

          {/* Priority Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5" />
                <span>Priority Status</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Priority Level</label>
                  <div className="mt-1">
                    {patchRecord.criticalUpdates > 0 && (
                      <Badge className="bg-red-100 text-red-800">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Critical Priority
                      </Badge>
                    )}
                    {patchRecord.securityUpdates > 0 && patchRecord.criticalUpdates === 0 && (
                      <Badge className="bg-orange-100 text-orange-800">
                        <Clock className="h-3 w-3 mr-1" />
                        High Priority
                      </Badge>
                    )}
                    {patchRecord.pendingUpdates > 0 && patchRecord.securityUpdates === 0 && (
                      <Badge className="bg-yellow-100 text-yellow-800">
                        <Clock className="h-3 w-3 mr-1" />
                        Normal Priority
                      </Badge>
                    )}
                    {patchRecord.pendingUpdates === 0 && (
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        No Updates Needed
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
