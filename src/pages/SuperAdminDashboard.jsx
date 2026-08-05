import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { ArrowUpTrayIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { CONFIG } from '../lib/config.js';
import { Session } from '../lib/session.js';
import { Auth } from '../lib/auth.js';
import { getAdmins, createAdmin, updateAdmin, deleteAdmin, uploadLogo, getUsuarioCountsByAdmin } from '../lib/api.js';
import Footer from '../components/Footer.jsx';
import {
  EyeButton,
  StatusBadge,
  LoadingOverlay,
  ConfirmModal,
  ColumnMapModal,
  useToasts,
  sanitizeText,
} from './AdminDashboard.jsx';

/**
 * Panel de Super Administrador — réplica de SuperAdminDashboard/ (AppScript).
 * Misma UI y flujo. Diferencia estructural: el paso "crear infraestructura"
 * (carpetas Drive + planillas + scripts por admin) desaparece — con la base
 * única de Supabase, crear un admin es un solo insert y su plataforma queda
 * ACTIVADA al instante.
 */

const inputClass =
  'w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-white transition-all placeholder:text-gray-500 focus:border-one-cyan/50 focus:outline-none focus:ring-2 focus:ring-one-cyan/20';

const PAGE_SIZE = 20;

function formatDate(fecha) {
  const date = new Date(fecha || Date.now());
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${date.getFullYear()}`;
}

/**
 * Selector de logo con subida a Supabase Storage (reemplaza el input de URL externa).
 * previewUrl: URL a mostrar (puede ser un link viejo o la ya subida a Storage).
 * onFileSelected: recibe el File elegido; el caller decide cuándo subirlo
 * (inmediato si ya existe adminId, o diferido hasta crear el admin).
 */
function LogoPicker({ previewUrl, onFileSelected, uploading }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center overflow-hidden rounded-[10px] border border-white/10 bg-white/5">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt="Logo"
            className="max-h-12 max-w-12 object-contain"
            onError={(e) => (e.target.style.display = 'none')}
          />
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-500">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="M21 15l-5-5L5 21" />
          </svg>
        )}
      </div>
      <label className="flex-1 cursor-pointer">
        <span className={inputClass + ' flex items-center justify-between'}>
          <span className="truncate text-sm text-gray-300">
            {uploading ? 'Subiendo...' : 'Elegir imagen (PNG/JPG)'}
          </span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-gray-400">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </span>
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          disabled={uploading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFileSelected(file);
            e.target.value = '';
          }}
        />
      </label>
    </div>
  );
}

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const session = Session.get();

  const [admins, setAdmins] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [overlay, setOverlay] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [editAdmin, setEditAdmin] = useState(null); // { id, usuario, email, password, empresa, logo }
  const [visiblePass, setVisiblePass] = useState({});
  const [formPassVisible, setFormPassVisible] = useState(false);
  const [editPassVisible, setEditPassVisible] = useState(false);
  const [form, setForm] = useState({
    usuario: '',
    password: '',
    email: '',
    empresa: '',
    logo: '',
    pack: false,
    limiteUsuarios: '',
    ilimitado: false,
  });
  const [creditosAdmin, setCreditosAdmin] = useState(null); // { id, usuario, limiteUsuarios, consumidos } — modal de editar créditos
  const [creditosForm, setCreditosForm] = useState({ ilimitado: false, sumar: '0' });
  // El admin todavía no existe al elegir el logo en el form de creación,
  // así que guardamos el File y lo subimos recién después de crearlo.
  const [formLogoFile, setFormLogoFile] = useState(null);
  const [formLogoPreview, setFormLogoPreview] = useState('');
  const [editLogoUploading, setEditLogoUploading] = useState(false);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkResult, setBulkResult] = useState(null); // { creados, errores: [{usuario, motivo}] }
  const [csvMapping, setCsvMapping] = useState(null); // { headers, dataRows } mientras se elige el mapeo
  const { showToast, ToastContainer } = useToasts();

  async function loadAdmins() {
    setOverlay({ msg: 'Cargando administradores...' });
    try {
      const [rows, consumos] = await Promise.all([getAdmins(), getUsuarioCountsByAdmin()]);
      setAdmins(
        rows.map((row) => ({
          id: row.id,
          usuario: String(row.usuario_admin || ''),
          email: String(row.email_admin || ''),
          password: String(row.pass_admin || ''),
          fecha: row.fecha_alta || '',
          estado: String(row.estado || 'activo').toLowerCase(),
          packStatus: String(row.pack_status || '').trim(),
          empresa: String(row.name_empresa || '').trim(),
          logo: String(row.logo_empresa_link || '').trim(),
          // Créditos: null = sin límite. consumidos = usuarios ya creados bajo este admin.
          limiteUsuarios:
            row.limite_usuarios === null || row.limite_usuarios === undefined ? null : Number(row.limite_usuarios),
          consumidos: consumos[row.id] || 0,
        }))
      );
    } catch (error) {
      console.error('Error al cargar administradores:', error);
      showToast('Error de conexión al cargar la lista', 'error');
    } finally {
      setOverlay(null);
    }
  }

  useEffect(() => {
    loadAdmins();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Réplica del comportamiento original: Escape cierra el modal abierto
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key !== 'Escape') return;
      setEditAdmin(null);
      setConfirm(null);
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  const filteredData = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return admins;
    return admins.filter(
      (a) =>
        a.usuario.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q) ||
        a.empresa.toLowerCase().includes(q)
    );
  }, [admins, search]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageData = filteredData.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const total = admins.length;
  const activos = admins.filter((a) => a.estado === 'activo').length;
  const inactivos = total - activos;

  function handleCreateAdmin(e) {
    e.preventDefault();
    const usuario = form.usuario.trim();
    const password = form.password;
    const email = form.email.trim();
    const empresa = form.empresa.trim();
    const logo = form.logo.trim();
    const packStatusValue = form.pack ? '01' : '';
    const limiteTexto = form.limiteUsuarios.trim();

    if (!usuario || !password || !email || !empresa) {
      showToast('Completá todos los campos obligatorios', 'error');
      return;
    }
    if (admins.some((a) => a.usuario.toLowerCase() === usuario.toLowerCase())) {
      showToast(`El usuario "${usuario}" ya existe`, 'error');
      return;
    }
    if (!form.ilimitado && (limiteTexto === '' || !/^\d+$/.test(limiteTexto) || Number(limiteTexto) < 0)) {
      showToast('Ingresá el límite de créditos (un número entero) o marcá "Créditos ilimitados"', 'error');
      return;
    }
    const limiteUsuarios = form.ilimitado ? null : Number(limiteTexto);

    setConfirm({
      title: 'Crear Administrador',
      message: `¿Crear al administrador <strong>${sanitizeText(usuario)}</strong> para <strong>${sanitizeText(empresa)}</strong>?`,
      icon: 'create',
      btnClass: 'bg-gradient-to-r from-one-cyan/30 to-one-pink/30 border border-one-cyan/50',
      onConfirm: async () => {
        setOverlay({
          msg: `Creando administrador para ${empresa}...`,
          sub: 'Con Supabase esto tarda un segundo',
        });
        try {
          const nuevoAdmin = await createAdmin({
            usuario,
            password,
            email,
            packStatus: packStatusValue,
            nameEmpresa: empresa,
            logoLink: logo,
            limiteUsuarios,
          });

          // Si eligió un archivo, lo subimos ahora que ya existe el admin
          // y guardamos su URL de Storage en logo_empresa_link.
          if (formLogoFile) {
            setOverlay({ msg: 'Subiendo logo...', sub: '' });
            const logoUrl = await uploadLogo(nuevoAdmin.id, formLogoFile);
            await updateAdmin(nuevoAdmin.id, { logo_empresa_link: logoUrl });
          }

          showToast(`Administrador "${usuario}" creado. Plataforma ACTIVADA.`, 'success');
          setForm({ usuario: '', password: '', email: '', empresa: '', logo: '', pack: false, limiteUsuarios: '', ilimitado: false });
          setFormLogoFile(null);
          setFormLogoPreview('');
          loadAdmins();
        } catch (error) {
          console.error('Error al crear admin:', error);
          showToast('Error al crear administrador: ' + (error.message || ''), 'error');
        } finally {
          setOverlay(null);
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

  const ADMINS_FIELDS_CONFIG = [
    { key: 'usuario', label: 'Usuario', required: true, aliases: ['usuario', 'usuario_admin', 'user'] },
    { key: 'password', label: 'Contraseña', required: true, aliases: ['password', 'contraseña', 'contrasena', 'pass'] },
    { key: 'email', label: 'Email', required: true, aliases: ['email', 'correo', 'email_admin'] },
    { key: 'empresa', label: 'Empresa', required: true, aliases: ['empresa', 'nombre_empresa', 'name_empresa'] },
    {
      key: 'pack',
      label: 'Activar Pack Líder para todos',
      type: 'toggle',
      help: 'Se aplica a todos los administradores de esta carga, sin tocarlo después uno por uno.',
    },
  ];

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
      const lineNum = i + 2;
      const usuario = (cols[selection.usuario] || '').trim();
      const password = (cols[selection.password] || '').trim();
      const email = (cols[selection.email] || '').trim();
      const empresa = (cols[selection.empresa] || '').trim();
      const pack = !!selection.pack;

      if (!usuario && !password && !email && !empresa) return;

      if (!usuario || !password || !email || !empresa) {
        errors.push({ line: lineNum, usuario, motivo: 'Faltan campos obligatorios (usuario/contraseña/email/empresa)' });
        return;
      }
      const usuarioLower = usuario.toLowerCase();
      if (usuariosVistos.has(usuarioLower)) {
        errors.push({ line: lineNum, usuario, motivo: 'Usuario repetido dentro del mismo archivo' });
        return;
      }
      if (admins.some((a) => a.usuario.toLowerCase() === usuarioLower)) {
        errors.push({ line: lineNum, usuario, motivo: 'Ese usuario ya existe en la plataforma' });
        return;
      }
      usuariosVistos.add(usuarioLower);
      rows.push({ usuario, password, email, empresa, pack });
    });

    if (rows.length === 0) {
      showToast(
        errors[0]?.motivo ? `No se creó nada: ${errors[0].motivo}` : 'El archivo no tiene filas válidas',
        'error'
      );
      setBulkResult({ creados: 0, errores: errors.map((er) => ({ usuario: er.usuario || `línea ${er.line}`, motivo: er.motivo })) });
      return;
    }

    const resumenErrores =
      errors.length > 0
        ? `<br/><span class="text-yellow-400">${errors.length} fila(s) se van a omitir por error (usuario duplicado o datos faltantes).</span>`
        : '';

    setConfirm({
      title: 'Carga Masiva de Administradores',
      message: `Se van a crear <strong>${rows.length}</strong> administrador(es) nuevo(s) a partir del archivo.${resumenErrores}`,
      icon: 'create',
      btnClass: 'bg-gradient-to-r from-one-cyan/30 to-one-pink/30 border border-one-cyan/50',
      onConfirm: async () => {
        setBulkUploading(true);
        const erroresCarga = errors.map((er) => ({ usuario: er.usuario || `línea ${er.line}`, motivo: er.motivo }));
        let creados = 0;

        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          setOverlay({ msg: `Creando administradores... (${i + 1}/${rows.length})`, sub: row.empresa });
          try {
            await createAdmin({
              usuario: row.usuario,
              password: row.password,
              email: row.email,
              packStatus: row.pack ? '01' : '',
              nameEmpresa: row.empresa,
              logoLink: '',
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
            ? `${creados} administrador(es) creado(s), ${erroresCarga.length} con error`
            : `${creados} administrador(es) creado(s) correctamente`,
          erroresCarga.length > 0 && creados === 0 ? 'error' : 'success'
        );
        loadAdmins();
      },
    });
  }

  function handleEditSubmit(e) {
    e.preventDefault();
    const a = editAdmin;
    if (!a.email.trim()) {
      showToast('El Email es obligatorio', 'error');
      return;
    }
    setConfirm({
      title: 'Guardar Cambios',
      message: `¿Confirmas los cambios para <strong>${sanitizeText(a.usuario)}</strong>?`,
      icon: 'edit',
      btnClass: 'bg-gradient-to-r from-one-cyan/30 to-one-pink/30 border border-one-cyan/50',
      onConfirm: async () => {
        setEditAdmin(null);
        try {
          const fields = {
            email_admin: a.email.trim(),
            name_empresa: a.empresa.trim(),
            logo_empresa_link: a.logo.trim(),
          };
          if (a.password) fields.pass_admin = a.password;
          await updateAdmin(a.id, fields);
          showToast(`Administrador "${a.usuario}" actualizado correctamente`, 'success');
          loadAdmins();
        } catch (error) {
          console.error('Error al editar:', error);
          showToast('Error: ' + (error.message || 'Error desconocido'), 'error');
        }
      },
    });
  }

  function toggleAdminStatus(admin) {
    const nuevoEstado = admin.estado === 'activo' ? 'inactivo' : 'activo';
    const accionTexto = nuevoEstado === 'inactivo' ? 'inactivar' : 'activar';
    setConfirm({
      title: (nuevoEstado === 'inactivo' ? 'Inactivar' : 'Activar') + ' Administrador',
      message: `¿Deseas <strong>${sanitizeText(accionTexto)}</strong> al administrador <strong>${sanitizeText(admin.usuario)}</strong>?`,
      icon: nuevoEstado === 'inactivo' ? 'deactivate' : 'activate',
      btnClass:
        nuevoEstado === 'inactivo'
          ? 'bg-red-500/30 border border-red-500/50 text-red-300'
          : 'bg-green-500/30 border border-green-500/50 text-green-300',
      onConfirm: async () => {
        try {
          await updateAdmin(admin.id, { estado: nuevoEstado });
          showToast(`Estado de "${admin.usuario}" cambiado a ${nuevoEstado}`, 'success');
          loadAdmins();
        } catch (error) {
          showToast('Error: ' + (error.message || ''), 'error');
        }
      },
    });
  }

  function handleDeleteAdmin(admin) {
    setConfirm({
      title: 'Eliminar Administrador',
      message: `¿Eliminar permanentemente a <strong>${sanitizeText(admin.usuario)}</strong>? Esta acción no se puede deshacer.`,
      icon: 'delete',
      btnClass: 'bg-red-500/30 border border-red-500/50 text-red-300',
      onConfirm: async () => {
        try {
          await deleteAdmin(admin.id);
          showToast(`Administrador "${admin.usuario}" eliminado`, 'success');
          loadAdmins();
        } catch (error) {
          showToast('Error: ' + (error.message || ''), 'error');
        }
      },
    });
  }

  function resetAdminPassword(admin) {
    const nuevaPass = prompt(`Ingresá la nueva contraseña para ${admin.usuario}:`);
    if (!nuevaPass) return;
    setConfirm({
      title: 'Resetear Contraseña',
      message: `¿Confirmas el cambio de contraseña para <strong>${sanitizeText(admin.usuario)}</strong>?`,
      icon: 'edit',
      btnClass: 'bg-yellow-500/30 border border-yellow-500/50 text-yellow-300',
      onConfirm: async () => {
        try {
          await updateAdmin(admin.id, { pass_admin: nuevaPass });
          showToast(`Contraseña de "${admin.usuario}" actualizada`, 'success');
          loadAdmins();
        } catch (error) {
          showToast('Error: ' + (error.message || ''), 'error');
        }
      },
    });
  }

  function toggleAdminPack(admin, isEnabled) {
    const nuevoValor = isEnabled ? '01' : '';
    const textoAccion = isEnabled ? 'Habilitar gestión de Pack Líder' : 'Restringir gestión de Pack Líder';
    setConfirm({
      title: 'Modificar Permisos',
      message: `¿Deseas <strong>${sanitizeText(textoAccion)}</strong> para <strong>${sanitizeText(admin.usuario)}</strong>?`,
      icon: isEnabled ? 'activate' : 'deactivate',
      onConfirm: async () => {
        try {
          await updateAdmin(admin.id, { pack_status: nuevoValor });
          showToast(`Permisos de "${admin.usuario}" actualizados`, 'success');
          loadAdmins();
        } catch (error) {
          showToast('Error: ' + (error.message || ''), 'error');
        }
      },
    });
  }

  /** Abre el modal de créditos de un admin, precargado con su estado actual. */
  function abrirModalCreditos(admin) {
    setCreditosAdmin(admin);
    setCreditosForm({ ilimitado: admin.limiteUsuarios === null, sumar: '0' });
  }

  /** Guarda los cambios de créditos: pasa a ilimitado, o suma/resta al total actual. */
  function guardarCreditos(e) {
    e.preventDefault();
    const admin = creditosAdmin;

    if (creditosForm.ilimitado) {
      setConfirm({
        title: 'Créditos Ilimitados',
        message: `¿Dejar a <strong>${sanitizeText(admin.usuario)}</strong> con créditos <strong>ilimitados</strong>? Va a poder crear usuarios sin ningún límite.`,
        icon: 'edit',
        btnClass: 'bg-yellow-500/30 border border-yellow-500/50 text-yellow-300',
        onConfirm: async () => {
          setCreditosAdmin(null);
          try {
            await updateAdmin(admin.id, { limite_usuarios: null });
            showToast(`"${admin.usuario}" ahora tiene créditos ilimitados`, 'success');
            loadAdmins();
          } catch (error) {
            showToast('Error: ' + (error.message || ''), 'error');
          }
        },
      });
      return;
    }

    const delta = creditosForm.sumar.trim();
    if (!/^-?\d+$/.test(delta)) {
      showToast('Ingresá un número entero (positivo para sumar, negativo para restar)', 'error');
      return;
    }
    const base = admin.limiteUsuarios === null ? 0 : admin.limiteUsuarios;
    const nuevoLimite = Math.max(0, base + Number(delta));
    setConfirm({
      title: 'Actualizar Créditos',
      message:
        admin.limiteUsuarios === null
          ? `¿Asignarle un límite de <strong>${nuevoLimite}</strong> crédito(s) a <strong>${sanitizeText(admin.usuario)}</strong> (hoy ilimitado)?`
          : `<strong>${sanitizeText(admin.usuario)}</strong> pasa de <strong>${admin.limiteUsuarios}</strong> a <strong>${nuevoLimite}</strong> crédito(s) en total.`,
      icon: 'edit',
      btnClass: 'bg-gradient-to-r from-one-cyan/30 to-one-pink/30 border border-one-cyan/50',
      onConfirm: async () => {
        setCreditosAdmin(null);
        try {
          await updateAdmin(admin.id, { limite_usuarios: nuevoLimite });
          showToast(`Créditos de "${admin.usuario}" actualizados a ${nuevoLimite}`, 'success');
          loadAdmins();
        } catch (error) {
          showToast('Error: ' + (error.message || ''), 'error');
        }
      },
    });
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
                <img src="/img/one-logocolor.png" alt="Logo" className="h-full w-full object-contain" />
              </div>
              <div>
                <h2 className="bg-gradient-to-r from-one-cyan to-one-pink bg-clip-text font-title text-xl font-bold text-transparent">
                  Panel de Super Administrador
                </h2>
                <p className="text-xs text-one-slate">
                  {session ? `${session.userName} (${session.userEmail})` : 'Cargando...'}
                </p>
              </div>
            </div>
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
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        {/* Stats */}
        <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {[
            {
              value: total,
              label: 'Administradores',
              color: 'text-blue-400',
              border: 'border-blue-500/20',
              bg: 'from-blue-500/10 to-blue-600/10',
              iconBg: 'bg-blue-500/20',
              icon: (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              ),
            },
            {
              value: activos,
              label: 'Activos',
              color: 'text-green-400',
              border: 'border-green-500/20',
              bg: 'from-green-500/10 to-green-600/10',
              iconBg: 'bg-green-500/20',
              icon: (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <line x1="19" y1="8" x2="19" y2="14" />
                  <line x1="22" y1="11" x2="16" y2="11" />
                </svg>
              ),
            },
            {
              value: inactivos,
              label: 'Inactivos',
              color: 'text-red-400',
              border: 'border-red-500/20',
              bg: 'from-red-500/10 to-red-600/10',
              iconBg: 'bg-red-500/20',
              icon: (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <line x1="17" y1="8" x2="23" y2="14" />
                  <line x1="23" y1="8" x2="17" y2="14" />
                </svg>
              ),
            },
          ].map((s) => (
            <div
              key={s.label}
              className={`relative overflow-hidden rounded-2xl border ${s.border} bg-gradient-to-br ${s.bg} p-6 backdrop-blur-sm transition-all hover:-translate-y-1 hover:shadow-2xl`}
            >
              <div className="relative flex items-center gap-4">
                <div className={`flex h-16 w-16 items-center justify-center rounded-xl ${s.iconBg}`}>{s.icon}</div>
                <div>
                  <h3 className={`text-4xl font-black ${s.color}`}>{s.value}</h3>
                  <p className="mt-1 text-sm text-gray-400">{s.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Crear Admin */}
        <div className="mb-8 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl">
          <div className="border-b border-white/10 bg-gradient-to-r from-one-cyan/10 to-one-pink/10 px-6 py-4">
            <h3 className="font-title text-lg font-bold">Crear Nuevo Administrador</h3>
          </div>
          <form className="p-6" onSubmit={handleCreateAdmin}>
            <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-300">Usuario</label>
                <input
                  type="text"
                  className={inputClass}
                  placeholder="Ej: admin01"
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
                    placeholder="Contraseña segura"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                  />
                  <EyeButton
                    visible={formPassVisible}
                    onClick={() => setFormPassVisible(!formPassVisible)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-one-cyan"
                  />
                </div>
              </div>
            </div>

            <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-300">Email</label>
                <input
                  type="email"
                  className={inputClass}
                  placeholder="admin@ejemplo.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-300">Nombre de Empresa</label>
                <input
                  type="text"
                  className={inputClass}
                  placeholder="Ej: Acme Corp"
                  value={form.empresa}
                  onChange={(e) => setForm({ ...form, empresa: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="mb-2 block text-sm font-semibold text-gray-300">
                Logo de Empresa{' '}
                <span className="text-xs font-normal text-gray-500">(PNG/JPG, 400x400 recomendado)</span>
              </label>
              <LogoPicker
                previewUrl={formLogoPreview}
                onFileSelected={(file) => {
                  setFormLogoFile(file);
                  setFormLogoPreview(URL.createObjectURL(file));
                }}
              />
            </div>

            <div className="mb-6">
              <label className="mb-2 block text-sm font-semibold text-gray-300">
                Límite de Usuarios (créditos) <span className="text-xs font-normal text-gray-500">— 1 crédito = 1 usuario</span>
              </label>
              {!form.ilimitado && (
                <input
                  type="number"
                  min={0}
                  step={1}
                  className={inputClass + ' mb-3'}
                  placeholder="Ej: 10, 100, 300..."
                  value={form.limiteUsuarios}
                  onChange={(e) => setForm({ ...form, limiteUsuarios: e.target.value })}
                />
              )}
              <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-white/10 bg-white/5 p-3">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 shrink-0 accent-one-cyan"
                  checked={form.ilimitado}
                  onChange={(e) => setForm({ ...form, ilimitado: e.target.checked })}
                />
                <span className="text-sm">
                  <span className="font-semibold text-gray-200">Créditos ilimitados</span>
                  {form.ilimitado && (
                    <span className="mt-0.5 block text-xs text-yellow-400">
                      ⚠ Precaución: el administrador va a poder crear usuarios sin ningún límite.
                    </span>
                  )}
                </span>
              </label>
            </div>

            <div className="group mb-6 flex items-center justify-between rounded-2xl border border-one-cyan/20 bg-one-cyan/5 p-4 transition-all hover:border-one-cyan/40">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-one-cyan/10 text-one-cyan">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div>
                  <span className="block font-title text-sm font-bold uppercase tracking-wider text-white">
                    Habilitar Gestión de Paquetes
                  </span>
                  <span className="text-[11px] text-gray-400">
                    Permite asignar el Pack Líder (Manual Personalizado) a sus usuarios.
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
                <div className="peer h-6 w-11 rounded-full bg-gray-700 shadow-[0_0_15px_rgba(107,225,227,0.1)] after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-one-cyan peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none" />
              </label>
            </div>

            <button
              type="submit"
              className="group relative w-full overflow-hidden rounded-full border border-one-cyan/40 bg-gradient-to-r from-one-cyan/20 to-one-pink/20 px-8 py-3 font-bold transition-all hover:-translate-y-0.5 hover:border-one-cyan/60 hover:shadow-[0_20px_60px_rgba(107,225,227,0.4)] sm:w-auto"
            >
              <div className="absolute inset-0 -z-10 bg-gradient-to-r from-one-cyan/30 to-one-pink/30 opacity-50 blur-xl transition-opacity group-hover:opacity-80" />
              <span className="flex items-center justify-center gap-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Crear Administrador
              </span>
            </button>
          </form>
        </div>

        {/* Carga Masiva de Administradores (CSV) */}
        <div className="mb-8 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl">
          <div className="border-b border-white/10 bg-gradient-to-r from-one-cyan/10 to-one-pink/10 px-6 py-4">
            <h3 className="font-title text-lg font-bold">Carga Masiva de Administradores (CSV)</h3>
          </div>
          <div className="p-6">
            <p className="mb-4 text-sm text-gray-400">
              Subí tu archivo CSV, con las columnas que ya tengas (no hace falta un formato fijo): en el paso
              siguiente elegís vos qué columna corresponde a usuario, contraseña, email y empresa. El logo de
              cada empresa se agrega después, individualmente, desde editar.
            </p>
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
            </div>

            {bulkResult && (
              <div className="mt-5 rounded-xl border border-white/10 bg-black/30 p-4 text-sm">
                <div className="mb-2 flex items-center gap-2 font-semibold text-gray-200">
                  <CheckCircleIcon className="h-5 w-5 text-green-400" />
                  {bulkResult.creados} administrador(es) creado(s)
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

        {/* Tabla de Administradores */}
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl">
          <div className="border-b border-white/10 bg-gradient-to-r from-one-cyan/10 to-one-pink/10 px-6 py-4">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <h3 className="font-title text-lg font-bold">Lista de Administradores</h3>
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
                    placeholder="Buscar por usuario, empresa o email..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                  />
                </div>
                <button
                  className="flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold transition-all hover:bg-white/10"
                  onClick={loadAdmins}
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
                  {['Usuario', 'Empresa', 'Email', 'Pack', 'Créditos', 'Platform', 'Contraseña', 'Fecha', 'Estado', 'Acciones'].map(
                    (h, i) => (
                      <th
                        key={h}
                        className={`px-3 py-3 text-xs font-bold uppercase tracking-wider text-gray-300 ${
                          [3, 4, 5, 8, 9].includes(i) ? 'text-center' : 'text-left'
                        }`}
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {pageData.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="px-6 py-8 text-center text-gray-400">
                      {search.trim() ? `No se encontraron resultados para "${search.trim()}"` : 'Sin datos'}
                    </td>
                  </tr>
                ) : (
                  pageData.map((admin) => {
                    const isPackEnabled = admin.packStatus === '01' || admin.packStatus === '1';
                    return (
                      <tr
                        key={admin.id}
                        className={`transition-colors hover:bg-white/5 ${admin.estado === 'inactivo' ? 'opacity-60' : ''}`}
                      >
                        <td className="px-3 py-3">
                          <strong className="text-sm">{admin.usuario || '-'}</strong>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex min-w-[120px] items-center gap-2">
                            {admin.logo.length > 10 ? (
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/8 bg-white/6">
                                <img
                                  src={admin.logo}
                                  alt=""
                                  className="max-h-9 max-w-9 object-contain"
                                  onError={(e) => (e.target.parentElement.style.display = 'none')}
                                />
                              </div>
                            ) : (
                              <div className="h-10 w-10 shrink-0 rounded-lg border border-white/6 bg-white/4" />
                            )}
                            <span className="truncate text-sm font-semibold text-white">{admin.empresa || '-'}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <span className="block max-w-[180px] truncate text-sm text-gray-300">
                            {admin.email || '-'}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <label className="relative inline-flex scale-90 cursor-pointer items-center">
                              <input
                                type="checkbox"
                                className="peer sr-only"
                                checked={isPackEnabled}
                                onChange={(e) => toggleAdminPack(admin, e.target.checked)}
                              />
                              <div className="peer h-5 w-10 rounded-full bg-gray-700 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-one-cyan peer-checked:after:translate-x-full peer-checked:after:border-white" />
                            </label>
                            <span className={`text-[10px] font-bold ${isPackEnabled ? 'text-one-cyan' : 'text-gray-500'}`}>
                              {isPackEnabled ? 'ON' : 'OFF'}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => abrirModalCreditos(admin)}
                            title={
                              admin.limiteUsuarios === null
                                ? `${admin.consumidos} usuario(s) creado(s) — créditos ilimitados. Click para editar.`
                                : `Total: ${admin.limiteUsuarios} · Consumidos: ${admin.consumidos} · Disponibles: ${Math.max(0, admin.limiteUsuarios - admin.consumidos)}`
                            }
                            className={`inline-flex flex-col items-center gap-0.5 rounded-xl border px-2.5 py-1.5 text-center transition-all hover:-translate-y-0.5 ${
                              admin.limiteUsuarios === null
                                ? 'border-white/15 bg-white/5 text-gray-300 hover:border-white/25'
                                : admin.consumidos >= admin.limiteUsuarios
                                  ? 'border-red-500/40 bg-red-500/10 text-red-300 hover:border-red-500/60'
                                  : 'border-one-cyan/30 bg-one-cyan/10 text-one-cyan hover:border-one-cyan/50'
                            }`}
                          >
                            {admin.limiteUsuarios === null ? (
                              <span className="text-[11px] font-bold">Ilimitado</span>
                            ) : (
                              <>
                                <span className="text-xs font-black">
                                  {Math.max(0, admin.limiteUsuarios - admin.consumidos)} disp.
                                </span>
                                <span className="text-[10px] font-medium text-gray-500">
                                  {admin.consumidos}/{admin.limiteUsuarios} usados
                                </span>
                              </>
                            )}
                          </button>
                        </td>
                        <td className="px-3 py-3 text-center">
                          {/* Con base única Supabase todo admin queda activado al crearse */}
                          <span className="inline-flex items-center gap-1 rounded-full border border-one-cyan/30 bg-one-cyan/10 px-2 py-1 text-[10px] font-bold text-one-cyan">
                            <CheckCircleIcon className="h-3 w-3" /> ACTIVADO
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-1">
                            <span className="font-mono text-xs text-gray-300">
                              {visiblePass[admin.id] ? admin.password : '••••••'}
                            </span>
                            <EyeButton
                              visible={!!visiblePass[admin.id]}
                              onClick={() => setVisiblePass((v) => ({ ...v, [admin.id]: !v[admin.id] }))}
                              className="rounded p-1 text-gray-400 transition-colors hover:text-one-cyan"
                            />
                          </div>
                        </td>
                        <td className="px-3 py-3 text-xs text-gray-400">{formatDate(admin.fecha)}</td>
                        <td className="px-3 py-3 text-center">
                          <StatusBadge kind={admin.estado === 'activo' ? 'active' : 'inactive'}>
                            {admin.estado.charAt(0).toUpperCase() + admin.estado.slice(1)}
                          </StatusBadge>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex justify-center gap-1.5">
                            <button
                              className="rounded-lg border border-one-cyan/30 bg-one-cyan/10 p-2 text-one-cyan transition-all hover:bg-one-cyan/20"
                              onClick={() =>
                                setEditAdmin({
                                  id: admin.id,
                                  usuario: admin.usuario,
                                  email: admin.email,
                                  password: '',
                                  empresa: admin.empresa,
                                  logo: admin.logo,
                                })
                              }
                              title="Editar"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                            </button>
                            <button
                              className={
                                'rounded-lg border p-2 transition-all ' +
                                (admin.estado === 'activo'
                                  ? 'border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20'
                                  : 'border-green-500/30 bg-green-500/10 text-green-400 hover:bg-green-500/20')
                              }
                              onClick={() => toggleAdminStatus(admin)}
                              title={admin.estado === 'activo' ? 'Inactivar' : 'Activar'}
                            >
                              {admin.estado === 'activo' ? (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <circle cx="12" cy="12" r="10" />
                                  <line x1="15" y1="9" x2="9" y2="15" />
                                  <line x1="9" y1="9" x2="15" y2="15" />
                                </svg>
                              ) : (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                  <polyline points="22 4 12 14.01 9 11.01" />
                                </svg>
                              )}
                            </button>
                            <button
                              className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-2 text-yellow-400 transition-all hover:bg-yellow-500/20"
                              onClick={() => resetAdminPassword(admin)}
                              title="Reset contraseña"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                              </svg>
                            </button>
                            <button
                              className="rounded-lg border border-red-500/30 bg-red-500/10 p-2 text-red-400 transition-all hover:bg-red-500/20"
                              onClick={() => handleDeleteAdmin(admin)}
                              title="Eliminar"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>

            {filteredData.length > PAGE_SIZE && (
              <div className="flex flex-wrap items-center justify-center gap-2 border-t border-white/8 p-4">
                <span className="mr-2 text-xs text-one-slate">
                  Página {currentPage} de {totalPages} · {filteredData.length} admins
                </span>
                {currentPage > 1 && (
                  <button
                    onClick={() => setPage(currentPage - 1)}
                    className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white"
                  >
                    ← Anterior
                  </button>
                )}
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={
                      'rounded-full border px-2.5 py-1.5 text-xs ' +
                      (p === currentPage
                        ? 'border-one-cyan/50 bg-one-cyan/15 font-bold text-one-cyan'
                        : 'border-white/15 bg-white/5 text-white')
                    }
                  >
                    {p}
                  </button>
                ))}
                {currentPage < totalPages && (
                  <button
                    onClick={() => setPage(currentPage + 1)}
                    className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white"
                  >
                    Siguiente →
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal Editar Admin */}
      {editAdmin && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setEditAdmin(null)} />
          <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-br from-one-ink to-black shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-white/10 bg-gradient-to-r from-one-cyan/10 to-one-pink/10 px-6 py-4">
              <h3 className="font-title text-lg font-bold">Editar Administrador</h3>
              <button onClick={() => setEditAdmin(null)} className="text-gray-400 transition-colors hover:text-white">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <form className="max-h-[80vh] overflow-y-auto p-6" onSubmit={handleEditSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-300">
                    Usuario <span className="text-xs text-gray-500">(no editable)</span>
                  </label>
                  <input
                    type="text"
                    readOnly
                    tabIndex={-1}
                    value={editAdmin.usuario}
                    className="w-full cursor-not-allowed rounded-xl border border-white/5 bg-white/5 px-4 py-2.5 text-gray-400"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-300">Email</label>
                  <input
                    type="email"
                    className={inputClass}
                    value={editAdmin.email}
                    onChange={(e) => setEditAdmin({ ...editAdmin, email: e.target.value })}
                    required
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
                      value={editAdmin.password}
                      onChange={(e) => setEditAdmin({ ...editAdmin, password: e.target.value })}
                    />
                    <EyeButton
                      visible={editPassVisible}
                      onClick={() => setEditPassVisible(!editPassVisible)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-one-cyan"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-300">Nombre de Empresa</label>
                  <input
                    type="text"
                    className={inputClass}
                    placeholder="Ej: Acme Corp"
                    value={editAdmin.empresa}
                    onChange={(e) => setEditAdmin({ ...editAdmin, empresa: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-300">Logo de Empresa</label>
                  <LogoPicker
                    previewUrl={editAdmin.logo}
                    uploading={editLogoUploading}
                    onFileSelected={async (file) => {
                      setEditLogoUploading(true);
                      try {
                        const logoUrl = await uploadLogo(editAdmin.id, file);
                        setEditAdmin((prev) => (prev ? { ...prev, logo: logoUrl } : prev));
                        showToast('Logo subido. Guardá los cambios para confirmarlo.', 'success');
                      } catch (error) {
                        console.error('Error al subir logo:', error);
                        showToast('No se pudo subir el logo: ' + (error.message || ''), 'error');
                      } finally {
                        setEditLogoUploading(false);
                      }
                    }}
                  />
                  <p className="mt-1.5 text-[10px] text-gray-500">Se guarda en Supabase Storage.</p>
                </div>
                {/* Los campos de APIs de WebApp del original ya no existen:
                    la base única de Supabase reemplaza a los scripts por admin. */}
              </div>
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditAdmin(null)}
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

      {/* Modal Editar Créditos */}
      {creditosAdmin && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setCreditosAdmin(null)} />
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-br from-one-ink to-black shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-white/10 bg-gradient-to-r from-one-cyan/10 to-one-pink/10 px-6 py-4">
              <h3 className="font-title text-lg font-bold">Créditos de {creditosAdmin.usuario}</h3>
              <button onClick={() => setCreditosAdmin(null)} className="text-gray-400 transition-colors hover:text-white">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <form className="p-6" onSubmit={guardarCreditos}>
              <div className="mb-5 rounded-xl border border-white/10 bg-black/30 p-4 text-sm text-gray-300">
                {creditosAdmin.limiteUsuarios === null ? (
                  <span className="font-semibold text-gray-200">Hoy: créditos ilimitados</span>
                ) : (
                  <>
                    Hoy: <strong className="text-gray-200">{creditosAdmin.limiteUsuarios}</strong> total ·{' '}
                    <strong className="text-gray-200">{creditosAdmin.consumidos}</strong> usados ·{' '}
                    <strong className="text-one-cyan">{Math.max(0, creditosAdmin.limiteUsuarios - creditosAdmin.consumidos)}</strong> disponibles
                  </>
                )}
              </div>

              {!creditosForm.ilimitado && (
                <div className="mb-4">
                  <label className="mb-2 block text-sm font-semibold text-gray-300">Sumar créditos</label>
                  <input
                    type="number"
                    step={1}
                    className={inputClass}
                    placeholder="Ej: 10 (o -5 para restar)"
                    value={creditosForm.sumar}
                    onChange={(e) => setCreditosForm({ ...creditosForm, sumar: e.target.value })}
                  />
                  <p className="mt-1.5 text-[11px] text-gray-500">Positivo para sumar, negativo para restar del total actual.</p>
                </div>
              )}

              <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-white/10 bg-white/5 p-3">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 shrink-0 accent-one-cyan"
                  checked={creditosForm.ilimitado}
                  onChange={(e) => setCreditosForm({ ...creditosForm, ilimitado: e.target.checked })}
                />
                <span className="text-sm">
                  <span className="font-semibold text-gray-200">Créditos ilimitados</span>
                  {creditosForm.ilimitado && (
                    <span className="mt-0.5 block text-xs text-yellow-400">
                      ⚠ Precaución: el administrador va a poder crear usuarios sin ningún límite.
                    </span>
                  )}
                </span>
              </label>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setCreditosAdmin(null)}
                  className="flex-1 rounded-full border border-white/20 bg-white/5 px-6 py-2.5 text-sm font-semibold transition-all hover:bg-white/10"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-full border border-one-cyan/40 bg-gradient-to-r from-one-cyan/20 to-one-pink/20 px-6 py-2.5 text-sm font-bold transition-all hover:border-one-cyan/60"
                >
                  Guardar
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
          fieldsConfig={ADMINS_FIELDS_CONFIG}
          onCancel={() => setCsvMapping(null)}
          onConfirm={handleCsvMappingConfirm}
        />
      )}
      {overlay && <LoadingOverlay msg={overlay.msg} sub={overlay.sub} />}
      {ToastContainer}
      <Footer />
    </div>
  );
}
