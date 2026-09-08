/**
 * Casos de prueba obligatorios del documento original de auditoría
 * (Correccion_Algoritmo_DISC_Compatibilidad_Cultural.md §21) — punto 12 del
 * seguimiento y §10 ("Fixtures dorados") de PROPUESTA_CONSISTENCIA_DISC.md.
 *
 *   node scripts/disc-fixtures.mjs
 *
 * Los 4 casos A-D del documento están reconstruidos para la escala actual
 * en scripts/fixtures/perfiles_referencia.json — los números originales
 * (D=43,I=32,S=7,C=18, etc.) son de la escala vieja (suma 100) y no son
 * reproducibles tal cual en la escala ipsativa actual (suma ~200), así que
 * se recrearon apuntando a la misma FORMA del perfil (quién es principal,
 * qué tan claro, ritmo, foco), no a los mismos números.
 *
 * Se agregan 5 casos que el documento no cubre pero que sí pide la
 * propuesta interna: perfil plano, empate exacto, las dos divergencias
 * Natural→Adaptado que motivaron el arreglo de raíz (§2 de la propuesta),
 * y un test sin `detalle` para el camino legacy (§7).
 *
 * Complementa a disc-invariantes.mjs (propiedades que valen SIEMPRE) y a
 * disc-regresion.mjs (que los tests viejos reales no se muevan): este
 * script verifica casos CONCRETOS con un resultado esperado conocido.
 */
import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const ctx = { window: {}, Math, Object, Array, JSON, String, Number, console };
ctx.window = ctx;
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'public/informe/discCore.js'), 'utf-8'), ctx, { filename: 'discCore.js' });
const Core = ctx.DISCCore;

const fixtures = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'perfiles_referencia.json'), 'utf-8'));

let fallas = 0;
const check = (ok, msg) => { if (!ok) { fallas++; console.log(`  MAL ${msg}`); } };

for (const [nombre, f] of Object.entries(fixtures)) {
  const e = f.esperado;
  console.log(`${nombre} — ${f.doc}`);

  if (f.detalle === null) {
    check(Core.tieneDetalle(f.detalle) === e.tieneDetalle, `tieneDetalle debía ser ${e.tieneDetalle}`);
    check((Core.calcular(f.detalle) === null) === e.calcularEsNull, `calcular() debía dar null`);
    continue;
  }

  const r = Core.calcular(f.detalle);
  check(!!r, 'calcular() no debería dar null (el detalle es válido)');
  if (!r) continue;

  if (e.principal) check(r.natural.principal === e.principal, `principal esperado ${e.principal}, dio ${r.natural.principal}`);
  if (e.secundaria) check(r.natural.secundaria === e.secundaria, `secundaria esperada ${e.secundaria}, dio ${r.natural.secundaria}`);
  if (e.principalEn) check(e.principalEn.includes(r.natural.principal), `principal debía ser una de ${e.principalEn}, dio ${r.natural.principal}`);
  if (e.nivel_definicion) check(r.natural.nivel_definicion === e.nivel_definicion, `nivel_definicion esperado ${e.nivel_definicion}, dio ${r.natural.nivel_definicion}`);
  if (e.gapMax !== undefined) check(r.natural.gap <= e.gapMax, `gap debía ser <= ${e.gapMax}, dio ${r.natural.gap}`);
  if (e.ritmoActivoMin !== undefined) check(r.natural.ritmo.activo >= e.ritmoActivoMin, `ritmo.activo debía ser >= ${e.ritmoActivoMin}, dio ${r.natural.ritmo.activo}`);
  if (e.ritmoActivoMax !== undefined) check(r.natural.ritmo.activo <= e.ritmoActivoMax, `ritmo.activo debía ser <= ${e.ritmoActivoMax}, dio ${r.natural.ritmo.activo}`);
  if (e.focoTareasMin !== undefined) check(r.natural.foco.tareas >= e.focoTareasMin, `foco.tareas debía ser >= ${e.focoTareasMin}, dio ${r.natural.foco.tareas}`);
  if (e.focoTareasMax !== undefined) check(r.natural.foco.tareas <= e.focoTareasMax, `foco.tareas debía ser <= ${e.focoTareasMax}, dio ${r.natural.foco.tareas}`);
  if (e.principalNatural) check(r.natural.principal === e.principalNatural, `principal Natural esperado ${e.principalNatural}, dio ${r.natural.principal}`);
  if (e.principalAdaptado) check(r.adaptado.principal === e.principalAdaptado, `principal Adaptado esperado ${e.principalAdaptado}, dio ${r.adaptado.principal}`);

  // Invariantes que valen para cualquier fixture, no solo los sintéticos de disc-invariantes.mjs.
  check(r.natural.ritmo.activo + r.natural.ritmo.pausado === 100, 'ritmo.activo + ritmo.pausado debe dar 100');
  check(r.natural.foco.tareas + r.natural.foco.personas === 100, 'foco.tareas + foco.personas debe dar 100');
}

if (fallas === 0) {
  console.log(`\nFIXTURES OK — ${Object.keys(fixtures).length} casos de referencia (incluye los 4 del documento original) dan el resultado esperado.`);
} else {
  console.log(`\nFIXTURES ROTOS — ${fallas} falla(s).`);
  process.exit(1);
}
