import { NextRequest, NextResponse } from 'next/server';

// In-memory storage (in production, this would be a database)
let hardwareAssets = [
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

// GET /api/assets - Get all assets
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const type = searchParams.get('type');

    let filteredAssets = [...hardwareAssets];

    // Apply filters
    if (search) {
      const searchLower = search.toLowerCase();
      filteredAssets = filteredAssets.filter(asset =>
        asset.assetTag.toLowerCase().includes(searchLower) ||
        asset.serialNumber.toLowerCase().includes(searchLower) ||
        asset.manufacturer.toLowerCase().includes(searchLower) ||
        asset.model.toLowerCase().includes(searchLower)
      );
    }

    if (status && status !== 'all') {
      filteredAssets = filteredAssets.filter(asset => asset.status === status);
    }

    if (type && type !== 'all') {
      filteredAssets = filteredAssets.filter(asset => asset.type === type);
    }

    return NextResponse.json({
      success: true,
      data: filteredAssets,
      total: filteredAssets.length
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch assets' },
      { status: 500 }
    );
  }
}

// POST /api/assets - Create new asset
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const newAsset = {
      ...body,
      id: body.assetTag || `AST-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    hardwareAssets.push(newAsset);

    return NextResponse.json({
      success: true,
      data: newAsset,
      message: 'Asset created successfully'
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to create asset' },
      { status: 500 }
    );
  }
}