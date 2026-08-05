/**
 * auth.js — Autenticación ONE Platform DISC (versión Supabase)
 * Réplica de js/auth.js (AppScript): misma lógica, mismos mensajes,
 * mismos roles. Cambia solo la fuente de datos: Google Sheets → Supabase.
 *
 * Mejora estructural: el login de USER pasa de iterar la planilla de cada
 * admin (N fetches) a UNA sola consulta con join a su admin.
 */
import { supabase } from './supabase.js';
import { CONFIG } from './config.js';
import { Session } from './session.js';

export const Auth = {
  async login(usuario, password, rol) {
    try {
      // ─── 1. SUPERADMIN (tabla superadmins) ─────────────────────
      if (rol === CONFIG.roles.SUPERADMIN) {
        const { data: superadmins, error } = await supabase
          .from('superadmins')
          .select('*')
          .eq('usuario', usuario.trim());

        if (error) {
          console.error('Error leyendo superadmins:', error);
          return { success: false, message: 'Error leyendo superadmins' };
        }

        const superadminEncontrado = (superadmins || []).find(
          (row) => String(row.password).trim() === String(password).trim()
        );

        if (!superadminEncontrado) {
          return { success: false, message: 'Credenciales inválidas' };
        }

        if (String(superadminEncontrado.estado || '').trim().toLowerCase() === 'inactivo') {
          return { success: false, message: 'Tu cuenta de superadmin está inactiva' };
        }

        Session.set({
          usuario: String(superadminEncontrado.usuario),
          email: String(superadminEncontrado.email || ''),
          password: String(superadminEncontrado.password),
          rol: CONFIG.roles.SUPERADMIN,
          packStatus: '01',
          superadminId: superadminEncontrado.id,
        });
        return { success: true };
      }

      // ─── 2. ADMIN ──────────────────────────────────────────────
      if (rol === CONFIG.roles.ADMIN) {
        const { data: admins, error } = await supabase
          .from('admins')
          .select('*')
          .eq('usuario_admin', usuario.trim());

        if (error) {
          console.error('Error leyendo administradores:', error);
          return { success: false, message: 'Error leyendo administradores' };
        }

        const adminEncontrado = (admins || []).find(
          (row) => String(row.pass_admin).trim() === String(password).trim()
        );

        if (!adminEncontrado) {
          return {
            success: false,
            message:
              'Credenciales inválidas. Verificá que el usuario y la contraseña estén escritos exactamente como fueron creados (respeta mayúsculas y minúsculas).',
          };
        }

        if (String(adminEncontrado.estado || '').trim().toLowerCase() === 'inactivo') {
          return { success: false, message: 'Tu cuenta de administrador está inactiva' };
        }

        Session.set({
          usuario: String(adminEncontrado.usuario_admin),
          email: String(adminEncontrado.email_admin),
          password: String(adminEncontrado.pass_admin),
          rol: CONFIG.roles.ADMIN,
          packStatus: String(adminEncontrado.pack_status || '').trim(),
          logoEmpresa: String(adminEncontrado.logo_empresa_link || '').trim(),
          nombreEmpresa: String(adminEncontrado.name_empresa || '').trim(),
          adminId: adminEncontrado.id,
          // Créditos: null/undefined = sin límite (ilimitado).
          limiteUsuarios:
            adminEncontrado.limite_usuarios === null || adminEncontrado.limite_usuarios === undefined
              ? null
              : Number(adminEncontrado.limite_usuarios),
        });
        return { success: true };
      }

      // ─── 3. USER — una sola consulta con join al admin dueño ───
      if (rol === CONFIG.roles.USER) {
        const { data: usuarios, error } = await supabase
          .from('usuarios')
          .select('*, admin:admins(*)')
          .ilike('usuario_user', usuario.trim());

        if (error) {
          console.error('Error de red al obtener usuarios:', error);
          return {
            success: false,
            message: 'Error de conexión. Verificá tu internet e intentá de nuevo.',
          };
        }

        // Usuario no distingue mayúsculas; contraseña sí (igual que el original)
        const userEncontrado = (usuarios || []).find(
          (row) =>
            String(row.usuario_user || '').trim().toLowerCase() ===
              String(usuario).trim().toLowerCase() &&
            String(row.pass_user || '').trim() === String(password).trim()
        );

        if (!userEncontrado) {
          return {
            success: false,
            message:
              'Usuario o contraseña incorrectos. El nombre de usuario no distingue mayúsculas, pero la contraseña sí.',
          };
        }

        if (String(userEncontrado.estado || '').trim().toLowerCase() === 'inactivo') {
          return { success: false, message: 'Tu cuenta está inactiva. Contactá a tu administrador.' };
        }

        const adminDueño = userEncontrado.admin || {};

        Session.set({
          usuario: String(userEncontrado.usuario_user),
          email: String(userEncontrado.email_user || ''),
          password: String(userEncontrado.pass_user),
          rol: CONFIG.roles.USER,
          userAdmin: String(adminDueño.usuario_admin || ''),
          emailAdmin: String(adminDueño.email_admin || ''),
          packStatus: String(userEncontrado.pack_status || '').trim(),
          logoEmpresa: String(adminDueño.logo_empresa_link || '').trim(),
          nombreEmpresa: String(adminDueño.name_empresa || '').trim(),
          adminId: adminDueño.id,
          userId: userEncontrado.id,
        });
        return { success: true };
      }

      return { success: false, message: 'Rol no válido' };
    } catch (error) {
      console.error('Error en login:', error);
      return { success: false, message: 'Error inesperado. Intentá de nuevo.' };
    }
  },

  logout() {
    Session.clear();
  },
};

export default Auth;
