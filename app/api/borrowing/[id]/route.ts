import { NextRequest, NextResponse } from 'next/server';
import * as borrowingService from '@/lib/services/borrowingService';
import { z } from 'zod';

const borrowingUpdateSchema = z.object({
  assetId: z.string().min(1, "Asset ID is required").optional(),
  borrowerId: z.string().min(1, "Borrower ID is required").optional(),
  checkoutDate: z.string().optional(),
  dueDate: z.string().optional(),
  checkinDate: z.string().optional().nullable(),
  status: z.string().optional(),
  purpose: z.string().optional(),
  notes: z.string().optional(),
  action: z.string().optional(), // For special actions like 'checkin'
}).partial();

// GET /api/borrowing/[id] - Get single borrow record
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const result = await borrowingService.getBorrowingRecordById(id);
    
    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Borrow record not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error(`Failed to fetch borrow record ${params.id}:`, error);
    return NextResponse.json(
      { success: false, error: `Failed to fetch borrow record ${params.id}` },
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
    const { id } = params;
    const body = await request.json();
    const validation = borrowingUpdateSchema.safeParse(body);

    if (!validation.success) {
        return NextResponse.json(
            { success: false, error: 'Invalid input', details: validation.error.flatten() },
            { status: 400 }
        );
    }

    const result = await borrowingService.updateBorrowingRecord(id, validation.data);

    if (result.rowCount === 0) {
        return NextResponse.json(
            { success: false, error: 'Borrow record not found' },
            { status: 404 }
        );
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: body.action === 'checkin' ? 'Asset checked in successfully' : 'Borrow record updated successfully'
    });
  } catch (error) {
    console.error(`Failed to update borrow record ${params.id}:`, error);
    return NextResponse.json(
      { success: false, error: `Failed to update borrow record ${params.id}` },
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
    const { id } = params;
    const result = await borrowingService.deleteBorrowingRecord(id);
    
    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Borrow record not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: 'Borrow record deleted successfully'
    });
  } catch (error) {
    console.error(`Failed to delete borrow record ${params.id}:`, error);
    return NextResponse.json(
      { success: false, error: `Failed to delete borrow record ${params.id}` },
      { status: 500 }
    );
  }
}