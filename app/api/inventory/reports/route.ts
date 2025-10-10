// app/api/inventory/reports/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const type = searchParams.get('type');
    const userId = searchParams.get('userId');

    let query = `
      SELECT
        t.id,
        i.name as item_name,
        COALESCE(u.firstname || ' ' || u.lastname, t.user_id, 'System') as user_name,
        t.transaction_type,
        t.quantity_change,
        t.notes,
        t.transaction_date
      FROM inventory_transactions t
      JOIN inventory_items i ON t.item_id = i.id
      LEFT JOIN users u ON t.user_id = u.id
    `;

    const whereClauses = [];
    const queryParams = [];
    let paramIndex = 1;

    if (startDate) {
      whereClauses.push(`t.transaction_date >= $${paramIndex++}`);
      queryParams.push(startDate);
    }
    if (endDate) {
      whereClauses.push(`t.transaction_date <= $${paramIndex++}`);
      queryParams.push(endDate);
    }
    if (type && type !== 'all') {
      whereClauses.push(`t.transaction_type = $${paramIndex++}`);
      queryParams.push(type);
    }
    if (userId && userId !== 'all') {
      whereClauses.push(`t.user_id = $${paramIndex++}`);
      queryParams.push(userId);
    }

    if (whereClauses.length > 0) {
      query += ` WHERE ${whereClauses.join(' AND ')}`;
    }

    query += ' ORDER BY t.transaction_date DESC';

    const result = await pool.query(query, queryParams);

    return NextResponse.json({ success: true, data: result.rows });

  } catch (error: any) {
    console.error('[GET /api/inventory/reports] error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load inventory reports', details: error.message },
      { status: 500 }
    );
  }
}