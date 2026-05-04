-- Security hardening migration
-- Fixes IDOR in apply_referral_link, removes public is_admin, tightens grants

-- 1. Fix IDOR: apply_referral_link should only allow targeting self (non-admin)
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
  v_actor uuid := auth.uid();
  v_target_id uuid := coalesce(p_target_user_id, auth.uid());
  v_code text := upper(trim(coalesce(p_referral_code, '')));
  v_target public.profiles;
  v_referrer public.profiles;
  v_exists boolean := false;
begin
  if v_actor is null then
    return json_build_object('success', false, 'message', 'Utente non autenticato');
  end if;

  -- IDOR fix: non-admin users can only target themselves
  if v_target_id <> v_actor and not private.is_admin(v_actor) then
    return json_build_object('success', false, 'message', 'Non autorizzato');
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

-- 2. Drop public.is_admin (only private.is_admin should exist)
drop function if exists public.is_admin(uuid);

-- 3. Revoke anon access to validate_referral_code (require authentication)
revoke execute on function public.validate_referral_code(text) from anon;
grant execute on function public.validate_referral_code(text) to authenticated;

-- 4. Ensure no direct anon write access to any table
revoke insert, update, delete on all tables in schema public from anon;

-- 5. Tighten deposit/withdrawal RLS: only admin can write directly
--    (users create deposits/withdrawals via SECURITY DEFINER RPCs)
drop policy if exists "deposits_write_own_or_admin" on public.deposits;
create policy "deposits_write_admin_only"
on public.deposits for all
to authenticated
using (private.is_admin(auth.uid()))
with check (private.is_admin(auth.uid()));

drop policy if exists "withdrawals_write_own_or_admin" on public.withdrawals;
create policy "withdrawals_write_admin_only"
on public.withdrawals for all
to authenticated
using (private.is_admin(auth.uid()))
with check (private.is_admin(auth.uid()));
