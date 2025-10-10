import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// This function will now run queries sequentially to be more stable
async function getInventoryData() {
    // 1. Query for KPI stats
    const statsQuery = `
        SELECT
            COALESCE(SUM(quantity * price_per_unit), 0)::numeric AS total_stock_value,
            COUNT(*) FILTER (WHERE quantity <= min_stock_level)::int AS items_running_low,
            COUNT(*)::int AS total_unique_items,
            COALESCE(SUM(quantity), 0)::int AS total_quantity
        FROM inventory_items;
    `;
    const statsResult = await pool.query(statsQuery);
    const stats = statsResult.rows[0] || {
        total_stock_value: 0,
        items_running_low: 0,
        total_unique_items: 0,
        total_quantity: 0,
    };

    // 2. Query for stock value by category
    const categoryValueQuery = `
        SELECT
            category,
            COALESCE(SUM(quantity * price_per_unit), 0)::numeric AS value
        FROM inventory_items
        WHERE category IS NOT NULL AND category != ''
        GROUP BY category
        ORDER BY value DESC
        LIMIT 5;
    `;
    const categoryValueResult = await pool.query(categoryValueQuery);

    // 3. Query for most dispensed items (last 90 days)
    const mostDispensedQuery = `
        SELECT
            i.name,
            ABS(SUM(t.quantity_change))::int as dispensed_count
        FROM inventory_transactions t
        JOIN inventory_items i ON t.item_id = i.id
        WHERE t.transaction_type = 'dispense' AND t.transaction_date >= NOW() - INTERVAL '90 days'
        GROUP BY i.name
        ORDER BY dispensed_count DESC
        LIMIT 5;
    `;
    const mostDispensedResult = await pool.query(mostDispensedQuery);

    return {
        stats: stats,
        valueByCategory: categoryValueResult.rows,
        mostDispensed: mostDispensedResult.rows,
    };
}


export async function GET(req: NextRequest) {
  try {
    const dashboardData = await getInventoryData();

    return NextResponse.json(
      { success: true, data: dashboardData },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('[GET /api/inventory/dashboard] error:', err);
    // Ensure a valid JSON response is always sent, even on error
    return NextResponse.json(
      { success: false, error: 'Failed to load inventory dashboard data', details: err.message },
      { status: 500 }
    );
  }
}