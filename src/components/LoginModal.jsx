import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Auth } from '../lib/auth.js';
import { Session } from '../lib/session.js';
import { CONFIG } from '../lib/config.js';

/**
 * Modal de login — réplica del modal de index.html (versión AppScript):
 * mismo flujo (user/admin toggle, fallback a superadmin si falla como admin),
 * mismos textos y colores.
 */
export default function LoginModal({ mode, onClose, onModeChange }) {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [alert, setAlert] = useState(null); // { type: 'error'|'success', message }
  const [loading, setLoading] = useState(false);

  const isAdmin = mode === 'admin';

  // El componente queda siempre montado en Landing (ver comentario ahí);
  // este return temprano solo controla si se VE o no, sin desmontarlo —
  // así usuario/contraseña sobreviven a un cierre por click afuera.
  if (!mode) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!usuario.trim() || !password) {
      setAlert({ type: 'error', message: 'Por favor completa todos los campos' });
      return;
    }

    setLoading(true);
    setAlert(null);
    try {
      const rol = isAdmin ? CONFIG.roles.ADMIN : CONFIG.roles.USER;
      let result = await Auth.login(usuario.trim(), password, rol);

      // Si falló como admin, probamos si es el superadmin local (igual que el original)
      if (!result.success && isAdmin) {
        const superadminResult = await Auth.login(usuario.trim(), password, CONFIG.roles.SUPERADMIN);
        if (superadminResult.success) result = superadminResult;
      }

      if (result.success) {
        setAlert({ type: 'success', message: '¡Inicio de sesión exitoso!' });
        setTimeout(() => navigate(Session.dashboardRoute()), 800);
      } else {
        setAlert({ type: 'error', message: result.message || 'Credenciales inválidas' });
      }
    } catch (error) {
      console.error('Error en login:', error);
      setAlert({ type: 'error', message: 'Error de conexión. Intenta nuevamente.' });
    } finally {
      setLoading(false);
    }
  }

  function toggleMode() {
    setAlert(null);
    onModeChange(isAdmin ? 'user' : 'admin');
  }

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/85 p-5 backdrop-blur-[10px]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-[450px] rounded-[28px] border border-one-mist/25 bg-one-white/8 p-10 shadow-[0_18px_60px_rgba(0,0,0,.55)] backdrop-blur-[20px] max-[560px]:p-8 max-[560px]:px-6 max-[480px]:p-7 max-[480px]:px-5">
        <button
          className="absolute right-5 top-5 cursor-pointer p-[5px] text-2xl leading-none text-one-mist/60 transition-colors hover:text-one-white"
          onClick={onClose}
          aria-label="Cerrar"
        >
          ×
        </button>

        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-one-white/8 shadow-[0_0_0_1px_rgba(198,201,215,.18),0_0_40px_rgba(107,225,227,.18)]">
          <img src="/img/one-iconocolor.png" alt="Logo ONE" className="h-[60%] w-[60%] object-contain" />
        </div>

        <h2 className="mb-2 text-center font-title text-[2rem] font-extrabold max-[560px]:text-[1.75rem]">
          Iniciar Sesión
        </h2>
        <p className="mb-6 text-center text-[0.95rem] text-one-mist/70">Evaluación DISC</p>

        <span
          className={
            'mx-auto mb-6 block w-fit rounded-full px-4 py-1.5 text-xs font-bold transition-all duration-300 border ' +
            (isAdmin
              ? 'border-one-pink/35 bg-one-pink/15 text-one-pink'
              : 'border-one-cyan/35 bg-one-cyan/15 text-one-cyan')
          }
        >
          {isAdmin ? 'Administrador' : 'Usuario'}
        </span>

        {alert && (
          <div
            className={
              'mb-3 rounded-xl px-4 py-3 text-sm border ' +
              (alert.type === 'error'
                ? 'border-red-600/30 bg-red-600/15 text-red-300'
                : 'border-emerald-600/30 bg-emerald-600/15 text-green-300')
            }
          >
            {alert.message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-5">
            <label className="mb-2 block text-sm font-semibold text-one-mist/90" htmlFor="usuario">
              Usuario
            </label>
            <input
              type="text"
              id="usuario"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              className="w-full rounded-xl border border-one-mist/20 bg-one-white/5 px-4 py-3 text-[15px] text-white transition-all placeholder:text-one-mist/40 focus:border-one-cyan/55 focus:bg-one-white/[.075] focus:shadow-[0_0_0_3px_rgba(107,225,227,.14)] focus:outline-none"
              placeholder="Ingresa tu usuario"
              required
            />
          </div>

          <div className="mb-5">
            <label className="mb-2 block text-sm font-semibold text-one-mist/90" htmlFor="password">
              Contraseña
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-one-mist/20 bg-one-white/5 px-4 py-3 text-[15px] text-white transition-all placeholder:text-one-mist/40 focus:border-one-cyan/55 focus:bg-one-white/[.075] focus:shadow-[0_0_0_3px_rgba(107,225,227,.14)] focus:outline-none"
              placeholder="Ingresa tu contraseña"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full cursor-pointer rounded-full border border-one-cyan/35 bg-one-white/6 px-6 py-3.5 text-[15px] font-extrabold text-white shadow-[0_10px_40px_rgba(0,0,0,.35)] transition-all hover:enabled:-translate-y-0.5 hover:enabled:border-one-cyan/55 hover:enabled:shadow-[0_0_0_1px_rgba(107,225,227,.35),0_16px_55px_rgba(0,0,0,.45),0_0_40px_rgba(107,225,227,.25)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Ingresar
          </button>
        </form>

        {loading && <div className="mt-3 text-center text-sm text-one-cyan">Verificando credenciales...</div>}

        <div className="mt-5 border-t border-one-mist/15 pt-5 text-center">
          <button
            type="button"
            onClick={toggleMode}
            className="cursor-pointer text-sm font-semibold text-one-cyan transition-colors hover:text-one-pink hover:underline"
          >
            {isAdmin ? '¿Eres usuario? Ingresa aquí' : '¿Eres administrador? Ingresa aquí'}
          </button>
        </div>
      </div>
    </div>
  );
}
