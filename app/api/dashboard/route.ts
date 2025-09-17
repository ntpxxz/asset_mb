// app/api/dashboard/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type Stats = {
  hardware: { total: number; inUse: number; available: number; underRepair: number; retired: number };
  software: { total: number; totalLicenses: number; assignedLicenses: number; availableLicenses: number };
  users: { total: number; active: number; inactive: number };
  borrowing: { checkedOut: number; overdue: number };
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
  const dueCol = pickExistingColumn(cols, ['due_date', 'duedate', 'due_on']);

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

    const [hw, sw, us, bor, warranties] = await Promise.all([
      safeQuery(
        `
        SELECT
          COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE status ILIKE 'In Use')::int                                AS in_use,
          COUNT(*) FILTER (WHERE status ILIKE 'In Stock' OR status ILIKE 'Available')::int  AS available,
          COUNT(*) FILTER (WHERE status ILIKE 'Under Repair')::int                          AS under_repair,
          COUNT(*) FILTER (WHERE status ILIKE 'Retired')::int                               AS retired
        FROM assets;
        `,
        { total: 0, in_use: 0, available: 0, under_repair: 0, retired: 0 }
      ),
      safeQuery(
        `
        SELECT
          COUNT(*)::int                                        AS total,
          COALESCE(SUM(licenses_total), 0)::int                AS total_licenses,
          COALESCE(SUM(licenses_assigned), 0)::int             AS assigned_licenses
        FROM software;
        `,
        { total: 0, total_licenses: 0, assigned_licenses: 0 }
      ),
      safeQuery(
        `
        SELECT
          COUNT(*)::int                                                   AS total,
          COUNT(*) FILTER (WHERE status ILIKE 'active')::int              AS active,
          COUNT(*) FILTER (WHERE status ILIKE 'inactive')::int            AS inactive
        FROM users;
        `,
        { total: 0, active: 0, inactive: 0 }
      ),
      getBorrowingStats(),
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
      software: {
        total: sw.total ?? 0,
        totalLicenses: sw.total_licenses ?? 0,
        assignedLicenses: sw.assigned_licenses ?? 0,
        availableLicenses: Math.max(0, (sw.total_licenses ?? 0) - (sw.assigned_licenses ?? 0)),
      },
      users: {
        total: us.total ?? 0,
        active: us.active ?? 0,
        inactive: us.inactive ?? 0,
      },
      borrowing: {
        checkedOut: (bor as any).checkedOut ?? (bor as any).checked_out ?? 0,
        overdue: (bor as any).overdue ?? 0,
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
