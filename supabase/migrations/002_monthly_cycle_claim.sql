-- ============================================================
-- Migration: Monthly cycle with manual claim/redeem
-- Devices stay permanently with users. Each month they redeem
-- (claim) their production and restart the cycle.
-- ============================================================

-- Update existing portfolio entries to 30-day cycles
-- cycle_reward is recalculated proportionally: reward_30_days = reward_7_days * 30 / 7
update public.portfolio_entries pe
set cycle_days = 30,
    cycle_reward = round((gc.reward_7_days * 30.0 / 7.0)::numeric, 2)
from public.gpu_catalog gc
where pe.name = gc.name;

-- Fallback for entries without a matching catalog entry
update public.portfolio_entries
set cycle_days = 30,
    cycle_reward = round((cycle_reward * 30.0 / 7.0)::numeric, 2)
where cycle_days <> 30;

-- Update purchase_device to use 30-day cycles
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
  v_monthly_reward numeric(18,2);
begin
  if v_user_id is null then
    return json_build_object('success', false, 'message', 'Non autenticato');
  end if;

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

  -- Monthly reward = weekly reward * 30/7
  v_monthly_reward := round((v_device.reward_7_days * 30.0 / 7.0)::numeric, 2);

  -- Deduct balance
  update public.profiles
  set balance = balance - v_device.price
  where id = v_user_id;

  -- Create portfolio entry with 30-day cycle
  v_entry_id := gen_random_uuid();
  insert into public.portfolio_entries (
    id, owner_id, name, allocation, value, change, cycle_reward, cycle_days, last_cycle_reset_at, position
  )
  values (
    v_entry_id, v_user_id, v_device.name, v_device.compute_power, v_device.price, 0, v_monthly_reward, 30, now(), 1
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
-- RPC: claim_device_production
-- User redeems the accrued production from a device,
-- credits to balance, resets cycle (last_cycle_reset_at = now).
-- The device stays permanently — only the cycle restarts.
-- ============================================================

create or replace function public.claim_device_production(
  p_entry_id uuid
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_entry public.portfolio_entries;
  v_cycle_ms bigint;
  v_elapsed_ms bigint;
  v_progress numeric;
  v_earned numeric(18,2);
begin
  if v_user_id is null then
    return json_build_object('success', false, 'message', 'Non autenticato');
  end if;

  select * into v_entry
  from public.portfolio_entries
  where id = p_entry_id and owner_id = v_user_id
  for update;

  if v_entry is null then
    return json_build_object('success', false, 'message', 'Dispositivo non trovato');
  end if;

  if v_entry.cycle_reward <= 0 then
    return json_build_object('success', false, 'message', 'Nessuna produzione da riscuotere');
  end if;

  -- Calculate elapsed time and earned amount (capped at cycle_reward)
  v_cycle_ms := (coalesce(v_entry.cycle_days, 30) * 86400000)::bigint;
  v_elapsed_ms := extract(epoch from (now() - coalesce(v_entry.last_cycle_reset_at, v_entry.created_at)))::bigint * 1000;

  if v_elapsed_ms <= 0 then
    return json_build_object('success', false, 'message', 'Produzione appena avviata');
  end if;

  -- Progress capped at 1.0 (100%)
  v_progress := least(v_elapsed_ms::numeric / v_cycle_ms::numeric, 1.0);
  v_earned := round((v_entry.cycle_reward * v_progress)::numeric, 2);

  if v_earned <= 0 then
    return json_build_object('success', false, 'message', 'Nessuna produzione da riscuotere');
  end if;

  -- Credit earned amount to user balance
  update public.profiles
  set balance = balance + v_earned
  where id = v_user_id;

  -- Reset cycle: update last_cycle_reset_at and accumulate total generated
  update public.portfolio_entries
  set last_cycle_reset_at = now(),
      change = change + v_earned
  where id = p_entry_id;

  -- Log activity
  insert into public.activity_logs (owner_id, type, description, amount)
  values (v_user_id, 'device_claim', 'Riscossione produzione ' || v_entry.name, v_earned);

  return json_build_object(
    'success', true,
    'message', 'Hai riscosso ' || v_earned || ' $ da ' || v_entry.name || '!',
    'amount', v_earned,
    'entry_id', p_entry_id
  );
end;
$$;
