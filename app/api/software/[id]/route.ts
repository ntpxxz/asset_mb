// app/api/software/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic'
export const revalidate = 0
// ===== Helpers =====
const CAMEL_TO_DB: Record<string, string> = {
  softwareName: 'software_name',
  publisher: 'publisher',
  version: 'version',
  licenseKey: 'license_key',
  licenseType: 'licenses_type',
  purchaseDate: 'purchasedate',
  expiryDate: 'expirydate',
  licensesTotal: 'licenses_total',
  licensesAssigned: 'licenses_assigned',
  category: 'category',
  description: 'description',
  notes: 'notes',
  status: 'status',
  updated_at: 'updated_at',
};

const isDdMmYyyy = (s: string) => /^\d{2}\/\d{2}\/\d{4}$/.test(s);

function toDateOnly(val: any): string | null {
  if (!val) return null;
  const s = String(val);
  if (isDdMmYyyy(s)) {
    const [dd, mm, yyyy] = s.split('/');
    return `${yyyy}-${mm}-${dd}`;
  }
  // ISO -> date only
  if (s.includes('T')) return s.split('T')[0];
  // assume already YYYY-MM-DD
  return s;
}

function toInt(val: any): number | null {
  if (val === '' || val === null || val === undefined) return null;
  const n = typeof val === 'number' ? val : parseInt(String(val), 10);
  return Number.isFinite(n) ? n : null;
}

function toNull(val: any) {
  return val === '' || val === '-' || val === undefined ? null : val;
}

// รับ body จากฟอร์ม แล้วคืน object ที่คีย์เป็นชื่อคอลัมน์จริงของ DB
function buildUpdate(body: Record<string, any>) {
  const update: Record<string, any> = {};
  for (const [camel, dbCol] of Object.entries(CAMEL_TO_DB)) {
    if (!(camel in body) && !(dbCol in body)) continue;
    let v = body[camel] ?? body[dbCol];

    if (dbCol === 'purchasedate' || dbCol === 'expirydate') v = toDateOnly(v);
    else if (dbCol === 'licenses_total' || dbCol === 'licenses_assigned') v = toInt(v);
    else if (dbCol === 'updated_at') v = v ? new Date(String(v)).toISOString() : new Date().toISOString();
    else v = toNull(v);

    update[dbCol] = v;
  }

  // ถ้าไม่ได้ส่ง updated_at มาจะตั้งให้เอง
  if (!('updated_at' in update)) update.updated_at = new Date().toISOString();
  return update;
}

function ok(data: any, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}
function fail(error: string, status = 400) {
  return NextResponse.json({ success: false, error }, { status });
}

// ===== Handlers =====

// GET /api/software/:id
export async function GET(
  _req: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const q = `
      SELECT id, software_name, publisher, version, license_key, licenses_type,
             purchasedate, expirydate, licenses_total, licenses_assigned,
             category, description, notes, status, created_at, updated_at
      FROM software
      WHERE id = $1
      LIMIT 1
    `;
    const { rows } = await pool.query(q, [id]);
    if (!rows[0]) return fail('Software license not found', 404);
    return ok(rows[0]);
  } catch (e: any) {
    console.error('[GET software/:id]', e);
    return fail('Failed to fetch software license', 500);
  }
}

// PATCH /api/software/:id  (partial update – ใช้กับฟอร์ม Edit)
export async function PATCH(
  req: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const update = buildUpdate(body);

    // กติกา business: assigned > total ไม่ได้ (ถ้าส่งสองฟิลด์นี้มา)
    if (
      (update.licenses_assigned ?? null) !== null &&
      (update.licenses_total ?? null) !== null &&
      Number(update.licenses_assigned) > Number(update.licenses_total)
    ) {
      return fail('licenses_assigned cannot exceed licenses_total', 400);
    }

    if (Object.keys(update).length === 0) return fail('No fields to update', 400);

    const cols = Object.keys(update);
    const vals = Object.values(update);
    const sets = cols.map((c, i) => `${c} = $${i + 1}`).join(', ');

    const q = `
      UPDATE software
      SET ${sets}
      WHERE id = $${cols.length + 1}
      RETURNING id, software_name, publisher, version, license_key, licenses_type,
                purchasedate, expirydate, licenses_total, licenses_assigned,
                category, description, notes, status, created_at, updated_at
    `;
    const { rows } = await pool.query(q, [...vals, id]);
    if (!rows[0]) return fail('Software license not found', 404);
    return ok(rows[0]);
  } catch (e: any) {
    // จับ unique violation ฯลฯ ให้เป็นข้อความอ่านง่าย
    const pgCode = e?.code;
    if (pgCode === '23505') {
      return fail('Software with this license key already exists.', 409);
    }
    console.error('[PATCH software/:id]', e);
    return fail(`Failed to update software license`, 500);
  }
}

// PUT /api/software/:id  → รองรับให้เรียกแบบเดิมได้ (จะใช้ logic เดียวกับ PATCH)
export async function PUT(
  req: NextRequest, 
  ctx: { params: Promise<{ id: string }> }
) {
  return PATCH(req, ctx);
}

// DELETE /api/software/:id
export async function DELETE(
  _req: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { rows } = await pool.query('DELETE FROM software WHERE id = $1 RETURNING id', [id]);
    if (!rows[0]) return fail('Software license not found', 404);
    return ok(null);
  } catch (e: any) {
    console.error('[DELETE software/:id]', e);
    return fail(`Failed to delete software license`, 500);
  }
}