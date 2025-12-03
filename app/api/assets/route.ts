import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { z } from 'zod';

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

function cleanCreateData(data: any) {
  const cleaned: any = {};
  Object.entries(data).forEach(([key, value]) => {
    if (value === undefined) return;
    cleaned[key] = value === '' ? null : value;
  });
  return cleaned;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const limit = Number(searchParams.get('limit') ?? 20);
    const offset = Number(searchParams.get('offset') ?? 0);

    const params: any[] = [];
    const conds: string[] = [];

    if (status) {
      params.push(status);
      conds.push(`a.status = $${params.length}`);
    }

    if (type && type !== 'all') {
      if (type === 'computer') {
        const computerTypes = ['laptop', 'notebook', 'nb', 'desktop', 'pc', 'computer', 'workstation', 'all-in-one', 'aio', 'server', 'tablet', 'ipad', 'phone', 'smartphone', 'mobile'];
        params.push(computerTypes);
        conds.push(`LOWER(a.type) = ANY($${params.length}::text[])`);
      } else if (type === 'network') {
        const networkTypes = ['router', 'switch', 'network-switch', 'firewall', 'access-point', 'gateway', 'modem'];
        params.push(networkTypes);
        conds.push(`LOWER(a.type) = ANY($${params.length}::text[])`);
      } else {
        params.push(type.toLowerCase());
        conds.push(`LOWER(a.type) = $${params.length}`);
      }
    }

    const whereSql = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
    params.push(limit, offset);

    const sql = `
      SELECT a.*, u.firstname AS assigned_firstname, u.employee_id AS assigned_employee_id_resolved,
        COALESCE(u.firstname, a.assigneduser, '-') AS assigneduser, COUNT(*) OVER() AS total_count
      FROM assets a
      LEFT JOIN users u ON a.assigneduser = u.employee_id
      ${whereSql}
      ORDER BY a.created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `;

    const result = await pool.query(sql, params);
    const total = result.rows[0]?.total_count ?? 0;

    return NextResponse.json({
      success: true,
      data: result.rows.map(r => ({ ...r, assigned_employee_id: r.assigned_employee_id_resolved ?? null, assigned_firstname: r.assigned_firstname ?? null })),
      count: result.rowCount,
      total,
      message: `Loaded ${result.rowCount} assets`,
    });
  } catch (error: any) {
    console.error('Failed to fetch assets:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch assets', details: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.asset_tag || String(body.asset_tag).trim() === '') {
      body.asset_tag = `AST-${Date.now()}`;
    }

    const validationResult = assetCreateSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validationResult.error.errors.map(err => ({ field: err.path.join('.'), message: err.message })) },
        { status: 400 }
      );
    }

    const cleanedData = cleanCreateData(validationResult.data);

    const rawAssigned: string | null = (cleanedData.assigneduser ?? '').toString().trim() || null;
    let resolvedEmpId: string | null = null;

    if (rawAssigned) {
      const resId = await pool.query('SELECT employee_id FROM users WHERE employee_id = $1', [rawAssigned]);
      if (resId.rows.length > 0) {
        resolvedEmpId = resId.rows[0].employee_id;
      } else {
        const resName = await pool.query('SELECT employee_id FROM users WHERE firstname ILIKE $1', [rawAssigned]);
        resolvedEmpId = resName.rows.length > 0 ? resName.rows[0].employee_id : rawAssigned;
      }
    }
    cleanedData.assigneduser = resolvedEmpId;

    // ACTUAL DATABASE COLUMN MAPPING (verified from information_schema)
    const fieldMapping: Record<string, string> = {
      asset_tag: 'asset_tag', type: 'type', manufacturer: 'manufacturer', model: 'model',
      serialnumber: 'serialnumber', purchasedate: 'purchasedate', purchaseprice: 'purchaseprice',
      supplier: 'supplier', warrantyexpiry: 'warrantyexpiry', assigneduser: 'assigneduser',
      location: 'location', department: 'department', status: 'status', condition: 'condition',
      operatingsystem: 'operatingsystem', processor: 'processor', memory: 'memory', storage: 'storage',
      hostname: 'hostname',
      ipaddress: 'ip_address',           // DB column is ip_address (with underscore)
      macaddress: 'mac_address',         // DB column is mac_address (with underscore)
      patchstatus: 'patchstatus', lastpatch_check: 'lastpatch_check', isloanable: 'isloanable',
      description: 'description', notes: 'notes', building: 'building', division: 'division',
      section: 'section', area: 'area', pc_name: 'pc_name', os_key: 'os_key', os_version: 'os_version',
      ms_office_apps: 'ms_office_apps', ms_office_version: 'ms_office_version',
      is_legally_purchased: 'is_legally_purchased',
    };

    const mappedData: Record<string, any> = {};
    Object.entries(cleanedData).forEach(([key, value]) => {
      const dbCol = fieldMapping[key];
      if (dbCol && value !== undefined) {
        mappedData[dbCol] = value;
      }
    });

    const insertFields = Object.keys(mappedData);
    const insertValues = Object.values(mappedData);

    if (insertFields.length === 0) {
      return NextResponse.json({ success: false, error: 'No valid fields' }, { status: 400 });
    }

    const placeholders = insertFields.map((_, i) => `$${i + 1}`).join(', ');
    const columns = insertFields.join(', ');

    const query = `INSERT INTO assets (${columns}, created_at, updated_at) VALUES (${placeholders}, NOW(), NOW()) RETURNING *;`;

    const result = await pool.query(query, insertValues);
    const newAsset = result.rows?.[0];

    let assignedFirstname: string | null = null;
    if (resolvedEmpId) {
      const r = await pool.query(`SELECT firstname FROM users WHERE employee_id = $1 LIMIT 1`, [resolvedEmpId]);
      assignedFirstname = r.rows?.[0]?.firstname ?? null;
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          ...newAsset,
          assigned_employee_id: resolvedEmpId,
          assigned_firstname: assignedFirstname,
          assigneduser: assignedFirstname ?? newAsset.assigneduser ?? '-',
        },
        message: `Asset "${newAsset.asset_tag}" created successfully`,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Failed to create asset:', error);
    if (error.code === '23505') return NextResponse.json({ success: false, error: 'Duplicate asset tag or serial number.' }, { status: 409 });
    return NextResponse.json({ success: false, error: 'Failed to create asset', details: error.message }, { status: 500 });
  }
}