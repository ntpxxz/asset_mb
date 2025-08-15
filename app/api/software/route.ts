import { NextRequest, NextResponse } from 'next/server';
import * as softwareService from '@/lib/services/softwareService';
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

  try {
    const result = await softwareService.getSoftware(search, status, type);
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

    const result = await softwareService.createSoftware(validation.data);

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