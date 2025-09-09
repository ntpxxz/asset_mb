import pool from '@/lib/db';
import { z } from 'zod';

const assetSchema = z.object({
  assetTag: z.string().min(1, "Asset tag is required"),
  type: z.string().optional(),
  manufacturer: z.string().optional(),
  model: z.string().optional(),
  serialNumber: z.string().min(1, "Serial number is required"),
  purchaseDate: z.string().optional(),
  purchasePrice: z.coerce.number().optional(),
  supplier: z.string().optional(),
  warrantyExpiry: z.string().optional(),
  assignedUser: z.string().optional().nullable(),
  location: z.string().optional(),
  department: z.string().optional(),
  status: z.string(),
  operatingSystem: z.string().optional(),
  processor: z.string().optional(),
  memory: z.string().optional(),
  storage: z.string().optional(),
  hostname: z.string().optional(),
  ipAddress: z.string().optional(),
  macAddress: z.string().optional(),
  patchStatus: z.string().optional(),
  lastPatchCheck: z.string().optional(),
  isLoanable: z.boolean(),
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
    whereClauses.push(`("assetTag" ILIKE $${queryParams.length + 1} OR "serialNumber" ILIKE $${queryParams.length + 1} OR manufacturer ILIKE $${queryParams.length + 1} OR model ILIKE $${queryParams.length + 1})`);
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
    assetTag, type, manufacturer, model, serialNumber, purchaseDate, purchasePrice,
    supplier, warrantyExpiry, assignedUser, location, department, status,
    operatingSystem, processor, memory, storage, hostname, ipAddress, macAddress,
    patchStatus, lastPatchCheck, isLoanable, condition, description, notes
  } = assetData;

  const id = `AST-${Date.now()}`;
  const createdAt = new Date().toISOString();
  const updatedAt = new Date().toISOString();

  const query = `
    INSERT INTO assets (
      id, "assetTag", type, manufacturer, model, "serialNumber", "purchaseDate", "purchasePrice",
      supplier, "warrantyExpiry", "assignedUser", location, department, status,
      "operatingSystem", processor, memory, storage, hostname, "ipAddress", "macAddress",
      "patchStatus", "lastPatchCheck", "isLoanable", condition, description, notes,
      "createdAt", "updatedAt"
    )
    VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
      $21, $22, $23, $24, $25, $26, $27, $28, $29
    )
    RETURNING *;
  `;
  const queryParams = [
    id, assetTag, type, manufacturer, model, serialNumber, purchaseDate, purchasePrice,
    supplier, warrantyExpiry, assignedUser, location, department, status,
    operatingSystem, processor, memory, storage, hostname, ipAddress, macAddress,
    patchStatus, lastPatchCheck, isLoanable, condition, description, notes,
    createdAt, updatedAt
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
