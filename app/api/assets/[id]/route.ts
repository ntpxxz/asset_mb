import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { z } from 'zod';

// Zod schema for validation (all fields optional for updates, with null support)
const assetUpdateSchema = z.object({
  asset_tag: z.string().min(1, "Asset tag is required").optional().nullable(),
  type: z.string().optional().nullable(),
  manufacturer: z.string().optional().nullable(),
  model: z.string().optional().nullable(),
  serialnumber: z.string().min(1, "Serial number is required").optional().nullable(),
  purchasedate: z.string().optional().nullable(),
  purchaseprice: z.union([z.number(), z.string()]).optional().nullable().transform((val) => {
    if (val === null || val === undefined || val === '') return null;
    return typeof val === 'string' ? parseFloat(val) : val;
  }),
  supplier: z.string().optional().nullable(),
  warrantyexpiry: z.string().optional().nullable(),
  assigneduser: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  department: z.string().optional().nullable(),
  status: z.string().optional().nullable(),
  operatingsystem: z.string().optional().nullable(),
  processor: z.string().optional().nullable(),
  memory: z.string().optional().nullable(),
  storage: z.string().optional().nullable(),
  hostname: z.string().optional().nullable(),
  ipaddress: z.string().optional().nullable(),
  macaddress: z.string().optional().nullable(),
  patchstatus: z.string().optional().nullable(),
  lastpatch_check: z.string().optional().nullable(),
  isLoanable: z.boolean().optional().nullable(),
  condition: z.enum(['new','good','fair','poor','broken']).optional().nullable(),
  description: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
}).partial();

// Helper function to clean data - remove null/empty values and convert empty strings to null
function cleanUpdateData(data: any) {
  const cleaned: any = {};
  
  Object.entries(data).forEach(([key, value]) => {
    // Skip undefined values
    if (value === undefined) return;
    
    // Convert empty strings to null for optional fields
    if (value === '') {
      cleaned[key] = null;
    } else {
      cleaned[key] = value;
    }
  });
  
  return cleaned;
}

// GET /api/assets/[id] - Get single asset
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await pool.query('SELECT * FROM assets WHERE id = $1', [id]);
    
    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Asset not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error(`Failed to fetch asset:`, error);
    return NextResponse.json(
      { success: false, error: `Failed to fetch asset` },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const assetId = params.id;
    const body = await request.json();

    // Get the keys from the request body to build the SET clauses
    const updateFields = Object.keys(body);
    if (updateFields.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    // Dynamically create the "col = $1, col2 = $2" part of the query
    // This makes the query adaptable to any fields passed in the request
    const setClauses = updateFields
      .map((key, index) => `"${key}" = $${index + 1}`)
      .join(', ');

    // Create the array of values to be safely passed to the query
    // The order of values must match the order of the columns in setClauses
    const queryParams = Object.values(body);

    // --- FIX IS HERE ---
    // 1. The asset ID from the URL must be added to the parameters array.
    queryParams.push(assetId);

    // 2. The WHERE clause needs to use a placeholder ($) that corresponds to the
    //    position of the asset ID in the queryParams array.
    //    We use queryParams.length because the assetId was just pushed,
    //    making it the last item.
    const query = `
      UPDATE assets 
      SET ${setClauses} 
      WHERE id = $${queryParams.length} 
      RETURNING *;
    `;

    console.log('Executing Query:', query);
    console.log('With Parameters:', queryParams);

    // Pass the complete query and all parameters to the pool
    const result = await pool.query(query, queryParams);

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    // Return the updated asset data
    return NextResponse.json(result.rows[0], { status: 200 });

  } catch (error: any) {
    console.error('Failed to update asset:', error);
    // Return a more detailed error message in the response for debugging
    return NextResponse.json(
      { 
        message: 'Failed to update asset', 
        error: error.message, // Send back the actual db error message
        code: error.code,     // and code for better context.
        hint: error.hint
      }, 
      { status: 500 }
    );
  }
}

// DELETE /api/assets/[id] - Delete asset with related records
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const client = await pool.connect();
  
  try {
    const { id } = await params;
    
    // Start transaction
    await client.query('BEGIN');
    
    // First check if asset exists
    const checkResult = await client.query('SELECT * FROM assets WHERE id = $1', [id]);
    
    if (checkResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json(
        { success: false, error: 'Asset not found' },
        { status: 404 }
      );
    }
    
    // Delete related records first (adjust table names based on your schema)
    // Delete loan records
    await client.query('DELETE FROM asset_loans WHERE asset_id = $1', [id]);
    
    // Delete maintenance records
    await client.query('DELETE FROM asset_maintenance WHERE asset_id = $1', [id]);
    
    // Delete any other related records
    // await client.query('DELETE FROM asset_history WHERE asset_id = $1', [id]);
    
    // Finally delete the asset
    const result = await client.query('DELETE FROM assets WHERE id = $1 RETURNING *;', [id]);
    
    // Commit transaction
    await client.query('COMMIT');
    
    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: 'Asset and all related records deleted successfully'
    });
    
  } catch (error: any) {
    // Rollback transaction on error
    await client.query('ROLLBACK');
    console.error(`Failed to delete asset:`, error);
    
    // Check for PostgreSQL foreign key constraint violation
    if (error && typeof error === 'object' && 'code' in error) {
      if (error.code === '23503') {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Cannot delete asset because it has related records that cannot be automatically removed. Please contact administrator.' 
          },
          { status: 409 }
        );
      }
    }
    
    return NextResponse.json(
      { success: false, error: `Failed to delete asset: ${error.message || 'Unknown error'}` },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}