import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {   
          (await cookies()).delete('session');
    return NextResponse.json({ message: 'Logout successful' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}