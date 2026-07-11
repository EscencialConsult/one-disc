(function () {
  'use strict';

  if (!window.ManualTheme) throw new Error('ManualTheme.js debe cargarse antes de Manual.js');

  /* ═══════════════════════════════════════════════════════════
     STATIC LOOKUP TABLES
  ═══════════════════════════════════════════════════════════ */
  const PROFILE_LABELS = {
    'D':   'CONDUCTOR (D)',    'D/I': 'PERSUASOR (D/I)',
    'I':   'PROMOTOR (I)',     'I/S': 'RELACIONADOR (I/S)',
    'S':   'SOSTENEDOR (S)',   'S/C': 'COORDINADOR (S/C)',
    'C':   'ANALIZADOR (C)',   'C/D': 'IMPLEMENTADOR (C/D)',
  };
  const SECTION_TITLES = [
    'Carta Personal de Bienvenida',
    'Tu Perfil DISC: Quién Eres',
    'Tus Fortalezas Naturales de Liderazgo',
    'Tu Mapa de Energía y Estrés',
    'Liderazgo Situacional desde tu Perfil',
    'Trabajo en Equipo: Tu Rol Natural',
    'Comunicación Estratégica con Otros Estilos',
    'Resolución de Conflictos',
    'Desarrollo de Habilidades Complementarias',
    'Plan de Acción Personal 90 Días',
    'Recursos y Herramientas Prácticas',
    'Compromisos y Seguimiento',
  ];
  const PROFILE_ROLE = {
    'D':'Movilizador', 'D/I':'Impulsor Persuasivo', 'I':'Conector',
    'I/S':'Relacionador Empático', 'S':'Sostenedor', 'S/C':'Coordinador Confiable',
    'C':'Analizador Estratégico', 'C/D':'Implementador',
  };

  /* ═══════════════════════════════════════════════════════════
     DIMENSION CORE DATA
  ═══════════════════════════════════════════════════════════ */
  const DIM = {
    D: {
      name:'Dominancia', color:[210,38,38], focus:'resultado, velocidad y control del rumbo',
      strengths:[
        'Tomás decisiones con rapidez cuando otros todavía están evaluando opciones y posibilidades.',
        'Sostenés el foco en objetivos medibles y no perdés energía en lo accesorio o lo que no avanza.',
        'Te hacés cargo de conversaciones complejas y escenarios de alta presión sin perder el norte.',
        'Movilizás a otros con dirección clara y una sensación de avance que genera tracción real en el equipo.',
        'Tenés capacidad natural para priorizar, cortar lo que no suma y avanzar con lo que sí importa.',
      ],
      energy:[
        'Desafíos exigentes con metas claras y plazos definidos',
        'Espacios con autonomía real para actuar sin microgestión',
        'Entornos donde se valora la velocidad, la decisión y los resultados concretos',
        'Competencia genuina: contextos donde podés superar tus propios resultados anteriores',
        'Roles con autoridad real y responsabilidad directa sobre resultados',
      ],
      stress:[
        'Burocracia, demora innecesaria y reuniones sin resolución ni decisiones concretas',
        'Personas que evitan la responsabilidad o postergan decisiones que deberían tomar',
        'Ser cuestionado sin argumentos sólidos o micromanageado sin justificación real',
        'Procesos que frenan la acción sin agregar valor al resultado',
      ],
      stressSignals:{
        early:'Aumentás el tono y la directividad; generás más urgencia de la necesaria en el equipo',
        mid:'Evitás explicar el razonamiento detrás de tus decisiones; tomás atajos en la comunicación',
        critical:'Pasás por sobre personas y procesos; el equipo siente que no puede cuestionar nada',
      },
      recovery:[
        'Tomá 10 minutos de pausa deliberada antes de responder a una situación de tensión',
        'Preguntate: "¿Qué necesita escuchar la otra persona antes de que yo hable?"',
        'Identificá el UN paso siguiente más importante en vez de querer resolver todo a la vez',
        'Buscá feedback de alguien de confianza sobre cómo tu estilo está impactando al equipo hoy',
      ],
      communication:'Tu comunicación tiende a ser directa, breve y orientada a resolver. Priorizás claridad sobre cordialidad cuando hay presión.',
      conflict:'Frente al conflicto, preferís ir al punto y aclarar rápido. Tu ventaja es la decisión; tu riesgo es que la otra persona sienta que no fue escuchada.',
      development:[
        'Escucha activa y profunda antes de decidir — resistí el impulso de interrumpir para proponer soluciones',
        'Comunicar el propósito y el "por qué" antes del "qué" y el "cómo" en cada instrucción importante',
        'Delegar con seguimiento sin invadir el proceso — definir el resultado esperado y soltar el método',
        'Gestionar el ritmo propio para no imponer velocidad cuando la situación no lo requiere',
        'Construir relaciones con las personas más allá del rol y los resultados del proyecto',
      ],
    },
    I: {
      name:'Influencia', color:[229,78,8], focus:'conexión, persuasión y energía social',
      strengths:[
        'Generás entusiasmo auténtico y hacés que otros quieran sumarse a lo que estás construyendo.',
        'Conectás rápido con personas nuevas y con climas organizacionales que otros tardan en leer.',
        'Comunicás con calidez, humor y buena llegada emocional que facilita la persuasión genuina.',
        'Le das impulso a ideas, vínculos y conversaciones que de otro modo no arrancarían solos.',
        'Tu capacidad de crear ambiente positivo en el equipo es una ventaja competitiva concreta.',
      ],
      energy:[
        'Interacción con personas diversas, visibilidad y espacios dinámicos con alta energía social',
        'Proyectos donde podés comunicar, persuadir o conectar personas con propósitos comunes',
        'Reconocimiento público de tu contribución y espacios para ser el portavoz de ideas',
        'Libertad para improvisar, aportar creatividad y conectar ideas de formas inesperadas',
        'Trabajo en equipo con personas entusiastas y receptivas a tus propuestas',
      ],
      stress:[
        'Trabajo solitario y aislado por períodos largos sin interacción significativa',
        'Ambientes rígidos, excesivamente formales o con poca tolerancia a la espontaneidad',
        'Falta de reconocimiento o invisibilización de tu contribución al trabajo del equipo',
        'Conflictos sin resolver que generan tensión sostenida en el grupo',
      ],
      stressSignals:{
        early:'Buscás más interacción social de lo habitual; te cuesta concentrarte en tareas solitarias',
        mid:'Buscás validación externa con más frecuencia; evitás activamente las conversaciones incómodas',
        critical:'Compromisos quedan sin cerrar; el entusiasmo baja abruptamente y te desconectás del equipo',
      },
      recovery:[
        'Agendá una conversación de confianza — no para resolver, sino para pensar el problema en voz alta',
        'Escribí los compromisos abiertos — tu mente se ordena mejor cuando los externaliza en papel',
        'Conectate con el propósito real de lo que estás haciendo para recuperar energía interna genuina',
        'Buscá una pequeña victoria concreta que puedas cerrar hoy y genere sensación real de avance',
      ],
      communication:'Tu comunicación es abierta, cálida y movilizadora. Tenés gran facilidad para adaptar el tono al contexto y al interlocutor en cada situación.',
      conflict:'Frente al conflicto, buscás preservar el vínculo y bajar la tensión. Tu riesgo es ceder demasiado para mantener la armonía sin resolver el fondo del problema.',
      development:[
        'Convertir el entusiasmo inicial en seguimiento consistente hasta el cierre real de compromisos',
        'Cerrar compromisos con la misma energía y disciplina con que los abrís — no solo iniciarlos',
        'Sostener conversaciones difíciles con firmeza y claridad, sin suavizar el mensaje central',
        'Desarrollar sistemas simples de seguimiento semanal para los compromisos que asumís',
        'Medir resultados concretos y medibles, no solo actividad y movimiento visible',
      ],
    },
    S: {
      name:'Estabilidad', color:[20,150,65], focus:'continuidad, apoyo y construcción de confianza',
      strengths:[
        'Sostenés procesos y personas con una consistencia que genera confianza profunda y duradera.',
        'Escuchás con atención genuina y creás un espacio de seguridad psicológica donde otros se abren.',
        'Aportás calma y estabilidad cuando el entorno se acelera o entra en modo de crisis sostenida.',
        'Construís relaciones de largo plazo que se mantienen incluso cuando el contexto cambia radicalmente.',
        'Tenés la capacidad de terminar los proyectos que otros abandonan cuando desaparece la novedad.',
      ],
      energy:[
        'Relaciones estables y de largo plazo con personas en las que confiás genuinamente',
        'Proyectos con inicio, proceso y cierre claros — saber exactamente qué se espera en cada etapa',
        'Reconocimiento sincero y personal de tu contribución — no masivo ni performativo, sino genuino',
        'Trabajo colaborativo con equipos donde la confianza mutua ya está establecida y sostenida',
        'Tiempo suficiente para prepararte y procesar antes de tomar decisiones que importan',
      ],
      stress:[
        'Cambios bruscos e inesperados sin tiempo de adaptación ni explicación del por qué ocurren',
        'Conflictos abiertos o ambientes de alta tensión interpersonal sostenida en el tiempo',
        'Sentir que tu lealtad o compromiso profundo no son valorados ni correspondidos',
        'Presión para decidir rápido sin información suficiente ni contexto claro',
      ],
      stressSignals:{
        early:'Te volvés más silencioso de lo habitual; tardás más en responder mensajes y consultas',
        mid:'Evitás conversaciones difíciles activamente; acumulás pequeños resentimientos sin verbalizarlos',
        critical:'Resistencia activa al cambio; desconexión emocional del equipo; dificultad para decidir',
      },
      recovery:[
        'Agendá 30 minutos de tiempo propio para procesar lo que está pasando sin interrupciones externas',
        'Hablá con una persona de confianza — no para que te resuelva, sino para escucharte pensar',
        'Escribí los puntos clave del problema; tu mente se ordena mejor cuando externaliza la información',
        'Definí cuál es el UN paso siguiente concreto que podés hacer hoy para empezar a avanzar',
      ],
      communication:'Tu comunicación es cuidadosa, paciente y orientada al vínculo. Tenés una habilidad especial para hacer sentir a las personas escuchadas y genuinamente comprendidas.',
      conflict:'Frente al conflicto, primero buscás contener y comprender. Tu riesgo es acumular tensión sin verbalizarla hasta que se desborda de forma más intensa de lo previsto.',
      development:[
        'Hacer visible tu punto de vista con decisión — expresar lo que pensás aunque genere incomodidad',
        'Poner límites claros sin culpa excesiva ni disculpas innecesarias que diluyen el mensaje',
        'Acelerar las decisiones cuando el contexto lo requiere, sin esperar la información perfecta',
        'Iniciar conversaciones difíciles antes de que el problema escale por sí solo sin intervención',
        'Comunicar logros propios y del equipo de forma activa y sin esperar que se note sin más',
      ],
    },
    C: {
      name:'Cumplimiento', color:[6,110,185], focus:'calidad, precisión y pensamiento crítico',
      strengths:[
        'Detectás errores, riesgos y oportunidades de mejora mucho antes de que los vean los demás.',
        'Elevás la calidad del trabajo de todo el equipo con criterio técnico riguroso y bien fundamentado.',
        'Tomás decisiones con base sólida en datos y lógica, minimizando los riesgos de la implementación.',
        'Ordenás el caos organizacional mediante estructura, método y procesos claros y reproducibles.',
        'Tu capacidad analítica profunda es el recurso que los equipos necesitan para decidir mejor.',
      ],
      energy:[
        'Acceso a datos completos y tiempo suficiente para analizarlos antes de concluir y actuar',
        'Estándares de calidad claros, exigentes y consistentemente aplicados en todo el equipo',
        'Trabajo que requiere precisión técnica, pensamiento crítico y profundidad de análisis real',
        'Entornos estructurados con procesos bien definidos y respetados por todos los integrantes',
        'Reconocimiento por la exactitud, profundidad y calidad sostenida del trabajo producido',
      ],
      stress:[
        'Tener que decidir con datos insuficientes o en contextos de alta ambigüedad sin estructura',
        'Ambientes caóticos con poca estructura, procesos indefinidos o estándares bajos y variables',
        'Trabajar con personas que no valoran la calidad ni corrigen sus propios errores conscientemente',
        'Errores propios o ajenos que pasan sin revisión, corrección ni aprendizaje institucional',
      ],
      stressSignals:{
        early:'Revisás tu propio trabajo más veces de lo necesario; el perfeccionismo se intensifica notablemente',
        mid:'La parálisis por análisis se instala; la velocidad de decisión baja notablemente en todo',
        critical:'Distancia emocional del equipo; dificultad extrema para delegar; bloqueo real de avance',
      },
      recovery:[
        'Aplicá la regla del 70%: si tenés el 70% de la información que necesitás, es suficiente para actuar',
        'Poné un plazo explícito a la fase de análisis antes de iniciarla — sabé de antemano cuándo termina',
        'Preguntate: "¿Qué es lo peor que puede pasar si actúo ahora con esta información?" — casi siempre es manejable',
        'Pedí feedback sobre el impacto humano de tus decisiones — no solo sobre su solidez técnica',
      ],
      communication:'Tu comunicación es precisa, lógica y bien estructurada. Priorizás exactitud y fundamento, a veces a costa de la conexión emocional con el interlocutor.',
      conflict:'Frente al conflicto, necesitás hechos claros y conversación ordenada. Tu riesgo es que la otra persona sienta que el diálogo es un debate técnico y no una conversación humana.',
      development:[
        'Decidir con información suficiente, no perfecta — la certeza absoluta raramente existe en la práctica',
        'Conectar con el impacto emocional de tus palabras y decisiones en las personas que te rodean',
        'Visibilizar tu aporte activamente sin esperar que se note solo — comunicarlo de forma explícita',
        'Delegar con confianza — entender que "diferente" no es automáticamente igual a "incorrecto"',
        'Gestionar el tiempo de análisis para no frenar la acción del equipo con revisiones infinitas',
      ],
    },
  };

  /* ═══════════════════════════════════════════════════════════
     PROFILE-LEVEL CONTENT
  ═══════════════════════════════════════════════════════════ */
  const PROFILE_DESC = {
    'D':  'Tu perfil muestra una orientación dominante hacia la acción directa, los resultados concretos y la toma de decisiones bajo presión.',
    'D/I':'Tu perfil combina el empuje orientado a resultados del Conductor con la capacidad genuina de conectar con personas y generar entusiasmo real.',
    'I':  'Tu perfil muestra una fortaleza natural para conectar, comunicar y generar la energía social que moviliza equipos hacia resultados.',
    'I/S':'Tu perfil combina la calidez relacional del promotor con la estabilidad del sostenedor — generás confianza profunda y duradera.',
    'S':  'Tu perfil muestra consistencia, profundidad relacional y confiabilidad que constituyen la base de un liderazgo verdaderamente duradero.',
    'S/C':'Tu perfil integra la estabilidad relacional con el rigor analítico — cuidás a las personas y los procesos con la misma profundidad y método.',
    'C':  'Tu perfil muestra una fuerte orientación hacia la calidad, el análisis riguroso y la toma de decisiones bien fundamentadas en evidencia.',
    'C/D':'Tu perfil combina análisis profundo con capacidad concreta de implementar — no solo identificás el problema, también lo resolvés.',
  };

  const PROFILE_QUOTES = {
    'D':  '[NOMBRE], tu fortaleza está en avanzar con claridad cuando otros dudan y en transformar la presión en dirección concreta.',
    'D/I':'[NOMBRE], combinás ambición de resultados con una capacidad real de movilizar a otros hacia esa meta con entusiasmo genuino.',
    'I':  '[NOMBRE], tu liderazgo crece cuando tu energía conecta personas, propósito y acción de forma que otros quieran seguirte.',
    'I/S':'[NOMBRE], tu valor está en crear vínculos de confianza tan sólidos que sostienen el rendimiento de largo plazo.',
    'S':  '[NOMBRE], tu liderazgo se construye sobre consistencia, calma y una presencia que da seguridad cuando todo cambia.',
    'S/C':'[NOMBRE], tu diferencial está en unir calidad técnica, método riguroso y genuino cuidado por las personas.',
    'C':  '[NOMBRE], tu mirada rigurosa mejora decisiones, procesos y resultados donde otros aún no ven el riesgo.',
    'C/D':'[NOMBRE], tu fortaleza real aparece cuando convertís análisis claro y profundo en implementación concreta y efectiva.',
  };

  const PROFILE_QUADRANT = {
    'D':  'Tu perfil D te posiciona como un líder de acción directa. Ves los objetivos con claridad, vas por ellos y movilizás recursos con naturalidad. Tu fuerza no está en el análisis interminable sino en la capacidad de avanzar cuando otros dudan. Esto te convierte en un activo de alto valor en contextos que necesitan dirección clara y velocidad de ejecución.',
    'D/I':'Tu perfil D/I te ubica como un líder Persuasor: alguien que combina la orientación a resultados del Conductor con una capacidad genuina de conectar con las personas. Podés ser directo y decidido cuando el contexto lo requiere, y carismático y movilizador cuando la situación demanda conexión y entusiasmo.',
    'I':  'Tu perfil I te posiciona como un líder Promotor: alguien que influye desde la energía, la comunicación y la conexión humana. No imponés — inspirás. No ordenás — convencés. Tu entorno de trabajo se convierte en un espacio de alto engagement donde las personas quieren participar y dar lo mejor.',
    'I/S':'Tu perfil I/S te posiciona como un líder Relacionador: alguien que combina la calidez y capacidad de conexión del Promotor con la paciencia y lealtad profunda del Sostenedor. Generás vínculos auténticos que se mantienen incluso bajo presión y en los momentos de mayor dificultad.',
    'S':  'Tu perfil S te posiciona como un líder Sostenedor: el que termina los proyectos, mantiene la calma cuando todo cambia y cuida a las personas con genuina coherencia. Tu liderazgo es de largo aliento — no necesitás protagonismo ni ruido para tener un impacto real y duradero.',
    'S/C':'Tu perfil S/C te posiciona como un líder Coordinador. Combinás la estabilidad relacional del Sostenedor con el rigor analítico del Analizador. Cuidás tanto los procesos como las personas al mismo tiempo, y esa combinación representa un valor diferencial en entornos de alta complejidad y exigencia.',
    'C':  'Tu perfil C te posiciona como un líder Analizador: el guardián de la calidad, el que hace las preguntas que nadie se anima a hacer, el que detecta riesgos antes de que sucedan. Tu liderazgo está fundamentado en la precisión técnica, el análisis profundo y el trabajo genuinamente bien hecho.',
    'C/D':'Tu perfil C/D te posiciona como un líder Implementador: alguien que no solo analiza los problemas en profundidad, sino que tiene la determinación concreta de actuar sobre ese análisis y producir resultados tangibles. Combinás la mente del analista con la ejecución del conductor.',
  };

  const WELCOME_TEXT = {
    'D':  (v) => `Buenos Aires, ${v.FECHA}\n\n${v.NOMBRE}:\n\nEste manual no es un documento genérico. Fue construido específicamente para vos a partir de los resultados de tu evaluación DISC, con un solo objetivo: ayudarte a liderar de manera más efectiva, más auténtica y más consciente.\n\nLo que descubriste en tu evaluación es valioso: sos un líder orientado a la acción, con capacidad natural para movilizar personas y recursos hacia resultados concretos. En un mundo que necesita personas que avancen cuando otros dudan, tu perfil es un activo de alto valor.\n\n${v.NOMBRE}, este manual también te va a invitar a ir más allá de tu zona de confort. No para cambiar quién sos — ese nunca será el objetivo — sino para ampliar tu repertorio de respuestas y ser aún más efectivo con las personas que liderás.\n\nLiderar desde tu perfil ${v.PERFIL_CODE} implica transformar el impulso natural en dirección clara y la urgencia en resultados que se sostienen en el tiempo.\n\nCon confianza en tu potencial,\nEquipo de Desarrollo de Liderazgo | ${v.ADMIN} | ${v.FECHA_AÑO}`,
    'D/I':(v) => `Buenos Aires, ${v.FECHA}\n\n${v.NOMBRE}:\n\nEste manual no es un documento genérico. Fue construido específicamente para vos a partir de los resultados de tu evaluación DISC, con un solo objetivo: ayudarte a liderar de manera más efectiva, más auténtica y más consciente.\n\nTu perfil combina una ambición real de resultados con una capacidad genuina de conectar con las personas y generar entusiasmo. Esa combinación es especialmente valiosa cuando hay que movilizar a otros hacia una meta ambiciosa sin perder el vínculo humano en el camino.\n\n${v.NOMBRE}, este manual te ayudará a convertir esa potencia natural en liderazgo más consciente, más consistente y más escalable.\n\nLiderar desde tu perfil ${v.PERFIL_CODE} implica empujar el cambio con claridad y sostenerlo desde la conexión genuina con las personas que te rodean.\n\nCon confianza en tu potencial,\nEquipo de Desarrollo de Liderazgo | ${v.ADMIN} | ${v.FECHA_AÑO}`,
    'I':  (v) => `Buenos Aires, ${v.FECHA}\n\n${v.NOMBRE}:\n\nEste manual no es un documento genérico. Fue construido específicamente para vos a partir de los resultados de tu evaluación DISC, con un solo objetivo: ayudarte a liderar de manera más efectiva, más auténtica y más consciente.\n\nTenés una fortaleza natural para conectar, inspirar y generar el tipo de clima que hace que la gente quiera involucrarse y dar lo mejor. Esa capacidad es escasa y genuinamente valiosa.\n\n${v.NOMBRE}, este manual te ayudará a transformar esa energía relacional en impacto sostenido — con más foco, más seguimiento y más claridad sobre el resultado que querés producir.\n\nLiderar desde tu perfil ${v.PERFIL_CODE} implica movilizar desde la comunicación y hacer que otros quieran involucrarse activamente en lo que estás construyendo.\n\nCon confianza en tu potencial,\nEquipo de Desarrollo de Liderazgo | ${v.ADMIN} | ${v.FECHA_AÑO}`,
    'I/S':(v) => `Buenos Aires, ${v.FECHA}\n\n${v.NOMBRE}:\n\nEste manual no es un documento genérico. Fue construido específicamente para vos a partir de los resultados de tu evaluación DISC, con un solo objetivo: ayudarte a liderar de manera más efectiva, más auténtica y más consciente.\n\nTu estilo integra la conexión humana con la estabilidad profunda — una combinación especialmente valiosa para liderar vínculos de confianza que se mantienen incluso bajo presión sostenida.\n\n${v.NOMBRE}, este manual te ayudará a usar esa capacidad relacional con más intención, más visibilidad y más decisión cuando el contexto lo requiere.\n\nLiderar desde tu perfil ${v.PERFIL_CODE} implica ser puente, sostén y referencia al mismo tiempo para las personas que liderás.\n\nCon confianza en tu potencial,\nEquipo de Desarrollo de Liderazgo | ${v.ADMIN} | ${v.FECHA_AÑO}`,
    'S':  (v) => `Buenos Aires, ${v.FECHA}\n\n${v.NOMBRE}:\n\nEste manual no es un documento genérico. Fue construido específicamente para vos a partir de los resultados de tu evaluación DISC, con un solo objetivo: ayudarte a liderar de manera más efectiva, más auténtica y más consciente.\n\nLo que descubriste en tu evaluación es valioso: sos una persona reflexiva, consistente, confiable y profundamente orientada al equipo. En un mundo que premia el ruido y la velocidad, tu capacidad de construir relaciones duraderas, ejecutar con constancia y mantener la calma bajo presión es una ventaja competitiva real.\n\n${v.NOMBRE}, este manual también te invita a expandir tu repertorio — a hacer más visible ese valor y a ampliar tu efectividad cuando el contexto exige velocidad o confrontación directa.\n\nLiderar desde tu perfil ${v.PERFIL_CODE} implica construir confianza y continuidad donde otros solo aportan intensidad efímera.\n\nCon confianza en tu potencial,\nEquipo de Desarrollo de Liderazgo | ${v.ADMIN} | ${v.FECHA_AÑO}`,
    'S/C':(v) => `Buenos Aires, ${v.FECHA}\n\n${v.NOMBRE}:\n\nEste manual no es un documento genérico. Fue construido específicamente para vos a partir de los resultados de tu evaluación DISC, con un solo objetivo: ayudarte a liderar de manera más efectiva, más auténtica y más consciente.\n\nTu perfil combina calidad rigurosa, profundidad de análisis y estabilidad relacional — algo especialmente valioso en contextos donde hay que cuidar tanto el proceso como las personas al mismo tiempo y con la misma dedicación.\n\n${v.NOMBRE}, este manual te ayudará a convertir esa solidez en un liderazgo más visible, más influyente y con mayor impacto organizacional sostenido.\n\nLiderar desde tu perfil ${v.PERFIL_CODE} implica ordenar, cuidar y mejorar sin perder nunca la humanidad que hace que las personas confíen genuinamente en vos.\n\nCon confianza en tu potencial,\nEquipo de Desarrollo de Liderazgo | ${v.ADMIN} | ${v.FECHA_AÑO}`,
    'C':  (v) => `Buenos Aires, ${v.FECHA}\n\n${v.NOMBRE}:\n\nEste manual no es un documento genérico. Fue construido específicamente para vos a partir de los resultados de tu evaluación DISC, con un solo objetivo: ayudarte a liderar de manera más efectiva, más auténtica y más consciente.\n\nTenés una mirada analítica profunda, un estándar de calidad genuinamente alto y la capacidad de ver riesgos antes de que otros los identifiquen siquiera. Esas son fortalezas críticas de liderazgo que pocas personas tienen de forma natural.\n\n${v.NOMBRE}, este manual te ayudará a usar esa fortaleza con mayor velocidad de implementación y conexión interpersonal — sin perder la profundidad que te distingue.\n\nLiderar desde tu perfil ${v.PERFIL_CODE} implica elevar el estándar del equipo sin aislarte de las personas que lo componen.\n\nCon confianza en tu potencial,\nEquipo de Desarrollo de Liderazgo | ${v.ADMIN} | ${v.FECHA_AÑO}`,
    'C/D':(v) => `Buenos Aires, ${v.FECHA}\n\n${v.NOMBRE}:\n\nEste manual no es un documento genérico. Fue construido específicamente para vos a partir de los resultados de tu evaluación DISC, con un solo objetivo: ayudarte a liderar de manera más efectiva, más auténtica y más consciente.\n\nTu perfil combina el pensamiento riguroso y la profundidad analítica con la capacidad concreta de ejecutar — una combinación muy valiosa para implementar mejoras complejas con fundamento sólido y real.\n\n${v.NOMBRE}, este manual te ayudará a ampliar tu impacto como líder conectando de forma más fluida el análisis profundo, la decisión oportuna y la comunicación que moviliza a otros hacia la acción.\n\nLiderar desde tu perfil ${v.PERFIL_CODE} implica transformar criterio riguroso en acción efectiva y sostenida en el tiempo.\n\nCon confianza en tu potencial,\nEquipo de Desarrollo de Liderazgo | ${v.ADMIN} | ${v.FECHA_AÑO}`,
  };

  /* ═══════════════════════════════════════════════════════════
     SITUATIONAL SCENARIOS  (4 per primary dimension)
  ═══════════════════════════════════════════════════════════ */
  const SCENARIOS = {
    D:[
      {label:'Escenario 1',title:'Equipo competente pero desmotivado',
       natural:'Tu tendencia es intervenir con dirección clara: definís el problema, ponés el objetivo en foco y empujás hacia la acción. Tu energía reactiva al grupo con rapidez.',
       why:'En contextos de baja motivación, la dirección clara y la sensación de avance que generás son exactamente lo que el equipo necesita para salir del estancamiento.',
       adjust:'Antes de definir la solución, tomá 5 minutos para escuchar qué está frenando al equipo. La motivación baja casi siempre tiene una causa que vale entender antes de dar la dirección.'},
      {label:'Escenario 2',title:'Nuevo integrante sin experiencia',
       natural:'Enseñás desde tu modelo: directo, orientado al resultado, con pocas explicaciones de contexto. Esperás que la persona entienda el estándar y lo ejecute.',
       why:'Tu eficiencia y claridad en las instrucciones le da al nuevo integrante una referencia concreta y exigente de cómo se hace el trabajo de calidad en este equipo.',
       adjust:'Las personas nuevas también necesitan entender el por qué detrás del qué. Tomá tiempo para explicar el propósito — eso multiplica el compromiso y la calidad de lo que se entrega.'},
      {label:'Escenario 3',title:'Crisis o cambio organizacional urgente',
       natural:'Tomás el control, analizás rápido y definís un plan de acción concreto. Tu capacidad de funcionar bien bajo presión es una ventaja real en este tipo de situaciones.',
       why:'El equipo necesita al menos una persona que no entre en pánico y que sepa tomar decisiones rápidas con información parcial. Ahí tu perfil brilla de forma natural.',
       adjust:'Las crisis también requieren que las personas sientan que alguien las escucha. Hacé espacio para que el equipo exprese su preocupación antes de avanzar al plan de acción.'},
      {label:'Escenario 4',title:'Colaborador de alto desempeño que necesita autonomía',
       natural:'Querés que el trabajo salga bien y tendés a monitorear el proceso de cerca para asegurarte de que así sea.',
       why:'Tu orientación a la calidad y el resultado hace que el seguimiento sea genuinamente importante para vos y para la organización.',
       adjust:'Los colaboradores de alto desempeño perciben el seguimiento cercano como señal de desconfianza. Definí el resultado esperado y el plazo, luego soltá el método. Esa es la delegación que construye liderazgo real.'},
    ],
    I:[
      {label:'Escenario 1',title:'Equipo competente pero desmotivado',
       natural:'Buscás entender cómo se siente cada persona, recalcás el propósito compartido y generás un espacio de reconocimiento que reactiva la energía del grupo.',
       why:'Tu capacidad de crear conexión emocional y hacer que las personas sientan que su contribución importa es exactamente lo que un equipo desmotivado necesita en este momento.',
       adjust:'Después de restaurar la energía, acompañá la motivación con claridad concreta sobre qué se espera de cada persona. La energía sin foco se dispersa y vuelve a caer rápido.'},
      {label:'Escenario 2',title:'Nuevo integrante sin experiencia',
       natural:'Creás un ambiente cálido de bienvenida, generás entusiasmo sobre el equipo y el proyecto, y hacés que la persona se sienta parte del grupo desde el primer día.',
       why:'El sentido de pertenencia temprano acelera la integración y la disposición a aprender. Tu capacidad de crear ese ambiente es un regalo real para quien llega nuevo.',
       adjust:'Además del entusiasmo, asegurate de darle estructura clara: qué se espera, cuándo, cómo se evalúa el avance. El entusiasmo sin expectativas claras genera confusión a mediano plazo.'},
      {label:'Escenario 3',title:'Crisis o cambio organizacional urgente',
       natural:'Mantenés el ánimo del equipo, comunicás con energía positiva y usás tu capacidad de conexión para que las personas no se desconecten durante la turbulencia.',
       why:'La cohesión del equipo durante la crisis es fundamental para la recuperación rápida. Tu rol como conector emocional es crítico en estos momentos de alta tensión.',
       adjust:'Las crisis también requieren decisiones claras y seguimiento concreto. Complementá la gestión emocional con estructura: qué hacemos, quién hace qué, para cuándo exactamente.'},
      {label:'Escenario 4',title:'Colaborador de alto desempeño que necesita autonomía',
       natural:'Confiás en la capacidad de la persona, le dejás espacio y te mantenés disponible para cuando necesite apoyo o quiera compartir los avances del proyecto.',
       why:'Tu baja necesidad de control y tu orientación al vínculo hacen que los colaboradores autónomos se sientan genuinamente cómodos trabajando con vos.',
       adjust:'Acordá checkpoints claros — no para controlar, sino para que el colaborador sepa que su trabajo es importante y está siendo seguido. La autonomía sin visibilidad puede convertirse en invisibilidad.'},
    ],
    S:[
      {label:'Escenario 1',title:'Equipo competente pero desmotivado',
       natural:'Escuchás activamente a cada persona para entender qué está pasando, creás un espacio de seguridad psicológica y generás la estabilidad que el equipo necesita para recuperarse.',
       why:'La gente competente que perdió motivación generalmente necesita ser escuchada, no empujada. Tu paciencia y genuina orientación hacia las personas es exactamente lo que se necesita.',
       adjust:'Una vez que escuchaste, comunicá también tu confianza en la capacidad del equipo de forma explícita. Los líderes S asumen a veces que la otra persona ya sabe lo que piensan de ella — no siempre es así.'},
      {label:'Escenario 2',title:'Nuevo integrante sin experiencia',
       natural:'Explicás el cómo y el por qué de cada proceso con paciencia genuina, asegurándote de que la persona no solo entienda la tarea sino también el contexto que la rodea.',
       why:'Tu orientación a los procesos y tu paciencia hacen que los nuevos integrantes aprendan bien desde el principio, sin tomar atajos que generen problemas más adelante.',
       adjust:'Las personas nuevas también necesitan entusiasmo y celebración de sus primeros logros, aunque sean pequeños. Agregá expresiones explícitas de bienvenida y reconocimiento temprano.'},
      {label:'Escenario 3',title:'Crisis o cambio organizacional urgente',
       natural:'Mantenés la calma, analizás con cuidado y no tomás decisiones apresuradas. Tu estabilidad emocional es un recurso crítico para el equipo en los momentos de mayor tensión.',
       why:'En momentos de crisis, el equipo necesita al menos una persona que no entre en pánico. Tu presencia estable permite que otros piensen con mucha más claridad.',
       adjust:'Las crisis también requieren acción rápida. Practicá el concepto de "decisión suficiente con información suficiente". Esperar al 100% de certeza puede ser más costoso que actuar con el 70%.'},
      {label:'Escenario 4',title:'Colaborador de alto desempeño que necesita autonomía',
       natural:'Tendés a querer acompañar los procesos de cerca para asegurarte de que se hacen con la calidad que corresponde y para estar disponible si surge algún problema.',
       why:'Tu genuina preocupación por el éxito de los demás es valorada, y tu disponibilidad crea una red de seguridad real para el colaborador en momentos difíciles.',
       adjust:'Los colaboradores de alto desempeño interpretan el seguimiento cercano como desconfianza. Esta puede ser tu mayor oportunidad de crecimiento: definí el qué y el para cuándo, y soltá el cómo con confianza real.'},
    ],
    C:[
      {label:'Escenario 1',title:'Equipo competente pero desmotivado',
       natural:'Buscás entender la causa raíz con datos y análisis concretos, y una vez que la identificás, proponés soluciones fundamentadas que atacan el problema real y profundo.',
       why:'Muchas veces la desmotivación tiene causas sistémicas que se resuelven con cambios concretos de proceso o estructura. Tu capacidad de ver esas causas es muy valiosa.',
       adjust:'Además del análisis del problema, las personas desmotivadas necesitan sentir que alguien se interesa genuinamente por cómo se sienten, no solo por diagnosticar su rendimiento. Entrá primero por el vínculo.'},
      {label:'Escenario 2',title:'Nuevo integrante sin experiencia',
       natural:'Enseñás con rigor y detalle: los procesos correctos, los estándares esperados y los criterios de calidad. Querés que la persona aprenda bien desde el principio.',
       why:'Tu orientación a la calidad y los procesos hace que los nuevos integrantes adopten buenos hábitos desde el inicio — eso genera resultados consistentes a mediano plazo.',
       adjust:'El nuevo integrante también necesita saber que puede cometer errores sin consecuencias graves al inicio. Balanceá la exigencia con un mensaje explícito de que aprender lleva tiempo.'},
      {label:'Escenario 3',title:'Crisis o cambio organizacional urgente',
       natural:'Analizás la situación con profundidad, buscás los datos relevantes y querés entender el problema completamente antes de proponer cualquier solución.',
       why:'Tu capacidad de analizar sin entrar en pánico y de identificar la causa real del problema (no solo sus síntomas) es un recurso crítico en momentos de alta presión.',
       adjust:'Las crisis tienen ventanas de tiempo acotadas. La regla del 70%: con el 70% de la información que querés tener, ya podés tomar una decisión suficientemente buena. Esperarte al 100% puede tener un costo muy alto.'},
      {label:'Escenario 4',title:'Colaborador de alto desempeño que necesita autonomía',
       natural:'Definís expectativas de calidad muy claras y te asegurás de que la persona entienda exactamente cuál es el estándar esperado en cada entrega.',
       why:'Tu claridad sobre los estándares le da al colaborador una referencia objetiva y concreta de lo que significa "bien hecho" en este contexto.',
       adjust:'Una vez que definiste el estándar, confiá en la capacidad del colaborador para alcanzarlo a su manera. "Diferente" no siempre significa "incorrecto". La delegación real incluye soltar el método también.'},
    ],
  };

  /* ═══════════════════════════════════════════════════════════
     TEAM INTERACTION TABLE ROWS  (per primary dimension)
  ═══════════════════════════════════════════════════════════ */
  const TEAM_ROWS = {
    D:[['Conductor (D)','Directos, urgentes y orientados a resultados. Deciden rápido y esperan lo mismo.','Tu decisión complementa la suya. Definan roles claros para evitar colisión de autoridades.','Competitividad entre Ds puede generar fricción. Definí quién tiene autoridad en qué área.'],
       ['Promotor (I)','Entusiastas y creativos. Generan ideas brillantes pero pueden descuidar el seguimiento.','Tu capacidad de enfocar y cerrar convierte sus ideas en resultados concretos y medibles.','Su energía dispersa puede frustrarte. Acordá plazos y checkpoints de cierre explícitos.'],
       ['Sostenedor (S)','Pacientes y leales. Priorizan al equipo y el largo plazo sobre los resultados rápidos.','Tu dirección clara da propósito concreto a su consistencia y dedicación genuina.','Su ritmo más lento puede generarte tensión. Comunicá tus plazos con más antelación.'],
       ['Analizador (C)','Precisos y metódicos. Buscan exactitud y análisis profundo antes de decidir.','Tu velocidad de ejecución equilibra su análisis y evita la parálisis del equipo.','Su necesidad de perfección puede frenar tu velocidad. Acordá plazos explícitos para el análisis.']],
    I:[['Conductor (D)','Directos, urgentes y orientados a resultados. Deciden rápido y con poca necesidad de consenso.','Tu energía y capacidad de movilizar personas ayuda a que su visión llegue a todo el equipo.','Su directividad puede sentirse como crítica. Diferenciá entre su urgencia y su valoración real.'],
       ['Promotor (I)','Entusiastas y sociables como vos. Generan energía y creatividad pero se dispersan igual.','Juntos generan mucha energía positiva que moviliza al equipo hacia nuevos proyectos posibles.','Dos Is pueden evitar compromisos difíciles. Designen a alguien responsable del seguimiento.'],
       ['Sostenedor (S)','Pacientes y leales. Su ritmo es más tranquilo pero su compromiso es genuinamente profundo.','Tu entusiasmo y conexión emocional complementa su estabilidad — generan un clima sólido y dinámico.','Su ritmo puede parecerte falta de entusiasmo. Dale tiempo para procesar antes de pedir respuesta.'],
       ['Analizador (C)','Precisos y metódicos. Buscan exactitud y datos antes de comprometerse con cualquier idea.','Tu capacidad de comunicar hace visible el trabajo riguroso que el C suele hacer en silencio.','Su necesidad de datos puede frenar tu entusiasmo. Incluí evidencia concreta en tus propuestas.']],
    S:[['Conductor (D)','Directos, urgentes y orientados a resultados. Deciden rápido y esperan lo mismo de otros.','Tu análisis profundo evita errores costosos. Cuando presentás datos bien fundados, los D escuchan.','Su velocidad puede generarte tensión. Practicá decir "necesito X tiempo para una respuesta fundada".'],
       ['Promotor (I)','Entusiastas y creativos. Generan ideas y conexiones pero pueden descuidar los detalles.','Tu capacidad de sistematizar sus ideas convierte la creatividad en planes verdaderamente ejecutables.','Su espontaneidad puede agotarte. Acordá momentos de concentración cuando necesitás foco profundo.'],
       ['Sostenedor (S)','Pacientes y leales como vos. Similar ritmo y orientación al equipo y al largo plazo.','La colaboración entre dos S es fluida y natural. Generan un ambiente seguro y confiable para todos.','Dos S pueden evitar conversaciones necesarias. Desafiáte a plantear los temas incómodos primero.'],
       ['Analizador (C)','Precisos y metódicos. Similar rigor pero con menos orientación interpersonal natural.','Tu combinación de rigor y orientación a las personas es complementaria — análisis con sensibilidad humana.','Juntos pueden caer en análisis infinito. Pongan fechas límite explícitas a las fases de análisis.']],
    C:[['Conductor (D)','Directos y orientados a resultados. Deciden rápido y con alta tolerancia a la incertidumbre.','Tu análisis detallado minimiza riesgos en sus decisiones rápidas y mejora la calidad de implementación.','Su velocidad puede generarte ansiedad. Trabajá tu músculo de "suficiente información para actuar".'],
       ['Promotor (I)','Entusiastas y creativos. Generan ideas brillantes con poca atención a los detalles técnicos.','Tu rigor y estructura complementa su creatividad — sus ideas se vuelven viables cuando vos las analizás.','Su desorden puede desconcentrarte. Establecé acuerdos claros sobre cuándo y cómo comunican.'],
       ['Sostenedor (S)','Pacientes y leales. Similar orientación a la calidad del proceso y el largo plazo del proyecto.','Tu precisión y método complementa su calma y consistencia — forman un equipo sólido y confiable.','Pueden reforzarse en evitar conflictos. Uno de los dos debe asumir el rol activo de iniciar.'],
       ['Analizador (C)','Precisos y metódicos como vos. Alta orientación a la calidad y la profundidad antes de actuar.','Juntos producen trabajo de altísima calidad y estándares consistentes que elevan al equipo completo.','El perfeccionismo mutuo puede paralizar proyectos. Definan un criterio explícito de "listo para avanzar".']],
  };

  /* ═══════════════════════════════════════════════════════════
     COMMUNICATION ADAPTATION TABLE
  ═══════════════════════════════════════════════════════════ */
  const COMM_ADAPTATION = [
    ['Con perfil D (Conductor)',  'Sé breve y directo. Empezá por el resultado esperado, no por el proceso. Un D quiere el "qué" y el "cuándo" antes que cualquier narrativa contextual.'],
    ['Con perfil I (Promotor)',   'Abrí por el vínculo antes que por la tarea. Mostrá entusiasmo genuino. Hacélos sentir que son parte activa de algo importante — su energía sube cuando sienten que importan y son visibles.'],
    ['Con perfil S (Sostenedor)', 'Bajá el ritmo y explicá el contexto con paciencia. Dales tiempo real para procesar antes de pedir una respuesta. Evitá cambios abruptos de dirección — preparalos con anticipación siempre.'],
    ['Con perfil C (Analizador)', 'Presentá datos, fundamentos y lógica clara. Evitá afirmaciones sin evidencia concreta. Un C que no tiene los datos necesarios no se compromete genuinamente aunque lo parezca externamente.'],
  ];

  /* ═══════════════════════════════════════════════════════════
     CONFLICT SCENARIOS  (3 per primary dimension)
  ═══════════════════════════════════════════════════════════ */
  const CONFLICT_SCEN = {
    D:[
      {label:'Situación A',title:'Un colega no cumple compromisos repetidamente',
       natural:'Tu tendencia es confrontar directamente y señalar el incumplimiento con claridad y sin rodeos.',
       why:'Tu capacidad de ir al punto y nombrar el problema con directness acelera la resolución y evita que el problema escale más.',
       adjust:'Antes de confrontar, preguntá qué pasó desde la perspectiva del otro. A veces hay razones legítimas. La directness sin escucha puede cerrarte información relevante que cambia el diagnóstico.'},
      {label:'Situación B',title:'Conflicto entre dos miembros del equipo que liderás',
       natural:'Intervenís rápido, definís la situación con claridad y pedís que cada uno asuma su parte del problema.',
       why:'Tu capacidad de tomar control evita que el conflicto se cronifique y afecte al resto del equipo con el tiempo.',
       adjust:'Escuchá a cada parte por separado antes de tu intervención grupal. Si no escuchás primero, tu resolución puede parecer unilateral y generar más resistencia de la que resuelve.'},
      {label:'Situación C',title:'Tu líder te pide algo que compromete tus estándares',
       natural:'Tu tendencia es expresar el desacuerdo de forma directa, a veces sin suavizar suficientemente el tono.',
       why:'Tu claridad y disposición a defender tu criterio protege la calidad del resultado final del proyecto.',
       adjust:'Expresá tu perspectiva con lenguaje propositivo: "Entiendo la urgencia. Antes de avanzar, quiero compartir un riesgo que vi y explorar si hay una alternativa." Defender estándares no es confrontación — es integridad.'},
    ],
    I:[
      {label:'Situación A',title:'Un colega no cumple compromisos repetidamente',
       natural:'Tu tendencia es buscar primero una conversación informal que preserve el vínculo y esperar que el problema se resuelva con el tiempo.',
       why:'Preservar el vínculo en el proceso de resolver el problema es una fortaleza genuina que evita escaladas innecesarias y destructivas.',
       adjust:'El vínculo también se protege siendo claro y oportuno. Si el incumplimiento se repite sin conversación directa, el resentimiento crece en silencio. Una conversación clara y cálida es mejor que la acumulación.'},
      {label:'Situación B',title:'Conflicto entre dos miembros del equipo que liderás',
       natural:'Buscás bajar la tensión, facilitar el diálogo y hacer que ambas personas sientan que fueron genuinamente escuchadas.',
       why:'Tu capacidad de crear un clima seguro para la conversación difícil es uno de tus recursos más valiosos como mediador natural.',
       adjust:'Además de bajar la tensión, el conflicto necesita un cierre concreto con acuerdos claros y explícitos. Aseguráte de que la conversación termine con compromisos específicos y verificables.'},
      {label:'Situación C',title:'Tu líder te pide algo que no te parece correcto',
       natural:'Tu tendencia es cumplir para no generar fricción, guardarte la incomodidad y después resentirte en silencio.',
       why:'Tu orientación a la armonía relacional hace que prefieras adaptarte antes que confrontar una situación de tensión.',
       adjust:'Expresá tu perspectiva de forma clara: "Quiero hacer esto bien. Antes de avanzar, me gustaría compartir algo que podría impactar en el resultado." Tu voz importa — no la guardes para después.'},
    ],
    S:[
      {label:'Situación A',title:'Un colega incumple compromisos repetidamente',
       natural:'Tendés a absorber el trabajo del otro para que el proyecto no falle, evitando la conversación directa que podría generar tensión visible.',
       why:'Tu orientación al equipo y al resultado hace que prefieras cargar con más peso antes que generar fricción interpersonal.',
       adjust:'Absorber el trabajo del otro no resuelve el problema — lo esconde y te sobrecarga a vos. Una conversación directa y privada, hecha con cuidado, es más honesta y más sana para el equipo en el largo plazo.'},
      {label:'Situación B',title:'Conflicto entre dos miembros del equipo que liderás',
       natural:'Esperás que el conflicto se resuelva solo o hablás con cada persona por separado sin llegar nunca a una conversación conjunta.',
       why:'Tu paciencia y disposición a escuchar a cada parte por separado te da información valiosa sobre la raíz real del problema.',
       adjust:'Después de escuchar a cada uno, facilitá una conversación conjunta. Como líder S, sos un mediador natural — usá ese don activamente, no pasivamente. El conflicto no gestionado se cronifica y destruye confianza.'},
      {label:'Situación C',title:'Tu líder te pide algo que compromete tu ética o calidad',
       natural:'Cumplís aunque no estés de acuerdo, guardás la incomodidad y después resentís la situación en silencio sin resolverla.',
       why:'Tu lealtad y orientación a la armonía hacen que prefieras adaptarte antes que tensar la relación con quien te lidera.',
       adjust:'Expresá tu perspectiva con claridad y respeto: "Entiendo la urgencia. Antes de avanzar, necesito compartir una preocupación sobre X porque puede impactar en Y." Defender tus estándares no es confrontación — es integridad.'},
    ],
    C:[
      {label:'Situación A',title:'Un colega no cumple compromisos repetidamente',
       natural:'Documentás el incumplimiento, analizás el patrón y esperás el momento adecuado para plantear el problema con datos concretos y objetivos.',
       why:'Tu capacidad de hablar con hechos y no con emociones es una ventaja real para resolver conflictos de forma objetiva y duradera.',
       adjust:'No esperés a tener todos los datos para hablar. A veces la conversación oportuna con información parcial es más efectiva que la conversación perfecta tres semanas después del problema.'},
      {label:'Situación B',title:'Conflicto entre dos miembros del equipo que liderás',
       natural:'Buscás entender la causa raíz, analizás el problema desde una perspectiva objetiva y proponés soluciones lógicas que aborden el fondo.',
       why:'Tu capacidad de ver más allá de las emociones del momento y proponer soluciones estructurales es valiosa para conflictos que se repiten sistemáticamente.',
       adjust:'Además de la solución lógica, las personas en conflicto necesitan sentirse escuchadas en lo emocional. Reconocé lo que cada parte siente antes de ir a la solución técnica.'},
      {label:'Situación C',title:'Tu líder te pide algo que no cumple tus estándares',
       natural:'Analizás el problema con detalle, identificás los riesgos y preparás un argumento lógico y fundamentado para plantear tu perspectiva con claridad.',
       why:'Tu capacidad de hablar con evidencia y argumentos sólidos hace que tu perspectiva tenga peso real en cualquier conversación importante.',
       adjust:'Además del argumento técnico, conectalo con el impacto humano y el valor del resultado. Los líderes responden mejor cuando ven que la preocupación es por el equipo, no solo por la perfección técnica.'},
    ],
  };

  /* ═══════════════════════════════════════════════════════════
     DEVELOPMENT SKILLS (5 per primary)
  ═══════════════════════════════════════════════════════════ */
  const DEV_SKILLS = {
    D:[
      ['Escucha activa y profunda','Tu patrón natural es escuchar para responder, no para entender profundamente. Desarrollar la escucha activa multiplica tu efectividad en conversaciones de alta complejidad y en situaciones donde el problema no es obvio.','Practicá una reunión por semana donde no intervenís hasta que el otro terminó completamente. Luego resumí lo que escuchaste antes de dar tu respuesta. Medí qué cambia.'],
      ['Comunicar el propósito además de la dirección','Las personas ejecutan mejor cuando entienden el por qué detrás del qué. Esto es especialmente crítico con perfiles S y C en tu equipo, que necesitan contexto para comprometerse genuinamente.','Antes de cada instrucción importante, agregá una oración que explique el propósito más amplio: "Lo hacemos así porque... y eso impacta en..."'],
      ['Delegar con confianza real, no con control encubierto','Tu orientación al resultado puede llevarte a supervisar en exceso. La delegación real requiere soltar el método después de definir el resultado esperado y el plazo de entrega.','Identificá una tarea que habitualmente retenés. Delegala con expectativas claras de resultado y plazo. Establecé un único checkpoint acordado. Resistí el impulso de intervenir en el proceso.'],
      ['Gestionar el impacto de tu velocidad en el equipo','Tu ritmo de trabajo es una fortaleza real, pero puede imponer presión innecesaria y contraproducente sobre el equipo. Aprendé a modular tu velocidad según el tipo de decisión y las personas involucradas.','Antes de cada reunión importante, evaluá: "¿Esta decisión requiere mi ritmo natural o el ritmo que el equipo necesita para comprometerse genuinamente?"'],
      ['Construir relaciones más allá del resultado','Los líderes con mayor influencia sostenida combinan orientación al resultado con genuina orientación a las personas. El vínculo no es solo humano — es estratégico para el largo plazo.','Agendá al menos una conversación semanal con alguien del equipo donde el único objetivo sea conocer cómo está, sin ninguna agenda de resultado o proyecto.'],
    ],
    I:[
      ['Convertir entusiasmo inicial en seguimiento concreto','Tu capacidad de iniciar es notable. Tu área de desarrollo es la consistencia del cierre. El liderazgo real se mide más por lo que se termina que por lo que se empieza con entusiasmo.','Usá un sistema simple de seguimiento semanal (lista en papel o digital). Antes de abrir una iniciativa nueva, verificá el estado real de las que ya están abiertas y en curso.'],
      ['Cerrar compromisos con disciplina sostenida','Tendés a comprometerte con entusiasmo genuino. El reto es que ese entusiasmo se mantenga hasta el cierre real, incluso cuando la novedad desaparece y queda solo la ejecución rutinaria.','Practicá la regla: "Una cosa nueva solo si tengo espacio real para cerrarla". Antes de asumir un compromiso nuevo, identificá uno que vas a cerrar esta semana.'],
      ['Sostener conversaciones difíciles hasta el final','Tu orientación al vínculo puede llevarte a evitar conversaciones que generan tensión. Pero esas conversaciones, cuando se hacen bien, fortalecen el vínculo en lugar de dañarlo duradero.','Esta semana, identificá la conversación que más estás postergando. Usá el modelo de 5 pasos de la sección de conflictos para prepararla y darla con claridad y cuidado.'],
      ['Medir resultados concretos, no solo actividad visible','La energía y el movimiento son muy visibles en tu perfil. El reto real es traducirlos en resultados concretos y medibles que puedan comunicarse con evidencia objetiva.','Definí para cada proyecto que liderás un indicador concreto de éxito: ¿cómo sabés que terminó bien? ¿Qué número o hecho específico lo confirma sin ambigüedad?'],
      ['Desarrollar foco sostenido en tareas que requieren profundidad','Tu mente activa genera muchas ideas simultáneas. Desarrollar el foco sostenido es lo que convierte esa creatividad natural en impacto real y consistente en el largo plazo.','Practicá bloques de 90 minutos de trabajo enfocado sin interrupciones sociales. Empezá con uno por día y escalá gradualmente según lo que el contexto te permita.'],
    ],
    S:[
      ['Hacer visible tu punto de vista con decisión','Tenés opiniones valiosas que a veces no compartís por no querer generar tensión o incomodidad en el grupo. El equipo necesita escuchar tu perspectiva para tomar decisiones genuinamente mejores.','En tu próxima reunión importante, comprométete a intervenir al menos una vez con una opinión concreta antes de que el tema se cierre. No esperés la invitación explícita.'],
      ['Poner límites claros con confianza real','Tu orientación al equipo puede llevarte a tomar más carga de la que podés sostener con calidad a largo plazo. Los límites claros protegen tu efectividad y tu energía duradera.','Esta semana, practicá decir "Puedo hacer X pero no Y esta semana — ¿cuál es la prioridad real?" en al menos una situación donde tu tendencia sería decir que sí a todo sin cuestionar.'],
      ['Acelerar la toma de decisiones importantes','Tu profundidad de análisis es una fortaleza genuina, pero puede llevarte a postergar decisiones más de lo necesario y útil. Practicá decidir con el 70% de la información que idealmente querés tener.','Identificá una decisión que tenés pendiente hace más de una semana. Poné un plazo de 48 horas para tomarla con la información que ya tenés disponible. Anotá qué pasó y qué aprendiste del proceso.'],
      ['Iniciar conversaciones difíciles antes de que escalen','Tu perfil tiende a esperar que los problemas se resuelvan solos o con el tiempo. En la mayoría de los casos, no se resuelven — se agudizan y se vuelven más difíciles de manejar después.','Identificá una tensión que estás evitando. Usá las frases de apertura de la sección de recursos para iniciar la conversación esta semana, antes de que el problema crezca más.'],
      ['Visibilizar tu contribución al equipo y la organización','Tu trabajo muchas veces habla solo — pero no siempre llega a quienes necesitan verlo. Aprendé a comunicar tus logros de forma activa, sin que eso se sienta como autopromoción innecesaria.','Al final de cada proyecto, prepará un resumen breve del resultado logrado y quién contribuyó. Compartílo proactivamente con tu líder y con el equipo de forma natural.'],
    ],
    C:[
      ['Decidir con información suficiente, no perfecta','La certeza absoluta raramente existe en la práctica organizacional. Tu efectividad como líder depende de poder actuar con certeza parcial sin que eso se viva internamente como un riesgo inaceptable.','Practicá la regla del 70%: si tenés el 70% de la información que querés, es suficiente para actuar. Poné plazos explícitos y acordados a tus fases de análisis antes de iniciarlas.'],
      ['Comunicar con impacto emocional genuino','Tu comunicación es precisa pero a veces percibida como fría o distante. Para inspirar a equipos diversos necesitás conectar emocionalmente, no solo informativamente, con las personas.','Cuando comuniques un objetivo, conectalo primero con el propósito y el impacto humano concreto. Practicá empezar con el "para qué" antes del "qué" y el "cómo" de cada comunicación.'],
      ['Delegar con confianza sin microgestionar el proceso','Tu orientación a la calidad puede llevarte a querer controlar el proceso de cerca y de forma continua. Esto limita el desarrollo de tu equipo y tu propia escalabilidad como líder a futuro.','Definí expectativas claras de resultado y fecha. Luego establecé checkpoints acordados de antemano — no supervisiones constantes e improvisadas. Confiar en otros es un acto de liderazgo real.'],
      ['Visibilizar tu liderazgo y tu contribución activamente','Las personas con tu perfil a veces hacen un trabajo extraordinario que nadie ve porque nunca lo comunican proactivamente. El liderazgo efectivo también requiere visibilidad estratégica intencional.','Practicá compartir resultados con tu equipo y superiores de forma regular. No como autopromoción — como generación de confianza y reconocimiento del trabajo colectivo bien hecho.'],
      ['Gestionar el cambio de forma activa y anticipatoria','Los entornos de alta velocidad requieren líderes que no solo se adapten al cambio cuando llega, sino que lo lideren activamente antes de que impacte en el equipo de forma disruptiva.','Preguntate mensualmente: "¿Qué podría cambiar en los próximos 3 meses y cómo me preparo para ese escenario?" Esto te da el tiempo de adaptación que tu perfil naturalmente necesita.'],
    ],
  };

  /* ═══════════════════════════════════════════════════════════
     90-DAY PLAN  (tables: 3 months × 3 rows, per primary)
  ═══════════════════════════════════════════════════════════ */
  const PLAN_90 = {
    D:{
      m1:[['Registrar el impacto de tu velocidad en el equipo','Anotá después de cada reunión clave: ¿alguien se quedó sin hablar? ¿Hubo resistencia pasiva?','Semanal'],
          ['Observar tu patrón de escucha activa','En una conversación por semana, contá cuántas veces interrumpís antes de que el otro termine.','Semanal'],
          ['Pedir feedback de impacto a dos personas de confianza','Preguntá: "¿Qué es lo que más te cuesta trabajar conmigo? ¿Dónde podría mejorar mi impacto?"','Una vez']],
      m2:[['Practicar escucha activa con resumen explícito','Antes de responder, resumí en voz alta lo que escuchaste: "Lo que entiendo es que…" Hacélo 3 veces por semana.','Tres veces/semana'],
          ['Delegar una tarea completa con hitos sin invadir','Elegí una tarea que normalmente retenés. Delegala con expectativas claras. No intervengas en el proceso.','Quincenal'],
          ['Explicar el propósito antes de cada instrucción clave','En cada instrucción importante, agregá el "por qué" antes del "qué". Observá si la ejecución mejora.','Cotidiano']],
      m3:[['Adaptar tu estilo a la persona de ritmo más diferente','Identificá al miembro con ritmo más opuesto al tuyo. Esta semana, trabajá a su ritmo en un proyecto real.','Una vez'],
          ['Gestionar un conflicto aplicando el modelo de 5 pasos','En la próxima situación de tensión, aplicá el modelo completo de la sección de conflictos sin saltear pasos.','Cuando surja'],
          ['Solicitar feedback 360° corto y estructurado','Pedí feedback específico a tu líder, un par y un colaborador sobre tu impacto como líder.','Una vez al cierre']],
    },
    I:{
      m1:[['Registrar todos los compromisos abiertos y sus cierres','Llevá una lista semanal de todo lo que prometiste. Al viernes, revisá cuántos cerraste y cuántos siguen abiertos.','Semanal'],
          ['Observar las conversaciones difíciles que postergás','Anotá cada conversación difícil que evitaste esta semana y el motivo real detrás de esa postergación.','Semanal'],
          ['Pedir feedback sobre tu confiabilidad y seguimiento','Preguntá a 2 personas: "¿Soy confiable en mis entregas? ¿Dónde me ven fallar más seguido?"','Una vez']],
      m2:[['Practicar la regla "cerrar antes de abrir"','Esta semana, no asumas ningún compromiso nuevo hasta tener al menos un espacio vacío en tu lista actual.','Semanal'],
          ['Tener la conversación difícil más pendiente','Identificá la conversación que más evitás. Preparala con el modelo de 5 pasos y dala esta semana sin postergación.','Una vez'],
          ['Implementar y sostener un sistema de seguimiento','Elegí una herramienta simple (lista, Trello, notas) y usala durante 30 días consecutivos sin excepción.','Cotidiano']],
      m3:[['Sostener el seguimiento activo durante 4 semanas','Mantené tu sistema durante todo el mes. Al final, revisá qué porcentaje de compromisos cerraste a tiempo.','Semanal'],
          ['Medir resultados concretos en cada proyecto activo','Para cada proyecto, definí un indicador de éxito concreto. No cuentes "actividad" — contá "resultado medible".','Semanal'],
          ['Solicitar feedback 360° corto y estructurado','Pedí feedback a tu líder, un par y un colaborador sobre tu confiabilidad, seguimiento e impacto.','Una vez al cierre']],
    },
    S:{
      m1:[['Detectar situaciones donde callás algo valioso','Anotá cada vez que salís de una conversación con algo que quisiste decir y no dijiste. ¿Cuántas veces por semana?','Semanal'],
          ['Registrar energía diaria y disparadores de estrés','Al final de cada día, marcá en escala 1-5 tu nivel de energía. Identificá qué te cargó y qué te vació.','Diaria'],
          ['Pedir feedback sobre tu visibilidad y aporte','Preguntá a 2 personas: "¿Cuándo sentís que más valor aporto? ¿Cuándo mi contribución pasa desapercibida?"','Una vez']],
      m2:[['Iniciar una conversación difícil pendiente','Identificá la tensión más antigua sin resolver. Usá las frases de apertura de la sección de recursos para iniciarla.','Una vez'],
          ['Poner un límite concreto sin disculpas innecesarias','Practicá decir "No puedo esta semana, pero puedo el lunes que viene" sin agregar disculpas que diluyen el mensaje.','Cuando se presente'],
          ['Hacer visible un logro del equipo proactivamente','Comunicá a tu líder un resultado destacado del equipo este mes, con contexto, personas involucradas e impacto.','Una vez']],
      m3:[['Facilitar una conversación grupal difícil','Identificá un tema que el equipo evita. Preparate y facilitá una conversación estructurada con las herramientas del manual.','Una vez'],
          ['Tomar una decisión más rápido de lo habitual','Identificá una decisión pendiente. Poné un plazo de 24 horas y actuá con la información disponible hoy.','Una vez'],
          ['Solicitar feedback 360° corto y estructurado','Pedí feedback a tu líder, un par y un colaborador sobre tu decisión, visibilidad e iniciativa en conversaciones.','Una vez al cierre']],
    },
    C:{
      m1:[['Identificar decisiones frenadas por exceso de análisis','Anotá cada semana qué decisiones postergaste y qué información adicional creías necesitar antes de actuar.','Semanal'],
          ['Registrar cuándo revisás más de lo necesario','Observá tu patrón: ¿cuántas veces revisás el mismo trabajo? ¿Cuándo la revisión adicional cambia el resultado real?','Semanal'],
          ['Pedir feedback sobre claridad y cercanía al comunicar','Preguntá a 2 personas: "¿Cómo experimentás mi comunicación? ¿Algo que te gustaría que cambie?"','Una vez']],
      m2:[['Practicar la regla del 70% en una decisión real','Esta semana, tomá al menos una decisión importante con el 70% de la información que querías. Anotá qué pasó.','Una vez/semana'],
          ['Comunicar primero el impacto y luego el detalle','En cada presentación o email esta semana, empezá con el resultado e impacto antes del detalle técnico.','Cotidiano'],
          ['Delegar una tarea que hoy retenés por perfeccionismo','Identificá algo que podrías delegar pero no delegás porque querés asegurarte de que salga perfecto. Delegalo.','Quincenal']],
      m3:[['Implementar una mejora sin esperar la solución perfecta','Tomá una mejora que identificaste hace tiempo y lanzala con un 80% de perfección. Iterá después según el feedback.','Una vez'],
          ['Visibilizar una contribución crítica propia activamente','Comunicá a tu líder y al equipo un resultado tuyo destacado con su contexto y su impacto concreto y medible.','Una vez'],
          ['Solicitar feedback 360° corto y estructurado','Pedí feedback a tu líder, un par y un colaborador sobre tu velocidad de decisión, visibilidad y comunicación.','Una vez al cierre']],
    },
  };

  /* ═══════════════════════════════════════════════════════════
     WEEKLY CHECK-IN QUESTIONS (per primary)
  ═══════════════════════════════════════════════════════════ */
  const WEEKLY_CHECKIN = {
    D:['¿Hubo alguna situación donde mi velocidad atropelló a alguien del equipo? ¿Qué haré diferente?',
       '¿Escuché a alguien completamente antes de dar mi respuesta esta semana? ¿Cómo se sintió?',
       '¿Dónde mi estilo directo fue una fortaleza real que generó avance concreto?',
       '¿Dónde mi directness generó resistencia o cerró una conversación que debería haber seguido?',
       '¿A quién delegué algo esta semana y cómo me mantuve fuera del proceso sin intervenir?'],
    I:['¿Qué compromisos cerré esta semana de forma completa y verificable?',
       '¿Qué conversación difícil postergué nuevamente esta semana? ¿Por qué?',
       '¿Dónde mi energía y conexión fue una fortaleza genuina que movilizó al equipo?',
       '¿Dónde mi estilo disperso limitó el foco y los resultados concretos del equipo?',
       '¿Qué resultado concreto y medible logré esta semana, más allá de la actividad visible?'],
    S:['¿Hubo algo importante que quise decir y no dije en alguna conversación esta semana? ¿Por qué?',
       '¿Tomé alguna decisión que postergué innecesariamente más de lo razonable esta semana?',
       '¿Dónde mi consistencia y calma fueron una fortaleza real para el equipo?',
       '¿Dónde mi paciencia me llevó a no actuar con la oportunidad que la situación requería?',
       '¿Qué necesidad o perspectiva propia expresé con claridad y decisión esta semana?'],
    C:['¿Identifiqué alguna decisión que postergué por querer más información de la que realmente necesitaba?',
       '¿Dónde actué con información suficiente en lugar de buscar la certeza perfecta esta semana?',
       '¿Dónde mi rigor analítico fue una fortaleza real que mejoró la calidad del resultado?',
       '¿Dónde mi perfeccionismo frenó la velocidad o el avance del equipo más de lo necesario?',
       '¿Qué logro propio o del equipo comuniqué proactivamente a mi líder o al equipo esta semana?'],
  };

  /* ═══════════════════════════════════════════════════════════
     OPENING PHRASES  (universal)
  ═══════════════════════════════════════════════════════════ */
  const OPENING_PHRASES = [
    ['"Me importa tu crecimiento y por eso quiero compartirte algo que noté. ¿Tenés un momento?"',
     'Para usar cuando querés dar feedback correctivo a alguien de tu equipo.'],
    ['"Quiero asegurarme de que tenemos en cuenta algo que podría impactar en el resultado. ¿Puedo compartirlo?"',
     'Para usar cuando querés expresar desacuerdo con una decisión sin confrontar directamente.'],
    ['"Quiero asegurarme de estar alineado con lo que se espera de mí. ¿Podemos revisarlo juntos?"',
     'Para usar cuando necesitás claridad sobre expectativas de tu líder o del equipo.'],
    ['"Noté que puede haber algo sin resolver entre nosotros. Valoro nuestra relación y me gustaría hablar."',
     'Para usar cuando hay una tensión acumulada con un par o colaborador que necesita ser abordada.'],
    ['"Quiero ser honesto sobre mi capacidad actual para hacer esto con la calidad que se merece. ¿Puedo proponer una alternativa?"',
     'Para usar cuando necesitás poner un límite o renegociar un compromiso con integridad.'],
  ];

  const COACHING_QUESTIONS = [
    ['Para desbloquear el avance','¿Qué está frenando el avance en este momento? ¿Qué opción no consideraste todavía?'],
    ['Para clarificar el próximo paso','¿Cuál es el UN paso que podés hacer hoy para avanzar con lo que tenés ahora?'],
    ['Para generar aprendizaje','¿Qué aprendiste de esta experiencia que no sabías antes? ¿Qué harías diferente la próxima vez?'],
    ['Para fortalecer la autonomía','¿Qué necesitás para poder avanzar con más confianza sin necesitar aprobación constante?'],
    ['Para desarrollar perspectiva','Si el resultado fuera el doble de bueno, ¿qué estarías haciendo diferente en este momento?'],
    ['Para generar compromiso','¿Qué compromisos concretos estás dispuesto a asumir antes de nuestra próxima conversación?'],
  ];

  const FEEDBACK_QUESTIONS = [
    '¿En qué situaciones sentís que mi liderazgo te ayuda más a rendir al máximo?',
    '¿Hay algo que yo haga (o no haga) que te quite energía o te genere frustración?',
    '¿Cuando tenés que tomar una decisión importante, sentís que podés venir a consultarme con confianza? ¿Por qué?',
    '¿Hay algo que desearías que yo comunicara de forma diferente en el equipo?',
    '¿En qué área concreta sentís que podría apoyarte más como líder en los próximos 90 días?',
  ];

  /* ═══════════════════════════════════════════════════════════
     UTIL FUNCTIONS
  ═══════════════════════════════════════════════════════════ */
  function safeJson(v) {
    if (typeof v !== 'string') return v;
    try { return JSON.parse(v); } catch { return v; }
  }
  function txt(v, fb = '') { return String(v ?? fb).trim(); }
  function fmtDate(d) {
    const dt = d ? new Date(d) : new Date();
    return isNaN(dt) ? new Date().toLocaleDateString('es-AR') : dt.toLocaleDateString('es-AR');
  }
  function yearOf(d) {
    const dt = d ? new Date(d) : new Date();
    return isNaN(dt) ? String(new Date().getFullYear()) : String(dt.getFullYear());
  }
  function levelFromScore(n) {
    const v = Number(n) || 0;
    if (v <= 24) return 'Bajo';
    if (v <= 40) return 'Moderado Bajo';
    if (v <= 60) return 'Alto';
    return 'Muy Alto';
  }
  function firstName(full) {
    return txt(full, 'Alumno').split(/\s+/)[0] || 'Alumno';
  }
  function applyVars(tpl, vars) {
    let out = String(tpl ?? '');
    Object.entries(vars).forEach(([k, v]) => { out = out.replaceAll(`[${k}]`, String(v ?? '')); });
    return out;
  }
  function dedupe(arr) { return [...new Set(arr)]; }

  /* ═══════════════════════════════════════════════════════════
     SCORE EXTRACTION
  ═══════════════════════════════════════════════════════════ */
function extractScores(data) {
  // 1. Scores directos
  const d = { D: Number(data.D ?? data.d ?? data.D_SCORE), I: Number(data.I ?? data.i ?? data.I_SCORE),
              S: Number(data.S ?? data.s ?? data.S_SCORE), C: Number(data.C ?? data.c ?? data.C_SCORE) };
  if (Object.values(d).every(v => !isNaN(v)) && Object.values(d).some(v => v > 0)) return d;

  // 2. JSON puro
  const resp = safeJson(data.Respuestas || data.respuestas);
  if (resp && typeof resp === 'object' && !Array.isArray(resp)) return calcFromAnswers(resp);

  // 3. Formato {PI: tiempo - id;val,...}{PII: tiempo - id;val,...}
  const raw = String(data.Respuestas || data.respuestas || '');
  if (raw.includes('PI:')) {
    const respParsed = {};
    const matchPI  = raw.match(/\{PI:\s*[^-]+-\s*([^}]+)\}/);
    const matchPII = raw.match(/\{PII:\s*[^-]+-\s*([^}]+)\}/);
    [matchPI, matchPII].forEach(m => {
      if (!m) return;
      m[1].split(',').forEach(par => {
        const [idStr, valStr] = par.trim().split(';');
        const id = parseInt(idStr, 10), val = parseInt(valStr, 10);
        if (!isNaN(id) && !isNaN(val)) respParsed[id] = val;
      });
    });
    if (Object.keys(respParsed).length > 0) return calcFromAnswers(respParsed);
  }

  return { D: 25, I: 25, S: 25, C: 25 };
}


  function calcFromAnswers(resp) {
    let D=0,I=0,S=0,C=0;
    for (let q=1; q<=28; q++) {
      const id = q<=14 ? (q-1)*2+1 : 28+(q-15)*2+1;
      const sel = resp[id]; if (sel===undefined) continue;
      const chosen = Number(sel)===5, qm=(q-1)%4;
      if (chosen) { if (qm<2) D++; else I++; } else { if (qm<2) S++; else C++; }
    }
    const t=D+I+S+C; if (!t) return {D:25,I:25,S:25,C:25};
    return {D:Math.round(D/t*100),I:Math.round(I/t*100),S:Math.round(S/t*100),C:Math.round(C/t*100)};
  }
  function determineProfile(scores) {
    const sorted = Object.entries(scores).sort((a,b)=>b[1]-a[1]);
    const [pk,pv]=sorted[0];
    if (pv>=41) {
      if (pk==='D' && scores.I>=25) return 'D/I';
      if (pk==='I' && scores.S>=25) return 'I/S';
      if (pk==='S' && scores.C>=25) return 'S/C';
      if (pk==='C' && scores.D>=25) return 'C/D';
      return pk;
    }
    const [sk]=sorted[1];
    const combo=`${pk}/${sk}`;
    const norm=combo.replace('I/D','D/I').replace('S/I','I/S').replace('C/S','S/C').replace('D/C','C/D');
    return PROFILE_LABELS[norm] ? norm : pk;
  }
  function parts(code) { const p=code.split('/'); return {primary:p[0],secondary:p[1]||null}; }

  /* ═══════════════════════════════════════════════════════════
     BUILD VARS
  ═══════════════════════════════════════════════════════════ */
function buildVars(data, scores, code) {
  const full = txt(data.NombreCompleto) ||
               `${txt(data.Nombre)} ${txt(data.Apellido)}`.trim() ||
               txt(data.userName) || txt(data.User) || 'Alumno';
  const d = data.Fecha || data.fecha || new Date().toISOString();
  return {
    NOMBRE: firstName(full), NOMBRE_COMPLETO: full,
    FECHA: fmtDate(d), FECHA_AÑO: yearOf(d),
    ADMIN: txt(data.Usuario_Admin||data.Admin||data.empresa||data.userName||'ONE · Escencial'),
    PERFIL_CODE: code, PERFIL_LABEL: PROFILE_LABELS[code]||code,
    D_SCORE:scores.D, I_SCORE:scores.I, S_SCORE:scores.S, C_SCORE:scores.C,
    D_LEVEL:levelFromScore(scores.D), I_LEVEL:levelFromScore(scores.I),
    S_LEVEL:levelFromScore(scores.S), C_LEVEL:levelFromScore(scores.C),
    CELDA_NAT: txt(data.CELDA_NAT||data.CeldaNatural||'—'),
    CELDA_ADA: txt(data.CELDA_ADA||data.CeldaAdaptada||'—'),
  };
}

  /* ═══════════════════════════════════════════════════════════
     SECTION BUILDERS
  ═══════════════════════════════════════════════════════════ */
  function sec01_welcome(   vars, code) {
    const fn = WELCOME_TEXT[code] || WELCOME_TEXT['S/C'];
    return { title: SECTION_TITLES[0], blocks: [
      { type:'paragraph', text: fn(vars), size:10.2, lineH:5.2 },
    ]};
  }

 function sec02_profile(vars, scores, code) {
  const {primary, secondary} = parts(code);

  const tableRows = [
    ['D', `${scores.D}% — ${vars.D_LEVEL}`,
     'Baja necesidad de control directo. Liderás por ejemplo, no por autoridad formal.',
     'Influís con calidad; dejás que el trabajo hable por sí solo en el equipo.'],
    ['I', `${scores.I}% — ${vars.I_LEVEL}`,
     'Relacionamiento reservado pero genuino. Construís vínculos sólidos sin protagonismo.',
     'Preferís conversaciones uno a uno. Tu influencia es profunda, no masiva ni visible.'],
    ['S', `${scores.S}% — ${vars.S_LEVEL}`,
     'Paciencia natural, lealtad profunda y orientación al equipo y al largo plazo.',
     'Sos el que termina los proyectos, mantiene la calma y cuida genuinamente a las personas.'],
    ['C', `${scores.C}% — ${vars.C_LEVEL}`,
     'Orientación a la calidad, precisión y respeto por procesos y estándares.',
     'Entregás trabajo bien revisado, pensás antes de actuar, minimizás errores sistemáticamente.'],
  ];

  return { title: SECTION_TITLES[1], blocks: [
    { type:'paragraph', text: PROFILE_QUADRANT[code], size:10.5 },
    { type:'quote', text: applyVars(PROFILE_QUOTES[code], vars) },
    { type:'subtitle', text:'Tus puntajes DISC' },
    { type:'metrics', items:[
      { label:'D', value:`${scores.D}%`, caption:vars.D_LEVEL, color:DIM.D.color },
      { label:'I', value:`${scores.I}%`, caption:vars.I_LEVEL, color:DIM.I.color },
      { label:'S', value:`${scores.S}%`, caption:vars.S_LEVEL, color:DIM.S.color },
      { label:'C', value:`${scores.C}%`, caption:vars.C_LEVEL, color:DIM.C.color },
    ]},
    { type:'subtitle', text:'Qué significa cada dimensión en tu perfil' },
    { type:'table',
      headers:['Dim.', 'Puntaje', 'Lo que significa para vos', 'Cómo se manifiesta'],
      colWidths:[0.06, 0.16, 0.40, 0.38],
      headerBg:[13,30,58],
      rows: tableRows,
    },
    { type:'subtitle', text:'Tus celdas de perfil' },
    { type:'bullets', items:[
      `Celda natural: ${vars.PERFIL_LABEL}`,
      `Celda adaptada: ${vars.PERFIL_LABEL}`,
      `Perfil asignado: ${vars.PERFIL_LABEL}`,
    ]},
  ]};
}
  function sec03_strengths(vars, code) {
    const {primary, secondary} = parts(code);
    const strengths = dedupe([...DIM[primary].strengths, ...(secondary ? DIM[secondary].strengths.slice(0,2) : [])]).slice(0,5);
    return { title: SECTION_TITLES[2],
      intro: `Las siguientes fortalezas caracterizan tu estilo de liderazgo natural cuando operás en condiciones óptimas. Conocerlas te permite potenciarlas intencionalmente.`,
      blocks: [
        { type:'numbered', items: strengths },
        { type:'divider' },
        { type:'subtitle', text:'Tu zona de mayor efectividad' },
        { type:'twoColumn',
          leftTitle:  'Situaciones donde brillás más',
          rightTitle: 'Roles donde agregás más valor',
          leftItems: [
            'Proyectos que requieren ejecución meticulosa y consistente',
            'Situaciones que demandan análisis profundo antes de actuar',
            'Mediación entre personas o áreas en desacuerdo productivo',
            'Definición de procesos y estándares de calidad del equipo',
            'Proyectos de largo plazo que requieren consistencia sostenida',
          ].filter((_,i)=>i<3).concat(
            secondary ? ['Comunicación profunda que genera confianza duradera'] : []
          ),
          rightItems: [
            'Coordinación de proyectos complejos con múltiples variables',
            'Referente de calidad y mejora continua del equipo',
            'Mentor de personas nuevas o en proceso de desarrollo',
            'Voz de análisis crítico en decisiones estratégicas importantes',
          ].filter((_,i)=>i<3).concat(
            secondary ? ['Guardián de la cultura y los valores del equipo'] : []
          ),
        },
        { type:'quote', text:`Tu fortaleza principal combina ${DIM[primary].name}${secondary ? ` con ${DIM[secondary].name}` : ' con tu propia consistencia de estilo'}. En los contextos correctos, esa combinación es difícil de reemplazar.` },
      ],
    };
  }

  function sec04_energy(vars, code) {
    const {primary, secondary} = parts(code);
    const energy = dedupe([...DIM[primary].energy, ...(secondary ? DIM[secondary].energy : [])]).slice(0,5);
    const stress  = dedupe([...DIM[primary].stress, ...(secondary ? DIM[secondary].stress : [])]).slice(0,4);
    const ss = DIM[primary].stressSignals;
    return { title: SECTION_TITLES[3], blocks: [
      { type:'infoCard', title:'FUENTES DE ENERGÍA NATURAL', color:[13,30,58],
        text:'Estas situaciones te recargan de energía y te permiten operar en tu mejor versión. Creá más de estos contextos intencionalmente.' },
      { type:'bullets', items: energy },
      { type:'divider' },
      { type:'infoCard', title:'FUENTES DE DESGASTE Y ESTRÉS', color:[183,40,20],
        text:'Estas situaciones te consumen energía por encima de lo sostenible. Aprendé a anticiparlas y a gestionarte proactivamente cuando aparecen.' },
      { type:'bullets', items: stress },
      { type:'divider' },
      { type:'subtitle', text:'Señales de alerta: cómo reconocer el estrés en tu perfil' },
      { type:'table',
        headers:['Nivel', 'Señal observable'],
        colWidths:[0.22, 0.78], headerBg:[13,30,58],
rows:[
  ['Temprana',   ss.early],
  ['Intermedia', ss.mid],
  ['Critica',    ss.critical],
],
      },
      { type:'subtitle', text:'Estrategia de recuperación para tu perfil' },
      { type:'bullets', items: DIM[primary].recovery },
    ]};
  }

  function sec05_situational(vars, code) {
    const {primary} = parts(code);
    const scens = SCENARIOS[primary] || SCENARIOS.S;
    return { title: SECTION_TITLES[4],
      intro: 'El liderazgo efectivo no es aplicar siempre el mismo estilo. Es saber cuándo usar tus fortalezas naturales y cuándo ajustar tu respuesta al contexto específico.',
      blocks: scens.map(s => ({ type:'scenario', ...s })),
    };
  }

  function sec06_teamwork(vars, code) {
    const {primary, secondary} = parts(code);
    const pd = DIM[primary], sd = secondary ? DIM[secondary] : null;
    const rows = TEAM_ROWS[primary] || TEAM_ROWS.S;
    return { title: SECTION_TITLES[5],
      intro: `Tu rol natural dentro de un equipo tiende a ser: ${PROFILE_ROLE[code]}. En esa función aportás principalmente desde ${pd.focus}${sd ? `, con el equilibrio que agrega ${sd.focus}` : ''}.`,
      blocks: [
        { type:'twoColumn',
          leftTitle: 'Lo que el equipo recibe de vos',
          rightTitle: 'Lo que el equipo necesita de vos',
          leftItems: [
            `Perspectiva desde ${pd.focus}`,
            'Consistencia en el cumplimiento de compromisos',
            sd ? `Equilibrio desde ${sd.focus}` : 'Complementación con perfiles distintos',
            'Cohesión y confianza en los momentos críticos',
          ],
          rightItems: [
            'Hacer visible tu fortaleza natural de forma activa',
            'Saber cuándo tu estilo agrega más valor al equipo',
            'Mantener coherencia entre lo que comunicás y lo que generás',
            'Convertir tu estilo en aporte estratégico deliberado',
          ],
        },
        { type:'subtitle', text:'Cómo trabajar efectivamente con cada perfil DISC' },
        { type:'table',
          headers:['Perfil', 'Cómo son', 'Lo que valorán de vos', 'Tu desafío con ellos'],
          colWidths:[0.14, 0.22, 0.32, 0.32], headerBg:[13,30,58], compact:true,
          rows: rows,
        },
        { type:'divider' },
        { type:'subtitle', text:'Tu efectividad en reuniones de equipo' },
        { type:'twoColumn',
          leftTitle: 'Lo que ya hacés bien',
          rightTitle: 'Lo que podés mejorar',
          leftItems: [
            'Escuchás antes de opinar — aportás cuando tenés algo relevante',
            'No generás conflictos innecesarios con tu estilo comunicacional',
            'Traés información preparada y con criterio real',
          ],
          rightItems: [
            'Intervenir antes — tu voz valiosa a veces llega tarde',
            'Expresar desacuerdo en el momento, no después de la reunión',
            'Proponer estructura y agenda cuando falta claridad al inicio',
          ],
        },
      ],
    };
  }

  function sec07_communication(vars, code) {
    const {primary, secondary} = parts(code);
    return { title: SECTION_TITLES[6], blocks: [
      { type:'highlight', title:'TU ESTILO NATURAL DE COMUNICACIÓN',
        color:[13,30,58], bg:[246,249,253],
        text: DIM[primary].communication + (secondary ? ` Tu segunda dimensión (${DIM[secondary].name}) agrega matices importantes a ese estilo: ${DIM[secondary].communication.toLowerCase()}` : '') },
      { type:'subtitle', text:'Guía de adaptación: cómo comunicarte con cada perfil' },
      { type:'table',
        headers:['Perfil', 'Clave de adaptación'],
        colWidths:[0.22, 0.78], headerBg:[13,30,58],
        rows: COMM_ADAPTATION,
      },
      { type:'divider' },
      { type:'subtitle', text:'Errores frecuentes de comunicación en tu perfil' },
      { type:'bullets', items:[
        'Asumir que la otra persona interpretó lo que quisiste decir sin verificarlo explícitamente.',
        'Comunicar el "qué" sin el "por qué" — la dirección sin el propósito que la justifica.',
        'Adaptar el mensaje al perfil propio en lugar de al perfil de quien recibe la comunicación.',
        'Dar por cerrado un tema que la otra persona aún no procesó ni internalizó completamente.',
      ]},
    ]};
  }

  function sec08_conflict(vars, code) {
    const {primary} = parts(code);
    const scens = CONFLICT_SCEN[primary] || CONFLICT_SCEN.S;
    return { title: SECTION_TITLES[7], blocks: [
      { type:'highlight', title:'TU RELACIÓN NATURAL CON EL CONFLICTO',
        color:[13,30,58], bg:[246,249,253],
        text: DIM[primary].conflict },
      { type:'twoColumn',
        leftTitle: 'Tus ventajas en el conflicto',
        rightTitle: 'Tus desafíos en el conflicto',
        leftItems: [
          `Podés aportar claridad desde ${DIM[primary].focus}`,
          'Tenés recursos naturales para intervenir cuando el equipo se traba',
          'Con conciencia de tu patrón, tu efectividad en conflicto mejora mucho',
        ],
        rightItems: DIM[primary].risks || [
          'Tu estilo bajo estrés puede intensificar la tensión en lugar de resolverla',
          'Tendés a reproducir tu patrón natural incluso cuando no es el más efectivo',
          'El conflicto no gestionado te genera un desgaste que no siempre es visible',
        ],
      },
      { type:'divider' },
      { type:'infoCard', title:'PRINCIPIO FUNDAMENTAL: EL CONFLICTO NO ES EL PROBLEMA',
        color:[13,100,50],
        text:'El conflicto en sí mismo no es negativo — es información. Nos dice que dos personas tienen perspectivas, necesidades o expectativas diferentes sobre algo que importa. El problema no es el conflicto. Es el conflicto no gestionado. Un equipo que nunca tiene conflicto visible no es un equipo armonioso — es un equipo donde la gente calla lo que piensa. Eso destruye confianza, creatividad y resultados a largo plazo.' },
      { type:'subtitle', text:'Modelo de 5 pasos para resolver conflictos desde tu perfil' },
      { type:'table',
        headers:['Paso', 'Nombre', 'Qué hacer', 'Trampa típica de tu perfil'],
        colWidths:[0.06, 0.18, 0.40, 0.36], headerBg:[13,30,58],
        rows:[
          ['1','Detectar temprano','Ante la primera señal de tensión — cambio de tono, silencio incómodo, evasión — registrala. No esperes a que explote.','Esperar a que "se resuelva solo" — raramente lo hace.'],
          ['2','Conversar en privado','Buscá a la persona individualmente: "Noté que algo pasó, me gustaría entender cómo estás con esto."','No tomar la iniciativa de la conversación; esperar que el otro venga a vos.'],
          ['3','Escuchar sin defender','Escuchá la perspectiva completa sin interrumpir ni justificar. Acá tu perfil brilla naturalmente.','Escuchar tanto que nunca expresás tu propia perspectiva con claridad real.'],
          ['4','Expresar tu perspectiva','Usá lenguaje en primera persona: "Yo percibí… / Yo sentí… / Para mí fue importante que…"','Suavizar tanto el mensaje para no herir que la otra persona no lo escucha ni lo entiende.'],
          ['5','Acordar y documentar','Definí qué va a cambiar, quién hace qué y para cuándo. Cerrá con un acuerdo concreto registrado.','Acordar algo ambiguo para salir de la tensión sin resolver el fondo del problema real.'],
        ],
      },
      { type:'divider' },
      { type:'subtitle', text:'Escenarios frecuentes de conflicto y cómo gestionarlos' },
      ...scens.map(s => ({ type:'scenario', ...s })),
    ]};
  }

  function sec09_development(vars, code) {
    const {primary, secondary} = parts(code);
    const skills = DEV_SKILLS[primary] || DEV_SKILLS.S;
    return { title: SECTION_TITLES[8],
      intro: `El objetivo del desarrollo no es cambiar quién sos — es expandir tu rango de respuestas para ser más efectivo en más situaciones. Estas 5 habilidades, desarrolladas, van a multiplicar el impacto de tu liderazgo.`,
      blocks: [
        { type:'table',
          headers:['Habilidad', 'Por qué es crítica para vos', 'Cómo desarrollarla'],
          colWidths:[0.20, 0.38, 0.42], headerBg:[13,30,58],
          rows: skills.map((s,i) => [`${i+1}. ${s[0]}`, s[1], s[2]]),
        },
        { type:'divider' },
        { type:'subtitle', text:'Lecturas recomendadas para tu perfil' },
        { type:'bullets', items:[
          '"Conversaciones Cruciales" — Kerry Patterson (para el desarrollo de la confrontación efectiva)',
          '"Los 5 Disfunciones de un Equipo" — Patrick Lencioni (dinámica de equipos y confianza)',
          '"Atomic Habits" — James Clear (construcción de hábitos de práctica deliberada)',
          '"Dare to Lead" — Brené Brown (liderazgo vulnerable y construcción de cultura)',
          '"Drive" — Daniel Pink (motivación intrínseca en entornos de alta complejidad)',
        ]},
      ],
    };
  }

  function sec10_plan(vars, code) {
    const {primary} = parts(code);
    const plan = PLAN_90[primary] || PLAN_90.S;
    return { title: SECTION_TITLES[9],
      intro: 'El conocimiento sin acción no produce resultados. Este plan de 90 días está diseñado para que implementes los aprendizajes de este manual de forma gradual, medible y sostenible.',
      blocks: [
        { type:'infoCard', title:'MES 1 — AUTOCONOCIMIENTO Y OBSERVACIÓN (Días 1-30)',
          color:[13,30,58],
          text:'El primer mes es de observación activa. Sin cambiar nada, observá con los ojos nuevos que te dio este manual. Registrá patrones, reacciones y señales de estrés de forma objetiva.' },
        { type:'table',
          headers:['Acción', 'Cómo implementarla', 'Frecuencia'],
          colWidths:[0.30, 0.48, 0.22], headerBg:[13,30,58], compact:true,
          rows: plan.m1,
        },
        { type:'infoCard', title:'MES 2 — PRÁCTICA DELIBERADA (Días 31-60)',
          color:[13,80,40],
          text:'El segundo mes es de práctica activa. Elegí 2 o 3 habilidades del capítulo 9 y ponelas en práctica consciente e intencionada. La incomodidad es señal de aprendizaje real.' },
        { type:'table',
          headers:['Acción', 'Cómo implementarla', 'Frecuencia'],
          colWidths:[0.30, 0.48, 0.22], headerBg:[13,80,40], compact:true,
          rows: plan.m2,
        },
        { type:'infoCard', title:'MES 3 — CONSOLIDACIÓN E INTEGRACIÓN (Días 61-90)',
          color:[130,80,10],
          text:'El tercer mes es de integración. Las prácticas del mes 2 empiezan a naturalizarse. Sumá profundidad: facilitá conversaciones de feedback estructurado sobre tu evolución.' },
        { type:'table',
          headers:['Acción', 'Cómo implementarla', 'Frecuencia'],
          colWidths:[0.30, 0.48, 0.22], headerBg:[130,80,10], compact:true,
          rows: plan.m3,
        },
      ],
    };
  }

  function sec11_resources(vars, code) {
    const {primary} = parts(code);
    const wc = WEEKLY_CHECKIN[primary] || WEEKLY_CHECKIN.S;
    return { title: SECTION_TITLES[10],
      intro: 'Esta sección te entrega herramientas listas para usar en tu día a día de liderazgo.',
      blocks: [
        { type:'subtitle', text:'Herramienta 1 — Check-in semanal de liderazgo (10 min cada viernes)' },
        { type:'bullets', items: wc },
        { type:'divider' },
        { type:'subtitle', text:'Herramienta 2 — Frases de apertura para conversaciones difíciles' },
        { type:'table',
          headers:['Frase de apertura', 'Cuándo usarla'],
          colWidths:[0.55, 0.45], headerBg:[13,30,58],
          rows: OPENING_PHRASES,
        },
        { type:'divider' },
        { type:'subtitle', text:'Herramienta 3 — Preguntas poderosas de coaching para tu equipo' },
        { type:'table',
          headers:['Objetivo', 'Pregunta'],
          colWidths:[0.28, 0.72], headerBg:[13,30,58], compact:true,
          rows: COACHING_QUESTIONS,
        },
        { type:'divider' },
        { type:'subtitle', text:'Herramienta 4 — Preguntas para tu sesión de feedback 360°' },
        { type:'bullets', items: FEEDBACK_QUESTIONS },
      ],
    };
  }

function sec12_commitment(vars, code) {
  const {primary} = parts(code);
  const lines = {
    D:['Escuchar profundamente antes de responder en conversaciones importantes.',
       'Comunicar el propósito y el por qué detrás de cada dirección que doy.',
       'Delegar con confianza real y soltar el proceso después de definir el resultado.'],
    I:['Transformar el entusiasmo inicial en seguimiento consistente hasta el cierre.',
       'Sostener conversaciones difíciles con firmeza y claridad sin suavizar el mensaje.',
       'Medir resultados concretos, no solo actividad y movimiento visible.'],
    S:['Hacer visible mi voz y mi criterio en momentos clave sin esperar la invitación.',
       'Iniciar conversaciones difíciles antes de que los problemas escalen solos.',
       'Tomar decisiones con oportunidad, sin esperar la información perfecta.'],
    C:['Actuar con información suficiente y no perfecta — el 70% es suficiente para avanzar.',
       'Conectar con el impacto emocional al comunicar, no solo con la precisión técnica.',
       'Visibilizar mi contribución activamente sin esperar que se note sola.'],
  };
  const chosen = lines[primary] || lines.S;

  return { title: SECTION_TITLES[11], blocks: [
    { type:'infoCard', title:'TU DECLARACIÓN PERSONAL DE LIDERAZGO',
      color:[192,87,55],
      text:`Yo, ${vars.NOMBRE_COMPLETO}, me comprometo a liderar con más conciencia, intención y consistencia durante los próximos 90 días.` },
    { type:'subtitle', text:'En los próximos 90 días me comprometo a:' },
    { type:'numbered', items: chosen },
    { type:'divider' },
{ type:'subtitle', text:'Mis 3 compromisos concretos y medibles' },
{ type:'paragraph', 
  text:'Completá esta tabla con tus propios compromisos. El ejemplo de la fila 1 te muestra el formato esperado.',
  size: 8.5, color:[140,130,120], italic: true },
{ type:'table',
  headers:['#', 'Mi compromiso concreto', 'Fecha inicio', 'Cómo lo mediré'],
  colWidths:[0.06, 0.44, 0.20, 0.30],
  rows:[
    ['Ej.', 'Practicar escucha activa: no interrumpir hasta que el otro termine de hablar', '01/09/2026', 'Feedback semanal de 1 persona del equipo'],
    ['1', ' ', ' ', ' '],
    ['2', ' ', ' ', ' '],
    ['3', ' ', ' ', ' '],
  ],
},
    { type:'divider' },
    { type:'quote', text:`"${vars.NOMBRE}, el liderazgo más efectivo comienza con el profundo conocimiento de uno mismo — y con la disciplina diaria de actuar desde ese conocimiento."` },
    { type:'paragraph',
      text:`Este manual fue desarrollado con el compromiso de ONE · Escencial de acompañarte en ese camino. El desarrollo del liderazgo no es un evento — es una práctica continua. Este es tu próximo nivel de trabajo personal.`,
      size: 9.5, color:[130,116,108] },
  ]};
}

  /* ═══════════════════════════════════════════════════════════
     FIX TABLE ROWS in sec02
  ═══════════════════════════════════════════════════════════ */
  function fixSec02Rows(vars, scores) {
    return [
      ['D', `${scores.D}% — ${vars.D_LEVEL}`,
       'Baja necesidad de control directo. No buscás imponer sino influir con calidad y criterio.',
       'Liderás por el ejemplo y la demostración técnica, no por autoridad formal ni imposición.'],
      ['I', `${scores.I}% — ${vars.I_LEVEL}`,
       'Relacionamiento reservado pero genuino. Construís vínculos sólidos sin necesidad de protagonismo.',
       'Preferís conversaciones uno a uno. Tu influencia es profunda, no masiva ni visible.'],
      ['S', `${scores.S}% — ${vars.S_LEVEL}`,
       'Paciencia natural, lealtad profunda y orientación al equipo y al largo plazo.',
       'Sos el que termina los proyectos, mantiene la calma y cuida genuinamente a las personas.'],
      ['C', `${scores.C}% — ${vars.C_LEVEL}`,
       'Orientación a la calidad y la precisión, respeto por procesos y estándares establecidos.',
       'Entregás trabajo bien revisado, pensás antes de actuar y minimizás errores sistemáticamente.'],
    ];
  }

  /* ═══════════════════════════════════════════════════════════
     MAIN MODEL BUILDER
  ═══════════════════════════════════════════════════════════ */
  function buildModel(data) {
    const scores  = extractScores(data);
    const code    = determineProfile(scores);
    const vars    = buildVars(data, scores, code);
    const {primary, secondary} = parts(code);

    const s02 = sec02_profile(vars, scores, code);
    // Fix table rows properly
    s02.blocks.forEach(b => { if (b.type === 'table' && b.headers[0] === 'Dim.') b.rows = fixSec02Rows(vars, scores); });

    return {
      fullName:     vars.NOMBRE_COMPLETO,
      firstName:    vars.NOMBRE,
      profileCode:  code,
      profileLabel: vars.PERFIL_LABEL,
      dateText:     vars.FECHA,
      admin:        vars.ADMIN,
      scores,
      quote:        applyVars(PROFILE_QUOTES[code], vars),
      summary:      `${PROFILE_DESC[code]} Tus puntajes actuales muestran D ${scores.D}%, I ${scores.I}%, S ${scores.S}% y C ${scores.C}%, con perfil dominante ${vars.PERFIL_LABEL}.`,
      sections: [
        sec01_welcome(vars, code),
        s02,
        sec03_strengths(vars, code),
        sec04_energy(vars, code),
        sec05_situational(vars, code),
        sec06_teamwork(vars, code),
        sec07_communication(vars, code),
        sec08_conflict(vars, code),
        sec09_development(vars, code),
        sec10_plan(vars, code),
        sec11_resources(vars, code),
        sec12_commitment(vars, code),
      ],
    };
  }

function buildVars(data, scores, code) {
  const full = txt(data.NombreCompleto) ||
               `${txt(data.Nombre)} ${txt(data.Apellido)}`.trim() ||
               txt(data.userName) || txt(data.User) || 'Alumno';
  const d = data.Fecha || data.fecha || new Date().toISOString();

  // Calcular celdas desde scores si no vienen en los datos
  function calcCelda(sc) {
    const dims = ['D','I','S','C'];
    const sorted = dims.slice().sort((a,b) => sc[b] - sc[a]);
    const top = sorted[0];
    const second = sorted[1];
    // Si el primero supera al segundo por más de 10 puntos → celda simple
    // Si están cerca (≤10 puntos) → celda combinada
    if (sc[top] - sc[second] > 10) return top;
    return `${top}/${second}`;
  }

  const celdaNat = txt(data.CELDA_NAT || data.CeldaNatural) || calcCelda(scores);
  const celdaAda = txt(data.CELDA_ADA || data.CeldaAdaptada) || calcCelda(scores);

  return {
    NOMBRE: firstName(full), NOMBRE_COMPLETO: full,
    FECHA: fmtDate(d), FECHA_AÑO: yearOf(d),
    ADMIN: txt(data.Usuario_Admin||data.Admin||data.empresa||data.userName||'ONE · Escencial'),
    PERFIL_CODE: code, PERFIL_LABEL: PROFILE_LABELS[code]||code,
    D_SCORE:scores.D, I_SCORE:scores.I, S_SCORE:scores.S, C_SCORE:scores.C,
    D_LEVEL:levelFromScore(scores.D), I_LEVEL:levelFromScore(scores.I),
    S_LEVEL:levelFromScore(scores.S), C_LEVEL:levelFromScore(scores.C),
    CELDA_NAT: celdaNat,
    CELDA_ADA: celdaAda,
  };
}

  /* ═══════════════════════════════════════════════════════════
     PUBLIC API
  ═══════════════════════════════════════════════════════════ */
  async function generarManualPersonalizado(dataInput) {
    const source = dataInput ||
      (typeof sessionStorage !== 'undefined' ? safeJson(sessionStorage.getItem('discUserData')) : null);
    if (!source) throw new Error('No hay datos del alumno para generar el manual.');

    const model    = buildModel(source);
    const doc      = window.ManualTheme.render(model);
    const fileName = `Manual_DISC_${model.fullName.replace(/\s+/g,'_')}_${model.profileCode.replace('/','--')}.pdf`;
    doc.save(fileName);

    return { ok:true, fileName, profileCode:model.profileCode, profileLabel:model.profileLabel, scores:model.scores };
  }

  window.generarManualPersonalizado  = generarManualPersonalizado;
  window.descargarManualPersonalizado = generarManualPersonalizado;
  window.Manual = { generar: generarManualPersonalizado, descargar: generarManualPersonalizado };
})();