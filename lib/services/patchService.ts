import pool from '@/lib/db';
import { z } from 'zod';

const patchSchema = z.object({
  assetId: z.string().min(1, "Asset ID is required"),
  patchStatus: z.string().optional(),
  lastPatchCheck: z.string().optional(),
  operatingSystem: z.string().optional(),
  vulnerabilities: z.coerce.number().int().optional(),
  pendingUpdates: z.coerce.number().int().optional(),
  criticalUpdates: z.coerce.number().int().optional(),
  securityUpdates: z.coerce.number().int().optional(),
  notes: z.string().optional(),
  nextCheckDate: z.string().optional(),
});

const patchUpdateSchema = patchSchema.partial();

export async function getPatchRecords(status?: string | null, assetId?: string | null, critical?: string | null) {
  let query = 'SELECT * FROM asset_patches';
  const queryParams: any[] = [];
  const whereClauses: string[] = [];

  if (status && status !== 'all') {
    whereClauses.push(`"patchStatus" = $${queryParams.length + 1}`);
    queryParams.push(status);
  }

  if (assetId) {
    whereClauses.push(`"assetId" = $${queryParams.length + 1}`);
    queryParams.push(assetId);
  }

  if (critical === 'true') {
    whereClauses.push(`"criticalUpdates" > 0`);
  }

  if (whereClauses.length > 0) {
    query += ' WHERE ' + whereClauses.join(' AND ');
  }

  const result = await pool.query(query, queryParams);
  return result;
}

export async function getPatchRecordById(id: string) {
  const result = await pool.query('SELECT * FROM asset_patches WHERE id = $1', [id]);
  return result;
}

export async function createPatchRecord(patchData: z.infer<typeof patchSchema>) {
  const {
    assetId, patchStatus, lastPatchCheck, operatingSystem, vulnerabilities,
    pendingUpdates, criticalUpdates, securityUpdates, notes, nextCheckDate
  } = patchData;

  const id = `PATCH-${Date.now()}`;
  const createdAt = new Date().toISOString();
  const updatedAt = new Date().toISOString();

  const query = `
    INSERT INTO asset_patches (
      id, "assetId", "patchStatus", "lastPatchCheck", "operatingSystem", vulnerabilities,
      "pendingUpdates", "criticalUpdates", "securityUpdates", notes, "nextCheckDate",
      "createdAt", "updatedAt"
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    RETURNING *;
  `;
  const queryParams = [
    id, assetId, patchStatus, lastPatchCheck, operatingSystem, vulnerabilities,
    pendingUpdates, criticalUpdates, securityUpdates, notes, nextCheckDate,
    createdAt, updatedAt
  ];

  const result = await pool.query(query, queryParams);
  return result;
}

export async function updatePatchRecord(id: string, patchData: z.infer<typeof patchUpdateSchema>) {
  const fields: { [key: string]: any } = patchData;
  if (Object.keys(fields).length === 0) {
    throw new Error("No fields to update");
  }

  fields.updatedAt = new Date().toISOString();

  const setClauses = Object.keys(fields).map((key, index) => `"${key}" = $${index + 1}`).join(', ');
  const queryParams = Object.values(fields);
  queryParams.push(id);

  const query = `UPDATE asset_patches SET ${setClauses} WHERE id = $${queryParams.length} RETURNING *;`;

  const result = await pool.query(query, queryParams);
  return result;
}

export async function deletePatchRecord(id: string) {
  const result = await pool.query('DELETE FROM asset_patches WHERE id = $1 RETURNING *;', [id]);
  return result;
}
