import pool from '@/lib/db';
import { z } from 'zod';

const userSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  department: z.string().optional(),
  role: z.string().optional(),
  location: z.string().optional(),
  employeeId: z.string().optional(),
  startDate: z.string().optional(),
  status: z.enum(['active', 'inactive', 'on-leave']),
});

const userUpdateSchema = userSchema.partial();

export async function getUsers(search?: string | null, status?: string | null, department?: string | null) {
  let query = 'SELECT * FROM users';
  const queryParams: any[] = [];
  const whereClauses: string[] = [];

  if (search) {
    whereClauses.push(`("firstName" ILIKE $${queryParams.length + 1} OR "lastName" ILIKE $${queryParams.length + 1} OR email ILIKE $${queryParams.length + 1})`);
    queryParams.push(`%${search}%`);
  }

  if (status && status !== 'all') {
    whereClauses.push(`status = $${queryParams.length + 1}`);
    queryParams.push(status);
  }

  if (department && department !== 'all') {
    whereClauses.push(`department = $${queryParams.length + 1}`);
    queryParams.push(department);
  }

  if (whereClauses.length > 0) {
    query += ' WHERE ' + whereClauses.join(' AND ');
  }

  const result = await pool.query(query, queryParams);
  return result;
}

export async function getUserById(id: string) {
  const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
  return result;
}

export async function createUser(userData: z.infer<typeof userSchema>) {
  const {
    firstName, lastName, email, phone, department, role, location,
    employeeId, startDate, status
  } = userData;

  const id = `USR-${Date.now()}`;
  const assetsCount = 0;
  const createdAt = new Date().toISOString();
  const updatedAt = new Date().toISOString();

  const query = `
    INSERT INTO users (id, "firstName", "lastName", email, phone, department, role, location, "employeeId", "startDate", status, "assetsCount", "createdAt", "updatedAt")
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
    RETURNING *;
  `;
  const queryParams = [
    id, firstName, lastName, email, phone, department, role, location,
    employeeId, startDate, status, assetsCount, createdAt, updatedAt
  ];

  const result = await pool.query(query, queryParams);
  return result;
}

export async function updateUser(id: string, userData: z.infer<typeof userUpdateSchema>) {
  const fields: { [key: string]: any } = userData;
  if (Object.keys(fields).length === 0) {
    throw new Error("No fields to update");
  }

  fields.updatedAt = new Date().toISOString();

  const setClauses = Object.keys(fields).map((key, index) => `"${key}" = $${index + 1}`).join(', ');
  const queryParams = Object.values(fields);
  queryParams.push(id);

  const query = `UPDATE users SET ${setClauses} WHERE id = $${queryParams.length} RETURNING *;`;

  const result = await pool.query(query, queryParams);
  return result;
}

export async function deleteUser(id: string) {
  const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING *;', [id]);
  return result;
}
