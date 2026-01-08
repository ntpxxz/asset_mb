import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const floorPlanId = parseInt(id);

    if (isNaN(floorPlanId)) {
        return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    try {
        const result = await pool.query(
            `SELECT * FROM asset_connections WHERE floor_plan_id = $1`,
            [floorPlanId]
        );
        return NextResponse.json(result.rows);
    } catch (error) {
        console.error('Failed to fetch connections:', error);
        return NextResponse.json({ error: 'Failed to fetch connections' }, { status: 500 });
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const floorPlanId = parseInt(id);

    if (isNaN(floorPlanId)) {
        return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    try {
        const body = await request.json();
        const { fromAssetId, toAssetId } = body;

        if (!fromAssetId || !toAssetId) {
            return NextResponse.json({ error: 'Missing asset IDs' }, { status: 400 });
        }

        // Ensure consistent ordering to avoid duplicate lines in different directions?
        // Or just allow directional? Let's assume non-directional for now, but store as is.
        // The unique constraint is (floor_plan_id, from_asset_id, to_asset_id).
        // If we want non-directional uniqueness, we should enforce from < to or check both.
        // For simplicity, let's just insert as requested.

        const result = await pool.query(
            `INSERT INTO asset_connections (floor_plan_id, from_asset_id, to_asset_id)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [floorPlanId, fromAssetId, toAssetId]
        );

        return NextResponse.json(result.rows[0]);
    } catch (error) {
        console.error('Failed to create connection:', error);
        return NextResponse.json({ error: 'Failed to create connection' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const floorPlanId = parseInt(id);
    const { searchParams } = new URL(request.url);
    const connectionId = searchParams.get('connectionId');

    if (isNaN(floorPlanId) || !connectionId) {
        return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    try {
        await pool.query(
            `DELETE FROM asset_connections WHERE id = $1 AND floor_plan_id = $2`,
            [connectionId, floorPlanId]
        );
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to delete connection:', error);
        return NextResponse.json({ error: 'Failed to delete connection' }, { status: 500 });
    }
}
