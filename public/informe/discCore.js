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

  /**
   * Escala 0-100 por letra: (neto + 14) / 28 × 100.
   * OJO: el test es de elección forzada (ipsativo), así que Σ neto = 0 siempre
   * y por lo tanto las cuatro barras suman ~200 en toda persona (promedio 50).
   * Lo interpretable es la posición relativa de cada letra, no el valor absoluto.
   */
  function a100(x) { return Math.max(0, Math.min(100, Math.round(((x + PREGUNTAS_POR_PARTE) / (2 * PREGUNTAS_POR_PARTE)) * 100))); }
  function escala100(n) { const s = {}; LETRAS.forEach((L) => { s[L] = a100(n[L]); }); return s; }

  /**
   * Los dos ejes del modelo, calculados por separado. Son ortogonales: saber
   * uno NO determina el otro (D e I comparten ritmo pero no foco; I y S
   * comparten foco pero no ritmo). Cada par suma exactamente 100.
   *
   *   RITMO = D+I (activo)   vs  S+C (pausado)
   *   FOCO  = D+C (tareas)   vs  I+S (personas)
   *
   * Se calculan sobre el neto (MÁS − MENOS), igual que las letras, para que
   * todo el informe mida con el mismo insumo.
   */
  function ejes(n) {
    const activo = a100(n.D + n.I);
    const tareas = a100(n.D + n.C);
    return {
      ritmo: { activo, pausado: 100 - activo },
      foco: { tareas, personas: 100 - tareas },
    };
  }

  /** Letra dominante: mayor valor; empate → más elecciones MÁS; empate → orden D, I, S, C. */
  function dominante(valores, conteo) {
    return LETRAS.slice().sort((a, b) => {
      if (valores[b] !== valores[a]) return valores[b] - valores[a];
      if (conteo && conteo.mas[b] !== conteo.mas[a]) return conteo.mas[b] - conteo.mas[a];
      return LETRAS.indexOf(a) - LETRAS.indexOf(b);
    })[0];
  }

  /** Segunda letra por valor, excluyendo la principal (mismo criterio de empate que `dominante`). */
  function letraSecundaria(valores, principal, conteo) {
    return LETRAS.filter((L) => L !== principal).sort((a, b) => {
      if (valores[b] !== valores[a]) return valores[b] - valores[a];
      if (conteo && conteo.mas[b] !== conteo.mas[a]) return conteo.mas[b] - conteo.mas[a];
      return LETRAS.indexOf(a) - LETRAS.indexOf(b);
    })[0];
  }

  // Cortes iniciales de PROPUESTA_CONSISTENCIA_DISC.md §4, en preguntas (unidad del neto,
  // no de la escala 0-100). PENDIENTES DE CALIBRAR por simulación (§11 fase 7) antes de
  // usarse para decidir textos o para excluir a alguien de la distribución por letra en
  // RRHH — hoy son solo un dato adicional, aditivo, que nadie más lee todavía.
  const GAP_DEFINIDO = 5, GAP_MODERADO = 3, GAP_LEVE = 1;

  /** Nivel de definición del perfil según la distancia (en preguntas) entre principal y secundaria. */
  function nivelDefinicion(gap) {
    if (gap >= GAP_DEFINIDO) return 'definido';
    if (gap >= GAP_MODERADO) return 'moderado';
    if (gap >= GAP_LEVE) return 'leve';
    return 'mixto';
  }

  /** Etiqueta legible del perfil, coherente con el nivel de definición (no siempre una sola letra). */
  function etiquetaPerfil(principal, secundaria, nivel) {
    if (nivel === 'definido') return `Perfil ${principal}`;
    if (nivel === 'mixto') return 'Perfil mixto, sin letra dominante clara';
    const orden = LETRAS.indexOf(principal) <= LETRAS.indexOf(secundaria) ? `${principal}/${secundaria}` : `${secundaria}/${principal}`;
    if (nivel === 'moderado') return `Perfil ${orden} con predominio ${principal}`;
    return `Perfil combinado ${orden}`;
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

  // Un total bajo puede esconder que TODO el movimiento esté concentrado en
  // una sola letra (ej. total=10 con D:0,I:4,S:1,C:5 — casi todo es C e I).
  // Umbral inicial, no calibrado por simulación (igual que GAP_*): marca el
  // caso en que conviene nombrar la letra en vez de decir "sin cambios".
  const CONCENTRACION_MIN = 4;

  /** Estabilidad Natural vs Adaptado: suma de |Δ| en las 4 letras (usa MÁS y MENOS, porque ambos entran en el neto). */
  function estabilidad(netoNatural, netoAdaptado) {
    const porLetra = {}; let total = 0;
    LETRAS.forEach((L) => { porLetra[L] = Math.abs(netoNatural[L] - netoAdaptado[L]); total += porLetra[L]; });
    let nivel, titulo;
    if (total <= ESTABILIDAD.muyEstable) { nivel = 'muy_estable'; titulo = 'Perfil Muy Estable'; }
    else if (total <= ESTABILIDAD.nucleoEstable) { nivel = 'nucleo_estable'; titulo = 'Perfil Adaptable con Núcleo Estable'; }
    else { nivel = 'adaptacion_significativa'; titulo = 'Perfil con Adaptación Significativa'; }
    // Letra con mayor |Δ|; empate → orden D,I,S,C. Solo importa cuando el
    // perfil califica como 'muy_estable' pero ese máximo no es despreciable:
    // ahí el texto no debería decir "sin cambios" sin nombrar la excepción.
    const letraMax = LETRAS.slice().sort((a, b) => porLetra[b] - porLetra[a] || LETRAS.indexOf(a) - LETRAS.indexOf(b))[0];
    const concentrada = nivel === 'muy_estable' && porLetra[letraMax] >= CONCENTRACION_MIN;
    return { total, porLetra, nivel, titulo, letraMax, concentrada };
  }

  /** Cálculo completo de un test a partir de su detalle. */
  function calcular(detalle) {
    if (!tieneDetalle(detalle)) return null;
    const cN = conteos(detalle, PARTE1.desde, PARTE1.hasta);
    const cA = conteos(detalle, PARTE2.desde, PARTE2.hasta);
    const cT = conteos(detalle, 1, 28);
    const nN = neto(cN), nA = neto(cA), nT = neto(cT);
    const natural = { conteo: cN, neto: nN, valores: escala100(nN), polares: polares(nN), ...ejes(nN) };
    const adaptado = { conteo: cA, neto: nA, valores: escala100(nA), polares: polares(nA), ...ejes(nA) };
    natural.dominante = dominante(natural.valores, cN);
    adaptado.dominante = dominante(adaptado.valores, cA);
    natural.niveles = {}; LETRAS.forEach((L) => { natural.niveles[L] = nivelIntensidad(natural.valores[L]); });
    adaptado.niveles = {}; LETRAS.forEach((L) => { adaptado.niveles[L] = nivelIntensidad(adaptado.valores[L]); });
    // Campos aditivos de PROPUESTA_CONSISTENCIA_DISC.md §4 (nivel de definición). Nadie los
    // consume todavía — `dominante` sigue siendo el campo que leen los consumidores actuales.
    natural.principal = natural.dominante;
    natural.secundaria = letraSecundaria(natural.valores, natural.principal, cN);
    natural.gap = nN[natural.principal] - nN[natural.secundaria];
    natural.nivel_definicion = nivelDefinicion(natural.gap);
    natural.etiqueta = etiquetaPerfil(natural.principal, natural.secundaria, natural.nivel_definicion);
    adaptado.principal = adaptado.dominante;
    adaptado.secundaria = letraSecundaria(adaptado.valores, adaptado.principal, cA);
    adaptado.gap = nA[adaptado.principal] - nA[adaptado.secundaria];
    adaptado.nivel_definicion = nivelDefinicion(adaptado.gap);
    adaptado.etiqueta = etiquetaPerfil(adaptado.principal, adaptado.secundaria, adaptado.nivel_definicion);
    // Valores "globales" (28 preguntas). NO es un perfil: promediar calma y presión
    // describe a alguien que no existe (un D que bajo presión pasa a S no es "D-S
    // moderado"). Se conserva solo como dato de control, no se muestra en el informe.
    const valoresTotal = {}; LETRAS.forEach((L) => { valoresTotal[L] = Math.max(0, Math.min(100, Math.round(((nT[L] + 28) / 56) * 100))); });
    const niveles = {}; LETRAS.forEach((L) => { niveles[L] = nivelIntensidad(valoresTotal[L]); });
    return {
      natural, adaptado,
      total: { conteo: cT, neto: nT, valores: valoresTotal, niveles, dominante: dominante(valoresTotal, cT) },
      estabilidad: estabilidad(nN, nA),
      // Punto 3 del documento original / §5: mismos conteos que `natural.conteo` y
      // `adaptado.conteo`, con los nombres literales que pide el documento —
      // aditivo, para trazabilidad y auditoría manual, no reemplaza a `conteo`.
      variables: variablesLiterales(cN, cA, cT),
      version: 3,
    };
  }

  /** Variables MAS_D/MENOS_D.../P1_.../P2_... del documento original (§5), a partir
   *  de los conteos de Parte I, Parte II y total ya calculados por `calcular()`. */
  function variablesLiterales(cN, cA, cT) {
    const v = {};
    LETRAS.forEach((L) => {
      v[`MAS_${L}`] = cT.mas[L];
      v[`MENOS_${L}`] = cT.menos[L];
      v[`P1_MAS_${L}`] = cN.mas[L];
      v[`P1_MENOS_${L}`] = cN.menos[L];
      v[`P2_MAS_${L}`] = cA.mas[L];
      v[`P2_MENOS_${L}`] = cA.menos[L];
    });
    return v;
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
    GAP_DEFINIDO, GAP_MODERADO, GAP_LEVE,
    tieneDetalle, conteos, neto, escala100, dominante, letraSecundaria, nivelDefinicion, etiquetaPerfil,
    nivelIntensidad, polares, celda, rolPorAngulo, letraPorAngulo, estabilidad, calcular, detallePreguntas,
    variablesLiterales,
  };

  if (typeof window !== 'undefined') window.DISCCore = DISCCore;
  if (typeof module !== 'undefined' && module.exports) module.exports = DISCCore;
})();
