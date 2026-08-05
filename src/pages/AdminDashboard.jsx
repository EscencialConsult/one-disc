import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExclamationTriangleIcon, CheckCircleIcon, NoSymbolIcon } from '@heroicons/react/24/solid';
import { ArrowUpTrayIcon, XCircleIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import { CONFIG } from '../lib/config.js';
import { Session } from '../lib/session.js';
import { Auth } from '../lib/auth.js';
import { loadScripts, unloadLegacyScripts } from '../lib/loadScript.js';
import Footer from '../components/Footer.jsx';
import {
  getUsuariosByAdmin,
  getRespuestasByAdmin,
  createUsuario,
  updateUsuario,
} from '../lib/api.js';

// Mismos scripts legacy que usa Userboard para el manual (jsPDF 2.5.1, sin tocar).
const MANUAL_SCRIPTS = [
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  '/legacy/ManualTheme.js',
  '/legacy/Manual.js',
];

/**
 * Panel del Administrador — réplica de AdminDashboard/ (versión AppScript).
 * Misma UI y flujo (crear usuario, editar, activar/inactivar, Pack Líder,
 * credenciales al crear, stats por hoja Respuestas). Fuente: Supabase.
 * Mejora: verificar tests pasa de 1 fetch por usuario a 1 sola consulta.
 */

const inputClass =
  'w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-white transition-all placeholder:text-gray-500 focus:border-one-cyan/50 focus:outline-none focus:ring-2 focus:ring-one-cyan/20';

/** Escapa HTML real (igual que Helpers.sanitizeHTML del original) — usar
 * siempre que un valor con origen en el usuario se inserte vía dangerouslySetInnerHTML. */
export function sanitizeText(str) {
  const div = document.createElement('div');
  div.textContent = String(str || '');
  return div.innerHTML;
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** Genera y descarga un CSV de ejemplo (plantilla) con el mismo formato que
 * la carga masiva sabe leer — para que quien suba el archivo no tenga que
 * adivinar cómo armarlo. Se abre bien en Excel (con BOM UTF-8, así los
 * acentos no se rompen). */
export function descargarPlantillaCSV(headers, filaEjemplo, nombreArchivo) {
  const escapar = (v) => {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  const contenido = [headers, filaEjemplo].map((fila) => fila.map(escapar).join(',')).join('\r\n');
  const blob = new Blob(['﻿' + contenido], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombreArchivo;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function EyeButton({ visible, onClick, className = '' }) {
  return (
    <button type="button" onClick={onClick} className={className}>
      {visible ? (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
          <line x1="1" y1="1" x2="23" y2="23" />
        </svg>
      ) : (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      )}
    </button>
  );
}

const STATUS_BADGE_STYLES = {
  active: 'bg-green-500/15 text-green-300 border-green-500/30',
  inactive: 'bg-red-500/15 text-red-300 border-red-500/30',
  completed: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  pending: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
};

export function StatusBadge({ kind, children }) {
  return (
    <span className={`inline-block rounded-full border px-3 py-1 text-xs font-semibold ${STATUS_BADGE_STYLES[kind]}`}>
      {children}
    </span>
  );
}

/** Overlay de carga con el spinner de anillos del original */
export function LoadingOverlay({ msg, sub }) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/78 backdrop-blur-[14px]">
      <div className="flex flex-col items-center gap-3.5">
        <div className="relative h-[90px] w-[90px]">
          <div className="absolute -inset-2.5 animate-pulse rounded-full bg-[radial-gradient(circle,rgba(225,123,215,0.2)_0%,transparent_70%)]" />
          <div className="absolute -inset-1 animate-spin rounded-full border-[2.5px] border-transparent border-r-one-pink/50 border-t-one-pink [animation-duration:.8s]" />
          <div className="absolute -inset-1 animate-spin rounded-full border-[2.5px] border-transparent border-b-[rgba(200,100,240,0.3)] [animation-direction:reverse] [animation-duration:1.8s]" />
          <div className="absolute -inset-1 rounded-full border-[2.5px] border-one-pink/8" />
          <img
            src="/img/one-iconocolor.png"
            className="relative z-[2] block h-[90px] w-[90px] rounded-full object-cover [filter:drop-shadow(0_0_8px_rgba(225,123,215,0.25))]"
            alt=""
          />
        </div>
        <div className="text-center">
          <p className="m-0 font-title text-[.93rem] font-semibold text-white/90">{msg || 'Cargando...'}</p>
          <p className="mb-0 mt-1 min-h-4 font-title text-xs text-one-pink/80">{sub || ''}</p>
        </div>
      </div>
    </div>
  );
}

/** Toasts (réplica del showToast original) */
export function useToasts() {
  const [toasts, setToasts] = useState([]);
  function showToast(message, type = 'success') {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }
  const ToastContainer = (
    <div className="pointer-events-none fixed inset-x-4 top-4 z-[120] flex flex-col items-stretch gap-3 sm:inset-x-auto sm:right-6 sm:top-6 sm:items-end">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={
            'pointer-events-auto flex items-center gap-3 rounded-xl border px-5 py-3 text-sm font-semibold shadow-2xl backdrop-blur-xl sm:max-w-sm ' +
            (t.type === 'success'
              ? 'border-green-500/40 bg-green-500/20 text-green-300'
              : 'border-red-500/40 bg-red-500/20 text-red-300')
          }
        >
          {t.type === 'success' ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          )}
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
  return { showToast, ToastContainer };
}

/** Modal de confirmación genérico (réplica del original) */
export function ConfirmModal({ confirm, onClose }) {
  if (!confirm) return null;
  const iconMap = {
    create: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#6be1e3" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="16" />
        <line x1="8" y1="12" x2="16" y2="12" />
      </svg>
    ),
    edit: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#6be1e3" strokeWidth="2">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
    ),
    delete: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      </svg>
    ),
    deactivate: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    ),
    activate: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
  };
  const bgMap = {
    create: 'bg-one-cyan/20',
    edit: 'bg-one-cyan/20',
    delete: 'bg-red-500/20',
    deactivate: 'bg-red-500/20',
    activate: 'bg-green-500/20',
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md transform overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-br from-one-ink to-black shadow-2xl backdrop-blur-xl transition-all">
        <div className="p-6 text-center">
          <div
            className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${bgMap[confirm.icon] || 'bg-white/10'}`}
          >
            {iconMap[confirm.icon]}
          </div>
          <h3 className="mb-2 font-title text-xl font-bold">{confirm.title}</h3>
          <p className="mb-6 text-sm text-gray-400" dangerouslySetInnerHTML={{ __html: confirm.message }} />
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 rounded-full border border-white/20 bg-white/5 px-6 py-2.5 text-sm font-semibold transition-all hover:bg-white/10"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                const cb = confirm.onConfirm;
                onClose();
                if (typeof cb === 'function') cb();
              }}
              className={`flex-1 cursor-pointer rounded-full px-6 py-2.5 text-sm font-bold transition-all ${confirm.btnClass || ''}`}
            >
              Confirmar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Adivina qué columna del CSV corresponde a un campo, buscando por nombre parecido. */
function guessColumnIndex(headers, aliases) {
  const normalized = headers.map((h) => h.toLowerCase().trim());
  const idx = normalized.findIndex((h) => aliases.includes(h));
  return idx !== -1 ? idx : '';
}

/**
 * Modal de mapeo de columnas: el usuario sube CUALQUIER CSV (sin formato fijo)
 * y acá elige, columna por columna, cuál corresponde a cada campo requerido.
 * mapping: { headers: string[], dataRows: string[][] }
 * fieldsConfig: [{ key, label, required, aliases }]
 */
export function ColumnMapModal({ mapping, fieldsConfig, onCancel, onConfirm }) {
  const [selection, setSelection] = useState(() => {
    const initial = {};
    fieldsConfig.forEach((f) => {
      initial[f.key] =
        f.type === 'toggle'
          ? false
          : f.type === 'credits'
            ? { ilimitado: false, valor: '' }
            : guessColumnIndex(mapping.headers, f.aliases);
    });
    return initial;
  });

  if (!mapping) return null;

  const faltanRequeridos = fieldsConfig.some((f) => {
    if (f.type === 'toggle') return false;
    if (f.type === 'credits') return !selection[f.key].ilimitado && !/^\d+$/.test(selection[f.key].valor.trim());
    return f.required && selection[f.key] === '';
  });

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#141019] p-6 shadow-2xl">
        <h3 className="mb-1 font-title text-xl font-bold">Elegí qué columna es cada dato</h3>
        <p className="mb-5 text-sm text-gray-400">
          Detectamos <strong className="text-gray-300">{mapping.dataRows.length}</strong> fila(s) en tu archivo.
          Indicá qué columna corresponde a cada campo.
        </p>

        <div className="mb-6 space-y-3">
          {fieldsConfig.map((f) =>
            f.type === 'toggle' ? (
              <div
                key={f.key}
                className="flex items-center justify-between rounded-xl border border-one-cyan/20 bg-one-cyan/5 px-4 py-3"
              >
                <div>
                  <span className="block text-sm font-semibold text-gray-300">{f.label}</span>
                  <span className="text-xs text-gray-500">{f.help}</span>
                </div>
                <label className="relative inline-flex shrink-0 cursor-pointer items-center">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={selection[f.key]}
                    onChange={(e) => setSelection((s) => ({ ...s, [f.key]: e.target.checked }))}
                  />
                  <div className="peer h-6 w-11 rounded-full bg-gray-700 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-one-cyan peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none" />
                </label>
              </div>
            ) : f.type === 'credits' ? (
              <div key={f.key} className="rounded-xl border border-one-cyan/20 bg-one-cyan/5 p-4">
                <div className="mb-3">
                  <span className="block text-sm font-semibold text-gray-300">{f.label}</span>
                  <span className="text-xs text-gray-500">{f.help}</span>
                </div>
                {!selection[f.key].ilimitado && (
                  <input
                    type="number"
                    min={0}
                    step={1}
                    className={inputClass + ' mb-3'}
                    placeholder="Ej: 10, 100, 300..."
                    value={selection[f.key].valor}
                    onChange={(e) =>
                      setSelection((s) => ({ ...s, [f.key]: { ...s[f.key], valor: e.target.value } }))
                    }
                  />
                )}
                <label className="flex cursor-pointer items-start gap-2.5">
                  <input
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 shrink-0 accent-one-cyan"
                    checked={selection[f.key].ilimitado}
                    onChange={(e) =>
                      setSelection((s) => ({ ...s, [f.key]: { ...s[f.key], ilimitado: e.target.checked } }))
                    }
                  />
                  <span className="text-xs">
                    <span className="font-semibold text-gray-300">Créditos ilimitados</span>
                    {selection[f.key].ilimitado && (
                      <span className="mt-0.5 block text-yellow-400">
                        ⚠ Precaución: van a poder crear usuarios sin ningún límite.
                      </span>
                    )}
                  </span>
                </label>
              </div>
            ) : (
              <div key={f.key} className="flex items-center gap-3">
                <label className="w-32 shrink-0 text-sm font-semibold text-gray-300">
                  {f.label}
                  {f.required && <span className="text-red-400"> *</span>}
                </label>
                <select
                  className={inputClass}
                  value={selection[f.key]}
                  onChange={(e) =>
                    setSelection((s) => ({ ...s, [f.key]: e.target.value === '' ? '' : Number(e.target.value) }))
                  }
                >
                  <option value="">{f.required ? '-- Seleccionar --' : '-- No usar --'}</option>
                  {mapping.headers.map((h, i) => (
                    <option key={i} value={i}>
                      {h || `Columna ${i + 1}`}
                    </option>
                  ))}
                </select>
              </div>
            )
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-full border border-white/20 bg-white/5 px-6 py-2.5 text-sm font-semibold transition-all hover:bg-white/10"
          >
            Cancelar
          </button>
          <button
            disabled={faltanRequeridos}
            onClick={() => onConfirm(selection)}
            className="flex-1 cursor-pointer rounded-full border border-one-cyan/50 bg-gradient-to-r from-one-cyan/30 to-one-pink/30 px-6 py-2.5 text-sm font-bold transition-all disabled:cursor-not-allowed disabled:opacity-40"
          >
            Continuar
          </button>
        </div>
      </div>
    </div>
  );
}

/** Modal de credenciales al crear usuario (réplica del original) */
export function CredentialsModal({ creds, onClose }) {
  if (!creds) return null;
  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-[10px]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-[92%] max-w-[480px] rounded-[20px] border border-one-cyan/20 bg-gradient-to-br from-[#1e1b23] to-[#2a2730] p-8 shadow-[0_30px_80px_rgba(0,0,0,0.6),0_0_50px_rgba(107,225,227,0.06)]">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-green-500/30 bg-green-500/15">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h3 className="m-0 font-title text-[1.3rem] font-extrabold text-white">Usuario Creado</h3>
        </div>
        <div className="rounded-[14px] border-[1.5px] border-dashed border-one-cyan/20 bg-one-cyan/[0.04] px-[18px] py-1">
          {[
            ['Usuario', creds.usuario, 'text-one-cyan border-one-cyan/15'],
            ['Contraseña', creds.password, 'text-one-pink border-one-pink/15'],
            ['Email', creds.email, 'text-one-gold border-one-gold/15'],
          ].map(([label, value, cls], i) => (
            <div
              key={label}
              className={`flex items-center justify-between py-3.5 ${i < 2 ? 'border-b border-white/6' : ''}`}
            >
              <span className="text-[0.9rem] font-semibold text-one-slate">{label}</span>
              <code className={`rounded-lg border bg-black/50 px-3.5 py-[5px] font-mono text-[0.9rem] ${cls}`}>
                {value}
              </code>
            </div>
          ))}
        </div>
        <p className="mb-[22px] mt-[18px] flex items-start gap-2 text-[0.85rem] leading-normal text-one-slate">
          <ExclamationTriangleIcon className="h-4 w-4 shrink-0 translate-y-0.5 text-one-gold" />
          Guarda estas credenciales. El usuario las necesitará para acceder al sistema.
        </p>
        <button
          onClick={onClose}
          className="w-full cursor-pointer rounded-full border border-one-cyan/35 bg-gradient-to-br from-one-cyan/12 to-one-pink/12 p-[13px] font-title text-[0.95rem] font-bold text-white transition-all hover:border-one-cyan/60 hover:shadow-[0_10px_40px_rgba(107,225,227,0.15)]"
        >
          Entendido
        </button>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const session = Session.get();
  const isAdminLider = session && (session.packStatus === '01' || session.packStatus === '1');
  // Créditos: null/undefined = sin límite. Se cachea en sesión al loguear
  // (mismo patrón que packStatus) — si el SuperAdmin suma créditos en medio
  // de la sesión, se reflejan recién en el próximo login.
  const limiteUsuarios =
    session && session.limiteUsuarios !== null && session.limiteUsuarios !== undefined
      ? Number(session.limiteUsuarios)
      : null;

  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [overlay, setOverlay] = useState(null); // { msg, sub }
  const [confirm, setConfirm] = useState(null);
  const [creds, setCreds] = useState(null);
  const [editUser, setEditUser] = useState(null); // { id, usuario, email, nombre, password }
  const [visiblePass, setVisiblePass] = useState({});
  const [formPassVisible, setFormPassVisible] = useState(false);
  const [editPassVisible, setEditPassVisible] = useState(false);
  const [creating, setCreating] = useState(false);
  const [descargandoManual, setDescargandoManual] = useState(null); // id del usuario cuyo manual se está generando
  const [form, setForm] = useState({ usuario: '', password: '', email: '', nombre: '', pack: false });
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkResult, setBulkResult] = useState(null); // { creados, errores: [{usuario, motivo}] }
  const [csvMapping, setCsvMapping] = useState(null); // { headers, dataRows } mientras se elige el mapeo
  const { showToast, ToastContainer } = useToasts();

  async function loadUsers() {
    setOverlay({ msg: 'Cargando panel...', sub: 'Obteniendo usuarios...' });
    try {
      const rows = await getUsuariosByAdmin(session.adminId);
      const mapped = rows.map((row) => ({
        id: row.id,
        usuario: String(row.usuario_user || ''),
        password: String(row.pass_user || ''),
        email: String(row.email_user || ''),
        nombre: String(row.nombre || ''),
        estado: String(row.estado || 'activo').toLowerCase(),
        packStatus: String(row.pack_status || '').trim(),
        testCompletado: false,
        raw: null,
      }));

      setOverlay({ msg: 'Cargando panel...', sub: `Verificando tests (${mapped.length} usuarios)...` });
      // Una sola consulta a Respuestas (antes: un fetch por usuario)
      const respuestas = await getRespuestasByAdmin(session.adminId);
      const respuestaMap = {};
      respuestas.forEach((r) => {
        if (r.Respuestas && String(r.Respuestas).trim() !== '') {
          respuestaMap[String(r.User || '').trim().toLowerCase()] = r;
        }
      });
      mapped.forEach((u) => {
        const r = respuestaMap[u.usuario.trim().toLowerCase()];
        u.testCompletado = !!r;
        u.raw = r || null;
      });

      setUsers(mapped);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      showToast('Error de conexión al cargar usuarios', 'error');
    } finally {
      setOverlay(null);
    }
  }

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Réplica del comportamiento original: Escape cierra el modal abierto
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key !== 'Escape') return;
      setEditUser(null);
      setConfirm(null);
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  const filteredData = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.usuario.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.nombre.toLowerCase().includes(q)
    );
  }, [users, search]);

  // Stats (misma lógica que el original)
  const total = users.length;
  const activos = users.filter((u) => u.estado === 'activo').length;
  const completados = users.filter((u) => u.estado === 'activo' && u.testCompletado).length;
  const pendientes = activos - completados;

  function handleCreateUser(e) {
    e.preventDefault();
    const { usuario, password, email, nombre } = {
      usuario: form.usuario.trim(),
      password: form.password,
      email: form.email.trim(),
      nombre: form.nombre.trim(),
    };
    const packValue = form.pack ? '01' : '';

    if (!usuario || !password || !email || !nombre) {
      showToast('Todos los campos son obligatorios', 'error');
      return;
    }
    if (!validateEmail(email)) {
      showToast('Email inválido', 'error');
      return;
    }
    if (password.length < 6) {
      showToast('La contraseña debe tener al menos 6 caracteres', 'error');
      return;
    }
    if (users.some((u) => u.usuario.toLowerCase() === usuario.toLowerCase())) {
      showToast(`El usuario "${usuario}" ya existe`, 'error');
      return;
    }
    if (limiteUsuarios !== null && users.length >= limiteUsuarios) {
      showToast(
        `Llegaste al límite de ${limiteUsuarios} usuario(s) de tu cuenta. Contactá a tu administrador para sumar más créditos.`,
        'error'
      );
      return;
    }

    setConfirm({
      title: 'Crear Usuario',
      message: `¿Estás seguro de crear al usuario <strong>${sanitizeText(usuario)}</strong>?`,
      icon: 'create',
      btnClass: 'bg-gradient-to-r from-one-cyan/30 to-one-pink/30 border border-one-cyan/50',
      onConfirm: async () => {
        setCreating(true);
        try {
          await createUsuario({
            adminId: session.adminId,
            usuario,
            password,
            email,
            nombre,
            packStatus: packValue,
          });
          showToast(`Usuario "${usuario}" creado exitosamente`, 'success');
          setForm({ usuario: '', password: '', email: '', nombre: '', pack: false });
          setCreds({ usuario, password, email });
          setTimeout(() => loadUsers(), 1500);
        } catch (error) {
          console.error('Error al crear usuario:', error);
          showToast('Error al crear usuario: ' + (error.message || 'Error desconocido'), 'error');
        } finally {
          setCreating(false);
        }
      },
    });
  }

  /** Parsea una línea CSV respetando campos entre comillas con comas adentro. */
  function parseCsvLine(line) {
    const fields = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (inQuotes) {
        if (char === '"' && line[i + 1] === '"') {
          current += '"';
          i++;
        } else if (char === '"') {
          inQuotes = false;
        } else {
          current += char;
        }
      } else if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        fields.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    fields.push(current);
    return fields.map((f) => f.trim());
  }

  const USUARIOS_FIELDS_CONFIG = [
    { key: 'usuario', label: 'Usuario', required: true, aliases: ['usuario', 'usuario_user', 'user'] },
    { key: 'password', label: 'Contraseña', required: true, aliases: ['password', 'contraseña', 'contrasena', 'pass'] },
    { key: 'email', label: 'Email', required: true, aliases: ['email', 'correo', 'email_user'] },
    { key: 'nombre', label: 'Nombre', required: true, aliases: ['nombre', 'nombre_completo', 'name'] },
    {
      key: 'pack',
      label: 'Activar Pack Líder para todos',
      type: 'toggle',
      help: 'Se aplica a todos los usuarios de esta carga, sin tocarlo después uno por uno.',
    },
  ];

  /** Descarga un CSV de ejemplo con el formato ideal para la carga masiva de usuarios. */
  function descargarPlantillaUsuarios() {
    descargarPlantillaCSV(
      ['usuario', 'password', 'email', 'nombre'],
      ['usuario_ejemplo', 'Password123', 'usuario@ejemplo.com', 'Juan Pérez'],
      'plantilla_usuarios.csv'
    );
  }

  /** El usuario sube CUALQUIER CSV (sin formato fijo) — acá solo lo leemos
   * en filas crudas; el mapeo de columnas lo elige él en el modal siguiente. */
  function handleBulkCsvFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const lines = String(reader.result || '')
        .replace(/^﻿/, '')
        .split(/\r\n|\n/)
        .filter((l) => l.trim() !== '');

      if (lines.length < 2) {
        showToast('El archivo está vacío o no tiene filas de datos', 'error');
        return;
      }

      const headers = parseCsvLine(lines[0]);
      const dataRows = lines.slice(1).map(parseCsvLine);
      setCsvMapping({ headers, dataRows });
    };
    reader.readAsText(file, 'utf-8');
  }

  function handleCsvMappingConfirm(selection) {
    const { dataRows } = csvMapping;
    setCsvMapping(null);

    const rows = [];
    const errors = [];
    const usuariosVistos = new Set();

    dataRows.forEach((cols, i) => {
      const lineNum = i + 2; // +1 por el header, +1 porque i es 0-indexado
      const usuario = (cols[selection.usuario] || '').trim();
      const password = (cols[selection.password] || '').trim();
      const email = (cols[selection.email] || '').trim();
      const nombre = (cols[selection.nombre] || '').trim();
      const pack = !!selection.pack;

      if (!usuario && !password && !email && !nombre) return; // fila vacía, se ignora en silencio

      if (!usuario || !password || !email || !nombre) {
        errors.push({ line: lineNum, usuario, motivo: 'Faltan campos obligatorios (usuario/contraseña/email/nombre)' });
        return;
      }
      if (!validateEmail(email)) {
        errors.push({ line: lineNum, usuario, motivo: 'Email inválido' });
        return;
      }
      if (password.length < 6) {
        errors.push({ line: lineNum, usuario, motivo: 'La contraseña debe tener al menos 6 caracteres' });
        return;
      }
      const usuarioLower = usuario.toLowerCase();
      if (usuariosVistos.has(usuarioLower)) {
        errors.push({ line: lineNum, usuario, motivo: 'Usuario repetido dentro del mismo archivo' });
        return;
      }
      if (users.some((u) => u.usuario.toLowerCase() === usuarioLower)) {
        errors.push({ line: lineNum, usuario, motivo: 'Ese usuario ya existe en tu plataforma' });
        return;
      }
      usuariosVistos.add(usuarioLower);
      rows.push({ usuario, password, email, nombre, pack });
    });

    if (rows.length === 0) {
      showToast(
        errors[0]?.motivo ? `No se creó nada: ${errors[0].motivo}` : 'El archivo no tiene filas válidas',
        'error'
      );
      setBulkResult({ creados: 0, errores: errors.map((er) => ({ usuario: er.usuario || `línea ${er.line}`, motivo: er.motivo })) });
      return;
    }

    const cupoDisponible = limiteUsuarios !== null ? Math.max(0, limiteUsuarios - users.length) : Infinity;
    const seVanASaltar = Math.max(0, rows.length - cupoDisponible);
    const avisoCredito =
      seVanASaltar > 0
        ? `<br/><span class="text-red-400">Tu cuenta tiene ${cupoDisponible} crédito(s) disponible(s) — ${seVanASaltar} fila(s) no se van a crear por falta de créditos.</span>`
        : '';

    const resumenErrores =
      errors.length > 0
        ? `<br/><span class="text-yellow-400">${errors.length} fila(s) se van a omitir por error (usuario duplicado o datos inválidos).</span>`
        : '';

    setConfirm({
      title: 'Carga Masiva de Usuarios',
      message: `Se van a crear <strong>${Math.min(rows.length, cupoDisponible)}</strong> usuario(s) nuevo(s) a partir del archivo.${avisoCredito}${resumenErrores}`,
      icon: 'create',
      btnClass: 'bg-gradient-to-r from-one-cyan/30 to-one-pink/30 border border-one-cyan/50',
      onConfirm: async () => {
        setBulkUploading(true);
        const erroresCarga = errors.map((er) => ({ usuario: er.usuario || `línea ${er.line}`, motivo: er.motivo }));
        let creados = 0;

        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          if (limiteUsuarios !== null && users.length + creados >= limiteUsuarios) {
            erroresCarga.push({ usuario: row.usuario, motivo: 'Límite de créditos alcanzado, no se creó' });
            continue;
          }
          setOverlay({ msg: `Creando usuarios... (${i + 1}/${rows.length})`, sub: row.nombre });
          try {
            await createUsuario({
              adminId: session.adminId,
              usuario: row.usuario,
              password: row.password,
              email: row.email,
              nombre: row.nombre,
              packStatus: row.pack ? '01' : '',
            });
            creados++;
          } catch (error) {
            erroresCarga.push({ usuario: row.usuario, motivo: error.message || 'Error desconocido' });
          }
        }

        setOverlay(null);
        setBulkUploading(false);
        setBulkResult({ creados, errores: erroresCarga });
        showToast(
          erroresCarga.length > 0
            ? `${creados} usuario(s) creado(s), ${erroresCarga.length} con error`
            : `${creados} usuario(s) creado(s) correctamente`,
          erroresCarga.length > 0 && creados === 0 ? 'error' : 'success'
        );
        loadUsers();
      },
    });
  }

  function handleEditSubmit(e) {
    e.preventDefault();
    if (!editUser.email.trim()) {
      showToast('El Email es obligatorio', 'error');
      return;
    }
    const u = editUser;
    setConfirm({
      title: 'Guardar Cambios',
      message: `¿Confirmas los cambios para <strong>${sanitizeText(u.usuario)}</strong>?`,
      icon: 'edit',
      btnClass: 'bg-gradient-to-r from-one-cyan/30 to-one-pink/30 border border-one-cyan/50',
      onConfirm: async () => {
        setEditUser(null);
        try {
          const fields = { email_user: u.email.trim(), nombre: u.nombre.trim() };
          if (u.password) fields.pass_user = u.password;
          await updateUsuario(u.id, fields);
          showToast(`Usuario "${u.usuario}" actualizado correctamente`, 'success');
          loadUsers();
        } catch (error) {
          console.error('Error al editar:', error);
          showToast('Error: ' + (error.message || 'Error desconocido'), 'error');
        }
      },
    });
  }

  function toggleUserStatus(user) {
    const nuevoEstado = user.estado === 'activo' ? 'inactivo' : 'activo';
    const accionTexto = nuevoEstado === 'inactivo' ? 'inactivar' : 'activar';
    setConfirm({
      title: (nuevoEstado === 'inactivo' ? 'Inactivar' : 'Activar') + ' Usuario',
      message: `¿Deseas <strong>${accionTexto}</strong> al usuario <strong>${sanitizeText(user.usuario)}</strong>?`,
      icon: nuevoEstado === 'inactivo' ? 'deactivate' : 'activate',
      btnClass:
        nuevoEstado === 'inactivo'
          ? 'bg-red-500/30 border border-red-500/50 text-red-300'
          : 'bg-green-500/30 border border-green-500/50 text-green-300',
      onConfirm: async () => {
        try {
          await updateUsuario(user.id, { estado: nuevoEstado });
          showToast(`Estado de "${user.usuario}" cambiado a ${nuevoEstado}`, 'success');
          loadUsers();
        } catch (error) {
          console.error('Error al cambiar estado:', error);
          showToast('Error: ' + (error.message || 'Error desconocido'), 'error');
        }
      },
    });
  }

  async function toggleUserPack(user, isEnabled) {
    const nuevoValor = isEnabled ? '1' : '';
    showToast('Actualizando permisos...', 'success');
    try {
      await updateUsuario(user.id, { pack_status: nuevoValor });
      showToast('Permisos actualizados correctamente', 'success');
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, packStatus: nuevoValor } : u)));
    } catch (error) {
      console.error('Error:', error);
      showToast('No se pudo actualizar: ' + (error.message || ''), 'error');
      loadUsers();
    }
  }

  /** Genera y descarga el Manual Personalizado (Pack Líder) de un usuario —
   * mismo mecanismo cliente que usa Userboard, sin tocar Manual.js. */
  async function descargarPackLider(user) {
    if (!user.raw) {
      showToast('Ese usuario todavía no completó el test', 'error');
      return;
    }
    setDescargandoManual(user.id);
    try {
      unloadLegacyScripts(['jspdf']);
      await loadScripts(MANUAL_SCRIPTS);

      const data = user.raw;
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
      showToast(`Manual Personalizado de "${user.usuario}" descargado`, 'success');
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
    <div className="isolate min-h-screen min-h-dvh overflow-x-hidden bg-black font-title text-white">
      {/* Background Effects */}
      <div className="fixed inset-0 -z-20 bg-gradient-to-br from-black via-one-ink to-black" />
      <div className="bg-hex-pattern fixed -inset-[20%] -z-10 -rotate-[8deg] opacity-16 mix-blend-screen" />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/60 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-one-cyan/20 to-one-pink/20">
                <img
                  src={session?.logoEmpresa || '/img/one-logocolor.png'}
                  alt="Logo"
                  className="h-full w-full object-contain"
                  onError={(e) => (e.target.src = '/img/one-logocolor.png')}
                />
              </div>
              <div>
                <h2 className="bg-gradient-to-r from-one-cyan to-one-pink bg-clip-text font-title text-xl font-bold text-transparent">
                  {session?.nombreEmpresa ? `Panel — ${session.nombreEmpresa}` : 'Panel del Administrador'}
                </h2>
                <p className="text-xs text-one-slate">
                  {session ? `${session.userName} (${session.userEmail})` : ''}
                </p>
              </div>
              {limiteUsuarios !== null && (
                <span
                  title={`Créditos: ${users.length} consumido(s) de ${limiteUsuarios} total`}
                  className={`inline-flex flex-col items-center gap-0 rounded-xl border px-3 py-1.5 text-center ${
                    users.length >= limiteUsuarios
                      ? 'border-red-500/40 bg-red-500/10 text-red-300'
                      : 'border-one-cyan/30 bg-one-cyan/10 text-one-cyan'
                  }`}
                >
                  <span className="text-xs font-black">{Math.max(0, limiteUsuarios - users.length)} créditos disponibles</span>
                  <span className="text-[10px] font-medium opacity-70">{users.length}/{limiteUsuarios} usados</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(CONFIG.routes.rrhh)}
                className="flex items-center gap-2 rounded-full border border-one-cyan/30 bg-one-cyan/10 px-5 py-2 text-sm font-semibold transition-all hover:-translate-y-0.5 hover:border-one-cyan/50"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                Panel RRHH
              </button>
              <button
                className="flex items-center gap-2 rounded-full border border-red-500/40 bg-red-500/20 px-5 py-2 text-sm font-semibold transition-all hover:-translate-y-0.5 hover:border-red-500/60"
                onClick={logout}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        {/* Stats */}
        <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative overflow-hidden rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-600/10 to-blue-700/10 p-6 backdrop-blur-sm">
            <div className="relative flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <div>
                <h3 className="text-3xl font-black text-blue-400">{total}</h3>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Usuarios Totales</p>
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-green-500/20 bg-gradient-to-br from-green-600/10 to-green-700/10 p-6 backdrop-blur-sm">
            <div className="relative flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-green-500/20 text-green-400">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                </svg>
              </div>
              <div>
                <h3 className="text-3xl font-black text-green-400">{activos}</h3>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Activos</p>
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-orange-500/20 bg-gradient-to-br from-orange-500/10 to-orange-600/10 p-6 backdrop-blur-sm transition-all hover:-translate-y-1 hover:shadow-2xl">
            <div className="relative flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-orange-500/20">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div>
                <h3 className="text-3xl font-black text-orange-400">{pendientes}</h3>
                <p className="mt-1 text-xs text-gray-400">Pendientes Test</p>
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-blue-600/10 p-6 backdrop-blur-sm transition-all hover:-translate-y-1 hover:shadow-2xl">
            <div className="relative flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-500/20">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
              </div>
              <div>
                <h3 className="text-3xl font-black text-blue-400">{completados}</h3>
                <p className="mt-1 text-xs text-gray-400">Tests Completados</p>
              </div>
            </div>
          </div>
        </div>

        {/* Crear usuario */}
        <div className="mb-8 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl">
          <div className="border-b border-white/10 bg-gradient-to-r from-one-cyan/10 to-one-pink/10 px-6 py-4">
            <h3 className="font-title text-lg font-bold">Habilitar Nuevo Usuario</h3>
          </div>

          <form className="p-6" onSubmit={handleCreateUser}>
            <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-300">Usuario</label>
                <input
                  type="text"
                  className={inputClass}
                  placeholder="Ej: usuario01"
                  value={form.usuario}
                  onChange={(e) => setForm({ ...form, usuario: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-300">Contraseña</label>
                <div className="relative">
                  <input
                    type={formPassVisible ? 'text' : 'password'}
                    className={inputClass + ' pr-12'}
                    placeholder="Contraseña"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                  />
                  <EyeButton
                    visible={formPassVisible}
                    onClick={() => setFormPassVisible(!formPassVisible)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 transition-colors hover:text-one-cyan"
                  />
                </div>
              </div>
            </div>

            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-300">Email</label>
                <input
                  type="email"
                  className={inputClass}
                  placeholder="usuario@ejemplo.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-300">Nombre Completo</label>
                <input
                  type="text"
                  className={inputClass}
                  placeholder="Juan Pérez"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  required
                />
              </div>
            </div>

            {isAdminLider && (
              <div className="group mb-6 flex items-center justify-between rounded-2xl border border-one-gold/20 bg-one-gold/5 p-4 transition-all hover:border-one-gold/40">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-one-gold/10 text-one-gold">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-8.061 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946 8.061 3.42 3.42 0 010 4.438 3.42 3.42 0 00-1.946 8.061 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-8.061 3.42 3.42 0 010-4.438z"
                      />
                    </svg>
                  </div>
                  <div>
                    <span className="block font-title text-sm font-bold uppercase tracking-wider text-white">
                      Habilitar Lider Pack
                    </span>
                    <span className="text-[11px] text-gray-400">
                      Permite asignar el Paquete de Líder (Manual Personalizado).
                    </span>
                  </div>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={form.pack}
                    onChange={(e) => setForm({ ...form, pack: e.target.checked })}
                  />
                  <div className="peer h-6 w-11 rounded-full bg-gray-700 shadow-[0_0_15px_rgba(228,199,106,0.1)] after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-one-gold peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none" />
                </label>
              </div>
            )}

            <button
              type="submit"
              disabled={creating}
              className="group relative w-full overflow-hidden rounded-full border border-one-cyan/40 bg-gradient-to-r from-one-cyan/20 to-one-pink/20 px-8 py-3 font-bold transition-all hover:-translate-y-0.5 hover:border-one-cyan/60 hover:shadow-[0_20px_60px_rgba(107,225,227,0.4)] disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
            >
              <div className="absolute inset-0 -z-10 bg-gradient-to-r from-one-cyan/30 to-one-pink/30 opacity-50 blur-xl transition-opacity group-hover:opacity-80" />
              {creating ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4 31.4" strokeLinecap="round" />
                  </svg>
                  Creando...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Crear Usuario
                </span>
              )}
            </button>
          </form>
        </div>

        {/* Carga Masiva de Usuarios (CSV) */}
        <div className="mb-8 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl">
          <div className="border-b border-white/10 bg-gradient-to-r from-one-cyan/10 to-one-pink/10 px-6 py-4">
            <h3 className="font-title text-lg font-bold">Carga Masiva de Usuarios (CSV)</h3>
          </div>
          <div className="p-6">
            <p className="mb-4 text-sm text-gray-400">
              Subí tu archivo CSV, con las columnas que ya tengas (no hace falta un formato fijo): en el paso
              siguiente elegís vos qué columna corresponde a usuario, contraseña, email y nombre.
            </p>
            {limiteUsuarios !== null && (
              <p className={`mb-4 text-sm font-semibold ${users.length >= limiteUsuarios ? 'text-red-400' : 'text-one-cyan'}`}>
                Créditos disponibles antes de subir: {Math.max(0, limiteUsuarios - users.length)} de {limiteUsuarios}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex cursor-pointer items-center gap-2 rounded-full border border-one-cyan/40 bg-gradient-to-r from-one-cyan/20 to-one-pink/20 px-5 py-2.5 text-sm font-bold transition-all hover:-translate-y-0.5 hover:border-one-cyan/60">
                <ArrowUpTrayIcon className="h-4 w-4" />
                {bulkUploading ? 'Procesando...' : 'Cargar CSV'}
                <input
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  disabled={bulkUploading}
                  onChange={handleBulkCsvFile}
                />
              </label>
              <button
                type="button"
                onClick={descargarPlantillaUsuarios}
                className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-gray-300 transition-all hover:border-white/25 hover:bg-white/10"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Descargar plantilla de ejemplo
              </button>
            </div>

            {bulkResult && (
              <div className="mt-5 rounded-xl border border-white/10 bg-black/30 p-4 text-sm">
                <div className="mb-2 flex items-center gap-2 font-semibold text-gray-200">
                  <CheckCircleIcon className="h-5 w-5 text-green-400" />
                  {bulkResult.creados} usuario(s) creado(s)
                  {bulkResult.errores.length > 0 && `, ${bulkResult.errores.length} con error`}
                </div>
                {bulkResult.errores.length > 0 && (
                  <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto text-[13px] text-gray-400">
                    {bulkResult.errores.map((er, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <XCircleIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-400" />
                        <span>
                          <strong className="text-gray-300">{er.usuario}</strong>: {er.motivo}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Tabla de usuarios */}
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl">
          <div className="border-b border-white/10 bg-gradient-to-r from-one-cyan/10 to-one-pink/10 px-6 py-4">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <h3 className="font-title text-lg font-bold">Mis Usuarios</h3>
              <div className="flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center">
                <div className="relative flex-1 sm:flex-initial">
                  <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input
                    type="text"
                    className="w-full rounded-full border border-white/15 bg-black/40 py-2 pl-10 pr-4 text-sm text-white transition-all placeholder:text-gray-500 focus:border-one-cyan/50 focus:outline-none focus:ring-2 focus:ring-one-cyan/20 sm:w-64"
                    placeholder="Buscar por usuario o email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <button
                  className="flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold transition-all hover:bg-white/10"
                  onClick={loadUsers}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="23 4 23 10 17 10" />
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                  </svg>
                  Actualizar
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-one-ink via-one-pink/20 to-one-ink">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-300">Usuario</th>
                  <th className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-300">Email</th>
                  <th className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-300">Contraseña</th>
                  <th className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-300">Nombre</th>
                  {isAdminLider && (
                    <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-gray-300">Pack Líder</th>
                  )}
                  <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-gray-300">Estado</th>
                  <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-gray-300">Test</th>
                  <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-gray-300">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-8 text-center text-gray-400">
                      {search.trim()
                        ? `No se encontraron resultados para "${search.trim()}"`
                        : 'No has creado usuarios aún.'}
                    </td>
                  </tr>
                ) : (
                  filteredData.map((user) => {
                    const isPackEnabled = user.packStatus === '01' || user.packStatus === '1';
                    return (
                      <tr
                        key={user.id}
                        className={`transition-all hover:bg-white/[0.02] ${user.estado === 'inactivo' ? 'opacity-60' : ''}`}
                      >
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-1">
                            <strong className="inline-block max-w-[110px] overflow-hidden text-ellipsis whitespace-nowrap text-sm">
                              {user.usuario}
                            </strong>
                            {isPackEnabled && (
                              <span className="inline-block shrink-0 whitespace-nowrap rounded-full border border-one-gold/30 bg-one-gold/15 px-[5px] py-px text-[8px] font-bold leading-[1.4] text-one-gold">
                                LÍDER
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">{user.email}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm text-gray-300">
                              {visiblePass[user.id] ? user.password : '••••••••'}
                            </span>
                            <EyeButton
                              visible={!!visiblePass[user.id]}
                              onClick={() => setVisiblePass((v) => ({ ...v, [user.id]: !v[user.id] }))}
                              className="rounded-lg p-1 text-gray-400 hover:text-one-cyan"
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4">{user.nombre || '---'}</td>
                        {isAdminLider && (
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-3">
                              <label className="group relative inline-flex cursor-pointer items-center">
                                <input
                                  type="checkbox"
                                  className="peer sr-only"
                                  checked={isPackEnabled}
                                  onChange={(e) => toggleUserPack(user, e.target.checked)}
                                />
                                <div className="peer h-6 w-11 rounded-full border border-white/20 bg-white/10 shadow-lg after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-one-cyan peer-checked:after:translate-x-full" />
                              </label>
                            </div>
                          </td>
                        )}
                        <td className="px-6 py-4 text-center">
                          <StatusBadge kind={user.estado === 'activo' ? 'active' : 'inactive'}>
                            {user.estado.charAt(0).toUpperCase() + user.estado.slice(1)}
                          </StatusBadge>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <StatusBadge kind={user.testCompletado ? 'completed' : 'pending'}>
                            {user.testCompletado ? 'Completado' : 'Pendiente'}
                          </StatusBadge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center gap-2">
                            {isPackEnabled && user.testCompletado && (
                              <button
                                className="rounded-lg border border-one-gold/30 bg-one-gold/10 p-2 text-one-gold transition-all hover:bg-one-gold/20 disabled:cursor-not-allowed disabled:opacity-50"
                                onClick={() => descargarPackLider(user)}
                                disabled={descargandoManual === user.id}
                                title="Descargar Pack Líder (Manual Personalizado)"
                              >
                                <DocumentArrowDownIcon className="h-4 w-4" />
                              </button>
                            )}
                            <button
                              className="rounded-lg border border-one-cyan/30 bg-one-cyan/10 p-2 text-one-cyan transition-all hover:bg-one-cyan/20"
                              onClick={() =>
                                setEditUser({
                                  id: user.id,
                                  usuario: user.usuario,
                                  email: user.email,
                                  nombre: user.nombre,
                                  password: '',
                                })
                              }
                              title="Editar"
                            >
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                            </button>
                            <button
                              className={
                                'rounded-lg border p-2 transition-all ' +
                                (user.estado === 'activo'
                                  ? 'border-red-500/30 bg-red-500/10 hover:bg-red-500/20'
                                  : 'border-green-500/30 bg-green-500/10 hover:bg-green-500/20')
                              }
                              onClick={() => toggleUserStatus(user)}
                            >
                              {user.estado === 'activo' ? (
                                <NoSymbolIcon className="h-4 w-4" />
                              ) : (
                                <CheckCircleIcon className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Modal de editar usuario */}
      {editUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setEditUser(null)} />
          <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-br from-one-ink to-black shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-white/10 bg-gradient-to-r from-one-cyan/10 to-one-pink/10 px-6 py-4">
              <h3 className="font-title text-lg font-bold">Editar Usuario</h3>
              <button onClick={() => setEditUser(null)} className="text-gray-400 transition-colors hover:text-white">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <form className="p-6" onSubmit={handleEditSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-300">
                    Usuario <span className="text-xs text-gray-500">(identificador único, no editable)</span>
                  </label>
                  <input
                    type="text"
                    readOnly
                    tabIndex={-1}
                    value={editUser.usuario}
                    className="w-full cursor-not-allowed rounded-xl border border-white/5 bg-white/5 px-4 py-2.5 text-gray-400 transition-all"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-300">Email</label>
                  <input
                    type="email"
                    className={inputClass}
                    value={editUser.email}
                    onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-300">Nombre Completo</label>
                  <input
                    type="text"
                    className={inputClass}
                    value={editUser.nombre}
                    onChange={(e) => setEditUser({ ...editUser, nombre: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-300">
                    Nueva Contraseña <span className="text-xs text-gray-500">(dejar vacío para no cambiar)</span>
                  </label>
                  <div className="relative">
                    <input
                      type={editPassVisible ? 'text' : 'password'}
                      className={inputClass + ' pr-12'}
                      placeholder="••••••••"
                      value={editUser.password}
                      onChange={(e) => setEditUser({ ...editUser, password: e.target.value })}
                    />
                    <EyeButton
                      visible={editPassVisible}
                      onClick={() => setEditPassVisible(!editPassVisible)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-one-cyan"
                    />
                  </div>
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditUser(null)}
                  className="flex-1 rounded-full border border-white/20 bg-white/5 px-6 py-2.5 text-sm font-semibold transition-all hover:bg-white/10"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-full border border-one-cyan/40 bg-gradient-to-r from-one-cyan/20 to-one-pink/20 px-6 py-2.5 text-sm font-bold transition-all hover:border-one-cyan/60"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal confirm={confirm} onClose={() => setConfirm(null)} />
      {csvMapping && (
        <ColumnMapModal
          mapping={csvMapping}
          fieldsConfig={USUARIOS_FIELDS_CONFIG}
          onCancel={() => setCsvMapping(null)}
          onConfirm={handleCsvMappingConfirm}
        />
      )}
      <CredentialsModal creds={creds} onClose={() => setCreds(null)} />
      {overlay && <LoadingOverlay msg={overlay.msg} sub={overlay.sub} />}
      {ToastContainer}
      <Footer />
    </div>
  );
}
