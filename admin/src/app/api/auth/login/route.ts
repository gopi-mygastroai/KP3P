import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_LOGIN_EMAIL } from '@/lib/auth-credentials';
import {
  getSupabaseAuthClientForServer,
  writeSupabaseSessionCookies,
} from '@/lib/supabase/server-auth';
import { upsertUserFromAuthIdentity } from '@/lib/user-repository';

export const runtime = 'nodejs';

function isRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const raw: unknown = await req.json();
    if (!isRecord(raw)) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    const email = typeof raw.email === 'string' ? raw.email.trim() : '';
    const password = typeof raw.password === 'string' ? raw.password : '';

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    if (email.toLowerCase() !== ADMIN_LOGIN_EMAIL) {
      return NextResponse.json({ error: 'Invalid username.' }, { status: 401 });
    }

    const supabase = getSupabaseAuthClientForServer();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error || !data.user) {
      return NextResponse.json(
        { error: 'Incorrect password. Please try again.' },
        { status: 401 },
      );
    }

    const role =
      (data.user.email ?? '').toLowerCase() === ADMIN_LOGIN_EMAIL
        ? ('ADMIN' as const)
        : ('PATIENT' as const);
    const user = {
      id: data.user.id,
      email: data.user.email ?? email,
      name:
        typeof data.user.user_metadata?.name === 'string'
          ? data.user.user_metadata.name
          : 'admin',
      role,
    };

    await upsertUserFromAuthIdentity({
      authUserId: data.user.id,
      email: user.email,
      name: user.name,
      role,
    });

    if (data.session) {
      await writeSupabaseSessionCookies(data.session);
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
