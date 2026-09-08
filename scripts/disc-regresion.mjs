/**
 * Test de regresión del cálculo DISC (Fase 0 del PLAN_ARREGLO_DISC.md).
 *
 * Carga los archivos REALES de public/informe/ (script.js, pdfGenerator.js,
 * discToWheel.js) en un sandbox de Node y los corre sobre los 19 tests de
 * COMRURAL (fixture anonimizado: solo id + string de respuestas).
 *
 *   node scripts/disc-regresion.mjs --baseline   → guarda la salida actual
 *   node scripts/disc-regresion.mjs              → compara contra la baseline
 *
 * Los tests viejos (sin `detalle`) tienen que dar EXACTAMENTE lo mismo
 * después de cada fase. Si algo cambia, se rompió la compatibilidad.
 */
import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const FIXTURE = path.join(__dirname, 'fixtures', 'comrural_respuestas.json');
const BASELINE = path.join(__dirname, 'fixtures', 'baseline_legacy.json');

function sandbox(files) {
  let capturedHtml = '';
  const fakeEl = {
    get innerHTML() { return capturedHtml; },
    set innerHTML(v) { capturedHtml = v; },
    textContent: '', className: '', style: {}, classList: { add() {}, remove() {} },
    setAttribute() {}, appendChild() {}, querySelector() { return null; },
  };
  const window = {};
  const ctx = {
    window,
    document: {
      addEventListener() {},
      getElementById() { return fakeEl; },
      querySelector() { return null; },
      querySelectorAll() { return []; },
      createElement() { return fakeEl; },
      createElementNS() { return fakeEl; },
      head: fakeEl, body: fakeEl,
    },
    sessionStorage: { getItem() { return null; }, setItem() {} },
    console: { log() {}, warn() {}, error() {} },
    setTimeout() {}, alert() {},
    Math, Object, Array, JSON, String, Number, parseInt, parseFloat, isNaN, Promise, Error, Date, Map, Set,
  };
  ctx.window = ctx; // los scripts usan window.X = ...
  vm.createContext(ctx);
  for (const f of files) vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf-8'), ctx, { filename: f });
  ctx.__captured = () => capturedHtml;
  return ctx;
}

// script.js y pdfGenerator.js definen funciones con el mismo nombre
// (calcularValoresDISC): van en sandboxes separados.
const informe = sandbox(['public/informe/discToWheel.js', 'public/informe/script.js']);
const pdf = sandbox(['public/informe/pdfGenerator.js']);

const fixture = JSON.parse(fs.readFileSync(FIXTURE, 'utf-8'));
const salida = {};

for (const t of fixture) {
  const parsed = informe.parsearRespuestasDISC(t.respuestas);
  const res = informe.calcularResultadosDISC(parsed);
  const { detallePreguntas, ...resNum } = res;
  informe.renderInterpretacionPartes(res);
  const tituloPartes = (informe.__captured().match(/<h3[^>]*>([^<]+)<\/h3>/) || [])[1] || '';
  const wheel = informe.discToWheel(parsed.respuestas);
  const pdfRes = pdf.calcularResultadoParaPDF(parsed.respuestas);
  const { detallePreguntas: _d, ...pdfNum } = pdfRes;

  salida[t.disc_id] = {
    resultados: resNum,
    barras: informe.calcularValoresDISC(parsed.respuestas),
    rueda: wheel,
    verdictoPartes: tituloPartes,
    detalleGrupos: detallePreguntas.map((p) => `${p.numero}:${p.masGrupo}/${p.menosGrupo}`),
    pdf: { ...pdfNum, barras: pdf.calcularValoresDISC(parsed.respuestas) },
  };
}

if (process.argv.includes('--baseline')) {
  fs.writeFileSync(BASELINE, JSON.stringify(salida, null, 1));
  console.log(`Baseline guardada: ${Object.keys(salida).length} tests → ${path.relative(ROOT, BASELINE)}`);
  process.exit(0);
}

if (!fs.existsSync(BASELINE)) {
  console.error('No hay baseline. Corré primero: node scripts/disc-regresion.mjs --baseline');
  process.exit(2);
}

const base = JSON.parse(fs.readFileSync(BASELINE, 'utf-8'));
let diffs = 0;
function cmp(a, b, ruta) {
  if (typeof a !== typeof b || (a && typeof a === 'object') !== (b && typeof b === 'object')) {
    diffs++; console.log(`DIFF ${ruta}: ${JSON.stringify(a)} → ${JSON.stringify(b)}`); return;
  }
  if (a && typeof a === 'object') {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    for (const k of keys) cmp(a[k], b[k], `${ruta}.${k}`);
    return;
  }
  if (a !== b) { diffs++; console.log(`DIFF ${ruta}: ${JSON.stringify(a)} → ${JSON.stringify(b)}`); }
}
for (const id of Object.keys(base)) cmp(base[id], salida[id], `test ${id}`);

if (diffs === 0) {
  console.log(`REGRESIÓN OK — ${Object.keys(base).length} tests viejos dan exactamente lo mismo que la baseline.`);
} else {
  console.log(`REGRESIÓN ROTA — ${diffs} diferencia(s). Los tests viejos cambiaron de resultado.`);
  process.exit(1);
}
