-- ═══════════════════════════════════════════════════════════════
-- Migración: bucket de logos de empresa en Supabase Storage
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query → pegar → Run
-- (Ya corriste schema.sql antes: este script solo agrega lo nuevo,
-- no vuelve a crear las tablas.)
-- ═══════════════════════════════════════════════════════════════

insert into storage.buckets (id, name, public)
values ('logos', 'logos', true)
on conflict (id) do nothing;

create policy "anon upload logos" on storage.objects for insert to anon
  with check (bucket_id = 'logos');
create policy "anon update logos" on storage.objects for update to anon
  using (bucket_id = 'logos') with check (bucket_id = 'logos');
create policy "anon read logos" on storage.objects for select to anon
  using (bucket_id = 'logos');
