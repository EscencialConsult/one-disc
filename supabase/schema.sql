-- ═══════════════════════════════════════════════════════════════
-- ONE DISC — Esquema Supabase
-- Réplica de la base en Google Sheets (hojas Admins / Usuarios / Respuestas)
-- unificada en una sola base multi-tenant separada por admin.
--
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query → pegar → Run
-- ═══════════════════════════════════════════════════════════════

-- ── TABLA: admins (réplica de la hoja "Admins") ─────────────────
create table if not exists admins (
  id                uuid primary key default gen_random_uuid(),
  email_superadmin  text not null default 'superadmin@local',
  usuario_admin     text not null unique,
  pass_admin        text not null,
  email_admin       text not null,
  fecha_alta        timestamptz not null default now(),
  estado            text not null default 'activo',      -- activo | inactivo
  pack_status       text not null default '',
  name_empresa      text not null default '',
  logo_empresa_link text not null default ''
  -- Las columnas API_usuarios / API_respuestas / API_visualizacionderespuestas
  -- de la planilla original ya no existen: la base única las reemplaza.
);

-- ── TABLA: usuarios (réplica de la hoja "Usuarios" de cada admin) ──
create table if not exists usuarios (
  id           uuid primary key default gen_random_uuid(),
  admin_id     uuid not null references admins(id) on delete cascade,
  usuario_user text not null,
  pass_user    text not null,
  email_user   text not null default '',
  nombre       text not null default '',
  fecha_alta   timestamptz not null default now(),
  estado       text not null default 'activo',           -- activo | inactivo
  pack_status  text not null default '',
  unique (admin_id, usuario_user)
);

-- ── TABLA: respuestas (réplica de la hoja "Respuestas") ─────────
create table if not exists respuestas (
  id               uuid primary key default gen_random_uuid(),
  admin_id         uuid references admins(id) on delete set null,
  disc_id          bigint generated always as identity,  -- correlativo (reemplaza al disc_id del .gs)
  fecha            timestamptz not null default now(),
  usuario_admin    text not null default '',
  email_admin      text not null default '',
  usuario_user     text not null default '',
  nombre           text not null default '',
  apellido         text not null default '',
  email_user       text not null default '',
  respuestas       text not null,                        -- string "{PI: mm:ss - 1;3, 2;1, ...} {PII: ...}"
  puntajes         jsonb,                                -- {"D":32,"I":28,"S":24,"C":20} (si el .gs lo guarda)
  perfil_dominante text default '',
  pdf_path         text default ''                       -- ruta del PDF en Storage (reemplaza a Drive)
);

create index if not exists idx_usuarios_admin    on usuarios(admin_id);
create index if not exists idx_respuestas_admin  on respuestas(admin_id);
create index if not exists idx_respuestas_email  on respuestas(email_user);

-- ── STORAGE: bucket para los informes PDF (reemplaza a Google Drive) ──
insert into storage.buckets (id, name, public)
values ('informes', 'informes', true)
on conflict (id) do nothing;

-- ── STORAGE: bucket para los logos de empresa (reemplaza el link externo) ──
insert into storage.buckets (id, name, public)
values ('logos', 'logos', true)
on conflict (id) do nothing;

-- ── RLS ─────────────────────────────────────────────────────────
-- El sistema replica el modelo de la versión AppScript: la API era pública
-- ("Cualquier persona") y la autorización vivía en la lógica de la app.
-- Se habilita RLS con políticas abiertas para anon (mismo nivel de confianza
-- que la webapp GAS original). Endurecer en una fase 2 si se necesita.
alter table admins     enable row level security;
alter table usuarios   enable row level security;
alter table respuestas enable row level security;

create policy "anon full access admins"     on admins     for all to anon using (true) with check (true);
create policy "anon full access usuarios"   on usuarios   for all to anon using (true) with check (true);
create policy "anon full access respuestas" on respuestas for all to anon using (true) with check (true);

create policy "anon upload informes" on storage.objects for insert to anon
  with check (bucket_id = 'informes');
create policy "anon read informes" on storage.objects for select to anon
  using (bucket_id = 'informes');

create policy "anon upload logos" on storage.objects for insert to anon
  with check (bucket_id = 'logos');
create policy "anon update logos" on storage.objects for update to anon
  using (bucket_id = 'logos') with check (bucket_id = 'logos');
create policy "anon read logos" on storage.objects for select to anon
  using (bucket_id = 'logos');
