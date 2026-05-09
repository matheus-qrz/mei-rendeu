-- Migration: 002_waitlist.sql
-- Tabela de lista de espera da landing page

create table if not exists public.waitlist (
  id          uuid primary key default gen_random_uuid(),
  email       text unique not null,
  created_at  timestamptz not null default now(),
  source      text default 'landing'  -- para saber de onde veio no futuro
);

-- Ninguém de fora pode ler ou escrever diretamente
alter table public.waitlist enable row level security;

-- Apenas o service_role (backend) pode inserir
create policy "service_role pode inserir"
  on public.waitlist
  for insert
  to service_role
  with check (true);

-- Índice para não duplicar e acelerar buscas por email
create index if not exists waitlist_email_idx on public.waitlist (email);