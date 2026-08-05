-- ═══════════════════════════════════════════════════════════════
-- Fix DEFINITIVO: políticas RLS de Storage para "informes" y "logos"
--
-- Causa del error "new row violates row-level security policy" al subir
-- un logo (SuperAdmin) o un PDF de informe (Test/Informe): las políticas
-- de insert/update en storage.objects para el rol anon no existen hoy en
-- la base real, aunque sí están declaradas en schema.sql — quedaron
-- desincronizadas en algún momento (o nunca se re-aplicaron ahí).
--
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query → pegar → Run
-- Es 100% seguro volver a correrlo las veces que haga falta
-- (drop + create idempotente, no borra ni toca ningún archivo ya subido).
-- ═══════════════════════════════════════════════════════════════

-- Los buckets ya existen, pero por las dudas (no rompe nada si ya están):
insert into storage.buckets (id, name, public) values ('informes', 'informes', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('logos', 'logos', true) on conflict (id) do nothing;

-- ── informes ──
drop policy if exists "anon upload informes" on storage.objects;
drop policy if exists "anon read informes" on storage.objects;

create policy "anon upload informes" on storage.objects for insert to anon
  with check (bucket_id = 'informes');
create policy "anon read informes" on storage.objects for select to anon
  using (bucket_id = 'informes');

-- ── logos ──
drop policy if exists "anon upload logos" on storage.objects;
drop policy if exists "anon update logos" on storage.objects;
drop policy if exists "anon read logos" on storage.objects;

create policy "anon upload logos" on storage.objects for insert to anon
  with check (bucket_id = 'logos');
create policy "anon update logos" on storage.objects for update to anon
  using (bucket_id = 'logos') with check (bucket_id = 'logos');
create policy "anon read logos" on storage.objects for select to anon
  using (bucket_id = 'logos');
