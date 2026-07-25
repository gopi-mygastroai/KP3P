import { ADMIN_LOGIN_EMAIL } from '@/lib/auth-credentials';
import { getSupabaseUserFromCookies } from '@/lib/supabase/server-auth';

export type AppRole = 'ADMIN' | 'PATIENT' | null;

export type AppSession = {
  isAuthenticated: boolean;
  userId: string | null;
  role: AppRole;
  email: string | null;
};

function roleFromRaw(raw: string | null): AppRole {
  if (!raw) return null;
  const upper = raw.toUpperCase();
  return upper === 'ADMIN' ? 'ADMIN' : 'PATIENT';
}

export async function getAppSession(): Promise<AppSession> {
  const user = await getSupabaseUserFromCookies();

  if (!user) {
    return { isAuthenticated: false, userId: null, role: null, email: null };
  }

  const metadataRole =
    typeof user.user_metadata?.role === 'string'
      ? user.user_metadata.role
      : typeof user.app_metadata?.role === 'string'
        ? user.app_metadata.role
        : null;
  const inferredRole =
    (user.email ?? '').toLowerCase() === ADMIN_LOGIN_EMAIL ? 'ADMIN' : 'PATIENT';
  const role = roleFromRaw(metadataRole) ?? inferredRole;

  return {
    isAuthenticated: true,
    userId: user.id,
    role,
    email: user.email ?? null,
  };
}
