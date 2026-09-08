/**
 * ============================================================================
 * SISTEMA DE INFORME DISC — Cliente Web
 * Porta toda la lógica del código.gs a JavaScript del navegador.
 * Lee datos de sessionStorage (discUserData) y genera el informe interactivo.
 * ============================================================================
 */

// ============================================================================
// CONSTANTES Y DATOS DEL MODELO DISC
// ============================================================================

const GRUPOS_DISC = {
  1:  { D:"Enérgico",       I:"Animado",          S:"Plácido",       C:"Preciso" },
  2:  { D:"Competitivo",    I:"Expresivo",         S:"Leal",          C:"Diplomático" },
  3:  { D:"Directo",        I:"Alentador",         S:"Bondadoso",     C:"Meticuloso" },
  4:  { D:"Atrevido",       I:"Encantador",        S:"Amable",        C:"Sistemático" },
  5:  { D:"Decidido",       I:"Optimista",         S:"Sereno",        C:"Perfeccionista" },
  6:  { D:"Audaz",          I:"Comunicativo",      S:"Paciente",      C:"Reflexivo" },
  7:  { D:"Exigente",       I:"Entusiasta",        S:"Cooperativo",   C:"Lógico" },
  8:  { D:"Dominante",      I:"Popular",           S:"Tolerante",     C:"Analítico" },
  9:  { D:"Arriesgado",     I:"Sociable",          S:"Confiable",     C:"Detallista" },
  10: { D:"Firme",          I:"Persuasivo",        S:"Moderado",      C:"Cauteloso" },
  11: { D:"Orientado a resultados", I:"Entusiasta", S:"Colaborador",  C:"Ordenado" },
  12: { D:"Emprendedor",    I:"Inspirador",        S:"Estable",       C:"Cuidadoso" },
  13: { D:"Desafiante",     I:"Influyente",        S:"Servicial",     C:"Organizado" },
  14: { D:"Impaciente",     I:"Extrovertido",      S:"De apoyo",      C:"Metódico" },
  15: { D:"Independiente",  I:"Amigable",          S:"Moderado",      C:"Convencional" },
  16: { D:"Asertivo",       I:"Estimulante",       S:"Comprensivo",   C:"Reservado" },
  17: { D:"Determinado",    I:"Positivo",          S:"Paciente",      C:"Controlado" },
  18: { D:"Agresivo",       I:"Afectuoso",         S:"Receptivo",     C:"Perfeccionista" },
  19: { D:"Decisiones rápidas", I:"Sociable",      S:"Considerado",   C:"Meticuloso" },
  20: { D:"Líder nato",     I:"Promotor",          S:"Consistente",   C:"Formal" },
  21: { D:"Pragmático",     I:"Emocional",         S:"Conciliador",   C:"Normativo" },
  22: { D:"Obstinado",      I:"Confiado",          S:"Tolerante",     C:"Evasivo" },
  23: { D:"Inflexible",     I:"Egocéntrico",       S:"Indeciso",      C:"Terco" },
  24: { D:"Argumentador",   I:"Descuidado",        S:"Dubitativo",    C:"Quisquilloso" },
  25: { D:"Impulsivo",      I:"Imprudente",        S:"Tímido",        C:"Crítico" },
  26: { D:"Intolerante",    I:"Poco organizado",   S:"Pasivo",        C:"Pesimista" },
  27: { D:"Insensible",     I:"Hablador",          S:"Sin ambición",  C:"Distante" },
  28: { D:"Dominante",      I:"Desordenado",       S:"Dependiente",   C:"Desconfiado" }
};

const PERFILES_DISC = {
  D: {
    nombre: "Dominancia", letra: "D", color: "#dc2626", colorFondo: "#fef2f2", icono: "🎯",
    breve: "Orientado a resultados, directo y decidido",
    pregunta_clave: "¿QUÉ? — Enfocado en resultados y acción",
    descripcion_completa: "Las personas con alta Dominancia (D) se caracterizan por ser directas, decididas y orientadas a resultados. Les gusta tener el control, enfrentan desafíos con determinación y toman decisiones con rapidez. Son competitivas y buscan alcanzar objetivos de manera eficiente. Lideran con firmeza y se destacan en contextos que requieren acción inmediata y gestión bajo presión.",
    motivadores: "Poder, autoridad, competencia, desafíos, resultados tangibles, oportunidades de avance, autonomía.",
    fortalezas: "Liderazgo natural, toma de decisiones ágil, resolución de problemas, orientación a resultados, visión estratégica.",
    areas_mejora: "Puede ser percibido como impaciente, insensible o autoritario. Tendencia a pasar por alto detalles y descuidar necesidades emocionales del equipo.",
    bajo_presion: "Puede volverse agresivo, impaciente, intolerante con errores e imponer su voluntad sin considerar alternativas.",
    entorno_ideal: "Entornos dinámicos y competitivos, con desafíos constantes, autonomía y oportunidades de avance rápido."
  },
  I: {
    nombre: "Influencia", letra: "I", color: "#d97706", colorFondo: "#fffbeb", icono: "🌟",
    breve: "Entusiasta, sociable y persuasivo",
    pregunta_clave: "¿QUIÉN? — Enfocado en personas y relaciones",
    descripcion_completa: "Las personas con alta Influencia (I) son extrovertidas, optimistas y persuasivas. Disfrutan socializar, influir en otros y crear un ambiente positivo. Son comunicativas y les motiva el reconocimiento social. Generan entusiasmo y cohesión en los equipos, son creativas y excelentes para promover proyectos.",
    motivadores: "Reconocimiento social, popularidad, relaciones, trabajo en equipo, libertad de expresión, ambiente positivo.",
    fortalezas: "Comunicación excepcional, persuasión, trabajo en equipo, creatividad, networking, motivar a otros.",
    areas_mejora: "Puede ser percibido como desorganizado o impulsivo. Tendencia a priorizar popularidad sobre productividad y evitar confrontaciones.",
    bajo_presion: "Puede volverse desorganizado, superficial, demasiado emocional y buscar aprobación a toda costa.",
    entorno_ideal: "Entornos colaborativos con interacción frecuente, reconocimiento público, flexibilidad y ambiente optimista."
  },
  S: {
    nombre: "Estabilidad", letra: "S", color: "#059669", colorFondo: "#f0fdf4", icono: "🤝",
    breve: "Paciente, leal y colaborador",
    pregunta_clave: "¿CÓMO? — Enfocado en procesos y cooperación",
    descripcion_completa: "Las personas con alta Estabilidad (S) son pacientes, leales y orientadas al equipo. Valoran la estabilidad y previsibilidad, son confiables y prefieren ambientes armoniosos. Se destacan por mantener la calma en situaciones difíciles, mediar en conflictos y generar un clima de trabajo seguro.",
    motivadores: "Seguridad, estabilidad, relaciones armoniosas, reconocimiento sincero, tiempo para adaptarse.",
    fortalezas: "Lealtad excepcional, paciencia, escucha activa, consistencia, mediación, perseverancia.",
    areas_mejora: "Puede ser percibido como resistente al cambio o indeciso. Dificultad para establecer límites y adaptación lenta.",
    bajo_presion: "Puede volverse pasivo, indeciso, excesivamente complaciente y resistente a cualquier cambio.",
    entorno_ideal: "Entornos estables con relaciones a largo plazo, roles definidos, tiempo para adaptarse y liderazgo comprensivo."
  },
  C: {
    nombre: "Cumplimiento", letra: "C", color: "#2563eb", colorFondo: "#eff6ff", icono: "📋",
    breve: "Analítico, preciso y metódico",
    pregunta_clave: "¿POR QUÉ? — Enfocado en calidad y precisión",
    descripcion_completa: "Las personas con alto Cumplimiento (C) son analíticas, precisas y orientadas a la calidad. Valoran la exactitud, siguen procedimientos y buscan la perfección. Son detallistas y sistemáticas, con capacidad de análisis profundo, pensamiento crítico y habilidad para identificar problemas antes de que ocurran.",
    motivadores: "Calidad, precisión, estándares altos, información detallada, tiempo para analizar, procedimientos claros.",
    fortalezas: "Análisis profundo, precisión técnica, control de calidad, planificación detallada, pensamiento crítico.",
    areas_mejora: "Puede ser percibido como excesivamente crítico o distante. Parálisis por análisis, perfeccionismo excesivo.",
    bajo_presion: "Puede volverse excesivamente crítico, pesimista, aislado y obsesionado con detalles, perdiendo visión global.",
    entorno_ideal: "Entornos estructurados con estándares claros, tiempo para análisis, acceso a datos y valoración de la precisión."
  }
};

const TEXTOS_NIVEL = {
  "Muy Alto": {
    color: "#dc2626", icono: "🔴",
    textoMas: "La persona se identifica de forma muy marcada con este grupo de características, seleccionándolas como las que MÁS la describen en la gran mayoría de las situaciones. Esto indica una fuerte afinidad natural con estos rasgos conductuales.",
    textoMenos: "La persona rechaza de forma muy marcada este grupo de características, indicando una baja afinidad natural con estos rasgos."
  },
  "Alto": {
    color: "#ea580c", icono: "🟠",
    textoMas: "La persona muestra una identificación notable con este grupo de características, indicando una preferencia conductual clara.",
    textoMenos: "La persona tiende a rechazar este grupo de características con frecuencia notable."
  },
  "Moderado": {
    color: "#ca8a04", icono: "🟡",
    textoMas: "La persona muestra una identificación equilibrada, sugiriendo flexibilidad para activar estos rasgos según el contexto.",
    textoMenos: "La persona rechaza en nivel moderado, sugiriendo una relación flexible con estos rasgos."
  },
  "Bajo": {
    color: "#2563eb", icono: "🔵",
    textoMas: "La persona se identifica poco con este grupo de características, orientando su perfil hacia otros ejes DISC.",
    textoMenos: "La persona rechaza poco este grupo, indicando cierta comodidad o tolerancia con estos rasgos."
  },
  "Muy Bajo": {
    color: "#059669", icono: "🟢",
    textoMas: "La persona prácticamente no se identifica con estas características. Su perfil se orienta claramente hacia el grupo opuesto.",
    textoMenos: "La persona casi nunca rechaza estas características, sugiriendo alta afinidad natural."
  }
};

const TEXTOS_CONSISTENCIA = {
  consistente_DI: {
    titulo: "✅ Perfil Consistente: Orientación Activa/Extrovertida (D-I)",
    texto: "Existe alta consistencia en el perfil: las características MÁS representativas (D/I) son complementarias con las MENOS representativas (S/C). Esto indica autoconocimiento claro y un patrón conductual definido hacia la acción, el liderazgo y la comunicación."
  },
  consistente_SC: {
    titulo: "✅ Perfil Consistente: Orientación Reservada/Metódica (S-C)",
    texto: "Existe alta consistencia: las características MÁS representativas (S/C) son complementarias con las MENOS representativas (D/I). Esto indica autoconocimiento claro hacia la estabilidad, la cooperación, el análisis y la precisión."
  },
  mixto: {
    titulo: "⚖️ Perfil Mixto: Orientación Adaptable",
    texto: "El perfil muestra un patrón mixto sin orientación predominante marcada. Se seleccionan tanto características activas (D/I) como reservadas (S/C). Esto puede indicar versatilidad y adaptabilidad conductual, o un momento de transición personal/profesional."
  },
  contradictorio: {
    titulo: "⚠️ Perfil a Analizar: Posible Inconsistencia",
    texto: "El perfil muestra un patrón que requiere análisis adicional. Puede ocurrir cuando hay disonancia entre lo que se desea ser y lo que se cree ser, o cuando factores situacionales distorsionan la autopercepción. Se recomienda una entrevista complementaria."
  }
};

// ============================================================================
// FUNCIONES DE CÁLCULO (portadas del código.gs)
// ============================================================================

function parsearRespuestasDISC(respuestasString) {
  try {
    const resultado = { tiempoParte1: "", tiempoParte2: "", respuestas: {} };

    const matchPI = respuestasString.match(/\{PI:\s*([^-]+)\s*-\s*([^}]+)\}/);
    if (matchPI) {
      resultado.tiempoParte1 = matchPI[1].trim();
      matchPI[2].split(',').forEach(par => {
        const [idStr, valStr] = par.trim().split(';');
        const id = parseInt(idStr, 10), val = parseInt(valStr, 10);
        if (!isNaN(id) && !isNaN(val)) resultado.respuestas[id] = val;
      });
    }

    const matchPII = respuestasString.match(/\{PII:\s*([^-]+)\s*-\s*([^}]+)\}/);
    if (matchPII) {
      resultado.tiempoParte2 = matchPII[1].trim();
      matchPII[2].split(',').forEach(par => {
        const [idStr, valStr] = par.trim().split(';');
        const id = parseInt(idStr, 10), val = parseInt(valStr, 10);
        if (!isNaN(id) && !isNaN(val)) resultado.respuestas[id] = val;
      });
    }

    return resultado;
  } catch (e) {
    console.error('Error parseando respuestas:', e);
    return null;
  }
}

function calcularResultadosDISC(datosParsed) {
  const respuestas = datosParsed.respuestas;

  let masDI = 0, masSC = 0, menosDI = 0, menosSC = 0;
  let masDI_P1 = 0, masSC_P1 = 0, menosDI_P1 = 0, menosSC_P1 = 0;
  let masDI_P2 = 0, masSC_P2 = 0, menosDI_P2 = 0, menosSC_P2 = 0;
  let preguntasRespondidas = 0;
  const detallePreguntas = [];

  for (let q = 1; q <= 28; q++) {
    let idMas, idMenos;
    if (q <= 14) {
      idMas = (q - 1) * 2 + 1;
      idMenos = (q - 1) * 2 + 2;
    } else {
      idMas = 28 + (q - 15) * 2 + 1;
      idMenos = 28 + (q - 15) * 2 + 2;
    }

    const valMas = respuestas[idMas];
    const valMenos = respuestas[idMenos];

    if (valMas !== undefined && valMenos !== undefined) {
      preguntasRespondidas++;

      if (valMas === 5) masDI++; else masSC++;
      if (valMenos === 5) menosDI++; else menosSC++;

      if (q <= 14) {
        if (valMas === 5) masDI_P1++; else masSC_P1++;
        if (valMenos === 5) menosDI_P1++; else menosSC_P1++;
      } else {
        if (valMas === 5) masDI_P2++; else masSC_P2++;
        if (valMenos === 5) menosDI_P2++; else menosSC_P2++;
      }

      const grupo = GRUPOS_DISC[q];
      detallePreguntas.push({
        numero: q,
        parte: q <= 14 ? "I" : "II",
        textoD: grupo ? grupo.D : "",
        textoI: grupo ? grupo.I : "",
        textoS: grupo ? grupo.S : "",
        textoC: grupo ? grupo.C : "",
        masGrupo: valMas === 5 ? "D/I" : "S/C",
        menosGrupo: valMenos === 5 ? "D/I" : "S/C"
      });
    }
  }

  const pctMasDI = Math.round((masDI / 28) * 100);
  const pctMasSC = Math.round((masSC / 28) * 100);
  const pctMenosDI = Math.round((menosDI / 28) * 100);
  const pctMenosSC = Math.round((menosSC / 28) * 100);

  const netoDI = masDI - menosDI;
  const netoSC = masSC - menosSC;

  return {
    masDI, masSC, menosDI, menosSC,
    netoDI, netoSC,
    pctMasDI, pctMasSC, pctMenosDI, pctMenosSC,
    nivelMasDI: obtenerNivel(pctMasDI),
    nivelMasSC: obtenerNivel(pctMasSC),
    nivelMenosDI: obtenerNivel(pctMenosDI),
    nivelMenosSC: obtenerNivel(pctMenosSC),
    masDI_P1, masSC_P1, menosDI_P1, menosSC_P1,
    masDI_P2, masSC_P2, menosDI_P2, menosSC_P2,
    tipoConsistencia: determinarConsistencia(masDI, masSC, menosDI, menosSC),
    detallePreguntas,
    preguntasRespondidas,
    tiempoParte1: datosParsed.tiempoParte1,
    tiempoParte2: datosParsed.tiempoParte2
  };
}

function obtenerNivel(porcentaje) {
  if (porcentaje >= 75) return "Muy Alto";
  if (porcentaje >= 55) return "Alto";
  if (porcentaje >= 35) return "Moderado";
  if (porcentaje >= 15) return "Bajo";
  return "Muy Bajo";
}

function determinarConsistencia(masDI, masSC, menosDI, menosSC) {
  if (masDI >= 18 && menosSC >= 18) return "consistente_DI";
  if (masSC >= 18 && menosDI >= 18) return "consistente_SC";
  const diffMas = Math.abs(masDI - masSC);
  const diffMenos = Math.abs(menosDI - menosSC);
  if (diffMas <= 8 && diffMenos <= 8) return "mixto";
  if (masDI > masSC && menosSC > menosDI) return "consistente_DI";
  if (masSC > masDI && menosDI > menosSC) return "consistente_SC";
  if ((masDI > masSC && menosDI > menosSC) || (masSC > masDI && menosSC > menosDI)) return "contradictorio";
  return "mixto";
}

// ============================================================================
// UI RENDERING
// ============================================================================
/**
 * Calcula los valores D, I, S, C (0-100) desde las respuestas parseadas
 */
function calcularValoresDISC(respuestas) {
  let D = 0, I = 0, S = 0, C = 0;
  
  // Contar selecciones MÁS por dimensión en todas las 28 preguntas
  for (let q = 1; q <= 28; q++) {
    let idMas;
    if (q <= 14) {
      idMas = (q - 1) * 2 + 1;
    } else {
      idMas = 28 + (q - 15) * 2 + 1;
    }

    const valMas = respuestas[idMas];
    
    if (valMas !== undefined) {
      // Distribución por pregunta (simplificada para visualización)
      // Alternamos D/I en pares, S/C en pares
      const isActivo = valMas === 5;
      const qMod = (q - 1) % 4;
      
      if (isActivo) {
        if (qMod === 0 || qMod === 1) D++;
        else I++;
      } else {
        if (qMod === 0 || qMod === 1) S++;
        else C++;
      }
    }
  }

  // Normalizar a escala 0-100
  const total = D + I + S + C;
  return {
    D: total > 0 ? Math.round((D / total) * 100) : 0,
    I: total > 0 ? Math.round((I / total) * 100) : 0,
    S: total > 0 ? Math.round((S / total) * 100) : 0,
    C: total > 0 ? Math.round((C / total) * 100) : 0
  };
}
function renderReport(data, resultado, respuestasParsed, detalle) {
  const nombreCompleto = `${data.Nombre || ""} ${data.Apellido || ""}`.trim();
  const core = detalle ? window.DISCCore.calcular(detalle) : null;

  // Header
  document.getElementById('nombreCompleto').textContent = nombreCompleto;
  document.getElementById('correoUsuario').textContent = data.Correo || '';
  document.getElementById('fechaEval').textContent = data.Fecha ? new Date(data.Fecha).toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' }) : '';
  document.getElementById('tiempoP1').textContent = resultado.tiempoParte1 || '—';
  document.getElementById('tiempoP2').textContent = resultado.tiempoParte2 || '—';
  document.getElementById('footerNombre').textContent = nombreCompleto;

  // Avatar initials
  const initials = (data.Nombre || '').charAt(0) + (data.Apellido || '').charAt(0);
  document.getElementById('userAvatar').textContent = initials.toUpperCase();

  // Valores D/I/S/C para el gráfico de barras: con detalle, escala real e
  // independiente por letra (núcleo); sin detalle, la aproximación anterior.
  const discValues = core ? core.total.valores : calcularValoresDISC(respuestasParsed);
  
  // ⭐ NUEVO: Renderizar gráfico de barras DISC
  if (window.renderDISCBarChart) {
    window.renderDISCBarChart('discBarChartContainer', discValues);
  }

  // Score cards
  renderScoreCard('masDI', resultado.masDI, resultado.pctMasDI, resultado.nivelMasDI);
  // ... resto del código

  // Score cards
  renderScoreCard('masDI', resultado.masDI, resultado.pctMasDI, resultado.nivelMasDI);
  renderScoreCard('masSC', resultado.masSC, resultado.pctMasSC, resultado.nivelMasSC);
  renderScoreCard('menosDI', resultado.menosDI, resultado.pctMenosDI, resultado.nivelMenosDI);
  renderScoreCard('menosSC', resultado.menosSC, resultado.pctMenosSC, resultado.nivelMenosSC);

  // Charts
  // renderCharts(resultado);

  // Puntuaciones table
  renderTablaPuntuaciones(resultado);

  // Consistency
  renderConsistencia(resultado);

  // Interpretations
  renderInterpretacion('interpMasDI', 'MÁS → D/I (Dominancia / Influencia)', 'Características activas, extrovertidas', resultado.masDI, resultado.pctMasDI, resultado.nivelMasDI, TEXTOS_NIVEL[resultado.nivelMasDI], 'mas');
  renderInterpretacion('interpMasSC', 'MÁS → S/C (Estabilidad / Cumplimiento)', 'Características reservadas, metódicas', resultado.masSC, resultado.pctMasSC, resultado.nivelMasSC, TEXTOS_NIVEL[resultado.nivelMasSC], 'mas');
  renderInterpretacion('interpMenosDI', 'MENOS → D/I (Dominancia / Influencia)', 'Rechazo de características activas', resultado.menosDI, resultado.pctMenosDI, resultado.nivelMenosDI, TEXTOS_NIVEL[resultado.nivelMenosDI], 'menos');
  renderInterpretacion('interpMenosSC', 'MENOS → S/C (Estabilidad / Cumplimiento)', 'Rechazo de características reservadas', resultado.menosSC, resultado.pctMenosSC, resultado.nivelMenosSC, TEXTOS_NIVEL[resultado.nivelMenosSC], 'menos');

  // Partes table
  renderTablaPartes(resultado);

  // Dimensiones DISC
  renderDimensiones();

  // Detalle pregunta por pregunta (con detalle: la palabra elegida, no solo D/I o S/C)
  renderDetalle(detalle ? window.DISCCore.detallePreguntas(detalle, GRUPOS_DISC) : resultado.detallePreguntas);

  // ⭐ RUEDA SUCCESS INSIGHTS
  renderRuedaDISC(respuestasParsed, detalle);

  // ⭐ NUEVAS INTERPRETACIONES ESPECÍFICAS
  renderPerfilDominante(resultado);
  renderInterpretacionMasEspecifica('interpMasDI', 'DI', resultado.masDI, resultado.pctMasDI, resultado.nivelMasDI);
  renderInterpretacionMasEspecifica('interpMasSC', 'SC', resultado.masSC, resultado.pctMasSC, resultado.nivelMasSC);
  renderInterpretacionMenosEspecifica('interpMenosDI', 'DI', resultado.menosDI, resultado.pctMenosDI, resultado.nivelMenosDI);
  renderInterpretacionMenosEspecifica('interpMenosSC', 'SC', resultado.menosSC, resultado.pctMenosSC, resultado.nivelMenosSC);
  renderInterpretacionPartes(resultado, core);
  renderImplicacionesPracticas(resultado);
}

function renderScoreCard(key, val, pct, nivel) {
  document.getElementById(`val-${key}`).textContent = val;
  document.getElementById(`pct-${key}`).textContent = `${pct}%`;
  document.getElementById(`lvl-${key}`).textContent = `${TEXTOS_NIVEL[nivel].icono} ${nivel}`;

  // Animate bars after a short delay
  setTimeout(() => {
    document.getElementById(`bar-${key}`).style.width = `${pct}%`;
  }, 600);
}

// function renderCharts(r) {
//   const commonFont = { family: "'DM Sans', sans-serif" };

//   // Bar Chart
//   new Chart(document.getElementById('chartBar'), {
//     type: 'bar',
//     data: {
//       labels: ['MÁS D/I', 'MÁS S/C', 'MENOS D/I', 'MENOS S/C'],
//       datasets: [{
//         data: [r.masDI, r.masSC, r.menosDI, r.menosSC],
//         backgroundColor: ['#dc262680', '#05966980', '#d9770680', '#2563eb80'],
//         borderColor: ['#dc2626', '#059669', '#d97706', '#2563eb'],
//         borderWidth: 2,
//         borderRadius: 8,
//         barThickness: 44
//       }]
//     },
//     options: {
//       responsive: true,
//       maintainAspectRatio: true,
//       plugins: { legend: { display: false } },
//       scales: {
//         y: {
//           beginAtZero: true, max: 28,
//           ticks: { stepSize: 4, font: { ...commonFont, size: 11 } },
//           grid: { color: '#f1f5f9' }
//         },
//         x: {
//           ticks: { font: { ...commonFont, size: 11 } },
//           grid: { display: false }
//         }
//       }
//     }
//   });

//   // Radar Chart
//   new Chart(document.getElementById('chartRadar'), {
//     type: 'radar',
//     data: {
//       labels: ['MÁS D/I', 'MÁS S/C', 'MENOS D/I', 'MENOS S/C'],
//       datasets: [{
//         data: [r.pctMasDI, r.pctMasSC, r.pctMenosDI, r.pctMenosSC],
//         backgroundColor: 'rgba(11, 74, 110, 0.15)',
//         borderColor: '#0b4a6e',
//         pointBackgroundColor: '#0b4a6e',
//         pointRadius: 5,
//         borderWidth: 2
//       }]
//     },
//     options: {
//       responsive: true,
//       maintainAspectRatio: true,
//       plugins: { legend: { display: false } },
//       scales: {
//         r: {
//           beginAtZero: true, max: 100,
//           ticks: { stepSize: 25, font: { ...commonFont, size: 10 }, backdropColor: 'transparent' },
//           pointLabels: { font: { ...commonFont, size: 12, weight: 600 } },
//           grid: { color: '#e2e8f0' }
//         }
//       }
//     }
//   });
// }

function renderTablaPuntuaciones(r) {
  const tbody = document.getElementById('tbodyPuntuaciones');
  const rows = [
    { label: 'D/I — Activo/Extrovertido', colorClass: 'color-d', mas: r.masDI, pctMas: r.pctMasDI, nivelMas: r.nivelMasDI, menos: r.menosDI, pctMenos: r.pctMenosDI, nivelMenos: r.nivelMenosDI, neto: r.netoDI, netoColor: r.netoDI > 0 ? '#dc2626' : r.netoDI < 0 ? '#2563eb' : '#718096' },
    { label: 'S/C — Reservado/Metódico', colorClass: 'color-s', mas: r.masSC, pctMas: r.pctMasSC, nivelMas: r.nivelMasSC, menos: r.menosSC, pctMenos: r.pctMenosSC, nivelMenos: r.nivelMenosSC, neto: r.netoSC, netoColor: r.netoSC > 0 ? '#059669' : r.netoSC < 0 ? '#ea580c' : '#718096' }
  ];

  tbody.innerHTML = rows.map(row => {
    const nlMas = TEXTOS_NIVEL[row.nivelMas];
    const nlMenos = TEXTOS_NIVEL[row.nivelMenos];
    return `<tr>
      <td style="font-weight:700;">${row.label}</td>
      <td style="font-weight:800;font-size:18px;">${row.mas}</td>
      <td>${row.pctMas}%</td>
      <td style="color:${nlMas.color};font-weight:600;">${nlMas.icono} ${row.nivelMas}</td>
      <td style="font-weight:800;font-size:18px;">${row.menos}</td>
      <td>${row.pctMenos}%</td>
      <td style="color:${nlMenos.color};font-weight:600;">${nlMenos.icono} ${row.nivelMenos}</td>
      <td style="font-weight:800;font-size:16px;color:${row.netoColor};font-family:var(--font-mono);">${row.neto > 0 ? '+' : ''}${row.neto}</td>
    </tr>`;
  }).join('');
}

function renderConsistencia(r) {
  const card = document.getElementById('consistenciaCard');
  const tc = TEXTOS_CONSISTENCIA[r.tipoConsistencia];
  card.setAttribute('data-type', r.tipoConsistencia);
  document.getElementById('consistenciaTitulo').textContent = tc.titulo;
  document.getElementById('consistenciaTexto').textContent = tc.texto;
  document.getElementById('netoValDI').textContent = `${r.netoDI > 0 ? '+' : ''}${r.netoDI}`;
  document.getElementById('netoValSC').textContent = `${r.netoSC > 0 ? '+' : ''}${r.netoSC}`;
}

function renderInterpretacion(containerId, title, subtitle, freq, pct, nivel, textoNivel, tipo) {
  const container = document.getElementById(containerId);
  const texto = tipo === 'mas' ? textoNivel.textoMas : textoNivel.textoMenos;
  container.style.borderLeftColor = textoNivel.color;
  container.innerHTML = `
    <div class="interp-body">
      <div class="interp-title">${title}</div>
      <div class="interp-subtitle">${subtitle}</div>
      <div class="interp-stats">Frecuencia: <strong>${freq}</strong> de 28 (${pct}%) — Nivel: <strong style="color:${textoNivel.color};">${textoNivel.icono} ${nivel}</strong></div>
      <div class="interp-text">${texto}</div>
    </div>
    <div class="interp-badge" style="background:${textoNivel.color};">${pct}%</div>
  `;
}
// ============================================================================
// INTERPRETACIONES ESPECÍFICAS (NO GENÉRICAS)
// ============================================================================

/**
 * Genera interpretación específica del perfil dominante
 */
function renderPerfilDominante(resultado) {
  const card = document.getElementById('perfilDominanteCard');
  if (!card) return;

  const { masDI, masSC, menosDI, menosSC, pctMasDI, pctMasSC } = resultado;

  let perfil, color, gradiente, icono, descripcion;

  // Determinar perfil dominante
  if (pctMasDI >= 60) {
    perfil = "Orientación Activa/Extrovertida (D-I)";
    color = "#dc2626";
    gradiente = "from-red-900/20 to-orange-900/20";
    icono = "🚀";
    descripcion = `Tu perfil muestra una <strong>clara orientación hacia la acción y las relaciones</strong>. Con un ${pctMasDI}% de selecciones en características activas/extrovertidas, tiendes a:
    <ul class="mt-3 space-y-2">
      <li>• <strong>Actuar con rapidez</strong> y tomar decisiones de forma ágil</li>
      <li>• <strong>Buscar interacción social</strong> y disfrutar del contacto con personas</li>
      <li>• <strong>Preferir entornos dinámicos</strong> con cambios y variedad</li>
      <li>• <strong>Expresarte abiertamente</strong> y comunicar tus ideas con energía</li>
      <li>• <strong>Motivarte por resultados</strong> visibles y reconocimiento externo</li>
    </ul>
    <p class="mt-4"><strong class="text-white">En el trabajo:</strong> Destacas en roles que requieren liderazgo, persuasión, gestión de cambios o contacto frecuente con clientes y equipos.</p>`;
  } else if (pctMasSC >= 60) {
    perfil = "Orientación Reservada/Metódica (S-C)";
    color = "#059669";
    gradiente = "from-green-900/20 to-blue-900/20";
    icono = "🎯";
    descripcion = `Tu perfil muestra una <strong>clara orientación hacia la estabilidad y la precisión</strong>. Con un ${pctMasSC}% de selecciones en características reservadas/metódicas, tiendes a:
    <ul class="mt-3 space-y-2">
      <li>• <strong>Actuar con reflexión</strong> y tomar decisiones tras analizar la información</li>
      <li>• <strong>Preferir ambientes estables</strong> con procesos claros y predecibles</li>
      <li>• <strong>Valorar la calidad y precisión</strong> en tu trabajo</li>
      <li>• <strong>Trabajar de forma metódica</strong> y sistemática</li>
      <li>• <strong>Mantener relaciones cercanas</strong> de largo plazo con pocas personas</li>
    </ul>
    <p class="mt-4"><strong class="text-white">En el trabajo:</strong> Destacas en roles que requieren atención al detalle, consistencia, análisis profundo o mantenimiento de estándares de calidad.</p>`;
  } else {
    perfil = "Perfil Balanceado/Adaptable";
    color = "#7c3aed";
    gradiente = "from-purple-900/20 to-pink-900/20";
    icono = "⚖️";
    descripcion = `Tu perfil muestra un <strong>equilibrio entre características activas y reservadas</strong>. Con MÁS D/I: ${pctMasDI}% y MÁS S/C: ${pctMasSC}%, esto indica:
    <ul class="mt-3 space-y-2">
      <li>• <strong>Alta versatilidad conductual</strong> — puedes adaptarte a diferentes contextos</li>
      <li>• <strong>Capacidad de cambiar de ritmo</strong> según las necesidades de la situación</li>
      <li>• <strong>No tienes preferencias extremas</strong> por un estilo u otro</li>
      <li>• <strong>Flexibilidad para trabajar</strong> tanto en equipo como de forma independiente</li>
      <li>• <strong>Equilibrio entre acción y reflexión</strong></li>
    </ul>
    <p class="mt-4"><strong class="text-white">En el trabajo:</strong> Tu adaptabilidad es tu mayor fortaleza. Puedes desempeñarte bien en roles diversos, aunque podrías beneficiarte de definir tu zona de máximo rendimiento.</p>`;
  }

  card.className = `profile-dominant-card reveal bg-gradient-to-br ${gradiente} border border-l-4 rounded-2xl p-8 mb-10`;
  card.style.borderLeftColor = color;
  
  card.innerHTML = `
    <div class="flex items-start gap-4 mb-5">
      <div class="text-5xl">${icono}</div>
      <div>
        <h3 class="font-exo text-2xl font-bold mb-2" style="color: ${color};">${perfil}</h3>
        <div class="flex gap-4 text-sm">
          <span class="font-mono"><strong>MÁS D/I:</strong> ${pctMasDI}%</span>
          <span class="font-mono"><strong>MÁS S/C:</strong> ${pctMasSC}%</span>
        </div>
      </div>
    </div>
    <div class="text-sm leading-relaxed text-gray-300">${descripcion}</div>
  `;
}

/**
 * Genera interpretación específica de cada eje MÁS
 */
function renderInterpretacionMasEspecifica(containerId, eje, freq, pct, nivel) {
  const container = document.getElementById(containerId);
  if (!container) return;

  let color, titulo, interpretacion;

  if (eje === 'DI') {
    color = '#dc2626';
    titulo = 'Eje Activo/Extrovertido (D-I)';
    
    if (pct >= 75) {
      interpretacion = `<strong>Identificación muy fuerte (${freq}/28 veces, ${pct}%).</strong> Te identificas profundamente con características activas y extrovertidas. Esto significa que:
      <ul class="mt-2 ml-4 space-y-1.5">
        <li>• Eres naturalmente <strong>orientado a la acción</strong> y te impacientas con la inactividad</li>
        <li>• Prefieres <strong>ritmo rápido</strong> y te aburres con tareas lentas o repetitivas</li>
        <li>• Disfrutas de la <strong>interacción social</strong> y te energiza estar con personas</li>
        <li>• Tomas decisiones <strong>rápidamente</strong>, a veces sin analizar todos los detalles</li>
        <li>• Te motiva el <strong>reconocimiento externo</strong> y los resultados visibles</li>
      </ul>`;
    } else if (pct >= 55) {
      interpretacion = `<strong>Identificación notable (${freq}/28 veces, ${pct}%).</strong> Tiendes hacia características activas y extrovertidas, aunque con cierta flexibilidad. Esto indica que:
      <ul class="mt-2 ml-4 space-y-1.5">
        <li>• Prefieres la <strong>acción sobre la espera</strong>, aunque puedes ser paciente cuando es necesario</li>
        <li>• Disfrutas de la <strong>interacción social</strong> pero también valoras momentos de trabajo individual</li>
        <li>• Eres <strong>proactivo</strong> pero no impulsivo</li>
        <li>• Te adaptas bien a <strong>cambios</strong> en el entorno</li>
      </ul>`;
    } else if (pct >= 35) {
      interpretacion = `<strong>Identificación moderada (${freq}/28 veces, ${pct}%).</strong> Muestras un equilibrio entre características activas y otras cualidades. Esto sugiere que:
      <ul class="mt-2 ml-4 space-y-1.5">
        <li>• Puedes <strong>alternar entre acción y reflexión</strong> según el contexto</li>
        <li>• No tienes una preferencia marcada por ritmo rápido o lento</li>
        <li>• Tu nivel de <strong>extraversión es situacional</strong></li>
        <li>• Eres <strong>versátil</strong> en diferentes entornos de trabajo</li>
      </ul>`;
    } else {
      interpretacion = `<strong>Identificación baja (${freq}/28 veces, ${pct}%).</strong> No te identificas fuertemente con características activas/extrovertidas. Esto indica que:
      <ul class="mt-2 ml-4 space-y-1.5">
        <li>• Probablemente prefieres <strong>ritmos más pausados</strong> y reflexivos</li>
        <li>• Valoras la <strong>calidad sobre la velocidad</strong></li>
        <li>• Prefieres <strong>trabajar de forma independiente</strong> o en grupos pequeños</li>
        <li>• Tu orientación es más hacia <strong>tareas y procesos</strong> que hacia personas</li>
      </ul>`;
    }
  } else {
    color = '#059669';
    titulo = 'Eje Reservado/Metódico (S-C)';
    
    if (pct >= 75) {
      interpretacion = `<strong>Identificación muy fuerte (${freq}/28 veces, ${pct}%).</strong> Te identificas profundamente con características reservadas y metódicas. Esto significa que:
      <ul class="mt-2 ml-4 space-y-1.5">
        <li>• Valoras la <strong>estabilidad y previsibilidad</strong> en tu entorno</li>
        <li>• Prefieres <strong>ritmos pausados</strong> que te permitan hacer las cosas bien</li>
        <li>• Eres <strong>reflexivo y analítico</strong> antes de actuar</li>
        <li>• Priorizas la <strong>calidad y precisión</strong> sobre la rapidez</li>
        <li>• Te sientes cómodo con <strong>rutinas y procesos establecidos</strong></li>
      </ul>`;
    } else if (pct >= 55) {
      interpretacion = `<strong>Identificación notable (${freq}/28 veces, ${pct}%).</strong> Tiendes hacia características reservadas y metódicas, con cierta adaptabilidad. Esto indica que:
      <ul class="mt-2 ml-4 space-y-1.5">
        <li>• Prefieres <strong>planificar antes que improvisar</strong></li>
        <li>• Valoras la <strong>consistencia y confiabilidad</strong></li>
        <li>• Te tomas el tiempo para <strong>hacer las cosas correctamente</strong></li>
        <li>• Puedes adaptarte a cambios si tienes <strong>tiempo para prepararte</strong></li>
      </ul>`;
    } else if (pct >= 35) {
      interpretacion = `<strong>Identificación moderada (${freq}/28 veces, ${pct}%).</strong> Muestras equilibrio entre características reservadas y otras cualidades. Esto sugiere que:
      <ul class="mt-2 ml-4 space-y-1.5">
        <li>• Puedes trabajar tanto con <strong>procesos estructurados como flexibles</strong></li>
        <li>• No dependes excesivamente de la estabilidad ni del cambio</li>
        <li>• Balanceas <strong>análisis y acción</strong></li>
        <li>• Eres adaptable a diferentes ritmos de trabajo</li>
      </ul>`;
    } else {
      interpretacion = `<strong>Identificación baja (${freq}/28 veces, ${pct}%).</strong> No te identificas fuertemente con características reservadas/metódicas. Esto indica que:
      <ul class="mt-2 ml-4 space-y-1.5">
        <li>• Probablemente prefieres <strong>ritmos más dinámicos</strong> y acelerados</li>
        <li>• Te adaptas bien a <strong>cambios e imprevistos</strong></li>
        <li>• Prefieres la <strong>acción sobre el análisis</strong> prolongado</li>
        <li>• Tu orientación es más hacia <strong>resultados rápidos</strong> que procesos largos</li>
      </ul>`;
    }
  }

  container.innerHTML = `
    <div class="bg-gradient-to-br from-slate-800/60 to-slate-900/60 border-l-4 border border-slate-700/50 rounded-xl p-6" style="border-left-color: ${color};">
      <div class="flex items-start justify-between gap-4 mb-4">
        <div class="flex-1">
          <h4 class="font-exo text-lg font-bold mb-1" style="color: ${color};">${titulo}</h4>
          <div class="text-xs text-gray-400 font-mono">Frecuencia: ${freq}/28 (${pct}%) — Nivel: ${nivel}</div>
        </div>
        <div class="flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center text-2xl font-black" style="background: ${color}; color: white;">
          ${pct}%
        </div>
      </div>
      <div class="text-sm leading-relaxed text-gray-300">${interpretacion}</div>
    </div>
  `;
}

/**
 * Genera interpretación específica de cada eje MENOS
 */
function renderInterpretacionMenosEspecifica(containerId, eje, freq, pct, nivel) {
  const container = document.getElementById(containerId);
  if (!container) return;

  let color, titulo, interpretacion;

  if (eje === 'DI') {
    color = '#ea580c';
    titulo = 'Rechazo de Características Activas/Extrovertidas (D-I)';
    
    if (pct >= 75) {
      interpretacion = `<strong>Rechazo muy marcado (${freq}/28 veces, ${pct}%).</strong> Rechazas consistentemente las características activas y extrovertidas. Esto revela que:
      <ul class="mt-2 ml-4 space-y-1.5">
        <li>• No te sientes cómodo con <strong>ritmos acelerados</strong> ni presión de tiempo</li>
        <li>• Prefieres <strong>evitar la confrontación</strong> y el liderazgo directo</li>
        <li>• La <strong>interacción social intensa</strong> te agota emocionalmente</li>
        <li>• No disfrutas de <strong>entornos competitivos</strong> o de alta exigencia</li>
        <li>• Rechazas activamente roles que requieran <strong>toma de decisiones rápidas</strong></li>
      </ul>`;
    } else if (pct >= 55) {
      interpretacion = `<strong>Rechazo notable (${freq}/28 veces, ${pct}%).</strong> Tiendes a evitar características activas/extrovertidas. Esto sugiere que:
      <ul class="mt-2 ml-4 space-y-1.5">
        <li>• Prefieres <strong>entornos tranquilos</strong> sin urgencias constantes</li>
        <li>• La <strong>exposición social prolongada</strong> te resulta agotadora</li>
        <li>• Evitas <strong>asumir protagonismo</strong> en grupos grandes</li>
        <li>• No te atrae trabajar bajo <strong>presión constante</strong></li>
      </ul>`;
    } else if (pct >= 35) {
      interpretacion = `<strong>Rechazo moderado (${freq}/28 veces, ${pct}%).</strong> No rechazas fuertemente estas características. Esto indica que:
      <ul class="mt-2 ml-4 space-y-1.5">
        <li>• Puedes <strong>tolerar ritmos acelerados</strong> en ciertas circunstancias</li>
        <li>• La interacción social no te incomoda si es <strong>en dosis moderadas</strong></li>
        <li>• Tienes cierta <strong>flexibilidad</strong> para adaptarte a diferentes ritmos</li>
      </ul>`;
    } else {
      interpretacion = `<strong>Rechazo bajo (${freq}/28 veces, ${pct}%).</strong> Rara vez rechazas características activas/extrovertidas. Esto indica que:
      <ul class="mt-2 ml-4 space-y-1.5">
        <li>• Te sientes cómodo con <strong>dinámicas activas</strong> y sociales</li>
        <li>• No te incomodan los <strong>cambios ni la presión</strong></li>
        <li>• Probablemente <strong>disfrutas de la acción</strong> y el movimiento</li>
      </ul>`;
    }
  } else {
    color = '#2563eb';
    titulo = 'Rechazo de Características Reservadas/Metódicas (S-C)';
    
    if (pct >= 75) {
      interpretacion = `<strong>Rechazo muy marcado (${freq}/28 veces, ${pct}%).</strong> Rechazas consistentemente características reservadas y metódicas. Esto revela que:
      <ul class="mt-2 ml-4 space-y-1.5">
        <li>• Te <strong>frustran las rutinas</strong> y los procesos lentos</li>
        <li>• No disfrutas de <strong>trabajos repetitivos</strong> o detallistas</li>
        <li>• Rechazas activamente <strong>ambientes estables</strong> sin variedad</li>
        <li>• Prefieres la <strong>acción sobre el análisis</strong> prolongado</li>
        <li>• Te impacientas con <strong>procesos burocráticos</strong> o normativos</li>
      </ul>`;
    } else if (pct >= 55) {
      interpretacion = `<strong>Rechazo notable (${freq}/28 veces, ${pct}%).</strong> Tiendes a evitar características reservadas/metódicas. Esto sugiere que:
      <ul class="mt-2 ml-4 space-y-1.5">
        <li>• Prefieres <strong>variedad sobre estabilidad</strong></li>
        <li>• Te aburres con <strong>tareas demasiado estructuradas</strong></li>
        <li>• No te atrae el <strong>trabajo minucioso</strong> con detalles</li>
        <li>• Evitas roles que requieran <strong>mucha paciencia</strong></li>
      </ul>`;
    } else if (pct >= 35) {
      interpretacion = `<strong>Rechazo moderado (${freq}/28 veces, ${pct}%).</strong> No rechazas fuertemente estas características. Esto indica que:
      <ul class="mt-2 ml-4 space-y-1.5">
        <li>• Puedes trabajar con <strong>procesos estructurados</strong> cuando es necesario</li>
        <li>• Toleras la <strong>estabilidad</strong> sin sentirte atrapado</li>
        <li>• Tienes <strong>cierta paciencia</strong> para trabajos metódicos</li>
      </ul>`;
    } else {
      interpretacion = `<strong>Rechazo bajo (${freq}/28 veces, ${pct}%).</strong> Rara vez rechazas características reservadas/metódicas. Esto indica que:
      <ul class="mt-2 ml-4 space-y-1.5">
        <li>• Te sientes cómodo con <strong>procesos estructurados</strong></li>
        <li>• Valoras la <strong>estabilidad y consistencia</strong></li>
        <li>• Probablemente <strong>disfrutas del análisis</strong> y el detalle</li>
      </ul>`;
    }
  }

  container.innerHTML = `
    <div class="bg-gradient-to-br from-slate-800/60 to-slate-900/60 border-l-4 border border-slate-700/50 rounded-xl p-6" style="border-left-color: ${color};">
      <div class="flex items-start justify-between gap-4 mb-4">
        <div class="flex-1">
          <h4 class="font-exo text-lg font-bold mb-1" style="color: ${color};">${titulo}</h4>
          <div class="text-xs text-gray-400 font-mono">Frecuencia: ${freq}/28 (${pct}%) — Nivel: ${nivel}</div>
        </div>
        <div class="flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center text-2xl font-black" style="background: ${color}; color: white;">
          ${pct}%
        </div>
      </div>
      <div class="text-sm leading-relaxed text-gray-300">${interpretacion}</div>
    </div>
  `;
}

/**
 * Genera interpretación de comparativa Parte I vs Parte II
 */
function renderInterpretacionPartes(resultado, core) {
  const container = document.getElementById('interpretacionPartes');
  if (!container) return;

  const { masDI_P1, masSC_P1, masDI_P2, masSC_P2 } = resultado;

  const diffDI = Math.abs(masDI_P1 - masDI_P2);
  const diffSC = Math.abs(masSC_P1 - masSC_P2);
  let diffTotal = diffDI + diffSC;
  let detalleDiff = `(D/I: ${diffDI}, S/C: ${diffSC})`;
  // Umbrales del algoritmo anterior (solo MÁS). Con núcleo: MÁS y MENOS en las 4 letras.
  let corteMuyEstable = 4, corteNucleo = 8;
  if (core) {
    const e = core.estabilidad;
    diffTotal = e.total;
    detalleDiff = `(D: ${e.porLetra.D}, I: ${e.porLetra.I}, S: ${e.porLetra.S}, C: ${e.porLetra.C} — incluye MÁS y MENOS)`;
    corteMuyEstable = window.DISCCore.ESTABILIDAD.muyEstable;
    corteNucleo = window.DISCCore.ESTABILIDAD.nucleoEstable;
  }

  let titulo, icono, color, interpretacion;

  if (diffTotal <= corteMuyEstable) {
    titulo = "Perfil Muy Estable";
    icono = "🎯";
    color = "#059669";
    interpretacion = `<strong>Tu comportamiento es consistente entre situaciones normales y bajo presión.</strong> Las diferencias entre Parte I y Parte II son mínimas (${diffTotal} puntos de diferencia total), lo que indica que:
    <ul class="mt-3 ml-4 space-y-2">
      <li>• Eres <strong>auténtico</strong> — tu comportamiento natural coincide con tu comportamiento adaptado</li>
      <li>• <strong>No modificas significativamente</strong> tu conducta bajo estrés o presión</li>
      <li>• Las personas te perciben como <strong>predecible y congruente</strong></li>
      <li>• Experimentas <strong>bajo nivel de tensión</strong> entre lo que eres y lo que muestras</li>
      <li>• Tu entorno laboral actual <strong>te permite ser tú mismo</strong></li>
    </ul>
    <p class="mt-3 text-cyan-200"><strong>Implicación:</strong> Esta estabilidad es positiva, aunque asegúrate de que tu entorno realmente te permita desarrollar todo tu potencial.</p>`;
  } else if (diffTotal <= corteNucleo) {
    titulo = "Perfil Adaptable con Núcleo Estable";
    icono = "⚖️";
    color = "#f59e0b";
    interpretacion = `<strong>Muestras cierta adaptación conductual pero mantienes tu esencia.</strong> Hay diferencias moderadas (${diffTotal} puntos), lo que sugiere que:
    <ul class="mt-3 ml-4 space-y-2">
      <li>• <strong>Adaptas tu comportamiento</strong> según el contexto, pero sin forzarte demasiado</li>
      <li>• Bajo presión, ajustas algunas conductas pero <strong>mantienes tu identidad</strong></li>
      <li>• Tienes <strong>flexibilidad conductual</strong> sin perder autenticidad</li>
      <li>• El esfuerzo de adaptación es <strong>manejable y sostenible</strong></li>
    </ul>
    <p class="mt-3 text-orange-200"><strong>Implicación:</strong> Este nivel de adaptación es saludable y muestra inteligencia emocional. Monitorea que no aumente con el tiempo.</p>`;
  } else {
    titulo = "Perfil con Adaptación Significativa";
    icono = "⚠️";
    color = "#dc2626";
    interpretacion = `<strong>Modificas considerablemente tu comportamiento bajo presión.</strong> Hay diferencias notables (${diffTotal} puntos), lo que indica que:
    <ul class="mt-3 ml-4 space-y-2">
      <li>• Existe <strong>disonancia entre tu yo natural y tu yo laboral</strong></li>
      <li>• Bajo estrés, activas conductas que <strong>no son naturales</strong> para ti</li>
      <li>• Podrías estar experimentando <strong>tensión o desgaste</strong> por mantener este ajuste</li>
      <li>• Tu entorno laboral puede estar <strong>exigiéndote ser alguien que no eres</strong></li>
      <li>• A largo plazo, esta adaptación puede generar <strong>agotamiento</strong></li>
    </ul>
    <p class="mt-3 text-red-200"><strong>Recomendación:</strong> Evalúa si tu rol actual es compatible con tus fortalezas naturales. Considera buscar entornos que te permitan ser más auténtico.</p>`;
  }

  container.innerHTML = `
    <div class="flex items-start gap-4 mb-4">
      <div class="text-4xl">${icono}</div>
      <div class="flex-1">
        <h3 class="font-exo text-xl font-bold mb-2" style="color: ${color};">${titulo}</h3>
        <div class="text-xs text-gray-400 font-mono">Diferencia total: ${diffTotal} puntos ${detalleDiff}</div>
      </div>
    </div>
    <div class="text-sm leading-relaxed text-gray-300">${interpretacion}</div>
  `;
}

/**
 * Genera implicaciones prácticas del perfil
 */
function renderImplicacionesPracticas(resultado) {
  const { pctMasDI, pctMasSC } = resultado;

  // Determinar perfil dominante
  let fortalezas, atencion, comunicacion, entorno;

  if (pctMasDI >= 60) {
    // Perfil activo/extrovertido
    fortalezas = [
      'Capacidad de generar resultados rápidos y tomar decisiones ágiles',
      'Habilidad para liderar equipos y motivar a otros',
      'Adaptabilidad a cambios y entornos dinámicos',
      'Comunicación efectiva y persuasión',
      'Energía y proactividad en la ejecución de proyectos'
    ];
    atencion = [
      'Puede impacientarse con procesos lentos o detallados',
      'Riesgo de tomar decisiones sin analizar toda la información',
      'Tendencia a sobrecargar la agenda con demasiadas actividades',
      'Necesita recordar la importancia de la planificación',
      'Puede descuidar el seguimiento de tareas iniciadas'
    ];
    comunicacion = [
      'Sé directo y ve al punto — valora la eficiencia',
      'Enfócate en resultados y beneficios concretos',
      'Permite que lidere conversaciones y proponga ideas',
      'Ofrece variedad y estímulo, evita la monotonía',
      'Reconoce sus logros públicamente'
    ];
    entorno = [
      'Entornos dinámicos con desafíos constantes',
      'Oportunidades de liderazgo y toma de decisiones',
      'Libertad y autonomía para actuar',
      'Contacto frecuente con personas y equipos',
      'Reconocimiento visible por resultados'
    ];
  } else if (pctMasSC >= 60) {
    // Perfil reservado/metódico
    fortalezas = [
      'Atención excepcional al detalle y precisión en el trabajo',
      'Capacidad de análisis profundo y pensamiento crítico',
      'Consistencia y confiabilidad en la ejecución',
      'Paciencia para procesos largos y complejos',
      'Construcción de relaciones estables de largo plazo'
    ];
    atencion = [
      'Puede resistirse excesivamente a cambios necesarios',
      'Riesgo de "parálisis por análisis" — dificultad para decidir',
      'Tendencia a evitar la confrontación cuando es necesaria',
      'Necesita salir de su zona de confort periódicamente',
      'Puede perder oportunidades por exceso de cautela'
    ];
    comunicacion = [
      'Proporciona información detallada y fundamentada',
      'Dale tiempo para procesar y responder — no lo presiones',
      'Respeta su necesidad de preparación antes de reuniones',
      'Valora la calidad de su trabajo, no solo la velocidad',
      'Comunica cambios con anticipación y explicaciones claras'
    ];
    entorno = [
      'Ambientes estables con procesos claros',
      'Tiempo suficiente para analizar y planificar',
      'Estándares de calidad bien definidos',
      'Relaciones de trabajo armoniosas y predecibles',
      'Reconocimiento por precisión y consistencia'
    ];
  } else {
    // Perfil balanceado
    fortalezas = [
      'Versatilidad para adaptarse a diferentes situaciones',
      'Equilibrio entre acción y reflexión',
      'Capacidad de trabajar tanto en equipo como independientemente',
      'Flexibilidad para cambiar de ritmo según necesidades',
      'Comprensión de diferentes estilos de trabajo'
    ];
    atencion = [
      'Necesita definir su zona de máximo rendimiento',
      'Puede dispersarse tratando de ser bueno en todo',
      'Riesgo de falta de identidad profesional clara',
      'Importante encontrar el contexto que potencie sus fortalezas',
      'Debe evitar el rol de "comodín" permanente'
    ];
    comunicacion = [
      'Adapta tu estilo según el contexto — es flexible',
      'Ofrece tanto desafíos como estabilidad',
      'Valora su capacidad de adaptación',
      'Dale oportunidades variadas de desarrollo',
      'Ayúdale a identificar su zona de excelencia'
    ];
    entorno = [
      'Entornos con variedad de tareas y responsabilidades',
      'Oportunidades para explorar diferentes roles',
      'Balance entre estructura y flexibilidad',
      'Proyectos que combinen acción y análisis',
      'Equipos diversos con diferentes estilos'
    ];
  }

  // Renderizar
  document.getElementById('fortalezasList').innerHTML = fortalezas.map(f => `<li class="flex items-start gap-2"><span class="text-green-400 mt-0.5">✓</span><span>${f}</span></li>`).join('');
  document.getElementById('atencionList').innerHTML = atencion.map(a => `<li class="flex items-start gap-2"><span class="text-orange-400 mt-0.5">!</span><span>${a}</span></li>`).join('');
  document.getElementById('comunicacionList').innerHTML = comunicacion.map(c => `<li class="flex items-start gap-2"><span class="text-blue-400 mt-0.5">▸</span><span>${c}</span></li>`).join('');
  document.getElementById('entornoList').innerHTML = entorno.map(e => `<li class="flex items-start gap-2"><span class="text-purple-400 mt-0.5">▸</span><span>${e}</span></li>`).join('');
}
function renderTablaPartes(r) {
  const tbody = document.getElementById('tbodyPartes');
  tbody.innerHTML = `
    <tr>
      <td>Parte I (1-14) — Fortalezas</td>
      <td style="font-weight:700;color:#dc2626;">${r.masDI_P1}</td>
      <td style="font-weight:700;color:#059669;">${r.masSC_P1}</td>
      <td style="font-weight:700;color:#d97706;">${r.menosDI_P1}</td>
      <td style="font-weight:700;color:#2563eb;">${r.menosSC_P1}</td>
    </tr>
    <tr>
      <td>Parte II (15-28) — Bajo presión</td>
      <td style="font-weight:700;color:#dc2626;">${r.masDI_P2}</td>
      <td style="font-weight:700;color:#059669;">${r.masSC_P2}</td>
      <td style="font-weight:700;color:#d97706;">${r.menosDI_P2}</td>
      <td style="font-weight:700;color:#2563eb;">${r.menosSC_P2}</td>
    </tr>
    <tr style="background:#f1f5f9;font-weight:800;">
      <td>TOTAL (28 preguntas)</td>
      <td style="color:#dc2626;">${r.masDI}</td>
      <td style="color:#059669;">${r.masSC}</td>
      <td style="color:#d97706;">${r.menosDI}</td>
      <td style="color:#2563eb;">${r.menosSC}</td>
    </tr>
  `;
}

function renderDimensiones() {
  const container = document.getElementById('dimensionesContainer');
  const dims = ['D', 'I', 'S', 'C'];

  container.innerHTML = dims.map(key => {
    const d = PERFILES_DISC[key];
    return `
    <div class="dim-card dim-card-${key} reveal">
      <div class="dim-header">
        <div class="dim-icon">${d.icono}</div>
        <div>
          <div class="dim-letter">${d.letra} — ${d.nombre}</div>
          <div class="dim-name">"${d.breve}"</div>
        </div>
      </div>
      <div class="dim-question">${d.pregunta_clave}</div>
      <div class="dim-desc">${d.descripcion_completa}</div>
      <div class="dim-details">
        <div class="dim-detail-row"><span class="dim-detail-label" style="color:${d.color};">🔑 Motivadores:</span><span>${d.motivadores}</span></div>
        <div class="dim-detail-row"><span class="dim-detail-label" style="color:#059669;">💪 Fortalezas:</span><span>${d.fortalezas}</span></div>
        <div class="dim-detail-row"><span class="dim-detail-label" style="color:#d97706;">⚠️ Áreas de mejora:</span><span>${d.areas_mejora}</span></div>
        <div class="dim-detail-row"><span class="dim-detail-label" style="color:#dc2626;">🔥 Bajo presión:</span><span>${d.bajo_presion}</span></div>
        <div class="dim-detail-row"><span class="dim-detail-label" style="color:#2563eb;">🏢 Entorno ideal:</span><span>${d.entorno_ideal}</span></div>
      </div>
    </div>`;
  }).join('');
}
// ========== RUEDA SUCCESS INSIGHTS ==========
function renderRuedaDISC(respuestas, detalle) {
  if (!respuestas || Object.keys(respuestas).length === 0) {
    console.error('No hay respuestas para renderizar la rueda');
    return;
  }

  // Verificar que las funciones estén disponibles
  if (typeof window.discToWheel !== 'function') {
    console.error('discToWheel no está disponible');
    return;
  }

  if (typeof window.renderRuedaSI5 !== 'function') {
    console.error('renderRuedaSI5 no está disponible');
    return;
  }

  try {
    // Convertir respuestas a coordenadas de rueda
    const coordenadas = window.discToWheel(respuestas, detalle);

    console.log('🎯 Coordenadas calculadas:', coordenadas);
    const rolN = window.DISCCore ? window.DISCCore.rolPorAngulo(coordenadas.natural.angle) : '';
    const rolA = window.DISCCore ? window.DISCCore.rolPorAngulo(coordenadas.adaptado.angle) : '';

    // Renderizar la rueda
window.renderRuedaSI5("#ruedaSVG", {
  celdaNatural: coordenadas.natural.cell,
  celdaAdaptada: coordenadas.adaptado.cell,
  width: 900,
  height: 900
});

// Leyenda visible debajo de la rueda: estilo (rol), celda, ángulo e intensidad.
const badgeHtml = (c, rol) =>
  `${rol ? `<span class="text-white font-semibold">${rol.charAt(0) + rol.slice(1).toLowerCase()}</span> · ` : ''}` +
  `Celda ${c.cell} · ${Math.round(c.angle) % 360}° · Intensidad ${Math.round(c.radius * 100)}%`;

const nBadge = document.getElementById('naturalCellBadge');
if (nBadge) nBadge.innerHTML = badgeHtml(coordenadas.natural, rolN);

const aBadge = document.getElementById('adaptadoCellBadge');
if (aBadge) aBadge.innerHTML = badgeHtml(coordenadas.adaptado, rolA);

const nInfo = document.getElementById('naturalInfo');
if (nInfo) {
  nInfo.innerHTML = `
    ${rolN ? `<strong>Estilo:</strong> ${rolN}<br>` : ''}
    <strong>Celda:</strong> ${coordenadas.natural.cell}<br>
    <strong>Ángulo:</strong> ${Math.round(coordenadas.natural.angle)}°<br>
    <strong>Intensidad:</strong> ${Math.round(coordenadas.natural.radius * 100)}%
  `;
}

const aInfo = document.getElementById('adaptadoInfo');
if (aInfo) {
  aInfo.innerHTML = `
    ${rolA ? `<strong>Estilo:</strong> ${rolA}<br>` : ''}
    <strong>Celda:</strong> ${coordenadas.adaptado.cell}<br>
    <strong>Ángulo:</strong> ${Math.round(coordenadas.adaptado.angle)}°<br>
    <strong>Intensidad:</strong> ${Math.round(coordenadas.adaptado.radius * 100)}%
  `;
}


  } catch (error) {
    console.error('Error renderizando rueda:', error);
  }
}

function renderDetalle(detallePreguntas) {
  const tbody1 = document.getElementById('detalleParte1');
  const tbody2 = document.getElementById('detalleParte2');

  detallePreguntas.forEach((p, i) => {
    const row = `<tr style="background:${i % 2 === 0 ? '#fff' : '#fafbfc'};">
      <td style="text-align:center;color:#64748b;font-weight:600;">${p.numero}</td>
      <td style="text-align:center;">${p.textoD}</td>
      <td style="text-align:center;">${p.textoI}</td>
      <td style="text-align:center;">${p.textoS}</td>
      <td style="text-align:center;">${p.textoC}</td>
      <td style="text-align:center;"><span class="cell-tag" style="background:${p.masGrupo === 'D/I' ? '#fef2f2' : '#f0fdf4'};color:${p.masGrupo === 'D/I' ? '#dc2626' : '#059669'};">${p.masLetra ? `${p.masPalabra} (${p.masLetra})` : p.masGrupo}</span></td>
      <td style="text-align:center;"><span class="cell-tag" style="background:${p.menosGrupo === 'D/I' ? '#fff7ed' : '#eff6ff'};color:${p.menosGrupo === 'D/I' ? '#ea580c' : '#2563eb'};">${p.menosLetra ? `${p.menosPalabra} (${p.menosLetra})` : p.menosGrupo}</span></td>
    </tr>`;

    if (p.parte === 'I') tbody1.innerHTML += row;
    else tbody2.innerHTML += row;
  });
}

// ============================================================================
// NAVIGATION
// ============================================================================

function setupNavigation() {
  const tabs = document.querySelectorAll('.nav-tab');
  const sections = document.querySelectorAll('.section');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.section;

      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      sections.forEach(s => {
        s.classList.remove('active');
        if (s.id === `sec-${target}`) {
          s.classList.add('active');
          // Trigger reveal animations for newly visible section
          setTimeout(() => triggerReveals(s), 50);
        }
      });

      // Scroll to top of section area
      window.scrollTo({ top: document.querySelector('.report-nav').offsetTop, behavior: 'smooth' });
    });
  });
}

// ============================================================================
// REVEAL ANIMATIONS (Intersection Observer)
// ============================================================================

function setupRevealAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

function triggerReveals(container) {
  const reveals = container.querySelectorAll('.reveal');
  reveals.forEach((el, i) => {
    setTimeout(() => el.classList.add('visible'), i * 80);
  });
}

// ============================================================================
// MAIN INIT
// ============================================================================

document.addEventListener("DOMContentLoaded", function () {
  const stored = sessionStorage.getItem("discUserData");

  if (!stored) {
    alert("No hay datos de informe disponibles. Volviendo al panel...");
    window.location.href = "/userboard";
    return;
  }

  let data;
  try {
    data = JSON.parse(stored);
  } catch (e) {
    console.error("discUserData no es JSON válido:", e);
    alert("Los datos del informe están corruptos. Volviendo al panel...");
    window.location.href = "/userboard";
    return;
  }

  const respuestasString = data.Respuestas || "";
  const datosParsed = parsearRespuestasDISC(respuestasString);

  if (!datosParsed || Object.keys(datosParsed.respuestas).length === 0) {
    alert("No se pudieron interpretar las respuestas del test.");
    return;
  }

  const resultado = calcularResultadosDISC(datosParsed);

  // Tests nuevos traen la letra real por pregunta (data.Detalle) → cálculo
  // del núcleo (discCore.js). Tests viejos: null → algoritmo anterior.
  const detalle = (window.DISCCore && window.DISCCore.tieneDetalle(data.Detalle)) ? data.Detalle : null;
  window.__discDetalle = detalle;
  if (!detalle) {
    const aviso = document.getElementById('avisoVersionAnterior');
    if (aviso) aviso.classList.remove('hidden');
  }

  // Render everything
  renderReport(data, resultado, datosParsed.respuestas, detalle);
  setupNavigation();

  // Hide loading, show report
  setTimeout(() => {
    document.getElementById('loadingScreen').classList.add('fade-out');
    document.getElementById('reportContainer').classList.remove('hidden');

    setTimeout(() => {
  setupRevealAnimations();

  // ✅ Mostrar la sección que ya viene activa en el HTML (o la del tab activo)
  const activeTab = document.querySelector('.nav-tab.active');
  const key = activeTab?.dataset.section || 'resumen';

  // Apagar todas
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));

  // Encender solo la correcta
  const initialSection = document.getElementById(`sec-${key}`);
  if (initialSection) {
    initialSection.classList.add('active');
    triggerReveals(initialSection);
  }
}, 100);

  }, 1200);
});

/*/ Imprimir Informe /*/

// ============================================================================
// PDF EXPORT — FIXED
// ============================================================================

// ============================================================================
// PDF EXPORT — MEJORADO CON ORDEN CORRECTO Y SALTOS DE PÁGINA
// ============================================================================
async function exportPDF() {
  // Usar el nuevo generador profesional
  if (typeof window.generarPDFInforme === 'function') {
    try {
      const stored = sessionStorage.getItem("discUserData");
      const data = JSON.parse(stored);
      const respuestasString = data.Respuestas || "";
      const datosParsed = parsearRespuestasDISC(respuestasString);
      const resultado = calcularResultadosDISC(datosParsed);
      
      await window.generarPDFInforme(data, resultado, datosParsed.respuestas);
    } catch (error) {
      console.error('Error generando PDF profesional:', error);
      alert('Hubo un error al generar el PDF. Por favor, intentá nuevamente.');
    }
    return;
  }
  
  // Fallback - si algo falla, avisar
  alert('El generador de PDF no está disponible. Por favor, recargá la página.');
}