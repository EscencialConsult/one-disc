import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserGroupIcon,
  ArrowLeftIcon,
  ArrowsRightLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  DocumentArrowDownIcon,
  InformationCircleIcon,
  PrinterIcon,
} from '@heroicons/react/24/outline';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  RadialLinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
} from 'chart.js';
import { Bar, Radar, Doughnut } from 'react-chartjs-2';
import { CONFIG } from '../lib/config.js';
import { Session } from '../lib/session.js';
import { Auth } from '../lib/auth.js';
import { getRespuestasByAdmin, getUsuariosByAdmin, getPdfUrl } from '../lib/api.js';
import { loadScript, loadScripts, unloadLegacyScripts } from '../lib/loadScript.js';
import {
  calcularPerfilDominante,
  calcularVectorNatural100,
  calcularStatsEquipo,
  DISC_HEX,
  narrativaRelacion,
  DISC_PAIR_ADVICE,
  promedioVectorEquipo,
  narrativaBrechaCultura,
  nivelRiesgoRelacion,
  obtenerCompatibilidad,
  calcularPerfilCompleto,
  afinidadPersonas,
} from '../lib/discScoring.js';
import Footer from '../components/Footer.jsx';
import { LoadingOverlay, useToasts } from './AdminDashboard.jsx';

ChartJS.register(CategoryScale, LinearScale, BarElement, RadialLinearScale, PointElement, LineElement, ArcElement, Tooltip);

const CHART_TICK_COLOR = '#a4a8c0';
const CHART_GRID_COLOR = 'rgba(255,255,255,0.06)';

// Mismos scripts legacy que usa Userboard/AdminDashboard para el manual (jsPDF 2.5.1, sin tocar).
const MANUAL_SCRIPTS = [
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  '/legacy/ManualTheme.js',
  '/legacy/Manual.js',
];

/**
 * Panel RRHH — Análisis de Equipos: distribución D/I/S/C del equipo del
 * Admin logueado, calculada a partir de los tests ya completados.
 * No inventa ningún cálculo nuevo: reusa tal cual public/legacy/discToWheel.js
 * (mismo script que ya usa el Informe) vía src/lib/discScoring.js.
 */

const DISC_INFO = {
  D: { nombre: 'Dominancia', bg: 'bg-disc-d', text: 'text-disc-d', border: 'border-disc-d/30' },
  I: { nombre: 'Influencia', bg: 'bg-disc-i', text: 'text-disc-i', border: 'border-disc-i/30' },
  S: { nombre: 'Estabilidad', bg: 'bg-disc-s', text: 'text-disc-s', border: 'border-disc-s/30' },
  C: { nombre: 'Cumplimiento', bg: 'bg-disc-c', text: 'text-disc-c', border: 'border-disc-c/30' },
};

function LetraBadge({ letra }) {
  const info = DISC_INFO[letra];
  if (!info) return <span className="text-gray-500">—</span>;
  return (
    <span
      className={`inline-flex h-7 w-7 items-center justify-center rounded-full font-title text-sm font-extrabold text-white ${info.bg}`}
      title={info.nombre}
    >
      {letra}
    </span>
  );
}

/** Lista de "qué hacer" / "qué evitar" en una dirección (A tratando con B). */
function ListaConsejos({ titulo, items, icon: Icon, colorClass }) {
  return (
    <div className="flex-1 rounded-xl border border-white/10 bg-black/30 p-4">
      <h4 className={`mb-3 flex items-center gap-2 text-sm font-bold ${colorClass}`}>
        <Icon className="h-4 w-4" />
        {titulo}
      </h4>
      <ul className="space-y-1.5 text-[13px] text-gray-300">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-1.5">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-gray-500" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Panel A→B: nombre + letra de A, consejos de cómo A debería tratar a B. */
function DireccionRelacion({ persona, contraparte }) {
  const consejos = DISC_PAIR_ADVICE[persona.natural]?.[contraparte.natural];
  if (!consejos) return null;
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-300">
        Cómo <LetraBadge letra={persona.natural} /> <span className="text-gray-200">{persona.nombre}</span> se
        relaciona con <LetraBadge letra={contraparte.natural} />{' '}
        <span className="text-gray-200">{contraparte.nombre}</span>
      </div>
      <div className="flex flex-col gap-4 sm:flex-row">
        <ListaConsejos titulo="Qué hacer" items={consejos.hacer} icon={CheckCircleIcon} colorClass="text-green-400" />
        <ListaConsejos titulo="Qué evitar" items={consejos.evitar} icon={XCircleIcon} colorClass="text-red-400" />
      </div>
    </div>
  );
}

/**
 * Afinidad entre dos personas con cálculo real: distancia entre sus cuatro
 * valores Natural, ejes compartidos y cuánto se adapta cada una bajo presión.
 * Reemplaza el criterio "misma letra = se llevan bien".
 */
function AfinidadReal({ a, b }) {
  const af = afinidadPersonas(a, b);
  if (!af) {
    return (
      <div className="mb-6 rounded-2xl border border-one-gold/30 bg-one-gold/5 p-5 text-sm text-gray-300">
        {a.legacy || b.legacy
          ? 'Al menos uno de los dos tests fue tomado con la versión anterior del algoritmo: la afinidad calculada no está disponible (la letra es aproximada). Los consejos de abajo siguen siendo válidos como referencia por estilo.'
          : 'No se pudo calcular la afinidad.'}
      </div>
    );
  }
  const letras = ['D', 'I', 'S', 'C'];
  const color = af.nivel === 'Alta' ? 'text-green-400' : af.nivel === 'Media' ? 'text-yellow-400' : 'text-red-400';
  return (
    <div className="mb-6 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-white/10 bg-gradient-to-r from-one-cyan/10 to-one-pink/10 px-6 py-4">
        <h3 className="font-title text-lg font-bold">Afinidad calculada</h3>
        <span className={`font-title text-2xl font-black ${color}`}>{af.pct}% · {af.nivel}</span>
      </div>
      <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-2">
        <div className="space-y-2">
          {letras.map((L) => (
            <div key={L} className="flex items-center gap-3 text-xs">
              <LetraBadge letra={L} />
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-20 shrink-0 truncate text-gray-400">{a.nombre.split(' ')[0]}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/5"><div className={`h-full ${DISC_INFO[L].bg}`} style={{ width: `${a.vectorNatural[L]}%` }} /></div>
                  <span className="w-8 text-right font-bold text-gray-300">{a.vectorNatural[L]}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-20 shrink-0 truncate text-gray-400">{b.nombre.split(' ')[0]}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/5"><div className={`h-full ${DISC_INFO[L].bg} opacity-60`} style={{ width: `${b.vectorNatural[L]}%` }} /></div>
                  <span className="w-8 text-right font-bold text-gray-300">{b.vectorNatural[L]}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <ul className="space-y-2 text-sm text-gray-300">
          <li>Similitud de perfiles (4 dimensiones): <strong className="text-gray-100">{af.similitudVector}%</strong></li>
          <li>Ritmo: {af.compartenRitmo ? <span className="text-green-400">comparten</span> : <span className="text-yellow-400">difieren</span>} · Prioridad: {af.compartenPrioridad ? <span className="text-green-400">comparten</span> : <span className="text-yellow-400">difieren</span>}</li>
          <li>Cambio bajo presión — {a.nombre.split(' ')[0]}: <strong className="text-gray-100">{af.adaptacionA}</strong> · {b.nombre.split(' ')[0]}: <strong className="text-gray-100">{af.adaptacionB}</strong> <span className="text-gray-500">(0 = idéntico, más alto = más adaptación)</span></li>
          <li className="text-xs text-gray-500">La afinidad baja si alguno de los dos cambia mucho bajo presión: lo que se ve en calma puede no sostenerse.</li>
        </ul>
      </div>
    </div>
  );
}

function ComparacionPersonas({ personas }) {
  const [usuarioA, setUsuarioA] = useState('');
  const [usuarioB, setUsuarioB] = useState('');

  const personaA = useMemo(() => personas.find((p) => p.usuario === usuarioA), [personas, usuarioA]);
  const personaB = useMemo(() => personas.find((p) => p.usuario === usuarioB), [personas, usuarioB]);

  if (personas.length < 2) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center text-gray-400">
        Hacen falta al menos 2 personas con test completado para poder comparar.
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl">
        <div className="border-b border-white/10 bg-gradient-to-r from-one-cyan/10 to-one-pink/10 px-6 py-4">
          <h3 className="font-title text-lg font-bold">Elegí a las dos personas a comparar</h3>
        </div>
        <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-300">Persona A</label>
            <select
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-white focus:border-one-cyan/50 focus:outline-none"
              value={usuarioA}
              onChange={(e) => setUsuarioA(e.target.value)}
            >
              <option value="">-- Seleccionar --</option>
              {personas.map((p) => (
                <option key={p.usuario} value={p.usuario} disabled={p.usuario === usuarioB}>
                  {p.nombre} ({p.natural}){p.legacy ? ' — versión anterior' : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-300">Persona B</label>
            <select
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-white focus:border-one-cyan/50 focus:outline-none"
              value={usuarioB}
              onChange={(e) => setUsuarioB(e.target.value)}
            >
              <option value="">-- Seleccionar --</option>
              {personas.map((p) => (
                <option key={p.usuario} value={p.usuario} disabled={p.usuario === usuarioA}>
                  {p.nombre} ({p.natural}){p.legacy ? ' — versión anterior' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {personaA && personaB && (
        <>
          <div className="mb-6 flex flex-col items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-6 sm:flex-row sm:justify-center">
            <div className="flex items-center gap-2">
              <LetraBadge letra={personaA.natural} />
              <span className="font-semibold text-gray-200">{personaA.nombre}</span>
            </div>
            <ArrowsRightLeftIcon className="h-5 w-5 shrink-0 text-gray-500" />
            <div className="flex items-center gap-2">
              <LetraBadge letra={personaB.natural} />
              <span className="font-semibold text-gray-200">{personaB.nombre}</span>
            </div>
          </div>

          <AfinidadReal a={personaA} b={personaB} />

          <div className="mb-6 rounded-2xl border border-one-cyan/20 bg-one-cyan/5 p-5 text-sm leading-relaxed text-gray-300">
            {narrativaRelacion(personaA.natural, personaB.natural)}
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <DireccionRelacion persona={personaA} contraparte={personaB} />
            <DireccionRelacion persona={personaB} contraparte={personaA} />
          </div>
        </>
      )}
    </div>
  );
}


/** Ver/descargar directo el informe DISC de cada persona, sin ir al panel de Admin. */
/**
 * Abre el informe interactivo real (el mismo que usa el propio evaluado)
 * en una pestaña nueva. No depende de que exista un PDF ya generado en
 * Storage — se arma en el momento a partir del string de respuestas ya
 * guardado, igual que hace public/informe/script.js.
 *
 * sessionStorage no viaja solo a una pestaña nueva (cada pestaña tiene la
 * suya), así que se abre la pestaña en blanco primero y se le escribe el
 * dato directamente a SU sessionStorage antes de navegarla — sigue siendo
 * la misma sesión (mismo origen), solo que en otra pestaña.
 */
function abrirInformeEnVivo(persona) {
  const nueva = window.open('', '_blank');
  if (!nueva) return; // el navegador bloqueó el popup
  nueva.sessionStorage.setItem('discUserData', JSON.stringify(persona.raw));
  nueva.location.href = `${CONFIG.routes.informe}?email=${encodeURIComponent(persona.email || persona.usuario)}`;
}

function InformesTab({ personas, descargandoManual, onDescargarPackLider }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl">
      <div className="border-b border-white/10 bg-gradient-to-r from-one-cyan/10 to-one-pink/10 px-6 py-4">
        <h3 className="font-title text-lg font-bold">Informes de todos los evaluados</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-white/10 text-[11px] font-bold uppercase tracking-widest text-gray-500">
            <tr>
              <th className="px-6 py-3">Nombre</th>
              <th className="px-6 py-3">Usuario</th>
              <th className="px-6 py-3">Email</th>
              <th className="px-6 py-3">Perfil Natural</th>
              <th className="px-6 py-3">Informe</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {personas.map((p) => {
              const packHabilitado = p.packStatus === '01' || p.packStatus === '1';
              return (
                <tr key={p.usuario} className="transition-colors hover:bg-white/5">
                  <td className="px-6 py-3 font-semibold text-gray-200">{p.nombre}</td>
                  <td className="px-6 py-3 text-gray-400">{p.usuario}</td>
                  <td className="px-6 py-3 text-gray-400">{p.email}</td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      <LetraBadge letra={p.natural} />
                      <span className="text-gray-300">{DISC_INFO[p.natural]?.nombre}</span>
                      {p.legacy && (
                        <span className="rounded-full border border-one-gold/30 bg-one-gold/10 px-2 py-0.5 text-[10px] font-semibold text-one-gold" title="Test tomado con la versión anterior del algoritmo: la letra es aproximada">
                          versión anterior
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => abrirInformeEnVivo(p)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-one-cyan/40 bg-one-cyan/10 px-3.5 py-1.5 text-xs font-semibold text-one-cyan transition-all hover:border-one-cyan/60 hover:bg-one-cyan/20"
                      >
                        <DocumentArrowDownIcon className="h-4 w-4" />
                        Ver Informe
                      </button>
                      {packHabilitado && (
                        <button
                          onClick={() => onDescargarPackLider(p)}
                          disabled={descargandoManual === p.usuario}
                          className="inline-flex items-center gap-1.5 rounded-full border border-one-gold/40 bg-one-gold/10 px-3.5 py-1.5 text-xs font-semibold text-one-gold transition-all hover:border-one-gold/60 hover:bg-one-gold/20 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <DocumentArrowDownIcon className="h-4 w-4" />
                          Pack Líder
                        </button>
                      )}
                      {p.pdfPath && (
                        <a
                          href={getPdfUrl(p.pdfPath)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-gray-400 underline transition-colors hover:text-gray-200"
                        >
                          PDF
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const CULTURA_PRESETS = [
  { nombre: 'Cultura de Resultados', d: 75, i: 45, s: 25, c: 35 },
  { nombre: 'Cultura de Servicio', d: 25, i: 65, s: 70, c: 30 },
  { nombre: 'Cultura de Precisión', d: 30, i: 25, s: 40, c: 80 },
  { nombre: 'Cultura Balanceada', d: 50, i: 50, s: 50, c: 50 },
];

/** Barras comparadas Actual vs Ideal para una dimensión. */
function BarraComparada({ letra, actual, ideal }) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex w-28 shrink-0 items-center gap-2">
        <LetraBadge letra={letra} />
        <span className="text-sm font-semibold text-gray-300">{DISC_INFO[letra].nombre}</span>
      </div>
      <div className="flex-1 space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="w-12 shrink-0 text-[11px] text-gray-500">Actual</span>
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/5">
            <div className={`h-full rounded-full ${DISC_INFO[letra].bg}`} style={{ width: `${actual}%` }} />
          </div>
          <span className="w-9 shrink-0 text-right text-xs font-bold text-gray-300">{actual}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-12 shrink-0 text-[11px] text-gray-500">Ideal</span>
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/5">
            <div className="h-full rounded-full bg-white/30" style={{ width: `${ideal}%` }} />
          </div>
          <span className="w-9 shrink-0 text-right text-xs font-bold text-gray-300">{ideal}</span>
        </div>
      </div>
    </div>
  );
}

function CulturaTab({ personas }) {
  const [ideal, setIdeal] = useState({ d: 50, i: 50, s: 50, c: 50 });
  const [calculado, setCalculado] = useState(null); // { actual, ideal } una vez que se presiona "Calcular"

  const actual = useMemo(() => promedioVectorEquipo(personas), [personas]);

  function aplicarPreset(p) {
    setIdeal({ d: p.d, i: p.i, s: p.s, c: p.c });
  }

  function calcular() {
    setCalculado({ actual, ideal });
  }

  const brecha = calculado
    ? Math.round(
        100 -
          (Math.abs(calculado.actual.D - calculado.ideal.d) +
            Math.abs(calculado.actual.I - calculado.ideal.i) +
            Math.abs(calculado.actual.S - calculado.ideal.s) +
            Math.abs(calculado.actual.C - calculado.ideal.c)) /
            4
      )
    : null;

  return (
    <div>
      <div className="mb-8 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl">
        <div className="border-b border-white/10 bg-gradient-to-r from-one-cyan/10 to-one-pink/10 px-6 py-4">
          <h3 className="font-title text-lg font-bold">Definí la Cultura Ideal</h3>
        </div>
        <div className="p-6">
          <p className="mb-3 text-sm text-gray-400">Plantillas rápidas (después podés ajustar los valores):</p>
          <div className="mb-5 flex flex-wrap gap-2">
            {CULTURA_PRESETS.map((p) => (
              <button
                key={p.nombre}
                type="button"
                onClick={() => aplicarPreset(p)}
                className="rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-gray-300 transition-all hover:border-one-cyan/40 hover:bg-one-cyan/10"
              >
                {p.nombre}
              </button>
            ))}
          </div>

          <div className="mb-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {['d', 'i', 's', 'c'].map((letra) => (
              <div key={letra}>
                <label className={`mb-2 flex items-center gap-1.5 text-sm font-semibold ${DISC_INFO[letra.toUpperCase()].text}`}>
                  <LetraBadge letra={letra.toUpperCase()} /> Peso (0-100)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-white focus:border-one-cyan/50 focus:outline-none"
                  value={ideal[letra]}
                  onChange={(e) =>
                    setIdeal({ ...ideal, [letra]: Math.max(0, Math.min(100, Number(e.target.value) || 0)) })
                  }
                />
              </div>
            ))}
          </div>

          <button
            onClick={calcular}
            className="rounded-full border border-one-cyan/40 bg-gradient-to-r from-one-cyan/20 to-one-pink/20 px-6 py-2.5 text-sm font-bold transition-all hover:-translate-y-0.5 hover:border-one-cyan/60"
          >
            Calcular Brecha Cultural
          </button>
        </div>
      </div>

      {calculado && (
        <>
          <div className="mb-8 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-white/10 bg-gradient-to-r from-one-cyan/10 to-one-pink/10 px-6 py-4">
              <h3 className="font-title text-lg font-bold">Cultura Actual vs. Cultura Ideal</h3>
              <span className="font-title text-2xl font-black text-white">{brecha}% alineación</span>
            </div>
            <div className="space-y-4 p-6">
              {['D', 'I', 'S', 'C'].map((letra) => (
                <BarraComparada
                  key={letra}
                  letra={letra}
                  actual={calculado.actual[letra]}
                  ideal={calculado.ideal[letra.toLowerCase()]}
                />
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-one-cyan/20 bg-one-cyan/5 p-5">
            <h4 className="mb-3 text-sm font-bold text-gray-200">Brecha corporativa</h4>
            <ul className="space-y-1.5 text-sm text-gray-300">
              {narrativaBrechaCultura(calculado.actual, {
                D: calculado.ideal.d,
                I: calculado.ideal.i,
                S: calculado.ideal.s,
                C: calculado.ideal.c,
              }).map((frase, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-gray-500" />
                  {frase}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

/** Modal de detalle de una celda de la matriz de compatibilidad. */
function CompatibilidadModal({ par, personas, onClose }) {
  if (!par) return null;
  const { letraA, letraB, riesgo, info } = par;

  const gruposReales =
    letraA === letraB
      ? [{ letra: letraA, gente: personas.filter((p) => p.natural === letraA) }]
      : [
          { letra: letraA, gente: personas.filter((p) => p.natural === letraA) },
          { letra: letraB, gente: personas.filter((p) => p.natural === letraB) },
        ];

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-[#141019] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        id="compat-print-area"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <LetraBadge letra={letraA} />
            <span className="text-lg text-gray-500">+</span>
            <LetraBadge letra={letraB} />
            <div>
              <h3 className="font-title text-lg font-bold text-white">
                {DISC_INFO[letraA].nombre} + {DISC_INFO[letraB].nombre}
              </h3>
              <span className={`text-xs font-semibold ${riesgo.textColor}`}>
                {riesgo.emoji} Riesgo de fricción: {riesgo.nivel}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="shrink-0 text-2xl leading-none text-gray-400 hover:text-white">
            ×
          </button>
        </div>

        <div className="space-y-4 text-sm leading-relaxed">
          <div>
            <h4 className="mb-1 font-semibold text-gray-200">Puntos de encuentro</h4>
            <p className="text-gray-400">{info.similitudes}</p>
          </div>
          <div>
            <h4 className="mb-1 font-semibold text-green-400">Cómo se complementan</h4>
            <p className="text-gray-400">{info.fortalezas}</p>
          </div>
          <div>
            <h4 className="mb-1 font-semibold text-red-400">Dónde chocan</h4>
            <p className="text-gray-400">{info.tensiones}</p>
          </div>
          <div>
            <h4 className="mb-1 font-semibold text-one-cyan">Buena concordancia laboral para</h4>
            <ul className="list-inside list-disc space-y-1 text-gray-400">
              {info.roles.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/30 p-4">
            <h4 className="mb-3 font-semibold text-gray-200">Ejemplos reales en tu equipo</h4>
            <div className={`grid gap-4 ${gruposReales.length === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {gruposReales.map(({ letra, gente }) => (
                <div key={letra}>
                  <div className="mb-2 flex items-center gap-1.5">
                    <LetraBadge letra={letra} />
                    <span className="text-xs font-semibold text-gray-400">{DISC_INFO[letra].nombre}</span>
                  </div>
                  {gente.length === 0 ? (
                    <p className="text-xs text-gray-500">Nadie en tu equipo tiene este estilo todavía.</p>
                  ) : (
                    <ul className="space-y-1 text-xs text-gray-300">
                      {gente.map((p) => (
                        <li key={p.usuario}>{p.nombre}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={() => window.print()}
          className="mt-6 flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-gray-300 transition-all hover:border-white/25 hover:bg-white/10 print:hidden"
        >
          <PrinterIcon className="h-4 w-4" />
          Imprimir esta guía
        </button>
      </div>
    </div>
  );
}

function CompatibilidadTab({ personas }) {
  const [seleccion, setSeleccion] = useState(null);
  const letras = ['D', 'I', 'S', 'C'];

  function abrir(letraA, letraB) {
    setSeleccion({ letraA, letraB, riesgo: nivelRiesgoRelacion(letraA, letraB), info: obtenerCompatibilidad(letraA, letraB) });
  }

  return (
    <div>
      <div className="mb-6 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl">
        <div className="border-b border-white/10 bg-gradient-to-r from-one-cyan/10 to-one-pink/10 px-6 py-4">
          <h3 className="font-title text-lg font-bold">Matriz de Compatibilidad de Estilos</h3>
          <p className="mt-1 text-xs text-gray-500">
            Guía de referencia fija (no depende de tu equipo real) — tocá cualquier celda para ver el detalle.
          </p>
        </div>
        <div className="overflow-x-auto p-6">
          <table className="mx-auto border-separate" style={{ borderSpacing: 8 }}>
            <thead>
              <tr>
                <th className="w-12" />
                {letras.map((l) => (
                  <th key={l} className="pb-1">
                    <LetraBadge letra={l} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {letras.map((fila) => (
                <tr key={fila}>
                  <td className="pr-1 text-right">
                    <LetraBadge letra={fila} />
                  </td>
                  {letras.map((col) => {
                    const riesgo = nivelRiesgoRelacion(fila, col);
                    return (
                      <td key={col}>
                        <button
                          onClick={() => abrir(fila, col)}
                          className={`flex h-14 w-14 items-center justify-center rounded-xl text-xs font-bold text-black/70 transition-transform hover:scale-105 ${riesgo.color}`}
                          title={`${fila} + ${col} — Riesgo ${riesgo.nivel}`}
                        >
                          {fila}
                          {col}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap gap-4 border-t border-white/10 px-6 py-4 text-xs text-gray-400">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-green-500" /> Bajo — mismo estilo
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-yellow-500" /> Medio — comparten un eje
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500" /> Alto — no comparten ningún eje
          </span>
        </div>
      </div>

      <CompatibilidadModal par={seleccion} personas={personas} onClose={() => setSeleccion(null)} />
    </div>
  );
}

function StatCard({ value, label, colorClass, borderClass }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border ${borderClass} bg-gradient-to-br from-white/5 to-white/10 p-5 backdrop-blur-sm transition-all hover:-translate-y-0.5`}>
      <h3 className={`text-2xl font-black leading-tight ${colorClass}`}>{value}</h3>
      <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</p>
    </div>
  );
}

/** Gráfico principal del equipo: distribución D/I/S/C, con toggle barras/radar. */
function ChartEquipoPrincipal({ distribucion }) {
  const [tipo, setTipo] = useState('bar');
  const labels = ['D', 'I', 'S', 'C'];
  const valores = labels.map((l) => distribucion[l]);
  const colores = labels.map((l) => DISC_HEX[l]);

  const dataBar = {
    labels,
    datasets: [{ data: valores, backgroundColor: colores, borderRadius: 6, borderWidth: 0 }],
  };
  const dataRadar = {
    labels: labels.map((l) => DISC_INFO[l].nombre),
    datasets: [
      {
        data: valores,
        backgroundColor: 'rgba(107,225,227,0.12)',
        borderColor: '#6be1e3',
        borderWidth: 2,
        pointBackgroundColor: colores,
        pointRadius: 4,
      },
    ],
  };

  const commonOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } };
  const barOptions = {
    ...commonOptions,
    scales: {
      x: { grid: { color: CHART_GRID_COLOR }, ticks: { color: CHART_TICK_COLOR, font: { size: 11 } } },
      y: { grid: { color: CHART_GRID_COLOR }, ticks: { color: CHART_TICK_COLOR, stepSize: 1 }, beginAtZero: true },
    },
  };
  const radarOptions = {
    ...commonOptions,
    scales: {
      r: {
        grid: { color: CHART_GRID_COLOR },
        ticks: { color: CHART_TICK_COLOR, backdropColor: 'transparent', stepSize: 1 },
        pointLabels: { color: CHART_TICK_COLOR, font: { size: 11 } },
      },
    },
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-white/10 bg-gradient-to-r from-one-cyan/10 to-one-pink/10 px-6 py-4">
        <h3 className="font-title text-lg font-bold">Distribución D/I/S/C</h3>
        <div className="flex gap-1 rounded-full border border-white/10 bg-black/30 p-1">
          {['bar', 'radar'].map((t) => (
            <button
              key={t}
              onClick={() => setTipo(t)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                tipo === t ? 'bg-one-cyan text-black' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {t === 'bar' ? 'Barras' : 'Radar'}
            </button>
          ))}
        </div>
      </div>
      <div className="p-6" style={{ height: 280, position: 'relative' }}>
        {tipo === 'bar' ? <Bar data={dataBar} options={barOptions} /> : <Radar data={dataRadar} options={radarOptions} />}
      </div>
    </div>
  );
}

/** Doughnut chico con leyenda HTML custom (dot + nombre + cantidad + %) — para un eje binario (Ritmo o Prioridad). */
function DoughnutEje({ titulo, conteos, colores }) {
  const entradas = Object.entries(conteos);
  const total = entradas.reduce((s, [, v]) => s + v, 0) || 1;

  const data = {
    labels: entradas.map(([k]) => k),
    datasets: [{ data: entradas.map(([, v]) => v), backgroundColor: entradas.map(([k]) => colores[k]), borderWidth: 0, hoverOffset: 6 }],
  };
  const options = { responsive: true, maintainAspectRatio: false, cutout: '65%', plugins: { legend: { display: false } } };

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl">
      <div className="border-b border-white/10 bg-gradient-to-r from-one-cyan/10 to-one-pink/10 px-6 py-4">
        <h3 className="font-title text-lg font-bold">{titulo}</h3>
      </div>
      <div className="p-6">
        <div style={{ height: 160, position: 'relative' }}>
          <Doughnut data={data} options={options} />
        </div>
        <div className="mt-4 space-y-2">
          {entradas.map(([nombre, count]) => (
            <div key={nombre} className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: colores[nombre] }} />
              <span className="flex-1 text-xs font-semibold text-gray-300">{nombre}</span>
              <span className="text-[11px] text-gray-500">{count} pers.</span>
              <span className="ml-1 text-[11px] font-bold text-one-cyan">{Math.round((count / total) * 100)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const INFO_TEXTS = {
  equipo: {
    titulo: 'Análisis de Equipo — cómo funciona',
    parrafos: [
      'Toma a todas las personas de tu empresa que ya completaron el test y calcula, en el momento (nada queda precalculado en la base), su perfil Natural — cómo es cada uno en su estado base, sin ajustar a ningún rol.',
      'Los 6 KPIs de arriba resumen al equipo: cuántos evaluados hay, cuántos de los 4 estilos (D/I/S/C) están presentes, cuál domina, y dos ejes agregados — Ritmo (cuántos son rápidos D/I vs. pausados S/C) y Prioridad (cuántos priorizan tareas D/C vs. personas I/S). El Índice de diversidad combina cuántos estilos distintos hay y qué tan concentrado está el equipo en uno solo.',
      'El gráfico principal (con toggle Barras/Radar) muestra la distribución D/I/S/C completa. Los dos gráficos de dona muestran el mismo equipo pero agrupado por Ritmo y por Prioridad, con su leyenda de cantidad y porcentaje al lado.',
      'Para ver el detalle de cada persona en particular (nombre, perfil Natural y Adaptado, e informe completo), andá a la pestaña "Informes".',
    ],
  },
  informes: {
    titulo: 'Informes — cómo funciona',
    parrafos: [
      'Lista a todas las personas de tu empresa que completaron el test, con su nombre, usuario, email y perfil Natural dominante.',
      'El botón "Ver Informe" abre en una pestaña nueva el informe interactivo completo — el mismo que ve la propia persona evaluada — armado en el momento a partir de sus respuestas guardadas. Funciona para el 100% de los evaluados, sin importar si alguna vez se generó un PDF de esa persona o no.',
      'El botón "Pack Líder" solo aparece para las personas que tienen ese beneficio habilitado (el mismo switch que se activa desde el Panel de Admin) y descarga al instante su Manual Personalizado en PDF.',
      'Si además esa persona ya tiene un PDF generado (porque en algún momento se descargó desde el informe), aparece un link chico "PDF" al lado para bajarlo directo.',
    ],
  },
  comparar: {
    titulo: 'Persona vs Persona — cómo funciona',
    parrafos: [
      'Elegís dos personas de tu equipo (que ya hayan completado el test) y el sistema compara sus perfiles Natural.',
      'Te muestra un texto que explica qué tienen en común y en qué pueden generar fricción, según dos ejes: Ritmo (rápido vs. pausado) y Prioridad (tareas vs. personas). Si comparten ambos ejes, se van a entender fácil. Si no comparten ninguno, es la combinación con más fricción inicial (pero también la que más se complementa).',
      'Abajo aparecen dos bloques de consejos "Qué hacer" y "Qué evitar" — uno para cómo la Persona A debería tratar a la Persona B, y otro al revés (los consejos no son los mismos en las dos direcciones).',
      'Todo se calcula al momento — no se guarda ninguna comparación.',
    ],
  },
  cultura: {
    titulo: 'Cultura Organizacional — cómo funciona',
    parrafos: [
      'Primero definís la "Cultura Ideal": cuánto pesa cada estilo (D/I/S/C, de 0 a 100) para lo que la empresa necesita a futuro. Podés usar una plantilla rápida (Resultados, Servicio, Precisión, Balanceada) y después ajustar los valores a mano.',
      'Al presionar "Calcular Brecha Cultural", se compara eso contra la "Cultura Actual" — el promedio real de los perfiles Natural de todo tu equipo (no solo la letra dominante, sino el peso de las 4 dimensiones).',
      'El resultado muestra las barras Actual vs. Ideal por cada letra, un % de alineación general, y una narrativa automática que marca qué estilo está sobrerrepresentado y cuál falta desarrollar (cuando la diferencia supera 15 puntos).',
      'No se guarda nada — cada vez que entrás definís la cultura ideal de nuevo.',
    ],
  },
  compatibilidad: {
    titulo: 'Compatibilidad de Estilos — cómo funciona',
    parrafos: [
      'Es una guía de referencia fija — no depende de tu equipo real ni de ninguna persona evaluada en particular, sino de la teoría de las 4x4 combinaciones posibles entre estilos D/I/S/C.',
      'La matriz coloreada indica el riesgo de fricción entre cada par: verde (mismo estilo), amarillo (comparten ritmo o prioridad, pero no ambos) o rojo (no comparten ningún eje — mayor potencial de conflicto).',
      'Al tocar una celda se abre el detalle: qué tienen en común, cómo se complementan trabajando juntos, dónde suelen chocar, y para qué tareas o roles es una buena dupla (ej. D+C para investigación y desarrollo, I+S para atención al cliente).',
      'Desde el detalle podés imprimir esa guía puntual para tenerla a mano en una reunión de equipo o mediación de conflicto.',
    ],
  },
};

function InfoModal({ tabInfo, onClose }) {
  if (!tabInfo) return null;
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#141019] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h3 className="font-title text-lg font-bold text-white">{tabInfo.titulo}</h3>
          <button onClick={onClose} className="shrink-0 text-2xl leading-none text-gray-400 hover:text-white">
            ×
          </button>
        </div>
        <div className="space-y-3 text-sm leading-relaxed text-gray-300">
          {tabInfo.parrafos.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Rrhh() {
  const navigate = useNavigate();
  const session = Session.get();

  const [loading, setLoading] = useState(true);
  const [personas, setPersonas] = useState([]); // [{ nombre, usuario, natural, adaptado, vectorNatural }]
  const [errorCarga, setErrorCarga] = useState('');
  const [tab, setTab] = useState('equipo'); // 'equipo' | 'comparar' | 'informes' | 'cultura'
  const [infoAbierto, setInfoAbierto] = useState(false);
  const [descargandoManual, setDescargandoManual] = useState(null); // usuario cuyo Pack Líder se está generando
  const { showToast, ToastContainer } = useToasts();

  useEffect(() => {
    let cancelado = false;

    async function cargar() {
      setLoading(true);
      try {
        await loadScript('/legacy/discCore.js');
        await loadScript('/legacy/discToWheel.js');
        const [respuestas, usuarios] = await Promise.all([
          getRespuestasByAdmin(session.adminId),
          getUsuariosByAdmin(session.adminId),
        ]);
        const packStatusPorUsuario = {};
        usuarios.forEach((u) => {
          packStatusPorUsuario[u.usuario_user] = String(u.pack_status || '').trim();
        });

        const calculadas = respuestas
          .filter((r) => r.Respuestas && String(r.Respuestas).trim() !== '')
          .map((r) => {
            const perfil = calcularPerfilDominante(r.Respuestas, r.Detalle);
            if (!perfil) return null;
            const completo = calcularPerfilCompleto(r.Detalle); // null en tests viejos
            return {
              nombre: [r.Nombre, r.Apellido].filter(Boolean).join(' ').trim() || r.User,
              usuario: r.User,
              email: r.Email_User || '',
              natural: perfil.natural,
              adaptado: perfil.adaptado,
              // legacy = test tomado antes del arreglo del cálculo (sin letra real por pregunta)
              legacy: !!perfil.legacy,
              vectorNatural: calcularVectorNatural100(r.Respuestas, r.Detalle),
              vectorAdaptado: completo ? completo.vectorAdaptado : null,
              estabilidad: completo ? completo.estabilidad : null,
              pdfPath: r.pdf_path || '',
              packStatus: packStatusPorUsuario[r.User] || '',
              raw: r,
            };
          })
          .filter(Boolean);

        if (!cancelado) setPersonas(calculadas);
      } catch (error) {
        console.error('Error al calcular perfiles del equipo:', error);
        if (!cancelado) setErrorCarga('No se pudo calcular el análisis del equipo. Intentá de nuevo.');
      } finally {
        if (!cancelado) setLoading(false);
      }
    }

    cargar();
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Los tests viejos (sin letra real) no entran en promedios, cultura ni
  // compatibilidad: su letra es una aproximación (ver AUDITORIA_DISC_COMRURAL.md).
  const personasReales = useMemo(() => personas.filter((p) => !p.legacy), [personas]);
  const cantidadLegacy = personas.length - personasReales.length;
  const stats = useMemo(() => calcularStatsEquipo(personasReales), [personasReales]);
  const { total, distribucion } = stats;

  /** Genera y descarga el Manual Personalizado (Pack Líder) de una persona —
   * mismo mecanismo cliente que usa AdminDashboard/Userboard, sin tocar Manual.js. */
  async function descargarPackLider(persona) {
    setDescargandoManual(persona.usuario);
    try {
      unloadLegacyScripts(['jspdf']);
      await loadScripts(MANUAL_SCRIPTS);

      const data = persona.raw;
      if (typeof window.descargarManualPersonalizado === 'function') {
        await window.descargarManualPersonalizado(data);
      } else if (typeof window.generarManualPersonalizado === 'function') {
        await window.generarManualPersonalizado(data);
      } else if (window.Manual && typeof window.Manual.descargar === 'function') {
        await window.Manual.descargar(data);
      } else if (window.Manual && typeof window.Manual.generar === 'function') {
        await window.Manual.generar(data);
      } else {
        throw new Error('Manual.js no expone una función compatible');
      }
      showToast(`Manual Personalizado de "${persona.usuario}" descargado`, 'success');
    } catch (error) {
      console.error('Error al generar el manual:', error);
      showToast('No se pudo generar el manual: ' + (error.message || ''), 'error');
    } finally {
      setDescargandoManual(null);
    }
  }

  function logout() {
    Auth.logout();
    navigate(CONFIG.routes.login);
  }

  return (
    <div className="isolate flex min-h-screen min-h-dvh flex-col overflow-x-hidden bg-black font-title text-white">
      <div className="fixed inset-0 -z-20 bg-gradient-to-br from-black via-one-ink to-black" />
      <div className="bg-hex-pattern fixed -inset-[20%] -z-10 -rotate-[8deg] opacity-16 mix-blend-screen" />

      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/60 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-one-cyan/20 to-one-pink/20">
                <UserGroupIcon className="h-6 w-6 text-one-cyan" />
              </div>
              <div>
                <h2 className="bg-gradient-to-r from-one-cyan to-one-pink bg-clip-text font-title text-xl font-bold text-transparent">
                  Panel RRHH
                </h2>
                <p className="text-xs text-one-slate">
                  {session?.nombreEmpresa ? session.nombreEmpresa : 'Distribución de perfiles DISC'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(CONFIG.routes.adminDashboard)}
                className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-2 text-sm font-semibold transition-all hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/10"
              >
                <ArrowLeftIcon className="h-4 w-4" />
                Volver al Panel
              </button>
              <button
                className="flex items-center gap-2 rounded-full border border-red-500/40 bg-red-500/20 px-5 py-2 text-sm font-semibold transition-all hover:-translate-y-0.5 hover:border-red-500/60"
                onClick={logout}
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="w-full mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        {!loading && !errorCarga && personas.length > 0 && (
          <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2 rounded-full border border-white/10 bg-white/5 p-1.5">
              <button
                onClick={() => setTab('equipo')}
                className={`flex-1 rounded-full px-5 py-2 text-sm font-semibold transition-all sm:flex-none ${
                  tab === 'equipo' ? 'bg-gradient-to-r from-one-cyan/30 to-one-pink/30 text-white' : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                Análisis de Equipo
              </button>
              <button
                onClick={() => setTab('informes')}
                className={`flex-1 rounded-full px-5 py-2 text-sm font-semibold transition-all sm:flex-none ${
                  tab === 'informes' ? 'bg-gradient-to-r from-one-cyan/30 to-one-pink/30 text-white' : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                Informes
              </button>
              <button
                onClick={() => setTab('comparar')}
                className={`flex-1 rounded-full px-5 py-2 text-sm font-semibold transition-all sm:flex-none ${
                  tab === 'comparar' ? 'bg-gradient-to-r from-one-cyan/30 to-one-pink/30 text-white' : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                Persona vs Persona
              </button>
              <button
                onClick={() => setTab('cultura')}
                className={`flex-1 rounded-full px-5 py-2 text-sm font-semibold transition-all sm:flex-none ${
                  tab === 'cultura' ? 'bg-gradient-to-r from-one-cyan/30 to-one-pink/30 text-white' : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                Cultura Organizacional
              </button>
              <button
                onClick={() => setTab('compatibilidad')}
                className={`flex-1 rounded-full px-5 py-2 text-sm font-semibold transition-all sm:flex-none ${
                  tab === 'compatibilidad' ? 'bg-gradient-to-r from-one-cyan/30 to-one-pink/30 text-white' : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                Compatibilidad
              </button>
            </div>

            <button
              onClick={() => setInfoAbierto(true)}
              className="flex items-center gap-1.5 rounded-full border border-one-cyan/30 bg-one-cyan/10 px-4 py-2 text-sm font-semibold text-one-cyan transition-all hover:border-one-cyan/50 hover:bg-one-cyan/20"
            >
              <InformationCircleIcon className="h-4 w-4" />
              ¡Info!
            </button>
          </div>
        )}

        {loading ? (
          <LoadingOverlay msg="Calculando perfiles del equipo..." sub="Leyendo tests completados..." />
        ) : errorCarga ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-300">
            {errorCarga}
          </div>
        ) : personas.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center text-gray-400">
            Todavía no hay tests completados en tu equipo para analizar.
          </div>
        ) : tab === 'comparar' ? (
          <ComparacionPersonas personas={personas} />
        ) : tab === 'informes' ? (
          <InformesTab personas={personas} descargandoManual={descargandoManual} onDescargarPackLider={descargarPackLider} />
        ) : tab === 'cultura' ? (
          <CulturaTab personas={personasReales} />
        ) : tab === 'compatibilidad' ? (
          <CompatibilidadTab personas={personasReales} />
        ) : total === 0 ? (
          <div className="rounded-2xl border border-one-gold/30 bg-one-gold/5 p-10 text-center text-gray-300">
            Los {cantidadLegacy} test(s) de tu equipo fueron tomados con la versión anterior del algoritmo y no entran en el análisis de equipo. Los tests nuevos van a aparecer acá automáticamente.
          </div>
        ) : (
          <>
            {cantidadLegacy > 0 && (
              <div className="mb-6 rounded-xl border border-one-gold/30 bg-one-gold/5 px-4 py-3 text-xs text-one-gold">
                {cantidadLegacy} test(s) tomados con la versión anterior del algoritmo no entran en estos números (ver "Informes").
              </div>
            )}
            {/* Mini resumen (KPIs) */}
            <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-6">
              <StatCard value={stats.total} label="Evaluados" colorClass="text-blue-400" borderClass="border-blue-500/20" />
              <StatCard value={`${stats.estilosPresentes}/4`} label="Estilos presentes" colorClass="text-purple-400" borderClass="border-purple-500/20" />
              <StatCard
                value={`${stats.letraDominante} · ${DISC_INFO[stats.letraDominante]?.nombre}`}
                label="Estilo dominante"
                colorClass="text-one-gold"
                borderClass="border-one-gold/20"
              />
              <StatCard value={stats.ritmoDominante} label="Ritmo dominante" colorClass="text-one-pink" borderClass="border-one-pink/20" />
              <StatCard value={stats.prioridadDominante} label="Prioridad dominante" colorClass="text-green-400" borderClass="border-green-500/20" />
              <StatCard value={`${stats.diversidad}/100`} label="Índice diversidad" colorClass="text-one-cyan" borderClass="border-one-cyan/20" />
            </div>

            {/* Gráfico principal + doughnuts de ejes */}
            <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <ChartEquipoPrincipal distribucion={distribucion} />
              </div>
              <div className="space-y-6">
                <DoughnutEje
                  titulo="Ritmo del Equipo"
                  conteos={stats.ritmo}
                  colores={{ Rápido: '#e17bd7', Pausado: '#6be1e3' }}
                />
              </div>
            </div>

            <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
              <DoughnutEje
                titulo="Prioridad del Equipo"
                conteos={stats.prioridad}
                colores={{ Tareas: '#e4c76a', Personas: '#4ecb71' }}
              />
              <div className="rounded-2xl border border-one-cyan/20 bg-one-cyan/5 p-6 text-sm leading-relaxed text-gray-300">
                <h4 className="mb-2 font-title text-base font-bold text-white">Cómo leer estos gráficos</h4>
                <p className="mb-2">
                  <strong className="text-gray-200">Ritmo</strong>: cuántas personas del equipo tienden a moverse
                  rápido (D/I) vs. de forma más pausada (S/C).
                </p>
                <p>
                  <strong className="text-gray-200">Prioridad</strong>: cuántas priorizan tareas y resultados (D/C)
                  vs. personas y vínculos (I/S). Los detalles de cada persona (perfil Natural y Adaptado, con
                  descarga del informe) están en la pestaña "Informes".
                </p>
              </div>
            </div>
          </>
        )}
      </main>

      {ToastContainer}
      {infoAbierto && <InfoModal tabInfo={INFO_TEXTS[tab]} onClose={() => setInfoAbierto(false)} />}
      <Footer />
    </div>
  );
}
