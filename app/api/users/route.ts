import { NextRequest, NextResponse } from 'next/server';
import * as userService from '@/lib/services/userService';
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
  manager: z.string().optional(),
  startDate: z.string().optional(),
  status: z.enum(['active', 'inactive', 'on-leave']),
});

// GET /api/users - Get all users
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search');
  const status = searchParams.get('status');
  const department = searchParams.get('department');

  try {
    const result = await userService.getUsers(search, status, department);
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

    const result = await userService.createUser(validation.data);

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: 'User created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Failed to create user:', error);
    if (error.code === '23505') { // unique_violation
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