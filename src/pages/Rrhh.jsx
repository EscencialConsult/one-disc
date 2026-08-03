import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserGroupIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { CONFIG } from '../lib/config.js';
import { Session } from '../lib/session.js';
import { Auth } from '../lib/auth.js';
import { getRespuestasByAdmin } from '../lib/api.js';
import { loadScript } from '../lib/loadScript.js';
import { calcularPerfilDominante } from '../lib/discScoring.js';
import Footer from '../components/Footer.jsx';
import { LoadingOverlay } from './AdminDashboard.jsx';

/**
 * Panel RRHH — Análisis de Equipos: distribución D/I/S/C del equipo del
 * Admin logueado, calculada a partir de los tests ya completados.
 * No inventa ningún cálculo nuevo: reusa tal cual public/legacy/discToWheel.js
 * (mismo script que ya usa el Informe) vía src/lib/discScoring.js.
 */

const DISC_INFO = {
  D: { nombre: 'Dominante', bg: 'bg-disc-d', text: 'text-disc-d', border: 'border-disc-d/30' },
  I: { nombre: 'Influyente', bg: 'bg-disc-i', text: 'text-disc-i', border: 'border-disc-i/30' },
  S: { nombre: 'Sensato', bg: 'bg-disc-s', text: 'text-disc-s', border: 'border-disc-s/30' },
  C: { nombre: 'Correcto', bg: 'bg-disc-c', text: 'text-disc-c', border: 'border-disc-c/30' },
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

export default function Rrhh() {
  const navigate = useNavigate();
  const session = Session.get();

  const [loading, setLoading] = useState(true);
  const [personas, setPersonas] = useState([]); // [{ nombre, usuario, natural, adaptado }]
  const [errorCarga, setErrorCarga] = useState('');

  useEffect(() => {
    let cancelado = false;

    async function cargar() {
      setLoading(true);
      try {
        await loadScript('/legacy/discToWheel.js');
        const respuestas = await getRespuestasByAdmin(session.adminId);

        const calculadas = respuestas
          .filter((r) => r.Respuestas && String(r.Respuestas).trim() !== '')
          .map((r) => {
            const perfil = calcularPerfilDominante(r.Respuestas);
            if (!perfil) return null;
            return {
              nombre: [r.Nombre, r.Apellido].filter(Boolean).join(' ').trim() || r.User,
              usuario: r.User,
              natural: perfil.natural,
              adaptado: perfil.adaptado,
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

  const total = personas.length;
  const distribucion = { D: 0, I: 0, S: 0, C: 0 };
  personas.forEach((p) => {
    if (distribucion[p.natural] !== undefined) distribucion[p.natural]++;
  });

  function logout() {
    Auth.logout();
    navigate(CONFIG.routes.login);
  }

  return (
    <div className="isolate min-h-screen min-h-dvh overflow-x-hidden bg-black font-title text-white">
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
                  Panel RRHH — Análisis de Equipo
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

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        {loading ? (
          <LoadingOverlay msg="Calculando perfiles del equipo..." sub="Leyendo tests completados..." />
        ) : errorCarga ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-300">
            {errorCarga}
          </div>
        ) : total === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center text-gray-400">
            Todavía no hay tests completados en tu equipo para analizar.
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="mb-8 grid grid-cols-2 gap-6 lg:grid-cols-5">
              <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/10 p-6 backdrop-blur-sm">
                <h3 className="text-3xl font-black text-white">{total}</h3>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  Evaluados con Test
                </p>
              </div>
              {['D', 'I', 'S', 'C'].map((letra) => (
                <div
                  key={letra}
                  className={`relative overflow-hidden rounded-2xl border ${DISC_INFO[letra].border} bg-gradient-to-br from-white/5 to-white/10 p-6 backdrop-blur-sm`}
                >
                  <div className="flex items-center gap-3">
                    <LetraBadge letra={letra} />
                    <div>
                      <h3 className={`text-3xl font-black ${DISC_INFO[letra].text}`}>{distribucion[letra]}</h3>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                        {DISC_INFO[letra].nombre}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Distribución del equipo */}
            <div className="mb-8 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl">
              <div className="border-b border-white/10 bg-gradient-to-r from-one-cyan/10 to-one-pink/10 px-6 py-4">
                <h3 className="font-title text-lg font-bold">Distribución del Equipo (Perfil Natural)</h3>
              </div>
              <div className="space-y-4 p-6">
                {['D', 'I', 'S', 'C'].map((letra) => {
                  const count = distribucion[letra];
                  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                  return (
                    <div key={letra} className="flex items-center gap-4">
                      <div className="flex w-28 shrink-0 items-center gap-2">
                        <LetraBadge letra={letra} />
                        <span className="text-sm font-semibold text-gray-300">{DISC_INFO[letra].nombre}</span>
                      </div>
                      <div className="h-3 flex-1 overflow-hidden rounded-full bg-white/5">
                        <div
                          className={`h-full rounded-full ${DISC_INFO[letra].bg} transition-all duration-500`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-16 shrink-0 text-right text-sm font-bold text-gray-300">
                        {count} ({pct}%)
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tabla individual */}
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl">
              <div className="border-b border-white/10 bg-gradient-to-r from-one-cyan/10 to-one-pink/10 px-6 py-4">
                <h3 className="font-title text-lg font-bold">Perfiles Individuales</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-white/10 text-[11px] font-bold uppercase tracking-widest text-gray-500">
                    <tr>
                      <th className="px-6 py-3">Nombre</th>
                      <th className="px-6 py-3">Usuario</th>
                      <th className="px-6 py-3">Perfil Natural</th>
                      <th className="px-6 py-3">Perfil Adaptado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {personas.map((p) => (
                      <tr key={p.usuario} className="transition-colors hover:bg-white/5">
                        <td className="px-6 py-3 font-semibold text-gray-200">{p.nombre}</td>
                        <td className="px-6 py-3 text-gray-400">{p.usuario}</td>
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-2">
                            <LetraBadge letra={p.natural} />
                            <span className="text-gray-300">{DISC_INFO[p.natural]?.nombre}</span>
                          </div>
                        </td>
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-2">
                            <LetraBadge letra={p.adaptado} />
                            <span className="text-gray-300">{DISC_INFO[p.adaptado]?.nombre}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <p className="mt-6 text-xs text-gray-500">
              <strong className="text-gray-400">Natural</strong>: cómo es la persona en su estado base (Parte I del
              test). <strong className="text-gray-400">Adaptado</strong>: cómo ajusta su comportamiento en su
              contexto actual (Parte II). Una diferencia grande entre ambos puede indicar tensión o desajuste con
              el rol.
            </p>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
