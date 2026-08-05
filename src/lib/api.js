/**
 * Capa de datos — reemplaza las llamadas GET/POST a Google Apps Script.
 * Cada función replica una acción que antes resolvía el .gs.
 */
import { supabase } from './supabase.js';

/* ═══ RESPUESTAS (hoja "Respuestas") ═══ */

/**
 * Última respuesta de un usuario (era: GET apiVisualizacion?user=...).
 * Devuelve el mismo shape que consumía el frontend original.
 */
export async function getRespuestaByUser(userName, adminId) {
  let query = supabase
    .from('respuestas')
    .select('*')
    .ilike('usuario_user', String(userName || '').trim())
    .order('fecha', { ascending: false })
    .limit(1);
  if (adminId) query = query.eq('admin_id', adminId);

  const { data, error } = await query;
  if (error) throw error;
  if (!data || !data.length) return { success: false, data: null };
  return { success: true, data: mapRespuesta(data[0]) };
}

/** Todas las respuestas de un admin (para dashboards). */
export async function getRespuestasByAdmin(adminId) {
  const { data, error } = await supabase
    .from('respuestas')
    .select('*')
    .eq('admin_id', adminId)
    .order('fecha', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapRespuesta);
}

/** Guarda la fila del test (era: POST paso 1 → devuelve row y disc_id). */
export async function guardarRespuesta({
  adminId,
  usuarioAdmin,
  emailAdmin,
  usuarioUser,
  nombre,
  apellido,
  emailUser,
  respuestas,
}) {
  const { data, error } = await supabase
    .from('respuestas')
    .insert({
      admin_id: adminId || null,
      usuario_admin: usuarioAdmin || '',
      email_admin: emailAdmin || '',
      usuario_user: usuarioUser || '',
      nombre: nombre || 'SinNombre',
      apellido: apellido || 'SinApellido',
      email_user: emailUser || 'SinEmail',
      respuestas,
    })
    .select('id, disc_id')
    .single();
  if (error) throw error;
  return { success: true, row: data.id, disc_id: data.disc_id };
}

/** Sube el PDF del informe a Storage (era: POST accion=guardarPdf → Drive). */
export async function guardarPdf({ rowId, discId, pdfBase64, pdfNombre }) {
  const bytes = Uint8Array.from(atob(pdfBase64), (c) => c.charCodeAt(0));
  const path = `${discId || rowId}/${pdfNombre}`;

  const { error: uploadError } = await supabase.storage
    .from('informes')
    .upload(path, bytes, { contentType: 'application/pdf', upsert: true });
  if (uploadError) throw uploadError;

  const { error: updateError } = await supabase
    .from('respuestas')
    .update({ pdf_path: path })
    .eq('id', rowId);
  if (updateError) throw updateError;

  return { success: true, path };
}

/** URL pública de un PDF guardado. */
export function getPdfUrl(path) {
  if (!path) return '';
  return supabase.storage.from('informes').getPublicUrl(path).data.publicUrl;
}

/** Mapea una fila de Supabase al shape que consumía el frontend original. */
function mapRespuesta(row) {
  return {
    id: row.id,
    disc_id: row.disc_id,
    Fecha: row.fecha,
    Admin_Email: row.email_admin,
    Admin_Usuario: row.usuario_admin,
    User: row.usuario_user,
    Nombre: row.nombre,
    Apellido: row.apellido,
    Email_User: row.email_user,
    Respuestas: row.respuestas,
    Puntajes: row.puntajes,
    Perfil_Dominante: row.perfil_dominante,
    Perfil: row.perfil_dominante,
    pdf_path: row.pdf_path,
  };
}

/* ═══ ADMINS (hoja "Admins") ═══ */

export async function getAdmins() {
  const { data, error } = await supabase
    .from('admins')
    .select('*')
    .order('fecha_alta', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function createAdmin({ usuario, password, email, packStatus, nameEmpresa, logoLink, limiteUsuarios }) {
  const { data, error } = await supabase
    .from('admins')
    .insert({
      usuario_admin: usuario,
      pass_admin: password,
      email_admin: email,
      pack_status: packStatus || '',
      name_empresa: nameEmpresa || '',
      logo_empresa_link: logoLink || '',
      limite_usuarios: limiteUsuarios ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateAdmin(id, fields) {
  const { data, error } = await supabase.from('admins').update(fields).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteAdmin(id) {
  const { error } = await supabase.from('admins').delete().eq('id', id);
  if (error) throw error;
  return { success: true };
}

/** Sube el logo de una empresa a Storage y devuelve la URL pública (reemplaza al link externo). */
export async function uploadLogo(adminId, file) {
  const ext = (file.name.split('.').pop() || 'png').toLowerCase();
  const path = `${adminId}/logo.${ext}`;

  const { error } = await supabase.storage
    .from('logos')
    .upload(path, file, { contentType: file.type || 'image/png', upsert: true });
  if (error) throw error;

  // Cache-bust: mismo path siempre, así que sumamos ?t= para que el navegador
  // no muestre el logo viejo cuando se reemplaza.
  const { data } = supabase.storage.from('logos').getPublicUrl(path);
  return `${data.publicUrl}?t=${Date.now()}`;
}

/**
 * Cuántos usuarios (créditos consumidos) tiene cada admin — una sola consulta
 * liviana (trae solo la columna admin_id) en vez de N consultas, una por admin.
 */
export async function getUsuarioCountsByAdmin() {
  const { data, error } = await supabase.from('usuarios').select('admin_id');
  if (error) throw error;
  const counts = {};
  (data || []).forEach((row) => {
    counts[row.admin_id] = (counts[row.admin_id] || 0) + 1;
  });
  return counts;
}

/* ═══ USUARIOS (hoja "Usuarios") ═══ */

export async function getUsuariosByAdmin(adminId) {
  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('admin_id', adminId)
    .order('fecha_alta', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function createUsuario({ adminId, usuario, password, email, nombre, packStatus }) {
  const { data, error } = await supabase
    .from('usuarios')
    .insert({
      admin_id: adminId,
      usuario_user: usuario,
      pass_user: password,
      email_user: email || '',
      nombre: nombre || '',
      pack_status: packStatus || '',
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateUsuario(id, fields) {
  const { data, error } = await supabase.from('usuarios').update(fields).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteUsuario(id) {
  const { error } = await supabase.from('usuarios').delete().eq('id', id);
  if (error) throw error;
  return { success: true };
}
