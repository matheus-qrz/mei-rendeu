-- Migration: 003_db_size_function.sql
-- Função para o cron de health check consultar o tamanho do banco

create or replace function public.get_db_size()
returns json language plpgsql security definer as $$
declare
  v_size_bytes bigint;
  v_size_mb    numeric;
  v_table_count integer;
begin
  -- Tamanho total do banco atual
  select pg_database_size(current_database())
  into v_size_bytes;

  v_size_mb := round((v_size_bytes::numeric / 1024 / 1024), 2);

  -- Número de tabelas públicas
  select count(*)
  into v_table_count
  from information_schema.tables
  where table_schema = 'public'
    and table_type = 'BASE TABLE';

  return json_build_object(
    'sizeMB',     v_size_mb,
    'sizeBytes',  v_size_bytes,
    'tableCount', v_table_count
  );
end;
$$;

-- Garante que só o service_role pode chamar
revoke all on function public.get_db_size() from public;
grant execute on function public.get_db_size() to service_role;