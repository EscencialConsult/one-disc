/**
 * ⚙️ CONFIGURACIÓN CENTRAL DEL SISTEMA — ONE DISC
 * Réplica de Marca.js de la versión AppScript.
 * Las URLs de Google Apps Script fueron reemplazadas por Supabase
 * (ver src/lib/supabase.js). Las rutas ahora son rutas de React Router.
 */

export const CONFIG = {
  // 🎨 Identidad de Marca: ONE
  brand: {
    name: 'ONE — Evaluación DISC',
    logo: '/img/one-iconocolor.png',
    logoSecondary: '/img/one-logoletra.png',
    logoConsultora: '/img/escencial-logoblanco.png',
    colors: {
      primary: '#6be1e3',
      secondary: '#e17bd7',
      accent: '#e4c76a',
      background: '#000000',
      surface: '#1a181d',
      text: '#fefeff',
      muted: '#a4a8c0',
    },
    fonts: {
      title: "'Exo 2', sans-serif",
      body: 'var(--font-sub)',
    },
  },

  assessment: {
    title: 'Evaluación DISC con criterio profesional',
    subtitle: 'Plataforma de evaluación psicolaboral',
    copyright: '© 2026 Todos los derechos reservados',
  },

  roles: {
    SUPERADMIN: 'superadmin',
    ADMIN: 'admin',
    USER: 'user',
  },

  routes: {
    login: '/',
    superAdminDashboard: '/superadmin',
    adminDashboard: '/admin',
    rrhh: '/admin/rrhh',
    userboard: '/userboard',
    test: '/test',
    // El Informe se sirve como página estática (public/informe/) para mantener
    // su HTML+JS original intacto — es el módulo más delicado (PDF, gráficos).
    informe: '/informe/index.html',
  },

  system: {
    sessionTimeout: 3600000,
    defaultLanguage: 'es',
    dateFormat: 'DD/MM/YYYY',
  },
};

// Compatibilidad con los scripts legacy que leen window.CONFIG
if (typeof window !== 'undefined') {
  window.CONFIG = CONFIG;
}

export default CONFIG;
