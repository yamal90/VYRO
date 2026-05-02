-- VYRO GPU Enhanced Schema
-- Add achievements, loyalty, staking, promo codes, 2FA

-- ============================================
-- ACHIEVEMENTS SYSTEM
-- ============================================

create table if not exists public.user_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  achievement_id text not null,
  unlocked_at timestamptz not null default now(),
  xp_earned integer not null default 0,
  created_at timestamptz not null default now(),
  
  constraint unique_user_achievement unique (user_id, achievement_id)
);

create index idx_user_achievements_user_id on public.user_achievements(user_id);
create index idx_user_achievements_unlocked_at on public.user_achievements(unlocked_at desc);

-- ============================================
-- LOYALTY POINTS SYSTEM
-- ============================================

create table if not exists public.loyalty_points (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  points integer not null default 0,
  tier text not null default 'bronze' check (tier in ('bronze', 'silver', 'gold', 'platinum', 'diamond')),
  total_earned integer not null default 0,
  total_spent integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  constraint unique_user_loyalty unique (user_id)
);

create index idx_loyalty_points_user_id on public.loyalty_points(user_id);
create index idx_loyalty_points_tier on public.loyalty_points(tier);

create table if not exists public.loyalty_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  points integer not null,
  reason text not null,
  reference_id text,
  created_at timestamptz not null default now()
);

create index idx_loyalty_transactions_user_id on public.loyalty_transactions(user_id);
create index idx_loyalty_transactions_created_at on public.loyalty_transactions(created_at desc);

-- ============================================
-- STAKING SYSTEM
-- ============================================

create table if not exists public.staking_pools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  apy numeric(5,2) not null check (apy >= 0),
  min_stake numeric(18,2) not null check (min_stake >= 0),
  max_stake numeric(18,2),
  lock_period_days integer not null check (lock_period_days >= 0),
  is_active boolean not null default true,
  total_staked numeric(18,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_stakes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  pool_id uuid not null references public.staking_pools(id) on delete cascade,
  amount numeric(18,2) not null check (amount > 0),
  rewards_earned numeric(18,2) not null default 0,
  status text not null default 'active' check (status in ('active', 'unstaking', 'completed')),
  started_at timestamptz not null default now(),
  ends_at timestamptz,
  unstaked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_user_stakes_user_id on public.user_stakes(user_id);
create index idx_user_stakes_pool_id on public.user_stakes(pool_id);
create index idx_user_stakes_status on public.user_stakes(status);

-- ============================================
-- PROMO CODES
-- ============================================

create table if not exists public.promo_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  discount_type text not null check (discount_type in ('percentage', 'fixed', 'bonus')),
  discount_value numeric(18,2) not null,
  min_purchase numeric(18,2) default 0,
  max_uses integer,
  current_uses integer not null default 0,
  valid_from timestamptz not null default now(),
  valid_until timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_promo_uses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  promo_id uuid not null references public.promo_codes(id) on delete cascade,
  used_at timestamptz not null default now(),
  
  constraint unique_user_promo unique (user_id, promo_id)
);

create index idx_promo_codes_code on public.promo_codes(code);
create index idx_promo_codes_active on public.promo_codes(is_active);

-- ============================================
-- TWO-FACTOR AUTHENTICATION
-- ============================================

create table if not exists public.user_2fa (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  secret text not null,
  backup_codes text[] not null default '{}',
  is_enabled boolean not null default false,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  constraint unique_user_2fa unique (user_id)
);

create index idx_user_2fa_user_id on public.user_2fa(user_id);

-- ============================================
-- NOTIFICATION PREFERENCES
-- ============================================

create table if not exists public.notification_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  push_enabled boolean not null default true,
  email_enabled boolean not null default true,
  marketing_enabled boolean not null default false,
  transaction_alerts boolean not null default true,
  team_updates boolean not null default true,
  daily_claim_reminder boolean not null default true,
  achievement_notifications boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  constraint unique_user_notification_prefs unique (user_id)
);

create index idx_notification_preferences_user_id on public.notification_preferences(user_id);

-- ============================================
-- USER SESSIONS (Enhanced)
-- ============================================

create table if not exists public.user_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  device_info text,
  ip_address text,
  user_agent text,
  location text,
  is_current boolean not null default false,
  last_active timestamptz not null default now(),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create index idx_user_sessions_user_id on public.user_sessions(user_id);
create index idx_user_sessions_expires_at on public.user_sessions(expires_at);

-- ============================================
-- TIER HISTORY
-- ============================================

create table if not exists public.tier_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  old_tier text not null,
  new_tier text not null,
  reason text,
  changed_at timestamptz not null default now()
);

create index idx_tier_history_user_id on public.tier_history(user_id);
create index idx_tier_history_changed_at on public.tier_history(changed_at desc);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Calculate user tier based on stats
create or replace function public.calculate_user_tier(p_user_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance numeric;
  v_devices integer;
  v_team_size integer;
  v_tier text := 'zyra';
begin
  select balance, 
         (select count(*) from portfolio_entries where owner_id = p_user_id),
         team_size
  into v_balance, v_devices, v_team_size
  from profiles where id = p_user_id;
  
  if v_balance >= 100000 and v_devices >= 20 and v_team_size >= 100 then
    v_tier := 'infinity';
  elsif v_balance >= 50000 and v_devices >= 10 and v_team_size >= 50 then
    v_tier := 'quantum';
  elsif v_balance >= 10000 and v_devices >= 5 and v_team_size >= 20 then
    v_tier := 'nebula';
  elsif v_balance >= 1000 and v_devices >= 2 and v_team_size >= 5 then
    v_tier := 'vortex';
  end if;
  
  return v_tier;
end;
$$;

-- Award achievement
create or replace function public.award_achievement(
  p_user_id uuid,
  p_achievement_id text,
  p_xp integer default 0
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_exists boolean;
begin
  select exists(select 1 from user_achievements where user_id = p_user_id and achievement_id = p_achievement_id)
  into v_exists;
  
  if v_exists then
    return json_build_object('success', false, 'message', 'Achievement already unlocked');
  end if;
  
  insert into user_achievements (user_id, achievement_id, xp_earned)
  values (p_user_id, p_achievement_id, p_xp);
  
  insert into loyalty_transactions (user_id, points, reason, reference_id)
  values (p_user_id, p_xp, 'Achievement: ' || p_achievement_id, p_achievement_id);
  
  update loyalty_points
  set points = points + p_xp,
      total_earned = total_earned + p_xp,
      updated_at = now()
  where user_id = p_user_id;
  
  return json_build_object('success', true, 'message', 'Achievement unlocked', 'xp', p_xp);
end;
$$;

-- Stake tokens
create or replace function public.stake_tokens(
  p_pool_id uuid,
  p_amount numeric
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_pool public.staking_pools;
  v_user_balance numeric;
  v_current_stakes numeric;
begin
  if v_user_id is null then
    return json_build_object('success', false, 'message', 'Non autenticato');
  end if;

  select * into v_pool from staking_pools where id = p_pool_id and is_active = true;
  if v_pool is null then
    return json_build_object('success', false, 'message', 'Pool not found or inactive');
  end if;
  
  if p_amount < v_pool.min_stake then
    return json_build_object('success', false, 'message', 'Minimum stake not met');
  end if;
  
  if v_pool.max_stake is not null then
    select coalesce(sum(amount), 0) into v_current_stakes from user_stakes where pool_id = p_pool_id and status = 'active';
    if v_current_stakes + p_amount > v_pool.max_stake then
      return json_build_object('success', false, 'message', 'Pool capacity reached');
    end if;
  end if;
  
  select balance into v_user_balance from profiles where id = v_user_id for update;
  if v_user_balance < p_amount then
    return json_build_object('success', false, 'message', 'Insufficient balance');
  end if;
  
  update profiles set balance = balance - p_amount where id = v_user_id;
  
  insert into user_stakes (user_id, pool_id, amount, ends_at)
  values (v_user_id, p_pool_id, p_amount, now() + (v_pool.lock_period_days || ' days')::interval);
  
  update staking_pools set total_staked = total_staked + p_amount where id = p_pool_id;
  
  return json_build_object('success', true, 'message', 'Stake successful');
end;
$$;

-- Validate promo code
create or replace function public.validate_promo_code(
  p_code text,
  p_user_id uuid default null
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_promo public.promo_codes;
  v_already_used boolean := false;
begin
  select * into v_promo from promo_codes 
  where code = upper(trim(p_code)) 
    and is_active = true
    and (valid_until is null or valid_until > now())
    and (max_uses is null or current_uses < max_uses);
  
  if v_promo is null then
    return json_build_object('valid', false, 'message', 'Invalid or expired promo code');
  end if;
  
  if p_user_id is not null then
    select exists(select 1 from user_promo_uses where user_id = p_user_id and promo_id = v_promo.id)
    into v_already_used;
    
    if v_already_used then
      return json_build_object('valid', false, 'message', 'Promo code already used');
    end if;
  end if;
  
  return json_build_object(
    'valid', true,
    'message', 'ok',
    'discount_type', v_promo.discount_type,
    'discount_value', v_promo.discount_value,
    'min_purchase', v_promo.min_purchase,
    'promo_id', v_promo.id
  );
end;
$$;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

alter table public.user_achievements enable row level security;
alter table public.loyalty_points enable row level security;
alter table public.loyalty_transactions enable row level security;
alter table public.staking_pools enable row level security;
alter table public.user_stakes enable row level security;
alter table public.promo_codes enable row level security;
alter table public.user_promo_uses enable row level security;
alter table public.user_2fa enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.user_sessions enable row level security;
alter table public.tier_history enable row level security;

-- Policies for user_achievements
create policy "user_achievements_read_own" on public.user_achievements for select
  to authenticated using (user_id = auth.uid());

create policy "user_achievements_insert_own" on public.user_achievements for insert
  to authenticated with check (user_id = auth.uid());

-- Policies for loyalty_points
create policy "loyalty_points_read_own" on public.loyalty_points for select
  to authenticated using (user_id = auth.uid());

create policy "loyalty_points_write_own" on public.loyalty_points for all
  to authenticated using (user_id = auth.uid());

-- Policies for staking_pools (public read)
create policy "staking_pools_read_all" on public.staking_pools for select
  to authenticated using (true);

create policy "staking_pools_write_admin" on public.staking_pools for all
  to authenticated using (private.is_admin(auth.uid()));

-- Policies for user_stakes
create policy "user_stakes_read_own" on public.user_stakes for select
  to authenticated using (user_id = auth.uid());

create policy "user_stakes_write_own" on public.user_stakes for all
  to authenticated using (user_id = auth.uid());

-- Policies for promo_codes (public read active)
create policy "promo_codes_read_active" on public.promo_codes for select
  to authenticated using (is_active = true);

create policy "promo_codes_write_admin" on public.promo_codes for all
  to authenticated using (private.is_admin(auth.uid()));

-- Policies for user_2fa
create policy "user_2fa_read_own" on public.user_2fa for select
  to authenticated using (user_id = auth.uid());

create policy "user_2fa_write_own" on public.user_2fa for all
  to authenticated using (user_id = auth.uid());

-- Policies for notification_preferences
create policy "notification_preferences_read_own" on public.notification_preferences for select
  to authenticated using (user_id = auth.uid());

create policy "notification_preferences_write_own" on public.notification_preferences for all
  to authenticated using (user_id = auth.uid());

-- ============================================
-- GRANTS
-- ============================================

grant execute on function public.calculate_user_tier(uuid) to authenticated;
grant execute on function public.award_achievement(uuid, text, integer) to authenticated;
grant execute on function public.stake_tokens(uuid, numeric) to authenticated;
grant execute on function public.validate_promo_code(text, uuid) to authenticated;

-- ============================================
-- SEED DATA
-- ============================================

-- Insert default staking pools
insert into public.staking_pools (name, description, apy, min_stake, lock_period_days)
values
  ('Flex Pool', 'Flexible staking with no lock period', 5.00, 100, 0),
  ('Growth Pool', '30-day lock for higher returns', 12.00, 1000, 30),
  ('Power Pool', '90-day lock for maximum APY', 25.00, 5000, 90)
on conflict do nothing;

-- Insert welcome promo code
insert into public.promo_codes (code, discount_type, discount_value, min_purchase, max_uses, valid_until)
values ('WELCOME2024', 'percentage', 10, 100, 1000, now() + interval '1 year')
on conflict do nothing;
