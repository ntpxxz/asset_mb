import { NextRequest, NextResponse } from 'next/server';

// This would be imported from a shared data file in a real app
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

// GET /api/borrowing/[id] - Get single borrow record
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const record = borrowRecords.find(r => r.id === params.id);
    
    if (!record) {
      return NextResponse.json(
        { success: false, error: 'Borrow record not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: record
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch borrow record' },
      { status: 500 }
    );
  }
}

// PUT /api/borrowing/[id] - Update borrow record (checkin)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const recordIndex = borrowRecords.findIndex(r => r.id === params.id);
    
    if (recordIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Borrow record not found' },
        { status: 404 }
      );
    }

    // If checking in, set checkin date and status
    if (body.action === 'checkin') {
      borrowRecords[recordIndex] = {
        ...borrowRecords[recordIndex],
        checkinDate: new Date().toISOString().split('T')[0],
        status: 'returned',
        updatedAt: new Date().toISOString(),
        ...body,
      };
    } else {
      borrowRecords[recordIndex] = {
        ...borrowRecords[recordIndex],
        ...body,
        updatedAt: new Date().toISOString(),
      };
    }

    return NextResponse.json({
      success: true,
      data: borrowRecords[recordIndex],
      message: body.action === 'checkin' ? 'Asset checked in successfully' : 'Borrow record updated successfully'
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to update borrow record' },
      { status: 500 }
    );
  }
}

// DELETE /api/borrowing/[id] - Delete borrow record
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const recordIndex = borrowRecords.findIndex(r => r.id === params.id);
    
    if (recordIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Borrow record not found' },
        { status: 404 }
      );
    }

    const deletedRecord = borrowRecords.splice(recordIndex, 1)[0];

    return NextResponse.json({
      success: true,
      data: deletedRecord,
      message: 'Borrow record deleted successfully'
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to delete borrow record' },
      { status: 500 }
    );
  }
}