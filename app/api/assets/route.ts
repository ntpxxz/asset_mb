import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { z } from 'zod';

// Zod schema for asset creation validation
const assetCreateSchema = z.object({
  asset_tag: z.string().min(1, "Asset tag is required"),
  type: z.string().min(1, "Asset type is required"),
  manufacturer: z.string().min(1, "Manufacturer is required"),
  model: z.string().min(1, "Model is required"),
  serialnumber: z.string().min(1, "Serial number is required"),
  purchasedate: z.string().optional().nullable(),
  purchaseprice: z.union([z.number(), z.string()]).optional().nullable().transform((val) => {
    if (val === null || val === undefined || val === '') return null;
    return typeof val === 'string' ? parseFloat(val) : val;
  }),
  supplier: z.string().optional().nullable(),
  warrantyexpiry: z.string().optional().nullable(),
  assigneduser: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  department: z.string().optional().nullable(),
  status: z.string().default('in-stock'),
  operatingsystem: z.string().optional().nullable(),
  processor: z.string().optional().nullable(),
  memory: z.string().optional().nullable(),
  storage: z.string().optional().nullable(),
  hostname: z.string().optional().nullable(),
  ipaddress: z.string().optional().nullable(),
  macaddress: z.string().optional().nullable(),
  patchstatus: z.string().default('needs-review'),
  lastpatch_check: z.string().optional().nullable(),
  isloanable: z.boolean().default(false),
  condition: z.enum(['new', 'good', 'fair', 'poor', 'broken']).default('good'),
  description: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  // New fields
  building: z.string().optional().nullable(),
  division: z.string().optional().nullable(),
  section: z.string().optional().nullable(),
  area: z.string().optional().nullable(),
  pc_name: z.string().optional().nullable(),
  os_key: z.string().optional().nullable(),
  os_version: z.string().optional().nullable(),
  ms_office_apps: z.string().optional().nullable(),
  ms_office_version: z.string().optional().nullable(),
  is_legally_purchased: z.string().optional().nullable(),
});

// Helper function to clean data
function cleanCreateData(data: any) {
  const cleaned: any = {};

  Object.entries(data).forEach(([key, value]) => {
    // Skip undefined values
    if (value === undefined) return;

    // Convert empty strings to null for optional fields
    if (value === '') {
      cleaned[key] = null;
    } else {
      cleaned[key] = value;
    }
  });

  return cleaned;
}

// GET /api/assets — map assets.assigneduser (employee_id) -> users.firstname

export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/assets - Loading all assets');
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');

    // server-side pagination (default 20/หน้า)
    const limit = Number(searchParams.get('limit') ?? 20);
    const offset = Number(searchParams.get('offset') ?? 0);

    const params: any[] = [];
    const conds: string[] = [];
    if (status) { params.push(status); conds.push(`a.status = $${params.length}`); }
    if (type && type !== 'all') {
      if (type === 'computer') {
        const computerTypes = ['laptop', 'desktop', 'phone', 'tablet', 'PC', 'NB'];
        params.push(computerTypes);
        conds.push(`a.type = ANY($${params.length}::text[])`);
      } else if (type === 'network') {
        const networkTypes = ['router', 'switch', 'firewall', 'access-point', 'gateway'];
        params.push(networkTypes);
        conds.push(`a.type = ANY($${params.length}::text[])`);
      } else {
        params.push(type);
        conds.push(`a.type = $${params.length}`);
      }
    }
    const whereSql = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

    // จับคู่ employee_id ใน a.assigneduser กับ users.employee_id
    // แล้ว "แทนค่า" assigneduser ในผลลัพธ์ให้เป็น firstname (ถ้าเจอ)
    params.push(limit, offset);
    const sql = `
      SELECT
        a.*,
        u.firstname AS assigned_firstname,
        u.employee_id AS assigned_employee_id_resolved,
        COALESCE(u.firstname, a.assigneduser, '-') AS assigneduser, -- <-- ส่งกลับชื่อแทน id
        COUNT(*) OVER() AS total_count
      FROM assets a
      LEFT JOIN users u
        ON a.assigneduser = u.employee_id  -- assigneduser เก็บ emp id
      ${whereSql}
      ORDER BY a.created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `;
    const result = await pool.query(sql, params);
    const total = result.rows[0]?.total_count ?? 0;

    // ส่ง field เพิ่มเติมเผื่อหน้าใหม่อยากใช้แยก
    const data = result.rows.map(r => ({
      ...r,
      assigned_employee_id: r.assigned_employee_id_resolved ?? null,
      assigned_firstname: r.assigned_firstname ?? null,
      // assigneduser ถูกทำให้เป็น firstname แล้วจาก COALESCE ใน SQL
    }));

    return NextResponse.json({
      success: true,
      data,
      count: result.rowCount,
      total,
      message: `Loaded ${result.rowCount} assets`,
    });
  } catch (error: any) {
    console.error('Failed to fetch assets:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch assets', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/assets - Create new asset
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const sanitize = (v: any) =>
      v === undefined || v === null || v === '' || v === '-' ? null : v;

    console.log('POST /api/assets - Received data:', body);

    // Auto-generate asset_tag if not provided
    if (!body.asset_tag || String(body.asset_tag).trim() === '') {
      body.asset_tag = `AST-${Date.now()}`;
    }

    // Validate the request data
    const validationResult = assetCreateSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: errors },
        { status: 400 }
      );
    }

    const cleanedData = cleanCreateData(validationResult.data);

    // ---- Resolve assigneduser -> employee_id (NO rowCount used) ----
    const rawAssigned: string | null =
      (cleanedData.assigneduser ?? '').toString().trim() || null;

    let resolvedEmpId: string | null = null;
    if (rawAssigned) {
      // 1) Try as employee_id
      const resId = await pool.query(
        'SELECT employee_id FROM users WHERE employee_id = $1',
        [rawAssigned]
      );
      if (resId.rows.length > 0) {
        resolvedEmpId = resId.rows[0].employee_id;
      } else {
        // 2) Try as firstname
        const resName = await pool.query(
          'SELECT employee_id FROM users WHERE firstname ILIKE $1',
          [rawAssigned]
        );
        if (resName.rows.length > 0) {
          resolvedEmpId = resName.rows[0].employee_id;
        } else {
          // 3) Use as free text
          resolvedEmpId = rawAssigned;
        }
      }
    }

    // Update cleanedData with the resolved value (or null)
    cleanedData.assigneduser = resolvedEmpId;

    const fieldMapping = {
      asset_tag: 'asset_tag',
      type: 'type',
      manufacturer: 'manufacturer',
      model: 'model',
      serialnumber: 'serialnumber',
      purchasedate: 'purchasedate',
      purchaseprice: 'purchaseprice',
      supplier: 'supplier',
      warrantyexpiry: 'warrantyexpiry',
      assigneduser: 'assigneduser',
      location: 'location',
      department: 'department',
      status: 'status',
      condition: 'condition',
      operatingsystem: 'operatingsystem',
      processor: 'processor',
      memory: 'memory',
      storage: 'storage',
      hostname: 'hostname',
      ipaddress: 'ipaddress',
      macaddress: 'macaddress',
      patchstatus: 'patchstatus',
      lastpatch_check: 'lastpatch_check',
      isloanable: 'isloanable',
      description: 'description',
      notes: 'notes',
      // New fields
      building: 'building',
      division: 'division',
      section: 'section',
      area: 'area',
      pc_name: 'pc_name',
      os_key: 'os_key',
      os_version: 'os_version',
      ms_office_apps: 'ms_office_apps',
      ms_office_version: 'ms_office_version',
      is_legally_purchased: 'is_legally_purchased',
    } as const;

    const mappedData: Record<string, any> = {};
    Object.entries(cleanedData).forEach(([key, value]) => {
      // @ts-ignore dynamic mapping
      const dbCol = fieldMapping[key];
      if (dbCol && value !== undefined) {
        mappedData[dbCol] = value;
      }
    });

    const insertFields = Object.keys(mappedData);
    const insertValues = Object.values(mappedData);

    if (insertFields.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid fields to insert' },
        { status: 400 }
      );
    }

    const placeholders = insertFields.map((_, i) => `$${i + 1}`).join(', ');
    const columns = insertFields.join(', ');

    const query = `
      INSERT INTO assets (${columns}, created_at, updated_at)
      VALUES (${placeholders}, NOW(), NOW())
      RETURNING *;
    `;

    console.log('Executing Insert Query:', query);
    console.log('With Parameters:', insertValues);

    const result = await pool.query(query, insertValues);
    const newAsset = result.rows?.[0];
    if (!newAsset) {
      return NextResponse.json(
        { success: false, error: 'Insert failed' },
        { status: 500 }
      );
    }

    // Optional: enrich response with firstname for UI convenience
    let assignedFirstname: string | null = null;
    if (resolvedEmpId) {
      const r = await pool.query(
        `SELECT firstname FROM users WHERE employee_id = $1 LIMIT 1`,
        [resolvedEmpId]
      );
      assignedFirstname = r.rows?.[0]?.firstname ?? null;
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          ...newAsset,
          assigned_employee_id: resolvedEmpId,
          assigned_firstname: assignedFirstname,
          // ถ้าหน้าปัจจุบันยังอ่าน asset.assigneduser:
          // ส่งชื่อกลับไปให้ด้วยเพื่อแสดงผลทันที (fallback เป็น emp id/'-')
          assigneduser:
            assignedFirstname ??
            newAsset.assigneduser ??
            '-',
        },
        message: `Asset "${newAsset.asset_tag}" created successfully`,
        timestamp: new Date().toISOString(),
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Failed to create asset:', error);

    // Common Postgres error codes
    if (error.code === '42703') {
      return NextResponse.json(
        {
          success: false,
          error: `Database column not found: ${error.message}`,
          hint: 'Please check if column names match your database schema',
        },
        { status: 400 }
      );
    }
    if (error.code === '23505') {
      return NextResponse.json(
        {
          success: false,
          error:
            'Duplicate value detected. Asset tag or serial number may already exist.',
        },
        { status: 409 }
      );
    }
    if (error.code === '23502') {
      return NextResponse.json(
        {
          success: false,
          error: `Required field is missing: ${error.column || 'unknown'}`,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create asset', details: error.message },
      { status: 500 }
    );
  }
}