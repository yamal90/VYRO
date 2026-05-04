-- Support tickets system
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

-- RLS policies
alter table public.support_tickets enable row level security;

create policy "Users can view their own tickets"
  on public.support_tickets for select
  using (auth.uid() = user_id);

create policy "Users can insert their own tickets"
  on public.support_tickets for insert
  with check (auth.uid() = user_id);

create policy "Admins can view all tickets"
  on public.support_tickets for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

create policy "Admins can update all tickets"
  on public.support_tickets for update
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );
