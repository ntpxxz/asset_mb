// app/api/assets/[id]/route.ts
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { z } from "zod";

const enums = {
  type: [
    "laptop",
    "desktop",
    "monitor",
    "printer",
    "phone",
    "tablet",
    "server",
    "router",
    "switch",
    "firewall",
    "storage",
    "projector",
    "camera",
    "other",
  ] as const,
  status: ["available", "assigned", "maintenance", "retired"] as const,
  location: [
    "clean-room",
    "white-room",
    "spd-office",
    "it-storage",
    "warehouse",
    "fdb-fan",
    "remote",
  ] as const,
  department: ["engineering", "it", "production"] as const,
  patchstatus: ["up-to-date", "needs-review", "update-pending"] as const,
};

// 👉 แปลง purchaseprice เป็น number|null อัตโนมัติ
const price = z.preprocess((v) => {
  if (v === "" || v == null) return null;
  const n = typeof v === "number" ? v : Number(String(v).replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}, z.number().nullable());

const trim = (v: unknown) => (typeof v === "string" ? v.trim() : v);
const undefIfEmpty = (v: unknown) => {
  if (v === undefined || v === null) return undefined;
  if (typeof v === "string" && v.trim() === "") return undefined;
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

const assetUpdateSchema = z
  .object({
    asset_tag: z.string().min(1).optional(),
    serialnumber: z.string().nullable().optional(),
    manufacturer: z.string().nullable().optional(),
    model: z.string().nullable().optional(),
    purchaseprice: price.optional(), // ⬅️ ใช้ตัวบน
    supplier: z.string().nullable().optional(),

    type: z.enum(enums.type).optional(),
    status: z.enum(enums.status).nullable().optional(),
    location: z.enum(enums.location).nullable().optional(),
    department: z.enum(enums.department).nullable().optional(),

    operatingsystem: z.string().nullable().optional(),
    processor: z.string().nullable().optional(),
    memory: z.string().nullable().optional(),
    storage: z.string().nullable().optional(),

    hostname: z.string().nullable().optional(),
    ipaddress: z.string().nullable().optional(),
    macaddress: z.string().nullable().optional(),

    patchstatus: z.enum(enums.patchstatus).nullable().optional(),
    description: z.string().nullable().optional(),
    notes: z.string().nullable().optional(),

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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('GET /api/assets/[id] - Loading asset with ID:', id);


    // Try different ID fields
    let result = await pool.query('SELECT * FROM assets WHERE id = $1', [id]);

    if (result.rowCount === 0) {
      result = await pool.query('SELECT * FROM assets WHERE asset_tag = $1', [id]);
    }

    if (result.rowCount === 0) {
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
    
    // Clean up the asset data - no more field mapping needed since is_loanale is removed
    const cleanAsset = {
      ...asset,
      // Set default value for isloanable since it's not in DB anymore
      isloanable: false, // Default value since field is removed from DB
    };

    // Remove any unwanted fields
    delete cleanAsset.delete_at; // Don't send soft delete field to frontend

    console.log('=== ASSET DATA DEBUG ===');
    console.log('Original asset data:', asset);
    console.log('Clean asset data:', cleanAsset);
    console.log('Field check:');
    console.log('- type:', cleanAsset.type);
    console.log('- status:', cleanAsset.status);
    console.log('- location:', cleanAsset.location);
    console.log('- department:', cleanAsset.department);
    console.log('- condition:', cleanAsset.condition);
    console.log('- patchstatus:', cleanAsset.patchstatus);
    console.log('- isloanable:', cleanAsset.isloanable);

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
        details:
          process.env.NODE_ENV === 'development'
            ? error.message
            : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

/** PUT /api/assets/[id] */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const client = await pool.connect();
  try {
    const body = await req.json();
    const parsed = assetUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return bad(parsed.error.errors.map((e) => e.message).join("; "), 400);
    }

    await client.query("BEGIN");

    // current for duplicate check
    const cur = await client.query(
      "SELECT asset_tag, serialnumber FROM assets WHERE id = $1",
      [id]
    );
    if (cur.rowCount === 0) {
      await client.query("ROLLBACK");
      return bad("Asset not found", 404);
    }
    const current = cur.rows[0] as {
      asset_tag: string | null;
      serialnumber: string | null;
    };

    // sanitize
    const v = parsed.data;
    const updates: Record<string, any> = {
      asset_tag: undefIfEmpty(trim(v.asset_tag)),
      serialnumber: undefIfEmpty(trim(v.serialnumber)),
      manufacturer: undefIfEmpty(trim(v.manufacturer)),
      model: undefIfEmpty(trim(v.model)),
      purchaseprice: v.purchaseprice ?? undefined,
      supplier: undefIfEmpty(trim(v.supplier)),
      type: undefIfEmpty(trim(v.type)),
      status: v.status ?? undefined,
      location: v.location ?? undefined,
      department: v.department ?? undefined,
      operatingsystem: undefIfEmpty(trim(v.operatingsystem)),
      processor: undefIfEmpty(trim(v.processor)),
      memory: undefIfEmpty(trim(v.memory)),
      storage: undefIfEmpty(trim(v.storage)),
      hostname: undefIfEmpty(trim(v.hostname)),
      ipaddress: undefIfEmpty(trim(v.ipaddress)),
      macaddress: undefIfEmpty(trim(v.macaddress)),
      patchstatus: v.patchstatus ?? undefined,
      description: v.description ?? null,
      notes: v.notes ?? null,
      purchasedate: toISOorNull(v.purchasedate),
      warrantyexpiry: toISOorNull(v.warrantyexpiry),
      lastpatch_check: toISOorNull(v.lastpatch_check),
      
      assigneduser:  v.assigneduser === "-" ? null : undefIfEmpty(trim(v.assigneduser)),
      isloanable: typeof v.isloanable === "boolean" ? v.isloanable : undefined,
      condition: undefIfEmpty(trim(v.condition)),
    };

    // duplicate checks (เฉพาะเมื่อเปลี่ยนจริง)
    // ===== Duplicate checks (เช็คเฉพาะเมื่อมีการเปลี่ยนจริง) =====
    const has = (o: Record<string, any>, k: string) =>
      Object.prototype.hasOwnProperty.call(o, k);

    // util: เช็คว่ามีเรคคอร์ดอื่นที่ค่าชนกันหรือไม่ (เร็วและพิมพ์เล็ก/ใหญ่ไม่ต่างกัน)
    const exists = async (sql: string, params: any[]) => {
      const { rows } = await client.query<{ exists: boolean }>(
        `SELECT EXISTS (${sql}) AS exists`,
        params
      );
      return !!rows?.[0]?.exists;
    };

    // asset_tag
    if (
      has(updates, "asset_tag") &&
      (updates.asset_tag ?? null) !== (current.asset_tag ?? null)
    ) {
      const isDup = await exists(
        `SELECT 1 FROM assets
     WHERE LOWER(asset_tag) = LOWER($1) AND id <> $2
     LIMIT 1`,
        [updates.asset_tag, id]
      );
      if (isDup) {
        await client.query("ROLLBACK");
        return bad("Duplicate asset tag", 409);
      }
    }

    // serialnumber
    if (
      has(updates, "serialnumber") &&
      (updates.serialnumber ?? null) !== (current.serialnumber ?? null)
    ) {
      const isDup = await exists(
        `SELECT 1 FROM assets
     WHERE LOWER(serialnumber) = LOWER($1) AND id <> $2
     LIMIT 1`,
        [updates.serialnumber, id]
      );
      if (isDup) {
        await client.query("ROLLBACK");
        return bad("Duplicate serial number", 409);
      }
    }

    // build UPDATE
    const sets: string[] = [];
    const vals: any[] = [];
    let i = 1;
    for (const [k, val] of Object.entries(updates)) {
      if (val !== undefined) {
        sets.push(`${k} = $${i++}`);
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

    const sql = `UPDATE assets SET ${sets.join(
      ", "
    )} WHERE id = $${i} RETURNING *`;
    const up = await client.query(sql, vals);

    await client.query("COMMIT");
    return ok(up.rows[0]);
  } catch (e: any) {
    await client.query("ROLLBACK");
    console.error("[PUT asset]", e);
    const msg = String(e?.message || e);
    if (/unique|duplicate/i.test(msg))
      return bad("Duplicate value detected", 409);
    return bad("Failed to update asset", 500);
  } finally {
    client.release();
  }
}

/** DELETE /api/assets/[id] */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const r = await client.query(
      "DELETE FROM assets WHERE id = $1 RETURNING id",
      [params.id]
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
