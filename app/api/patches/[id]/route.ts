import { NextRequest, NextResponse } from 'next/server';
import * as patchService from '@/lib/services/patchService';
import { z } from 'zod';

const patchUpdateSchema = z.object({
  assetId: z.string().min(1, "Asset ID is required").optional(),
  patchStatus: z.string().optional(),
  lastPatchCheck: z.string().optional(),
  operatingSystem: z.string().optional(),
  vulnerabilities: z.coerce.number().int().optional(),
  pendingUpdates: z.coerce.number().int().optional(),
  criticalUpdates: z.coerce.number().int().optional(),
  securityUpdates: z.coerce.number().int().optional(),
  notes: z.string().optional(),
  nextCheckDate: z.string().optional(),
}).partial();

// GET /api/patches/[id] - Get single patch record
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const result = await patchService.getPatchRecordById(id);
    
    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Patch record not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error(`Failed to fetch patch record ${params.id}:`, error);
    return NextResponse.json(
      { success: false, error: `Failed to fetch patch record ${params.id}` },
      { status: 500 }
    );
  }
}

// PUT /api/patches/[id] - Update patch record
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const validation = patchUpdateSchema.safeParse(body);

    if (!validation.success) {
        return NextResponse.json(
            { success: false, error: 'Invalid input', details: validation.error.flatten() },
            { status: 400 }
        );
    }

    const result = await patchService.updatePatchRecord(id, validation.data);

    if (result.rowCount === 0) {
        return NextResponse.json(
            { success: false, error: 'Patch record not found' },
            { status: 404 }
        );
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: 'Patch record updated successfully'
    });
  } catch (error) {
    console.error(`Failed to update patch record ${params.id}:`, error);
    return NextResponse.json(
      { success: false, error: `Failed to update patch record ${params.id}` },
      { status: 500 }
    );
  }
}

// DELETE /api/patches/[id] - Delete patch record
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const result = await patchService.deletePatchRecord(id);
    
    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Patch record not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: 'Patch record deleted successfully'
    });
  } catch (error) {
    console.error(`Failed to delete patch record ${params.id}:`, error);
    return NextResponse.json(
      { success: false, error: `Failed to delete patch record ${params.id}` },
      { status: 500 }
    );
  }
}