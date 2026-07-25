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
    const name = typeof raw.name === 'string' ? raw.name.trim() : '';

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Name, Email, and password are required' }, { status: 400 });
    }

    const role = email.toLowerCase() === ADMIN_LOGIN_EMAIL ? 'ADMIN' : 'PATIENT';

    const supabase = getSupabaseAuthClientForServer();
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, role },
      },
    });
    if (signUpError) {
      return NextResponse.json({ error: signUpError.message }, { status: 400 });
    }

    const { data: signInData, error: signInError } =
      await supabase.auth.signInWithPassword({ email, password });
    if (signInError || !signInData.user) {
      return NextResponse.json(
        { error: signInError?.message ?? 'Could not create session after signup.' },
        { status: 400 },
      );
    }

    const user = {
      id: signInData.user.id,
      email: signInData.user.email ?? email,
      name,
      role,
    };

    await upsertUserFromAuthIdentity({
      authUserId: signInData.user.id,
      email: user.email,
      name,
      role,
    });

    if (signInData.session) {
      await writeSupabaseSessionCookies(signInData.session);
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
