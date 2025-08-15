import pool from '@/lib/db';
import { z } from 'zod';

const borrowingSchema = z.object({
  assetId: z.string().min(1, "Asset ID is required"),
  borrowerId: z.string().min(1, "Borrower ID is required"),
  checkoutDate: z.string(),
  dueDate: z.string().optional(),
  status: z.string(),
  purpose: z.string().optional(),
  notes: z.string().optional(),
});

const borrowingUpdateSchema = borrowingSchema.partial().extend({
  checkinDate: z.string().optional().nullable(),
  action: z.string().optional(),
});

export async function getBorrowingRecords(status?: string | null, userId?: string | null, assetId?: string | null) {
  let query = 'SELECT * FROM asset_borrowing';
  const queryParams: any[] = [];
  const whereClauses: string[] = [];

  if (status && status !== 'all') {
    whereClauses.push(`status = $${queryParams.length + 1}`);
    queryParams.push(status);
  }

  if (userId) {
    whereClauses.push(`"borrowerId" = $${queryParams.length + 1}`);
    queryParams.push(userId);
  }

  if (assetId) {
    whereClauses.push(`"assetId" = $${queryParams.length + 1}`);
    queryParams.push(assetId);
  }

  if (whereClauses.length > 0) {
    query += ' WHERE ' + whereClauses.join(' AND ');
  }

  const result = await pool.query(query, queryParams);
  return result;
}

export async function getBorrowingRecordById(id: string) {
  const result = await pool.query('SELECT * FROM asset_borrowing WHERE id = $1', [id]);
  return result;
}

export async function createBorrowingRecord(borrowingData: z.infer<typeof borrowingSchema>) {
  const {
    assetId, borrowerId, checkoutDate, dueDate, status, purpose, notes
  } = borrowingData;

  const id = `BOR-${Date.now()}`;
  const createdAt = new Date().toISOString();
  const updatedAt = new Date().toISOString();
  const checkinDate = null;

  const query = `
    INSERT INTO asset_borrowing (
      id, "assetId", "borrowerId", "checkoutDate", "dueDate", "checkinDate", status, purpose, notes,
      "createdAt", "updatedAt"
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *;
  `;
  const queryParams = [
    id, assetId, borrowerId, checkoutDate, dueDate, checkinDate, status, purpose, notes,
    createdAt, updatedAt
  ];

  const result = await pool.query(query, queryParams);
  return result;
}

export async function updateBorrowingRecord(id: string, borrowingData: z.infer<typeof borrowingUpdateSchema>) {
  const fields: { [key: string]: any } = borrowingData;
  if (Object.keys(fields).length === 0 && !fields.action) {
    throw new Error("No fields to update");
  }

  if (fields.action === 'checkin') {
    fields.checkinDate = new Date().toISOString().split('T')[0];
    fields.status = 'returned';
  }
  delete fields.action;

  fields.updatedAt = new Date().toISOString();

  const setClauses = Object.keys(fields).map((key, index) => `"${key}" = $${index + 1}`).join(', ');
  const queryParams = Object.values(fields);
  queryParams.push(id);

  const query = `UPDATE asset_borrowing SET ${setClauses} WHERE id = $${queryParams.length} RETURNING *;`;

  const result = await pool.query(query, queryParams);
  return result;
}

export async function deleteBorrowingRecord(id: string) {
  const result = await pool.query('DELETE FROM asset_borrowing WHERE id = $1 RETURNING *;', [id]);
  return result;
}
