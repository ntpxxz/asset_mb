import { NextRequest, NextResponse } from 'next/server';

let softwareLicenses = [
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

// GET /api/software - Get all software licenses
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const type = searchParams.get('type');

    let filteredSoftware = [...softwareLicenses];

    // Apply filters
    if (search) {
      const searchLower = search.toLowerCase();
      filteredSoftware = filteredSoftware.filter(sw =>
        sw.softwareName.toLowerCase().includes(searchLower) ||
        sw.publisher.toLowerCase().includes(searchLower)
      );
    }

    if (status && status !== 'all') {
      filteredSoftware = filteredSoftware.filter(sw => sw.status === status);
    }

    if (type && type !== 'all') {
      filteredSoftware = filteredSoftware.filter(sw => sw.licenseType === type);
    }

    return NextResponse.json({
      success: true,
      data: filteredSoftware,
      total: filteredSoftware.length
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch software licenses' },
      { status: 500 }
    );
  }
}

// POST /api/software - Create new software license
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const newSoftware = {
      ...body,
      id: `SW-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    softwareLicenses.push(newSoftware);

    return NextResponse.json({
      success: true,
      data: newSoftware,
      message: 'Software license created successfully'
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to create software license' },
      { status: 500 }
    );
  }
}