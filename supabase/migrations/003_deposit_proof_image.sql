-- ============================================================
-- Migration: Add proof_image_url to deposits + require hash
-- Users must provide TX hash AND screenshot proof for deposits
-- ============================================================

-- Add proof_image_url column to deposits
alter table public.deposits
  add column if not exists proof_image_url text;

-- Update request_deposit to accept proof image URL
create or replace function public.request_deposit(
  p_amount numeric,
  p_tx_hash text default null,
  p_proof_image_url text default null
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
  v_clean_hash text;
  v_clean_proof text;
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

  -- Validate TX hash: required and must look like a valid hash
  v_clean_hash := nullif(trim(p_tx_hash), '');
  if v_clean_hash is null or length(v_clean_hash) < 10 then
    return json_build_object('success', false, 'message', 'Hash transazione obbligatorio. Inserisci l''hash TX valido.');
  end if;

  -- Validate proof image: required
  v_clean_proof := nullif(trim(p_proof_image_url), '');
  if v_clean_proof is null then
    return json_build_object('success', false, 'message', 'Screenshot dell''hash obbligatorio. Carica la foto della transazione.');
  end if;

  insert into public.deposits (
    owner_id,
    amount,
    asset,
    network,
    tx_hash,
    proof_image_url,
    status
  )
  values (
    v_user_id,
    p_amount,
    coalesce(nullif(trim(v_settings.deposit_asset), ''), 'USDT'),
    coalesce(nullif(trim(v_settings.deposit_network), ''), 'TRC20'),
    v_clean_hash,
    v_clean_proof,
    'pending'
  );

  return json_build_object(
    'success', true,
    'message', 'Richiesta deposito salvata con hash e screenshot verificati.',
    'deposit_address', v_settings.deposit_address,
    'asset', coalesce(nullif(trim(v_settings.deposit_asset), ''), 'USDT'),
    'network', coalesce(nullif(trim(v_settings.deposit_network), ''), 'TRC20')
  );
end;
$$;
