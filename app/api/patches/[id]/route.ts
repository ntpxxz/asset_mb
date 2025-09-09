import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { z } from 'zod';

// ---------------------------
// Validation (partial update)
// ---------------------------
const patchUpdateSchema = z.object({
  assetId: z.string().min(1, 'Asset ID is required').optional(),
  patchStatus: z.string().optional(),
  lastPatchCheck: z.string().optional(),
  operatingSystem: z.string().optional(),
  vulnerabilities: z.coerce.number().int().optional(),
  pendingUpdates: z.coerce.number().int().optional(),
  criticalUpdates: z.coerce.number().int().optional(),
  securityUpdates: z.coerce.number().int().optional(),
  notes: z.string().optional(),
  nextCheckDate: z.string().optional(),
}).partial();

// ---------------------------
// Helpers
// ---------------------------
const toISO = (v: any) => { try { return v ? new Date(v).toISOString() : null; } catch { return null; } };
const normalizeRecord = (r: any) => ({
  ...r,
  lastPatchCheck: toISO(r.lastPatchCheck),
  nextCheckDate: toISO(r.nextCheckDate),
  createdAt: toISO(r.createdAt),
  updatedAt: toISO(r.updatedAt),
});

async function fetchRecord(id: string) {
  return pool.query(
    `SELECT id, "assetId", "patchStatus", "lastPatchCheck", "operatingSystem",
            vulnerabilities, "pendingUpdates", "criticalUpdates", "securityUpdates",
            notes, "nextCheckDate", "createdAt", "updatedAt"
     FROM asset_patches WHERE id = $1`,
    [id]
  );
}

// ------------------------------------------------------
// GET /api/patches/[id]
//   - supports ?include=history to bundle history (optional)
// ------------------------------------------------------
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const url = new URL(request.url);
    const include = url.searchParams.get('include');
    const wantHistory = include?.split(',').includes('history');

    // 1) record
    const rec = await fetchRecord(id);
    if (rec.rowCount === 0) {
      return NextResponse.json({ success: false, error: 'Patch record not found' }, { status: 404 });
    }
    const record = normalizeRecord(rec.rows[0]);

    if (!wantHistory) return NextResponse.json({ success: true, data: record });

    // 2) optional history bundle
    const hist = await pool.query(
      `SELECT id, "patchId", "patchName", version, description,
              "patchType", severity, status, "installDate", "scheduledDate",
              size, "kbNumber", "cveIds", notes, "createdAt"
       FROM asset_patch_history
       WHERE "patchId" = $1
       ORDER BY COALESCE("installDate","scheduledDate","createdAt") DESC`,
      [id]
    );

    const history = hist.rows.map((r: any) => ({
      ...r,
      installDate: toISO(r.installDate),
      scheduledDate: toISO(r.scheduledDate),
      createdAt: toISO(r.createdAt),
      // normalize cveIds: TEXT(JSON/CSV) -> array (UI-friendly)
      cveIds: (() => {
        if (r.cveIds == null) return undefined;
        if (Array.isArray(r.cveIds)) return r.cveIds.map(String);
        if (typeof r.cveIds === 'string') {
          const s = r.cveIds.trim();
          if (s.startsWith('[') && s.endsWith(']')) { try { return JSON.parse(s); } catch { return undefined; } }
          if (s) return s.split(',').map((x: string) => x.trim()).filter(Boolean);
        }
        return undefined;
      })(),
    }));

    return NextResponse.json({ success: true, data: record, history });
  } catch (error) {
    console.error('GET /api/patches/[id] failed:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch patch record' }, { status: 500 });
  }
}

// ------------------------------------------------------
// PUT /api/patches/[id]  (partial update)
// ------------------------------------------------------
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const validation = patchUpdateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const fields: Record<string, any> = validation.data;
    if (Object.keys(fields).length === 0) {
      return NextResponse.json({ success: false, error: 'No fields to update' }, { status: 400 });
    }

    if (fields.lastPatchCheck) fields.lastPatchCheck = new Date(fields.lastPatchCheck);
    if (fields.nextCheckDate) fields.nextCheckDate = new Date(fields.nextCheckDate);
    fields.updatedAt = new Date();

    const setClauses = Object.keys(fields)
      .map((key, index) => `"${key}" = $${index + 1}`)
      .join(', ');
    const queryParams = Object.values(fields);
    queryParams.push(id);

    const result = await pool.query(`UPDATE asset_patches SET ${setClauses} WHERE id = $${queryParams.length} RETURNING *;`, queryParams);
    if (result.rowCount === 0) return NextResponse.json({ success: false, error: 'Patch record not found' }, { status: 404 });

    return NextResponse.json({ success: true, data: normalizeRecord(result.rows[0]), message: 'Patch record updated successfully' });
  } catch (error) {
    console.error(`PUT /api/patches/[id] failed:`, error);
    return NextResponse.json({ success: false, error: `Failed to update patch record ${params.id}` }, { status: 500 });
  }
}

// ------------------------------------------------------
// DELETE /api/patches/[id] (delete history first to satisfy FK)
// ------------------------------------------------------
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM asset_patch_history WHERE "patchId" = $1', [params.id]);
    const result = await client.query('DELETE FROM asset_patches WHERE id = $1 RETURNING *;', [params.id]);
    await client.query('COMMIT');
    if (result.rowCount === 0) return NextResponse.json({ success: false, error: 'Patch record not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: normalizeRecord(result.rows[0]), message: 'Patch record deleted successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`DELETE /api/patches/[id] failed:`, error);
    return NextResponse.json({ success: false, error: `Failed to delete patch record ${params.id}` }, { status: 500 });
  } finally {
    client.release();
  }
}
