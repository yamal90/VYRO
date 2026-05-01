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
-- Team members hardening: stable member link for nickname sync
-- ============================================================

alter table public.team_members
  add column if not exists member_user_id uuid references public.profiles(id) on delete cascade;

create unique index if not exists idx_team_members_owner_member_user_id
  on public.team_members (owner_id, member_user_id);

create index if not exists idx_team_members_member_user_id
  on public.team_members (member_user_id);

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
  insert into public.portfolio_entries (id, owner_id, name, allocation, value, change, position)
  values (v_entry_id, v_user_id, v_device.name, v_device.compute_power, v_device.price, 0, 1);

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

  select * into v_root from public.profiles where id = p_root_user_id;
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
      child.is_test_bot,
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
      grandchild.is_test_bot,
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

grant execute on function public.request_deposit(numeric, text) to authenticated;
grant execute on function public.request_withdrawal(numeric, text) to authenticated;

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
