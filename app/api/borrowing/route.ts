import { NextRequest, NextResponse } from 'next/server';
import * as borrowingService from '@/lib/services/borrowingService';
import { z } from 'zod';

const borrowingSchema = z.object({
  assetId: z.string().min(1, "Asset ID is required"),
  borrowerId: z.string().min(1, "Borrower ID is required"),
  checkoutDate: z.string(),
  dueDate: z.string().optional(),
  status: z.string(),
  purpose: z.string().optional(),
  notes: z.string().optional(),
});

// GET /api/borrowing - Get all borrow records
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const userId = searchParams.get('userId');
  const assetId = searchParams.get('assetId');

  try {
    const result = await borrowingService.getBorrowingRecords(status, userId, assetId);
    return NextResponse.json({
      success: true,
      data: result.rows,
      total: result.rowCount
    });
  } catch (error) {
    console.error('Failed to fetch borrow records:', error);
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
    const validation = borrowingSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const result = await borrowingService.createBorrowingRecord(validation.data);

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: 'Asset checked out successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Failed to checkout asset:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to checkout asset' },
      { status: 500 }
    );
  }
}