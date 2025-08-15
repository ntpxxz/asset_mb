import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { z } from 'zod';

// Zod schema for validation (all fields optional for updates)
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
    const result = await pool.query('SELECT * FROM asset_borrowing WHERE id = $1', [id]);
    
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
    
    const fields: { [key: string]: any } = validation.data;
    if (Object.keys(fields).length === 0 && !body.action) {
        return NextResponse.json(
            { success: false, error: 'No fields to update' },
            { status: 400 }
        );
    }

    // Special logic for check-in
    if (body.action === 'checkin') {
        fields.checkinDate = new Date().toISOString().split('T')[0];
        fields.status = 'returned';
    }
    delete fields.action; // Don't try to update a column named 'action'


    fields.updatedAt = new Date().toISOString();

    const setClauses = Object.keys(fields).map((key, index) => `"${key}" = $${index + 1}`).join(', ');
    const queryParams = Object.values(fields);
    queryParams.push(id);
    
    const query = `UPDATE asset_borrowing SET ${setClauses} WHERE id = $${queryParams.length} RETURNING *;`;
    
    const result = await pool.query(query, queryParams);

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
    const result = await pool.query('DELETE FROM asset_borrowing WHERE id = $1 RETURNING *;', [id]);
    
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