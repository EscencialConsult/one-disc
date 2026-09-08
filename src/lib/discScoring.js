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
/** true si el test trae la letra real por pregunta (cálculo nuevo, discCore.js). */
export function tieneCalculoReal(detalle) {
  return !!(typeof window !== 'undefined' && window.DISCCore && window.DISCCore.tieneDetalle(detalle));
}

export function calcularPerfilDominante(respuestasString, detalle) {
  // Tests nuevos: letra dominante por el valor real de cada letra (misma que
  // la barra más alta del informe). Tests viejos: ángulo de la rueda legacy.
  if (tieneCalculoReal(detalle)) {
    const c = window.DISCCore.calcular(detalle);
    return { natural: c.natural.dominante, adaptado: c.adaptado.dominante, legacy: false };
  }
  if (!respuestasString || typeof window.discToWheel !== 'function') return null;
  const parsed = parseRespuestasDisc(respuestasString);
  if (Object.keys(parsed).length === 0) return null;

  const { natural, adaptado } = window.discToWheel(parsed);
  return {
    natural: anguloADimension(natural.angle),
    adaptado: anguloADimension(adaptado.angle),
    legacy: true,
  };
}

/** Perfil completo (tests nuevos): vectores Natural/Adaptado 0-100 y estabilidad. null si es test viejo. */
export function calcularPerfilCompleto(detalle) {
  if (!tieneCalculoReal(detalle)) return null;
  const c = window.DISCCore.calcular(detalle);
  return {
    vectorNatural: c.natural.valores,
    vectorAdaptado: c.adaptado.valores,
    estabilidad: c.estabilidad,
    rolNatural: c.natural.polares.rol,
    rolAdaptado: c.adaptado.polares.rol,
  };
}

/**
 * Vector D/I/S/C (0-100 cada uno) del perfil Natural, para el módulo de
 * Job Matching (necesita las 4 dimensiones, no solo la letra dominante).
 *
 * public/legacy/discToWheel.js expone únicamente `discToWheel()`, que ya
 * devuelve coordenadas de la rueda (ángulo/radio) y no el vector crudo
 * intermedio — por eso este cálculo replica el mismo algoritmo de conteo
 * (mismo mapeo de preguntas 1-14, mismo +1/-1 por elección) en vez de
 * depender de un valor que el script legacy no expone.
 */
export function calcularVectorNatural100(respuestasString, detalle) {
  // Tests nuevos: escala real e independiente por letra (discCore.js).
  if (tieneCalculoReal(detalle)) return window.DISCCore.calcular(detalle).natural.valores;

  // Tests viejos: aproximación anterior (la letra específica no se guardó —
  // ver AUDITORIA_DISC_COMRURAL.md). Se mantiene solo por compatibilidad.
  const respuestas = parseRespuestasDisc(respuestasString);
  let D = 0, I = 0, S = 0, C = 0;

  for (let q = 1; q <= 14; q++) {
    const idMas = (q - 1) * 2 + 1;
    const idMenos = (q - 1) * 2 + 2;
    const valMas = respuestas[idMas];
    const valMenos = respuestas[idMenos];
    if (valMas === undefined || valMenos === undefined) continue;

    const dimMas = valMas === 5 ? (q - 1) % 2 : 2 + ((q - 1) % 2);
    const dimMenos = valMenos === 5 ? (q - 1) % 2 : 2 + ((q - 1) % 2);

    if (dimMas === 0) D++; else if (dimMas === 1) I++; else if (dimMas === 2) S++; else C++;
    if (dimMenos === 0) D--; else if (dimMenos === 1) I--; else if (dimMenos === 2) S--; else C--;
  }

  // Normaliza cada eje de [-14, 14] a [0, 100].
  const a100 = (v) => Math.max(0, Math.min(100, Math.round(((v + 14) / 28) * 100)));
  return { D: a100(D), I: a100(I), S: a100(S), C: a100(C) };
}

/** Cortes fijos de interpretación del % de compatibilidad Persona-Puesto. */
export function nivelCompatibilidad(pct) {
  if (pct >= 90) return { label: 'Excelente', color: 'text-green-400' };
  if (pct >= 70) return { label: 'Muy Buena', color: 'text-one-cyan' };
  if (pct >= 50) return { label: 'Aceptable', color: 'text-yellow-400' };
  return { label: 'Pobre', color: 'text-red-400' };
}

/**
 * % de compatibilidad Persona-Puesto: 100 menos el promedio de la
 * distancia absoluta entre el puesto ideal y el perfil Natural real,
 * en cada una de las 4 dimensiones (todas en escala 0-100).
 */
export function calcularCompatibilidad(puesto, vectorCandidato) {
  const diffD = Math.abs(puesto.d - vectorCandidato.D);
  const diffI = Math.abs(puesto.i - vectorCandidato.I);
  const diffS = Math.abs(puesto.s - vectorCandidato.S);
  const diffC = Math.abs(puesto.c - vectorCandidato.C);
  const diffProm = (diffD + diffI + diffS + diffC) / 4;
  const pct = Math.max(0, Math.min(100, Math.round(100 - diffProm)));
  return { pct, ...nivelCompatibilidad(pct) };
}

/** Promedia el vector Natural (0-100 por letra) de un grupo de personas — la "Cultura Actual". */
export function promedioVectorEquipo(personas) {
  if (!personas.length) return { D: 0, I: 0, S: 0, C: 0 };
  const suma = personas.reduce(
    (acc, p) => ({
      D: acc.D + p.vectorNatural.D,
      I: acc.I + p.vectorNatural.I,
      S: acc.S + p.vectorNatural.S,
      C: acc.C + p.vectorNatural.C,
    }),
    { D: 0, I: 0, S: 0, C: 0 }
  );
  const n = personas.length;
  return { D: Math.round(suma.D / n), I: Math.round(suma.I / n), S: Math.round(suma.S / n), C: Math.round(suma.C / n) };
}

/** Nomenclatura única del producto (misma que el Informe/PDF). */
export const DISC_NOMBRES = { D: 'Dominancia', I: 'Influencia', S: 'Estabilidad', C: 'Cumplimiento' };

/**
 * Afinidad entre dos personas con cálculo real: no compara "una letra", sino
 * (a) la distancia entre sus cuatro valores Natural (0-100), (b) si comparten
 * ritmo y prioridad según su letra dominante, y (c) cuánto se adapta cada uno
 * bajo presión. Devuelve null si alguna de las dos es un test viejo.
 */
export function afinidadPersonas(a, b) {
  if (!a || !b || a.legacy || b.legacy || !a.vectorNatural || !b.vectorNatural) return null;
  const letras = ['D', 'I', 'S', 'C'];
  const distancia = letras.reduce((acc, L) => acc + Math.abs(a.vectorNatural[L] - b.vectorNatural[L]), 0) / letras.length;
  const similitudVector = Math.max(0, Math.min(100, Math.round(100 - distancia)));
  const ejesA = DISC_AXIS[a.natural], ejesB = DISC_AXIS[b.natural];
  const compartenRitmo = ejesA.ritmo === ejesB.ritmo;
  const compartenPrioridad = ejesA.prioridad === ejesB.prioridad;
  const bonusEjes = (compartenRitmo ? 5 : 0) + (compartenPrioridad ? 5 : 0);
  const adaptacionA = a.estabilidad ? a.estabilidad.total : 0;
  const adaptacionB = b.estabilidad ? b.estabilidad.total : 0;
  // Si alguno cambia mucho bajo presión, la afinidad "en calma" es menos confiable.
  const penalAdaptacion = Math.round(Math.max(adaptacionA, adaptacionB) / 4);
  const pct = Math.max(0, Math.min(100, similitudVector + bonusEjes - penalAdaptacion));
  const nivel = pct >= 75 ? 'Alta' : pct >= 50 ? 'Media' : 'Baja';
  return { pct, nivel, similitudVector, compartenRitmo, compartenPrioridad, adaptacionA, adaptacionB };
}

/** Texto de brecha por eje entre la Cultura Actual (promedio del equipo) y la Cultura Ideal (definida por el Admin). */
export function narrativaBrechaCultura(actual, ideal) {
  const UMBRAL = 15;
  const frases = [];
  for (const letra of ['D', 'I', 'S', 'C']) {
    const diff = actual[letra] - ideal[letra];
    if (diff > UMBRAL) {
      frases.push(`Sobrerrepresentado en ${DISC_NOMBRES[letra]} (${letra}): la empresa tiene más de este estilo del que definiste como ideal.`);
    } else if (diff < -UMBRAL) {
      frases.push(`Falta desarrollar ${DISC_NOMBRES[letra]} (${letra}): está por debajo de lo que definiste como ideal.`);
    }
  }
  if (frases.length === 0) {
    return ['La cultura actual está alineada con la cultura ideal definida — no hay brechas mayores a 15 puntos en ningún eje.'];
  }
  return frases;
}

/** Ejes de cada estilo (mismo esquema que la rueda de cuadrantes: Tarea/Personas x Rápido/Pausado). */
export const DISC_AXIS = {
  D: { ritmo: 'Rápido', prioridad: 'Tareas' },
  I: { ritmo: 'Rápido', prioridad: 'Personas' },
  S: { ritmo: 'Pausado', prioridad: 'Personas' },
  C: { ritmo: 'Pausado', prioridad: 'Tareas' },
};

/** Colores hex de marca por estilo (para Chart.js, que no puede leer clases de Tailwind). */
export const DISC_HEX = { D: '#e05454', I: '#e4c76a', S: '#4ecb71', C: '#5498e0' };

/**
 * Nivel de riesgo de fricción entre dos estilos, según cuántos ejes
 * (ritmo/prioridad) comparten — mismo estilo: Bajo; comparten un eje:
 * Medio; no comparten ninguno (diagonales opuestas): Alto.
 */
export function nivelRiesgoRelacion(letraA, letraB) {
  if (letraA === letraB) return { nivel: 'Bajo', color: 'bg-green-500', textColor: 'text-green-400', emoji: '🟢' };
  const a = DISC_AXIS[letraA];
  const b = DISC_AXIS[letraB];
  const comparten = (a.ritmo === b.ritmo ? 1 : 0) + (a.prioridad === b.prioridad ? 1 : 0);
  if (comparten === 1) return { nivel: 'Medio', color: 'bg-yellow-500', textColor: 'text-yellow-400', emoji: '🟡' };
  return { nivel: 'Alto', color: 'bg-red-500', textColor: 'text-red-400', emoji: '🔴' };
}

/**
 * Contenido de referencia fijo (redactado a mano, no calculado) para cada
 * una de las 10 combinaciones únicas entre los 4 estilos — biblioteca de
 * consulta para RRHH, independiente de qué personas reales estén evaluadas.
 */
export const DISC_COMPATIBILIDAD = {
  'D-D': {
    similitudes: 'Ambos son rápidos y orientados a resultados — se entienden al instante y avanzan al mismo ritmo.',
    fortalezas: 'Alta velocidad de ejecución conjunta, decisiones rápidas, foco compartido en los objetivos.',
    tensiones: 'Pueden chocar por protagonismo o control: ambos quieren liderar, lo que puede generar competencia en vez de colaboración.',
    roles: ['Liderazgo compartido de proyectos de alta exigencia', 'Roles de decisión bajo presión'],
  },
  'I-I': {
    similitudes: 'Comparten ritmo rápido y foco en las personas — conectan fácil y generan buena energía en el equipo.',
    fortalezas: 'Gran capacidad de generar entusiasmo colectivo, comunicación fluida, ambiente ameno.',
    tensiones: 'Riesgo de dispersión: mucha conversación, poco seguimiento concreto de tareas; pueden competir por ser el centro de atención.',
    roles: ['Equipos comerciales o de atención al público', 'Marketing y relaciones públicas'],
  },
  'S-S': {
    similitudes: 'Comparten ritmo pausado y foco en las personas — generan un vínculo de confianza estable.',
    fortalezas: 'Gran estabilidad emocional del equipo, escucha mutua, bajo nivel de conflicto.',
    tensiones: 'Pueden evitar decisiones difíciles esperando que el otro las tome; poca urgencia para impulsar cambios.',
    roles: ['Soporte y atención al cliente de largo plazo', 'Acompañamiento y mediación'],
  },
  'C-C': {
    similitudes: 'Comparten ritmo pausado y foco en tareas/calidad — hablan el mismo idioma técnico.',
    fortalezas: 'Altísimo estándar de calidad y precisión conjunta, decisiones bien fundamentadas.',
    tensiones: 'Riesgo de sobre-análisis (parálisis por perfeccionismo) y debates interminables por detalles menores.',
    roles: ['Auditoría y control de calidad', 'Investigación y análisis técnico profundo'],
  },
  'D-I': {
    similitudes: 'Comparten el ritmo rápido — ambos quieren avanzar ya, sin vueltas.',
    fortalezas: 'Combinan ambición de resultados (D) con capacidad de entusiasmar y movilizar gente (I) — buena dupla para liderar e inspirar al mismo tiempo.',
    tensiones: 'La D quiere ir directo al resultado sin preámbulos; la I necesita el vínculo social y la conversación antes de actuar. La D puede sentir que la I "se dispersa", y la I puede sentir a la D "fría o brusca".',
    roles: ['Liderazgo de ventas', 'Apertura de nuevos mercados', 'Movilización de equipos y relaciones públicas'],
  },
  'D-S': {
    similitudes: 'No comparten ni ritmo ni prioridad — es la combinación con más potencial de fricción.',
    fortalezas: 'Bien gestionada, es muy complementaria: la D aporta velocidad y dirección, la S aporta estabilidad y ejecución consistente en el tiempo.',
    tensiones: 'La D quiere acción inmediata orientada a resultados; la S necesita tiempo para procesar y prioriza a las personas por sobre la urgencia. Sin acuerdos explícitos, la D puede sentir a la S "lenta", y la S puede sentir a la D "atropelladora".',
    roles: ['Operaciones', 'Transformación ágil con acompañamiento', 'Ejecución consistente de estrategia'],
  },
  'D-C': {
    similitudes: 'Comparten la prioridad por las tareas y los resultados.',
    fortalezas: 'Equilibrio entre innovación/velocidad (D) y rigor técnico (C) — dupla fuerte para ejecutar estrategias complejas con calidad.',
    tensiones: 'La D busca resultados rápidos, a veces saltándose pasos; la C frena el proceso buscando precisión y detalle. La D puede sentir a la C "lenta", la C puede sentir a la D "descuidada".',
    roles: ['Investigación y desarrollo (I+D)', 'Planificación y ejecución de estrategias complejas', 'Gestión de proyectos'],
  },
  'I-S': {
    similitudes: 'Comparten la prioridad por las personas y el vínculo.',
    fortalezas: 'Combinan calidez y cercanía genuina — muy buena dupla para roles que dependen de la confianza humana.',
    tensiones: 'La I necesita estímulo y variedad constante; la S necesita estabilidad y previsibilidad. La I puede sentir a la S "poco entusiasta", la S puede sentir a la I "inconstante".',
    roles: ['Recursos Humanos', 'Atención al cliente', 'Soporte', 'Mediación y formación'],
  },
  'I-C': {
    similitudes: 'No comparten ni ritmo ni prioridad — combinación de alto potencial de fricción.',
    fortalezas: 'La I aporta cercanía y capacidad de conexión; la C aporta rigor y precisión — juntos dan una experiencia cálida y técnicamente sólida.',
    tensiones: 'La I es rápida y emocional; la C es pausada, racional y analítica. La I puede sentir a la C "fría o distante", la C puede sentir a la I "poco rigurosa".',
    roles: ['Venta técnica o consultiva', 'Gestión de proyectos con trato constante al cliente'],
  },
  'S-C': {
    similitudes: 'Comparten el ritmo pausado — ambos avanzan con cautela y evitan el apuro.',
    fortalezas: 'Combinan estabilidad (S) con precisión técnica (C) — dupla confiable para tareas que requieren consistencia sostenida.',
    tensiones: 'La S prioriza el bienestar de las personas; la C prioriza el proceso y la exactitud. La S puede sentir a la C "rígida", la C puede sentir a la S "poco exigente".',
    roles: ['Administración', 'Finanzas', 'Auditoría', 'Control de calidad', 'Operaciones y soporte técnico'],
  },
};

/** Busca la compatibilidad entre 2 estilos sin importar el orden en que se pasen. */
export function obtenerCompatibilidad(letraA, letraB) {
  return DISC_COMPATIBILIDAD[`${letraA}-${letraB}`] || DISC_COMPATIBILIDAD[`${letraB}-${letraA}`] || null;
}

/**
 * Estadísticas agregadas del equipo (KPIs tipo "mini resumen"), sobre el
 * perfil Natural de cada persona: cuántos estilos están presentes, cuál
 * domina, qué eje (ritmo/prioridad) predomina, y un índice de diversidad
 * (misma fórmula que un conteo por categorías: proporción de estilos
 * presentes sobre el total posible, penalizada si un estilo concentra
 * más de la mitad del equipo).
 */
export function calcularStatsEquipo(personas) {
  const total = personas.length;
  const distribucion = { D: 0, I: 0, S: 0, C: 0 };
  personas.forEach((p) => {
    if (distribucion[p.natural] !== undefined) distribucion[p.natural]++;
  });

  const estilosPresentes = Object.values(distribucion).filter((n) => n > 0).length;
  const [letraDominante, countDominante] = Object.entries(distribucion).sort((a, b) => b[1] - a[1])[0];

  const ritmo = { Rápido: distribucion.D + distribucion.I, Pausado: distribucion.S + distribucion.C };
  const ritmoDominante = ritmo['Rápido'] >= ritmo['Pausado'] ? 'Rápido' : 'Pausado';

  const prioridad = { Tareas: distribucion.D + distribucion.C, Personas: distribucion.I + distribucion.S };
  const prioridadDominante = prioridad['Tareas'] >= prioridad['Personas'] ? 'Tareas' : 'Personas';

  const diversidad =
    total > 0 && estilosPresentes > 0
      ? Math.min(100, Math.round((estilosPresentes / 4) * 100 * (1 - Math.abs(0.5 - countDominante / total))))
      : 0;

  return {
    total,
    distribucion,
    estilosPresentes,
    letraDominante,
    ritmo,
    ritmoDominante,
    prioridad,
    prioridadDominante,
    diversidad,
  };
}

/** Texto de relación entre dos estilos, según cuánto comparten de ritmo/prioridad. */
export function narrativaRelacion(letraA, letraB) {
  const a = DISC_AXIS[letraA];
  const b = DISC_AXIS[letraB];
  if (!a || !b) return '';

  const compartenRitmo = a.ritmo === b.ritmo;
  const compartenPrioridad = a.prioridad === b.prioridad;

  if (letraA === letraB) {
    return `Comparten el mismo estilo (${letraA}): mismo ritmo (${a.ritmo}) y misma prioridad (${a.prioridad}). Se van a entender rápido y sin fricción — el riesgo es que, al parecerse tanto, refuercen el mismo punto ciego en vez de complementarse.`;
  }
  if (compartenRitmo && !compartenPrioridad) {
    return `Comparten el ritmo (${a.ritmo}) pero difieren en la prioridad: uno se enfoca en ${a.prioridad.toLowerCase()}, el otro en ${b.prioridad.toLowerCase()}. La fricción más probable va a estar en QUÉ atender primero, no en la velocidad para hacerlo.`;
  }
  if (!compartenRitmo && compartenPrioridad) {
    return `Comparten la prioridad (${a.prioridad}) pero difieren en el ritmo: uno necesita avanzar rápido, el otro necesita más tiempo para procesar. La fricción más probable va a estar en los tiempos, no en el objetivo — de hecho suelen coincidir en el fondo.`;
  }
  return `No comparten ni el ritmo ni la prioridad — es la combinación con más potencial de fricción inicial, pero también la que más se complementa una vez que aprenden a leerse mutuamente.`;
}

/** Consejos "qué hacer / qué evitar" al relacionarse con cada estilo — dirección A→B (cómo A debería tratar a B). */
export const DISC_PAIR_ADVICE = {
  D: {
    D: {
      hacer: ['Ir directo al punto, sin rodeos', 'Respetar su autonomía y dejarlo decidir', 'Reconocer sus logros en público', 'Dar opciones concretas en vez de órdenes'],
      evitar: ['Repetir lo mismo varias veces', 'Cuestionar su autoridad delante de otros', 'Mostrarte indeciso', 'Hacerlo esperar sin explicación'],
    },
    I: {
      hacer: ['Mantener el ritmo alto de la conversación', 'Dejar un espacio breve para lo social antes de ir al grano', 'Reconocer su entusiasmo e ideas', 'Darle protagonismo frente al grupo'],
      evitar: ['Ser seco o cortante', 'Ignorar sus ideas creativas', 'Enfocarte solo en números sin reconocer el vínculo', 'Apurarlo a decidir sin dejarlo procesar en voz alta'],
    },
    S: {
      hacer: ['Bajar el ritmo al hablarle', 'Explicar el "por qué" del cambio con calma', 'Dar tiempo para procesar antes de pedir una respuesta', 'Reconocer su lealtad y consistencia'],
      evitar: ['Presionarlo a decidir rápido', 'Cambiar de planes de golpe sin aviso', 'Mostrar impaciencia o levantar la voz', 'Ignorar cómo se siente el equipo'],
    },
    C: {
      hacer: ['Llegar con datos y respaldo antes de proponer algo', 'Dar tiempo para analizar antes de pedir una decisión', 'Reconocer su precisión', 'Ser consistente con lo que decís'],
      evitar: ['Improvisar sin datos', 'Apurarlo a decidir sin análisis', 'Ser vago o contradictorio', 'Tomar atajos que bajen la calidad'],
    },
  },
  I: {
    D: {
      hacer: ['Ir al grano y mostrar resultados concretos', 'Dejarlo liderar la conversación', 'Ser eficiente con su tiempo', 'Mostrar seguridad en lo que proponés'],
      evitar: ['Extenderte en charla social antes de lo importante', 'Mostrarte indeciso', 'Pedir demasiada validación emocional', 'Demorar la decisión'],
    },
    I: {
      hacer: ['Disfrutar la buena energía compartida', 'Mantener el entusiasmo mutuo', 'Dar espacio para que ambos hablen', 'Usar el vínculo para motivar al equipo'],
      evitar: ['Dejar que la charla se disperse sin definir acciones', 'Competir por protagonismo', 'Prometer de más sin seguimiento'],
    },
    S: {
      hacer: ['Bajar el ritmo y escuchar más de lo que hablás', 'Generar un ambiente cálido y seguro', 'Dar seguimiento personal genuino'],
      evitar: ['Abrumarlo con demasiadas ideas nuevas de golpe', 'Forzarlo a exponerse frente al grupo', 'Cambiar de tema todo el tiempo'],
    },
    C: {
      hacer: ['Traer datos y estructura a la conversación', 'Respetar sus tiempos de análisis', 'Ser puntual y organizado', 'Reconocer su expertise técnico'],
      evitar: ['Ser desordenado con la información', 'Prometer sin poder cumplir', 'Minimizar sus objeciones técnicas', 'Hablar de más sin ir al punto'],
    },
  },
  S: {
    D: {
      hacer: ['Ser directo y breve', 'Mostrar una postura clara', 'Proponer soluciones concretas', 'Respetar que quiera avanzar rápido'],
      evitar: ['Dar vueltas antes de decir lo que pensás', 'Evitar el conflicto cuando hay que dar una opinión firme', 'Tomarte su brusquedad como algo personal'],
    },
    I: {
      hacer: ['Mostrar entusiasmo genuino, aunque sea moderado', 'Participar activamente en la conversación social', 'Compartir tus ideas sin miedo a exponerte'],
      evitar: ['Quedarte callado esperando que adivine lo que pensás', 'Evitar el contacto social que necesita', 'Frenar su energía sin dar una alternativa'],
    },
    S: {
      hacer: ['Generar un espacio de confianza mutua', 'Dar tiempo para procesar cambios juntos', 'Apoyarse en la estabilidad compartida'],
      evitar: ['Evitar decisiones difíciles esperando que el otro las tome', 'Quedarse en la zona de confort sin avanzar', 'No hablar de lo que realmente incomoda'],
    },
    C: {
      hacer: ['Ser consistente y confiable', 'Dar información completa y ordenada', 'Respetar su necesidad de precisión'],
      evitar: ['Ser vago con los detalles', 'Cambiar de opinión sin explicar por qué', 'Tomarte sus preguntas como desconfianza'],
    },
  },
  C: {
    D: {
      hacer: ['Ser directo y presentar la conclusión antes que el proceso', 'Respetar su urgencia', 'Dar opciones claras y acotadas'],
      evitar: ['Explayarte en el detalle del análisis antes de la conclusión', 'Cuestionar su decisión sin datos sólidos', 'Demorar la respuesta'],
    },
    I: {
      hacer: ['Sumar calidez y reconocimiento a la interacción', 'Dar espacio a la charla informal antes de lo técnico', 'Ser flexible en la forma aunque no en el fondo'],
      evitar: ['Ser excesivamente crítico o correctivo en público', 'Ignorar el aspecto humano de la relación', 'Imponer procesos rígidos sin explicar el beneficio'],
    },
    S: {
      hacer: ['Dar el tiempo que necesita para adaptarse a los cambios', 'Ser paciente y claro en las explicaciones', 'Reconocer su compromiso silencioso'],
      evitar: ['Imponer cambios abruptos sin acompañamiento', 'Ser frío o excesivamente técnico sin conexión personal'],
    },
    C: {
      hacer: ['Compartir datos y fuentes confiables', 'Respetar el proceso de análisis del otro', 'Buscar consenso basado en evidencia'],
      evitar: ['Entrar en debates interminables por perfeccionismo', 'Perder de vista la acción por sobre-analizar', 'Ser rígido ante nueva información válida'],
    },
  },
};
