-- ═══════════════════════════════════════════════════════════════
-- Fix: políticas RLS de Storage para el bucket "logos"
-- Causa del error "new row violates row-level security policy" al
-- subir el logo de una empresa: falta (o se perdió) la política de
-- insert/update para el rol anon en storage.objects.
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query → pegar → Run
-- Es seguro volver a correrlo (drop + create idempotente).
-- ═══════════════════════════════════════════════════════════════

insert into storage.buckets (id, name, public)
values ('logos', 'logos', true)
on conflict (id) do nothing;

drop policy if exists "anon upload logos" on storage.objects;
drop policy if exists "anon update logos" on storage.objects;
drop policy if exists "anon read logos" on storage.objects;

create policy "anon upload logos" on storage.objects for insert to anon
  with check (bucket_id = 'logos');
create policy "anon update logos" on storage.objects for update to anon
  using (bucket_id = 'logos') with check (bucket_id = 'logos');
create policy "anon read logos" on storage.objects for select to anon
  using (bucket_id = 'logos');
