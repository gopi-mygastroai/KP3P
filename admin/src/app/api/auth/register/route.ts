import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { email, password, name } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Name, Email, and password are required' }, { status: 400 });
    }

    const role = email === 'admin@mygastro.ai' ? 'ADMIN' : 'PATIENT';

    const user = {
      id: Math.floor(Math.random() * 1000000), // Fake ID
      email,
      name,
      role,
    };

    const cookieStore = await cookies();
    cookieStore.set('userId', user.id.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });
    
    cookieStore.set('userRole', user.role, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
