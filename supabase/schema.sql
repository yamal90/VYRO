create extension if not exists pgcrypto;

create schema if not exists private;
revoke all on schema private from public;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null default '',
  username text not null,
  role text not null default 'user' check (role in ('user', 'admin')),
  avatar_url text,
  tier text not null default 'ZYRA',
  balance numeric(18,2) not null default 0,
  referral_code text not null unique,
  referred_by text,
  streak integer not null default 0,
  last_claim timestamptz,
  last_claim_amount numeric(18,2) not null default 0,
  joined_at timestamptz not null default now(),
  team_size integer not null default 0,
  account_blocked boolean not null default false,
  claim_eligible boolean not null default true,
  tier_override boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_profiles_referral_code on public.profiles (referral_code);
create index if not exists idx_profiles_referred_by on public.profiles (referred_by);
create index if not exists idx_profiles_role on public.profiles (role);

drop trigger if exists trg_profiles_set_updated_at on public.profiles;
create trigger trg_profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

create table if not exists public.portfolio_entries (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  allocation numeric(18,2) not null default 0,
  value numeric(18,2) not null default 0,
  change numeric(18,2) not null default 0,
  cycle_reward numeric(18,2) not null default 0,
  cycle_days integer not null default 7 check (cycle_days > 0),
  last_cycle_reset_at timestamptz,
  position integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_portfolio_entries_owner_id on public.portfolio_entries (owner_id);
create index if not exists idx_portfolio_entries_created_at on public.portfolio_entries (created_at desc);
create index if not exists idx_portfolio_entries_cycle_reset on public.portfolio_entries (owner_id, last_cycle_reset_at desc);

drop trigger if exists trg_portfolio_entries_set_updated_at on public.portfolio_entries;
create trigger trg_portfolio_entries_set_updated_at
before update on public.portfolio_entries
for each row
execute function public.set_updated_at();

create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  member_user_id uuid references public.profiles (id) on delete cascade,
  username text not null,
  avatar_url text,
  tier text not null default 'ZYRA',
  joined timestamptz not null default now(),
  contribution numeric(18,2) not null default 0,
  active_balance numeric(18,2) not null default 0,
  active_sub_count integer not null default 0,
  account_blocked boolean not null default false,
  claim_eligible boolean not null default true,
  is_test_bot boolean not null default false,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_team_members_owner_id on public.team_members (owner_id);
alter table public.team_members
  add column if not exists member_user_id uuid references public.profiles (id) on delete cascade;
create unique index if not exists idx_team_members_owner_member_user_id on public.team_members (owner_id, member_user_id);
create index if not exists idx_team_members_member_user_id on public.team_members (member_user_id);
create index if not exists idx_team_members_created_at on public.team_members (created_at desc);

drop trigger if exists trg_team_members_set_updated_at on public.team_members;
create trigger trg_team_members_set_updated_at
before update on public.team_members
for each row
execute function public.set_updated_at();

create table if not exists public.deposits (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  amount numeric(18,2) not null check (amount >= 0),
  asset text not null default 'USDT',
  network text not null default 'TRC20',
  tx_hash text,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create index if not exists idx_deposits_owner_id on public.deposits (owner_id);
create index if not exists idx_deposits_created_at on public.deposits (created_at desc);
create unique index if not exists idx_deposits_tx_hash_unique
  on public.deposits (lower(tx_hash))
  where tx_hash is not null and length(trim(tx_hash)) > 0;

create table if not exists public.withdrawals (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  amount numeric(18,2) not null check (amount >= 0),
  tx_hash text,
  status text not null default 'pending',
  wallet_address text,
  created_at timestamptz not null default now()
);

create index if not exists idx_withdrawals_owner_id on public.withdrawals (owner_id);
create index if not exists idx_withdrawals_created_at on public.withdrawals (created_at desc);
create unique index if not exists idx_withdrawals_tx_hash_unique
  on public.withdrawals (lower(tx_hash))
  where tx_hash is not null and length(trim(tx_hash)) > 0;

alter table public.deposits
  drop constraint if exists deposits_status_check;
alter table public.deposits
  add constraint deposits_status_check
  check (status = any (array['pending'::text, 'approved'::text, 'completed'::text, 'rejected'::text]));

alter table public.withdrawals
  drop constraint if exists withdrawals_status_check;
alter table public.withdrawals
  add constraint withdrawals_status_check
  check (status = any (array['pending'::text, 'approved'::text, 'completed'::text, 'rejected'::text]));

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  type text not null,
  description text not null,
  amount numeric(18,2),
  created_at timestamptz not null default now()
);

create index if not exists idx_activity_logs_owner_id on public.activity_logs (owner_id);
create index if not exists idx_activity_logs_type on public.activity_logs (type);
create index if not exists idx_activity_logs_created_at on public.activity_logs (created_at desc);

create table if not exists public.platform_settings (
  id integer primary key,
  maintenance_mode boolean not null default false,
  deposits_enabled boolean not null default true,
  withdrawals_enabled boolean not null default true,
  daily_claim_enabled boolean not null default true,
  min_deposit numeric(18,2) not null default 0,
  min_withdraw numeric(18,2) not null default 0,
  deposit_asset text not null default 'USDT',
  deposit_network text not null default 'TRC20',
  deposit_address text not null default '',
  updated_at timestamptz not null default now()
);

insert into public.platform_settings (id)
values (1)
on conflict (id) do nothing;

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  message text not null,
  seen boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_owner_id on public.notifications (owner_id);
alter table public.notifications
  add column if not exists seen boolean not null default false;
create index if not exists idx_notifications_seen on public.notifications (seen);

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  subject text not null,
  message text not null,
  status text not null default 'open' check (status in ('open', 'replied', 'closed')),
  admin_reply text,
  admin_replied_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_support_tickets_user_id on public.support_tickets (user_id);
create index if not exists idx_support_tickets_status on public.support_tickets (status);
create index if not exists idx_support_tickets_created_at on public.support_tickets (created_at desc);

drop trigger if exists trg_support_tickets_set_updated_at on public.support_tickets;
create trigger trg_support_tickets_set_updated_at
before update on public.support_tickets
for each row
execute function public.set_updated_at();

create or replace function private.is_admin(user_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = user_id
      and role = 'admin'
      and account_blocked = false
  );
$$;

create or replace function public.is_admin(user_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = user_id
      and role = 'admin'
      and account_blocked = false
  );
$$;

create or replace function private.generate_referral_code(seed_text text)
returns text
language plpgsql
as $$
declare
  candidate text;
begin
  candidate := 'VYRO-' || substring(upper(md5(coalesce(seed_text, gen_random_uuid()::text) || clock_timestamp()::text)) from 1 for 8);
  while exists (select 1 from public.profiles where referral_code = candidate) loop
    candidate := 'VYRO-' || substring(upper(md5(gen_random_uuid()::text || clock_timestamp()::text)) from 1 for 8);
  end loop;
  return candidate;
end;
$$;

create or replace function public.validate_referral_code(
  p_referral_code text
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text := upper(trim(coalesce(p_referral_code, '')));
  v_profile public.profiles;
begin
  if v_code = '' then
    return json_build_object('valid', false, 'message', 'Referral code obbligatorio');
  end if;

  select * into v_profile
  from public.profiles
  where referral_code = v_code
  limit 1;

  if v_profile is null or v_profile.account_blocked then
    return json_build_object('valid', false, 'message', 'Referral code non valido');
  end if;

  return json_build_object(
    'valid', true,
    'message', 'ok',
    'code', v_profile.referral_code,
    'referrer_id', v_profile.id
  );
end;
$$;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  username_from_meta text;
  referral_from_meta text;
begin
  username_from_meta := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'username'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    split_part(coalesce(new.email, ''), '@', 1),
    'user'
  );

  referral_from_meta := upper(trim(coalesce(
    new.raw_user_meta_data ->> 'referral_code',
    new.raw_user_meta_data ->> 'referralCode',
    'SYSTEM'
  )));

  insert into public.profiles (
    id,
    email,
    username,
    role,
    avatar_url,
    tier,
    balance,
    referral_code,
    referred_by,
    joined_at,
    claim_eligible
  )
  values (
    new.id,
    coalesce(new.email, ''),
    username_from_meta,
    'user',
    '',
    'ZYRA',
    0,
    private.generate_referral_code(new.id::text),
    case when referral_from_meta = '' then 'SYSTEM' else referral_from_meta end,
    coalesce(new.created_at, now()),
    true
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

create or replace function public.sync_referral_team_member(
  p_user_id uuid,
  p_referral_code text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_profile public.profiles;
  referrer_profile public.profiles;
begin
  select * into target_profile from public.profiles where id = p_user_id;
  if target_profile is null then
    raise exception 'Profile not found';
  end if;

  if target_profile.referred_by is not null and target_profile.referred_by <> 'SYSTEM' then
    return;
  end if;

  select * into referrer_profile
  from public.profiles
  where referral_code = upper(trim(p_referral_code))
  limit 1;

  if referrer_profile is null then
    raise exception 'Invalid referral code';
  end if;

  update public.profiles
  set referred_by = referrer_profile.referral_code,
      updated_at = now()
  where id = target_profile.id;

  insert into public.team_members (
    owner_id,
    member_user_id,
    username,
    avatar_url,
    tier,
    joined,
    contribution,
    active_balance,
    active_sub_count,
    account_blocked,
    claim_eligible,
    is_test_bot
  )
  values (
    referrer_profile.id,
    target_profile.id,
    target_profile.username,
    coalesce(target_profile.avatar_url, ''),
    coalesce(target_profile.tier, 'ZYRA'),
    target_profile.joined_at,
    0,
    target_profile.balance,
    0,
    target_profile.account_blocked,
    target_profile.claim_eligible,
    false
  )
  on conflict (owner_id, member_user_id) do nothing;

  update public.profiles
  set team_size = coalesce(team_size, 0) + 1,
      updated_at = now()
  where id = referrer_profile.id;
end;
$$;

create or replace function public.get_team_tree(
  p_root_user_id uuid
)
returns table (
  id text,
  owner_id uuid,
  member_user_id uuid,
  username text,
  avatar_url text,
  tier text,
  joined timestamptz,
  contribution numeric(18,2),
  active_balance numeric(18,2),
  active_sub_count integer,
  account_blocked boolean,
  claim_eligible boolean,
  is_test_bot boolean,
  level integer,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_root public.profiles;
  v_actor uuid := auth.uid();
begin
  if v_actor is null then
    return;
  end if;

  if v_actor <> p_root_user_id and not private.is_admin(v_actor) then
    raise exception 'Forbidden';
  end if;

  select * into v_root from public.profiles p where p.id = p_root_user_id;
  if v_root is null then
    return;
  end if;

  return query
  with recursive descendants as (
    select
      child.id as member_user_id,
      v_root.id as owner_id,
      child.username,
      child.avatar_url,
      child.tier,
      child.joined_at as joined,
      child.account_blocked,
      child.claim_eligible,
      false as is_test_bot,
      child.referral_code,
      1 as level
    from public.profiles child
    where child.referred_by = v_root.referral_code

    union all

    select
      grandchild.id as member_user_id,
      descendants.member_user_id as owner_id,
      grandchild.username,
      grandchild.avatar_url,
      grandchild.tier,
      grandchild.joined_at as joined,
      grandchild.account_blocked,
      grandchild.claim_eligible,
      false as is_test_bot,
      grandchild.referral_code,
      descendants.level + 1 as level
    from descendants
    join public.profiles parent on parent.id = descendants.member_user_id
    join public.profiles grandchild on grandchild.referred_by = parent.referral_code
    where descendants.level < 2
  )
  select
    coalesce(tm.id::text, descendants.owner_id::text || ':' || descendants.member_user_id::text) as id,
    descendants.owner_id,
    descendants.member_user_id,
    descendants.username,
    coalesce(tm.avatar_url, descendants.avatar_url, '') as avatar_url,
    coalesce(tm.tier, descendants.tier, 'ZYRA') as tier,
    coalesce(tm.joined, descendants.joined) as joined,
    coalesce(tm.contribution, 0)::numeric(18,2) as contribution,
    coalesce(tm.active_balance, 0)::numeric(18,2) as active_balance,
    coalesce(tm.active_sub_count, 0) as active_sub_count,
    coalesce(tm.account_blocked, descendants.account_blocked, false) as account_blocked,
    coalesce(tm.claim_eligible, descendants.claim_eligible, true) as claim_eligible,
    coalesce(tm.is_test_bot, descendants.is_test_bot, false) as is_test_bot,
    descendants.level,
    coalesce(tm.created_at, descendants.joined) as created_at,
    coalesce(tm.updated_at, descendants.joined) as updated_at
  from descendants
  left join public.team_members tm
    on tm.owner_id = descendants.owner_id
   and (
     tm.member_user_id = descendants.member_user_id
     or (tm.member_user_id is null and tm.username = descendants.username)
   )
  order by descendants.level asc, descendants.joined asc;
end;
$$;

create or replace function public.request_deposit(
  p_amount numeric,
  p_tx_hash text default null
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_profile public.profiles;
  v_settings public.platform_settings;
begin
  if v_user_id is null then
    return json_build_object('success', false, 'message', 'Non autenticato');
  end if;

  select * into v_profile from public.profiles where id = v_user_id;
  select * into v_settings from public.platform_settings where id = 1;

  if v_profile is null then
    return json_build_object('success', false, 'message', 'Profilo non trovato');
  end if;

  if v_profile.account_blocked then
    return json_build_object('success', false, 'message', 'Account bloccato');
  end if;

  if v_settings is not null and not v_settings.deposits_enabled then
    return json_build_object('success', false, 'message', 'Depositi disabilitati');
  end if;

  if v_settings is null or nullif(trim(v_settings.deposit_address), '') is null then
    return json_build_object('success', false, 'message', 'Indirizzo deposito non configurato');
  end if;

  if p_amount is null or p_amount <= 0 then
    return json_build_object('success', false, 'message', 'Importo deposito non valido');
  end if;

  if coalesce(v_settings.min_deposit, 0) > 0 and p_amount < v_settings.min_deposit then
    return json_build_object('success', false, 'message', 'Importo minimo deposito non raggiunto');
  end if;

  insert into public.deposits (
    owner_id,
    amount,
    asset,
    network,
    tx_hash,
    status
  )
  values (
    v_user_id,
    p_amount,
    coalesce(nullif(trim(v_settings.deposit_asset), ''), 'USDT'),
    coalesce(nullif(trim(v_settings.deposit_network), ''), 'TRC20'),
    nullif(trim(p_tx_hash), ''),
    'pending'
  );

  return json_build_object(
    'success', true,
    'message', 'Richiesta deposito salvata. Invia i fondi al wallet configurato.',
    'deposit_address', v_settings.deposit_address,
    'asset', coalesce(nullif(trim(v_settings.deposit_asset), ''), 'USDT'),
    'network', coalesce(nullif(trim(v_settings.deposit_network), ''), 'TRC20')
  );
end;
$$;

create or replace function public.request_withdrawal(
  p_amount numeric,
  p_wallet_address text
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_profile public.profiles;
  v_settings public.platform_settings;
  v_available numeric(18,2);
begin
  if v_user_id is null then
    return json_build_object('success', false, 'message', 'Non autenticato');
  end if;

  select * into v_profile from public.profiles where id = v_user_id;
  select * into v_settings from public.platform_settings where id = 1;

  if v_profile is null then
    return json_build_object('success', false, 'message', 'Profilo non trovato');
  end if;

  if v_profile.account_blocked then
    return json_build_object('success', false, 'message', 'Account bloccato');
  end if;

  if v_settings is not null and not v_settings.withdrawals_enabled then
    return json_build_object('success', false, 'message', 'Prelievi disabilitati');
  end if;

  if p_amount is null or p_amount <= 0 then
    return json_build_object('success', false, 'message', 'Importo prelievo non valido');
  end if;

  if coalesce(v_settings.min_withdraw, 0) > 0 and p_amount < v_settings.min_withdraw then
    return json_build_object('success', false, 'message', 'Importo minimo prelievo non raggiunto');
  end if;

  if nullif(trim(p_wallet_address), '') is null then
    return json_build_object('success', false, 'message', 'Wallet di prelievo obbligatorio');
  end if;

  select
    coalesce((
      select sum(d.amount)
      from public.deposits d
      where d.owner_id = v_user_id
        and d.status in ('approved', 'completed')
    ), 0)
    -
    coalesce((
      select sum(w.amount)
      from public.withdrawals w
      where w.owner_id = v_user_id
        and w.status <> 'rejected'
    ), 0)
  into v_available;

  if v_available < p_amount then
    return json_build_object('success', false, 'message', 'Saldo USDT insufficiente');
  end if;

  insert into public.withdrawals (
    owner_id,
    amount,
    wallet_address,
    status
  )
  values (
    v_user_id,
    p_amount,
    trim(p_wallet_address),
    'pending'
  );

  return json_build_object(
    'success', true,
    'message', 'Richiesta prelievo salvata. Il wallet è stato memorizzato.',
    'wallet_address', trim(p_wallet_address)
  );
end;
$$;

create or replace function public.apply_referral_link(
  p_referral_code text,
  p_target_user_id uuid default auth.uid()
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_target_id uuid := coalesce(p_target_user_id, auth.uid());
  v_code text := upper(trim(coalesce(p_referral_code, '')));
  v_target public.profiles;
  v_referrer public.profiles;
  v_exists boolean := false;
begin
  if v_target_id is null then
    return json_build_object('success', false, 'message', 'Utente non autenticato');
  end if;
  if v_code = '' then
    return json_build_object('success', false, 'message', 'Referral code obbligatorio');
  end if;
  if v_code in ('SYSTEM', 'NULL', 'UNDEFINED') then
    return json_build_object('success', true, 'message', 'Referral di sistema ignorato');
  end if;

  select * into v_target from public.profiles where id = v_target_id;
  if v_target is null then
    return json_build_object('success', false, 'message', 'Profilo target non trovato');
  end if;

  select * into v_referrer
  from public.profiles
  where referral_code = v_code
    and account_blocked = false
  limit 1;

  if v_referrer is null then
    return json_build_object('success', false, 'message', 'Referral code non valido');
  end if;
  if v_referrer.id = v_target.id then
    return json_build_object('success', false, 'message', 'Non puoi usare il tuo referral');
  end if;

  if coalesce(v_target.referred_by, 'SYSTEM') <> 'SYSTEM' and v_target.referred_by <> v_code then
    return json_build_object('success', true, 'message', 'Referral già assegnato');
  end if;

  update public.profiles
  set referred_by = v_code,
      updated_at = now()
  where id = v_target.id;

  select exists (
    select 1
    from public.team_members tm
    where tm.owner_id = v_referrer.id
      and (tm.member_user_id = v_target.id or tm.username = v_target.username)
  ) into v_exists;

  if not v_exists then
    insert into public.team_members (
      owner_id,
      member_user_id,
      username,
      avatar_url,
      tier,
      joined,
      contribution,
      active_balance,
      active_sub_count,
      account_blocked,
      claim_eligible,
      is_test_bot
    ) values (
      v_referrer.id,
      v_target.id,
      v_target.username,
      coalesce(v_target.avatar_url, ''),
      case when v_target.role = 'admin' then 'ADMIN' else 'ZYRA' end,
      v_target.joined_at,
      0,
      coalesce(v_target.balance, 0),
      0,
      coalesce(v_target.account_blocked, false),
      coalesce(v_target.claim_eligible, true),
      false
    );

    update public.profiles
    set team_size = coalesce(team_size, 0) + 1,
        updated_at = now()
    where id = v_referrer.id;
  end if;

  return json_build_object('success', true, 'message', 'Referral applicato');
end;
$$;

create or replace function public.admin_manage_deposit(
  p_deposit_id uuid,
  p_status text,
  p_tx_hash text default null
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin_id uuid := auth.uid();
  v_status text := lower(trim(coalesce(p_status, '')));
  v_tx_hash text := nullif(trim(coalesce(p_tx_hash, '')), '');
  v_row public.deposits;
begin
  if v_admin_id is null or not public.is_admin(v_admin_id) then
    return json_build_object('success', false, 'message', 'Non autorizzato');
  end if;
  if v_status not in ('pending', 'approved', 'completed', 'rejected') then
    return json_build_object('success', false, 'message', 'Stato non valido');
  end if;

  select * into v_row from public.deposits where id = p_deposit_id for update;
  if v_row is null then
    return json_build_object('success', false, 'message', 'Deposito non trovato');
  end if;

  if v_tx_hash is not null then
    if exists (
      select 1 from public.deposits d
      where d.id <> v_row.id
        and lower(coalesce(d.tx_hash, '')) = lower(v_tx_hash)
    ) or exists (
      select 1 from public.withdrawals w
      where lower(coalesce(w.tx_hash, '')) = lower(v_tx_hash)
    ) then
      return json_build_object('success', false, 'message', 'TX hash già usato');
    end if;
  end if;

  update public.deposits
  set status = v_status,
      tx_hash = coalesce(v_tx_hash, tx_hash)
  where id = v_row.id;

  insert into public.activity_logs (owner_id, type, description, amount)
  values (
    v_admin_id,
    'admin_manage_deposit',
    format('Deposito %s -> %s', v_row.id::text, v_status),
    coalesce(v_row.amount, 0)
  );

  return json_build_object('success', true, 'message', 'Deposito aggiornato');
end;
$$;

create or replace function public.admin_manage_withdrawal(
  p_withdrawal_id uuid,
  p_status text,
  p_tx_hash text default null
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin_id uuid := auth.uid();
  v_status text := lower(trim(coalesce(p_status, '')));
  v_tx_hash text := nullif(trim(coalesce(p_tx_hash, '')), '');
  v_row public.withdrawals;
begin
  if v_admin_id is null or not public.is_admin(v_admin_id) then
    return json_build_object('success', false, 'message', 'Non autorizzato');
  end if;
  if v_status not in ('pending', 'approved', 'completed', 'rejected') then
    return json_build_object('success', false, 'message', 'Stato non valido');
  end if;

  select * into v_row from public.withdrawals where id = p_withdrawal_id for update;
  if v_row is null then
    return json_build_object('success', false, 'message', 'Prelievo non trovato');
  end if;

  if v_tx_hash is not null then
    if exists (
      select 1 from public.withdrawals w
      where w.id <> v_row.id
        and lower(coalesce(w.tx_hash, '')) = lower(v_tx_hash)
    ) or exists (
      select 1 from public.deposits d
      where lower(coalesce(d.tx_hash, '')) = lower(v_tx_hash)
    ) then
      return json_build_object('success', false, 'message', 'TX hash già usato');
    end if;
  end if;

  update public.withdrawals
  set status = v_status,
      tx_hash = coalesce(v_tx_hash, tx_hash)
  where id = v_row.id;

  insert into public.activity_logs (owner_id, type, description, amount)
  values (
    v_admin_id,
    'admin_manage_withdrawal',
    format('Prelievo %s -> %s', v_row.id::text, v_status),
    coalesce(v_row.amount, 0)
  );

  return json_build_object('success', true, 'message', 'Prelievo aggiornato');
end;
$$;

grant execute on function public.request_deposit(numeric, text) to authenticated;
grant execute on function public.request_withdrawal(numeric, text) to authenticated;
grant execute on function public.validate_referral_code(text) to anon, authenticated;
grant execute on function public.apply_referral_link(text, uuid) to authenticated;
grant execute on function public.get_team_tree(uuid) to authenticated;
grant execute on function public.admin_manage_deposit(uuid, text, text) to authenticated;
grant execute on function public.admin_manage_withdrawal(uuid, text, text) to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "avatars_upload_own" on storage.objects;
create policy "avatars_upload_own"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "avatars_update_own" on storage.objects;
create policy "avatars_update_own"
on storage.objects for update
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "avatars_delete_own" on storage.objects;
create policy "avatars_delete_own"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "avatars_read_all" on storage.objects;
create policy "avatars_read_all"
on storage.objects for select
to authenticated
using (bucket_id = 'avatars');

alter table public.profiles enable row level security;
alter table public.portfolio_entries enable row level security;
alter table public.team_members enable row level security;
alter table public.deposits enable row level security;
alter table public.withdrawals enable row level security;
alter table public.activity_logs enable row level security;
alter table public.platform_settings enable row level security;
alter table public.notifications enable row level security;
alter table public.support_tickets enable row level security;

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
on public.profiles for select
to authenticated
using (auth.uid() = id or private.is_admin(auth.uid()));

drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin"
on public.profiles for update
to authenticated
using (auth.uid() = id or private.is_admin(auth.uid()))
with check (auth.uid() = id or private.is_admin(auth.uid()));

drop policy if exists "portfolio_entries_read_own_or_admin" on public.portfolio_entries;
create policy "portfolio_entries_read_own_or_admin"
on public.portfolio_entries for select
to authenticated
using (owner_id = auth.uid() or private.is_admin(auth.uid()));

drop policy if exists "portfolio_entries_write_own_or_admin" on public.portfolio_entries;
create policy "portfolio_entries_write_own_or_admin"
on public.portfolio_entries for all
to authenticated
using (owner_id = auth.uid() or private.is_admin(auth.uid()))
with check (owner_id = auth.uid() or private.is_admin(auth.uid()));

drop policy if exists "team_members_read_own_or_admin" on public.team_members;
create policy "team_members_read_own_or_admin"
on public.team_members for select
to authenticated
using (owner_id = auth.uid() or private.is_admin(auth.uid()));

drop policy if exists "team_members_write_admin_only" on public.team_members;
create policy "team_members_write_admin_only"
on public.team_members for all
to authenticated
using (private.is_admin(auth.uid()))
with check (private.is_admin(auth.uid()));

drop policy if exists "deposits_read_own_or_admin" on public.deposits;
create policy "deposits_read_own_or_admin"
on public.deposits for select
to authenticated
using (owner_id = auth.uid() or private.is_admin(auth.uid()));

drop policy if exists "deposits_write_own_or_admin" on public.deposits;
create policy "deposits_write_own_or_admin"
on public.deposits for all
to authenticated
using (owner_id = auth.uid() or private.is_admin(auth.uid()))
with check (owner_id = auth.uid() or private.is_admin(auth.uid()));

drop policy if exists "withdrawals_read_own_or_admin" on public.withdrawals;
create policy "withdrawals_read_own_or_admin"
on public.withdrawals for select
to authenticated
using (owner_id = auth.uid() or private.is_admin(auth.uid()));

drop policy if exists "withdrawals_write_own_or_admin" on public.withdrawals;
create policy "withdrawals_write_own_or_admin"
on public.withdrawals for all
to authenticated
using (owner_id = auth.uid() or private.is_admin(auth.uid()))
with check (owner_id = auth.uid() or private.is_admin(auth.uid()));

drop policy if exists "activity_logs_read_own_or_admin" on public.activity_logs;
create policy "activity_logs_read_own_or_admin"
on public.activity_logs for select
to authenticated
using (owner_id = auth.uid() or private.is_admin(auth.uid()));

drop policy if exists "activity_logs_insert_own_or_admin" on public.activity_logs;
create policy "activity_logs_insert_own_or_admin"
on public.activity_logs for insert
to authenticated
with check (owner_id = auth.uid() or private.is_admin(auth.uid()));

drop policy if exists "platform_settings_read_authenticated" on public.platform_settings;
create policy "platform_settings_read_authenticated"
on public.platform_settings for select
to authenticated
using (true);

drop policy if exists "platform_settings_update_admin_only" on public.platform_settings;
create policy "platform_settings_update_admin_only"
on public.platform_settings for update
to authenticated
using (private.is_admin(auth.uid()))
with check (private.is_admin(auth.uid()));

drop policy if exists "notifications_read_own_or_admin" on public.notifications;
create policy "notifications_read_own_or_admin"
on public.notifications for select
to authenticated
using (owner_id = auth.uid() or private.is_admin(auth.uid()));

drop policy if exists "notifications_write_own_or_admin" on public.notifications;
create policy "notifications_write_own_or_admin"
on public.notifications for all
to authenticated
using (owner_id = auth.uid() or private.is_admin(auth.uid()))
with check (owner_id = auth.uid() or private.is_admin(auth.uid()));

drop policy if exists "support_tickets_read_own_or_admin" on public.support_tickets;
create policy "support_tickets_read_own_or_admin"
on public.support_tickets for select
to authenticated
using (user_id = auth.uid() or private.is_admin(auth.uid()));

drop policy if exists "support_tickets_write_own_or_admin" on public.support_tickets;
create policy "support_tickets_write_own_or_admin"
on public.support_tickets for all
to authenticated
using (user_id = auth.uid() or private.is_admin(auth.uid()))
with check (user_id = auth.uid() or private.is_admin(auth.uid()));
