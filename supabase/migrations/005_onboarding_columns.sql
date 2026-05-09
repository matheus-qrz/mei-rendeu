-- Migration: 005_onboarding_columns.sql

alter table public.users
  add column if not exists onboarding_step text not null default 'welcome',
  add column if not exists business_area   text;

-- Índice para buscar usuários ainda no onboarding (útil para suporte)
create index if not exists idx_users_onboarding
  on public.users (onboarding_step)
  where onboarding_step != 'done';