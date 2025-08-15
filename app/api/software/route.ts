import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { z } from 'zod';

const softwareSchema = z.object({
  softwareName: z.string().min(1, "Software name is required"),
  publisher: z.string().optional(),
  version: z.string().optional(),
  licenseKey: z.string().min(1, "License key is required"),
  licenseType: z.string().optional(),
  purchaseDate: z.string().optional(),
  expiryDate: z.string().optional(),
  licensesTotal: z.coerce.number().int().optional(),
  licensesAssigned: z.coerce.number().int().optional(),
  category: z.string().optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
  status: z.string(),
});


// GET /api/software - Get all software licenses
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search');
  const status = searchParams.get('status');
  const type = searchParams.get('type');

  let query = 'SELECT * FROM software';
  const queryParams: any[] = [];
  const whereClauses: string[] = [];

  if (search) {
    whereClauses.push(`("softwareName" ILIKE $${queryParams.length + 1} OR publisher ILIKE $${queryParams.length + 1})`);
    queryParams.push(`%${search}%`);
  }

  if (status && status !== 'all') {
    whereClauses.push(`status = $${queryParams.length + 1}`);
    queryParams.push(status);
  }

  if (type && type !== 'all') {
    whereClauses.push(`"licenseType" = $${queryParams.length + 1}`);
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
    console.error('Failed to fetch software licenses:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch software licenses' },
      { status: 500 }
    );
  }
}

// POST /api/software - Create new software license
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = softwareSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: validation.error.flatten() },
        { status: 400 }
      );
    }
    
    const { 
      softwareName, publisher, version, licenseKey, licenseType, purchaseDate, 
      expiryDate, licensesTotal, licensesAssigned, category, description, notes, status 
    } = validation.data;

    const id = `SW-${Date.now()}`;
    const createdAt = new Date().toISOString();
    const updatedAt = new Date().toISOString();

    const query = `
      INSERT INTO software (
        id, "softwareName", publisher, version, "licenseKey", "licenseType", "purchaseDate",
        "expiryDate", "licensesTotal", "licensesAssigned", category, description, notes, status,
        "createdAt", "updatedAt"
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *;
    `;
    const queryParams = [
      id, softwareName, publisher, version, licenseKey, licenseType, purchaseDate,
      expiryDate, licensesTotal, licensesAssigned, category, description, notes, status,
      createdAt, updatedAt
    ];
    
    const result = await pool.query(query, queryParams);

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: 'Software license created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Failed to create software license:', error);
    if (error.code === '23505') { // unique_violation
        return NextResponse.json(
            { success: false, error: 'Software with this license key already exists.' },
            { status: 409 }
        );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to create software license' },
      { status: 500 }
    );
  }
}