/**
 * discCore.js — Núcleo único de cálculo DISC (Fase 2 del PLAN_ARREGLO_DISC.md)
 *
 * Trabaja SOLO sobre el `detalle` de un test: la letra real (D/I/S/C) que la
 * persona eligió como MÁS y como MENOS en cada una de las 28 preguntas:
 *   { "1": { "mas": "D", "menos": "S" }, ..., "28": { ... } }
 *
 * Los tests guardados antes de este cambio no tienen `detalle` (se guardó
 * solo "lado D/I" o "lado S/C", ver AUDITORIA_DISC_COMRURAL.md). Para esos,
 * cada consumidor sigue usando su cálculo anterior; este archivo no lo
 * reemplaza — lo evita cuando no hay dato.
 *
 * Lo usan el Informe (script.js), el PDF (pdfGenerator.js), la rueda
 * (discToWheel.js) y el Panel RRHH (src/lib/discScoring.js). Copia idéntica
 * en public/legacy/ (la carga TestDisc.jsx).
 */
(function () {
  'use strict';

  const LETRAS = ['D', 'I', 'S', 'C'];
  const NOMBRES = { D: 'Dominancia', I: 'Influencia', S: 'Estabilidad', C: 'Cumplimiento' };
  const PARTE1 = { desde: 1, hasta: 14 };   // Natural
  const PARTE2 = { desde: 15, hasta: 28 };  // Adaptado
  const PREGUNTAS_POR_PARTE = 14;

  // Sectores de la rueda (idénticos a discToWheel.js): D=0-90°, I=90-180°, S=180-270°, C=270-360°.
  const SECTOR_CENTRO = { D: 45, I: 135, S: 225, C: 315 };
  // 8 roles de 45° desde arriba, en sentido horario (idéntico a ruedaSuccessInsights5niveles.js).
  const ROLES = ['CONDUCTOR', 'PERSUASOR', 'PROMOTOR', 'RELACIONADOR', 'COLABORADOR', 'COORDINADOR', 'ANALIZADOR', 'IMPLEMENTADOR'];

  // Umbrales validados por simulación (7/9/2026, ver PLAN_ARREGLO_DISC.md Fase 6).
  const UMBRAL_PREDOMINANTE = 60;   // sobre la escala 0-100 por letra (sobre el total de 28 preguntas equivale a un neto MÁS−MENOS ≥ +6)
  const UMBRAL_BAJO = 40;
  const ESTABILIDAD = { muyEstable: 10, nucleoEstable: 20 }; // suma de |Natural − Adaptado| en las 4 letras (0–56, siempre par)

  function esLetra(x) { return LETRAS.indexOf(x) !== -1; }

  /** true si el test trae el dato nuevo completo (28 preguntas con MÁS y MENOS válidos). */
  function tieneDetalle(detalle) {
    if (!detalle || typeof detalle !== 'object') return false;
    for (let q = 1; q <= 28; q++) {
      const d = detalle[q] || detalle[String(q)];
      if (!d || !esLetra(d.mas) || !esLetra(d.menos) || d.mas === d.menos) return false;
    }
    return true;
  }

  function get(detalle, q) { return detalle[q] || detalle[String(q)]; }

  /** Conteo de MÁS y MENOS por letra en un rango de preguntas. */
  function conteos(detalle, desde, hasta) {
    const mas = { D: 0, I: 0, S: 0, C: 0 }, menos = { D: 0, I: 0, S: 0, C: 0 };
    for (let q = desde; q <= hasta; q++) { const d = get(detalle, q); mas[d.mas]++; menos[d.menos]++; }
    return { mas, menos };
  }

  /** Neto por letra (MÁS − MENOS), de −14 a +14 por parte. */
  function neto(c) { const n = {}; LETRAS.forEach((L) => { n[L] = c.mas[L] - c.menos[L]; }); return n; }

  /** Escala 0-100 independiente por letra: (neto + 14) / 28 × 100. Las cuatro NO suman 100. */
  function a100(x) { return Math.max(0, Math.min(100, Math.round(((x + PREGUNTAS_POR_PARTE) / (2 * PREGUNTAS_POR_PARTE)) * 100))); }
  function escala100(n) { const s = {}; LETRAS.forEach((L) => { s[L] = a100(n[L]); }); return s; }

  /** Letra dominante: mayor valor; empate → más elecciones MÁS; empate → orden D, I, S, C. */
  function dominante(valores, conteo) {
    return LETRAS.slice().sort((a, b) => {
      if (valores[b] !== valores[a]) return valores[b] - valores[a];
      if (conteo && conteo.mas[b] !== conteo.mas[a]) return conteo.mas[b] - conteo.mas[a];
      return LETRAS.indexOf(a) - LETRAS.indexOf(b);
    })[0];
  }

  function nivelIntensidad(v100) {
    if (v100 >= UMBRAL_PREDOMINANTE) return 'Predominante';
    if (v100 >= UMBRAL_BAJO) return 'Moderada';
    return 'Baja';
  }

  /**
   * Coordenadas polares por MEDIA CIRCULAR (suma de vectores), no promedio
   * lineal de ángulos. Pesos = neto − mínimo (la letra más débil pesa 0),
   * misma normalización que usaba discToWheel.js. Radio = |resultante| / 28.
   */
  function polares(n) {
    const min = Math.min(n.D, n.I, n.S, n.C);
    let x = 0, y = 0, suma = 0;
    LETRAS.forEach((L) => {
      const w = n[L] - min; suma += w;
      const rad = (SECTOR_CENTRO[L] * Math.PI) / 180;
      x += w * Math.cos(rad); y += w * Math.sin(rad);
    });
    if (suma === 0) return { angle: 0, radius: 0, cell: 57, rol: ROLES[0] };
    let angle = (Math.atan2(y, x) * 180) / Math.PI; if (angle < 0) angle += 360;
    const radius = Math.min(Math.sqrt(x * x + y * y) / (2 * PREGUNTAS_POR_PARTE), 1);
    return { angle, radius, cell: celda(radius, angle), rol: rolPorAngulo(angle) };
  }

  /**
   * Celda de la rueda, con la MISMA numeración con que la dibuja
   * ruedaSuccessInsights5niveles.js: en los niveles de 16 cuñas la primera
   * cuña (0-22,5°) es base+1 y la última (337,5-360°) es la base.
   */
  function celda(radius, angle) {
    let cuñas, base;
    if (radius < 0.2) { cuñas = 4; base = 57; }
    else if (radius < 0.4) { cuñas = 16; base = 41; }
    else if (radius < 0.6) { cuñas = 16; base = 25; }
    else if (radius < 0.8) { cuñas = 16; base = 9; }
    else { cuñas = 8; base = 1; }
    const i = Math.floor((((angle % 360) + 360) % 360) / (360 / cuñas)) % cuñas;
    if (cuñas === 16) return i === 15 ? base : base + i + 1;
    return base + i;
  }

  function rolPorAngulo(angle) { return ROLES[Math.floor((((angle % 360) + 360) % 360) / 45) % 8]; }
  function letraPorAngulo(angle) { const a = ((angle % 360) + 360) % 360; return a < 90 ? 'D' : a < 180 ? 'I' : a < 270 ? 'S' : 'C'; }

  /** Estabilidad Natural vs Adaptado: suma de |Δ| en las 4 letras (usa MÁS y MENOS, porque ambos entran en el neto). */
  function estabilidad(netoNatural, netoAdaptado) {
    const porLetra = {}; let total = 0;
    LETRAS.forEach((L) => { porLetra[L] = Math.abs(netoNatural[L] - netoAdaptado[L]); total += porLetra[L]; });
    let nivel, titulo;
    if (total <= ESTABILIDAD.muyEstable) { nivel = 'muy_estable'; titulo = 'Perfil Muy Estable'; }
    else if (total <= ESTABILIDAD.nucleoEstable) { nivel = 'nucleo_estable'; titulo = 'Perfil Adaptable con Núcleo Estable'; }
    else { nivel = 'adaptacion_significativa'; titulo = 'Perfil con Adaptación Significativa'; }
    return { total, porLetra, nivel, titulo };
  }

  /** Cálculo completo de un test a partir de su detalle. */
  function calcular(detalle) {
    if (!tieneDetalle(detalle)) return null;
    const cN = conteos(detalle, PARTE1.desde, PARTE1.hasta);
    const cA = conteos(detalle, PARTE2.desde, PARTE2.hasta);
    const cT = conteos(detalle, 1, 28);
    const nN = neto(cN), nA = neto(cA), nT = neto(cT);
    const natural = { conteo: cN, neto: nN, valores: escala100(nN), polares: polares(nN) };
    const adaptado = { conteo: cA, neto: nA, valores: escala100(nA), polares: polares(nA) };
    natural.dominante = dominante(natural.valores, cN);
    adaptado.dominante = dominante(adaptado.valores, cA);
    // Valores "globales" (28 preguntas) para el gráfico de barras del informe: neto total de −28 a +28.
    const valoresTotal = {}; LETRAS.forEach((L) => { valoresTotal[L] = Math.max(0, Math.min(100, Math.round(((nT[L] + 28) / 56) * 100))); });
    const niveles = {}; LETRAS.forEach((L) => { niveles[L] = nivelIntensidad(valoresTotal[L]); });
    return {
      natural, adaptado,
      total: { conteo: cT, neto: nT, valores: valoresTotal, niveles, dominante: dominante(valoresTotal, cT) },
      estabilidad: estabilidad(nN, nA),
      version: 2,
    };
  }

  /** Detalle enriquecido pregunta por pregunta (palabra elegida como MÁS y como MENOS). */
  function detallePreguntas(detalle, preguntas) {
    const out = [];
    for (let q = 1; q <= 28; q++) {
      const d = get(detalle, q);
      // `preguntas` puede ser un mapa {1: {...}} (script.js) o un array con .id (TestDisc/pdfGenerator)
      const g = Array.isArray(preguntas)
        ? (preguntas.find((p) => p && p.id === q) || preguntas[q - 1] || {})
        : (preguntas[q] || {});
      out.push({
        numero: q, parte: q <= 14 ? 'I' : 'II',
        textoD: g.D || '', textoI: g.I || '', textoS: g.S || '', textoC: g.C || '',
        masLetra: d.mas, menosLetra: d.menos,
        masPalabra: g[d.mas] || d.mas, menosPalabra: g[d.menos] || d.menos,
        masGrupo: d.mas === 'D' || d.mas === 'I' ? 'D/I' : 'S/C',
        menosGrupo: d.menos === 'D' || d.menos === 'I' ? 'D/I' : 'S/C',
      });
    }
    return out;
  }

  const DISCCore = {
    LETRAS, NOMBRES, ROLES, SECTOR_CENTRO, UMBRAL_PREDOMINANTE, UMBRAL_BAJO, ESTABILIDAD,
    tieneDetalle, conteos, neto, escala100, dominante, nivelIntensidad, polares, celda, rolPorAngulo, letraPorAngulo, estabilidad, calcular, detallePreguntas,
  };

  if (typeof window !== 'undefined') window.DISCCore = DISCCore;
  if (typeof module !== 'undefined' && module.exports) module.exports = DISCCore;
})();
