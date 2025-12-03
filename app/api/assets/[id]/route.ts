// app/api/assets/[id]/route.ts
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { z } from "zod";

const price = z.preprocess((v) => {
  if (v === "" || v == null) return null;
  const n = typeof v === "number" ? v : Number(String(v).replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}, z.number().nullable());

const strToNull = (v: unknown) => {
  if (v === undefined) return undefined;
  if (v === null) return null;
  if (typeof v === "string" && v.trim() === "") return null;
  return typeof v === "string" ? v.trim() : v;
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

const assetUpdateSchema = z.object({
  asset_tag: z.string().min(1).optional(),
  serialnumber: z.string().nullable().optional(),
  manufacturer: z.string().nullable().optional(),
  model: z.string().nullable().optional(),
  purchaseprice: price.optional(),
  supplier: z.string().nullable().optional(),
  type: z.string().optional(),
  status: z.string().optional(),
  location: z.string().nullable().optional(),
  department: z.string().nullable().optional(),
  operatingsystem: z.string().nullable().optional(),
  processor: z.string().nullable().optional(),
  memory: z.string().nullable().optional(),
  storage: z.string().nullable().optional(),
  hostname: z.string().nullable().optional(),
  ipaddress: z.string().nullable().optional(),
  macaddress: z.string().nullable().optional(),
  patchstatus: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  purchasedate: z.string().nullable().optional(),
  warrantyexpiry: z.string().nullable().optional(),
  lastpatch_check: z.string().nullable().optional(),
  assigneduser: z.string().nullable().optional(),
  isloanable: z.boolean().optional(),
  condition: z.string().nullable().optional(),
}).partial();

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const { id } = params;
  let result = await pool.query(
    `SELECT * FROM assets WHERE id::text = $1 OR asset_tag = $1 OR serialnumber = $1 LIMIT 1`,
    [id]
  );
  if (result.rowCount === 0) return NextResponse.json({ success: false, error: 'Asset not found' }, { status: 404 });
  const asset = result.rows[0];
  delete asset.delete_at;
  return NextResponse.json({ success: true, data: asset });
}

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
      return bad(parsed.error.errors.map((e) => e.message).join("; "), 400);
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

    // Map frontend fields to actual database columns
    const updates: Record<string, any> = {
      asset_tag: strToNull(v.asset_tag),
      serialnumber: strToNull(v.serialnumber),
      manufacturer: strToNull(v.manufacturer),
      model: strToNull(v.model),
      purchaseprice: v.purchaseprice,
      supplier: strToNull(v.supplier),
      type: strToNull(v.type),
      status: strToNull(v.status),
      location: strToNull(v.location),
      department: strToNull(v.department),
      operatingsystem: strToNull(v.operatingsystem),
      processor: strToNull(v.processor),
      memory: strToNull(v.memory),
      storage: strToNull(v.storage),
      hostname: strToNull(v.hostname),
      ip_address: strToNull(v.ipaddress),      // DB column is ip_address
      mac_address: strToNull(v.macaddress),    // DB column is mac_address
      patchstatus: strToNull(v.patchstatus),
      description: strToNull(v.description),
      notes: strToNull(v.notes),
      purchasedate: toISOorNull(v.purchasedate),
      warrantyexpiry: toISOorNull(v.warrantyexpiry),
      lastpatch_check: toISOorNull(v.lastpatch_check),
      assigneduser: strToNull(v.assigneduser),
      isloanable: v.isloanable,
      condition: strToNull(v.condition),
    };

    if (updates.asset_tag && updates.asset_tag !== current.asset_tag) {
      const isDup = await client.query("SELECT 1 FROM assets WHERE LOWER(asset_tag) = LOWER($1) AND id <> $2", [updates.asset_tag, id]);
      if (isDup.rowCount && isDup.rowCount > 0) { await client.query("ROLLBACK"); return bad("Duplicate asset tag", 409); }
    }
    if (updates.serialnumber && updates.serialnumber !== current.serialnumber) {
      const isDup = await client.query("SELECT 1 FROM assets WHERE LOWER(serialnumber) = LOWER($1) AND id <> $2", [updates.serialnumber, id]);
      if (isDup.rowCount && isDup.rowCount > 0) { await client.query("ROLLBACK"); return bad("Duplicate serial number", 409); }
    }

    const sets: string[] = [];
    const vals: any[] = [];
    let i = 1;
    for (const [k, val] of Object.entries(updates)) {
      if (val !== undefined) {
        sets.push(`"${k}" = $${i++}`);
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

export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id } = params;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const r = await client.query("DELETE FROM assets WHERE id = $1 RETURNING id", [id]);
    if (r.rowCount === 0) { await client.query("ROLLBACK"); return bad("Asset not found", 404); }
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