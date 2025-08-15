import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
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

  let query = 'SELECT * FROM asset_borrowing';
  const queryParams: any[] = [];
  const whereClauses: string[] = [];

  if (status && status !== 'all') {
    whereClauses.push(`status = $${queryParams.length + 1}`);
    queryParams.push(status);
  }

  if (userId) {
    whereClauses.push(`"borrowerId" = $${queryParams.length + 1}`);
    queryParams.push(userId);
  }
  
  if (assetId) {
    whereClauses.push(`"assetId" = $${queryParams.length + 1}`);
    queryParams.push(assetId);
  }

  if (whereClauses.length > 0) {
    query += ' WHERE ' + whereClauses.join(' AND ');
  }

  try {
    const result = await pool.query(query, queryParams);
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
    
    const { 
      assetId, borrowerId, checkoutDate, dueDate, status, purpose, notes 
    } = validation.data;

    const id = `BOR-${Date.now()}`;
    const createdAt = new Date().toISOString();
    const updatedAt = new Date().toISOString();
    const checkinDate = null;

    const query = `
      INSERT INTO asset_borrowing (
        id, "assetId", "borrowerId", "checkoutDate", "dueDate", "checkinDate", status, purpose, notes,
        "createdAt", "updatedAt"
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *;
    `;
    const queryParams = [
      id, assetId, borrowerId, checkoutDate, dueDate, checkinDate, status, purpose, notes,
      createdAt, updatedAt
    ];
    
    const result = await pool.query(query, queryParams);

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