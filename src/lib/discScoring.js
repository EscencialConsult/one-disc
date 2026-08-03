/**
 * Utilidades para calcular el perfil D/I/S/C dominante de un test ya
 * completado, reusando el cálculo legacy de public/legacy/discToWheel.js
 * (nunca se reimplementa el puntaje acá — solo se parsea el string
 * guardado y se llama a window.discToWheel, igual que hace el Informe).
 */

/** Convierte el string crudo guardado en `respuestas` a { idPregunta: valor }. */
export function parseRespuestasDisc(respuestasString) {
  const map = {};
  if (!respuestasString) return map;

  const matchPI = respuestasString.match(/\{PI:\s*([^-]+)\s*-\s*([^}]+)\}/);
  if (matchPI) {
    matchPI[2].split(',').forEach((par) => {
      const [idStr, valStr] = par.trim().split(';');
      const id = parseInt(idStr, 10);
      const val = parseInt(valStr, 10);
      if (!isNaN(id) && !isNaN(val)) map[id] = val;
    });
  }

  const matchPII = respuestasString.match(/\{PII:\s*([^-]+)\s*-\s*([^}]+)\}/);
  if (matchPII) {
    matchPII[2].split(',').forEach((par) => {
      const [idStr, valStr] = par.trim().split(';');
      const id = parseInt(idStr, 10);
      const val = parseInt(valStr, 10);
      if (!isNaN(id) && !isNaN(val)) map[id] = val;
    });
  }

  return map;
}

/** Sectores de la rueda (idénticos a los de discToWheel.js): D=0-90°, I=90-180°, S=180-270°, C=270-360°. */
export function anguloADimension(angle) {
  const a = ((angle % 360) + 360) % 360;
  if (a < 90) return 'D';
  if (a < 180) return 'I';
  if (a < 270) return 'S';
  return 'C';
}

/**
 * Calcula el perfil dominante Natural y Adaptado de un test ya completado.
 * Requiere que public/legacy/discToWheel.js ya esté cargado (window.discToWheel).
 * Devuelve null si el string de respuestas está vacío o no se pudo parsear.
 */
export function calcularPerfilDominante(respuestasString) {
  if (!respuestasString || typeof window.discToWheel !== 'function') return null;
  const parsed = parseRespuestasDisc(respuestasString);
  if (Object.keys(parsed).length === 0) return null;

  const { natural, adaptado } = window.discToWheel(parsed);
  return {
    natural: anguloADimension(natural.angle),
    adaptado: anguloADimension(adaptado.angle),
  };
}
