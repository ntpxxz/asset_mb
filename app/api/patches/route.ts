import { NextRequest, NextResponse } from 'next/server';

// In-memory storage for patch records
let patchRecords = [
  {
    id: 'PATCH-001',
    assetId: 'AST-001',
    patchStatus: 'up-to-date',
    lastPatchCheck: '2024-01-15',
    operatingSystem: 'macOS Ventura 13.6',
    vulnerabilities: 0,
    pendingUpdates: 0,
    criticalUpdates: 0,
    securityUpdates: 0,
    notes: 'All security patches applied',
    nextCheckDate: '2024-02-15',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T14:30:00Z',
  },
  {
    id: 'PATCH-002',
    assetId: 'AST-002',
    patchStatus: 'needs-review',
    lastPatchCheck: '2023-12-20',
    operatingSystem: 'Windows 11 Pro',
    vulnerabilities: 3,
    pendingUpdates: 5,
    criticalUpdates: 1,
    securityUpdates: 2,
    notes: 'Requires manual review for critical updates',
    nextCheckDate: '2024-01-20',
    createdAt: '2023-12-20T16:00:00Z',
    updatedAt: '2024-01-10T09:00:00Z',
  },
];

// GET /api/patches - Get all patch records
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const assetId = searchParams.get('assetId');
    const critical = searchParams.get('critical');

    let filteredRecords = [...patchRecords];

    // Apply filters
    if (status && status !== 'all') {
      filteredRecords = filteredRecords.filter(record => record.patchStatus === status);
    }

    if (assetId) {
      filteredRecords = filteredRecords.filter(record => record.assetId === assetId);
    }

    if (critical === 'true') {
      filteredRecords = filteredRecords.filter(record => record.criticalUpdates > 0);
    }

    return NextResponse.json({
      success: true,
      data: filteredRecords,
      total: filteredRecords.length
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch patch records' },
      { status: 500 }
    );
  }
}

// POST /api/patches - Create new patch record
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const newRecord = {
      ...body,
      id: `PATCH-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    patchRecords.push(newRecord);

    return NextResponse.json({
      success: true,
      data: newRecord,
      message: 'Patch record created successfully'
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to create patch record' },
      { status: 500 }
    );
  }
}