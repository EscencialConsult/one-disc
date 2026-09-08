/**
 * Auditoría automática de un test DISC nuevo (Fase 6 del PLAN_ARREGLO_DISC.md).
 *
 *   node scripts/disc-auditar.mjs <disc_id | usuario_user>
 *
 * Trae la fila de `respuestas` desde Supabase (anon key del .env), muestra
 * pregunta por pregunta la palabra que la persona eligió como MÁS y como
 * MENOS (con su letra), recalcula todo con discCore.js (conteos, netos,
 * barras 0-100, letra dominante, rueda, estabilidad) y verifica que sea
 * coherente entre sí. Es lo que antes había que hacer a mano con el PDF.
 *
 * Si el test no tiene `detalle` (tomado antes del arreglo), lo dice y termina.
 */
import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = process.argv[2];
if (!arg) { console.error('Uso: node scripts/disc-auditar.mjs <disc_id | usuario_user>'); process.exit(2); }

// --- Supabase (anon key del .env) ---
const env = Object.fromEntries(fs.readFileSync(path.join(ROOT, '.env'), 'utf-8').split(/\r?\n/).filter((l) => l.includes('=')).map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, '')]; }));
const URL = env.VITE_SUPABASE_URL, KEY = env.VITE_SUPABASE_ANON_KEY;
if (!URL || !KEY) { console.error('No encontré VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY en .env'); process.exit(2); }
let rows;
if (arg.endsWith('.json') && fs.existsSync(arg)) {
  // Modo local: un JSON con { respuestas, detalle } (para probar sin base).
  rows = [{ disc_id: '(local)', usuario_user: path.basename(arg), fecha: '', ...JSON.parse(fs.readFileSync(arg, 'utf-8')) }];
} else {
  const filtro = /^\d+$/.test(arg) ? `disc_id=eq.${arg}` : `usuario_user=eq.${encodeURIComponent(arg)}`;
  const res = await fetch(`${URL}/rest/v1/respuestas?${filtro}&select=disc_id,usuario_user,admin_id,respuestas,detalle,pdf_path,fecha&order=disc_id.desc`, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } });
  rows = await res.json();
}
if (!Array.isArray(rows) || rows.length === 0) { console.error('No hay ningún test con', arg, JSON.stringify(rows)); process.exit(1); }
const row = rows[0];
if (rows.length > 1) console.log(`(${rows.length} tests encontrados; audito el más reciente, disc_id ${row.disc_id})`);

// --- Sandbox con discCore.js + GRUPOS_DISC (palabras de cada pregunta) de script.js ---
const ctx = { window: {}, Math, Object, Array, JSON, String, Number, console: { log() {}, warn() {}, error() {} }, document: { addEventListener() {}, getElementById() { return null; }, querySelector() { return null; }, querySelectorAll() { return []; } }, sessionStorage: { getItem() { return null; } }, setTimeout() {} };
ctx.window = ctx; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'public/informe/discCore.js'), 'utf-8'), ctx, { filename: 'discCore.js' });
vm.runInContext(fs.readFileSync(path.join(ROOT, 'public/informe/discToWheel.js'), 'utf-8'), ctx, { filename: 'discToWheel.js' });
// GRUPOS_DISC es un `const` de script.js (no queda en el global del sandbox): se exporta a mano.
vm.runInContext(fs.readFileSync(path.join(ROOT, 'public/informe/script.js'), 'utf-8') + '\n;window.GRUPOS_DISC = GRUPOS_DISC;', ctx, { filename: 'script.js' });
const Core = ctx.DISCCore;
const GRUPOS = ctx.GRUPOS_DISC;

console.log(`\nTEST disc_id ${row.disc_id} — usuario ${row.usuario_user} — ${row.fecha || ''} — PDF: ${row.pdf_path || '(sin PDF)'}`);
if (!Core.tieneDetalle(row.detalle)) {
  console.log('Este test NO tiene detalle por pregunta (tomado antes del arreglo): se calcula con el algoritmo anterior y no se puede auditar letra por letra.');
  process.exit(0);
}

const c = Core.calcular(row.detalle);
const preguntas = Core.detallePreguntas(row.detalle, GRUPOS);
const L = Core.LETRAS;
const pad = (s, n) => String(s).padEnd(n);

console.log('\n1) LO QUE ELIGIÓ LA PERSONA (palabra y letra)');
console.log(`   ${pad('#', 3)} ${pad('Parte', 6)} ${pad('MÁS', 22)} ${pad('MENOS', 22)}`);
for (const p of preguntas) console.log(`   ${pad(p.numero, 3)} ${pad(p.parte, 6)} ${pad(`${p.masPalabra} (${p.masLetra})`, 22)} ${pad(`${p.menosPalabra} (${p.menosLetra})`, 22)}`);

function bloque(nombre, parte) {
  console.log(`\n   ${nombre}`);
  console.log(`   ${pad('', 8)} ${L.map((x) => pad(x, 6)).join('')}`);
  console.log(`   ${pad('MÁS', 8)} ${L.map((x) => pad(parte.conteo.mas[x], 6)).join('')}`);
  console.log(`   ${pad('MENOS', 8)} ${L.map((x) => pad(parte.conteo.menos[x], 6)).join('')}`);
  console.log(`   ${pad('Neto', 8)} ${L.map((x) => pad(parte.neto[x], 6)).join('')}`);
  console.log(`   ${pad('0-100', 8)} ${L.map((x) => pad(parte.valores[x], 6)).join('')}`);
}
console.log('\n2) CONTEOS Y PUNTAJES');
bloque('Natural (preguntas 1-14)', c.natural);
bloque('Adaptado (preguntas 15-28)', c.adaptado);
bloque('Total (28 preguntas) → barras del informe', c.total);
console.log(`   Niveles: ${L.map((x) => `${x}=${c.total.niveles[x]}`).join(', ')} (≥${Core.UMBRAL_PREDOMINANTE} predominante, ≤${Core.UMBRAL_BAJO} baja)`);

console.log('\n3) RESULTADO');
console.log(`   Letra dominante Natural: ${c.natural.dominante}  |  Adaptado: ${c.adaptado.dominante}  |  Barras (total): ${c.total.dominante}`);
const pn = c.natural.polares, pa = c.adaptado.polares;
console.log(`   Rueda Natural : ${pn.rol} · celda ${pn.cell} · ${Math.round(pn.angle) % 360}° · intensidad ${Math.round(pn.radius * 100)}%`);
console.log(`   Rueda Adaptado: ${pa.rol} · celda ${pa.cell} · ${Math.round(pa.angle) % 360}° · intensidad ${Math.round(pa.radius * 100)}%`);
console.log(`   Estabilidad: ${c.estabilidad.titulo} (Σ|Δ| = ${c.estabilidad.total}: ${L.map((x) => `${x} ${c.estabilidad.porLetra[x]}`).join(', ')})`);

console.log('\n4) VERIFICACIONES');
let fallas = 0;
const check = (ok, msg) => { console.log(`   ${ok ? 'OK ' : 'MAL'} ${msg}`); if (!ok) fallas++; };
// a) Conteo a mano contra el núcleo
const mano = { mas: { D: 0, I: 0, S: 0, C: 0 }, menos: { D: 0, I: 0, S: 0, C: 0 } };
for (let q = 1; q <= 28; q++) { const d = row.detalle[q] || row.detalle[String(q)]; mano.mas[d.mas]++; mano.menos[d.menos]++; }
check(L.every((x) => mano.mas[x] === c.total.conteo.mas[x] && mano.menos[x] === c.total.conteo.menos[x]), 'los conteos MÁS/MENOS coinciden con un recuento manual de las 28 preguntas');
check(L.reduce((a, x) => a + c.total.conteo.mas[x], 0) === 28 && L.reduce((a, x) => a + c.total.conteo.menos[x], 0) === 28, 'hay exactamente 28 MÁS y 28 MENOS');
// b) La letra dominante es la barra más alta
const maxBarra = Math.max(...L.map((x) => c.total.valores[x]));
check(c.total.valores[c.total.dominante] === maxBarra, `la letra dominante (${c.total.dominante}) es la barra más alta (${maxBarra})`);
check(c.natural.valores[c.natural.dominante] === Math.max(...L.map((x) => c.natural.valores[x])), `la letra Natural (${c.natural.dominante}) es la más alta de la Parte I`);
// c) La rueda apunta al sector de la letra dominante Natural (o entre sus dos letras más altas)
const letraAngulo = Core.letraPorAngulo(pn.angle);
const dosAltas = L.slice().sort((a, b) => c.natural.neto[b] - c.natural.neto[a]).slice(0, 2);
check(pn.radius === 0 || dosAltas.includes(letraAngulo), `la rueda Natural apunta al sector ${letraAngulo}, que es una de las dos letras más altas (${dosAltas.join('/')})`);
check(pn.rol === Core.rolPorAngulo(pn.angle) && pn.cell === Core.celda(pn.radius, pn.angle), 'rol y celda de la rueda corresponden al ángulo/radio calculados');
// d) Estabilidad consistente
const sumaDelta = L.reduce((a, x) => a + Math.abs(c.natural.neto[x] - c.adaptado.neto[x]), 0);
check(sumaDelta === c.estabilidad.total, `la estabilidad (${c.estabilidad.total}) es la suma de |Natural − Adaptado| en las 4 letras`);
// e) Lo que muestra discToWheel (lo que dibuja el informe) es lo mismo que el núcleo
const w = ctx.discToWheel(ctx.parsearRespuestasDISC(row.respuestas).respuestas, row.detalle);
check(w && w.version === 2 && w.natural.cell === pn.cell && w.adaptado.cell === pa.cell, 'discToWheel (rueda del informe) usa el núcleo y da las mismas celdas');

console.log(fallas === 0 ? '\nAUDITORÍA OK — el informe de este test es coherente con sus respuestas.' : `\nAUDITORÍA CON ${fallas} FALLA(S).`);
process.exit(fallas === 0 ? 0 : 1);
