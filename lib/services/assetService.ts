import pool from '@/lib/db';
import { z } from 'zod';

const assetSchema = z.object({
  asset_tag: z.string().min(1, "Asset tag is required"),
  type: z.string().optional(),
  manufacturer: z.string().optional(),
  model: z.string().optional(),
  serialnumber: z.string().min(1, "Serial number is required"),
  purchasedate: z.string().optional(),
  purchaseprice: z.coerce.number().optional(),
  supplier: z.string().optional(),
  warrantyexpiry: z.string().optional(),
  assigneduser: z.string().optional().nullable(),
  location: z.string().optional(),
  department: z.string().optional(),
  status: z.string(),
  operatingsystem: z.string().optional(),
  processor: z.string().optional(),
  memory: z.string().optional(),
  storage: z.string().optional(),
  hostname: z.string().optional(),
  ipaddress: z.string().optional(),
  macaddress: z.string().optional(),
  patchstatus: z.string().optional(),
  lastpatch_check: z.string().optional(),
  isloanable: z.boolean(),
  condition: z.string().optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
});

const assetUpdateSchema = assetSchema.partial();

export async function getAssets(search?: string | null, status?: string | null, type?: string | null) {
  let query = 'SELECT * FROM assets';
  const queryParams: any[] = [];
  const whereClauses: string[] = [];

  if (search) {
    whereClauses.push(`("asset_tag" ILIKE $${queryParams.length + 1} OR "serialnumber" ILIKE $${queryParams.length + 1} OR manufacturer ILIKE $${queryParams.length + 1} OR model ILIKE $${queryParams.length + 1})`);
    queryParams.push(`%${search}%`);
  }

  if (status && status !== 'all') {
    whereClauses.push(`status = $${queryParams.length + 1}`);
    queryParams.push(status);
  }

  if (type && type !== 'all') {
    whereClauses.push(`type = $${queryParams.length + 1}`);
    queryParams.push(type);
  }

  if (whereClauses.length > 0) {
    query += ' WHERE ' + whereClauses.join(' AND ');
  }

  const result = await pool.query(query, queryParams);
  return result;
}

export async function getAssetById(id: string) {
  const result = await pool.query('SELECT * FROM assets WHERE id = $1', [id]);
  return result;
}

export async function createAsset(assetData: z.infer<typeof assetSchema>) {
  const {
    asset_tag, type, manufacturer, model, serialnumber, purchasedate, purchaseprice,
    supplier, warrantyexpiry, assigneduser, location, department, status,
    operatingsystem, processor, memory, storage, hostname, ipaddress, macaddress,
    patchstatus, lastpatch_check, isloanable, condition, description, notes
  } = assetData;

  const id = `AST-${Date.now()}`;
  const created_at = new Date().toISOString();
  const updated_at = new Date().toISOString();

  const query = `
    INSERT INTO assets (
      id, "asset_tag", type, manufacturer, model, "serialnumber", "purchasedate", "purchaseprice",
      supplier, "warrantyexpiry", "assigneduser", location, department, status,
      "operatingsystem", processor, memory, storage, hostname, "ipaddress", "macaddress",
      "patchstatus", "lastpatch_check", "isloanable", condition, description, notes,
      "created_at", "updated_at"
    )
    VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
      $21, $22, $23, $24, $25, $26, $27, $28, $29
    )
    RETURNING *;
  `;
  const queryParams = [
    id, asset_tag, type, manufacturer, model, serialnumber, purchasedate, purchaseprice,
    supplier, warrantyexpiry, assigneduser, location, department, status,
    operatingsystem, processor, memory, storage, hostname, ipaddress, macaddress,
    patchstatus, lastpatch_check, isloanable, condition, description, notes,
    created_at, updated_at
  ];

  const result = await pool.query(query, queryParams);
  return result;
}

export async function updateAsset(id: string, assetData: z.infer<typeof assetUpdateSchema>) {
  const fields: { [key: string]: any } = assetData;
  if (Object.keys(fields).length === 0) {
    throw new Error("No fields to update");
  }

  fields.updatedAt = new Date().toISOString();

  const setClauses = Object.keys(fields).map((key, index) => `"${key}" = $${index + 1}`).join(', ');
  const queryParams = Object.values(fields);
  queryParams.push(id);

  const query = `UPDATE assets SET ${setClauses} WHERE id = $${queryParams.length} RETURNING *;`;

  const result = await pool.query(query, queryParams);
  return result;
}

export async function deleteAsset(id: string) {
  const result = await pool.query('DELETE FROM assets WHERE id = $1 RETURNING *;', [id]);
  return result;
}
