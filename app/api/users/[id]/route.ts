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

// GET /api/users/[id] - Get single user
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = users.find(u => u.id === params.id);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: user
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user' },
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
    const body = await request.json();
    const userIndex = users.findIndex(u => u.id === params.id);
    
    if (userIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    users[userIndex] = {
      ...users[userIndex],
      ...body,
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: users[userIndex],
      message: 'User updated successfully'
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to update user' },
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
    const userIndex = users.findIndex(u => u.id === params.id);
    
    if (userIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const deletedUser = users.splice(userIndex, 1)[0];

    return NextResponse.json({
      success: true,
      data: deletedUser,
      message: 'User deleted successfully'
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}