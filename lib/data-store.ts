// Simple in-memory data store for the MVP
// In production, this would be replaced with a proper database

export interface HardwareAsset {
  id: string;
  assetTag: string;
  type: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  purchaseDate: string;
  purchasePrice: string;
  supplier: string;
  warrantyExpiry: string;
  assignedUser: string;
  location: string;
  department: string;
  status: 'in-stock' | 'in-use' | 'under-repair' | 'retired';
  operatingSystem: string;
  processor: string;
  memory: string;
  storage: string;
  hostname: string;
  ipAddress: string;
  macAddress: string;
  patchStatus: 'up-to-date' | 'needs-review' | 'update-pending';
  lastPatchCheck: string;
  isLoanable: boolean;
  condition: string;
  description: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
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
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  department: string;
  role: string;
  location: string;
  employeeId: string;
  manager: string;
  startDate: string;
  status: 'active' | 'inactive' | 'suspended';
  assetsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface BorrowRecord {
  id: string;
  assetId: string;
  borrowerId: string;
  checkoutDate: string;
  dueDate: string;
  checkinDate?: string;
  status: 'checked-out' | 'returned' | 'overdue';
  purpose: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

// In-memory storage
let hardwareAssets: HardwareAsset[] = [
  {
    id: 'AST-001',
    assetTag: 'AST-001',
    type: 'laptop',
    manufacturer: 'Apple',
    model: 'MacBook Pro 16"',
    serialNumber: 'MBP16-2023-001',
    purchaseDate: '2023-01-15',
    purchasePrice: '2499',
    supplier: 'Apple Store',
    warrantyExpiry: '2026-01-15',
    assignedUser: 'USR-001',
    location: 'ny-office',
    department: 'engineering',
    status: 'in-use',
    operatingSystem: 'macOS Ventura 13.6',
    processor: 'Apple M2 Pro',
    memory: '16GB',
    storage: '512GB SSD',
    hostname: 'MBPRO-JS-001',
    ipAddress: '192.168.1.101',
    macAddress: '00:1B:44:11:3A:B7',
    patchStatus: 'up-to-date',
    lastPatchCheck: '2024-01-15',
    isLoanable: false,
    condition: 'excellent',
    description: 'Primary development laptop',
    notes: 'Configured with development tools',
    createdAt: '2023-01-15T10:00:00Z',
    updatedAt: '2024-01-15T14:30:00Z',
  },
  {
    id: 'AST-002',
    assetTag: 'AST-002',
    type: 'desktop',
    manufacturer: 'Dell',
    model: 'OptiPlex 7090',
    serialNumber: 'DELL-7090-002',
    purchaseDate: '2023-02-20',
    purchasePrice: '1299',
    supplier: 'CDW',
    warrantyExpiry: '2026-02-20',
    assignedUser: '',
    location: 'it-storage',
    department: '',
    status: 'in-stock',
    operatingSystem: 'Windows 11 Pro',
    processor: 'Intel i7-11700',
    memory: '16GB DDR4',
    storage: '512GB NVMe SSD',
    hostname: '',
    ipAddress: '',
    macAddress: '',
    patchStatus: 'needs-review',
    lastPatchCheck: '2023-12-20',
    isLoanable: true,
    condition: 'good',
    description: 'Standard office desktop',
    notes: 'Available for assignment',
    createdAt: '2023-02-20T09:00:00Z',
    updatedAt: '2023-12-20T16:00:00Z',
  },
];

let softwareLicenses: SoftwareLicense[] = [
  {
    id: 'SW-001',
    softwareName: 'Microsoft Office 365',
    publisher: 'Microsoft',
    version: '2023',
    licenseKey: 'XXXXX-XXXXX-XXXXX-XXXXX',
    licenseType: 'subscription',
    purchaseDate: '2023-01-01',
    expiryDate: '2024-01-01',
    licensesTotal: 150,
    licensesAssigned: 142,
    category: 'productivity',
    description: 'Office productivity suite',
    notes: 'Enterprise subscription',
    status: 'active',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

let users: User[] = [
  {
    id: 'USR-001',
    firstName: 'John',
    lastName: 'Smith',
    email: 'john.smith@company.com',
    phone: '+1 (555) 123-4567',
    department: 'engineering',
    role: 'Senior Developer',
    location: 'ny-office',
    employeeId: 'EMP-001',
    manager: 'MGR-001',
    startDate: '2022-01-15',
    status: 'active',
    assetsCount: 1,
    createdAt: '2022-01-15T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
  },
];

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
      id: data.assetTag || generateId('AST'),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
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
      updatedAt: new Date().toISOString(),
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
      asset.assetTag.toLowerCase().includes(lowercaseQuery) ||
      asset.serialNumber.toLowerCase().includes(lowercaseQuery) ||
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
  
  create: (data: Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'assetsCount'>): User => {
    const user: User = {
      ...data,
      id: generateId('USR'),
      assetsCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
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
      updatedAt: new Date().toISOString(),
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
  
  checkout: (assetId: string, borrowerId: string, dueDate: string, purpose: string, notes: string): BorrowRecord => {
    const record: BorrowRecord = {
      id: generateId('BOR'),
      assetId,
      borrowerId,
      checkoutDate: new Date().toISOString().split('T')[0],
      dueDate,
      status: 'checked-out',
      purpose,
      notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    borrowRecords.push(record);
    
    // Update asset status
    hardwareService.update(assetId, { status: 'in-use', assignedUser: borrowerId });
    
    return record;
  },
  
  checkin: (recordId: string): BorrowRecord | null => {
    const index = borrowRecords.findIndex(record => record.id === recordId);
    if (index === -1) return null;
    
    borrowRecords[index] = {
      ...borrowRecords[index],
      checkinDate: new Date().toISOString().split('T')[0],
      status: 'returned',
      updatedAt: new Date().toISOString(),
    };
    
    // Update asset status
    hardwareService.update(borrowRecords[index].assetId, { status: 'in-stock', assignedUser: '' });
    
    return borrowRecords[index];
  },
  
  getCheckedOut: (): BorrowRecord[] => 
    borrowRecords.filter(record => record.status === 'checked-out'),
  
  getOverdue: (): BorrowRecord[] => {
    const today = new Date().toISOString().split('T')[0];
    return borrowRecords.filter(record => 
      record.status === 'checked-out' && record.dueDate < today
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
      if (!asset.warrantyExpiry) return false;
      const warrantyDate = new Date(asset.warrantyExpiry);
      return warrantyDate <= thirtyDaysFromNow && warrantyDate >= today;
    })
    .map(asset => ({
      assetTag: asset.assetTag,
      model: asset.model,
      warrantyExpiry: asset.warrantyExpiry,
      daysLeft: Math.ceil((new Date(asset.warrantyExpiry).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)),
    }));
}