import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } // params is a Promise
) {
  // FIX 1: Await the params to resolve the Promise and get the id
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ success: false, error: 'Item ID is required' }, { status: 400 });
  }

  try {
    const client = await pool.connect();
    
    const itemResult = await client.query('SELECT name FROM inventory_items WHERE id = $1', [id]);
    const itemName = itemResult.rows[0]?.name || `Item ID ${id}`;

    // FIX 2: Ensure price_per_unit is selected from the transaction table directly
    const historyResult = await client.query(`
      SELECT 
        t.*,
        (t.quantity_change * t.price_per_unit) as value_change,
        COALESCE(u.firstname || ' ' || u.lastname, t.user_id, 'System') as user_name
      FROM inventory_transactions t
      LEFT JOIN users u ON t.user_id = u.id
      WHERE t.item_id = $1
      ORDER BY t.transaction_date DESC
    `, [id]);

    client.release();

    return NextResponse.json({
      success: true,
      data: {
        itemName: itemName,
        transactions: historyResult.rows,
      }
    });

  } catch (error) {
    console.error(`Failed to fetch history for item ${id}:`, error);
    return NextResponse.json({ success: false, error: 'Failed to fetch transaction history' }, { status: 500 });
  }
}