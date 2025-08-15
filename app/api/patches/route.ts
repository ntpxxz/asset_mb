import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { z } from 'zod';

const patchSchema = z.object({
  assetId: z.string().min(1, "Asset ID is required"),
  patchStatus: z.string().optional(),
  lastPatchCheck: z.string().optional(),
  operatingSystem: z.string().optional(),
  vulnerabilities: z.coerce.number().int().optional(),
  pendingUpdates: z.coerce.number().int().optional(),
  criticalUpdates: z.coerce.number().int().optional(),
  securityUpdates: z.coerce.number().int().optional(),
  notes: z.string().optional(),
  nextCheckDate: z.string().optional(),
});


// GET /api/patches - Get all patch records
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const assetId = searchParams.get('assetId');
  const critical = searchParams.get('critical');

  let query = 'SELECT * FROM asset_patches';
  const queryParams: any[] = [];
  const whereClauses: string[] = [];

  if (status && status !== 'all') {
    whereClauses.push(`"patchStatus" = $${queryParams.length + 1}`);
    queryParams.push(status);
  }

  if (assetId) {
    whereClauses.push(`"assetId" = $${queryParams.length + 1}`);
    queryParams.push(assetId);
  }

  if (critical === 'true') {
    whereClauses.push(`"criticalUpdates" > 0`);
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
    console.error('Failed to fetch patch records:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch patch records' },
      { status: 500 }
    );
  }
}

// POST /api/patches - Create new patch record
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = patchSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: validation.error.flatten() },
        { status: 400 }
      );
    }
    
    const { 
      assetId, patchStatus, lastPatchCheck, operatingSystem, vulnerabilities, 
      pendingUpdates, criticalUpdates, securityUpdates, notes, nextCheckDate 
    } = validation.data;

    const id = `PATCH-${Date.now()}`;
    const createdAt = new Date().toISOString();
    const updatedAt = new Date().toISOString();

    const query = `
      INSERT INTO asset_patches (
        id, "assetId", "patchStatus", "lastPatchCheck", "operatingSystem", vulnerabilities,
        "pendingUpdates", "criticalUpdates", "securityUpdates", notes, "nextCheckDate",
        "createdAt", "updatedAt"
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *;
    `;
    const queryParams = [
      id, assetId, patchStatus, lastPatchCheck, operatingSystem, vulnerabilities,
      pendingUpdates, criticalUpdates, securityUpdates, notes, nextCheckDate,
      createdAt, updatedAt
    ];
    
    const result = await pool.query(query, queryParams);

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: 'Patch record created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Failed to create patch record:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create patch record' },
      { status: 500 }
    );
  }
}