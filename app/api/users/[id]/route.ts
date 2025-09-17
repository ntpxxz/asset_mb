import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { z } from 'zod';

// Zod schema for validation (all fields optional for updates)
const userUpdateSchema = z.object({
  firstName: z.string().min(1, "First name is required").optional(),
  lastName: z.string().min(1, "Last name is required").optional(),
  email: z.string().email("Invalid email address").optional(),
  phone: z.string().optional(),
  department: z.string().optional(),
  role: z.string().optional(),
  location: z.string().optional(),
  employeeId: z.string().optional(),
  manager: z.string().optional(),
  startDate: z.string().optional(),
  status: z.enum(['active', 'inactive', 'on-leave']).optional(),
  updatedAt: z.string().datetime().optional(), 
}).partial();

// GET /api/users/[id] - Get single user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    
    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error: any) {
    const { id } = await params;
    console.error(`Failed to fetch user ${id}:`, error);
    return NextResponse.json(
      { success: false, error: `Failed to fetch user ${id}`, details: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/users/[id] - Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validation = userUpdateSchema.safeParse(body);

    if (!validation.success) {
        return NextResponse.json(
            { success: false, error: 'Invalid input', details: validation.error.flatten() },
            { status: 400 }
        );
    }
    
    const fields = validation.data;
    if (Object.keys(fields).length === 0) {
        return NextResponse.json(
            { success: false, error: 'No fields to update' },
            { status: 400 }
        );
    }

    fields.updatedAt = new Date().toISOString(); // ใช้ ISO string แทน toString()

    // แก้ไข: เพิ่ม $ หน้า parameter placeholders
    const setClauses = Object.keys(fields).map((key, index) => `"${key}" = $${index + 1}`).join(', ');
    const queryParams = Object.values(fields);
    queryParams.push(id);
    
    // แก้ไข: เพิ่ม $ หน้า parameter ตัวสุดท้าย
    const query = `UPDATE users SET ${setClauses} WHERE id = $${queryParams.length} RETURNING *;`;
    
    // Debug logging
    console.log('Update query:', query);
    console.log('Query params:', queryParams);
    console.log('Fields to update:', fields);
    
    const result = await pool.query(query, queryParams);

    if (result.rowCount === 0) {
        return NextResponse.json(
            { success: false, error: 'User not found' },
            { status: 404 }
        );
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: 'User updated successfully'
    });
  } catch (error: any) {
    const { id } = await params;
    console.error(`Failed to update user ${id}:`, error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      detail: error.detail,
      stack: error.stack
    });
    
    // Check for PostgreSQL unique constraint violation
    if (error.code === '23505') { // unique_violation
        return NextResponse.json(
            { success: false, error: 'User with this email or employee ID already exists.' },
            { status: 409 }
        );
    }
    
    return NextResponse.json(
      { success: false, error: `Failed to update user ${id}`, details: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[id] - Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING *;', [id]);
    
    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: 'User deleted successfully'
    });
  } catch (error: any) {
    const { id } = await params;
    console.error(`Failed to delete user ${id}:`, error);
    return NextResponse.json(
      { success: false, error: `Failed to delete user ${id}`, details: error.message },
      { status: 500 }
    );
  }
}