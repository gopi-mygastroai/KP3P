import { getSupabaseAdminClient } from '@/lib/supabase/server';

type AuthIdentity = {
  authUserId: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'PATIENT';
};

export async function upsertUserFromAuthIdentity(
  identity: AuthIdentity,
): Promise<number | null> {
  const supabase = getSupabaseAdminClient();
  const { data: existing, error: existingError } = await supabase
    .from('User')
    .select('id')
    .eq('authUserId', identity.authUserId)
    .maybeSingle();

  if (existingError) {
    throw new Error(`Supabase User lookup failed: ${existingError.message}`);
  }

  if (existing?.id) {
    const { error: updateError } = await supabase
      .from('User')
      .update({
        email: identity.email,
        name: identity.name,
        role: identity.role,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', existing.id);
    if (updateError) {
      throw new Error(`Supabase User update failed: ${updateError.message}`);
    }
    return Number(existing.id);
  }

  const nowIso = new Date().toISOString();
  const { data: inserted, error: insertError } = await supabase
    .from('User')
    .insert({
      authUserId: identity.authUserId,
      email: identity.email,
      name: identity.name,
      role: identity.role,
      password: '',
      createdAt: nowIso,
      updatedAt: nowIso,
    })
    .select('id')
    .single();

  if (insertError) {
    throw new Error(`Supabase User insert failed: ${insertError.message}`);
  }

  return inserted?.id ? Number(inserted.id) : null;
}

export async function findUserIdByAuthUserId(
  authUserId: string,
): Promise<number | null> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from('User')
    .select('id')
    .eq('authUserId', authUserId)
    .maybeSingle();

  if (error) {
    throw new Error(`Supabase User lookup failed: ${error.message}`);
  }

  return data?.id ? Number(data.id) : null;
}
