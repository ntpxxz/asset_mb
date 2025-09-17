import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { z } from 'zod';

// Zod schema for asset creation validation
const assetCreateSchema = z.object({
  asset_tag: z.string().min(1, "Asset tag is required"),
  type: z.string().min(1, "Asset type is required"),
  manufacturer: z.string().min(1, "Manufacturer is required"),
  model: z.string().min(1, "Model is required"),
  serialnumber: z.string().min(1, "Serial number is required"),
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
  status: z.string().default('in-stock'),
  operatingsystem: z.string().optional().nullable(),
  processor: z.string().optional().nullable(),
  memory: z.string().optional().nullable(),
  storage: z.string().optional().nullable(),
  hostname: z.string().optional().nullable(),
  ipaddress: z.string().optional().nullable(),
  macaddress: z.string().optional().nullable(),
  patchstatus: z.string().default('needs-review'),
  lastpatch_check: z.string().optional().nullable(),
  isloanable: z.boolean().default(false),
  condition: z.enum(['new','good','fair','poor','broken']).default('good'),
  description: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

// Helper function to clean data
function cleanCreateData(data: any) {
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

// GET /api/assets - Get all assets
export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/assets - Loading all assets');
    
    // Parse query parameters for filtering/pagination
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    
    let query = 'SELECT * FROM assets';
    const queryParams: any[] = [];
    const conditions: string[] = [];
    
    // Add filters if provided
    if (status) {
      conditions.push(`status = $${queryParams.length + 1}`);
      queryParams.push(status);
    }
    
    if (type) {
      conditions.push(`type = $${queryParams.length + 1}`);
      queryParams.push(type);
    }
    
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    // Add ordering
    query += ' ORDER BY created_at DESC';
    
    // Add pagination if provided
    if (limit) {
      query += ` LIMIT $${queryParams.length + 1}`;
      queryParams.push(parseInt(limit));
    }
    
    if (offset) {
      query += ` OFFSET $${queryParams.length + 1}`;
      queryParams.push(parseInt(offset));
    }
    
    console.log('Executing query:', query);
    console.log('With parameters:', queryParams);
    
    const result = await pool.query(query, queryParams);
    console.log('Database query result:', { rowCount: result.rowCount });
    
    return NextResponse.json({
      success: true,
      data: result.rows,
      count: result.rowCount,
      message: `Loaded ${result.rowCount} assets`
    });
  } catch (error: any) {
    console.error('Failed to fetch assets:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch assets',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// POST /api/assets - Create new asset
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const sanitize = (v: any) => (v === undefined || v === null || v === '' || v === '-' ? null : v);
    const data = {
      assignedUser: sanitize(body.assigneduser), 
      location: sanitize(body.location),
      department: sanitize(body.department),
    };


    console.log('POST /api/assets - Received data:', body);

    // Auto-generate asset_tag if not provided
    if (!body.asset_tag || body.asset_tag.trim() === '') {
      body.asset_tag = `AST-${Date.now()}`;
    }

    // Validate the request data
    const validationResult = assetCreateSchema.safeParse(body);
    
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }));
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Validation failed',
          details: errors
        },
        { status: 400 }
      );
    }

    const cleanedData = cleanCreateData(validationResult.data);
    
    // Field mapping to ensure consistency with database column names
    const fieldMapping = {
      'asset_tag': 'asset_tag',
      'type': 'type', 
      'manufacturer': 'manufacturer',
      'model': 'model',
      'serialnumber': 'serialnumber',
      'purchasedate': 'purchasedate',
      'purchaseprice': 'purchaseprice',
      'supplier': 'supplier',
      'warrantyexpiry': 'warrantyexpiry',
      'assigneduser': 'assigneduser',
      'location': 'location',
      'department': 'department',
      'status': 'status',
      'condition': 'condition',
      'operatingsystem': 'operatingsystem',
      'processor': 'processor',
      'memory': 'memory',
      'storage': 'storage',
      'hostname': 'hostname',
      'ipaddress': 'ipaddress',
      'macaddress': 'macaddress',
      'patchstatus': 'patchstatus',
      'lastpatch_check': 'lastpatch_check',
      'isloanable': 'isloanable',
      'description': 'description',
      'notes': 'notes',
    };

    // Map frontend field names to database column names
    const mappedData: any = {};
    Object.entries(cleanedData).forEach(([key, value]) => {
      const dbColumn = fieldMapping[key as keyof typeof fieldMapping];
      if (dbColumn && value !== undefined) {
        mappedData[dbColumn] = value;
      }
    });

    const insertFields = Object.keys(mappedData);
    const insertValues = Object.values(mappedData);
    
    if (insertFields.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid fields to insert' },
        { status: 400 }
      );
    }

    // Build dynamic INSERT query
    const placeholders = insertFields.map((_, index) => `$${index + 1}`).join(', ');
    const columns = insertFields.join(', ');
    
    const query = `
      INSERT INTO assets (${columns}, created_at, updated_at) 
      VALUES (${placeholders}, NOW(), NOW()) 
      RETURNING *;
    `;

    console.log('Executing Insert Query:', query);
    console.log('With Parameters:', insertValues);

    const result = await pool.query(query, insertValues);

    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Insert failed' },
        { status: 500 }
      );
    }

    const newAsset = result.rows[0];
    console.log('Successfully created asset:', { id: newAsset.id, asset_tag: newAsset.asset_tag });

    return NextResponse.json({
      success: true,
      data: newAsset,
      message: `Asset "${newAsset.asset_tag}" created successfully`,
      timestamp: new Date().toISOString()
    }, { status: 201 });

  } catch (error: any) {
    console.error('Failed to create asset:', error);
    
    // Handle PostgreSQL specific errors
    if (error.code === '42703') { // undefined_column
      return NextResponse.json(
        { 
          success: false,
          error: `Database column not found: ${error.message}`,
          hint: 'Please check if column names match your database schema'
        }, 
        { status: 400 }
      );
    }
    
    if (error.code === '23505') { // unique_violation
      return NextResponse.json(
        { 
          success: false,
          error: 'Duplicate value detected. Asset tag or serial number may already exist.'
        }, 
        { status: 409 }
      );
    }

    if (error.code === '23502') { // not_null_violation
      return NextResponse.json(
        { 
          success: false,
          error: `Required field is missing: ${error.column || 'unknown'}`
        }, 
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to create asset',
        details: error.message
      }, 
      { status: 500 }
    );
  }
}