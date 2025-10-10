// app/api/assets/[id]/history/route.ts

import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } // params is a Promise
) {
  try {
    const { id } = await params; // <-- FIX: Await the params to resolve the Promise

    const query = `
      SELECT
        id,
        action,
        field_changed,
        old_value,
        new_value,
        change_date,
        changed_by_user_id
      FROM asset_history
      WHERE asset_id = $1
      ORDER BY change_date DESC
    `;

    const { rows } = await pool.query(query, [id]);

    return NextResponse.json({ success: true, data: rows });
  } catch (error: any) {
    console.error(`Failed to fetch history for asset ${await params.then(p => p.id)}:`, error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch asset history', details: error.message },
      { status: 500 }
    );
  }
}