import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { z } from 'zod';

// Zod schema for validation (all fields optional for updates)
const softwareUpdateSchema = z.object({
  softwareName: z.string().min(1, "Software name is required").optional(),
  publisher: z.string().optional(),
  version: z.string().optional(),
  licenseKey: z.string().min(1, "License key is required").optional(),
  licenseType: z.string().optional(),
  purchaseDate: z.string().optional(),
  expiryDate: z.string().optional(),
  licensesTotal: z.coerce.number().int().optional(),
  licensesAssigned: z.coerce.number().int().optional(),
  category: z.string().optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
  status: z.string().optional(),
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

//

// GET /api/software/[id] - Get single software license
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } =  await params;
    const result = await pool.query('SELECT * FROM software WHERE id = $1', [id]);
    
    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Software license not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error(`Failed to fetch software license:`, error);
    return NextResponse.json(
      { success: false, error: `Failed to fetch software license ` },
      { status: 500 }
    );
  }
}

// PUT /api/software/[id] - Update software license
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const validation = softwareUpdateSchema.safeParse(body);

    if (!validation.success) {
        return NextResponse.json(
            { success: false, error: 'Invalid input', details: validation.error.flatten() },
            { status: 400 }
        );
    }
    
    const fields: { [key: string]: any } = validation.data;
    if (Object.keys(fields).length === 0) {
        return NextResponse.json(
            { success: false, error: 'No fields to update' },
            { status: 400 }
        );
    }

    fields.updatedAt = new Date().toISOString();

    const setClauses = Object.keys(fields).map((key, index) => `"${key}" = $${index + 1}`).join(', ');
    const queryParams = Object.values(fields);
    queryParams.push(id);
    
    const query = `UPDATE software SET ${setClauses} WHERE id = $${queryParams.length} RETURNING *;`;
    
    const result = await pool.query(query, queryParams);

    if (result.rowCount === 0) {
        return NextResponse.json(
            { success: false, error: 'Software license not found' },
            { status: 404 }
        );
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: 'Software license updated successfully'
    });
  } catch (error:unknown) {
    console.error(`Failed to update software license ${params.id}:`, error);
    if (error) { // unique_violation
        return NextResponse.json(
            { success: false, error: 'Software with this license key already exists.' },
            { status: 409 }
        );
    }
    return NextResponse.json(
      { success: false, error: `Failed to update software license ${params.id}` },
      { status: 500 }
    );
  }
}

// DELETE /api/software/[id] - Delete software license
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const result = await pool.query('DELETE FROM software WHERE id = $1 RETURNING *;', [id]);
    
    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Software license not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: 'Software license deleted successfully'
    });
  } catch (error) {
    console.error(`Failed to delete software license ${params.id}:`, error);
    return NextResponse.json(
      { success: false, error: `Failed to delete software license ${params.id}` },
      { status: 500 }
    );
  }
}