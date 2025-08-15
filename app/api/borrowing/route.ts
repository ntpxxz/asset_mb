import { NextRequest, NextResponse } from 'next/server';

// In-memory storage for borrow records
let borrowRecords = [
  {
    id: 'BOR-001',
    assetId: 'AST-001',
    borrowerId: 'USR-001',
    checkoutDate: '2024-01-10',
    dueDate: '2024-01-24',
    checkinDate: null,
    status: 'checked-out',
    purpose: 'work',
    notes: 'Primary work laptop',
    createdAt: '2024-01-10T09:00:00Z',
    updatedAt: '2024-01-10T09:00:00Z',
  },
];

// GET /api/borrowing - Get all borrow records
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const userId = searchParams.get('userId');
    const assetId = searchParams.get('assetId');

    let filteredRecords = [...borrowRecords];

    // Apply filters
    if (status && status !== 'all') {
      filteredRecords = filteredRecords.filter(record => record.status === status);
    }

    if (userId) {
      filteredRecords = filteredRecords.filter(record => record.borrowerId === userId);
    }

    if (assetId) {
      filteredRecords = filteredRecords.filter(record => record.assetId === assetId);
    }

    return NextResponse.json({
      success: true,
      data: filteredRecords,
      total: filteredRecords.length
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch borrow records' },
      { status: 500 }
    );
  }
}

// POST /api/borrowing - Create new borrow record (checkout)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const newRecord = {
      ...body,
      id: `BOR-${Date.now()}`,
      status: 'checked-out',
      checkinDate: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    borrowRecords.push(newRecord);

    return NextResponse.json({
      success: true,
      data: newRecord,
      message: 'Asset checked out successfully'
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to checkout asset' },
      { status: 500 }
    );
  }
}