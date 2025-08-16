import { NextRequest, NextResponse } from 'next/server';
import * as softwareService from '@/lib/services/softwareService';
import { z } from 'zod';

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

// GET /api/software/[id] - Get single software license
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const result = await softwareService.getSoftwareById(id);
    
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
    console.error(`Failed to fetch software license ${params.id}:`, error);
    return NextResponse.json(
      { success: false, error: `Failed to fetch software license ${params.id}` },
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

    const result = await softwareService.updateSoftware(id, validation.data);

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
  } catch (error) {
    console.error(`Failed to update software license ${params.id}:`, error);
    if (error.code === '23505') { // unique_violation
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
    const result = await softwareService.deleteSoftware(id);
    
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