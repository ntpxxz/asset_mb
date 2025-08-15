import { NextRequest, NextResponse } from 'next/server';

let softwareLicenses = [
  {
    id: 'SW-001',
    softwareName: 'Microsoft Office 365',
    publisher: 'Microsoft',
    version: '2023',
    licenseKey: 'XXXXX-XXXXX-XXXXX-XXXXX',
    licenseType: 'subscription',
    purchaseDate: '2023-01-01',
    expiryDate: '2024-01-01',
    licensesTotal: 150,
    licensesAssigned: 142,
    category: 'productivity',
    description: 'Office productivity suite',
    notes: 'Enterprise subscription',
    status: 'active',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

// GET /api/software/[id] - Get single software license
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const software = softwareLicenses.find(s => s.id === params.id);
    
    if (!software) {
      return NextResponse.json(
        { success: false, error: 'Software license not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: software
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch software license' },
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
    const body = await request.json();
    const softwareIndex = softwareLicenses.findIndex(s => s.id === params.id);
    
    if (softwareIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Software license not found' },
        { status: 404 }
      );
    }

    softwareLicenses[softwareIndex] = {
      ...softwareLicenses[softwareIndex],
      ...body,
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: softwareLicenses[softwareIndex],
      message: 'Software license updated successfully'
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to update software license' },
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
    const softwareIndex = softwareLicenses.findIndex(s => s.id === params.id);
    
    if (softwareIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Software license not found' },
        { status: 404 }
      );
    }

    const deletedSoftware = softwareLicenses.splice(softwareIndex, 1)[0];

    return NextResponse.json({
      success: true,
      data: deletedSoftware,
      message: 'Software license deleted successfully'
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to delete software license' },
      { status: 500 }
    );
  }
}