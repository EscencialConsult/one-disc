import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircleIcon, ClockIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { CONFIG } from '../lib/config.js';
import { getAdminByUsuario, getUsuarioCountActivosByAdmin, createUsuario } from '../lib/api.js';

/**
 * Link de Registro Rápido — página pública (sin login), una por empresa,
 * fija en /registro/:usuarioAdmin. La empresa la comparte con la gente que
 * tiene que darse de alta como Usuario, en vez de cargarlos uno por uno
 * desde el panel de Admin.
 *
 * Cada alta consume 1 crédito de la cuenta del Admin. Si no quedan créditos
 * en el momento del registro, NO se rechaza a la persona: el usuario queda
 * creado con estado "pendiente" (a la espera) y el Admin lo habilita después
 * desde su panel — apenas sume más créditos — sin que la persona tenga que
 * volver a registrarse.
 */

const inputClass =
  'w-full rounded-[10px] border border-white/10 bg-black/40 p-3 text-base text-white transition duration-300 placeholder:text-gray-500 focus:border-one-cyan/50 focus:shadow-[0_0_0_3px_rgba(107,225,227,0.14)] focus:outline-none';

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function RegistroRapido() {
  const { usuarioAdmin } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [admin, setAdmin] = useState(null); // null = todavía cargando o no existe
  const [notFound, setNotFound] = useState(false);
  const [consumidos, setConsumidos] = useState(0);
  const [form, setForm] = useState({ usuario: '', password: '', email: '', nombre: '' });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [resultado, setResultado] = useState(null); // null | { tipo: 'activo'|'pendiente', usuario }

  useEffect(() => {
    let cancelado = false;
    async function cargar() {
      setLoading(true);
      try {
        const row = await getAdminByUsuario(usuarioAdmin);
        if (!row) {
          if (!cancelado) setNotFound(true);
          return;
        }
        const count = await getUsuarioCountActivosByAdmin(row.id);
        if (!cancelado) {
          setAdmin(row);
          setConsumidos(count);
        }
      } catch (error) {
        console.error('Error cargando el link de registro:', error);
        if (!cancelado) setNotFound(true);
      } finally {
        if (!cancelado) setLoading(false);
      }
    }
    cargar();
    return () => {
      cancelado = true;
    };
  }, [usuarioAdmin]);

  const limiteUsuarios =
    admin && admin.limite_usuarios !== null && admin.limite_usuarios !== undefined
      ? Number(admin.limite_usuarios)
      : null;
  const sinCupo = limiteUsuarios !== null && consumidos >= limiteUsuarios;

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg('');

    const usuario = form.usuario.trim();
    const password = form.password;
    const email = form.email.trim();
    const nombre = form.nombre.trim();

    if (!usuario || !password || !email || !nombre) {
      setErrorMsg('Completá todos los campos');
      return;
    }
    if (!validateEmail(email)) {
      setErrorMsg('Email inválido');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setSubmitting(true);
    try {
      // Recontamos justo antes de decidir, para minimizar la ventana de carrera
      // con otras personas registrándose al mismo tiempo.
      const cupoActual = await getUsuarioCountActivosByAdmin(admin.id);
      const hayLugar = limiteUsuarios === null || cupoActual < limiteUsuarios;
      const estadoNuevo = hayLugar ? 'activo' : 'pendiente';

      await createUsuario({
        adminId: admin.id,
        usuario,
        password,
        email,
        nombre,
        estado: estadoNuevo,
      });

      setResultado({ tipo: estadoNuevo, usuario });
    } catch (error) {
      console.error('Error al registrar:', error);
      if (String(error.code) === '23505') {
        setErrorMsg(`El usuario "${usuario}" ya existe — elegí otro.`);
      } else {
        setErrorMsg('No se pudo completar el registro: ' + (error.message || 'error desconocido'));
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="isolate flex min-h-screen min-h-dvh flex-col overflow-x-hidden bg-black font-title text-white">
      <div className="fixed inset-0 -z-20 bg-gradient-to-br from-black via-one-ink to-black" />
      <div className="bg-hex-pattern fixed -inset-[20%] -z-10 -rotate-[8deg] opacity-16 mix-blend-screen" />

      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center gap-4 px-4 py-4 sm:px-6">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-one-cyan/20 to-one-pink/20">
            {admin?.logo_empresa_link ? (
              <img
                src={admin.logo_empresa_link}
                alt=""
                className="h-full w-full object-contain"
                onError={(e) => (e.target.style.display = 'none')}
              />
            ) : (
              <img src="/img/one-logocolor.png" alt="ONE" className="h-full w-full object-contain" />
            )}
          </div>
          <div>
            <h1 className="m-0 font-title text-lg font-bold leading-tight text-white sm:text-xl">
              {admin?.name_empresa || 'Registro Rápido'}
            </h1>
            <p className="m-0 text-xs text-gray-400 sm:text-sm">Registro de nuevo usuario — Evaluación DISC</p>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-10 sm:px-6 lg:py-16">
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/10 p-6 backdrop-blur-xl sm:p-10">
          {loading ? (
            <p className="text-center text-gray-400">Cargando...</p>
          ) : notFound ? (
            <div className="text-center">
              <ExclamationTriangleIcon className="mx-auto mb-4 h-12 w-12 text-yellow-400" />
              <h2 className="mb-2 font-title text-xl font-bold text-white">Link inválido</h2>
              <p className="text-sm text-gray-400">
                Este link de registro no existe o ya no está disponible. Consultá con quien te lo compartió.
              </p>
            </div>
          ) : admin.estado === 'inactivo' ? (
            <div className="text-center">
              <ExclamationTriangleIcon className="mx-auto mb-4 h-12 w-12 text-yellow-400" />
              <h2 className="mb-2 font-title text-xl font-bold text-white">Registro no disponible</h2>
              <p className="text-sm text-gray-400">
                Este registro no está disponible en este momento. Consultá con {admin.name_empresa || 'la empresa'}.
              </p>
            </div>
          ) : resultado?.tipo === 'activo' ? (
            <div className="text-center">
              <CheckCircleIcon className="mx-auto mb-4 h-12 w-12 text-green-400" />
              <h2 className="mb-2 font-title text-xl font-bold text-white">¡Listo, {resultado.usuario}!</h2>
              <p className="mb-6 text-sm text-gray-400">
                Tu cuenta ya está activa. Podés iniciar sesión con el usuario y la contraseña que elegiste.
              </p>
              <button
                onClick={() => navigate(CONFIG.routes.login)}
                className="w-full cursor-pointer rounded-full border border-one-cyan/40 bg-gradient-to-r from-one-cyan/20 to-one-pink/20 px-7 py-3.5 text-base font-semibold text-white transition-all hover:-translate-y-0.5 hover:border-one-cyan/60"
              >
                Ir a Iniciar Sesión
              </button>
            </div>
          ) : resultado?.tipo === 'pendiente' ? (
            <div className="text-center">
              <ClockIcon className="mx-auto mb-4 h-12 w-12 text-one-gold" />
              <h2 className="mb-2 font-title text-xl font-bold text-white">Ya recibimos tu solicitud</h2>
              <p className="text-sm text-gray-400">
                <strong className="text-gray-200">{admin.name_empresa || 'La empresa'}</strong> se quedó sin
                créditos disponibles por el momento. No te preocupes: tu registro ya quedó guardado y en cuanto
                sumen más créditos vas a quedar habilitado para ingresar — no hace falta que vuelvas a registrarte.
              </p>
            </div>
          ) : (
            <>
              <h2 className="mb-1 font-title text-xl font-bold text-white">Creá tu cuenta</h2>
              <p className="mb-6 text-sm text-gray-400">
                Completá tus datos para acceder a la Evaluación DISC de {admin.name_empresa}.
              </p>

              {sinCupo && (
                <div className="mb-5 flex items-start gap-2 rounded-xl border border-one-gold/30 bg-one-gold/10 p-3 text-xs text-one-gold">
                  <ClockIcon className="mt-0.5 h-4 w-4 shrink-0" />
                  Por el momento no hay cupo disponible — igual podés registrarte: tu solicitud queda guardada y
                  te habilitan apenas sumen más créditos.
                </div>
              )}

              {errorMsg && (
                <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-5">
                  <label className="mb-2 block text-sm font-semibold text-gray-300">Usuario</label>
                  <input
                    type="text"
                    className={inputClass}
                    placeholder="Elegí un nombre de usuario"
                    value={form.usuario}
                    onChange={(e) => setForm({ ...form, usuario: e.target.value })}
                  />
                </div>
                <div className="mb-5">
                  <label className="mb-2 block text-sm font-semibold text-gray-300">Contraseña</label>
                  <input
                    type="password"
                    className={inputClass}
                    placeholder="Al menos 6 caracteres"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                  />
                </div>
                <div className="mb-5">
                  <label className="mb-2 block text-sm font-semibold text-gray-300">Email</label>
                  <input
                    type="email"
                    className={inputClass}
                    placeholder="tu@email.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                <div className="mb-6">
                  <label className="mb-2 block text-sm font-semibold text-gray-300">Nombre completo</label>
                  <input
                    type="text"
                    className={inputClass}
                    placeholder="Juan Pérez"
                    value={form.nombre}
                    onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full cursor-pointer rounded-full border border-one-cyan/40 bg-gradient-to-r from-one-cyan/20 to-one-pink/20 px-7 py-3.5 text-base font-semibold text-white transition-all hover:-translate-y-0.5 hover:border-one-cyan/60 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {submitting ? 'Registrando...' : 'Registrarme'}
                </button>
              </form>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
