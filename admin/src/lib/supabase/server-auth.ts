import { cookies } from 'next/headers';
import { createClient, type Session, type User } from '@supabase/supabase-js';

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

const ACCESS_TOKEN_COOKIE = 'sb-access-token';
const REFRESH_TOKEN_COOKIE = 'sb-refresh-token';

function getSupabaseAnonClient() {
  const url = requiredEnv('SUPABASE_URL');
  const anonKey = requiredEnv('SUPABASE_ANON_KEY');
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function getSupabaseAccessTokenFromCookies(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(ACCESS_TOKEN_COOKIE)?.value ?? null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Network/connect errors are transient; auth rejections (bad/expired token) are not. */
function isTransientNetworkError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /fetch failed|ConnectTimeout|ECONNRESET|ETIMEDOUT|ENOTFOUND|EAI_AGAIN/i.test(message);
}

export class SupabaseAuthNetworkError extends Error {
  constructor(cause: unknown) {
    super('Could not verify your session — network error reaching Supabase. Please check your connection and try again.');
    this.name = 'SupabaseAuthNetworkError';
    this.cause = cause;
  }
}

export async function getSupabaseUserFromCookies(): Promise<User | null> {
  const accessToken = (await getSupabaseAccessTokenFromCookies()) ?? '';
  if (!accessToken) return null;

  const supabase = getSupabaseAnonClient();
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const isLastAttempt = attempt === maxAttempts;
    try {
      const { data, error } = await supabase.auth.getUser(accessToken);
      if (!error) return data.user ?? null;
      if (!isTransientNetworkError(error)) return null;
      if (isLastAttempt) throw new SupabaseAuthNetworkError(error);
    } catch (err) {
      if (err instanceof SupabaseAuthNetworkError) throw err;
      if (!isTransientNetworkError(err)) throw err;
      if (isLastAttempt) throw new SupabaseAuthNetworkError(err);
    }
    await sleep(300 * attempt);
  }
  return null;
}

export async function writeSupabaseSessionCookies(session: Session): Promise<void> {
  const cookieStore = await cookies();
  const secure = process.env.NODE_ENV === 'production';

  cookieStore.set(ACCESS_TOKEN_COOKIE, session.access_token, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    maxAge: session.expires_in ?? 60 * 60,
    path: '/',
  });

  if (session.refresh_token) {
    cookieStore.set(REFRESH_TOKEN_COOKIE, session.refresh_token, {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 14,
      path: '/',
    });
  }
}

export async function clearSupabaseSessionCookies(): Promise<void> {
  const cookieStore = await cookies();
  const secure = process.env.NODE_ENV === 'production';

  cookieStore.set(ACCESS_TOKEN_COOKIE, '', {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
  cookieStore.set(REFRESH_TOKEN_COOKIE, '', {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
}

export function getSupabaseAuthClientForServer() {
  return getSupabaseAnonClient();
}

export function getSupabaseRlsClientForServer(accessToken: string) {
  const url = requiredEnv('SUPABASE_URL');
  const anonKey = requiredEnv('SUPABASE_ANON_KEY');

  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}
