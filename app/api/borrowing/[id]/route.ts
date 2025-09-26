import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { z } from 'zod';

// Updated Zod schema with all fields that frontend sends
const borrowingUpdateSchema = z.object({
  asset_tag: z.string().min(1, "Asset Tag is required").optional(),
  borrower_id: z.string().min(1, "Borrower ID is required").optional(),
  checkout_date: z.string().optional(),
  due_date: z.string().optional(),
  checkin_date: z.string().optional().nullable(),
  status: z.string().optional(),
  purpose: z.string().optional(),
  notes: z.string().optional(),
  action: z.string().optional(),
  // Add missing fields for check-in
  condition: z.string().optional(),
  damage_reported: z.boolean().optional(),
  damage_description: z.string().optional().nullable(),
  maintenance_required: z.boolean().optional(),
  maintenanc_notes: z.string().optional().nullable(),
  returned_byname: z.string().optional(),
}).partial();

const listQuerySchema = z.object({
  id: z.string().optional(),          // ✅ ใช้ id
  status: z.string().optional(),
  limit: z.coerce.number().int().positive().max(500).optional(),
  offset: z.coerce.number().int().nonnegative().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const parsed = listQuerySchema.safeParse({
      id: sp.get("id") ?? undefined,
      status: sp.get("status") ?? undefined,
      limit: sp.get("limit") ?? undefined,
      offset: sp.get("offset") ?? undefined,
    });
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Invalid query", details: parsed.error.flatten() }, { status: 400 });
    }
    const { id, status } = parsed.data;
    const limit = parsed.data.limit ?? 200;
    const offset = parsed.data.offset ?? 0;

    // ----- ดึง 1 รายการด้วย id
    if (id) {
      const sql = `
        SELECT
          ab.*,
          a.name         AS "assetname",
          a.manufacturer AS "assetmanufacturer",
          a.model        AS "assetmodel"
        FROM asset_borrowing ab
        LEFT JOIN assets a ON a."asset_tag" = ab."asset_tag"
        WHERE ab.id = $1
        LIMIT 1;
      `;
      const r = await pool.query(sql, [id]);
      if (r.rowCount === 0) {
        return NextResponse.json({ success: false, error: "Borrow record not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: r.rows[0] });
    }

    // ----- ลิสต์ (ถ้ามี filter status)
    const where: string[] = [];
    const params: any[] = [];
    if (status) {
      where.push(
        `LOWER(REPLACE(REPLACE(ab.status,'_',' '),'-',' ')) = LOWER(REPLACE(REPLACE($${params.length + 1},'_',' '),'-',' '))`
      );
      params.push(status);
    }
    params.push(limit, offset);

    const sql = `
      SELECT ab.*
      FROM asset_borrowing ab
      ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
      ORDER BY ab.created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length};
    `;
    const r = await pool.query(sql, params);
    return NextResponse.json({ success: true, data: r.rows });
  } catch (err) {
    console.error("GET /api/borrowing error:", err);
    return NextResponse.json({ success: false, error: "Failed to fetch borrow records" }, { status: 500 });
  }
}

// PATCH /api/borrowing/[id] - Update borrow record (ADD PATCH METHOD)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params; // Fix: make params async
    const body = await request.json();
    
    console.log('PATCH request body:', body); // Debug log
    
    const validation = borrowingUpdateSchema.safeParse(body);

    if (!validation.success) {
      console.error('Validation failed:', validation.error);
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: validation.error.flatten() },
        { status: 400 }
      );
    }
    
    const fields: { [key: string]: any } = validation.data;
    
    // Remove action field as it's not a database column
    delete fields.action;
    
    if (Object.keys(fields).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No fields to update' },
        { status: 400 }
      );
    }

    // Add timestamp
    fields.updatedAt = new Date().toISOString();

    // Build dynamic query
    const setClauses = Object.keys(fields).map((key, index) => {
      // Handle camelCase to snake_case conversion if needed
      const dbColumn = key === 'checkinDate' ? 'checkin_date' : 
                      key === 'checkoutDate' ? 'checkout_date' :
                      key === 'dueDate' ? 'due_date' :
                      key === 'assetTag' ? 'asset_tag' :
                      key === 'borrowerId' ? 'borrower_id' :
                      key === 'damageReported' ? 'damage_reported' :
                      key === 'damageDescription' ? 'damage_description' :
                      key === 'maintenanceRequired' ? 'maintenance_required' :
                      key === 'maintenanceNotes' ? 'maintenance_notes' :
                      key === 'returnedByName' ? 'returned_by_name' :
                      key === 'updatedAt' ? 'updated_at' :
                      `"${key}"`;
      return `${dbColumn} = $${index + 1}`;
    }).join(', ');
    
    const queryParams = Object.values(fields);
    queryParams.push(id);
    
    const query = `UPDATE asset_borrowing SET ${setClauses} WHERE id = $${queryParams.length} RETURNING *;`;
    
    console.log('Update query:', query); // Debug log
    console.log('Query params:', queryParams); // Debug log
    
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
      message: 'Asset checked in successfully'
    });
  } catch (error) {
    console.error(`Failed to update borrow record ${await params.then(p => p.id)}:`, error);
    
    // More detailed error response
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorDetails = error instanceof Error && 'detail' in error ? error.detail : null;
    
    return NextResponse.json(
      { 
        success: false, 
        error: `Failed to update borrow record: ${errorMessage}`,
        details: errorDetails,
        query: 'Check server logs for query details'
      },
      { status: 500 }
    );
  }
}

// PUT /api/borrowing/[id] - Update borrow record (keep existing for compatibility)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params; // Fix: make params async
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
    delete fields.action;

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
    console.error(`Failed to update borrow record:`, error);
    return NextResponse.json(
      { success: false, error: `Failed to update borrow record` },
      { status: 500 }
    );
  }
}

// DELETE /api/borrowing/[id] - Delete borrow record
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params; // Fix: make params async
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
    console.error(`Failed to delete borrow record:`, error);
    return NextResponse.json(
      { success: false, error: `Failed to delete borrow record` },
      { status: 500 }
    );
  }
}