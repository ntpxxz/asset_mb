// Simple in-memory data store for the MVP
// In production, this would be replaced with a proper database

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
  // New fields
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
  location?: string;
  department?: string;
  status: string | 'available' | 'assigned' | 'maintenance' | 'retired';
  condition?: 'new' | 'good' | 'fair' | 'poor' | 'broken';
  operatingsystem?: string;
  processor?: string;
  memory?: string;
  storage?: string;
  hostname?: string;
  ipaddress?: string;
  macaddress?: string;
  patchstatus?: 'up-to-date' | 'needs-review' | 'update-pending';
  lastpatch_check?: string;
  isloanable?: boolean;
  description?: string;
  notes?: string;
  // New fields
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
  purchasedate?: string | null;   // YYYY-MM-DD
  expirydate?: string | null;     // YYYY-MM-DD
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
  installDate?: string; // ISO
  scheduledDate?: string; // ISO
  size?: string;
  kbNumber?: string;
  cveIds?: string[]; // normalized to array in UI
  notes?: string;
  createdAt: string; // ISO
}
// In-memory storage
let hardwareAssets: HardwareAsset[] = [];

let softwareLicenses: SoftwareLicense[] = [];

let users: User[] = [];

let borrowRecords: BorrowRecord[] = [];

// Generate unique IDs
function generateId(prefix: string): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `${prefix}-${timestamp}-${random}`;
}

// Hardware Assets CRUD
export const hardwareService = {
  getAll: (): HardwareAsset[] => [...hardwareAssets],

  getById: (id: string): HardwareAsset | undefined =>
    hardwareAssets.find(asset => asset.id === id),

  create: (data: Omit<HardwareAsset, 'id' | 'createdAt' | 'updatedAt'>): HardwareAsset => {
    const asset: HardwareAsset = {
      ...data,
      id: data.asset_tag || generateId('AST'),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    hardwareAssets.push(asset);
    return asset;
  },

  update: (id: string, data: Partial<HardwareAsset>): HardwareAsset | null => {
    const index = hardwareAssets.findIndex(asset => asset.id === id);
    if (index === -1) return null;

    hardwareAssets[index] = {
      ...hardwareAssets[index],
      ...data,
      updated_at: new Date().toISOString(),
    };
    return hardwareAssets[index];
  },

  delete: (id: string): boolean => {
    const index = hardwareAssets.findIndex(asset => asset.id === id);
    if (index === -1) return false;

    hardwareAssets.splice(index, 1);
    return true;
  },

  search: (query: string): HardwareAsset[] => {
    const lowercaseQuery = query.toLowerCase();
    return hardwareAssets.filter(asset =>
      asset.asset_tag.toLowerCase().includes(lowercaseQuery) ||
      asset.serialnumber.toLowerCase().includes(lowercaseQuery) ||
      asset.manufacturer.toLowerCase().includes(lowercaseQuery) ||
      asset.model.toLowerCase().includes(lowercaseQuery)
    );
  },
};

// Software Licenses CRUD
export const softwareService = {
  getAll: (): SoftwareLicense[] => [...softwareLicenses],

  getById: (id: string): SoftwareLicense | undefined =>
    softwareLicenses.find(license => license.id === id),

  create: (data: Omit<SoftwareLicense, 'id' | 'createdAt' | 'updatedAt'>): SoftwareLicense => {
    const license: SoftwareLicense = {
      ...data,
      id: generateId('SW'),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    softwareLicenses.push(license);
    return license;
  },

  update: (id: string, data: Partial<SoftwareLicense>): SoftwareLicense | null => {
    const index = softwareLicenses.findIndex(license => license.id === id);
    if (index === -1) return null;

    softwareLicenses[index] = {
      ...softwareLicenses[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    return softwareLicenses[index];
  },

  delete: (id: string): boolean => {
    const index = softwareLicenses.findIndex(license => license.id === id);
    if (index === -1) return false;

    softwareLicenses.splice(index, 1);
    return true;
  },
};

// Users CRUD
export const userService = {
  getAll: (): User[] => [...users],

  getById: (id: string): User | undefined =>
    users.find(user => user.id === id),

  create: (data: Omit<User, 'id' | 'created_at' | 'updated_at' | 'assets_count'>): User => {
    const user: User = {
      ...data,
      id: generateId('USR'),
      assets_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    users.push(user);
    return user;
  },

  update: (id: string, data: Partial<User>): User | null => {
    const index = users.findIndex(user => user.id === id);
    if (index === -1) return null;

    users[index] = {
      ...users[index],
      ...data,
      updated_at: new Date().toISOString(),
    };
    return users[index];
  },

  delete: (id: string): boolean => {
    const index = users.findIndex(user => user.id === id);
    if (index === -1) return false;

    users.splice(index, 1);
    return true;
  },
};

// Borrow Records CRUD
export const borrowService = {
  getAll: (): BorrowRecord[] => [...borrowRecords],

  getById: (id: string): BorrowRecord | undefined =>
    borrowRecords.find(record => record.id === id),

  checkout: (asset_tag: string, borrowerId: string, due_date: string, purpose: string, notes: string): BorrowRecord => {
    const record: BorrowRecord = {
      id: generateId('BOR'),
      asset_tag,
      borrowerId,
      checkout_date: new Date().toISOString().split('T')[0],
      due_date,
      status: 'checked-out',
      purpose,
      notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    borrowRecords.push(record);

    // Update asset status
    hardwareService.update(asset_tag, { status: 'in-use', assigneduser: borrowerId });

    return record;
  },

  checkin: (recordId: string): BorrowRecord | null => {
    const index = borrowRecords.findIndex(record => record.id === recordId);
    if (index === -1) return null;

    borrowRecords[index] = {
      ...borrowRecords[index],
      checkin_date: new Date().toISOString().split('T')[0],
      status: 'returned',
      updatedAt: new Date().toISOString(),
    };

    // Update asset status
    hardwareService.update(borrowRecords[index].asset_tag, { status: 'in-stock', assigneduser: '' });

    return borrowRecords[index];
  },

  getCheckedOut: (): BorrowRecord[] =>
    borrowRecords.filter(record => record.status === 'checked-out'),

  getOverdue: (): BorrowRecord[] => {
    const today = new Date().toISOString().split('T')[0];
    return borrowRecords.filter(record =>
      record.status === 'checked-out' && record.due_date < today
    );
  },
};

// Utility functions
export function getAssetStats() {
  const total = hardwareAssets.length;
  const inUse = hardwareAssets.filter(a => a.status === 'in-use').length;
  const available = hardwareAssets.filter(a => a.status === 'in-stock').length;
  const underRepair = hardwareAssets.filter(a => a.status === 'under-repair').length;
  const retired = hardwareAssets.filter(a => a.status === 'retired').length;

  return { total, inUse, available, underRepair, retired };
}

export function getSoftwareStats() {
  const total = softwareLicenses.length;
  const totalLicenses = softwareLicenses.reduce((sum, sw) => sum + sw.licensesTotal, 0);
  const assignedLicenses = softwareLicenses.reduce((sum, sw) => sum + sw.licensesAssigned, 0);
  const availableLicenses = totalLicenses - assignedLicenses;

  return { total, totalLicenses, assignedLicenses, availableLicenses };
}

export function getUserStats() {
  const total = users.length;
  const active = users.filter(u => u.status === 'active').length;
  const inactive = users.filter(u => u.status === 'inactive').length;

  return { total, active, inactive };
}

export function getUpcomingWarranties() {
  const today = new Date();
  const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

  return hardwareAssets
    .filter(asset => {
      if (!asset.warrantyexpiry) return false;
      const warrantyDate = new Date(asset.warrantyexpiry);
      return warrantyDate <= thirtyDaysFromNow && warrantyDate >= today;
    })
    .map(asset => ({
      asset_tag: asset.asset_tag,
      model: asset.model,
      warrantyExpiry: asset.warrantyexpiry,
      daysLeft: Math.ceil((new Date(asset.warrantyexpiry).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)),
    }));
}