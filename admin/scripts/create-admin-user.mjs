/**
 * One-off utility: creates (or re-confirms) the Supabase Auth admin user
 * for this app using the service role key. Safe to re-run.
 *
 * Usage: node scripts/create-admin-user.mjs <email> <password>
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const [, , emailArg, passwordArg] = process.argv;
const email = emailArg || 'admin@mygastro.ai';
const password = passwordArg;

if (!password) {
  console.error('Usage: node scripts/create-admin-user.mjs <email> <password>');
  process.exit(1);
}

const url = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env');
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name: 'admin', role: 'ADMIN' },
  });

  if (!createError) {
    console.log('Created admin user:', created.user.id, created.user.email);
    return;
  }

  const alreadyExists = /already.*registered|already.*exists/i.test(createError.message || '');
  if (!alreadyExists) {
    console.error('Failed to create user:', createError.message);
    process.exit(1);
  }

  console.log('User already exists — updating password instead.');

  const { data: list, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error('Failed to list users:', listError.message);
    process.exit(1);
  }

  const existing = list.users.find((u) => (u.email ?? '').toLowerCase() === email.toLowerCase());
  if (!existing) {
    console.error('Could not find existing user with email', email);
    process.exit(1);
  }

  const { data: updated, error: updateError } = await supabase.auth.admin.updateUserById(
    existing.id,
    {
      password,
      email_confirm: true,
      user_metadata: { name: 'admin', role: 'ADMIN' },
    },
  );

  if (updateError) {
    console.error('Failed to update user password:', updateError.message);
    process.exit(1);
  }

  console.log('Updated admin user password:', updated.user.id, updated.user.email);
}

main();
