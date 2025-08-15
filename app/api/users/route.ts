import { NextRequest, NextResponse } from 'next/server';

let users = [
  {
    id: 'USR-001',
    firstName: 'John',
    lastName: 'Smith',
    email: 'john.smith@company.com',
    phone: '+1 (555) 123-4567',
    department: 'engineering',
    role: 'Senior Developer',
    location: 'ny-office',
    employeeId: 'EMP-001',
    manager: 'MGR-001',
    startDate: '2022-01-15',
    status: 'active',
    assetsCount: 1,
    createdAt: '2022-01-15T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
  },
];

// GET /api/users - Get all users
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const department = searchParams.get('department');

    let filteredUsers = [...users];

    // Apply filters
    if (search) {
      const searchLower = search.toLowerCase();
      filteredUsers = filteredUsers.filter(user => {
        const fullName = `${user.firstName} ${user.lastName}`;
        return fullName.toLowerCase().includes(searchLower) ||
               user.email.toLowerCase().includes(searchLower) ||
               user.department.toLowerCase().includes(searchLower);
      });
    }

    if (status && status !== 'all') {
      filteredUsers = filteredUsers.filter(user => user.status === status);
    }

    if (department && department !== 'all') {
      filteredUsers = filteredUsers.filter(user => user.department === department);
    }

    return NextResponse.json({
      success: true,
      data: filteredUsers,
      total: filteredUsers.length
    });
  } catch (error) {
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
    
    const newUser = {
      ...body,
      id: `USR-${Date.now()}`,
      assetsCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    users.push(newUser);

    return NextResponse.json({
      success: true,
      data: newUser,
      message: 'User created successfully'
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to create user' },
      { status: 500 }
    );
  }
}