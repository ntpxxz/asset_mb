import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: floorPlanId } = await params;
        const result = await pool.query(
            `SELECT ap.*, a.asset_tag, a.model, a.ipaddress, a.type 
       FROM asset_placements ap
       JOIN assets a ON ap.asset_id = a.id
       WHERE ap.floor_plan_id = $1`,
            [floorPlanId]
        );
        return NextResponse.json(result.rows);
    } catch (error) {
        console.error('Error fetching placements:', error);
        return NextResponse.json({ error: 'Failed to fetch placements' }, { status: 500 });
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: floorPlanId } = await params;
        const body = await request.json();
        const { assetId, x, y } = body;

        if (!assetId || x === undefined || y === undefined) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Remove this asset from any other floor plan first (enforce single location)
        await pool.query('DELETE FROM asset_placements WHERE asset_id = $1', [assetId]);

        // Insert or Update placement for this floor
        const result = await pool.query(
            `INSERT INTO asset_placements (floor_plan_id, asset_id, x_position, y_position)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
            [floorPlanId, assetId, x, y]
        );

        return NextResponse.json(result.rows[0]);
    } catch (error) {
        console.error('Error saving placement:', error);
        return NextResponse.json({ error: 'Failed to save placement' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    // Logic to remove an asset from a floor plan
    // We might need to pass assetId in query param or body
    try {
        const { id: floorPlanId } = await params;
        const url = new URL(request.url);
        const assetId = url.searchParams.get('assetId');

        if (!assetId) {
            return NextResponse.json({ error: 'Asset ID required' }, { status: 400 });
        }

        await pool.query('DELETE FROM asset_placements WHERE floor_plan_id = $1 AND asset_id = $2', [floorPlanId, assetId]);
        return NextResponse.json({ message: 'Placement removed' });

    } catch (error) {
        console.error('Error removing placement:', error);
        return NextResponse.json({ error: 'Failed to remove placement' }, { status: 500 });
    }
}
