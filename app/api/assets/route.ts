import { NextRequest, NextResponse } from 'next/server';
import * as assetService from '@/lib/services/assetService';
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

  try {
    const result = await assetService.getAssets(search, status, type);
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

    const result = await assetService.createAsset(validation.data);

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