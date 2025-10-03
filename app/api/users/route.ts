import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { z } from 'zod';
import bcrypt from 'bcrypt';

// Zod schema for validation using snake_case
const userSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phone: z.string().optional(),
  department: z.string().optional(),
  role: z.enum(['user', 'admin']).default('user'),
  location: z.string().optional(),
  employee_id: z.string().optional(),
  manager: z.string().optional(),
  start_date: z.string().optional(), // Assuming date is sent as string
  status: z.enum(['active', 'inactive', 'suspended']),
});

// GET /api/users - Get all users
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search');
  const status = searchParams.get('status');
  const department = searchParams.get('department');

  let query = 'SELECT id, first_name, last_name, email, phone, department, role, location, employee_id, status, assets_count FROM users'; // Exclude password from general GET requests
  const queryParams: any[] = [];
  const whereClauses: string[] = [];

  if (search) {
    whereClauses.push(`(first_name ILIKE $${queryParams.length + 1} OR last_name ILIKE $${queryParams.length + 1} OR email ILIKE $${queryParams.length + 1})`);
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
      first_name, last_name, email, password, phone, department, role, location, 
      employee_id, manager, start_date, status 
    } = validation.data;

    const hashedPassword = await bcrypt.hash(password, 10);
    const id = `USR-${Date.now()}`;
    const assets_count = 0;
    const created_at = new Date().toISOString();
    const updated_at = new Date().toISOString();

    const query = `
      INSERT INTO users (id, first_name, last_name, email, password, phone, department, role, location, employee_id, manager, start_date, status, assets_count, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING id, first_name, last_name, email, role, created_at;
    `;
    const queryParams = [
      id, first_name, last_name, email, hashedPassword, phone, department, role, location, 
      employee_id, manager, start_date, status, assets_count, created_at, updated_at
    ];
    
    const result = await pool.query(query, queryParams);

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: 'User created successfully'
    }, { status: 201 });
  } catch (error:unknown) {
    console.error('Failed to create user:', error);
    if (error && typeof error === 'object' && 'code' in error && error.code === '23505') { 
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