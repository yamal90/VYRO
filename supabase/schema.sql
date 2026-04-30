create extension if not exists pgcrypto;

create schema if not exists private;
revoke all on schema private from public;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null,
  email text not null,
  invite_code text not null unique,
  referred_by uuid references public.profiles (id) on delete set null,
  role text not null default 'user' check (role in ('user', 'admin')),
  status text not null default 'active' check (status in ('active', 'blocked')),
  vx_balance numeric(18,2) not null default 0,
  demo_usdt_balance numeric(18,2) not null default 0,
  compute_power integer not null default 0,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.gpu_devices (
  id text primary key,
  name text not null,
  price numeric(18,2) not null check (price >= 0),
  reward_3_days numeric(18,2) not null check (reward_3_days >= 0),
  reward_7_days numeric(18,2) not null check (reward_7_days >= 0),
  compute_power integer not null check (compute_power >= 0),
  image_url text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.user_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  device_id text not null references public.gpu_devices (id),
  status text not null default 'pending' check (status in ('pending', 'processing', 'active', 'completed')),
  start_date timestamptz not null default now(),
  end_date timestamptz,
  total_generated numeric(18,2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null check (type in ('deposit', 'withdrawal', 'device_purchase', 'device_reward', 'team_bonus', 'daily_claim', 'login_bonus')),
  amount numeric(18,2) not null,
  currency text not null check (currency in ('VX', 'USDT')),
  status text not null check (status in ('completed', 'pending', 'rejected')),
  description text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.daily_claims (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  amount numeric(18,2) not null,
  claim_date date not null,
  created_at timestamptz not null default now(),
  unique (user_id, claim_date)
);

create table if not exists public.admin_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.profiles (id) on delete cascade,
  action text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_set_updated_at on public.profiles;
create trigger trg_profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

create or replace function private.generate_invite_code(seed_text text)
returns text
language plpgsql
as $$
declare
  candidate text;
begin
  candidate := 'VYRO-' || substring(upper(md5(coalesce(seed_text, gen_random_uuid()::text) || clock_timestamp()::text)) from 1 for 6);
  while exists (select 1 from public.profiles where invite_code = candidate) loop
    candidate := 'VYRO-' || substring(upper(md5(gen_random_uuid()::text || clock_timestamp()::text)) from 1 for 6);
  end loop;
  return candidate;
end;
$$;

create or replace function private.is_admin(check_user uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = check_user
      and role = 'admin'
      and status = 'active'
  );
$$;

create or replace function private.is_team_scope(owner_user uuid, target_user uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  with direct_referrals as (
    select id
    from public.profiles
    where referred_by = owner_user
  )
  select exists (
    select 1
    from direct_referrals
    where id = target_user
  )
  or exists (
    select 1
    from public.profiles p
    join direct_referrals d on p.referred_by = d.id
    where p.id = target_user
  );
$$;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  referrer_id uuid;
  referral_code text;
  generated_invite_code text;
begin
  referral_code := upper(trim(coalesce(new.raw_user_meta_data ->> 'referral_code', '')));

  if referral_code = '' then
    raise exception 'Referral code is required';
  end if;

  select id
  into referrer_id
  from public.profiles
  where invite_code = referral_code
    and status = 'active'
  limit 1;

  if referrer_id is null then
    raise exception 'Invalid referral code';
  end if;

  generated_invite_code := private.generate_invite_code(new.id::text);

  insert into public.profiles (
    id,
    username,
    email,
    invite_code,
    referred_by,
    role,
    status,
    vx_balance,
    demo_usdt_balance,
    compute_power,
    created_at,
    updated_at
  )
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'username'), ''), split_part(coalesce(new.email, ''), '@', 1), 'user'),
    coalesce(new.email, ''),
    generated_invite_code,
    referrer_id,
    'user',
    'active',
    0,
    0,
    0,
    coalesce(new.created_at, now()),
    now()
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function private.handle_new_user();

create or replace function public.purchase_device(p_device_id text)
returns void
language plpgsql
as $$
declare
  current_profile public.profiles;
  selected_device public.gpu_devices;
begin
  select *
  into current_profile
  from public.profiles
  where id = auth.uid()
    and status = 'active';

  if current_profile is null then
    raise exception 'Profile not available';
  end if;

  select *
  into selected_device
  from public.gpu_devices
  where id = p_device_id
    and active = true;

  if selected_device is null then
    raise exception 'Device not found';
  end if;

  if current_profile.vx_balance < selected_device.price then
    raise exception 'Saldo VX insufficiente';
  end if;

  update public.profiles
  set vx_balance = vx_balance - selected_device.price,
      compute_power = compute_power + selected_device.compute_power,
      updated_at = now()
  where id = auth.uid();

  insert into public.user_devices (
    user_id,
    device_id,
    status,
    start_date,
    total_generated
  )
  values (
    auth.uid(),
    selected_device.id,
    'pending',
    now(),
    0
  );

  insert into public.transactions (
    user_id,
    type,
    amount,
    currency,
    status,
    description,
    metadata
  )
  values (
    auth.uid(),
    'device_purchase',
    -selected_device.price,
    'VX',
    'completed',
    'Attivazione ' || selected_device.name,
    jsonb_build_object('device_id', selected_device.id)
  );
end;
$$;

create or replace function public.claim_daily_reward()
returns numeric
language plpgsql
as $$
declare
  reward_amount numeric := 2.5;
  today_date date := timezone('utc', now())::date;
begin
  if exists (
    select 1
    from public.daily_claims
    where user_id = auth.uid()
      and claim_date = today_date
  ) then
    raise exception 'Già riscosso oggi';
  end if;

  insert into public.daily_claims (user_id, amount, claim_date)
  values (auth.uid(), reward_amount, today_date);

  update public.profiles
  set vx_balance = vx_balance + reward_amount,
      updated_at = now()
  where id = auth.uid();

  insert into public.transactions (
    user_id,
    type,
    amount,
    currency,
    status,
    description
  )
  values (
    auth.uid(),
    'daily_claim',
    reward_amount,
    'VX',
    'completed',
    'Claim giornaliero VX token'
  );

  return reward_amount;
end;
$$;

create or replace function public.admin_update_user_balance(
  p_user_id uuid,
  p_field text,
  p_amount numeric
)
returns void
language plpgsql
as $$
begin
  if not private.is_admin(auth.uid()) then
    raise exception 'Not allowed';
  end if;

  if p_field not in ('vx_balance', 'demo_usdt_balance') then
    raise exception 'Unsupported field';
  end if;

  if p_field = 'vx_balance' then
    update public.profiles
    set vx_balance = p_amount,
        updated_at = now()
    where id = p_user_id;
  else
    update public.profiles
    set demo_usdt_balance = p_amount,
        updated_at = now()
    where id = p_user_id;
  end if;

  insert into public.admin_logs (admin_id, action, metadata)
  values (
    auth.uid(),
    'update_user_balance',
    jsonb_build_object('user_id', p_user_id, 'field', p_field, 'amount', p_amount)
  );
end;
$$;

create or replace function public.admin_update_user_device_status(
  p_user_device_id uuid,
  p_status text
)
returns void
language plpgsql
as $$
begin
  if not private.is_admin(auth.uid()) then
    raise exception 'Not allowed';
  end if;

  if p_status not in ('pending', 'processing', 'active', 'completed') then
    raise exception 'Unsupported status';
  end if;

  update public.user_devices
  set status = p_status
  where id = p_user_device_id;

  insert into public.admin_logs (admin_id, action, metadata)
  values (
    auth.uid(),
    'update_user_device_status',
    jsonb_build_object('user_device_id', p_user_device_id, 'status', p_status)
  );
end;
$$;

create or replace function public.admin_block_user(p_user_id uuid)
returns void
language plpgsql
as $$
begin
  if not private.is_admin(auth.uid()) then
    raise exception 'Not allowed';
  end if;

  update public.profiles
  set status = 'blocked',
      updated_at = now()
  where id = p_user_id;

  insert into public.admin_logs (admin_id, action, metadata)
  values (
    auth.uid(),
    'block_user',
    jsonb_build_object('user_id', p_user_id)
  );
end;
$$;

alter table public.profiles enable row level security;
alter table public.gpu_devices enable row level security;
alter table public.user_devices enable row level security;
alter table public.transactions enable row level security;
alter table public.daily_claims enable row level security;
alter table public.admin_logs enable row level security;

drop policy if exists "profiles_select_scope" on public.profiles;
create policy "profiles_select_scope"
on public.profiles
for select
to authenticated
using (
  id = auth.uid()
  or private.is_team_scope(auth.uid(), id)
  or private.is_admin(auth.uid())
);

drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self"
on public.profiles
for insert
to authenticated
with check (id = auth.uid());

drop policy if exists "profiles_update_self_or_admin" on public.profiles;
create policy "profiles_update_self_or_admin"
on public.profiles
for update
to authenticated
using (id = auth.uid() or private.is_admin(auth.uid()))
with check (id = auth.uid() or private.is_admin(auth.uid()));

drop policy if exists "gpu_devices_read_all" on public.gpu_devices;
create policy "gpu_devices_read_all"
on public.gpu_devices
for select
to anon, authenticated
using (true);

drop policy if exists "user_devices_select_scope" on public.user_devices;
create policy "user_devices_select_scope"
on public.user_devices
for select
to authenticated
using (user_id = auth.uid() or private.is_admin(auth.uid()));

drop policy if exists "user_devices_insert_scope" on public.user_devices;
create policy "user_devices_insert_scope"
on public.user_devices
for insert
to authenticated
with check (user_id = auth.uid() or private.is_admin(auth.uid()));

drop policy if exists "user_devices_update_admin" on public.user_devices;
create policy "user_devices_update_admin"
on public.user_devices
for update
to authenticated
using (private.is_admin(auth.uid()))
with check (private.is_admin(auth.uid()));

drop policy if exists "transactions_select_scope" on public.transactions;
create policy "transactions_select_scope"
on public.transactions
for select
to authenticated
using (user_id = auth.uid() or private.is_admin(auth.uid()));

drop policy if exists "transactions_insert_scope" on public.transactions;
create policy "transactions_insert_scope"
on public.transactions
for insert
to authenticated
with check (user_id = auth.uid() or private.is_admin(auth.uid()));

drop policy if exists "daily_claims_select_scope" on public.daily_claims;
create policy "daily_claims_select_scope"
on public.daily_claims
for select
to authenticated
using (user_id = auth.uid() or private.is_admin(auth.uid()));

drop policy if exists "daily_claims_insert_scope" on public.daily_claims;
create policy "daily_claims_insert_scope"
on public.daily_claims
for insert
to authenticated
with check (user_id = auth.uid() or private.is_admin(auth.uid()));

drop policy if exists "admin_logs_select_admin" on public.admin_logs;
create policy "admin_logs_select_admin"
on public.admin_logs
for select
to authenticated
using (private.is_admin(auth.uid()));

drop policy if exists "admin_logs_insert_admin" on public.admin_logs;
create policy "admin_logs_insert_admin"
on public.admin_logs
for insert
to authenticated
with check (private.is_admin(auth.uid()));

insert into public.gpu_devices (id, name, price, reward_3_days, reward_7_days, compute_power, image_url, active)
values
  ('gpu-1', 'X-120', 80, 5.04, 12.32, 4, '/images/gpu-x120.jpg', true),
  ('gpu-2', 'G-88', 160, 10.99, 26.80, 8, '/images/gpu-g88.jpg', true),
  ('gpu-3', 'G-100', 480, 33.69, 82.19, 24, '/images/gpu-g100.jpg', true),
  ('gpu-4', 'G-700', 1200, 86.06, 209.94, 68, '/images/gpu-g700.jpg', true),
  ('gpu-5', 'G-900', 3000, 224.99, 548.84, 160, '/images/gpu-g900.jpg', true),
  ('gpu-6', 'X-5700', 7200, 565.69, 1379.93, 360, '/images/gpu-x5700.jpg', true),
  ('gpu-7', 'X-7900', 18000, 1507.00, 3703.00, 900, '/images/gpu-x7900.jpg', true),
  ('gpu-8', 'X-8900', 34000, 3125.00, 7677.00, 1800, '/images/gpu-x8900.jpg', true),
  ('gpu-9', 'IX-9900', 72000, 7600.00, 18666.00, 4200, '/images/gpu-ix9900.jpg', true)
on conflict (id) do update
set
  name = excluded.name,
  price = excluded.price,
  reward_3_days = excluded.reward_3_days,
  reward_7_days = excluded.reward_7_days,
  compute_power = excluded.compute_power,
  image_url = excluded.image_url,
  active = excluded.active;
