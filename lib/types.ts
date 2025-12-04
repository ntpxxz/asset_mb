/**
 * Type Definitions for IT Asset Management System
 * Centralized type definitions for all entities
 */

// ============================================================================
// Hardware Assets
// ============================================================================

export interface HardwareAsset {
    id: string;
    asset_tag: string;
    type: string;
    manufacturer: string;
    model: string;
    serialnumber: string;
    purchasedate: string;
    purchaseprice: string;
    supplier: string;
    warrantyexpiry: string;
    assigneduser: string;
    location: string;
    department: string;
    status: 'in-stock' | 'in-use' | 'under-repair' | 'retired';
    operatingsystem: string;
    processor: string;
    memory: string;
    storage: string;
    hostname: string;
    ipaddress: string;
    macaddress: string;
    patchstatus: 'up-to-date' | 'needs-review' | 'update-pending';
    lastpatch_check: string;
    isloanable: boolean;
    condition?: 'new' | 'good' | 'fair' | 'poor' | 'broken';
    description: string;
    notes: string;
    // Extended fields
    building?: string;
    division?: string;
    section?: string;
    area?: string;
    pc_name?: string;
    os_key?: string;
    os_version?: string;
    ms_office_apps?: string;
    ms_office_version?: string;
    is_legally_purchased?: string;
    created_at: string;
    updated_at: string;
}

export type AssetFormData = {
    asset_tag: string;
    type?: string;
    manufacturer?: string;
    model?: string;
    serialnumber?: string;
    purchasedate?: string;
    purchaseprice?: number | null;
    supplier?: string;
    warrantyexpiry?: string;
    assigneduser?: string;
    department?: string;
    status: string | 'available' | 'assigned' | 'maintenance' | 'retired';
    condition?: 'new' | 'good' | 'fair' | 'poor' | 'broken';
    operatingsystem?: string;
    processor?: string;
    memory?: string;
    storage?: string;
    hostname?: string;
    ip_address?: string;
    mac_address?: string;
    patchstatus?: 'up-to-date' | 'needs-review' | 'update-pending';
    lastpatch_check?: string;
    isloanable?: boolean;
    description?: string;
    notes?: string;
    // Extended fields
    building?: string;
    division?: string;
    section?: string;
    area?: string;
    pc_name?: string;
    os_key?: string;
    os_version?: string;
    ms_office_apps?: string;
    ms_office_version?: string;
    is_legally_purchased?: string;
    id?: string;
};

// ============================================================================
// Software
// ============================================================================

export interface SoftwareFormData {
    id?: string;
    software_name: string;
    publisher?: string | null;
    version?: string | null;
    license_key?: string | null;
    licenses_type?:
    | 'perpetual' | 'subscription' | 'volume' | 'oem' | 'trial' | 'educational' | null;
    status?:
    | 'active'
    | 'inactive'
    | 'expired'
    | 'retired'
    | 'trial'
    | null;
    purchasedate?: string | null;
    expirydate?: string | null;
    licenses_total?: number | null;
    licenses_assigned?: number | null;
    category?: string | null;
    description?: string | null;
    notes?: string | null;
}

export interface SoftwareLicense {
    id: string;
    softwareName: string;
    publisher: string;
    version: string;
    licenseKey: string;
    licenseType: 'perpetual' | 'subscription' | 'volume' | 'oem' | 'trial' | 'educational';
    purchaseDate: string;
    expiryDate: string;
    licensesTotal: number;
    licensesAssigned: number;
    category: string;
    description: string;
    notes: string;
    status: 'active' | 'expiring-soon' | 'expired' | 'inactive';
    createdAt: string;
    updatedAt: string;
}

// ============================================================================
// Users
// ============================================================================

export interface User {
    id: string;
    firstname: string;
    lastname: string;
    email: string;
    phone: string;
    department: string;
    role: string;
    location: string;
    employee_id: string;
    start_date: string;
    status: 'active' | 'inactive' | 'suspended';
    assets_count: number;
    created_at: string;
    updated_at: string;
}

// ============================================================================
// Borrowing
// ============================================================================

export interface BorrowRecord {
    id: string;
    asset_tag: string;
    borrowerId: string;
    borrowername?: string;
    checkout_date: string;
    due_date: string;
    checkin_date?: string;
    status: 'checked-out' | 'returned' | 'overdue';
    purpose: string;
    notes: string;
    createdAt: string;
    updatedAt: string;
}

export interface CheckedOutAsset {
    id: string;
    asset_tag: string;
    name: string;
    borrowername: string;
    department: string;
    checkout_date: string;
    due_date: string;
    status: string;
    purpose?: string;
}

// ============================================================================
// Patches
// ============================================================================

export interface PatchRecord {
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

export interface PatchHistoryRecord {
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

// ============================================================================
// Inventory
// ============================================================================

export interface InventoryItem {
    id: number;
    name: string;
    barcode?: string;
    category: string;
    quantity: number;
    unit: string;
    unit_price?: number;
    min_stock?: number;
    location?: string;
    description?: string;
    image_url?: string;
    created_at: string;
    updated_at: string;
}

export interface InventoryTransaction {
    id: number;
    item_id: number;
    type: 'receive' | 'dispense' | 'return' | 'adjust';
    quantity_change: number;
    quantity_after: number;
    user_id?: string;
    notes?: string;
    created_at: string;
}

// ============================================================================
// Dashboard Stats
// ============================================================================

export interface DashboardStats {
    hardware: {
        total: number;
        computer: number;
        network: number;
        inUse: number;
        available: number;
        underRepair: number;
        retired: number;
    };
    inventory: {
        totalItems: number;
        totalQuantity: number;
        lowStock: number;
        outOfStock: number;
        totalValue: number;
    };
    users: {
        total: number;
        active: number;
        inactive: number;
    };
    warrantyExpiring: Array<{
        asset_tag: string;
        model: string;
        warrantyExpiry: string;
        daysLeft: number;
    }>;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export interface PaginatedResponse<T = any> {
    success: boolean;
    data: T[];
    pagination: {
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
    };
}
