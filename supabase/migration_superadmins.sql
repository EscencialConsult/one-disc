-- ═══════════════════════════════════════════════════════════════
-- Migración: tabla superadmins (múltiples cuentas de SuperAdmin)
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query → pegar → Run
-- ═══════════════════════════════════════════════════════════════

create table if not exists superadmins (
  id         uuid primary key default gen_random_uuid(),
  usuario    text not null unique,
  password   text not null,
  email      text not null default '',
  fecha_alta timestamptz not null default now(),
  estado     text not null default 'activo'
);

alter table superadmins enable row level security;

create policy "anon full access superadmins" on superadmins for all to anon using (true) with check (true);

-- Migra la cuenta fija que ya usabas (superadmin/admin123), para que el
-- login no se corte al pasar de hardcodeado a tabla.
insert into superadmins (usuario, password, email)
values ('superadmin', 'admin123', 'superadmin@local')
on conflict (usuario) do nothing;
