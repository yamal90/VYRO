-- ============================================================
-- public.is_admin helper (needed by RLS policies below)
-- ============================================================

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

-- ============================================================
-- Server-side GPU device catalog (source of truth for prices)
-- ============================================================

create table if not exists public.gpu_catalog (
  id text primary key,
  name text not null,
  price numeric(18,2) not null check (price > 0),
  compute_power integer not null check (compute_power > 0),
  reward_7_days numeric(18,2) not null default 0,
  active boolean not null default true
);

insert into public.gpu_catalog (id, name, price, compute_power, reward_7_days) values
  ('gpu-1', 'Intel Core i3-12100',    80,    4,    12.32),
  ('gpu-2', 'Intel Core i5-12400F',   160,   8,    26.80),
  ('gpu-3', 'AMD Ryzen 5 5600',       480,   24,   82.19),
  ('gpu-4', 'Intel Core i5-13400F',   1200,  68,   209.94),
  ('gpu-5', 'AMD Ryzen 5 7600',       3000,  160,  548.84),
  ('gpu-6', 'Intel Core i7-13700KF',  7200,  360,  1379.93),
  ('gpu-7', 'AMD Ryzen 7 7800X3D',    18000, 900,  3703.00),
  ('gpu-8', 'Intel Core i9-14900K',   34000, 1800, 7677.00),
  ('gpu-9', 'AMD Ryzen 9 7950X3D',    72000, 4200, 18666.00)
on conflict (id) do update set
  name = excluded.name,
  price = excluded.price,
  compute_power = excluded.compute_power,
  reward_7_days = excluded.reward_7_days;

alter table public.gpu_catalog enable row level security;

drop policy if exists "gpu_catalog_read_authenticated" on public.gpu_catalog;
create policy "gpu_catalog_read_authenticated"
on public.gpu_catalog for select
to authenticated
using (true);

drop policy if exists "gpu_catalog_write_admin_only" on public.gpu_catalog;
create policy "gpu_catalog_write_admin_only"
on public.gpu_catalog for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

-- ============================================================
-- Portfolio cycle metadata (7-day production loop)
-- ============================================================

alter table public.portfolio_entries
  add column if not exists cycle_reward numeric(18,2) not null default 0,
  add column if not exists cycle_days integer not null default 7 check (cycle_days > 0),
  add column if not exists last_cycle_reset_at timestamptz;

create index if not exists idx_portfolio_entries_cycle_reset
  on public.portfolio_entries (owner_id, last_cycle_reset_at desc);

update public.portfolio_entries pe
set cycle_reward = greatest(pe.change, gc.reward_7_days, 0),
    cycle_days = case when pe.cycle_days is null or pe.cycle_days <= 0 then 7 else pe.cycle_days end,
    last_cycle_reset_at = coalesce(pe.last_cycle_reset_at, pe.created_at)
from public.gpu_catalog gc
where pe.name = gc.name
  and (pe.cycle_reward is null or pe.cycle_reward <= 0 or pe.last_cycle_reset_at is null);

update public.portfolio_entries
set cycle_reward = greatest(change, 0),
    cycle_days = case when cycle_days is null or cycle_days <= 0 then 7 else cycle_days end,
    last_cycle_reset_at = coalesce(last_cycle_reset_at, created_at)
where cycle_reward is null
   or cycle_reward <= 0
   or last_cycle_reset_at is null;

-- ============================================================
-- Team members hardening: stable member link for nickname sync
-- ============================================================

alter table public.team_members
  add column if not exists member_user_id uuid references public.profiles(id) on delete cascade;

create unique index if not exists idx_team_members_owner_member_user_id
  on public.team_members (owner_id, member_user_id);

create index if not exists idx_team_members_member_user_id
  on public.team_members (member_user_id);

create unique index if not exists idx_deposits_tx_hash_unique
  on public.deposits (lower(tx_hash))
  where tx_hash is not null and length(trim(tx_hash)) > 0;

create unique index if not exists idx_withdrawals_tx_hash_unique
  on public.withdrawals (lower(tx_hash))
  where tx_hash is not null and length(trim(tx_hash)) > 0;

-- ============================================================
-- Normalize legacy status values and enforce unified statuses
-- ============================================================

update public.deposits
set status = case
  when lower(coalesce(status, '')) = 'confirmed' then 'completed'
  when lower(coalesce(status, '')) in ('pending', 'approved', 'completed', 'rejected') then lower(status)
  else 'pending'
end;

update public.withdrawals
set status = case
  when lower(coalesce(status, '')) = 'requested' then 'pending'
  when lower(coalesce(status, '')) = 'paid' then 'completed'
  when lower(coalesce(status, '')) in ('pending', 'approved', 'completed', 'rejected') then lower(status)
  else 'pending'
end;

alter table public.deposits
  alter column status set default 'pending';
alter table public.withdrawals
  alter column status set default 'pending';

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

update public.team_members tm
set member_user_id = p.id
from public.profiles owner, public.profiles p
where tm.owner_id = owner.id
  and tm.member_user_id is null
  and p.referred_by = owner.referral_code
  and p.username = tm.username;

-- ============================================================
-- RPC: purchase_device
-- Looks up device in server-side catalog, validates balance,
-- creates portfolio entry, deducts balance, logs activity.
-- ============================================================

create or replace function public.purchase_device(
  p_device_id text
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_profile public.profiles;
  v_device public.gpu_catalog;
  v_entry_id uuid;
begin
  if v_user_id is null then
    return json_build_object('success', false, 'message', 'Non autenticato');
  end if;

  -- Look up device from trusted server-side catalog
  select * into v_device from public.gpu_catalog where id = p_device_id and active = true;
  if v_device is null then
    return json_build_object('success', false, 'message', 'Dispositivo non trovato o non disponibile');
  end if;

  select * into v_profile from public.profiles where id = v_user_id for update;

  if v_profile is null then
    return json_build_object('success', false, 'message', 'Profilo non trovato');
  end if;

  if v_profile.account_blocked then
    return json_build_object('success', false, 'message', 'Account bloccato');
  end if;

  if v_profile.balance < v_device.price then
    return json_build_object('success', false, 'message', 'Saldo insufficiente');
  end if;

  -- Deduct balance
  update public.profiles
  set balance = balance - v_device.price
  where id = v_user_id;

  -- Create portfolio entry
  v_entry_id := gen_random_uuid();
  insert into public.portfolio_entries (
    id, owner_id, name, allocation, value, change, cycle_reward, cycle_days, last_cycle_reset_at, position
  )
  values (
    v_entry_id, v_user_id, v_device.name, v_device.compute_power, v_device.price, 0, v_device.reward_7_days, 7, now(), 1
  );

  -- Log activity
  insert into public.activity_logs (owner_id, type, description, amount)
  values (v_user_id, 'device_purchase', 'Acquisto ' || v_device.name, -v_device.price);

  return json_build_object(
    'success', true,
    'message', v_device.name || ' attivato con successo!',
    'entry_id', v_entry_id
  );
end;
$$;

-- ============================================================
-- RPC: claim_daily_reward
-- Validates eligibility, streak, cooldown — all server-side.
-- ============================================================

create or replace function public.claim_daily_reward()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_profile public.profiles;
  v_settings public.platform_settings;
  v_today date := current_date;
  v_amount numeric(18,2);
  v_new_streak integer;
begin
  if v_user_id is null then
    return json_build_object('success', false, 'message', 'Non autenticato');
  end if;

  select * into v_settings from public.platform_settings where id = 1;
  if v_settings is not null and not v_settings.daily_claim_enabled then
    return json_build_object('success', false, 'message', 'Daily claim disabilitato');
  end if;

  select * into v_profile from public.profiles where id = v_user_id for update;

  if v_profile is null then
    return json_build_object('success', false, 'message', 'Profilo non trovato');
  end if;

  if v_profile.account_blocked then
    return json_build_object('success', false, 'message', 'Account bloccato');
  end if;

  if not v_profile.claim_eligible then
    return json_build_object('success', false, 'message', 'Claim non abilitato per questo account');
  end if;

  -- Check if already claimed today
  if v_profile.last_claim is not null and v_profile.last_claim::date = v_today then
    return json_build_object('success', false, 'message', 'Hai già riscosso il premio oggi');
  end if;

  -- Calculate streak
  if v_profile.last_claim is not null and v_profile.last_claim::date = v_today - interval '1 day' then
    v_new_streak := v_profile.streak + 1;
  else
    v_new_streak := 1;
  end if;

  -- Calculate reward (base 0.5 VX + streak bonus capped at 30)
  v_amount := 0.50 + least(v_new_streak, 30) * 0.10;

  -- Update profile
  update public.profiles
  set balance = balance + v_amount,
      streak = v_new_streak,
      last_claim = now(),
      last_claim_amount = v_amount
  where id = v_user_id;

  -- Log activity
  insert into public.activity_logs (owner_id, type, description, amount)
  values (v_user_id, 'daily_claim', 'Daily Claim giorno ' || v_new_streak, v_amount);

  return json_build_object(
    'success', true,
    'message', 'Hai riscosso ' || v_amount || ' VX! Streak: ' || v_new_streak,
    'amount', v_amount,
    'streak', v_new_streak
  );
end;
$$;

-- ============================================================
-- RPC: leaderboard_top
-- Returns top users by balance for the public leaderboard.
-- ============================================================

create or replace function public.leaderboard_top(p_limit integer default 10)
returns table (
  pos bigint,
  username text,
  vx numeric,
  power integer
)
language sql
security definer
set search_path = public
as $$
  select
    row_number() over (order by p.balance desc) as pos,
    p.username,
    p.balance as vx,
    coalesce((
      select sum(pe.allocation)::integer
      from public.portfolio_entries pe
      where pe.owner_id = p.id
    ), 0) as power
  from public.profiles p
  where p.account_blocked = false
  order by p.balance desc
  limit p_limit;
$$;

-- ============================================================
-- RPC: get_team_tree
-- Returns level 1 and level 2 referral descendants for the owner.
-- ============================================================

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

create or replace function public.admin_assign_device_to_user(
  p_user_id uuid,
  p_device_id text,
  p_charge_balance boolean default false
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin_id uuid := auth.uid();
  v_target public.profiles;
  v_device public.gpu_catalog;
  v_entry_id uuid := gen_random_uuid();
  v_position integer := 1;
begin
  if v_admin_id is null or not public.is_admin(v_admin_id) then
    return json_build_object('success', false, 'message', 'Non autorizzato');
  end if;
  if p_user_id is null then
    return json_build_object('success', false, 'message', 'Utente non valido');
  end if;

  select * into v_target
  from public.profiles
  where id = p_user_id
  for update;

  if v_target is null then
    return json_build_object('success', false, 'message', 'Utente non trovato');
  end if;

  select * into v_device
  from public.gpu_catalog
  where id = trim(coalesce(p_device_id, ''))
    and active = true;

  if v_device is null then
    return json_build_object('success', false, 'message', 'Dispositivo non disponibile');
  end if;

  if p_charge_balance and coalesce(v_target.balance, 0) < coalesce(v_device.price, 0) then
    return json_build_object('success', false, 'message', 'Saldo utente insufficiente per addebito');
  end if;

  if p_charge_balance then
    update public.profiles
    set balance = coalesce(balance, 0) - coalesce(v_device.price, 0),
        updated_at = now()
    where id = v_target.id;
  end if;

  select coalesce(max(pe.position), 0) + 1 into v_position
  from public.portfolio_entries pe
  where pe.owner_id = v_target.id;

  insert into public.portfolio_entries (
    id, owner_id, name, allocation, value, change, cycle_reward, cycle_days, last_cycle_reset_at, position
  )
  values (
    v_entry_id,
    v_target.id,
    v_device.name,
    v_device.compute_power,
    v_device.price,
    0,
    v_device.reward_7_days,
    7,
    now(),
    v_position
  );

  insert into public.activity_logs (owner_id, type, description, amount)
  values (
    v_target.id,
    'admin_device_assign',
    format('Admin %s ha assegnato %s', v_admin_id::text, v_device.name),
    case when p_charge_balance then -coalesce(v_device.price, 0) else 0 end
  );

  insert into public.activity_logs (owner_id, type, description, amount)
  values (
    v_admin_id,
    'admin_device_assign',
    format('Assegnato %s a %s', v_device.name, v_target.email),
    coalesce(v_device.price, 0)
  );

  return json_build_object(
    'success', true,
    'message', format('Dispositivo %s assegnato a %s', v_device.name, v_target.username),
    'entry_id', v_entry_id
  );
end;
$$;

create or replace function public.admin_remove_user_device(
  p_entry_id uuid,
  p_refund boolean default false
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin_id uuid := auth.uid();
  v_entry public.portfolio_entries;
  v_target public.profiles;
  v_refund_amount numeric(18,2) := 0;
begin
  if v_admin_id is null or not public.is_admin(v_admin_id) then
    return json_build_object('success', false, 'message', 'Non autorizzato');
  end if;
  if p_entry_id is null then
    return json_build_object('success', false, 'message', 'Dispositivo utente non valido');
  end if;

  select * into v_entry
  from public.portfolio_entries
  where id = p_entry_id
  for update;

  if v_entry is null then
    return json_build_object('success', false, 'message', 'Dispositivo non trovato');
  end if;

  select * into v_target
  from public.profiles
  where id = v_entry.owner_id
  for update;

  if v_target is null then
    return json_build_object('success', false, 'message', 'Utente collegato non trovato');
  end if;

  if p_refund then
    v_refund_amount := greatest(coalesce(v_entry.value, 0), 0);
    update public.profiles
    set balance = coalesce(balance, 0) + v_refund_amount,
        updated_at = now()
    where id = v_target.id;
  end if;

  delete from public.portfolio_entries
  where id = v_entry.id;

  insert into public.activity_logs (owner_id, type, description, amount)
  values (
    v_target.id,
    'admin_device_remove',
    format('Admin %s ha rimosso dispositivo %s', v_admin_id::text, v_entry.name),
    case when p_refund then v_refund_amount else 0 end
  );

  insert into public.activity_logs (owner_id, type, description, amount)
  values (
    v_admin_id,
    'admin_device_remove',
    format('Rimosso %s da %s', v_entry.name, v_target.email),
    case when p_refund then v_refund_amount else 0 end
  );

  return json_build_object(
    'success', true,
    'message', case when p_refund then 'Dispositivo rimosso e rimborso applicato' else 'Dispositivo rimosso' end
  );
end;
$$;

grant execute on function public.purchase_device(text) to authenticated;
grant execute on function public.claim_daily_reward() to authenticated;
grant execute on function public.leaderboard_top(integer) to authenticated;
grant execute on function public.get_team_tree(uuid) to authenticated;
grant execute on function public.request_deposit(numeric, text) to authenticated;
grant execute on function public.request_withdrawal(numeric, text) to authenticated;
grant execute on function public.validate_referral_code(text) to anon, authenticated;
grant execute on function public.apply_referral_link(text, uuid) to authenticated;
grant execute on function public.admin_manage_deposit(uuid, text, text) to authenticated;
grant execute on function public.admin_manage_withdrawal(uuid, text, text) to authenticated;
grant execute on function public.admin_assign_device_to_user(uuid, text, boolean) to authenticated;
grant execute on function public.admin_remove_user_device(uuid, boolean) to authenticated;

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

-- ============================================================
-- Remove legacy broad policies created by the base schema.
-- ============================================================

drop policy if exists "activity_owner_or_admin" on public.activity_logs;
drop policy if exists "settings_admin_write" on public.platform_settings;
drop policy if exists "settings_select_all_auth" on public.platform_settings;
drop policy if exists "notifications_owner_or_admin" on public.notifications;
drop policy if exists "notifications_write_own_or_admin" on public.notifications;
drop policy if exists "support_tickets_owner_or_admin" on public.support_tickets;
drop policy if exists "support_tickets_write_own_or_admin" on public.support_tickets;
drop policy if exists "team_owner_or_admin" on public.team_members;

-- ============================================================
-- Tighten RLS: portfolio_entries — insert only via RPC
-- Users can read their own, but cannot insert/update/delete directly.
-- ============================================================

drop policy if exists "portfolio_owner_or_admin" on public.portfolio_entries;
drop policy if exists "portfolio_entries_write_own_or_admin" on public.portfolio_entries;
drop policy if exists "portfolio_entries_insert_admin_only" on public.portfolio_entries;
drop policy if exists "portfolio_entries_update_admin_only" on public.portfolio_entries;
drop policy if exists "portfolio_entries_delete_admin_only" on public.portfolio_entries;

create policy "portfolio_entries_insert_admin_only"
on public.portfolio_entries for insert
to authenticated
with check (public.is_admin(auth.uid()));

create policy "portfolio_entries_update_admin_only"
on public.portfolio_entries for update
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create policy "portfolio_entries_delete_admin_only"
on public.portfolio_entries for delete
to authenticated
using (public.is_admin(auth.uid()));

-- ============================================================
-- Tighten RLS: deposits — insert only via RPC / admin
-- ============================================================

drop policy if exists "deposits_owner_or_admin" on public.deposits;
drop policy if exists "deposits_write_own_or_admin" on public.deposits;
drop policy if exists "deposits_insert_admin_only" on public.deposits;
drop policy if exists "deposits_update_admin_only" on public.deposits;
drop policy if exists "deposits_delete_admin_only" on public.deposits;

create policy "deposits_insert_admin_only"
on public.deposits for insert
to authenticated
with check (public.is_admin(auth.uid()));

create policy "deposits_update_admin_only"
on public.deposits for update
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create policy "deposits_delete_admin_only"
on public.deposits for delete
to authenticated
using (public.is_admin(auth.uid()));

-- ============================================================
-- Tighten RLS: withdrawals — insert only via RPC / admin
-- ============================================================

drop policy if exists "withdrawals_owner_or_admin" on public.withdrawals;
drop policy if exists "withdrawals_write_own_or_admin" on public.withdrawals;
drop policy if exists "withdrawals_insert_admin_only" on public.withdrawals;
drop policy if exists "withdrawals_update_admin_only" on public.withdrawals;
drop policy if exists "withdrawals_delete_admin_only" on public.withdrawals;

create policy "withdrawals_insert_admin_only"
on public.withdrawals for insert
to authenticated
with check (public.is_admin(auth.uid()));

create policy "withdrawals_update_admin_only"
on public.withdrawals for update
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create policy "withdrawals_delete_admin_only"
on public.withdrawals for delete
to authenticated
using (public.is_admin(auth.uid()));
