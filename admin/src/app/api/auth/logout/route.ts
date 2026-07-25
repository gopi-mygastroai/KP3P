import { NextResponse } from 'next/server';
import { clearSupabaseSessionCookies } from '@/lib/supabase/server-auth';

export const runtime = 'nodejs';

export async function POST(): Promise<NextResponse> {
  try {
    await clearSupabaseSessionCookies();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[auth/logout]', error);
    return NextResponse.json({ error: 'Could not log out. Please try again.' }, { status: 500 });
  }
}
