import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { z } from 'zod';

const borrowingSchema = z.object({
  asset_id: z.string().min(1, "Asset ID is required"),
  borrowername: z.string().min(1, "Borrower name is required"),      
  borrowercontact: z.string().optional(),                       
  checkout_date: z.string(),
  due_date: z.string().optional(),
  status: z.string().optional().default('checked_out'),         
  purpose: z.string().optional(),
  notes: z.string().optional(),
});

const checkinSchema = z.object({
  id: z.string().min(1, "Borrowing ID is required"),
  action: z.literal('checkin'),
  condition: z.string().optional(),
  damage_reported: z.boolean().optional().default(false),
  damage_description: z.string().optional(),
  maintenance_required: z.boolean().optional().default(false),
  maintenance_notes: z.string().optional(),
  returned_by_name: z.string().optional(),
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
    whereClauses.push(`asset_id = $${queryParams.length + 1}`);
    queryParams.push(asset_id);
  }

  if (whereClauses.length > 0) {
    query += ' WHERE ' + whereClauses.join(' AND ');
  }

  query += ' ORDER BY created_at DESC';

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
      asset_id, borrowername, borrowercontact, checkout_date, due_date, status, purpose, notes 
    } = validation.data;

    // Validate date order
    if (due_date) {
      const checkoutDateObj = new Date(checkout_date);
      const dueDateObj = new Date(due_date);
      if (isFinite(+checkoutDateObj) && isFinite(+dueDateObj) && dueDateObj < checkoutDateObj) {
        return NextResponse.json(
          { success: false, error: 'Due date must be on or after checkout date' },
          { status: 400 }
        );
      }
    }

    const id = `BOR-${Date.now()}`;
    const created_at = new Date().toISOString();
    const updated_at = new Date().toISOString();

    // Start transaction
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // 1) Check if asset exists and is available for borrowing
      const assetRes = await client.query(
        `SELECT id, status, isloanable
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
      if (!isActive || !asset.isloanable) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { success: false, error: 'Asset is not available for borrowing' },
          { status: 400 }
        );
      }

      // 2) Check if asset is already checked out
      const existingBorrow = await client.query(
        `SELECT id
         FROM asset_borrowing
         WHERE asset_id = $1 AND status = 'checked_out'
         LIMIT 1`,
        [asset_id]
      );
      
      if (existingBorrow.rows.length > 0) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { success: false, error: 'This asset is already checked out' },
          { status: 409 }
        );
      }

      // Insert borrow record with all columns
      const borrowQuery = `
        INSERT INTO asset_borrowing (
          id, asset_id, checkout_date, due_date, checkin_date, status, 
          purpose, notes, created_at, updated_at, borrowername, borrowercontact,
          condition, damage_reported, damage_description, maintenance_required, 
          maintenance_notes, returned_by_name
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
        RETURNING *;
      `;
      
      const borrowParams = [
        id, asset_id, checkout_date, due_date, null, // checkin_date is null for new checkout
        status, purpose, notes, created_at, updated_at, borrowername, borrowercontact,
        null, // condition - will be set on return
        false, // damage_reported - default false
        null, // damage_description
        false, // maintenance_required - default false
        null, // maintenance_notes
        null  // returned_by_name - will be set on return
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
    const validation = checkinSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { 
      id, action, condition, damage_reported, damage_description, 
      maintenance_required, maintenance_notes, returned_by_name 
    } = validation.data;

    if (action === 'checkin') {
      const checkin_date = new Date().toISOString();
      const updated_at = new Date().toISOString();

      // Start transaction
      const client = await pool.connect();
      
      try {
        await client.query('BEGIN');

        // Get the borrow record
        const getBorrowQuery = `
          SELECT asset_id, status FROM asset_borrowing WHERE id = $1
        `;
        const borrowResult = await client.query(getBorrowQuery, [id]);
        
        if (borrowResult.rows.length === 0) {
          await client.query('ROLLBACK');
          return NextResponse.json(
            { success: false, error: 'Borrow record not found' },
            { status: 404 }
          );
        }

        const borrowRecord = borrowResult.rows[0];
        
        // Check if already returned
        if (borrowRecord.status === 'returned') {
          await client.query('ROLLBACK');
          return NextResponse.json(
            { success: false, error: 'Asset is already returned' },
            { status: 400 }
          );
        }

        // Update borrow record with all return information
        const updateBorrowQuery = `
          UPDATE asset_borrowing 
          SET 
            status = 'returned', 
            checkin_date = $1, 
            updated_at = $2,
            condition = $3,
            damage_reported = $4,
            damage_description = $5,
            maintenance_required = $6,
            maintenance_notes = $7,
            returned_by_name = $8
          WHERE id = $9
          RETURNING *;
        `;
        
        const updateParams = [
          checkin_date, updated_at, condition, damage_reported, 
          damage_description, maintenance_required, maintenance_notes, 
          returned_by_name, id
        ];
        
        const updateResult = await client.query(updateBorrowQuery, updateParams);

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