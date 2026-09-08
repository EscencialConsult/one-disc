/**
 * discTextos.js — Contenido interpretativo del informe DISC.
 *
 * Única fuente de texto para el informe web (script.js) y el PDF
 * (pdfGenerator.js). Copia idéntica en public/legacy/.
 *
 * REGLA QUE JUSTIFICA ESTE ARCHIVO
 * --------------------------------
 * El modelo tiene DOS ejes ortogonales y el sistema los venía mezclando:
 * leía "orientación a personas" sobre el eje de ritmo, y por eso a un D alto
 * le decía "sociable" y a un S/C alto le decía "orientado a tareas".
 *
 *     RITMO = D+I (activo)  vs  S+C (pausado)   → velocidad, urgencia, cambio
 *     FOCO  = D+C (tareas)  vs  I+S (personas)  → qué se mira primero
 *
 * Por eso el contenido está partido en tres bloques que NO se ven entre sí:
 *
 *   RITMO  → recibe solo graf.ritmo. Solo puede hablar de velocidad.
 *   FOCO   → recibe solo graf.foco.  Solo puede hablar de prioridad.
 *   LETRA  → recibe la letra dominante. Es el único que puede combinar ambos
 *            ejes, porque una letra es justamente una combinación de los dos.
 *
 * Al escribir o editar textos acá, respetar el léxico de cada bloque:
 *
 *   RITMO: velocidad, urgencia, impaciencia, cambio, dinamismo, cautela,
 *          paciencia, reflexión, constancia.
 *   FOCO:  vínculos, empatía, clima, colaboración / resultados, procesos,
 *          datos, calidad, normas, objetivos.
 *   LETRA: todo lo que mezcla ambos (persuasión = rápido + personas;
 *          precisión = pausado + tareas; competitividad; mediación).
 *
 * Una palabra del léxico de FOCO dentro de un texto de RITMO (o al revés) es
 * exactamente el bug que este archivo existe para impedir.
 */
(function () {
  'use strict';

  // Mismos cortes que DISCCore.UMBRAL_PREDOMINANTE / UMBRAL_BAJO, a propósito:
  // que todos los umbrales del producto sean el mismo número hace el informe explicable.
  const ALTO = 60;
  const BAJO = 40;

  const RITMO = {
    activo: {
      clave: 'activo',
      titulo: 'Ritmo activo',
      resumen: 'Procesas y actúas rápido, con sentido de urgencia.',
      bullets: [
        'Actúas con rapidez y te cuesta esperar cuando algo se demora',
        'Prefieres entornos con movimiento, cambio y variedad',
        'Decides rápido, sin esperar a que todo esté completamente resuelto',
        'Te energiza avanzar; la inactividad te desgasta',
      ],
    },
    pausado: {
      clave: 'pausado',
      titulo: 'Ritmo pausado',
      resumen: 'Te tomas tiempo antes de actuar y sostienes el esfuerzo largo.',
      bullets: [
        'Te tomas tiempo para procesar antes de comprometerte con una acción',
        'Prefieres entornos previsibles, con reglas de juego estables',
        'Los cambios abruptos o sin aviso te incomodan',
        'Sostienes el esfuerzo en procesos largos sin perder constancia',
      ],
    },
    flexible: {
      clave: 'flexible',
      titulo: 'Ritmo flexible',
      resumen: 'Cambias de velocidad según lo que pide la situación.',
      bullets: [
        'Puedes acelerar cuando hay urgencia y bajar el ritmo cuando conviene',
        'No tienes una preferencia marcada por lo rápido ni por lo pausado',
        'Te adaptas tanto a picos de exigencia como a procesos largos',
      ],
    },
  };

  const FOCO = {
    tareas: {
      clave: 'tareas',
      titulo: 'Orientación a tareas',
      resumen: 'Lo primero que miras es el qué: el objetivo, el proceso, el resultado.',
      bullets: [
        'Frente a un problema, tu primera pregunta es qué hay que resolver',
        'Decides apoyándote en datos, hechos y criterios objetivos',
        'Valoras la competencia técnica y la calidad de lo que se entrega',
        'Distingues con claridad lo personal de lo profesional',
      ],
    },
    personas: {
      clave: 'personas',
      titulo: 'Orientación a personas',
      resumen: 'Lo primero que miras es el quién: cómo queda la gente y el vínculo.',
      bullets: [
        'Frente a un problema, tu primera pregunta es a quién afecta',
        'Consideras el impacto de las decisiones sobre el clima del equipo',
        'Valoras la confianza y la comunicación abierta como base del trabajo',
        'Para ti el resultado se sostiene sobre la relación, no al revés',
      ],
    },
    equilibrado: {
      clave: 'equilibrado',
      titulo: 'Balance entre tareas y personas',
      resumen: 'Ponderas el resultado y a la gente según el caso, sin sacrificar uno por el otro.',
      bullets: [
        'Puedes poner el foco en el objetivo o en el vínculo según lo que pida la situación',
        'No sacrificas sistemáticamente el resultado por el clima ni el clima por el resultado',
        'Te resulta natural mediar entre quienes priorizan una cosa y quienes priorizan la otra',
      ],
    },
  };

  const LETRA = {
    D: {
      letra: 'D',
      nombre: 'Dominancia',
      ubicacion: 'Ritmo activo + orientación a tareas',
      resumen: 'Vas rápido y vas al resultado. Tomas el control y decides.',
      bullets: [
        'Tomas la iniciativa y asumes la decisión cuando nadie la asume',
        'Te orientas al resultado concreto por sobre el proceso',
        'Toleras bien la presión y el riesgo',
        'Comunicas de forma directa, sin rodeos',
      ],
      fortalezas: [
        'Capacidad de decidir rápido y sostener la decisión bajo presión',
        'Foco sostenido en el objetivo, sin perderse en lo accesorio',
        'Autonomía: avanzas sin necesitar supervisión constante',
        'Tolerancia al riesgo y a los escenarios de alta exigencia',
        'Capacidad de destrabar situaciones que otros dejan estancadas',
      ],
      atencion: [
        'Impaciencia con los procesos que requieren tiempo',
        'Riesgo de decidir sin toda la información disponible',
        'La comunicación directa puede leerse como brusquedad',
        'Tendencia a saltarse pasos que después hay que rehacer',
        'Puedes delegar poco por querer asegurar el resultado',
      ],
      comunicacion: [
        'Ve al punto: da la conclusión antes que el proceso',
        'Presenta opciones concretas en lugar de instrucciones',
        'Respeta su autonomía y su necesidad de decidir',
        'Sé breve; no repitas lo que ya quedó claro',
        'Reconoce el resultado logrado, no el esfuerzo invertido',
      ],
      entorno: [
        'Objetivos claros, medibles y con responsabilidad definida',
        'Autonomía real para decidir dentro de su alcance',
        'Desafíos con exigencia y consecuencias visibles',
        'Poca supervisión de detalle',
        'Ritmo de trabajo alto y decisiones que no se estancan',
      ],
    },
    I: {
      letra: 'I',
      nombre: 'Influencia',
      ubicacion: 'Ritmo activo + orientación a personas',
      resumen: 'Vas rápido y vas por el vínculo. Conectas y movilizas.',
      bullets: [
        'Generas confianza y conexión con rapidez',
        'Movilizas a otros mediante el entusiasmo y la palabra',
        'Te mueves con comodidad en contextos nuevos y con gente nueva',
        'Aportas optimismo y energía al grupo',
      ],
      fortalezas: [
        'Capacidad de entusiasmar y poner en movimiento a un equipo',
        'Comunicación fluida y persuasiva',
        'Facilidad para abrir puertas y construir red de contactos',
        'Lectura rápida del clima de un grupo',
        'Optimismo que sostiene al equipo en momentos difíciles',
      ],
      atencion: [
        'Dispersión: muchas iniciativas abiertas y pocas cerradas',
        'Seguimiento flojo de lo que ya se puso en marcha',
        'Riesgo de comprometer más de lo que después se puede cumplir',
        'Incomodidad con el trabajo minucioso y solitario',
        'Las decisiones pueden quedar teñidas por el ánimo del momento',
      ],
      comunicacion: [
        'Deja lugar a la conversación antes de entrar en la agenda',
        'Reconoce su aporte delante del grupo',
        'Acompaña los acuerdos con un seguimiento concreto y escrito',
        'Mantén el intercambio dinámico; evita el monólogo técnico',
        'Cuando haga falta detalle, dáselo acotado y por escrito',
      ],
      entorno: [
        'Contacto frecuente con personas dentro y fuera de la organización',
        'Variedad de temas y proyectos',
        'Reconocimiento visible del aporte',
        'Trabajo en equipo por sobre el trabajo aislado',
        'Espacio para proponer e improvisar dentro de un marco',
      ],
    },
    S: {
      letra: 'S',
      nombre: 'Estabilidad',
      ubicacion: 'Ritmo pausado + orientación a personas',
      resumen: 'Vas con calma y vas por la gente. Sostienes y acompañas.',
      bullets: [
        'Sostienes el compromiso en el tiempo, sin altibajos',
        'Escuchas antes de opinar',
        'Priorizas la armonía del grupo',
        'Construyes confianza de a poco y para largo',
      ],
      fortalezas: [
        'Consistencia: se puede contar contigo de forma sostenida',
        'Escucha genuina, que baja la tensión de los conflictos',
        'Capacidad de sostener relaciones de trabajo de largo plazo',
        'Paciencia para acompañar procesos que llevan tiempo',
        'Estabilidad emocional que ordena el clima del equipo',
      ],
      atencion: [
        'Evitar el conflicto incluso cuando hay que plantearlo',
        'Resistencia a los cambios que llegan sin aviso',
        'Tendencia a no pedir lo que necesitas',
        'Las decisiones difíciles pueden quedar postergadas',
        'Riesgo de asumir carga ajena por no decir que no',
      ],
      comunicacion: [
        'Baja el ritmo y deja silencio para que responda',
        'Anuncia los cambios con tiempo y explica el porqué',
        'Pregunta explícitamente su opinión: no la va a ofrecer sola',
        'Reconoce el aporte sostenido, no solo los hitos visibles',
        'Evita presionar por una respuesta inmediata',
      ],
      entorno: [
        'Reglas de juego estables y previsibles',
        'Relaciones de trabajo duraderas',
        'Cambios anunciados y acompañados',
        'Seguridad sobre el rol y lo que se espera',
        'Clima de trabajo sin hostilidad ni competencia interna',
      ],
    },
    C: {
      letra: 'C',
      nombre: 'Cumplimiento',
      ubicacion: 'Ritmo pausado + orientación a tareas',
      resumen: 'Vas con calma y vas al criterio. Analizas y aseguras la calidad.',
      bullets: [
        'Analizas antes de comprometerte con una posición',
        'Trabajas con estándares y criterios explícitos',
        'Detectas el error o la inconsistencia que otros pasan por alto',
        'Fundamentas lo que afirmas',
      ],
      fortalezas: [
        'Precisión y estándar de calidad alto y sostenido',
        'Capacidad de análisis profundo y pensamiento crítico',
        'Decisiones bien fundamentadas, que resisten la revisión',
        'Detección temprana de errores y riesgos',
        'Orden y trazabilidad en el trabajo propio',
      ],
      atencion: [
        'Parálisis por análisis: la decisión se demora buscando certeza',
        'Perfeccionismo que encarece tareas de bajo impacto',
        'Rigidez frente a información o métodos nuevos',
        'La observación técnica puede recibirse como crítica personal',
        'Riesgo de perder oportunidades por exceso de cautela',
      ],
      comunicacion: [
        'Llega con datos, fuentes y respaldo',
        'Da tiempo para analizar antes de pedir una definición',
        'Sé consistente: los cambios de criterio sin explicación erosionan la confianza',
        'Separa la observación al trabajo de la evaluación a la persona',
        'Acota el alcance cuando la perfección no es necesaria',
      ],
      entorno: [
        'Criterios de calidad definidos y conocidos de antemano',
        'Tiempo suficiente para analizar antes de entregar',
        'Procesos claros y documentados',
        'Reconocimiento de la precisión, no solo de la velocidad',
        'Acceso a la información necesaria para fundamentar',
      ],
    },
  };

  /** Bloque de ritmo. Recibe SOLO el eje de ritmo — no puede hablar de foco. */
  function bloqueRitmo(ritmo) {
    if (ritmo.activo >= ALTO) return RITMO.activo;
    if (ritmo.activo <= BAJO) return RITMO.pausado;
    return RITMO.flexible;
  }

  /** Bloque de foco. Recibe SOLO el eje de foco — no puede hablar de ritmo. */
  function bloqueFoco(foco) {
    if (foco.tareas >= ALTO) return FOCO.tareas;
    if (foco.tareas <= BAJO) return FOCO.personas;
    return FOCO.equilibrado;
  }

  /**
   * Composición completa de una gráfica (Natural o Adaptado) de DISCCore.
   * Devuelve los tres bloques por separado: quien los renderiza decide el orden,
   * pero ninguno de los tres tuvo acceso a los datos de los otros.
   */
  function perfil(graf) {
    if (!graf || !graf.ritmo || !graf.foco) return null;
    return {
      ritmo: bloqueRitmo(graf.ritmo),
      foco: bloqueFoco(graf.foco),
      letra: LETRA[graf.dominante] || null,
      valores: { activo: graf.ritmo.activo, pausado: graf.ritmo.pausado, tareas: graf.foco.tareas, personas: graf.foco.personas },
    };
  }

  const DISCTextos = { ALTO, BAJO, RITMO, FOCO, LETRA, bloqueRitmo, bloqueFoco, perfil };

  if (typeof window !== 'undefined') window.DISCTextos = DISCTextos;
  if (typeof module !== 'undefined' && module.exports) module.exports = DISCTextos;
})();
