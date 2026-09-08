import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { CONFIG } from '../lib/config.js';
import { guardarRespuesta, guardarPdf } from '../lib/api.js';
import { loadScripts, unloadLegacyScripts } from '../lib/loadScript.js';

/**
 * Test DISC — réplica de Test/index.html (versión AppScript).
 * Las preguntas, el mapeo de dimensiones, el armado del string de respuestas
 * y la generación del PDF (pdfGenerator.js) son idénticos al original.
 * Solo cambia el guardado: Google Sheets/Drive → Supabase (tabla + Storage).
 */

// Scripts legacy (mismas versiones que el <script> del original)
const TEST_SCRIPTS = [
  'https://cdn.jsdelivr.net/npm/d3@7/dist/d3.min.js',
  '/legacy/discCore.js',
  '/legacy/discTextos.js',
  '/legacy/discToWheel.js',
  '/legacy/ruedaSuccessInsights5niveles.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/3.0.3/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/5.0.2/jspdf.plugin.autotable.min.js',
  '/legacy/pdfGenerator.js',
];

// ── Datos del test (idénticos al original) ──────────────────────
const DISC_QUESTIONS = [
  { id: 1, D: 'Enérgico', I: 'Animado', S: 'Plácido', C: 'Preciso' },
  { id: 2, D: 'Competitivo', I: 'Expresivo', S: 'Leal', C: 'Diplomático' },
  { id: 3, D: 'Directo', I: 'Alentador', S: 'Bondadoso', C: 'Meticuloso' },
  { id: 4, D: 'Atrevido', I: 'Encantador', S: 'Amable', C: 'Sistemático' },
  { id: 5, D: 'Decidido', I: 'Optimista', S: 'Sereno', C: 'Perfeccionista' },
  { id: 6, D: 'Audaz', I: 'Comunicativo', S: 'Paciente', C: 'Reflexivo' },
  { id: 7, D: 'Exigente', I: 'Entusiasta', S: 'Cooperativo', C: 'Lógico' },
  { id: 8, D: 'Dominante', I: 'Popular', S: 'Tolerante', C: 'Analítico' },
  { id: 9, D: 'Arriesgado', I: 'Sociable', S: 'Confiable', C: 'Detallista' },
  { id: 10, D: 'Firme', I: 'Persuasivo', S: 'Moderado', C: 'Cauteloso' },
  { id: 11, D: 'Orientado a resultados', I: 'Entusiasta', S: 'Colaborador', C: 'Ordenado' },
  { id: 12, D: 'Emprendedor', I: 'Inspirador', S: 'Estable', C: 'Cuidadoso' },
  { id: 13, D: 'Desafiante', I: 'Influyente', S: 'Servicial', C: 'Organizado' },
  { id: 14, D: 'Impaciente', I: 'Extrovertido', S: 'De apoyo', C: 'Metódico' },
  { id: 15, D: 'Independiente', I: 'Amigable', S: 'Moderado', C: 'Convencional' },
  { id: 16, D: 'Asertivo', I: 'Estimulante', S: 'Comprensivo', C: 'Reservado' },
  { id: 17, D: 'Determinado', I: 'Positivo', S: 'Paciente', C: 'Controlado' },
  { id: 18, D: 'Agresivo', I: 'Afectuoso', S: 'Receptivo', C: 'Perfeccionista' },
  { id: 19, D: 'Toma rápida de decisiones', I: 'Sociable', S: 'Considerado', C: 'Meticuloso' },
  { id: 20, D: 'Líder nato', I: 'Promotor', S: 'Consistente', C: 'Formal' },
  { id: 21, D: 'Pragmático', I: 'Emocional', S: 'Conciliador', C: 'Normativo' },
  { id: 22, D: 'Obstinado', I: 'Confiado', S: 'Tolerante', C: 'Evasivo' },
  { id: 23, D: 'Inflexible', I: 'Egocéntrico', S: 'Indeciso', C: 'Terco' },
  { id: 24, D: 'Argumentador', I: 'Descuidado', S: 'Dubitativo', C: 'Quisquilloso' },
  { id: 25, D: 'Impulsivo', I: 'Imprudente', S: 'Tímido', C: 'Crítico' },
  { id: 26, D: 'Intolerante', I: 'Poco organizado', S: 'Pasivo', C: 'Pesimista' },
  { id: 27, D: 'Insensible', I: 'Hablador', S: 'Sin ambición', C: 'Distante' },
  { id: 28, D: 'Dominante', I: 'Desordenado', S: 'Dependiente', C: 'Desconfiado' },
];

const DIMS = ['D', 'I', 'S', 'C'];
const DIM_MAP = { D: 5, I: 5, S: 1, C: 1 };
const PART1_END = 14;
const TOTAL = DISC_QUESTIONS.length;

function fmtTime(a, b) {
  if (!a || !b) return '0m 0s';
  const t = Math.floor((b - a) / 1000);
  return `${Math.floor(t / 60)}m ${t % 60}s`;
}

export default function TestDisc() {
  const navigate = useNavigate();
  const [section, setSection] = useState('login'); // login | inst | test | intermission | final
  const [user, setUser] = useState({ name: '', lastname: '', email: '' });
  const [form, setForm] = useState({ name: '', lastname: '', email: '' });
  const [answers, setAnswers] = useState(() =>
    Array.from({ length: TOTAL }, () => ({ mas: null, menos: null }))
  );
  const [currentIdx, setCurrentIdx] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showTimer, setShowTimer] = useState(false);
  const [saveState, setSaveState] = useState({ status: 'saving', message: 'Guardando resultados...' });

  const timerRef = useRef(null);
  const timeStartRef = useRef(0);
  const timePart1EndRef = useRef(0);
  const ruedaExportRef = useRef(null);
  const scriptsReady = useRef(false);

  // Carga de scripts legacy (jsPDF 3.0.3 — descarga la 2.5.1 si venía del Userboard)
  useEffect(() => {
    unloadLegacyScripts(['jspdf']);
    loadScripts(TEST_SCRIPTS)
      .then(() => {
        scriptsReady.current = true;
      })
      .catch((e) => console.error('Error cargando scripts del test:', e));
  }, []);

  useEffect(() => () => clearInterval(timerRef.current), []);

  function showSection(id) {
    setSection(id);
    window.scrollTo(0, 0);
  }

  function startTimer() {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
  }

  function goToInstructions() {
    const n = form.name.trim(),
      l = form.lastname.trim(),
      e = form.email.trim();
    if (!n || !l || !e) return alert('Complete todos los campos');
    setUser({ name: n, lastname: l, email: e });
    showSection('inst');
  }

  function startTest() {
    setCurrentIdx(0);
    timeStartRef.current = Date.now();
    setShowTimer(true);
    setElapsedSeconds(0);
    startTimer();
    showSection('test');
  }

  function pick(dim, type) {
    setAnswers((prev) => {
      const next = prev.map((a, i) =>
        i === currentIdx ? { ...a, [type]: a[type] === dim ? null : dim } : a
      );
      return next;
    });
  }

  function previousQuestion() {
    if (currentIdx > 0) setCurrentIdx(currentIdx - 1);
  }

  function nextQuestion() {
    const a = answers[currentIdx];
    if (!a.mas || !a.menos || a.mas === a.menos) return;
    if (currentIdx === PART1_END - 1) {
      clearInterval(timerRef.current);
      timePart1EndRef.current = Date.now();
      showSection('intermission');
      return;
    }
    if (currentIdx === TOTAL - 1) {
      finishTest();
      return;
    }
    setCurrentIdx(currentIdx + 1);
  }

  function continueToPartII() {
    setCurrentIdx(PART1_END);
    showSection('test');
    setElapsedSeconds(0);
    startTimer();
  }

  function finishTest() {
    clearInterval(timerRef.current);
    setShowTimer(false);
    showSection('final');
    sendResults();
  }

  // ── Armado del string de respuestas (idéntico al original) ─────
  function buildRespuestas(finalAnswers) {
    const t1 = fmtTime(timeStartRef.current, timePart1EndRef.current);
    const t2 = fmtTime(timePart1EndRef.current, Date.now());
    let idx = 1;
    const p1 = [],
      p2 = [];
    for (let i = 0; i < TOTAL; i++) {
      const a = finalAnswers[i],
        mv = a.mas ? DIM_MAP[a.mas] : 0,
        lv = a.menos ? DIM_MAP[a.menos] : 0;
      if (i < PART1_END) {
        p1.push(`${idx};${mv}`);
        idx++;
        p1.push(`${idx};${lv}`);
        idx++;
      } else {
        p2.push(`${idx};${mv}`);
        idx++;
        p2.push(`${idx};${lv}`);
        idx++;
      }
    }
    return `{PI: ${t1} - ${p1.join(', ')}} {PII: ${t2} - ${p2.join(', ')}}`;
  }

  /**
   * Letra REAL (D/I/S/C) elegida como MÁS y como MENOS en cada pregunta.
   * El string de `buildRespuestas` la pierde (D e I → 5, S y C → 1); este
   * dato es el que permite calcular D/I/S/C de verdad (ver discCore.js).
   */
  function buildDetalle(finalAnswers) {
    const detalle = {};
    for (let i = 0; i < TOTAL; i++) {
      const a = finalAnswers[i];
      detalle[i + 1] = { mas: a.mas || null, menos: a.menos || null };
    }
    return detalle;
  }

  function buildRespuestasParsed(finalAnswers) {
    const p = {};
    let idx = 1;
    for (let i = 0; i < TOTAL; i++) {
      const a = finalAnswers[i];
      p[idx] = a.mas ? DIM_MAP[a.mas] : 0;
      idx++;
      p[idx] = a.menos ? DIM_MAP[a.menos] : 0;
      idx++;
    }
    return p;
  }

  // ── Guardado: Supabase reemplaza al Google Apps Script ─────────
  async function sendResults() {
    const finalAnswers = answers;
    const respuestasFinal = buildRespuestas(finalAnswers);
    const detalleFinal = buildDetalle(finalAnswers);
    const now = new Date();

    const usuarioAdmin = sessionStorage.getItem('usuarioAdmin') || '';
    const emailAdmin = sessionStorage.getItem('emailAdmin') || '';
    const userNameAdmin = sessionStorage.getItem('userName') || '';
    const adminId = sessionStorage.getItem('adminId') || null;

    // ── PASO 1: Guardar fila ──────────────────────────────────
    setSaveState({ status: 'saving', message: 'Guardando resultados...' });
    let row = null,
      discId = null;
    try {
      const res1 = await guardarRespuesta({
        adminId,
        usuarioAdmin,
        emailAdmin,
        usuarioUser: userNameAdmin,
        nombre: user.name || 'SinNombre',
        apellido: user.lastname || 'SinApellido',
        emailUser: user.email || 'SinEmail',
        respuestas: respuestasFinal,
        detalle: detalleFinal,
      });
      row = res1.row;
      discId = res1.disc_id;
      console.log('Paso 1 OK', { row, discId });
    } catch (e) {
      console.error('Paso 1 error:', e);
      setSaveState({ status: 'error', message: 'Error guardando resultados.' });
      return;
    }

    // ── PASO 2: Generar PDF, descargar y subir ────────────────
    let pdfEnviado = false;
    try {
      setSaveState({ status: 'saving', message: 'Generando informe PDF...' });

      let intentos = 0;
      while (!window.generarPDFBase64 && intentos < 60) {
        await new Promise((r) => setTimeout(r, 100));
        intentos++;
      }
      if (!window.generarPDFBase64) throw new Error('generarPDFBase64 no disponible');

      const respuestasParsed = buildRespuestasParsed(finalAnswers);
      const dataPdf = {
        Nombre: user.name || 'SinNombre',
        Apellido: user.lastname || 'SinApellido',
        Correo: user.email || '',
        Fecha: now.toISOString(),
        Detalle: detalleFinal, // letra real por pregunta → cálculo nuevo (discCore.js)
      };

      // Usa la función expuesta por pdfGenerator.js — una sola fuente de verdad
      const resultado = window.calcularResultadoParaPDF(respuestasParsed, detalleFinal);
      resultado.tiempoParte1 = fmtTime(timeStartRef.current, timePart1EndRef.current);
      resultado.tiempoParte2 = fmtTime(timePart1EndRef.current, Date.now());

      // Renderizar rueda offscreen (igual que el original)
      try {
        const ruedaDiv = ruedaExportRef.current;
        if (ruedaDiv && typeof window.renderRuedaSI5 === 'function') {
          ruedaDiv.innerHTML = '<svg id="ruedaSVG" width="900" height="900"></svg>';
          const svgEl = document.getElementById('ruedaSVG');

          let celdaNatural = null,
            celdaAdaptada = null;
          if (typeof window.discToWheel === 'function') {
            try {
              const coords = window.discToWheel(respuestasParsed, detalleFinal);
              celdaNatural = coords?.natural?.cell ?? null;
              celdaAdaptada = coords?.adaptado?.cell ?? null;
              console.log('▶ Rueda celdas:', celdaNatural, celdaAdaptada);
            } catch (we) {
              console.warn('discToWheel error:', we);
            }
          }

          window.renderRuedaSI5(svgEl, { celdaNatural, celdaAdaptada, width: 900, height: 900 });
          await new Promise((r) => setTimeout(r, 500));
          console.log('▶ Rueda renderizada OK');
        }
      } catch (re) {
        console.warn('Rueda offscreen no renderizó:', re);
      }

      console.log('▶ Llamando generarPDFBase64...');
      const pdfBase64 = await window.generarPDFBase64(dataPdf, resultado, respuestasParsed);
      console.log('▶ PDF base64 obtenido:', Math.round(pdfBase64.length / 1024), 'KB');

      // Descarga local
      try {
        const link = document.createElement('a');
        link.href = 'data:application/pdf;base64,' + pdfBase64;
        link.download = `Informe_DISC_${user.name}_${user.lastname}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        console.log('▶ Descarga local disparada');
      } catch (de) {
        console.warn('Descarga local no se pudo activar:', de);
      }

      // Upload a Supabase Storage (reemplaza el upload a Drive)
      setSaveState({ status: 'saving', message: 'Subiendo informe PDF...' });
      await guardarPdf({
        rowId: row,
        discId,
        pdfBase64,
        pdfNombre: `Informe_DISC_${user.name || ''}_${user.lastname || ''}${discId ? '_' + discId : ''}.pdf`,
      });
      pdfEnviado = true;
      console.log('Paso 2 OK');
    } catch (e) {
      console.error('Paso 2 (PDF) error:', e);
      pdfEnviado = false;
    }

    // ── PASO 3: UI final ──────────────────────────────────────
    setSaveState({
      status: 'done',
      message: pdfEnviado
        ? '¡Resultados DISC e informe PDF guardados correctamente!'
        : '¡Resultados DISC guardados correctamente! (PDF no enviado)',
    });
  }

  function volverAlPanel() {
    navigate(CONFIG.routes.userboard);
  }

  // ── Render ──────────────────────────────────────────────────
  const q = DISC_QUESTIONS[currentIdx];
  const a = answers[currentIdx];
  const okNext = a.mas && a.menos && a.mas !== a.menos;
  const pct = Math.round(((currentIdx + 1) / TOTAL) * 100);
  const part = currentIdx < PART1_END ? 'I' : 'II';
  const nextLabel =
    currentIdx === TOTAL - 1 ? 'Finalizar →' : currentIdx === PART1_END - 1 ? 'Completar Parte I →' : 'Siguiente →';
  const mm = String(Math.floor(elapsedSeconds / 60)).padStart(2, '0');
  const ss = String(elapsedSeconds % 60).padStart(2, '0');

  const inputClass =
    'w-full rounded-[10px] border border-white/10 bg-black/40 p-3 text-base text-white transition duration-300 placeholder:text-gray-500 focus:border-one-cyan/50 focus:shadow-[0_0_0_3px_rgba(107,225,227,0.14)] focus:outline-none';
  const btnClass =
    'w-full cursor-pointer rounded-[10px] border border-one-cyan/40 bg-gradient-to-r from-one-cyan/20 to-one-pink/20 px-7 py-3.5 text-base font-semibold text-white transition-all hover:-translate-y-0.5 hover:border-one-cyan/60 hover:shadow-[0_10px_30px_rgba(107,225,227,0.25)] disabled:cursor-not-allowed disabled:opacity-40 disabled:transform-none';

  function traitBtnClass(dim, type) {
    const sel = a[type] === dim;
    const other = type === 'mas' ? 'menos' : 'mas';
    const disabled = a[other] === dim && !sel;
    let cls =
      'cursor-pointer rounded-xl border border-white/10 bg-white/5 px-5 py-4 text-center text-[15px] font-medium text-gray-300 transition-all duration-200 hover:-translate-y-0.5 hover:border-one-cyan/40 hover:bg-white/10 max-[600px]:px-[18px] max-[600px]:py-3.5 max-[600px]:text-sm';
    if (sel && type === 'mas')
      cls =
        'cursor-pointer rounded-xl border border-emerald-500/50 bg-emerald-500/20 px-5 py-4 text-center text-[15px] font-semibold text-emerald-300 shadow-[0_4px_20px_rgba(16,185,129,0.15)] transition-all duration-200 max-[600px]:px-[18px] max-[600px]:py-3.5 max-[600px]:text-sm';
    if (sel && type === 'menos')
      cls =
        'cursor-pointer rounded-xl border border-red-500/50 bg-red-500/20 px-5 py-4 text-center text-[15px] font-semibold text-red-300 shadow-[0_4px_20px_rgba(239,68,68,0.15)] transition-all duration-200 max-[600px]:px-[18px] max-[600px]:py-3.5 max-[600px]:text-sm';
    if (disabled) cls += ' pointer-events-none opacity-30';
    return cls;
  }

  return (
    <div className="isolate min-h-screen min-h-dvh overflow-x-hidden bg-black font-['Segoe_UI',sans-serif] text-white">
      {/* Background Effects */}
      <div className="fixed inset-0 -z-20 bg-gradient-to-br from-black via-one-ink to-black" />
      <div className="bg-hex-pattern fixed -inset-[20%] -z-10 -rotate-[8deg] opacity-16 mix-blend-screen" />

      {/* Header — mismo patrón que el resto de la plataforma (Admin/Userboard) */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <img src="/img/one-logocolor.png" alt="ONE" className="h-10 w-auto sm:h-12" />
            <div>
              <h1 className="m-0 font-title text-lg font-bold leading-tight text-white sm:text-2xl">
                DISC - Test de Perfil Profesional
              </h1>
              <p className="m-0 text-xs text-gray-400 sm:text-sm">Evaluación de comportamiento ONE</p>
            </div>
          </div>
          {showTimer && (
            <div className="shrink-0 rounded-xl border border-one-cyan/30 bg-one-cyan/10 px-4 py-2 text-base font-bold text-one-cyan shadow-[0_4px_20px_rgba(107,225,227,0.15)] sm:text-lg">
              {mm}:{ss}
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:py-16">
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/10 p-6 backdrop-blur-xl sm:p-10">

        {/* Registro */}
        {section === 'login' && (
          <div className="animate-[fadeIn_0.4s_ease-in-out]">
            <h2 className="mb-5 font-title text-xl font-bold text-white">Registro del Evaluado</h2>
            <div className="mb-5">
              <label className="mb-2 block font-semibold text-gray-300">Nombre</label>
              <input
                type="text"
                className={inputClass}
                placeholder="Ingrese su nombre"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="mb-5">
              <label className="mb-2 block font-semibold text-gray-300">Apellido</label>
              <input
                type="text"
                className={inputClass}
                placeholder="Ingrese su apellido"
                value={form.lastname}
                onChange={(e) => setForm({ ...form, lastname: e.target.value })}
              />
            </div>
            <div className="mb-5">
              <label className="mb-2 block font-semibold text-gray-300">Email</label>
              <input
                type="email"
                className={inputClass}
                placeholder="Ingrese su correo"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <button className={btnClass} onClick={goToInstructions}>
              Continuar
            </button>
          </div>
        )}

        {/* Instrucciones */}
        {section === 'inst' && (
          <div className="animate-[fadeIn_0.4s_ease-in-out]">
            <h2 className="mb-5 font-title text-xl font-bold text-white">Instrucciones del Test DISC</h2>
            <div className="mb-[25px] rounded-xl border-l-[5px] border-one-cyan bg-black/25 p-[25px] text-justify text-[15px] leading-[1.7] text-gray-300">
              <p>
                El <strong className="text-white">Test DISC</strong> es una evaluación profesional de
                comportamiento que identifica su estilo de personalidad predominante a través de cuatro
                dimensiones:
              </p>
              <br />
              <div className="mb-5 flex flex-wrap justify-center gap-2.5 rounded-[10px] border border-white/10 bg-black/30 p-[15px]">
                <span className="rounded-md border border-red-500/30 bg-red-500/15 px-3 py-1.5 text-[0.8rem] font-semibold text-red-300">
                  D - Dominancia
                </span>
                <span className="rounded-md border border-amber-500/30 bg-amber-500/15 px-3 py-1.5 text-[0.8rem] font-semibold text-amber-300">
                  I - Influencia
                </span>
                <span className="rounded-md border border-green-500/30 bg-green-500/15 px-3 py-1.5 text-[0.8rem] font-semibold text-green-300">
                  S - Estabilidad
                </span>
                <span className="rounded-md border border-blue-500/30 bg-blue-500/15 px-3 py-1.5 text-[0.8rem] font-semibold text-blue-300">
                  C - Cumplimiento
                </span>
              </div>
              <br />
              <p>
                <strong className="text-white">Dominancia (D):</strong> Orientación hacia resultados, toma de
                decisiones y control del entorno.
              </p>
              <br />
              <p>
                <strong className="text-white">Influencia (I):</strong> Capacidad de comunicación, persuasión y
                entusiasmo social.
              </p>
              <br />
              <p>
                <strong className="text-white">Estabilidad (S):</strong> Paciencia, lealtad, trabajo en equipo y
                preferencia por ambientes predecibles.
              </p>
              <br />
              <p>
                <strong className="text-white">Cumplimiento (C):</strong> Precisión, orientación analítica y
                seguimiento de normas y procedimientos.
              </p>
              <br />
              <p>
                <strong className="text-white">¿Cómo funciona?</strong>
              </p>
              <ul className="ml-5 mt-2.5 list-disc">
                <li className="mb-[5px]">Se presentan 28 grupos de cuatro características cada uno</li>
                <li className="mb-[5px]">
                  En cada grupo, seleccione la que <strong className="text-white">MÁS</strong> lo describe
                </li>
                <li className="mb-[5px]">
                  Luego la que <strong className="text-white">MENOS</strong> lo describe
                </li>
                <li className="mb-[5px]">No puede elegir la misma para ambas</li>
                <li className="mb-[5px]">No hay respuestas correctas ni incorrectas — sea sincero/a</li>
                <li className="mb-[5px]">El test se divide en dos partes de 14 preguntas</li>
                <li className="mb-[5px]">Puede volver a preguntas anteriores</li>
                <li className="mb-[5px]">Tiempo estimado: 8-12 minutos</li>
              </ul>
            </div>
            <button className={btnClass} onClick={startTest}>
              COMENZAR TEST
            </button>
          </div>
        )}

        {/* Test */}
        {section === 'test' && (
          <div className="animate-[fadeIn_0.4s_ease-in-out]">
            <div className="mb-[25px]">
              <div className="h-2.5 overflow-hidden rounded-[5px] bg-white/10">
                <div
                  className="h-full rounded-[5px] bg-gradient-to-r from-one-cyan to-one-pink transition-[width] duration-300"
                  style={{ width: pct + '%' }}
                />
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-[13px] font-medium text-gray-400">
                  Pregunta {currentIdx + 1} de {TOTAL}
                </span>
                <span className="text-[13px] font-bold text-one-cyan">{pct}%</span>
              </div>
            </div>

            <div className="flex flex-1 flex-col justify-between">
              <div className="mb-5 flex flex-col rounded-[15px] border border-white/10 bg-black/25 p-[30px]">
                <div className="mb-2.5 text-sm font-semibold text-gray-400">
                  Pregunta {currentIdx + 1} de {TOTAL}
                </div>
                <div className="mb-6 text-xl font-semibold leading-normal text-white max-[600px]:text-lg">
                  <div
                    className={
                      'mb-[15px] rounded-lg p-2.5 text-sm font-semibold ' +
                      (currentIdx < PART1_END
                        ? 'bg-one-cyan/15 text-one-cyan'
                        : 'bg-emerald-500/15 text-emerald-300')
                    }
                  >
                    Parte {part} — Grupo {q.id}
                  </div>
                  Seleccione la característica que más y menos lo describe:
                </div>

                <div className="mb-5">
                  <div className="mb-3 inline-block rounded-lg border border-emerald-500/30 bg-emerald-500/15 px-4 py-2 text-sm font-bold tracking-[0.3px] text-emerald-300">
                    ▲ Seleccione la que MÁS lo describe
                  </div>
                  <div className="grid grid-cols-2 gap-2.5 max-[600px]:grid-cols-1">
                    {DIMS.map((d) => (
                      <button key={'mas' + d} className={traitBtnClass(d, 'mas')} onClick={() => pick(d, 'mas')}>
                        {q[d]}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-5">
                  <div className="mb-3 inline-block rounded-lg border border-red-500/30 bg-red-500/15 px-4 py-2 text-sm font-bold tracking-[0.3px] text-red-300">
                    ▼ Seleccione la que MENOS lo describe
                  </div>
                  <div className="grid grid-cols-2 gap-2.5 max-[600px]:grid-cols-1">
                    {DIMS.map((d) => (
                      <button key={'menos' + d} className={traitBtnClass(d, 'menos')} onClick={() => pick(d, 'menos')}>
                        {q[d]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-5 flex gap-[15px]">
                <button
                  className="flex-1 cursor-pointer rounded-[10px] border border-white/10 bg-white/5 px-6 py-3.5 text-base font-semibold text-gray-300 transition-all hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                  onClick={previousQuestion}
                  disabled={currentIdx === 0}
                >
                  ← Anterior
                </button>
                <button
                  className="flex-1 cursor-pointer rounded-[10px] border border-one-cyan/40 bg-gradient-to-r from-one-cyan/20 to-one-pink/20 px-6 py-3.5 text-base font-semibold text-white transition-all hover:-translate-y-0.5 hover:border-one-cyan/60 hover:shadow-[0_10px_30px_rgba(107,225,227,0.25)] disabled:transform-none disabled:cursor-not-allowed disabled:opacity-40"
                  onClick={nextQuestion}
                  disabled={!okNext}
                >
                  {nextLabel}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Intermedio */}
        {section === 'intermission' && (
          <div className="animate-[fadeIn_0.4s_ease-in-out] p-10 text-center">
            <h2 className="mb-[15px] font-title text-2xl font-bold text-one-cyan">¡Primera Parte Completada!</h2>
            <CheckCircleIcon className="mx-auto my-5 h-[50px] w-[50px] text-emerald-400" />
            <p className="text-gray-300">
              Ha completado las primeras 14 preguntas de la <strong className="text-white">Parte I</strong>.
            </p>
            <p className="mt-2.5 text-gray-400">
              Ahora continuará con las siguientes 14 preguntas de la <strong className="text-white">Parte II</strong>.
            </p>
            <p className="mt-5 text-sm text-gray-500">
              Tiempo utilizado: <span>{fmtTime(timeStartRef.current, timePart1EndRef.current)}</span>
            </p>
            <button className={btnClass + ' mx-auto mt-[25px] max-w-[300px]'} onClick={continueToPartII}>
              CONTINUAR
            </button>
          </div>
        )}

        {/* Final */}
        {section === 'final' && (
          <div className="animate-[fadeIn_0.4s_ease-in-out] p-10 text-center">
            <h2 className="mb-[15px] font-title text-2xl font-bold text-emerald-400">¡Test DISC Completado!</h2>
            <CheckCircleIcon className="mx-auto my-5 h-[60px] w-[60px] text-emerald-400" />
            <p className="text-gray-300">Ha completado el Test de Perfil Profesional DISC.</p>
            <p className="mt-2.5 text-gray-300">Sus respuestas han sido registradas correctamente.</p>
            <div
              className="mt-5 inline-flex items-center gap-2 font-bold"
              style={{ color: saveState.status === 'error' ? '#f87171' : saveState.status === 'done' ? '#34d399' : '#6be1e3' }}
            >
              {saveState.status === 'saving' && (
                <span className="inline-block h-5 w-5 animate-spin rounded-full border-[3px] border-one-cyan/20 border-t-one-cyan align-middle" />
              )}
              {saveState.status === 'done' && <CheckCircleIcon className="h-5 w-5 shrink-0" />}
              {saveState.status === 'error' && <XCircleIcon className="h-5 w-5 shrink-0" />}
              {saveState.message}
            </div>
            {(saveState.status === 'done' || saveState.status === 'error') && (
              <button
                className="mt-[30px] inline-flex cursor-pointer items-center gap-1.5 rounded-[10px] border border-one-cyan/40 bg-white/5 px-4 py-2 text-sm font-semibold text-one-cyan shadow-[0_6px_14px_rgba(0,0,0,0.25)] transition-all hover:bg-one-cyan/10"
                onClick={volverAlPanel}
              >
                <ArrowLeftIcon className="h-4 w-4" /> Volver al panel
              </button>
            )}
          </div>
        )}
        </div>
      </main>

      {/* Contenedor oculto para renderizar la rueda SOLO para exportación */}
      <div
        ref={ruedaExportRef}
        id="ruedaExport"
        style={{ position: 'fixed', left: '-10000px', top: '-10000px', width: 800, height: 800, overflow: 'hidden' }}
      />
    </div>
  );
}
