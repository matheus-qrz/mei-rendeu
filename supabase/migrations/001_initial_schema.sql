-- ============================================================
-- MEI Rendeu — Schema Principal (corrigido)
-- ============================================================

-- ─── Extensions ──────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── Enum Types ──────────────────────────────────────────
create type plan_type as enum ('trial', 'basic', 'pro');
create type transaction_type as enum ('income', 'expense');
create type alert_type as enum ('das_reminder', 'mei_limit', 'monthly_summary', 'low_balance');
create type message_direction as enum ('inbound', 'outbound');
create type transaction_source as enum ('whatsapp', 'dashboard');

-- ─── Users ───────────────────────────────────────────────
create table public.users (
  id                      uuid primary key default uuid_generate_v4(),
  phone                   text unique not null,
  name                    text not null,
  cnpj                    text,
  plan                    plan_type not null default 'trial',
  trial_ends_at           timestamptz default (now() + interval '7 days'),
  stripe_customer_id      text unique,
  stripe_subscription_id  text unique,
  monthly_revenue_ytd     integer not null default 0,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

-- ─── Transactions ─────────────────────────────────────────
create table public.transactions (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references public.users(id) on delete cascade,
  type          transaction_type not null,
  amount        integer not null check (amount > 0),
  category      text not null default 'Outros',
  description   text not null,
  source        transaction_source not null default 'whatsapp',
  raw_message   text,
  created_at    timestamptz not null default now()
);

-- ─── Monthly Summaries ────────────────────────────────────
create table public.monthly_summaries (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references public.users(id) on delete cascade,
  year            integer not null,
  month           integer not null check (month between 1 and 12),
  total_income    integer not null default 0,
  total_expense   integer not null default 0,
  das_estimate    integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique(user_id, year, month)
);

-- ─── Alerts ───────────────────────────────────────────────
create table public.alerts (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references public.users(id) on delete cascade,
  type          alert_type not null,
  scheduled_at  timestamptz not null,
  sent_at       timestamptz,
  payload       jsonb not null default '{}',
  created_at    timestamptz not null default now()
);

-- ─── Message Logs ─────────────────────────────────────────
create table public.message_logs (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references public.users(id) on delete set null,
  direction   message_direction not null,
  content     text not null,
  tokens_used integer,
  model       text,
  created_at  timestamptz not null default now()
);

-- ─── Indexes ──────────────────────────────────────────────
create index idx_transactions_user_id      on public.transactions(user_id);
create index idx_transactions_created_at   on public.transactions(created_at desc);
create index idx_transactions_user_month   on public.transactions(user_id, created_at);
create index idx_monthly_summaries_user_id on public.monthly_summaries(user_id);
create index idx_alerts_scheduled          on public.alerts(scheduled_at) where sent_at is null;
create index idx_message_logs_user_id      on public.message_logs(user_id);

-- ─── Updated_at Trigger ───────────────────────────────────
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger on_users_updated
  before update on public.users
  for each row execute procedure public.handle_updated_at();

create trigger on_monthly_summaries_updated
  before update on public.monthly_summaries
  for each row execute procedure public.handle_updated_at();

-- ─── Função: Recalcular Monthly Summary ───────────────────
create or replace function public.refresh_monthly_summary(
  p_user_id uuid,
  p_year    integer,
  p_month   integer
) returns void language plpgsql as $$
declare
  v_income  integer;
  v_expense integer;
  v_das     integer;
begin
  select
    coalesce(sum(amount) filter (where type = 'income'), 0),
    coalesce(sum(amount) filter (where type = 'expense'), 0)
  into v_income, v_expense
  from public.transactions
  where user_id = p_user_id
    and extract(year from created_at) = p_year
    and extract(month from created_at) = p_month;

  v_das := (v_income * 0.06)::integer;

  insert into public.monthly_summaries
    (user_id, year, month, total_income, total_expense, das_estimate)
  values
    (p_user_id, p_year, p_month, v_income, v_expense, v_das)
  on conflict (user_id, year, month) do update set
    total_income  = excluded.total_income,
    total_expense = excluded.total_expense,
    das_estimate  = excluded.das_estimate,
    updated_at    = now();
end;
$$;

-- ─── Trigger: Auto-refresh summary após transação ─────────
create or replace function public.on_transaction_change()
returns trigger language plpgsql as $$
begin
  perform public.refresh_monthly_summary(
    coalesce(new.user_id, old.user_id),
    extract(year from coalesce(new.created_at, old.created_at))::integer,
    extract(month from coalesce(new.created_at, old.created_at))::integer
  );
  return coalesce(new, old);
end;
$$;

create trigger after_transaction_change
  after insert or update or delete on public.transactions
  for each row execute procedure public.on_transaction_change();

-- ─── Row Level Security (RLS) ─────────────────────────────
alter table public.users              enable row level security;
alter table public.transactions       enable row level security;
alter table public.monthly_summaries  enable row level security;
alter table public.alerts             enable row level security;
alter table public.message_logs       enable row level security;