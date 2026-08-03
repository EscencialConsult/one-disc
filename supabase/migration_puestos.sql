-- ═══════════════════════════════════════════════════════════════
-- Migración: tabla puestos (Panel RRHH — Job Matching / Ranking)
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query → pegar → Run
-- ═══════════════════════════════════════════════════════════════

create table if not exists puestos (
  id         uuid primary key default gen_random_uuid(),
  admin_id   uuid not null references admins(id) on delete cascade,
  nombre     text not null,
  peso_d     smallint not null default 50,
  peso_i     smallint not null default 50,
  peso_s     smallint not null default 50,
  peso_c     smallint not null default 50,
  fecha_alta timestamptz not null default now()
);

create index if not exists idx_puestos_admin on puestos(admin_id);

alter table puestos enable row level security;

create policy "anon full access puestos" on puestos for all to anon using (true) with check (true);
