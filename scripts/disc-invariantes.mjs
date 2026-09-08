/**
 * Invariantes del cálculo e interpretación DISC.
 *
 *   node scripts/disc-invariantes.mjs
 *
 * Corre sobre perfiles sintéticos (aleatorios y de referencia) y verifica las
 * propiedades que tienen que valer SIEMPRE. Complementa a:
 *
 *   disc-regresion.mjs → que los tests viejos no se muevan
 *   disc-auditar.mjs   → que un test real concreto sea coherente
 *
 * El invariante 4 es el que faltaba: `disc-auditar.mjs` comprobaba que cada
 * gráfica fuera coherente consigo misma, cosa que es cierta por construcción,
 * y por eso no detectaba que el Panel RRHH (perfil Natural) y el gráfico de
 * barras del informe (antes, promedio de las 28 preguntas) mostraran letras
 * distintas en la misma persona.
 */
import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ctx = { window: {}, Math, Object, Array, JSON, String, Number, console };
ctx.window = ctx;
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'public/informe/discCore.js'), 'utf-8'), ctx, { filename: 'discCore.js' });
vm.runInContext(fs.readFileSync(path.join(ROOT, 'public/informe/discTextos.js'), 'utf-8'), ctx, { filename: 'discTextos.js' });
const Core = ctx.DISCCore;
const Textos = ctx.DISCTextos;
const L = ['D', 'I', 'S', 'C'];

let fallas = 0;
const check = (ok, msg) => { if (!ok) { fallas++; console.log(`  MAL ${msg}`); } };

// ── Generadores de perfiles ────────────────────────────────────────────────
function detalleDe(mas, menos) {
  const d = {};
  for (let q = 1; q <= 28; q++) d[q] = { mas: mas[q - 1], menos: menos[q - 1] };
  return d;
}
function elegir(pesos) {
  const total = pesos.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < 4; i++) { r -= pesos[i]; if (r < 0) return L[i]; }
  return L[3];
}
/** Persona con preferencia `pref` en la Parte I y `prefAd` en la Parte II. */
function persona(pref, prefAd, fuerza = 4) {
  const mas = [], menos = [];
  for (let q = 0; q < 28; q++) {
    const p = q < 14 ? pref : prefAd;
    const a = elegir(L.map((l) => (l === p ? fuerza : 1)));
    let b;
    do { b = elegir(L.map((l) => (l === p ? 0.2 : 1))); } while (b === a);
    mas.push(a); menos.push(b);
  }
  return detalleDe(mas, menos);
}
function alAzar() {
  const mas = [], menos = [];
  for (let q = 0; q < 28; q++) {
    const a = L[Math.floor(Math.random() * 4)];
    let b; do { b = L[Math.floor(Math.random() * 4)]; } while (b === a);
    mas.push(a); menos.push(b);
  }
  return detalleDe(mas, menos);
}

// ── Invariantes sobre una gráfica (Natural o Adaptado) ─────────────────────
function verificarGrafica(g, nombre) {
  check(g.ritmo.activo + g.ritmo.pausado === 100, `${nombre}: ritmo activo + pausado = 100 (dio ${g.ritmo.activo + g.ritmo.pausado})`);
  check(g.foco.tareas + g.foco.personas === 100, `${nombre}: foco tareas + personas = 100 (dio ${g.foco.tareas + g.foco.personas})`);
  const max = Math.max(...L.map((x) => g.valores[x]));
  check(g.valores[g.dominante] === max, `${nombre}: la letra dominante (${g.dominante}) es la más alta`);
  check(L.every((x) => g.valores[x] >= 0 && g.valores[x] <= 100), `${nombre}: todas las letras dentro de 0-100`);
  check(g.polares.cell === Core.celda(g.polares.radius, g.polares.angle), `${nombre}: la celda dibujada corresponde al ángulo/radio`);

  // La rueda ES la composición de los dos ejes, no otra cosa. Desarrollando la
  // media circular con D=45°, I=135°, S=225°, C=315°:
  //   x ∝ (D+C) − (I+S) = eje de FOCO   (tareas − personas)
  //   y ∝ (D+I) − (S+C) = eje de RITMO  (activo − pausado)
  // Por lo tanto el cuadrante donde cae el marcador tiene que coincidir siempre
  // con la lectura de ritmo y foco. Si no coincidiera, la rueda y el texto del
  // informe estarían describiendo dos personas distintas.
  const ritmoNeto = g.neto.D + g.neto.I;
  const focoNeto = g.neto.D + g.neto.C;
  if (ritmoNeto !== 0 && focoNeto !== 0) {
    const esperado = ritmoNeto > 0 ? (focoNeto > 0 ? 'D' : 'I') : (focoNeto > 0 ? 'C' : 'S');
    const sector = Core.letraPorAngulo(g.polares.angle);
    check(sector === esperado, `${nombre}: la rueda cae en el sector ${sector} pero ritmo/foco dicen ${esperado} (activo ${g.ritmo.activo}%, tareas ${g.foco.tareas}%)`);
    check((g.ritmo.activo > 50) === (ritmoNeto > 0), `${nombre}: el % de ritmo no coincide con el signo del neto del eje`);
    check((g.foco.tareas > 50) === (focoNeto > 0), `${nombre}: el % de foco no coincide con el signo del neto del eje`);
  }
}

console.log('\n1) INVARIANTES DEL CÁLCULO (5.000 perfiles aleatorios + 5.000 con preferencia)');
const muestras = [];
for (let i = 0; i < 5000; i++) muestras.push(alAzar());
for (const [a, b] of [['D', 'D'], ['D', 'S'], ['C', 'I'], ['I', 'C'], ['S', 'S']]) {
  for (let i = 0; i < 1000; i++) muestras.push(persona(a, b));
}
for (const det of muestras) {
  const c = Core.calcular(det);
  check(!!c, 'el detalle sintético debería calcular');
  if (!c) continue;
  check(L.reduce((a, x) => a + c.natural.conteo.mas[x], 0) === 14, 'Parte I: 14 elecciones MÁS');
  check(L.reduce((a, x) => a + c.natural.conteo.menos[x], 0) === 14, 'Parte I: 14 elecciones MENOS');
  check(L.reduce((a, x) => a + c.adaptado.conteo.mas[x], 0) === 14, 'Parte II: 14 elecciones MÁS');
  check(L.reduce((a, x) => a + c.natural.neto[x] + c.adaptado.neto[x], 0) === 0, 'Σ neto = 0 (el test es ipsativo)');
  verificarGrafica(c.natural, 'Natural');
  verificarGrafica(c.adaptado, 'Adaptado');
  const sumaDelta = L.reduce((a, x) => a + Math.abs(c.natural.neto[x] - c.adaptado.neto[x]), 0);
  check(sumaDelta === c.estabilidad.total, 'la estabilidad es la suma de |Natural − Adaptado|');
}
console.log(fallas === 0 ? '  OK  todos los invariantes de cálculo' : `  ${fallas} falla(s)`);

console.log('\n2) EL PANEL RRHH Y EL GRÁFICO DEL INFORME MUESTRAN LA MISMA LETRA');
// El informe (script.js / pdfGenerator.js) grafica `core.natural.valores`;
// el Panel RRHH (discScoring.js) usa `core.natural.dominante`. Por construcción
// tienen que coincidir en el 100% de los casos, incluida gente que adapta mucho.
let divergen = 0;
for (const det of muestras) {
  const c = Core.calcular(det);
  const barraMasAlta = L.slice().sort((a, b) => c.natural.valores[b] - c.natural.valores[a])[0];
  if (c.natural.valores[barraMasAlta] !== c.natural.valores[c.natural.dominante]) divergen++;
}
check(divergen === 0, `${divergen} perfiles con la barra más alta distinta de la letra del panel`);
console.log(divergen === 0 ? `  OK  0 divergencias en ${muestras.length} perfiles` : `  ${divergen} divergencias`);

console.log('\n3) LOS DOS EJES SON INDEPENDIENTES');
// Si ritmo determinara foco (el bug que se arregló), conocer uno predeciría el
// otro. Se comprueba que existan perfiles en los cuatro cuadrantes.
const cuadrantes = new Set();
for (const det of muestras) {
  const g = Core.calcular(det).natural;
  cuadrantes.add(`${g.ritmo.activo >= 50 ? 'activo' : 'pausado'}-${g.foco.tareas >= 50 ? 'tareas' : 'personas'}`);
}
check(cuadrantes.size === 4, `solo aparecieron ${cuadrantes.size} de los 4 cuadrantes ritmo×foco: ${[...cuadrantes].join(', ')}`);
console.log(cuadrantes.size === 4 ? `  OK  los 4 cuadrantes existen: ${[...cuadrantes].sort().join(', ')}` : '  FALLA');

console.log('\n4) LINT DE TEXTOS: NINGÚN BLOQUE HABLA DEL EJE DEL OTRO');
// Es el bug original: textos de ritmo que hablaban de personas/tareas.
const LEXICO_FOCO = ['social', 'sociable', 'personas', 'vínculo', 'vinculo', 'relaciones', 'empat', 'reconocimiento', 'tareas', 'calidad', 'precisión', 'precision', 'detalle', 'datos', 'normas', 'clima', 'equipo'];
const LEXICO_RITMO = ['rápid', 'rapid', 'lent', 'urgen', 'velocidad', 'impacien', 'pausad', 'acelerad', 'demora', 'plazo'];
function textoDe(bloque) {
  return [bloque.titulo, bloque.resumen, ...(bloque.bullets || [])].join(' ').toLowerCase();
}
for (const clave of Object.keys(Textos.RITMO)) {
  const t = textoDe(Textos.RITMO[clave]);
  const sucias = LEXICO_FOCO.filter((w) => t.includes(w));
  check(sucias.length === 0, `RITMO.${clave} usa léxico de foco: ${sucias.join(', ')}`);
}
for (const clave of Object.keys(Textos.FOCO)) {
  const t = textoDe(Textos.FOCO[clave]);
  const sucias = LEXICO_RITMO.filter((w) => t.includes(w));
  check(sucias.length === 0, `FOCO.${clave} usa léxico de ritmo: ${sucias.join(', ')}`);
}
console.log('  (los bloques de LETRA pueden mezclar ambos ejes: una letra es la combinación de los dos)');

console.log('\n5) LOS 4 ESTILOS PRODUCEN TEXTO COMPLETO');
for (const letra of L) {
  const t = Textos.LETRA[letra];
  check(!!t, `falta el contenido de la letra ${letra}`);
  if (!t) continue;
  for (const campo of ['nombre', 'ubicacion', 'resumen', 'bullets', 'fortalezas', 'atencion', 'comunicacion', 'entorno']) {
    check(t[campo] && t[campo].length > 0, `LETRA.${letra}.${campo} vacío`);
  }
}
// La composición completa no debe romperse en ningún perfil
for (const det of muestras.slice(0, 500)) {
  const p = Textos.perfil(Core.calcular(det).natural);
  check(p && p.ritmo && p.foco && p.letra, 'DISCTextos.perfil() devolvió un perfil incompleto');
}

console.log(fallas === 0
  ? '\nINVARIANTES OK — cálculo, coherencia panel/informe, independencia de ejes y textos.'
  : `\nINVARIANTES CON ${fallas} FALLA(S).`);
process.exit(fallas === 0 ? 0 : 1);
