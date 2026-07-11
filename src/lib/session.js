/**
 * Sesión — réplica exacta de la semántica de js/auth.js (versión AppScript):
 * mismas claves de sessionStorage, mismo timeout de 1 hora.
 * Los scripts legacy (pdfGenerator, Manual) leen estas mismas claves.
 */
import { CONFIG } from './config.js';

export const Session = {
  set(userData) {
    sessionStorage.setItem('isLoggedIn', 'true');
    sessionStorage.setItem('userRole', userData.rol);
    sessionStorage.setItem('userName', userData.usuario);
    sessionStorage.setItem('userEmail', userData.email);
    sessionStorage.setItem('userPassword', userData.password);
    sessionStorage.setItem('sessionStartTime', String(Date.now()));
    sessionStorage.setItem('packStatus', userData.packStatus || '');
    sessionStorage.setItem('logoEmpresa', userData.logoEmpresa || '');
    sessionStorage.setItem('nombreEmpresa', userData.nombreEmpresa || '');

    // IDs de Supabase (reemplazan a apiUsuarios/apiRespuestas/apiVisualizacion)
    if (userData.adminId) sessionStorage.setItem('adminId', userData.adminId);

    if (userData.rol === CONFIG.roles.USER) {
      sessionStorage.setItem('usuarioAdmin', userData.userAdmin || '');
      sessionStorage.setItem('emailAdmin', userData.emailAdmin || '');
      if (userData.userId) sessionStorage.setItem('userId', userData.userId);
    }
  },

  get() {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    if (!isLoggedIn) return null;

    const startTime = parseInt(sessionStorage.getItem('sessionStartTime') || '0', 10);
    if (Date.now() - startTime > CONFIG.system.sessionTimeout) {
      sessionStorage.clear();
      return null;
    }

    return {
      isLoggedIn: true,
      role: sessionStorage.getItem('userRole'),
      userName: sessionStorage.getItem('userName'),
      userEmail: sessionStorage.getItem('userEmail'),
      userPassword: sessionStorage.getItem('userPassword'),
      packStatus: sessionStorage.getItem('packStatus') || '',
      logoEmpresa: sessionStorage.getItem('logoEmpresa') || '',
      nombreEmpresa: sessionStorage.getItem('nombreEmpresa') || '',
      adminId: sessionStorage.getItem('adminId') || '',
      userId: sessionStorage.getItem('userId') || '',
      usuarioAdmin: sessionStorage.getItem('usuarioAdmin') || '',
      emailAdmin: sessionStorage.getItem('emailAdmin') || '',
    };
  },

  isAuthenticated() {
    return this.get() !== null;
  },

  clear() {
    sessionStorage.clear();
  },

  dashboardRoute() {
    const session = this.get();
    if (!session) return CONFIG.routes.login;
    if (session.role === CONFIG.roles.SUPERADMIN) return CONFIG.routes.superAdminDashboard;
    if (session.role === CONFIG.roles.ADMIN) return CONFIG.routes.adminDashboard;
    return CONFIG.routes.userboard;
  },
};

export default Session;
