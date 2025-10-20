import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { z } from "zod";

const patchSchema = z.object({
  title: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  status: z.string().optional().nullable(),
});

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: Ctx) {
  const params = await context.params;
  const id = params.id;
  try {
    const { rows } = await pool.query("SELECT * FROM patches WHERE id = $1", [id]);
    if (!rows.length) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: Ctx) {
  const params = await context.params;
  const id = params.id;
  try {
    const body = await request.json();
    const parsed = patchSchema.parse(body);
    const client = await pool.connect();
    await client.query("BEGIN");
    const { rows } = await client.query(
      `UPDATE patches SET title=$1, description=$2, status=$3 WHERE id=$4 RETURNING *`,
      [parsed.title ?? null, parsed.description ?? null, parsed.status ?? null, id]
    );
    await client.query("COMMIT");
    client.release();
    if (!rows.length) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: rows[0] });
  } catch (error: any) {
    console.error("PUT error:", error);
    try { await (pool as any).query("ROLLBACK"); } catch {}
    return NextResponse.json({ success: false, error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: Ctx) {
  const params = await context.params;
  const id = params.id;
  try {
    const client = await pool.connect();
    const { rowCount } = await client.query("DELETE FROM patches WHERE id = $1", [id]);
    client.release();
    if (!rowCount) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true, message: "Deleted" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
