import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { z } from 'zod';

// Zod schema for validation (all fields optional for updates, no password)
const userUpdateSchema = z.object({
  firstname: z.string().min(1, "First name is required").optional(),
  lastname: z.string().min(1, "Last name is required").optional(),
  email: z.string().email("Invalid email address").optional(),
  phone: z.string().optional(),
  department: z.string().optional(),
  role: z.string().optional(),
  location: z.string().optional(),
  employee_id: z.string().optional(),
  manager: z.string().optional(),
  start_date: z.string().optional(),
  status: z.enum(['active', 'inactive', 'on-leave']).optional(),
  updated_at: z.string().datetime().optional(), 
}).partial();

// GET /api/users/[id] - Get single user
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    // Exclude password from the SELECT statement for security
    const result = await pool.query('SELECT id, firstname, lastname, email, phone, department, role, location, employee_id, manager, start_date, status, assets_count FROM users WHERE id = $1', [id]);
    
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
    const { id } = params;
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
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
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

    fields.updated_at = new Date().toISOString(); 

    const setClauses = Object.keys(fields).map((key, index) => `${key} = $${index + 1}`).join(', ');
    const queryParams = Object.values(fields);
    queryParams.push(id);
    
    const query = `UPDATE users SET ${setClauses} WHERE id = $${queryParams.length} RETURNING *;`;
    
    const result = await pool.query(query, queryParams);

    if (result.rowCount === 0) {
        return NextResponse.json(
            { success: false, error: 'User not found' },
            { status: 404 }
        );
    }
    
    const updatedUser = result.rows[0];
    delete updatedUser.password; // Remove password from the returned object

    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: 'User updated successfully'
    });
  } catch (error: any) {
    const { id } = params;
    console.error(`Failed to update user ${id}:`, error);
    
    if (error.code === '23505') { 
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
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id;', [id]);
    
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
    const { id } = params;
    console.error(`Failed to delete user ${id}:`, error);
    return NextResponse.json(
      { success: false, error: `Failed to delete user ${id}`, details: error.message },
      { status: 500 }
    );
  }
}