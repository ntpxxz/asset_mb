import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { z } from 'zod';

// Zod schema for validation
const userSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  department: z.string().optional(),
  role: z.string().optional(),
  location: z.string().optional(),
  employeeId: z.string().optional(),
  manager: z.string().optional(),
  startDate: z.string().optional(), // Assuming date is sent as string
  status: z.enum(['active', 'inactive', 'on-leave']),
});


// GET /api/users - Get all users
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search');
  const status = searchParams.get('status');
  const department = searchParams.get('department');

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

  try {
    const result = await pool.query(query, queryParams);
    return NextResponse.json({
      success: true,
      data: result.rows,
      total: result.rowCount
    });
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// POST /api/users - Create new user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = userSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: validation.error.flatten() },
        { status: 400 }
      );
    }
    
    const { 
      firstName, lastName, email, phone, department, role, location, 
      employeeId, manager, startDate, status 
    } = validation.data;

    const id = `USR-${Date.now()}`;
    const assetsCount = 0;
    const createdAt = new Date().toISOString();
    const updatedAt = new Date().toISOString();

    const query = `
      INSERT INTO users (id, "firstName", "lastName", email, phone, department, role, location, "employeeId", manager, "startDate", status, "assetsCount", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *;
    `;
    const queryParams = [
      id, firstName, lastName, email, phone, department, role, location, 
      employeeId, manager, startDate, status, assetsCount, createdAt, updatedAt
    ];
    
    const result = await pool.query(query, queryParams);

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: 'User created successfully'
    }, { status: 201 });
  } catch (error:unknown) {
    console.error('Failed to create user:', error);
    // Check for unique constraint violation
    if (error) { // unique_violation
        return NextResponse.json(
            { success: false, error: 'User with this email or employee ID already exists.' },
            { status: 409 }
        );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to create user' },
      { status: 500 }
    );
  }
}