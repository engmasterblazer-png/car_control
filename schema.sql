-- =====================================================================
-- FLEET APP — SCHEMA SUPABASE (PostgreSQL)
-- Execute este script inteiro no SQL Editor do seu projeto Supabase.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. Extensões
-- ---------------------------------------------------------------------
create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------------
-- 1. Tipo enumerado para tipos de registro/despesa
-- ---------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'record_type') then
    create type record_type as enum (
      'troca_oleo',
      'pneus',
      'manutencao_geral',
      'combustivel'
    );
  end if;
end
$$;

-- ---------------------------------------------------------------------
-- 2. Tabela: vehicles (veículos)
-- ---------------------------------------------------------------------
create table if not exists public.vehicles (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  model       text not null,
  plate       text not null,
  year        int,
  km_atual    numeric not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.vehicles is 'Veículos cadastrados pelo usuário';

-- ---------------------------------------------------------------------
-- 3. Tabela: records (despesas / manutenções / abastecimentos)
-- ---------------------------------------------------------------------
create table if not exists public.records (
  id          uuid primary key default uuid_generate_v4(),
  vehicle_id  uuid not null references public.vehicles(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  type        record_type not null,
  value       numeric not null default 0,
  km          numeric not null,
  date        date not null default current_date,
  notes       text,
  created_at  timestamptz not null default now()
);

comment on table public.records is 'Registros de despesas, manutenções e abastecimentos por veículo';

-- ---------------------------------------------------------------------
-- 4. Índices
-- ---------------------------------------------------------------------
create index if not exists idx_vehicles_user_id   on public.vehicles(user_id);
create index if not exists idx_records_vehicle_id on public.records(vehicle_id);
create index if not exists idx_records_user_id    on public.records(user_id);
create index if not exists idx_records_type       on public.records(type);
create index if not exists idx_records_date       on public.records(date desc);

-- ---------------------------------------------------------------------
-- 5. Row Level Security (RLS)
-- ---------------------------------------------------------------------
alter table public.vehicles enable row level security;
alter table public.records  enable row level security;

-- Políticas: vehicles
drop policy if exists "vehicles_select_own" on public.vehicles;
create policy "vehicles_select_own"
  on public.vehicles for select
  using (auth.uid() = user_id);

drop policy if exists "vehicles_insert_own" on public.vehicles;
create policy "vehicles_insert_own"
  on public.vehicles for insert
  with check (auth.uid() = user_id);

drop policy if exists "vehicles_update_own" on public.vehicles;
create policy "vehicles_update_own"
  on public.vehicles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "vehicles_delete_own" on public.vehicles;
create policy "vehicles_delete_own"
  on public.vehicles for delete
  using (auth.uid() = user_id);

-- Políticas: records
drop policy if exists "records_select_own" on public.records;
create policy "records_select_own"
  on public.records for select
  using (auth.uid() = user_id);

drop policy if exists "records_insert_own" on public.records;
create policy "records_insert_own"
  on public.records for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.vehicles v
      where v.id = vehicle_id and v.user_id = auth.uid()
    )
  );

drop policy if exists "records_update_own" on public.records;
create policy "records_update_own"
  on public.records for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "records_delete_own" on public.records;
create policy "records_delete_own"
  on public.records for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- 6. Função + Trigger: atualizar km_atual do veículo automaticamente
--    sempre que um novo registro tiver KM maior que o atual.
-- ---------------------------------------------------------------------
create or replace function public.update_vehicle_km()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.vehicles
  set km_atual   = new.km,
      updated_at = now()
  where id = new.vehicle_id
    and new.km > km_atual;

  return new;
end;
$$;

drop trigger if exists trg_update_vehicle_km on public.records;
create trigger trg_update_vehicle_km
  after insert on public.records
  for each row
  execute function public.update_vehicle_km();

-- ---------------------------------------------------------------------
-- 7. Função + Trigger: manter updated_at de vehicles em dia
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_vehicles_updated_at on public.vehicles;
create trigger trg_vehicles_updated_at
  before update on public.vehicles
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 8. View: vehicle_alerts
--    Calcula o status de troca de óleo/revisão de cada veículo.
--    Regra: VENCIDO se km_atual - último_km_troca_oleo >= 10.000
--                     OU dias desde a última troca >= 365
--           PRÓXIMO se >= 80% desses limites (8.000 km / 305 dias)
--           EM_DIA caso contrário
--           SEM_REGISTRO se nunca houve troca de óleo registrada
--    security_invoker = on garante que a view respeita a RLS das
--    tabelas base (o usuário só vê os alertas dos seus próprios veículos).
-- ---------------------------------------------------------------------
create or replace view public.vehicle_alerts
with (security_invoker = on) as
select
  v.id                                                   as vehicle_id,
  v.user_id,
  v.model,
  v.plate,
  v.year,
  v.km_atual,
  last_oil.km                                             as last_oil_km,
  last_oil.date                                           as last_oil_date,
  (v.km_atual - coalesce(last_oil.km, 0))                 as km_since_last_oil,
  (current_date - coalesce(last_oil.date, v.created_at::date)) as days_since_last_oil,
  case
    when last_oil.km is null then 'sem_registro'
    when (v.km_atual - last_oil.km) >= 10000
      or (current_date - last_oil.date) >= 365 then 'vencido'
    when (v.km_atual - last_oil.km) >= 8000
      or (current_date - last_oil.date) >= 305 then 'proximo'
    else 'em_dia'
  end                                                      as oil_status
from public.vehicles v
left join lateral (
  select r.km, r.date
  from public.records r
  where r.vehicle_id = v.id
    and r.type = 'troca_oleo'
  order by r.date desc, r.created_at desc
  limit 1
) last_oil on true;

comment on view public.vehicle_alerts is 'Status calculado de troca de óleo/revisão por veículo, respeitando RLS';

-- =====================================================================
-- FIM DO SCRIPT
-- =====================================================================
