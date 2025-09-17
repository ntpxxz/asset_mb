import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { z } from 'zod';

const softwareSchema = z.object({
  software_name: z.string().min(1, "Software name is required"),
  publisher: z.string().optional(),
  version: z.string().optional(),
  license_key: z.string().min(1, "License key is required"),
  licenses_type: z.string().optional(),
  purchasedate: z.string().optional(),
  expirydate: z.string().optional(),
  licenses_total: z.coerce.number().int().optional(),
  licenses_assigned: z.coerce.number().int().optional(),
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
    whereClauses.push(`("software_name" ILIKE $${queryParams.length + 1} OR publisher ILIKE $${queryParams.length + 1})`);
    queryParams.push(`%${search}%`);
  }

  if (status && status !== 'all') {
    whereClauses.push(`status = $${queryParams.length + 1}`);
    queryParams.push(status);
  }

  if (type && type !== 'all') {
    whereClauses.push(`"licenses_type" = $${queryParams.length + 1}`);
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
      software_name, publisher, version, license_key, licenses_type, purchasedate, 
      expirydate, licenses_total, licenses_assigned, category, description, notes, status 
    } = validation.data;

    const id = `SW-${Date.now()}`;
    const created_at = new Date().toISOString();
    const updated_at = new Date().toISOString();

    const query = `
      INSERT INTO software (
        id, "software_name", publisher, version, "license_key", "licenses_type", "purchasedate",
        "expirydate", "licenses_total", "licenses_assigned", category, description, notes, status,
        "created_at", "updated_at"
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *;
    `;
    const queryParams = [
      id, software_name, publisher, version, license_key, licenses_type, purchasedate,
      expirydate, licenses_total, licenses_assigned, category, description, notes, status,
      created_at, updated_at
    ];
    
    const result = await pool.query(query, queryParams);

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: 'Software license created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Failed to create software license:', error);
    if (error) { // unique_violation
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