import pool from '@/lib/db';
import { z } from 'zod';

const softwareSchema = z.object({
  softwareName: z.string().min(1, "Software name is required"),
  publisher: z.string().optional(),
  version: z.string().optional(),
  licenseKey: z.string().min(1, "License key is required"),
  licenseType: z.string().optional(),
  purchaseDate: z.string().optional(),
  expiryDate: z.string().optional(),
  licensesTotal: z.coerce.number().int().optional(),
  licensesAssigned: z.coerce.number().int().optional(),
  category: z.string().optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
  status: z.string(),
});

const softwareUpdateSchema = softwareSchema.partial();

export async function getSoftware(search?: string | null, status?: string | null, type?: string | null) {
  let query = 'SELECT * FROM software';
  const queryParams: any[] = [];
  const whereClauses: string[] = [];

  if (search) {
    whereClauses.push(`("softwareName" ILIKE $${queryParams.length + 1} OR publisher ILIKE $${queryParams.length + 1})`);
    queryParams.push(`%${search}%`);
  }

  if (status && status !== 'all') {
    whereClauses.push(`status = $${queryParams.length + 1}`);
    queryParams.push(status);
  }

  if (type && type !== 'all') {
    whereClauses.push(`"licenseType" = $${queryParams.length + 1}`);
    queryParams.push(type);
  }

  if (whereClauses.length > 0) {
    query += ' WHERE ' + whereClauses.join(' AND ');
  }

  const result = await pool.query(query, queryParams);
  return result;
}

export async function getSoftwareById(id: string) {
  const result = await pool.query('SELECT * FROM software WHERE id = $1', [id]);
  return result;
}

export async function createSoftware(softwareData: z.infer<typeof softwareSchema>) {
  const {
    softwareName, publisher, version, licenseKey, licenseType, purchaseDate,
    expiryDate, licensesTotal, licensesAssigned, category, description, notes, status
  } = softwareData;

  const id = `SW-${Date.now()}`;
  const createdAt = new Date().toISOString();
  const updatedAt = new Date().toISOString();

  const query = `
    INSERT INTO software (
      id, "softwareName", publisher, version, "licenseKey", "licenseType", "purchaseDate",
      "expiryDate", "licensesTotal", "licensesAssigned", category, description, notes, status,
      "createdAt", "updatedAt"
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
    RETURNING *;
  `;
  const queryParams = [
    id, softwareName, publisher, version, licenseKey, licenseType, purchaseDate,
    expiryDate, licensesTotal, licensesAssigned, category, description, notes, status,
    createdAt, updatedAt
  ];

  const result = await pool.query(query, queryParams);
  return result;
}

export async function updateSoftware(id: string, softwareData: z.infer<typeof softwareUpdateSchema>) {
  const fields: { [key: string]: any } = softwareData;
  if (Object.keys(fields).length === 0) {
    throw new Error("No fields to update");
  }

  fields.updatedAt = new Date().toISOString();

  const setClauses = Object.keys(fields).map((key, index) => `"${key}" = $${index + 1}`).join(', ');
  const queryParams = Object.values(fields);
  queryParams.push(id);

  const query = `UPDATE software SET ${setClauses} WHERE id = $${queryParams.length} RETURNING *;`;

  const result = await pool.query(query, queryParams);
  return result;
}

export async function deleteSoftware(id: string) {
  const result = await pool.query('DELETE FROM software WHERE id = $1 RETURNING *;', [id]);
  return result;
}
