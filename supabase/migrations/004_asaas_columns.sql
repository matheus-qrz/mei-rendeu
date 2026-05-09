-- Migration: 004_asaas_columns.sql
-- Substitui as colunas Stripe pelas do Asaas na tabela users
-- (mantenha as colunas Stripe se ainda usar o Tableflow no mesmo banco)

alter table public.users
  add column if not exists asaas_customer_id     text unique,
  add column if not exists asaas_subscription_id text unique;

-- Remove colunas Stripe se não for mais usar
-- (comente estas linhas se o Tableflow ainda usa o mesmo schema)
-- alter table public.users drop column if exists stripe_customer_id;
-- alter table public.users drop column if exists stripe_subscription_id;

-- Índice para lookup pelo customer_id do Asaas no webhook
create index if not exists idx_users_asaas_customer
  on public.users (asaas_customer_id)
  where asaas_customer_id is not null;