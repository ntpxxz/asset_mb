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

    // Pagination Params
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // 1. Construct WHERE clause
    const whereClauses = [];
    const queryParams = [];
    let paramIndex = 1;

    if (startDate) {
      whereClauses.push(`COALESCE(t.transaction_date, t.created_at) >= $${paramIndex++}`);
      queryParams.push(startDate);
    }
    if (endDate) {
      // Adjust end date to cover the full day
      whereClauses.push(`COALESCE(t.transaction_date, t.created_at) <= $${paramIndex++}::timestamp + INTERVAL '1 day'`);
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

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // 2. Count Total Query
    const countQuery = `
      SELECT COUNT(*) as total
      FROM inventory_transactions t
      ${whereSql}
    `;
    // Use a separate params array for count to avoid index mismatch if we reused queryParams blindly
    const countResult = await pool.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total, 10);

    // 3. Data Query with Pagination
    let query = `
      SELECT
        t.id,
        i.name as item_name,
        COALESCE(u.firstname || ' ' || u.lastname, t.user_id, 'System') as user_name,
        t.transaction_type,
        t.quantity_change,
        t.notes,
        COALESCE(t.transaction_date, t.created_at) as transaction_date
      FROM inventory_transactions t
      JOIN inventory_items i ON t.item_id = i.id
      LEFT JOIN users u ON t.user_id::text = u.id::text
      ${whereSql}
      ORDER BY COALESCE(t.transaction_date, t.created_at) DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    // Add pagination params to the main query params
    queryParams.push(limit, offset);

    const result = await pool.query(query, queryParams);

    return NextResponse.json({
      success: true,
      data: result.rows,
      total,
      limit,
      offset
    });

  } catch (error: any) {
    console.error('[GET /api/inventory/reports] error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load inventory reports', details: error.message },
      { status: 500 }
    );
  }
}