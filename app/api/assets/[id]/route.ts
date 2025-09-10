import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { z } from 'zod';

// Zod schema for updates
const assetUpdateSchema = z.object({
  asset_tag: z.string().min(1, "Asset tag cannot be empty").optional(),
  type: z.enum(['laptop','desktop','monitor','printer','phone','tablet','server','router','switch','firewall','storage','projector','camera','other']).optional(),
  manufacturer: z.string().min(1, "Manufacturer cannot be empty").optional(),
  model: z.string().min(1, "Model cannot be empty").optional(),
  serialnumber: z.string().min(1, "Serial number cannot be empty").optional(),
  purchasedate: z.string().nullable().optional(),
  purchaseprice: z.union([z.number(), z.string()]).nullable().optional().transform((val) => {
    if (val === null || val === undefined || val === '') return null;
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return isNaN(num) ? null : num;
  }),
  supplier: z.string().nullable().optional(),
  warrantyexpiry: z.string().nullable().optional(),
  assigneduser: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  department: z.string().nullable().optional(),
  status: z.enum(['in-stock','in-use','under-repair','retired']).optional(),
  operatingsystem: z.string().nullable().optional(),
  processor: z.string().nullable().optional(),
  memory: z.string().nullable().optional(),
  storage: z.string().nullable().optional(),
  hostname: z.string().nullable().optional(),
  ipaddress: z.string().nullable().optional(),
  macaddress: z.string().nullable().optional(),
  patchstatus: z.enum(['up-to-date','needs-review','update-pending']).optional(),
  lastpatch_check: z.string().nullable().optional(),
  isloanable: z.boolean().optional(),
  condition: z.enum(['new','good','fair','poor','broken']).optional(),
  description: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
}).strict();

// Helper function to validate asset ID
function validateAssetId(id: string): boolean {
  // More permissive validation - allows alphanumeric, underscore, dash
  // This supports IDs like: "asset001", "AST-123", "uuid-format", "123", etc.
  return /^[a-zA-Z0-9_-]+$/.test(id) && id.length > 0 && id.length <= 100;
}

// Helper function to clean data
function cleanUpdateData(data: any) {
  const cleaned: any = {};
  
  Object.entries(data).forEach(([key, value]) => {
    if (value === undefined) return;
    
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
    console.log('GET /api/assets/[id] - Loading asset with ID:', id);
    
    // Validate ID format
    if (!validateAssetId(id)) {
      console.log('Invalid asset ID format:', id);
      return NextResponse.json(
        { success: false, error: 'Invalid asset ID format' },
        { status: 400 }
      );
    }

    // Try different ID fields in case database uses different column names
    // First try primary key 'id'
    let result = await pool.query('SELECT * FROM assets WHERE id = $1', [id]);
    
    // If no result, try asset_tag field
    if (result.rowCount === 0) {
      result = await pool.query('SELECT * FROM assets WHERE asset_tag = $1', [id]);
    }
    
    // If still no result, try other potential ID fields
    if (result.rowCount === 0) {
      result = await pool.query(`
        SELECT * FROM assets 
        WHERE id::text = $1 OR asset_tag = $1 OR serialnumber = $1
        LIMIT 1
      `, [id]);
    }
    
    console.log('Database query result:', { rowCount: result.rowCount });
    
    if (result.rowCount === 0) {
      console.log('Asset not found in database:', id);
      return NextResponse.json(
        { success: false, error: 'Asset not found' },
        { status: 404 }
      );
    }

    const asset = result.rows[0];
    console.log('Successfully loaded asset:', { id: asset.id, asset_tag: asset.asset_tag });

    return NextResponse.json({
      success: true,
      data: asset,
      message: `Asset ${asset.asset_tag} loaded successfully`
    });
  } catch (error: any) {
    console.error('Failed to fetch asset:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch asset',
        details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

// PUT /api/assets/[id] - Update asset
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: assetId } = await params;
    
    // Validate ID format
    if (!validateAssetId(assetId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid asset ID format' },
        { status: 400 }
      );
    }

    const body = await request.json();
    console.log('PUT /api/assets/[id] - Received update data:', body);

    // Validate request body
    const validationResult = assetUpdateSchema.safeParse(body);
    
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code
      }));
      
      console.log('Validation errors:', errors);
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Validation failed',
          details: errors
        },
        { status: 400 }
      );
    }

    const cleanedData = cleanUpdateData(validationResult.data);
    
    if (Object.keys(cleanedData).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    // Find the asset using flexible search
    let existsResult = await pool.query('SELECT id, asset_tag FROM assets WHERE id = $1', [assetId]);
    
    if (existsResult.rowCount === 0) {
      // Try alternative search methods
      existsResult = await pool.query('SELECT id, asset_tag FROM assets WHERE asset_tag = $1', [assetId]);
    }
    
    if (existsResult.rowCount === 0) {
      existsResult = await pool.query(`
        SELECT id, asset_tag FROM assets 
        WHERE id::text = $1 OR asset_tag = $1 OR serialnumber = $1
        LIMIT 1
      `, [assetId]);
    }
    
    if (existsResult.rowCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Asset not found' },
        { status: 404 }
      );
    }

    const realAssetId = existsResult.rows[0].id; // Use the actual database ID

    // Check for duplicates if updating unique fields
    if (cleanedData.asset_tag || cleanedData.serialnumber) {
      let duplicateQuery = 'SELECT id, asset_tag, serialnumber FROM assets WHERE id != $1 AND (';
      const duplicateParams = [realAssetId];
      const conditions = [];
      
      if (cleanedData.asset_tag) {
        conditions.push(`asset_tag = $${duplicateParams.length + 1}`);
        duplicateParams.push(cleanedData.asset_tag);
      }
      
      if (cleanedData.serialnumber) {
        conditions.push(`serialnumber = $${duplicateParams.length + 1}`);
        duplicateParams.push(cleanedData.serialnumber);
      }
      
      duplicateQuery += conditions.join(' OR ') + ')';
      
      const duplicateResult = await pool.query(duplicateQuery, duplicateParams);
      if (duplicateResult.rowCount > 0) {
        const duplicate = duplicateResult.rows[0];
        return NextResponse.json(
          { 
            success: false,
            error: `Duplicate value detected. Asset tag "${duplicate.asset_tag}" or serial number already exists.`
          }, 
          { status: 409 }
        );
      }
    }

    // Build dynamic update query
    const updateFields = Object.keys(cleanedData);
    const setClauses = updateFields.map((field, index) => `${field} = $${index + 1}`);
    const queryParams = Object.values(cleanedData);
    queryParams.push(realAssetId);

    const query = `
      UPDATE assets 
      SET ${setClauses.join(', ')}, updated_at = NOW()
      WHERE id = $${queryParams.length} 
      RETURNING *;
    `;

    console.log('Executing Update Query:', query);
    console.log('With Parameters:', queryParams);

    const result = await pool.query(query, queryParams);

    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Update failed - no rows affected' },
        { status: 500 }
      );
    }

    const updatedAsset = result.rows[0];
    console.log('Successfully updated asset:', { 
      id: updatedAsset.id, 
      asset_tag: updatedAsset.asset_tag,
      fieldsUpdated: updateFields
    });

    return NextResponse.json({
      success: true,
      data: updatedAsset,
      message: `Asset "${updatedAsset.asset_tag}" updated successfully`,
      fieldsUpdated: updateFields,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Failed to update asset:', error);
    
    // Handle specific PostgreSQL errors
    if (error.code === '42703') {
      return NextResponse.json(
        { 
          success: false,
          error: 'Database schema error',
          details: process.env.NODE_ENV === 'development' ? `Column not found: ${error.message}` : 'Invalid field'
        }, 
        { status: 400 }
      );
    }
    
    if (error.code === '23505') {
      const constraintMatch = error.detail?.match(/Key \(([^)]+)\)=/);
      const field = constraintMatch ? constraintMatch[1] : 'field';
      
      return NextResponse.json(
        { 
          success: false,
          error: `Duplicate ${field} detected. This value already exists.`
        }, 
        { status: 409 }
      );
    }

    if (error.code === '23502') {
      return NextResponse.json(
        { 
          success: false,
          error: `Required field "${error.column}" cannot be null.`
        }, 
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to update asset',
        details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      }, 
      { status: 500 }
    );
  }
}

// DELETE /api/assets/[id] - Delete asset
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const client = await pool.connect();
  
  try {
    const { id } = await params;
    console.log('DELETE /api/assets/[id] - Deleting asset with ID:', id);
    
    // Validate ID format
    if (!validateAssetId(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid asset ID format' },
        { status: 400 }
      );
    }
    
    // Start transaction
    await client.query('BEGIN');
    
    // Find the asset using flexible search
    let checkResult = await client.query('SELECT * FROM assets WHERE id = $1', [id]);
    
    if (checkResult.rowCount === 0) {
      checkResult = await client.query('SELECT * FROM assets WHERE asset_tag = $1', [id]);
    }
    
    if (checkResult.rowCount === 0) {
      checkResult = await client.query(`
        SELECT * FROM assets 
        WHERE id::text = $1 OR asset_tag = $1 OR serialnumber = $1
        LIMIT 1
      `, [id]);
    }
    
    if (checkResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json(
        { success: false, error: 'Asset not found' },
        { status: 404 }
      );
    }
    
    const asset = checkResult.rows[0];
    const realAssetId = asset.id;
    
    // Delete related records in the correct order
    const relatedTables = [
      'asset_loans',
      'asset_maintenance', 
      'asset_history',
      'asset_assignments'
    ];
    
    for (const table of relatedTables) {
      try {
        const deleteResult = await client.query(
          `DELETE FROM ${table} WHERE asset_id = $1`, 
          [realAssetId]
        );
        console.log(`Deleted ${deleteResult.rowCount} records from ${table}`);
      } catch (e: any) {
        console.log(`No ${table} table or records:`, e.message);
      }
    }
    
    // Finally delete the asset
    const result = await client.query('DELETE FROM assets WHERE id = $1 RETURNING *;', [realAssetId]);
    
    // Commit transaction
    await client.query('COMMIT');
    
    console.log('Successfully deleted asset:', { 
      id: asset.id, 
      asset_tag: asset.asset_tag 
    });
    
    return NextResponse.json({
      success: true,
      data: asset,
      message: `Asset "${asset.asset_tag}" and all related records deleted successfully`
    });
    
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Failed to delete asset:', error);
    
    if (error.code === '23503') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Cannot delete asset because it has related records that cannot be automatically removed.',
          hint: 'Check for dependencies in other modules'
        },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete asset',
        details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}