import { NextRequest, NextResponse } from 'next/server';
import * as assetService from '@/lib/services/assetService';
import { z } from 'zod';

const assetUpdateSchema = z.object({
  assetTag: z.string().min(1, "Asset tag is required").optional(),
  type: z.string().optional(),
  manufacturer: z.string().optional(),
  model: z.string().optional(),
  serialNumber: z.string().min(1, "Serial number is required").optional(),
  purchaseDate: z.string().optional(),
  purchasePrice: z.coerce.number().optional(),
  supplier: z.string().optional(),
  warrantyExpiry: z.string().optional(),
  assignedUser: z.string().optional().nullable(),
  location: z.string().optional(),
  department: z.string().optional(),
  status: z.string().optional(),
  operatingSystem: z.string().optional(),
  processor: z.string().optional(),
  memory: z.string().optional(),
  storage: z.string().optional(),
  hostname: z.string().optional(),
  ipAddress: z.string().optional(),
  macAddress: z.string().optional(),
  patchStatus: z.string().optional(),
  lastPatchCheck: z.string().optional(),
  isLoanable: z.boolean().optional(),
  condition: z.string().optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
}).partial();

// GET /api/assets/[id] - Get single asset
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const result = await assetService.getAssetById(id);
    
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
    console.error(`Failed to fetch asset ${params.id}:`, error);
    return NextResponse.json(
      { success: false, error: `Failed to fetch asset ${params.id}` },
      { status: 500 }
    );
  }
}

// PUT /api/assets/[id] - Update asset
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const validation = assetUpdateSchema.safeParse(body);

    if (!validation.success) {
        return NextResponse.json(
            { success: false, error: 'Invalid input', details: validation.error.flatten() },
            { status: 400 }
        );
    }

    const result = await assetService.updateAsset(id, validation.data);

    if (result.rowCount === 0) {
        return NextResponse.json(
            { success: false, error: 'Asset not found' },
            { status: 404 }
        );
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: 'Asset updated successfully'
    });
  } catch (error) {
    console.error(`Failed to update asset ${params.id}:`, error);
    if (error.code === '23505') { // unique_violation
        return NextResponse.json(
            { success: false, error: 'Asset with this Asset Tag or Serial Number already exists.' },
            { status: 409 }
        );
    }
    return NextResponse.json(
      { success: false, error: `Failed to update asset ${params.id}` },
      { status: 500 }
    );
  }
}

// DELETE /api/assets/[id] - Delete asset
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const result = await assetService.deleteAsset(id);
    
    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Asset not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: 'Asset deleted successfully'
    });
  } catch (error) {
    console.error(`Failed to delete asset ${params.id}:`, error);
    return NextResponse.json(
      { success: false, error: `Failed to delete asset ${params.id}` },
      { status: 500 }
    );
  }
}