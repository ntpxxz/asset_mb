import { NextRequest, NextResponse } from 'next/server';

// This would be imported from a shared data file in a real app
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

// GET /api/patches/[id] - Get single patch record
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const record = patchRecords.find(r => r.id === params.id);
    
    if (!record) {
      return NextResponse.json(
        { success: false, error: 'Patch record not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: record
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch patch record' },
      { status: 500 }
    );
  }
}

// PUT /api/patches/[id] - Update patch record
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const recordIndex = patchRecords.findIndex(r => r.id === params.id);
    
    if (recordIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Patch record not found' },
        { status: 404 }
      );
    }

    patchRecords[recordIndex] = {
      ...patchRecords[recordIndex],
      ...body,
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: patchRecords[recordIndex],
      message: 'Patch record updated successfully'
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to update patch record' },
      { status: 500 }
    );
  }
}

// DELETE /api/patches/[id] - Delete patch record
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const recordIndex = patchRecords.findIndex(r => r.id === params.id);
    
    if (recordIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Patch record not found' },
        { status: 404 }
      );
    }

    const deletedRecord = patchRecords.splice(recordIndex, 1)[0];

    return NextResponse.json({
      success: true,
      data: deletedRecord,
      message: 'Patch record deleted successfully'
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to delete patch record' },
      { status: 500 }
    );
  }
}