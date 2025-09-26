import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { z } from 'zod';
import { QueryResult } from "pg";

const borrowingSchema = z.object({
  asset_tag: z.string().min(1, "Asset ID is required"),
  borrowername: z.string().min(1, "Borrower name is required"),      
  borrowercontact: z.string().optional(),                       
  checkout_date: z.string(),
  due_date: z.string().optional(),
  location: z.string().optional(),
  status: z.string().optional().default('checked_out'),         
  purpose: z.string().optional(),
  notes: z.string().optional(),
});

const checkinSchema = z.object({
  id: z.string().min(1, "Borrowing ID is required"),
  action: z.literal('checkin'),
  condition: z.string().optional(),
  damage_reported: z.boolean().optional().default(false),
  damage_description: z.string().optional(),
  maintenance_required: z.boolean().optional().default(false),
  maintenance_notes: z.string().optional(),
  returned_by_name: z.string().optional(),
});

function normalizePayload(raw: unknown) {
  const parsed = borrowingSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false as const, error: "Invalid input", details: parsed.error.flatten() };
  }
  const v = parsed.data;

  const asset_tag     = (v.asset_tag ?? "").trim();
  const borrowername  = (v.borrowername ?? "").trim();
  const checkout_date = (v.checkout_date ?? "").trim();
  const due_date      = (v.due_date ?? null) || null;
  const purpose       = v.purpose ?? null;
  const location      = v.location ?? null;
  const notes         = v.notes ?? null;
  const status        = (v.status ?? "checked_out").trim();
  const borrowercontact = v.borrowercontact ?? null;

  const fieldErrors: Record<string, string[]> = {};
  if (!asset_tag)     fieldErrors.asset_tag = ["Required"];
  if (!borrowername)  fieldErrors.borrowername = ["Required"];
  if (!checkout_date) fieldErrors.checkout_date = ["Required"];
  if (Object.keys(fieldErrors).length) {
    return { ok: false as const, error: "Invalid input", details: { formErrors: [], fieldErrors } };
  }

  return {
    ok: true as const,
    data: { asset_tag, borrowername, borrowercontact, checkout_date, due_date, purpose, location, notes, status },
  };
}

// GET /api/borrowing - Get all borrow records
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const user_id = searchParams.get('user_id');
  const asset_tag = searchParams.get('asset_tag');

  let query = 'SELECT * FROM asset_borrowing';
  const queryParams: any[] = [];
  const whereClauses: string[] = [];

  if (status && status !== 'all') {
    whereClauses.push(`status = $${queryParams.length + 1}`);
    queryParams.push(status);
  }

  if (user_id) {
    whereClauses.push(`borrowername = $${queryParams.length + 1}`);
    queryParams.push(user_id);
  }
  
  if (asset_tag) {
    whereClauses.push(`asset_tag = $${queryParams.length + 1}`);
    queryParams.push(asset_tag);
  }

  if (whereClauses.length > 0) {
    query += ' WHERE ' + whereClauses.join(' AND ');
  }

  query += ' ORDER BY created_at DESC';

  try {
    const result = await pool.query(query, queryParams);
    return NextResponse.json({
      success: true,
      data: result.rows,
      total: result.rowCount
    });
  } catch (error) {
    console.error('Failed to fetch borrow records:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch borrow records' },
      { status: 500 }
    );
  }
}

// POST /api/borrowing - Create new borrow record (checkout)
const q = (c: string) => `"${c.replace(/"/g, '""')}"`;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const norm = normalizePayload(body);
    if (!norm.ok) {
      return NextResponse.json({ success: false, error: norm.error, details: norm.details }, { status: 400 });
    }
    const p = norm.data;

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // 1) ดึง asset แบบใช้ asset_tag
      const assetQ = await client.query(`SELECT * FROM assets WHERE asset_tag = $1 LIMIT 1`, [p.asset_tag]);
      if (!assetQ.rowCount) {
        await client.query("ROLLBACK");
        return NextResponse.json({ success: false, error: "Asset not found" }, { status: 404 });
      }
      const a = assetQ.rows[0];

      // 2) ตรวจสอบความพร้อม
      const statusRaw = String(a.status ?? a.Status ?? a.asset_status ?? a.state ?? "available");
      const okStatus = ["available", "active"].includes(statusRaw.toLowerCase());
      const rawLoan = a.isloanable ?? a.isLoanable ?? a.loanable ?? a.can_borrow ?? true;
      const okLoanable = rawLoan === true || rawLoan === 1 || String(rawLoan).toLowerCase() === "true";
      if (!(okStatus && okLoanable)) {
        await client.query("ROLLBACK");
        return NextResponse.json({ success: false, error: "Asset is not available for borrowing" }, { status: 400 });
      }

      // 3) ตรวจสอบตาราง borrowing/asset_borrowing
      let tableName = 'borrowing';
      const tableCheckRes = await client.query(
        `SELECT table_name FROM information_schema.tables 
         WHERE table_schema='public' AND table_name IN ('borrowing', 'asset_borrowing')`
      );
      const availableTables = tableCheckRes.rows.map(r => r.table_name);
      
      if (availableTables.includes('asset_borrowing')) {
        tableName = 'asset_borrowing';
      } else if (!availableTables.includes('borrowing')) {
        await client.query("ROLLBACK");
        return NextResponse.json(
          { success: false, error: "No borrowing table found" },
          { status: 500 }
        );
      }

      // 4) ตรวจสอบคอลัมน์ในตาราง
      const colsRes = await client.query(
        `SELECT column_name FROM information_schema.columns
         WHERE table_schema='public' AND table_name=$1`,
        [tableName]
      );
      const cols = new Set<string>(colsRes.rows.map((r: any) => r.column_name));

      // 5) ตรวจสอบการยืมซ้ำ
      if (cols.has("status")) {
        const dup = await client.query(
          `SELECT 1 FROM ${tableName}
            WHERE asset_tag = $1
              AND LOWER(REPLACE(status,' ', '_')) IN ('checked_out', 'checked-out')
           LIMIT 1`,
          [p.asset_tag]
        );
        if (dup.rowCount) {
          await client.query("ROLLBACK");
          return NextResponse.json(
            { success: false, error: "This asset is already checked out" },
            { status: 409 }
          );
        }
      }

      // 6) สร้าง mapping สำหรับ INSERT (ไม่รวม id เพื่อให้ auto-increment ทำงาน)
      const mapping: Record<string, any> = {};
      mapping["asset_tag"] = p.asset_tag;

      if (cols.has("borrowername"))    mapping["borrowername"] = p.borrowername;
      if (cols.has("borrowercontact")) mapping["borrowercontact"] = p.borrowercontact;
      if (cols.has("checkout_date"))   mapping["checkout_date"] = p.checkout_date;
      if (cols.has("due_date"))        mapping["due_date"] = p.due_date;
      if (cols.has("status"))          mapping["status"] = p.status;
      if (cols.has("purpose"))         mapping["purpose"] = p.purpose;
      if (cols.has("location"))        mapping["location"] = p.location;
      if (cols.has("notes"))           mapping["notes"] = p.notes;

      // เพิ่ม timestamp fields ถ้ามี
      if (cols.has("created_at")) mapping["created_at"] = new Date().toISOString();
      if (cols.has("updated_at")) mapping["updated_at"] = new Date().toISOString();

      const insertCols = Object.keys(mapping);
      const placeholders = insertCols.map((_, i) => `$${i + 1}`).join(", ");
      const values = insertCols.map((c) => mapping[c] ?? null);

      if (insertCols.length === 0) {
        await client.query("ROLLBACK");
        return NextResponse.json(
          { success: false, error: `No insertable columns were found in '${tableName}' table` },
          { status: 500 }
        );
      }

      type ColumnInfo = {
        column_default: string | null;
      };
      
      const idColRes: QueryResult<ColumnInfo> = await pool.query(
        `SELECT column_default FROM information_schema.columns 
         WHERE table_name = 'asset_borrowing' AND column_name = 'id'`
      );
      
      let needsIdFix = false;
      if ((idColRes?.rowCount ?? 0) > 0) {
        const idCol = idColRes.rows[0];
        const hasDefault =
          idCol.column_default &&
          (idCol.column_default.includes("nextval") ||
            idCol.column_default.includes("serial") ||
            idCol.column_default.includes("IDENTITY"));
      
        if (!hasDefault) {
          needsIdFix = true;
          // สร้าง ID ในรูปแบบ BR-ddmmyyyy0xxx
          const now = new Date();
          const day = String(now.getDate()).padStart(2, '0');
          const month = String(now.getMonth() + 1).padStart(2, '0');
          const year = now.getFullYear();
          const datePrefix = `${day}${month}${year}`;
          
          // หาหมายเลขลำดับถัดไป สำหรับวันนี้
          const todayPattern = `BR-${datePrefix}%`;
          const countRes = await client.query(
            `SELECT COUNT(*) as count FROM ${tableName} WHERE id LIKE $1`,
            [todayPattern]
          );
          
          const nextSequence = (countRes.rows[0].count || 0) + 1;
          const sequenceStr = String(nextSequence).padStart(4, '0');
          
          const nextId = `BR-${datePrefix}${sequenceStr}`;
          
          mapping["id"] = nextId;
          insertCols.push("id");
          values.push(nextId);
        }
      }

      // อัปเดต placeholders หลังจากเพิ่ม id
      const finalPlaceholders = insertCols.map((_, i) => `$${i + 1}`).join(", ");

      const sql = `
        INSERT INTO ${tableName} (${insertCols.map(c => `"${c}"`).join(", ")})
        VALUES (${finalPlaceholders})
        RETURNING *
      `;
      
      console.log('INSERT SQL:', sql);
      console.log('INSERT VALUES:', values);
      
      const ins = await client.query(sql, values);

      // ไม่ต้องอัปเดต sequence เพราะใช้ custom ID format แล้ว

      await client.query("COMMIT");
      return NextResponse.json({ success: true, data: ins.rows[0] }, { status: 201 });
    } catch (e: any) {
      await client.query("ROLLBACK");
      console.error("POST /api/borrowing error:", e?.message || e);
      return NextResponse.json(
        { success: false, error: "Failed to create borrowing record", detail: String(e?.message || e) },
        { status: 500 }
      );
    } finally {
      client.release();
    }
  } catch (e: any) {
    console.error("POST /api/borrowing parse error:", e?.message || e);
    return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }
}

// PUT /api/borrowing - Update borrow record (check-in)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = checkinSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { 
      id, action, condition, damage_reported, damage_description, 
      maintenance_required, maintenance_notes, returned_by_name 
    } = validation.data;

    if (action === 'checkin') {
      const checkin_date = new Date().toISOString();
      const updated_at = new Date().toISOString();

      // Start transaction
      const client = await pool.connect();
      
      try {
        await client.query('BEGIN');

        // ตรวจสอบตาราง
        let tableName = 'asset_borrowing';
        const tableCheck = await client.query(
          `SELECT table_name FROM information_schema.tables 
           WHERE table_schema='public' AND table_name IN ('borrowing', 'asset_borrowing')`
        );
        const availableTables = tableCheck.rows.map(r => r.table_name);
        
        if (availableTables.includes('asset_borrowing')) {
          tableName = 'asset_borrowing';
        } else if (availableTables.includes('borrowing')) {
          tableName = 'borrowing';
        } else {
          await client.query('ROLLBACK');
          return NextResponse.json(
            { success: false, error: 'No borrowing table found' },
            { status: 500 }
          );
        }

        // Get the borrow record
        const getBorrowQuery = `
          SELECT asset_tag, status FROM ${tableName} WHERE id = $1
        `;
        const borrowResult = await client.query(getBorrowQuery, [id]);
        
        if (borrowResult.rows.length === 0) {
          await client.query('ROLLBACK');
          return NextResponse.json(
            { success: false, error: 'Borrow record not found' },
            { status: 404 }
          );
        }

        const borrowRecord = borrowResult.rows[0];
        
        // Check if already returned
        if (borrowRecord.status === 'returned') {
          await client.query('ROLLBACK');
          return NextResponse.json(
            { success: false, error: 'Asset is already returned' },
            { status: 400 }
          );
        }

        // Update borrow record with all return information
        const updateBorrowQuery = `
          UPDATE ${tableName} 
          SET 
            status = 'returned', 
            checkin_date = $1, 
            updated_at = $2,
            condition = $3,
            damage_reported = $4,
            damage_description = $5,
            maintenance_required = $6,
            maintenance_notes = $7,
            returned_by_name = $8
          WHERE id = $9
          RETURNING *;
        `;
        
        const updateParams = [
          checkin_date, updated_at, condition, damage_reported, 
          damage_description, maintenance_required, maintenance_notes, 
          returned_by_name, id
        ];
        
        const updateResult = await client.query(updateBorrowQuery, updateParams);

        await client.query('COMMIT');

        return NextResponse.json({
          success: true,
          data: updateResult.rows[0],
          message: 'Asset checked in successfully'
        });
        
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Failed to update borrow record:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update borrow record' },
      { status: 500 }
    );
  }
}