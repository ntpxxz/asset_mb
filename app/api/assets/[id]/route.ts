export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { z } from "zod";

// Helper Functions
const price = z.preprocess((v) => {
  if (v === "" || v == null) return null;
  const n = typeof v === "number" ? v : Number(String(v).replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}, z.number().nullable());

const trim = (v: unknown) => (typeof v === "string" ? v.trim() : v);

const undefIfEmpty = (v: unknown) => {
  if (v === undefined) return undefined; // ถ้าไม่ส่งมา ให้เป็น undefined (ไม่ update)
  if (v === null) return null;           // ถ้าส่ง null มา ให้เป็น null (ลบค่า)
  if (typeof v === "string" && v.trim() === "") return null; // ถ้าส่งว่างมา ให้เป็น null (ลบค่า)
  return v;
};

const toISOorNull = (v: unknown) => {
  if (v === undefined) return undefined;
  if (!v) return null;
  const d = new Date(v as any);
  return isNaN(d.getTime()) ? null : d.toISOString();
};

const ok = (data: any, init?: ResponseInit) =>
  NextResponse.json({ success: true, data }, init);
const bad = (error: string, status = 400) =>
  NextResponse.json({ success: false, error }, { status });

// Validation Schema (Relaxed to allow free text)
const assetUpdateSchema = z
  .object({
    asset_tag: z.string().min(1).optional(),
    serialnumber: z.string().nullable().optional(),
    manufacturer: z.string().nullable().optional(),
    model: z.string().nullable().optional(),
    purchaseprice: price.optional(),
    supplier: z.string().nullable().optional(),

    // เปลี่ยนจาก Enum เป็น String เพื่อรองรับค่าใหม่ๆ และ Free text
    type: z.string().nullable().optional(),
    status: z.string().nullable().optional(),
    location: z.string().nullable().optional(),
    department: z.string().nullable().optional(),

    operatingsystem: z.string().nullable().optional(),
    processor: z.string().nullable().optional(),
    memory: z.string().nullable().optional(),
    storage: z.string().nullable().optional(),

    hostname: z.string().nullable().optional(),
    ip_address: z.string().nullable().optional(),
    mac_address: z.string().nullable().optional(),

    patchstatus: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    notes: z.string().nullable().optional(),

    // New Fields matching DB Schema
    building: z.string().nullable().optional(),
    division: z.string().nullable().optional(),
    section: z.string().nullable().optional(),
    area: z.string().nullable().optional(),
    pc_name: z.string().nullable().optional(),
    os_key: z.string().nullable().optional(),
    os_version: z.string().nullable().optional(),
    ms_office_apps: z.string().nullable().optional(),
    ms_office_version: z.string().nullable().optional(),
    is_legally_purchased: z.string().nullable().optional(),

    purchasedate: z.string().nullable().optional(),
    warrantyexpiry: z.string().nullable().optional(),
    lastpatch_check: z.string().nullable().optional(),

    assigneduser: z.string().nullable().optional(),
    isloanable: z.boolean().optional(),
    condition: z.string().nullable().optional(),
  })
  .partial();

/** GET /api/assets/[id] */
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const { id } = params;

    let result = await pool.query('SELECT * FROM assets WHERE id = $1', [id]);

    if (result.rowCount === 0) {
      result = await pool.query('SELECT * FROM assets WHERE asset_tag = $1', [id]);
    }

    if (result.rowCount === 0) {
      // Fallback search
      result = await pool.query(
        `SELECT * FROM assets 
         WHERE id::text = $1 OR asset_tag = $1 OR serialnumber = $1
         LIMIT 1`,
        [id]
      );
    }

    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Asset not found' },
        { status: 404 }
      );
    }

    const asset = result.rows[0];

    // ลบ delete_at ออก แต่ **ห้าม** เขียนทับ isloanable
    const cleanAsset = { ...asset };
    delete cleanAsset.delete_at;

    return NextResponse.json({
      success: true,
      data: cleanAsset,
      message: `Asset ${cleanAsset.asset_tag} loaded successfully`,
    });
  } catch (error: any) {
    console.error('Failed to fetch asset:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch asset',
        details: error.message || 'Internal server error',
      },
      { status: 500 }
    );
  }
}

/** PUT /api/assets/[id] */
export async function PUT(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const { id } = params;
  const body = await req.json();
  const client = await pool.connect();

  try {
    const parsed = assetUpdateSchema.safeParse(body);
    if (!parsed.success) {
      console.error("Validation Error:", parsed.error.errors);
      return bad(parsed.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join("; "), 400);
    }

    await client.query("BEGIN");

    const cur = await client.query(
      "SELECT asset_tag, serialnumber FROM assets WHERE id = $1",
      [id]
    );
    if (cur.rowCount === 0) {
      await client.query("ROLLBACK");
      return bad("Asset not found", 404);
    }
    const current = cur.rows[0];
    const v = parsed.data;

    // Prepare Update Object
    const updates: Record<string, any> = {
      asset_tag: undefIfEmpty(trim(v.asset_tag)),
      serialnumber: undefIfEmpty(trim(v.serialnumber)),
      manufacturer: undefIfEmpty(trim(v.manufacturer)),
      model: undefIfEmpty(trim(v.model)),
      purchaseprice: v.purchaseprice,
      supplier: undefIfEmpty(trim(v.supplier)),

      type: undefIfEmpty(trim(v.type)),
      status: undefIfEmpty(trim(v.status)),
      location: undefIfEmpty(trim(v.location)),
      department: undefIfEmpty(trim(v.department)),

      // New Fields
      building: undefIfEmpty(trim(v.building)),
      division: undefIfEmpty(trim(v.division)),
      section: undefIfEmpty(trim(v.section)),
      area: undefIfEmpty(trim(v.area)),
      pc_name: undefIfEmpty(trim(v.pc_name)),
      os_key: undefIfEmpty(trim(v.os_key)),
      os_version: undefIfEmpty(trim(v.os_version)),
      ms_office_apps: undefIfEmpty(trim(v.ms_office_apps)),
      ms_office_version: undefIfEmpty(trim(v.ms_office_version)),
      is_legally_purchased: undefIfEmpty(trim(v.is_legally_purchased)),

      operatingsystem: undefIfEmpty(trim(v.operatingsystem)),
      processor: undefIfEmpty(trim(v.processor)),
      memory: undefIfEmpty(trim(v.memory)),
      storage: undefIfEmpty(trim(v.storage)),
      hostname: undefIfEmpty(trim(v.hostname)),
      ip_address: undefIfEmpty(trim(v.ip_address)),
      mac_address: undefIfEmpty(trim(v.mac_address)),

      patchstatus: undefIfEmpty(trim(v.patchstatus)),
      description: undefIfEmpty(trim(v.description)),
      notes: undefIfEmpty(trim(v.notes)),

      purchasedate: toISOorNull(v.purchasedate),
      warrantyexpiry: toISOorNull(v.warrantyexpiry),
      lastpatch_check: toISOorNull(v.lastpatch_check),

      assigneduser: v.assigneduser === "-" ? null : undefIfEmpty(trim(v.assigneduser)),
      isloanable: typeof v.isloanable === "boolean" ? v.isloanable : undefined,
      condition: undefIfEmpty(trim(v.condition)),
    };

    // Duplicate Check
    const checkDuplicate = async (field: string, value: string) => {
      if (!value || value === current[field]) return false;
      const res = await client.query(
        `SELECT 1 FROM assets WHERE LOWER(${field}) = LOWER($1) AND id <> $2 LIMIT 1`,
        [value, id]
      );
      return res.rowCount && res.rowCount > 0;
    };

    if (updates.asset_tag && await checkDuplicate('asset_tag', updates.asset_tag)) {
      await client.query("ROLLBACK");
      return bad("Duplicate asset tag", 409);
    }

    if (updates.serialnumber && await checkDuplicate('serialnumber', updates.serialnumber)) {
      await client.query("ROLLBACK");
      return bad("Duplicate serial number", 409);
    }

    // Build Dynamic Query
    const sets: string[] = [];
    const vals: any[] = [];
    let i = 1;

    for (const [k, val] of Object.entries(updates)) {
      if (val !== undefined) {
        sets.push(`"${k}" = $${i++}`); // Quote column names for safety
        vals.push(val);
      }
    }

    if (sets.length === 0) {
      await client.query("ROLLBACK");
      const r = await pool.query("SELECT * FROM assets WHERE id = $1", [id]);
      return ok(r.rows[0]);
    }

    sets.push(`updated_at = NOW()`);
    vals.push(id);

    const sql = `UPDATE assets SET ${sets.join(", ")} WHERE id = $${i} RETURNING *`;
    const up = await client.query(sql, vals);

    await client.query("COMMIT");
    return ok(up.rows[0]);

  } catch (e: any) {
    await client.query("ROLLBACK");
    console.error("[PUT asset]", e);
    const msg = String(e?.message || e);
    if (/unique|duplicate/i.test(msg)) return bad("Duplicate value detected", 409);
    return bad("Failed to update asset", 500);
  } finally {
    client.release();
  }
}

/** DELETE /api/assets/[id] */
export async function DELETE(
  _req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const { id } = params;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const r = await client.query(
      "DELETE FROM assets WHERE id = $1 RETURNING id",
      [id]
    );
    if (r.rowCount === 0) {
      await client.query("ROLLBACK");
      return bad("Asset not found", 404);
    }
    await client.query("COMMIT");
    return ok({ id: r.rows[0].id });
  } catch (e) {
    await client.query("ROLLBACK");
    console.error("[DELETE asset]", e);
    return bad("Failed to delete asset", 500);
  } finally {
    client.release();
  }
}