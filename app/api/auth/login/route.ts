import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import bcrypt from 'bcrypt';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const { employee_id, password } = await req.json();

    if (!employee_id || !password) {
      return NextResponse.json({ error: 'Employee ID and password are required' }, { status: 400 });
    }

    const result = await pool.query('SELECT * FROM users WHERE employee_id = $1', [employee_id]);
    const user = result.rows[0];

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // --- CORRECTED CODE ---
    // Set a session cookie
    (await
      // --- CORRECTED CODE ---
      // Set a session cookie
      cookies()).set('session', user.id, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
    });

    // Remove password from user object before sending back to the client
    delete user.password;

    return NextResponse.json({ 
      message: 'Login successful', 
      user: {
        id: user.id,
        firstname: user.firstname,
        role: user.role
      } 
    });
  } catch (error) {
    console.error('Login API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}