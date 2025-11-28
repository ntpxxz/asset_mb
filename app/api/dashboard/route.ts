// app/api/dashboard/route.ts

import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type Stats = {
  hardware: { total: number; inUse: number; available: number; underRepair: number; retired: number };
  computerAssets: { total: number; laptop: number; desktop: number; server: number };
  networkAssets: { total: number; router: number; switch: number; other: number };
  inventory: { totalItems: number; totalQuantity: number; lowStock: number; outOfStock: number };
};

// ---------- helpers ----------
async function listColumns(table: string, schema = 'public'): Promise<Set<string>> {
  const { rows } = await pool.query(
    `SELECT column_name FROM information_schema.columns WHERE table_schema=$1 AND table_name=$2`,
    [schema, table]
  );
  return new Set(rows.map((r) => r.column_name));
}

// ปลอดภัย: เลือกเฉพาะชื่อคอลัมน์ที่ allowlisted เท่านั้น
function pickExistingColumn(cols: Set<string>, candidates: string[]): string | null {
  for (const c of candidates) if (cols.has(c)) return c;
  return null;
}

async function getBorrowingStats(): Promise<{ checkedOut: number; overdue: number }> {
  // รองรับชื่อ table ยอดฮิต
  const tableCands = ['asset_borrowing', 'asset_borrowings', 'borrowings'];
  let tableInUse: string | null = null;
  let cols: Set<string> = new Set();

  for (const t of tableCands) {
    const r = await pool.query(
      `SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=$1`,
      [t]
    );
    if (r.rowCount) {
      tableInUse = t;
      cols = await listColumns(t);
      break;
    }
  }
  if (!tableInUse) return { checkedOut: 0, overdue: 0 };

  // เดาชื่อคอลัมน์คืน/กำหนดส่งที่ใช้จริง
  const returnedCol = pickExistingColumn(cols, ['returned_at', 'return_date', 'returned_date', 'return_at']);
  const dueCol = pickExistingColumn(cols, ['due_date']);

  // ถ้าไม่รู้คอลัมน์คืน ให้ถือว่าทุกแถวคือ checked out = 0 (ไม่พัง API)
  if (!returnedCol) return { checkedOut: 0, overdue: 0 };

  // สร้าง SQL แบบปลอดภัย (column name มาจาก allowlist ด้านบน)
  const sql =
    `SELECT
       COUNT(*) FILTER (WHERE ${returnedCol} IS NULL)::int AS checked_out
       ${dueCol ? `, COUNT(*) FILTER (WHERE ${returnedCol} IS NULL AND ${dueCol} < NOW())::int AS overdue` : `, 0::int AS overdue`}
     FROM ${tableInUse};`;

  const { rows } = await pool.query(sql);
  return { checkedOut: rows[0]?.checked_out ?? 0, overdue: rows[0]?.overdue ?? 0 };
}

async function getWarranties(days: number) {
  const assetCols = await listColumns('assets');
  const warrantyCol = pickExistingColumn(assetCols, ['warrantyexpiry', 'warranty_expiry']);
  if (!warrantyCol) return [];

  const assetTagCol = pickExistingColumn(assetCols, ['asset_tag', 'tag']) ?? 'asset_tag';
  const modelCol = pickExistingColumn(assetCols, ['model', 'name']) ?? 'model';

  const sql = `
    SELECT
      id,
      ${assetTagCol} AS asset_tag,
      ${modelCol} AS model,
      ${warrantyCol}::date AS warranty_expiry,
      GREATEST(0, (${warrantyCol}::date - CURRENT_DATE))::int AS days_left
    FROM assets
    WHERE ${warrantyCol} IS NOT NULL
      AND ${warrantyCol}::date BETWEEN CURRENT_DATE AND (CURRENT_DATE + make_interval(days => $1))
    ORDER BY ${warrantyCol} ASC
    LIMIT 50;
  `;
  const { rows } = await pool.query(sql, [days]);
  return rows;
}

async function safeQuery<T>(sql: string, defaults: T): Promise<T> {
  try {
    const { rows } = await pool.query(sql);
    return (rows[0] as T) ?? defaults;
  } catch {
    return defaults;
  }
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const daysParam = parseInt(url.searchParams.get('days') || '60', 10);
    const days = Number.isFinite(daysParam) ? Math.min(Math.max(daysParam, 1), 365) : 60;

    const [hw, computers, networks, inv, warranties] = await Promise.all([
      // Hardware stats
      safeQuery(
        `
        SELECT
          COUNT(*)::int AS total,
          SUM(CASE WHEN status ILIKE 'In Use' OR status ILIKE 'assigned' THEN 1 ELSE 0 END)::int AS in_use,
          SUM(CASE WHEN status ILIKE 'In Stock' OR status ILIKE 'Available' THEN 1 ELSE 0 END)::int AS available,
          SUM(CASE WHEN status ILIKE 'Under Repair' OR status ILIKE 'maintenance' THEN 1 ELSE 0 END)::int AS under_repair,
          SUM(CASE WHEN status ILIKE 'Retired' THEN 1 ELSE 0 END)::int AS retired
        FROM assets;
        `,
        { total: 0, in_use: 0, available: 0, under_repair: 0, retired: 0 }
      ),
      // Computer assets breakdown
      safeQuery(
        `
        SELECT
          COUNT(*)::int AS total,
          SUM(CASE WHEN type ILIKE 'laptop' OR type ILIKE 'nb' THEN 1 ELSE 0 END)::int AS laptop,
          SUM(CASE WHEN type ILIKE 'desktop' OR type ILIKE 'pc' THEN 1 ELSE 0 END)::int AS desktop,
          SUM(CASE WHEN type ILIKE 'server' THEN 1 ELSE 0 END)::int AS server
        FROM assets
        WHERE type ILIKE 'laptop' 
           OR type ILIKE 'nb'
           OR type ILIKE 'desktop' 
           OR type ILIKE 'pc'
           OR type ILIKE 'server'
           OR type ILIKE 'workstation'
           OR type ILIKE 'tablet';
        `,
        { total: 0, laptop: 0, desktop: 0, server: 0 }
      ),
      // Network assets breakdown
      safeQuery(
        `
        SELECT
          COUNT(*)::int AS total,
          SUM(CASE WHEN type ILIKE 'router' THEN 1 ELSE 0 END)::int AS router,
          SUM(CASE WHEN type ILIKE 'switch' THEN 1 ELSE 0 END)::int AS switch,
          SUM(CASE WHEN type NOT ILIKE 'router' AND type NOT ILIKE 'switch' THEN 1 ELSE 0 END)::int AS other
        FROM assets
        WHERE type ILIKE 'router' 
           OR type ILIKE 'switch'
           OR type ILIKE 'firewall'
           OR type ILIKE 'access-point'
           OR type ILIKE 'gateway';
        `,
        { total: 0, router: 0, switch: 0, other: 0 }
      ),
      // Inventory/Stock stats
      safeQuery(
        `
        SELECT
          COUNT(*)::int AS total_items,
          COALESCE(SUM(quantity), 0)::int AS total_quantity,
          SUM(CASE WHEN quantity > 0 AND quantity <= min_stock_level THEN 1 ELSE 0 END)::int AS low_stock,
          SUM(CASE WHEN quantity = 0 THEN 1 ELSE 0 END)::int AS out_of_stock
        FROM inventory_items;
        `,
        { total_items: 0, total_quantity: 0, low_stock: 0, out_of_stock: 0 }
      ),
      getWarranties(days),
    ]);

    const stats: Stats = {
      hardware: {
        total: hw.total ?? 0,
        inUse: hw.in_use ?? 0,
        available: hw.available ?? 0,
        underRepair: hw.under_repair ?? 0,
        retired: hw.retired ?? 0,
      },
      computerAssets: {
        total: computers.total ?? 0,
        laptop: computers.laptop ?? 0,
        desktop: computers.desktop ?? 0,
        server: computers.server ?? 0,
      },
      networkAssets: {
        total: networks.total ?? 0,
        router: networks.router ?? 0,
        switch: networks.switch ?? 0,
        other: networks.other ?? 0,
      },
      inventory: {
        totalItems: (inv as any).total_items ?? 0,
        totalQuantity: (inv as any).total_quantity ?? 0,
        lowStock: (inv as any).low_stock ?? 0,
        outOfStock: (inv as any).out_of_stock ?? 0,
      },
    };

    return NextResponse.json(
      { success: true, data: { stats, warranties, daysWindow: days } },
      { status: 200 }
    );
  } catch (err) {
    console.error('[GET /api/dashboard] error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to load dashboard data' },
      { status: 500 }
    );
  }
}
