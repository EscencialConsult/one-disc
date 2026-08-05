-- ═══════════════════════════════════════════════════════════════
-- Migración: límite de créditos por Admin (1 crédito = 1 usuario)
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query → pegar → Run
-- ═══════════════════════════════════════════════════════════════

-- Nullable a propósito: NULL = sin límite (ilimitado). Así todos los admins
-- que ya existen hoy siguen funcionando exactamente igual que antes —
-- el límite solo aplica a los admins nuevos que se creen con un valor,
-- o a los que el SuperAdmin decida editar más adelante.
alter table admins add column if not exists limite_usuarios integer;
