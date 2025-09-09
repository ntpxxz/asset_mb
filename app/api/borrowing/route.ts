
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { z } from 'zod';

const borrowingSchema = z.object({
  asset_id: z.string().min(1, "Asset ID is required"),
  borrowername: z.string().min(1, "Borrower is required"),      
  borrowercontact: z.string().optional(),                       
  checkout_date: z.string(),
  due_date: z.string().optional(),
  status: z.string().optional().default('checked-out'),         
  location: z.string().optional(),
  purpose: z.string().optional(),
  notes: z.string().optional(),
});

// GET /api/borrowing - Get all borrow records
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const user_id = searchParams.get('user_id');
  const asset_id = searchParams.get('asset_id');

  let query = 'SELECT * FROM asset_borrowing';
  const queryParams: any[] = [];
  const whereClauses: string[] = [];

  if (status && status !== 'all') {
    whereClauses.push(`status = $${queryParams.length + 1}`);
    queryParams.push(status);
  }

  if (user_id) {
    whereClauses.push(`"borrowerId" = $${queryParams.length + 1}`);
    queryParams.push(user_id);
  }
  
  if (asset_id) {
    whereClauses.push(`"asset_id" = $${queryParams.length + 1}`);
    queryParams.push(asset_id);
  }

  if (whereClauses.length > 0) {
    query += ' WHERE ' + whereClauses.join(' AND ');
  }

  query += ' ORDER BY "created_at" DESC';

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
      asset_id, borrowername,borrowercontact, checkout_date, due_date, status, purpose, notes 
    } = validation.data;

    // optional: validate date order
    if (due_date) {
      const d1 = new Date(checkout_date);
      const d2 = new Date(due_date);
      if (isFinite(+d1) && isFinite(+d2) && d2 < d1) {
        return NextResponse.json(
          { success: false, error: 'Due date must be on or after checkout date' },
          { status: 400 }
        );
      }
    }

    const id = `BOR-${Date.now()}`;
    const created_at = new Date().toISOString();
    const updated_at = new Date().toISOString();
    const checkin_date = null;

    // Start transaction
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
// 1) ตรวจ asset และล็อกแถวไว้กันแข่ง (FOR UPDATE)
      const assetRes = await client.query(
        `SELECT id, status, "isloanable"
         FROM assets
         WHERE id = $1
         FOR UPDATE`,
        [asset_id]
      );
      if (assetRes.rowCount === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json({ success: false, error: 'Asset not found' }, { status: 404 });
      }
      const asset = assetRes.rows[0];
      const isActive = String(asset.status).toLowerCase() === 'active';
      if (!isActive || !asset.isLoanable) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { success: false, error: 'Asset is not available for borrowing' },
          { status: 400 }
        );
      }

      // 2) กันยืมซ้ำ (เช็คเรคคอร์ดที่ยัง checked-out)
      const dup = await client.query(
        `SELECT 1
         FROM asset_borrowing
         WHERE "assetId" = $1 AND status = 'checked-out'
         LIMIT 1`,
        [asset_id]
      );
      if (dup.rowCount > 0) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { success: false, error: 'This asset is already checked out' },
          { status: 409 }
        );
      }

      // Insert borrow record
      const borrowQuery = `
        INSERT INTO asset_borrowing (
          id, "asset_id", borrowername, borrowercontact, "checkout_date", "due_date", "checkin_date", status, purpose, notes,
          "created_at", "updated_at"
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *;
      `;
      const borrowParams = [
        id, asset_id,borrowername, borrowercontact, checkout_date, due_date, checkin_date, status, purpose, notes,
        created_at, updated_at
      ];
      
      const borrowResult = await client.query(borrowQuery, borrowParams);

      await client.query('COMMIT');

      return NextResponse.json({
        success: true,
        data: borrowResult.rows[0],
        message: 'Asset checked out successfully'
      }, { status: 201 });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Failed to checkout asset:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to checkout asset' },
      { status: 500 }
    );
  }
}

// PUT /api/borrowing - Update borrow record (check-in)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, action } = body;

    if (action === 'checkin') {
      const checkinDate = new Date().toISOString();
      const updatedAt = new Date().toISOString();

      // Start transaction
      const client = await pool.connect();
      
      try {
        await client.query('BEGIN');

        // Get the borrow record to find assetId
        const getBorrowQuery = `
          SELECT "assetId" FROM asset_borrowing WHERE id = $1
        `;
        const borrowResult = await client.query(getBorrowQuery, [id]);
        
        if (borrowResult.rows.length === 0) {
          throw new Error('Borrow record not found');
        }

        const assetId = borrowResult.rows[0].assetId;

        // Update borrow record
        const updateBorrowQuery = `
          UPDATE asset_borrowing 
          SET status = 'returned', "checkin_date" = $1, "updated_at" = $2 
          WHERE id = $3
          RETURNING *;
        `;
        const updateResult = await client.query(updateBorrowQuery, [checkin_date, updated_at, id]);

     
        await client.query(updatedAt, assetId);

        await client.query('COMMIT');

        return NextResponse.json({
          success: true,
          data: updateResult.rows[0],
          message: 'Asset checked in successfully'
        });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Failed to update borrow record:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update borrow record' },
      { status: 500 }
    );
  }
}