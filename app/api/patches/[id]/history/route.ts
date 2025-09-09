import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

const toISO = (v: any) => { try { return v ? new Date(v).toISOString() : null; } catch { return null; } };

function normalizeHistoryRow(r: any) {
  let cveIds: string[] | undefined;
  if (r.cveIds != null) {
    if (Array.isArray(r.cveIds)) cveIds = r.cveIds.map(String);
    else if (typeof r.cveIds === 'string') {
      const s = r.cveIds.trim();
      if (s.startsWith('[') && s.endsWith(']')) { try { cveIds = JSON.parse(s); } catch {} }
      else if (s) { cveIds = s.split(',').map((x: string) => x.trim()).filter(Boolean); }
    }
  }
  return { ...r, installDate: toISO(r.installDate), scheduledDate: toISO(r.scheduledDate), createdAt: toISO(r.createdAt), cveIds };
}

// GET /api/patches/[id]/history → list history entries
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const rows = await pool.query(
      `SELECT id, "patchId", "patchName", version, description,
              "patchType", severity, status, "installDate", "scheduledDate",
              size, "kbNumber", "cveIds", notes, "createdAt"
       FROM asset_patch_history
       WHERE "patchId" = $1
       ORDER BY COALESCE("installDate","scheduledDate","createdAt") DESC`,
      [params.id]
    );
    return NextResponse.json({ success: true, data: rows.rows.map(normalizeHistoryRow) });
  } catch (err: any) {
    console.error('GET /api/patches/[id]/history failed:', err);
    return NextResponse.json({ success: false, error: err?.message || 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/patches/[id]/history → create new history entry for patch
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const { patchName, version, description, patchType, severity, status, installDate, scheduledDate, size, kbNumber, cveIds, notes } = body || {};

    // keep TEXT in DB; if array provided, serialize JSON
    let cveText: string | null = null;
    if (Array.isArray(cveIds)) cveText = JSON.stringify(cveIds);
    else if (typeof cveIds === 'string') cveText = cveIds;

    const insert = await pool.query(
      `INSERT INTO asset_patch_history
        (id, "patchId", "patchName", version, description, "patchType", severity, status,
         "installDate", "scheduledDate", size, "kbNumber", "cveIds", notes, "createdAt")
       VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8,
         $9, $10, $11, $12, $13, $14, NOW())
       RETURNING id`,
      [
        `HIST-${Date.now()}`,
        params.id,
        patchName,
        version,
        description,
        patchType,
        severity,
        status,
        installDate ? new Date(installDate) : null,
        scheduledDate ? new Date(scheduledDate) : null,
        size ?? null,
        kbNumber ?? null,
        cveText,
        notes ?? null,
      ]
    );

    return NextResponse.json({ success: true, id: insert.rows[0].id });
  } catch (err: any) {
    console.error('POST /api/patches/[id]/history failed:', err);
    return NextResponse.json({ success: false, error: err?.message || 'Internal Server Error' }, { status: 500 });
  }
}
