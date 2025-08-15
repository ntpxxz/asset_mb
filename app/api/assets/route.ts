import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { z } from 'zod';

const assetSchema = z.object({
  assetTag: z.string().min(1, "Asset tag is required"),
  type: z.string().optional(),
  manufacturer: z.string().optional(),
  model: z.string().optional(),
  serialNumber: z.string().min(1, "Serial number is required"),
  purchaseDate: z.string().optional(),
  purchasePrice: z.coerce.number().optional(),
  supplier: z.string().optional(),
  warrantyExpiry: z.string().optional(),
  assignedUser: z.string().optional().nullable(),
  location: z.string().optional(),
  department: z.string().optional(),
  status: z.string(),
  operatingSystem: z.string().optional(),
  processor: z.string().optional(),
  memory: z.string().optional(),
  storage: z.string().optional(),
  hostname: z.string().optional(),
  ipAddress: z.string().optional(),
  macAddress: z.string().optional(),
  patchStatus: z.string().optional(),
  lastPatchCheck: z.string().optional(),
  isLoanable: z.boolean(),
  condition: z.string().optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
});


// GET /api/assets - Get all assets
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search');
  const status = searchParams.get('status');
  const type = searchParams.get('type');

  let query = 'SELECT * FROM assets';
  const queryParams: any[] = [];
  const whereClauses: string[] = [];

  if (search) {
    whereClauses.push(`("assetTag" ILIKE $${queryParams.length + 1} OR "serialNumber" ILIKE $${queryParams.length + 1} OR manufacturer ILIKE $${queryParams.length + 1} OR model ILIKE $${queryParams.length + 1})`);
    queryParams.push(`%${search}%`);
  }

  if (status && status !== 'all') {
    whereClauses.push(`status = $${queryParams.length + 1}`);
    queryParams.push(status);
  }

  if (type && type !== 'all') {
    whereClauses.push(`type = $${queryParams.length + 1}`);
    queryParams.push(type);
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
    console.error('Failed to fetch assets:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch assets' },
      { status: 500 }
    );
  }
}

// POST /api/assets - Create new asset
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = assetSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: validation.error.flatten() },
        { status: 400 }
      );
    }
    
    const { 
      assetTag, type, manufacturer, model, serialNumber, purchaseDate, purchasePrice,
      supplier, warrantyExpiry, assignedUser, location, department, status,
      operatingSystem, processor, memory, storage, hostname, ipAddress, macAddress,
      patchStatus, lastPatchCheck, isLoanable, condition, description, notes
    } = validation.data;

    const id = `AST-${Date.now()}`;
    const createdAt = new Date().toISOString();
    const updatedAt = new Date().toISOString();

    const query = `
      INSERT INTO assets (
        id, "assetTag", type, manufacturer, model, "serialNumber", "purchaseDate", "purchasePrice",
        supplier, "warrantyExpiry", "assignedUser", location, department, status,
        "operatingSystem", processor, memory, storage, hostname, "ipAddress", "macAddress",
        "patchStatus", "lastPatchCheck", "isLoanable", condition, description, notes,
        "createdAt", "updatedAt"
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
        $21, $22, $23, $24, $25, $26, $27, $28, $29
      )
      RETURNING *;
    `;
    const queryParams = [
      id, assetTag, type, manufacturer, model, serialNumber, purchaseDate, purchasePrice,
      supplier, warrantyExpiry, assignedUser, location, department, status,
      operatingSystem, processor, memory, storage, hostname, ipAddress, macAddress,
      patchStatus, lastPatchCheck, isLoanable, condition, description, notes,
      createdAt, updatedAt
    ];
    
    const result = await pool.query(query, queryParams);

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: 'Asset created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Failed to create asset:', error);
    if (error.code === '23505') { // unique_violation
        return NextResponse.json(
            { success: false, error: 'Asset with this Asset Tag or Serial Number already exists.' },
            { status: 409 }
        );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to create asset' },
      { status: 500 }
    );
  }
}