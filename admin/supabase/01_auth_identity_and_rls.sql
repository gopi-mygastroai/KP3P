-- Run this script in Supabase SQL editor (once per environment).
-- It aligns existing Prisma-style tables ("User", "Patient") with Supabase Auth identity.

begin;

-- 1) Bridge columns to map auth.users -> app rows.
alter table public."User"
  add column if not exists "authUserId" uuid;

alter table public."Patient"
  add column if not exists "authUserId" uuid;

-- 2) Helpful indexes and uniqueness.
create unique index if not exists "User_authUserId_key"
  on public."User" ("authUserId")
  where "authUserId" is not null;

create index if not exists "Patient_authUserId_idx"
  on public."Patient" ("authUserId");

-- 3) Optional foreign keys to auth.users.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'User_authUserId_fkey'
  ) then
    alter table public."User"
      add constraint "User_authUserId_fkey"
      foreign key ("authUserId") references auth.users(id)
      on delete set null;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'Patient_authUserId_fkey'
  ) then
    alter table public."Patient"
      add constraint "Patient_authUserId_fkey"
      foreign key ("authUserId") references auth.users(id)
      on delete set null;
  end if;
end $$;

-- 4) Admin role helper from JWT claims.
create or replace function public.is_admin_user()
returns boolean
language sql
stable
as $$
  select
    coalesce(
      (auth.jwt() ->> 'role') = 'ADMIN',
      false
    )
    or coalesce(
      (auth.jwt() -> 'app_metadata' ->> 'role') = 'ADMIN',
      false
    )
    or coalesce(
      (auth.jwt() -> 'user_metadata' ->> 'role') = 'ADMIN',
      false
    )
    or coalesce(
      lower(auth.jwt() ->> 'email') = 'admin@mygastro.ai',
      false
    );
$$;

-- 5) Turn on RLS.
alter table public."User" enable row level security;
alter table public."Patient" enable row level security;

-- 6) Reset policies for deterministic setup.
drop policy if exists "User_admin_all" on public."User";
drop policy if exists "User_self_select" on public."User";
drop policy if exists "User_self_update" on public."User";
drop policy if exists "User_self_insert" on public."User";

drop policy if exists "Patient_admin_all" on public."Patient";
drop policy if exists "Patient_owner_select" on public."Patient";
drop policy if exists "Patient_owner_insert" on public."Patient";
drop policy if exists "Patient_owner_update" on public."Patient";
drop policy if exists "Patient_owner_delete" on public."Patient";

-- 7) User table policies.
create policy "User_admin_all"
on public."User"
for all
to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());

create policy "User_self_select"
on public."User"
for select
to authenticated
using ("authUserId" = auth.uid());

create policy "User_self_update"
on public."User"
for update
to authenticated
using ("authUserId" = auth.uid())
with check ("authUserId" = auth.uid());

create policy "User_self_insert"
on public."User"
for insert
to authenticated
with check (
  public.is_admin_user()
  or "authUserId" = auth.uid()
);

-- 8) Patient table policies.
create policy "Patient_admin_all"
on public."Patient"
for all
to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());

create policy "Patient_owner_select"
on public."Patient"
for select
to authenticated
using ("authUserId" = auth.uid());

create policy "Patient_owner_insert"
on public."Patient"
for insert
to authenticated
with check (
  public.is_admin_user()
  or "authUserId" = auth.uid()
);

create policy "Patient_owner_update"
on public."Patient"
for update
to authenticated
using (
  public.is_admin_user()
  or "authUserId" = auth.uid()
)
with check (
  public.is_admin_user()
  or "authUserId" = auth.uid()
);

create policy "Patient_owner_delete"
on public."Patient"
for delete
to authenticated
using (
  public.is_admin_user()
  or "authUserId" = auth.uid()
);

commit;
