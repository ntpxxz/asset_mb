import { NextRequest, NextResponse } from 'next/server';

// This would be imported from a shared data file in a real app
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

// GET /api/assets/[id] - Get single asset
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const asset = hardwareAssets.find(a => a.id === params.id);
    
    if (!asset) {
      return NextResponse.json(
        { success: false, error: 'Asset not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: asset
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch asset' },
      { status: 500 }
    );
  }
}

// PUT /api/assets/[id] - Update asset
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const assetIndex = hardwareAssets.findIndex(a => a.id === params.id);
    
    if (assetIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Asset not found' },
        { status: 404 }
      );
    }

    hardwareAssets[assetIndex] = {
      ...hardwareAssets[assetIndex],
      ...body,
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: hardwareAssets[assetIndex],
      message: 'Asset updated successfully'
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to update asset' },
      { status: 500 }
    );
  }
}

// DELETE /api/assets/[id] - Delete asset
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const assetIndex = hardwareAssets.findIndex(a => a.id === params.id);
    
    if (assetIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Asset not found' },
        { status: 404 }
      );
    }

    const deletedAsset = hardwareAssets.splice(assetIndex, 1)[0];

    return NextResponse.json({
      success: true,
      data: deletedAsset,
      message: 'Asset deleted successfully'
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to delete asset' },
      { status: 500 }
    );
  }
}