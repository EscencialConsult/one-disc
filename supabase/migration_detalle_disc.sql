-- ═══════════════════════════════════════════════════════════════
-- Migración: detalle de respuestas DISC (letra real por pregunta)
-- Fase 1 del PLAN_ARREGLO_DISC.md
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query → pegar → Run
-- ═══════════════════════════════════════════════════════════════

-- Nullable a propósito: los tests ya guardados quedan en NULL y siguen
-- calculándose con el algoritmo anterior. Los tests nuevos guardan acá
-- la letra real (D/I/S/C) elegida como MÁS y como MENOS en cada pregunta:
--   { "1": { "mas": "D", "menos": "S" }, ..., "28": { ... } }
-- El string `respuestas` no cambia: se sigue guardando igual que siempre.
alter table respuestas add column if not exists detalle jsonb;
