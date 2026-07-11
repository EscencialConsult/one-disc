import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClockIcon, CheckCircleIcon } from '@heroicons/react/24/solid';
import { CONFIG } from '../lib/config.js';
import { Session } from '../lib/session.js';
import { Auth } from '../lib/auth.js';
import { getRespuestaByUser } from '../lib/api.js';
import { loadScripts, unloadLegacyScripts } from '../lib/loadScript.js';
import Footer from '../components/Footer.jsx';

/**
 * Panel de Usuario — réplica de Userboard/ (versión AppScript).
 * Misma UI, misma lógica de estados (pendiente/completado),
 * mismo gating del manual por Pack_Status.
 */

// Scripts legacy del manual (idénticos a los <script> del original)
const MANUAL_SCRIPTS = [
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  '/legacy/ManualTheme.js',
  '/legacy/Manual.js',
];

function getStoredTestData() {
  try {
    const raw = sessionStorage.getItem('discUserData');
    if (!raw) return null;
    const data = JSON.parse(raw);
    return data && typeof data === 'object' ? data : null;
  } catch (error) {
    console.error('Error leyendo discUserData desde sessionStorage:', error);
    return null;
  }
}

function formatDate(fecha) {
  const date = new Date(fecha);
  if (isNaN(date)) return String(fecha);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${date.getFullYear()}`;
}

function ProgressRing({ completed }) {
  const circleRef = useRef(null);
  const [percent, setPercent] = useState(0);

  useEffect(() => {
    const value = completed ? 100 : 0;
    const circumference = 2 * Math.PI * 110;
    const circle = circleRef.current;
    circle.style.strokeDasharray = circumference;
    circle.style.strokeDashoffset = circumference - (value / 100) * circumference;
    setPercent(value);
  }, [completed]);

  return (
    <div className="relative h-64 w-64">
      <svg className="-rotate-90 transform" width="260" height="260">
        <circle cx="130" cy="130" r="110" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="18" />
        <circle
          ref={circleRef}
          cx="130"
          cy="130"
          r="110"
          fill="none"
          stroke="#6be1e3"
          strokeWidth="18"
          strokeLinecap="round"
          style={{ strokeDasharray: 690, strokeDashoffset: 690, transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-3xl font-extrabold">{percent}%</div>
        <div className="text-sm text-gray-500">Progreso</div>
      </div>
    </div>
  );
}

export default function Userboard() {
  const navigate = useNavigate();
  const session = Session.get();
  const [status, setStatus] = useState('loading'); // loading | pending | completed
  const [userResult, setUserResult] = useState(null);
  const [manualState, setManualState] = useState({
    state: 'idle',
    message: 'Preparado para generar el recurso del alumno.',
  });

  const packStatus = String(session?.packStatus || '').trim();
  const hasLiderPack = packStatus === '1' || packStatus === '01';
  const showManual = status === 'completed' && hasLiderPack;

  // Carga de scripts del manual (jsPDF 2.5.1 + Manual.js, sin tocar)
  useEffect(() => {
    unloadLegacyScripts(['jspdf']);
    loadScripts(MANUAL_SCRIPTS).catch((e) => console.error('Error cargando scripts del manual:', e));
  }, []);

  useEffect(() => {
    async function checkTestStatus() {
      const userName = sessionStorage.getItem('userName');
      const storedData = getStoredTestData();
      const localCompleted = sessionStorage.getItem('discTestCompleted') === 'true';

      if (!userName) {
        setStatus('pending');
        return;
      }

      // 1. Datos locales como fuente de verdad (igual que el original)
      if (storedData || localCompleted) {
        setUserResult(storedData || {});
        setStatus('completed');
        return;
      }

      // 2. Consultar backend (Supabase en lugar del GAS de visualización)
      try {
        const result = await getRespuestaByUser(userName, session?.adminId);
        if (result && result.success && result.data) {
          setUserResult(result.data);
          sessionStorage.setItem('discUserData', JSON.stringify(result.data));
          sessionStorage.setItem('discTestCompleted', 'true');
          setStatus('completed');
          return;
        }
        setStatus('pending');
      } catch (error) {
        console.error('Error consultando informes:', error);
        setStatus('pending');
      }
    }
    checkTestStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function logout() {
    Auth.logout();
    navigate(CONFIG.routes.login);
  }

  function startTest() {
    if (getStoredTestData() || sessionStorage.getItem('discTestCompleted') === 'true') {
      alert('Ya completaste tu evaluación DISC.');
      return;
    }
    sessionStorage.setItem('fromUserboard', 'true');
    navigate(CONFIG.routes.test);
  }

  function viewReport() {
    // Página estática fuera del router SPA
    window.location.href = `${CONFIG.routes.informe}?email=${encodeURIComponent(session?.userEmail || '')}`;
  }

  async function downloadStudyManual() {
    try {
      const rawData = sessionStorage.getItem('discUserData');
      if (!rawData) {
        setManualState({ state: 'error', message: 'No hay datos del informe para generar el manual.' });
        return;
      }
      const data = JSON.parse(rawData);
      setManualState({ state: 'loading', message: 'Preparando manual personalizado...' });

      // Mismas funciones expuestas por Manual.js, en el mismo orden de fallback
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
      setManualState({ state: 'success', message: 'Manual descargado correctamente.' });
    } catch (error) {
      console.error('Error al generar el manual:', error);
      setManualState({ state: 'error', message: 'Ocurrió un error al generar el manual.' });
    }
  }

  const completed = status === 'completed';
  const informeTexto =
    userResult?.Informe || userResult?.informe || userResult?.TipoPerfil || userResult?.Perfil || 'Completado';
  const fechaTexto = userResult?.Fecha || userResult?.fecha || 'Sin fecha';

  const manualStatusColor =
    manualState.state === 'loading'
      ? 'text-one-cyan'
      : manualState.state === 'success'
        ? 'text-green-300'
        : manualState.state === 'error'
          ? 'text-rose-300'
          : 'text-gray-400';

  return (
    <div className="isolate relative min-h-screen min-h-dvh overflow-x-hidden bg-gradient-to-b from-black to-gray-950 font-title text-white">
      {/* Background Effects — "absolute" (no "fixed"): el brillo se distribuye
          en toda la altura de la página, no solo en las esquinas de la ventana. */}
      <div className="absolute inset-0 -z-30 bg-[radial-gradient(circle,rgba(107,225,227,0.1),transparent,transparent)] blur-3xl" />
      <div className="bg-hex-pattern absolute inset-0 -z-20 opacity-[0.07] mix-blend-screen" style={{ backgroundSize: '260px 150px' }} />
      <div className="absolute left-0 top-0 -z-20 h-96 w-96 animate-pulse rounded-full bg-one-cyan/20 blur-[150px]" />
      <div
        className="absolute right-0 top-[600px] -z-20 h-[500px] w-[500px] animate-pulse rounded-full bg-one-pink/20 blur-[150px]"
        style={{ animationDelay: '2s' }}
      />
      <div
        className="absolute bottom-0 left-1/3 -z-20 h-80 w-80 animate-pulse rounded-full bg-one-gold/15 blur-[150px]"
        style={{ animationDelay: '4s' }}
      />
      <div
        className="absolute left-1/4 top-[1400px] -z-20 h-96 w-96 animate-pulse rounded-full bg-one-cyan/15 blur-[150px]"
        style={{ animationDelay: '1s' }}
      />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/40 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-3">
              <div
                className="h-12 w-12 bg-contain bg-center bg-no-repeat drop-shadow-[0_0_15px_rgba(107,225,227,0.5)]"
                style={{ backgroundImage: `url('${session?.logoEmpresa || '/img/one-logocolor.png'}')` }}
              />
              <div>
                <div className="text-lg font-extrabold tracking-wider">
                  {session?.nombreEmpresa || 'ONE DISC'}
                </div>
                <div className="text-xs text-gray-400">
                  {session ? `${session.userName} (${session.userEmail})` : 'Cargando usuario...'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-gray-400">
                <span className="h-2 w-2 rounded-full bg-[#50fa7b] shadow-[0_0_10px_#50fa7b]" />
                Sesión activa
              </div>
              <button
                className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold transition-all hover:-translate-y-0.5 hover:bg-white/10"
                onClick={logout}
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-16">
        {/* Hero */}
        <section className="mb-16 grid items-center gap-8 lg:mb-24 lg:grid-cols-2 lg:gap-16">
          <div className="text-center lg:text-left">
            <h1 className="mb-4 text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
              Bienvenido al{' '}
              <span className="bg-gradient-to-r from-one-cyan to-one-cyan/60 bg-clip-text text-transparent">
                Sistema
              </span>{' '}
              de Evaluación{' '}
              <span className="bg-gradient-to-r from-one-pink to-one-pink/60 bg-clip-text text-transparent">
                DISC
              </span>
            </h1>

            <p className="mx-auto mb-6 max-w-xl text-base text-gray-400 sm:text-lg lg:mx-0">
              Evaluación psicolaboral con métricas avanzadas, interpretación profesional y reporte descargable.
            </p>

            <div className="mx-auto mb-8 flex max-w-xl flex-col items-center gap-4 lg:mx-0 lg:items-start">
              <div className="flex w-full flex-col gap-3 sm:flex-row">
                <button
                  className={
                    'group relative flex-1 overflow-hidden rounded-full border border-one-cyan/40 bg-white/5 px-6 py-3 text-sm font-semibold transition-all sm:text-base ' +
                    (completed
                      ? 'cursor-not-allowed opacity-40'
                      : 'hover:-translate-y-1 hover:bg-white/10 hover:shadow-[0_20px_60px_rgba(107,225,227,0.2)]')
                  }
                  disabled={completed}
                  onClick={completed ? () => alert('Ya completaste tu evaluación DISC. Puedes ver tu informe.') : startTest}
                >
                  <div className="absolute inset-0 -z-10 bg-gradient-to-r from-one-cyan/30 to-one-cyan/10 opacity-60 blur-xl" />
                  {completed ? (
                    <span className="inline-flex items-center gap-1.5">
                      <CheckCircleIcon className="h-4 w-4" /> Evaluación completada
                    </span>
                  ) : (
                    'Comenzar evaluación'
                  )}
                </button>
                {completed && (
                  <button
                    className="flex-1 rounded-full border border-one-pink/40 bg-white/5 px-6 py-3 text-sm font-semibold transition-all hover:-translate-y-1 hover:bg-white/10 hover:shadow-[0_20px_60px_rgba(225,123,215,0.2)] sm:text-base"
                    onClick={viewReport}
                  >
                    Ver informe
                  </button>
                )}
              </div>

              {completed && (
                <a
                  href="/download/DISC_Material_de_Estudio_ONE.pdf"
                  download="DISC_Material_de_Estudio_ONE.pdf"
                  className="group flex w-full items-center justify-center gap-3 rounded-full border border-one-gold/30 bg-one-gold/10 px-6 py-4 transition-all hover:-translate-y-1 hover:bg-one-gold/20 hover:shadow-[0_20px_60px_rgba(228,199,106,0.2)]"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-one-gold transition-transform group-hover:rotate-12"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332 0.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332 0.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332 0.477-4.5 1.253"
                    />
                  </svg>
                  <span className="text-xs font-bold uppercase tracking-[0.1em] text-one-gold sm:text-sm">
                    Descargar Manual de Estudio General
                  </span>
                </a>
              )}
            </div>

            {/* Stats */}
            <div className="flex flex-wrap justify-center gap-4 lg:justify-start">
              {[
                ['4', 'Dimensiones'],
                ['100%', 'Online'],
                ['Instantáneo', 'Reporte'],
              ].map(([v, l]) => (
                <div key={l} className="min-w-[120px] rounded-2xl border border-white/10 bg-white/5 px-5 py-3">
                  <div className="text-xl font-bold">{v}</div>
                  <div className="text-xs text-gray-500">{l}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-center lg:justify-end">
            <ProgressRing completed={status === 'completed'} />
          </div>
        </section>

        {/* Status */}
        <section className="mb-16">
          {status === 'pending' && (
            <div className="flex min-h-[60vh] items-center justify-center px-4">
              <div className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-gray-900/95 to-gray-950/[.98] p-8 text-center shadow-[0_60px_160px_rgba(0,0,0,0.9)] sm:p-12">
                <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-br from-one-cyan/10 via-transparent to-one-pink/10 opacity-30" />
                <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-orange-500/10 shadow-[0_0_60px_rgba(255,184,108,0.4)] sm:h-28 sm:w-28">
                  <ClockIcon className="h-12 w-12 text-orange-400 sm:h-14 sm:w-14" />
                </div>
                <h2 className="mb-4 text-2xl font-extrabold sm:text-3xl lg:text-4xl">
                  {session?.userName}, aún no realizaste tu evaluación
                </h2>
                <p className="mx-auto mb-6 max-w-2xl text-base text-gray-400 sm:text-lg">
                  El test DISC toma aproximadamente <strong className="text-white">10 a 15 minutos</strong> y
                  genera un informe profesional personalizado.
                </p>
                <div className="mb-8 inline-block rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-left text-sm sm:text-base">
                  {['Resultados inmediatos', 'Perfil conductual completo', 'Informe descargable'].map((t, i) => (
                    <div key={t} className={`flex items-start gap-2 ${i < 2 ? 'mb-2' : ''}`}>
                      <CheckCircleIcon className="h-5 w-5 shrink-0 text-[#50fa7b]" />
                      <span>{t}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <button
                    className="group relative overflow-hidden rounded-full border border-one-cyan/40 bg-gradient-to-r from-one-cyan/20 to-one-pink/20 px-8 py-4 text-lg font-bold transition-all duration-300 hover:-translate-y-1 hover:border-one-cyan/60 hover:shadow-[0_20px_60px_rgba(107,225,227,0.4)]"
                    onClick={startTest}
                  >
                    <div className="absolute inset-0 -z-10 bg-gradient-to-r from-one-cyan/30 to-one-pink/30 opacity-50 blur-xl transition-opacity group-hover:opacity-80" />
                    Comenzar Evaluación
                  </button>
                </div>
              </div>
            </div>
          )}

          {status === 'completed' && (
            <div className="flex min-h-[60vh] items-center justify-center px-4">
              <div className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-gray-900/95 to-gray-950/[.98] p-8 text-center shadow-[0_60px_160px_rgba(0,0,0,0.9)] sm:p-12">
                <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-br from-[#50fa7b]/10 via-transparent to-one-cyan/10 opacity-30" />
                <div className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-[#50fa7b]/30 bg-[#50fa7b]/10 px-4 py-2 text-sm font-semibold text-[#50fa7b]">
                  <CheckCircleIcon className="h-4 w-4" /> Evaluación completada
                </div>
                <h2 className="mb-4 text-2xl font-extrabold sm:text-3xl lg:text-4xl">Tu informe está listo</h2>
                <p className="mx-auto mb-8 max-w-2xl text-base text-gray-400 sm:text-lg">
                  Has finalizado tu evaluación DISC. Puedes acceder a tu informe profesional completo.
                </p>
                <div className="mx-auto mb-8 grid max-w-lg gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="mb-1 text-xs text-gray-500">Fecha</div>
                    <div className="text-base font-bold">{formatDate(fechaTexto)}</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="mb-1 text-xs text-gray-500">Informe</div>
                    <div className="text-base font-bold">{informeTexto}</div>
                  </div>
                </div>
                <button
                  className="group relative overflow-hidden rounded-full border border-[#50fa7b]/40 bg-gradient-to-r from-[#50fa7b]/20 to-one-cyan/20 px-8 py-4 text-lg font-bold transition-all duration-300 hover:-translate-y-1 hover:border-[#50fa7b]/60 hover:shadow-[0_20px_60px_rgba(80,250,123,0.4)]"
                  onClick={viewReport}
                >
                  <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#50fa7b]/30 to-one-cyan/30 opacity-50 blur-xl transition-opacity group-hover:opacity-80" />
                  Ver Informe Completo
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Manual personalizado (gated por Pack_Status, igual que el original) */}
        {showManual && (
          <section className="mt-10">
            <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.04] shadow-[0_30px_100px_rgba(0,0,0,0.45)] backdrop-blur-xl">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-one-cyan/10 via-transparent to-one-pink/10" />
              <div className="relative z-10 p-6 sm:p-8 lg:p-10">
                <div className="flex flex-col gap-8 xl:flex-row xl:items-center xl:justify-between">
                  <div className="flex-1">
                    <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-one-gold/25 bg-one-gold/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.24em] text-one-gold">
                      Recurso personalizado
                    </div>
                    <h3 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                      Manual de estudio personalizado
                    </h3>
                    <p className="mt-3 max-w-3xl text-sm leading-7 text-gray-300 sm:text-base">
                      Descargá una guía creada a partir del informe DISC del alumno.
                    </p>
                  </div>

                  <div className="shrink-0 xl:w-[360px]">
                    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.035] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.38)] backdrop-blur-[14px]">
                      <div className="inline-flex min-h-[34px] items-center justify-center rounded-full border border-[#50fa7b]/22 bg-[#50fa7b]/10 px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] text-green-300">
                        Disponible con informe cargado
                      </div>
                      <button
                        type="button"
                        disabled={manualState.state === 'loading'}
                        onClick={downloadStudyManual}
                        className="mt-6 min-h-[58px] w-full cursor-pointer rounded-[18px] border-0 bg-gradient-to-br from-one-cyan via-one-pink to-one-gold px-[18px] py-4 text-base font-extrabold text-[#081016] shadow-[0_18px_45px_rgba(107,225,227,0.20)] transition-[transform,opacity] duration-[250ms] hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none"
                      >
                        Descargar manual
                      </button>
                      <div className={`mt-4 min-h-6 text-[0.92rem] leading-normal ${manualStatusColor}`}>
                        {manualState.message}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Modelo DISC */}
        <section>
          <div className="mb-10 mt-16 text-center">
            <h2 className="mb-2 text-3xl font-bold sm:text-4xl">Modelo DISC</h2>
            <p className="text-gray-500">Cuatro dimensiones que definen el comportamiento profesional.</p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ['D', 'text-red-400', 'Dominancia', 'Orientación a resultados, firmeza y liderazgo.'],
              ['I', 'text-orange-400', 'Influencia', 'Persuasión, entusiasmo y comunicación.'],
              ['S', 'text-green-400', 'Estabilidad', 'Paciencia, cooperación y constancia.'],
              ['C', 'text-cyan-400', 'Cumplimiento', 'Precisión, estructura y análisis.'],
            ].map(([letter, color, title, text]) => (
              <div
                key={letter}
                className="rounded-3xl border border-white/10 bg-white/5 p-6 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_25px_70px_rgba(0,0,0,0.65)]"
              >
                <div
                  className={`mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-3xl font-extrabold ${color}`}
                >
                  {letter}
                </div>
                <h3 className="mb-2 text-xl font-bold">{title}</h3>
                <p className="text-sm text-gray-400">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-20 border-t border-white/10 pt-8 pb-8 text-center text-sm text-gray-500">
          Plataforma profesional de evaluación
        </div>
      </main>

      <Footer />
    </div>
  );
}
