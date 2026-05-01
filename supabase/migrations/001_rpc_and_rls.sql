-- ============================================================
-- RPC: purchase_device
-- Validates balance, creates portfolio entry, deducts balance,
-- and logs activity — all server-side in a single transaction.
-- ============================================================

create or replace function public.purchase_device(
  p_device_name text,
  p_device_price numeric,
  p_compute_power integer
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_profile public.profiles;
  v_entry_id uuid;
begin
  if v_user_id is null then
    return json_build_object('success', false, 'message', 'Non autenticato');
  end if;

  select * into v_profile from public.profiles where id = v_user_id for update;

  if v_profile is null then
    return json_build_object('success', false, 'message', 'Profilo non trovato');
  end if;

  if v_profile.account_blocked then
    return json_build_object('success', false, 'message', 'Account bloccato');
  end if;

  if v_profile.balance < p_device_price then
    return json_build_object('success', false, 'message', 'Saldo insufficiente');
  end if;

  -- Deduct balance
  update public.profiles
  set balance = balance - p_device_price
  where id = v_user_id;

  -- Create portfolio entry
  v_entry_id := gen_random_uuid();
  insert into public.portfolio_entries (id, owner_id, name, allocation, value, change, position)
  values (v_entry_id, v_user_id, p_device_name, p_device_price, p_compute_power, 0, 1);

  -- Log activity
  insert into public.activity_logs (owner_id, type, description, amount)
  values (v_user_id, 'device_purchase', 'Acquisto ' || p_device_name, -p_device_price);

  return json_build_object(
    'success', true,
    'message', p_device_name || ' attivato con successo!',
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
      select sum(pe.value)::integer
      from public.portfolio_entries pe
      where pe.owner_id = p.id
    ), 0) as power
  from public.profiles p
  where p.account_blocked = false
  order by p.balance desc
  limit p_limit;
$$;

-- ============================================================
-- Tighten RLS: portfolio_entries — insert only via RPC
-- Users can read their own, but cannot insert/update/delete directly.
-- ============================================================

drop policy if exists "portfolio_entries_write_own_or_admin" on public.portfolio_entries;

create policy "portfolio_entries_insert_admin_only"
on public.portfolio_entries for insert
to authenticated
with check (private.is_admin(auth.uid()));

create policy "portfolio_entries_update_admin_only"
on public.portfolio_entries for update
to authenticated
using (private.is_admin(auth.uid()))
with check (private.is_admin(auth.uid()));

create policy "portfolio_entries_delete_admin_only"
on public.portfolio_entries for delete
to authenticated
using (private.is_admin(auth.uid()));

-- ============================================================
-- Tighten RLS: deposits — insert only via RPC / admin
-- ============================================================

drop policy if exists "deposits_write_own_or_admin" on public.deposits;

create policy "deposits_insert_admin_only"
on public.deposits for insert
to authenticated
with check (private.is_admin(auth.uid()));

create policy "deposits_update_admin_only"
on public.deposits for update
to authenticated
using (private.is_admin(auth.uid()))
with check (private.is_admin(auth.uid()));

create policy "deposits_delete_admin_only"
on public.deposits for delete
to authenticated
using (private.is_admin(auth.uid()));

-- ============================================================
-- Tighten RLS: withdrawals — insert only via RPC / admin
-- ============================================================

drop policy if exists "withdrawals_write_own_or_admin" on public.withdrawals;

create policy "withdrawals_insert_admin_only"
on public.withdrawals for insert
to authenticated
with check (private.is_admin(auth.uid()));

create policy "withdrawals_update_admin_only"
on public.withdrawals for update
to authenticated
using (private.is_admin(auth.uid()))
with check (private.is_admin(auth.uid()));

create policy "withdrawals_delete_admin_only"
on public.withdrawals for delete
to authenticated
using (private.is_admin(auth.uid()));
