/**
 * ============================================================================
 * GENERADOR DE PDF PROFESIONAL - INFORME DISC COMPLETO
 * Versión extendida con toda la información y gráficos
 * ============================================================================
 */

async function generarPDFInforme(data, resultado, respuestasParsed, returnBase64 = false) {
  // Verificar que jsPDF esté disponible
  const jsPDF = window.jspdf?.jsPDF || window.jsPDF;

  if (!jsPDF) {
    console.error('jsPDF no está disponible');
    alert('Error: La librería jsPDF no se cargó correctamente. Por favor, recargá la página e intentá nuevamente.');
    return;
  }

  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    const nombreCompleto = `${data.Nombre || ""} ${data.Apellido || ""}`.trim();
    // Tests nuevos traen la letra real por pregunta (data.Detalle) → cálculo del
    // núcleo (discCore.js). Tests viejos: null → algoritmo anterior, sin cambios.
    const detalle = (window.DISCCore && data.Detalle && window.DISCCore.tieneDetalle(data.Detalle)) ? data.Detalle : null;
    const core = detalle ? window.DISCCore.calcular(detalle) : null;
    const fecha = data.Fecha ? new Date(data.Fecha).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }) : '';

    // Colores del tema
    const COLORES = {
      primario: [11, 74, 110],
      secundario: [107, 225, 227],
      acento: [225, 123, 215],
      texto: [26, 24, 29],
      textoClaro: [164, 168, 192],
      fondo: [249, 250, 251],
      D: [220, 38, 38],
      I: [217, 119, 6],
      S: [5, 150, 105],
      C: [37, 99, 235]
    };

    let paginaActual = 0;

    // ========== FUNCIONES AUXILIARES ==========

    function nuevaPagina() {
      if (paginaActual > 0) {
        doc.addPage();
      }
      paginaActual++;
      agregarPieDePagina();
    }

    function agregarEncabezado() {
      doc.setFillColor(...COLORES.primario);
      doc.rect(15, 10, 50, 12, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('DISC', 17, 17);

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('Informe Profesional', 17, 21);
    }
    const PAGE_W = doc.internal.pageSize.width;
    const PAGE_H = doc.internal.pageSize.height;

    const MARGIN_L = 15;
    const MARGIN_R = 15;
    const MARGIN_TOP = 35;      // donde arrancás contenido
    const FOOTER_H = 18;        // reserva para el pie (línea + textos)
    const CONTENT_BOTTOM = PAGE_H - FOOTER_H;

    function lineHeightMm(fontSize) {
      // aproximación estable para jsPDF en mm
      return fontSize * 0.35;
    }

    function heightOfText(text, maxWidth, fontSize, fontStyle = 'normal') {
      doc.setFont('helvetica', fontStyle);
      doc.setFontSize(fontSize);
      const lines = doc.splitTextToSize(text, maxWidth);
      return lines.length * lineHeightMm(fontSize);
    }

    function ensureSpace(currentY, neededH) {
      if (currentY + neededH > CONTENT_BOTTOM) {
        nuevaPagina();
        agregarEncabezado();
        return MARGIN_TOP;
      }
      return currentY;
    }
    function heightOfList(items, maxWidth, fontSize, lineGap = 1) {
      doc.setFontSize(fontSize);
      let h = 0;
      items.forEach(item => {
        const lines = doc.splitTextToSize(item, maxWidth);
        h += lines.length * lineHeightMm(fontSize) + lineGap;
      });
      return h;
    }


    function agregarPieDePagina() {
      const pageHeight = doc.internal.pageSize.height;

      doc.setDrawColor(...COLORES.secundario);
      doc.setLineWidth(0.5);
      doc.line(15, pageHeight - 15, 195, pageHeight - 15);

      doc.setTextColor(...COLORES.textoClaro);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`© 2026 Escencial Consultora — Informe confidencial para ${nombreCompleto}`,
        105, pageHeight - 10, { align: 'center' });

      doc.text(`Página ${paginaActual}`, 195, pageHeight - 10, { align: 'right' });
    }

    function dibujarCuadro(x, y, ancho, alto, color, opacity = 0.1) {
      doc.saveGraphicsState();
      doc.setFillColor(...color);
      doc.setGState(new doc.GState({ opacity: opacity }));
      doc.roundedRect(x, y, ancho, alto, 3, 3, 'F');
      doc.restoreGraphicsState();
    }

    function dibujarTitulo(texto, y, size = 18) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(size);
      doc.setTextColor(...COLORES.texto);
      doc.text(texto, 15, y);

      doc.setDrawColor(...COLORES.secundario);
      doc.setLineWidth(2);
      doc.line(15, y + 2, 15 + doc.getTextWidth(texto), y + 2);
    }

    function dibujarSubtitulo(texto, y, size = 12) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(size);
      doc.setTextColor(...COLORES.primario);
      doc.text(texto, 15, y);
    }

    function dibujarTexto(texto, x, y, maxWidth = 180, size = 10, color = COLORES.texto) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(size);
      doc.setTextColor(...color);
      const lines = doc.splitTextToSize(texto, maxWidth);
      doc.text(lines, x, y);
      return y + (lines.length * size * 0.35);
    }

    function dibujarLista(items, x, y, maxWidth = 170) {
      let currentY = y;
      items.forEach(item => {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(...COLORES.texto);

        // Bullet point
        doc.text('•', x, currentY);

        // Texto del item
        const lines = doc.splitTextToSize(item, maxWidth - 5);
        doc.text(lines, x + 5, currentY);
        currentY += lines.length * 3.5 + 1;
      });
      return currentY;
    }

    // ========== PORTADA ==========
    function generarPortada() {
      nuevaPagina();

      // Fondo decorativo
      for (let i = 0; i < 100; i++) {
        const alpha = 0.02 + (i / 100) * 0.08;
        doc.saveGraphicsState();
        doc.setFillColor(...COLORES.primario);
        doc.setGState(new doc.GState({ opacity: alpha }));
        doc.rect(0, i * 2.97, 210, 2.97, 'F');
        doc.restoreGraphicsState();
      }

      // Logo
      doc.setFillColor(...COLORES.secundario);
      doc.circle(105, 60, 35, 'F');

      doc.setFillColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(48);
      doc.text('DISC', 105, 67, { align: 'center' });

      // Título
      doc.setTextColor(...COLORES.texto);
      doc.setFontSize(32);
      doc.text('Informe de Perfil', 105, 120, { align: 'center' });

      doc.setFontSize(28);
      doc.text('Conductual Profesional', 105, 135, { align: 'center' });

      // Info del evaluado
      dibujarCuadro(30, 155, 150, 45, COLORES.primario, 0.05);

      doc.setFillColor(...COLORES.secundario);
      doc.circle(45, 167, 8, 'F');

      const initials = (data.Nombre || '').charAt(0) + (data.Apellido || '').charAt(0);
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(initials.toUpperCase(), 45, 170, { align: 'center' });

      doc.setTextColor(...COLORES.texto);
      doc.setFontSize(18);
      doc.text(nombreCompleto, 60, 168);

      doc.setTextColor(...COLORES.textoClaro);
      doc.setFontSize(10);
      doc.text(data.Correo || '', 60, 175);

      doc.setFontSize(9);
      doc.setTextColor(...COLORES.texto);
      doc.text(`Fecha de evaluación: ${fecha}`, 35, 188);
      doc.text(`Tiempo Parte I: ${resultado.tiempoParte1 || '—'}`, 35, 194);
      doc.text(`Tiempo Parte II: ${resultado.tiempoParte2 || '—'}`, 120, 194);

      // Pie
      doc.setTextColor(...COLORES.textoClaro);
      doc.setFontSize(10);
      doc.text('Basado en el modelo de William Moulton Marston — Método Cleaver',
        105, 250, { align: 'center' });

      doc.setFontSize(8);
      doc.text('© 2026 Escencial Consultora', 105, 260, { align: 'center' });
    }

    // ========== ÍNDICE ==========
    function generarIndice() {
      nuevaPagina();
      agregarEncabezado();

      let y = 35;
      dibujarTitulo('Índice de Contenidos', y);

      y += 15;

      const secciones = [
        { titulo: 'Introducción al Modelo DISC', pag: 3 },
        { titulo: 'Historia y Fundamentos', pag: 4 },
        { titulo: 'Los Dos Ejes Fundamentales', pag: 5 },
        { titulo: 'Los 8 Estilos Conductuales', pag: 6 },
        { titulo: 'Dimensión D - Dominancia', pag: 7 },
        { titulo: 'Dimensión I - Influencia', pag: 8 },
        { titulo: 'Dimensión S - Estabilidad', pag: 9 },
        { titulo: 'Dimensión C - Cumplimiento', pag: 10 },
        { titulo: 'Aplicaciones del Modelo DISC', pag: 11 },
        { titulo: 'Consideraciones Importantes', pag: 12 },
        { titulo: 'Resumen de Resultados', pag: 13 },
        { titulo: 'Gráfico de Barras DISC', pag: 14 },
        { titulo: 'Gráfico de Barras DISC — Bajo Presión', pag: 15 },
        { titulo: 'Rueda Success Insights', pag: 16 },
        { titulo: 'Análisis Interpretativo', pag: 17 },
        { titulo: 'Perfil Conductual Dominante', pag: 18 },
        { titulo: 'Consistencia del Perfil', pag: 19 },
        { titulo: 'Comparativa Parte I vs Parte II', pag: 20 },
        { titulo: 'Implicaciones Prácticas', pag: 21 },
        { titulo: 'Detalle Pregunta por Pregunta', pag: 22 }
      ];

      secciones.forEach((seccion, index) => {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.setTextColor(...COLORES.texto);

        doc.text(seccion.titulo, 20, y);

        // Línea punteada
        const dots = '.'.repeat(100);
        doc.setTextColor(...COLORES.textoClaro);
        doc.setFontSize(9);
        doc.text(dots, 90, y);

        // Número de página
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(...COLORES.primario);
        doc.text(seccion.pag.toString(), 185, y, { align: 'right' });

        y += 7;
      });
    }

    // ========== INTRODUCCIÓN AL DISC ==========
    function generarIntroduccion() {
      nuevaPagina();
      agregarEncabezado();

      let y = 35;
      dibujarTitulo('Introducción al Modelo DISC', y);

      y += 12;
      dibujarCuadro(15, y, 180, 50, COLORES.primario, 0.05);

      y += 8;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(...COLORES.primario);
      doc.text('¿Qué es el DISC?', 20, y);

      y += 7;
      const intro1 = 'El DISC es una herramienta de evaluación del comportamiento que permite comprender los patrones conductuales de las personas en diferentes situaciones. No mide inteligencia, aptitudes, salud mental ni valores, sino tendencias naturales de comportamiento.';
      y = dibujarTexto(intro1, 20, y, 170, 9);

      y += 5;
      const intro2 = 'Este modelo se basa en la premisa de que el comportamiento humano es observable, medible y predecible. Al comprender estos patrones, las personas pueden mejorar su autoconocimiento, comunicación y efectividad en el trabajo y en la vida personal.';
      y = dibujarTexto(intro2, 20, y, 170, 9);

      y += 10;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(...COLORES.primario);
      doc.text('¿Para qué sirve el DISC?', 15, y);

      y += 7;
      const aplicaciones = [
        'Mejorar el autoconocimiento y comprensión de las propias fortalezas y áreas de desarrollo',
        'Optimizar la comunicación interpersonal adaptándose al estilo del interlocutor',
        'Formar equipos de trabajo equilibrados y complementarios',
        'Desarrollar estrategias de liderazgo más efectivas',
        'Resolver conflictos comprendiendo diferentes perspectivas',
        'Seleccionar y ubicar personas en roles que aprovechen sus fortalezas naturales',
        'Diseñar programas de capacitación personalizados',
        'Mejorar las relaciones en el ámbito personal y profesional'
      ];

      y = dibujarLista(aplicaciones, 20, y, 170);

      y += 5;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(...COLORES.primario);
      doc.text('¿Qué NO es el DISC?', 15, y);

      y += 7;
      const noEs = [
        'No es un test de inteligencia ni mide capacidades cognitivas',
        'No es una evaluación psicológica clínica ni diagnostica trastornos',
        'No mide valores, creencias o motivaciones intrínsecas',
        'No es inmutable: el comportamiento puede desarrollarse y adaptarse',
        'No clasifica a las personas en categorías rígidas o estereotipos',
        'No predice el éxito o fracaso en un rol específico por sí solo'
      ];

      y = dibujarLista(noEs, 20, y, 170);
    }

    // ========== HISTORIA Y FUNDAMENTOS ==========
    function generarHistoria() {
      nuevaPagina();
      agregarEncabezado();

      let y = 35;
      dibujarTitulo('Historia y Fundamentos del DISC', y);

      y += 12;
      dibujarCuadro(15, y, 180, 45, COLORES.primario, 0.05);

      y += 8;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(...COLORES.primario);
      doc.text('William Moulton Marston (1893-1947)', 20, y);

      y += 7;
      const historia1 = 'El psicólogo estadounidense William Moulton Marston desarrolló la teoría DISC en 1928, publicada en su obra "Emotions of Normal People". Marston también es conocido por inventar el polígrafo (detector de mentiras) y por crear el personaje de Wonder Woman.';
      y = dibujarTexto(historia1, 20, y, 170, 9);

      y += 5;
      const historia2 = 'Marston propuso que las emociones de las personas normales (no patológicas) se derivan de cuatro respuestas primarias al entorno: Dominancia, Influencia, Estabilidad y Cumplimiento. Estas respuestas están determinadas por la percepción del ambiente (favorable vs. hostil) y la respuesta individual (activa vs. pasiva).';
      y = dibujarTexto(historia2, 20, y, 170, 9);

      y += 10;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(...COLORES.primario);
      doc.text('El Método Cleaver', 15, y);

      y += 7;
      const cleaver = 'En la década de 1950, Walter V. Clarke desarrolló el primer instrumento de evaluación DISC basado en la teoría de Marston. Posteriormente, John P. Cleaver creó el método "Self Description" utilizado en este informe, que presenta 28 grupos de cuatro características conductuales, permitiendo identificar tanto el estilo natural como el adaptado.';
      y = dibujarTexto(cleaver, 15, y, 180, 9);

      y += 10;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(...COLORES.primario);
      doc.text('Validación Científica', 15, y);

      y += 7;
      const validacion = 'El modelo DISC ha sido validado a través de décadas de investigación y millones de aplicaciones en todo el mundo. Estudios han demostrado su fiabilidad test-retest y su validez predictiva en contextos laborales. Es utilizado por más del 70% de las empresas Fortune 500 y ha sido aplicado en más de 70 países.';
      y = dibujarTexto(validacion, 15, y, 180, 9);

      y += 10;
      dibujarCuadro(15, y, 180, 40, COLORES.acento, 0.1);

      y += 8;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(...COLORES.acento);
      doc.text('Principios Fundamentales del DISC', 20, y);

      y += 7;
      const principios = [
        'El comportamiento es observable y medible de manera objetiva',
        'Las personas tienen tendencias conductuales predecibles y consistentes',
        'No existen estilos "buenos" o "malos", cada uno tiene fortalezas únicas',
        'El contexto influye: las personas adaptan su comportamiento según la situación',
        'El autoconocimiento es el primer paso hacia el desarrollo personal',
        'Comprender a otros mejora la efectividad de la comunicación y colaboración'
      ];

      y = dibujarLista(principios, 20, y, 170);
    }

    // ========== LOS DOS EJES FUNDAMENTALES (EXPANDIDO) ==========
    function generarEjes() {
      nuevaPagina();
      agregarEncabezado();

      let y = 35;
      dibujarTitulo('Los Dos Ejes Fundamentales del Comportamiento', y);

      y += 12;
      const intro = 'El modelo DISC se estructura en dos ejes independientes que, al combinarse, generan los cuatro estilos fundamentales y sus ocho variantes. Cada persona tiene grados variables en ambos ejes, lo que determina su perfil conductual único.';
      y = dibujarTexto(intro, 15, y, 180, 9);

      y += 10;
      const boxPadTop = 8;
      const boxPadBottom = 8;

      const acelerado = [
        'Actúan con rapidez y sentido de urgencia',
        'Toman decisiones ágiles, a veces sin analizar todos los detalles',
        'Se aburren con tareas lentas o repetitivas',
        'Prefieren ambientes dinámicos con cambios frecuentes',
        'Se impacientan con procesos burocráticos extensos',
        'Valoran la eficiencia y los resultados inmediatos'
      ];

      const pausado = [
        'Se toman el tiempo necesario para reflexionar antes de actuar',
        'Analizan la información detalladamente antes de decidir',
        'Prefieren ambientes estables y predecibles',
        'Valoran la consistencia y la calidad sobre la velocidad',
        'Necesitan tiempo para adaptarse a cambios significativos',
        'Mantienen la calma incluso bajo presión'
      ];

      const titleH = heightOfText('EJE VERTICAL...', 170, 14, 'bold') + 2;
      const subtitleH = heightOfText('Mide la velocidad...', 170, 9) + 4;

      const aceleradoTitleH = heightOfText('RITMO ACELERADO...', 170, 11, 'bold') + 2;
      const aceleradoListH = heightOfList(acelerado, 165, 9, 1);

      const pausadoTitleH = heightOfText('RITMO PAUSADO...', 170, 11, 'bold') + 2;
      const pausadoListH = heightOfList(pausado, 165, 9, 1);

      const needed = boxPadTop + titleH + subtitleH + aceleradoTitleH + aceleradoListH + 4 + pausadoTitleH + pausadoListH + boxPadBottom;

      y = ensureSpace(y, needed);
      dibujarCuadro(15, y, 180, needed, COLORES.D, 0.1);

      // y += boxPadTop; ... y vas escribiendo dentro


      y += 8;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(...COLORES.D);
      doc.text('EJE VERTICAL: Ritmo de Respuesta', 20, y);


      y += 7;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...COLORES.textoClaro);
      doc.text('Mide la velocidad con la que las personas procesan información y toman acción', 20, y);

      y += 10;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(...COLORES.D);
      doc.text('(+) RITMO ACELERADO (D - I)', 20, y);

      y += 6;

      y = dibujarLista(acelerado, 25, y, 165);

      y += 5;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(...COLORES.S);
      doc.text('(-) RITMO PAUSADO (S - C)', 20, y);

      y += 6;

      y = dibujarLista(pausado, 25, y, 165);

      // Nueva página para el eje horizontal
      nuevaPagina();
      agregarEncabezado();

      y = 35;
      dibujarCuadro(15, y, 180, 70, COLORES.C, 0.1);

      y += 8;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(...COLORES.C);
      doc.text('EJE HORIZONTAL: Orientacion Focal', 20, y);

      y += 7;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...COLORES.textoClaro);
      doc.text('Define si la persona se enfoca principalmente en personas o en tareas y procesos', 20, y);

      y += 10;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(...COLORES.I);
      doc.text('(>) ORIENTACION A LAS PERSONAS (I - S)', 20, y);

      y += 6;
      const personas = [
        'Priorizan las relaciones interpersonales y el bienestar del equipo',
        'Disfrutan del contacto social y la colaboración',
        'Se motivan por el reconocimiento y la aprobación de otros',
        'Buscan armonía y evitan conflictos cuando es posible',
        'Son empáticos y consideran los sentimientos de los demás',
        'Prefieren trabajar en equipo antes que solos',
        'Valoran la comunicación abierta y el ambiente positivo'
      ];
      y = dibujarLista(personas, 25, y, 165);

      y += 5;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(...COLORES.D);
      doc.text('(<) ORIENTACION A LAS TAREAS (D - C)', 20, y);


      y += 6;
      const tareas = [
        'Priorizan resultados, objetivos y la ejecución eficiente',
        'Se enfocan en "qué hay que hacer" más que en "quién lo hace"',
        'Se motivan por logros concretos y metas alcanzadas',
        'Valoran la competencia técnica y la calidad del trabajo',
        'Toman decisiones basadas en datos y hechos objetivos',
        'Prefieren trabajar de manera independiente cuando es productivo',
        'Establecen límites claros entre lo personal y lo profesional'
      ];
      y = dibujarLista(tareas, 25, y, 165);

      y += 10;
      dibujarCuadro(15, y, 180, 35, COLORES.primario, 0.05);

      y += 8;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(...COLORES.primario);
      doc.text('Nota Importante: Los Ejes son Independientes', 20, y);

      y += 7;
      const nota = 'Una persona puede tener ritmo acelerado pero estar orientada a personas (I), o ritmo pausado pero orientada a tareas (C). Las cuatro combinaciones son igualmente válidas y cada una tiene sus propias fortalezas. No existe una combinación "mejor" que otra; todo depende del contexto y las necesidades específicas.';
      y = dibujarTexto(nota, 20, y, 170, 9);
    }

    // ========== LOS 8 ESTILOS CONDUCTUALES (MÁS DETALLADO) ==========
    function generarEstilos() {
      nuevaPagina();
      agregarEncabezado();

      let y = 35;
      dibujarTitulo('Los 8 Estilos Conductuales de la Rueda DISC', y);

      y += 12;
      const intro = 'La combinación de los dos ejes fundamentales genera ocho estilos conductuales distintos, cada uno ubicado en un segmento de la Rueda Success Insights. Cada estilo representa una forma única de interactuar con el entorno y tiene características, fortalezas y necesidades específicas.';
      y = dibujarTexto(intro, 15, y, 180, 9);

      y += 10;

      const estilos = [
        {
          nombre: 'CONDUCTOR (D)',
          emoji: '\u{1F3AF}',
          color: COLORES.D,
          ubicacion: 'Ritmo Acelerado + Orientado a Tareas',
          descripcion: 'Los Conductores son directos, decididos y buscan resultados tangibles. Toman el control de las situaciones, enfrentan desafíos con determinación y actúan con urgencia para alcanzar objetivos.',
          caracteristicas: [
            'Liderazgo natural y capacidad de toma de decisiones',
            'Enfoque en resultados y eficiencia',
            'Franqueza y comunicación directa',
            'Tolerancia al riesgo y la presión',
            'Orientación competitiva'
          ],
          fortalezas: [
            'Inician proyectos y movilizan recursos rápidamente',
            'Toman decisiones difíciles sin dudar',
            'Aceptan responsabilidades desafiantes',
            'Mantienen el enfoque en objetivos estratégicos'
          ],
          riesgos: [
            'Pueden parecer impacientes o insensibles',
            'Tendencia a minimizar detalles importantes',
            'Riesgo de sobrecargar a otros con su ritmo'
          ]
        },
        {
          nombre: 'PERSUASOR (D/I)',
          emoji: '\u{1F680}',
          color: COLORES.D,
          ubicacion: 'Ritmo Acelerado + Balance entre Personas y Tareas',
          descripcion: 'Los Persuasores combinan la orientación a resultados con habilidades interpersonales. Convencen apelando tanto a la lógica como a las emociones, siendo innovadores y emprendedores.',
          caracteristicas: [
            'Visión estratégica combinada con carisma',
            'Capacidad de influir y motivar equipos',
            'Creatividad en la solución de problemas',
            'Energía contagiosa y optimismo',
            'Orientación al cambio y la innovación'
          ],
          fortalezas: [
            'Generan entusiasmo por nuevas ideas',
            'Negocian efectivamente',
            'Inspiran a otros a alcanzar metas ambiciosas',
            'Adaptan su comunicación según la audiencia'
          ],
          riesgos: [
            'Pueden sobrevender ideas sin fundamento sólido',
            'Tendencia a comprometerse en exceso',
            'Dificultad para mantener el foco en una sola iniciativa'
          ]
        }
      ];

      estilos.forEach(estilo => {
        if (y > 220) {
          nuevaPagina();
          agregarEncabezado();
          y = 35;
        }

        dibujarCuadro(15, y, 180, 95, estilo.color, 0.1);

        y += 8;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(...estilo.color);
        doc.text(estilo.nombre, 20, y);


        y += 6;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(...COLORES.textoClaro);
        doc.text(estilo.ubicacion, 20, y);

        y += 6;
        doc.setFontSize(9);
        doc.setTextColor(...COLORES.texto);
        y = dibujarTexto(estilo.descripcion, 20, y, 170, 9);

        y += 3;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(...estilo.color);
        doc.text('Características:', 20, y);

        y += 4;
        estilo.caracteristicas.forEach(car => {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(...COLORES.texto);
          doc.text('•', 22, y);
          doc.text(car, 27, y);
          y += 3.5;
        });

        y += 2;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(...COLORES.S);
        doc.text('Fortalezas:', 20, y);

        y += 4;
        estilo.fortalezas.forEach(fort => {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(...COLORES.texto);
          doc.text('+', 22, y);
          doc.text(fort, 27, y);
          y += 3.5;
        });

        y += 2;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(...COLORES.I);
        doc.text('Áreas de atención:', 20, y);

        y += 4;
        estilo.riesgos.forEach(riesgo => {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(...COLORES.texto);
          doc.text('!', 22, y);
          doc.text(riesgo, 27, y);
          y += 3.5;
        });

        y += 8;
      });

      // Continuar con más estilos en siguientes páginas...
      nuevaPagina();
      agregarEncabezado();
      y = 35;

      const estilos2 = [
        {
          nombre: 'PROMOTOR (I)',
          emoji: '\u2B50',
          color: COLORES.I,
          ubicacion: 'Ritmo Acelerado + Orientado a Personas',
          descripcion: 'Los Promotores expresan sus ideas con entusiasmo para influir en otros. Son optimistas, comunicativos y generan cohesión en los equipos mediante su energía positiva.',
          caracteristicas: [
            'Comunicación expresiva y persuasiva',
            'Optimismo contagioso',
            'Habilidad para conectar con diversos tipos de personas',
            'Creatividad en la presentación de ideas',
            'Facilidad para generar redes de contactos'
          ],
          fortalezas: [
            'Motivan e inspiran a los equipos',
            'Crean ambientes de trabajo positivos',
            'Generan nuevas ideas y oportunidades',
            'Facilitan la colaboración entre personas'
          ],
          riesgos: [
            'Pueden ser percibidos como superficiales',
            'Tendencia a evitar confrontaciones necesarias',
            'Dificultad para mantener el enfoque en detalles'
          ]
        },
        {
          nombre: 'RELACIONADOR (I/S)',
          emoji: '\u{1F917}',
          color: COLORES.I,
          ubicacion: 'Balance en Ritmo + Orientado a Personas',
          descripcion: 'Los Relacionadores combinan sociabilidad con paciencia. Son empáticos, considerados y se enfocan en construir relaciones sólidas y duraderas.',
          caracteristicas: [
            'Empatía genuina y escucha activa',
            'Paciencia y tolerancia con los demás',
            'Habilidad para mediar en conflictos',
            'Comunicación amable y considerada',
            'Lealtad hacia personas y equipos'
          ],
          fortalezas: [
            'Crean conexiones profundas y significativas',
            'Mantienen la armonía en los equipos',
            'Apoyan el desarrollo de otros',
            'Generan confianza y seguridad psicológica'
          ],
          riesgos: [
            'Dificultad para establecer límites',
            'Tendencia a evitar decisiones difíciles',
            'Pueden posponer confrontaciones necesarias'
          ]
        },
        {
          nombre: 'SOSTENEDOR (S)',
          emoji: '\u{1F91D}',
          color: COLORES.S,
          ubicacion: 'Ritmo Pausado + Orientado a Personas',
          descripcion: 'Los Sostenedores defienden ideas sólidas y trabajan consistentemente para asegurar que los proyectos se completen. Son pacientes, leales y generan estabilidad.',
          caracteristicas: [
            'Consistencia y confiabilidad',
            'Paciencia con procesos y personas',
            'Lealtad hacia la organización y el equipo',
            'Habilidad para escuchar sin juzgar',
            'Enfoque en el largo plazo'
          ],
          fortalezas: [
            'Mantienen la continuidad de los proyectos',
            'Aseguran seguimiento de principio a fin',
            'Generan ambientes de trabajo estables',
            'Apoyan a otros de manera práctica y constante'
          ],
          riesgos: [
            'Resistencia al cambio',
            'Dificultad para adaptarse rápidamente',
            'Tendencia a permanecer en zona de confort'
          ]
        },
        {
          nombre: 'COORDINADOR (S/C)',
          emoji: '\u2699\uFE0F',
          color: COLORES.S,
          ubicacion: 'Ritmo Pausado + Balance entre Personas y Tareas',
          descripcion: 'Los Coordinadores se enfocan en hechos y métodos comprobados. Son disciplinados, organizados y mantienen altos estándares de calidad.',
          caracteristicas: [
            'Disciplina y metodología',
            'Atención a procesos y estándares',
            'Organización sistemática',
            'Consistencia en la ejecución',
            'Respeto por las normas establecidas'
          ],
          fortalezas: [
            'Aseguran el cumplimiento de procedimientos',
            'Mantienen sistemas de calidad vigentes',
            'Documentan procesos efectivamente',
            'Previenen errores mediante planificación'
          ],
          riesgos: [
            'Pueden ser percibidos como inflexibles',
            'Resistencia a métodos no probados',
            'Tendencia al perfeccionismo excesivo'
          ]
        }
      ];

      estilos2.forEach(estilo => {
        if (y > 220) {
          nuevaPagina();
          agregarEncabezado();
          y = 35;
        }

        dibujarCuadro(15, y, 180, 85, estilo.color, 0.1);

        y += 8;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(...estilo.color);
        doc.text(estilo.nombre, 20, y);

        y += 6;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(...COLORES.textoClaro);
        doc.text(estilo.ubicacion, 20, y);

        y += 6;
        doc.setFontSize(9);
        doc.setTextColor(...COLORES.texto);
        y = dibujarTexto(estilo.descripcion, 20, y, 170, 9);

        y += 3;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(...estilo.color);
        doc.text('Características:', 20, y);

        y += 4;
        estilo.caracteristicas.forEach(car => {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(...COLORES.texto);
          doc.text('•', 22, y);
          const lines = doc.splitTextToSize(car, 165);
          doc.text(lines, 27, y);
          y += lines.length * 3.5;
        });

        y += 2;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(...COLORES.S);
        doc.text('Fortalezas:', 20, y);

        y += 4;
        estilo.fortalezas.forEach(fort => {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(...COLORES.texto);
          doc.text('+', 22, y);
          const lines = doc.splitTextToSize(fort, 165);
          doc.text(lines, 27, y);
          y += lines.length * 3.5;
        });

        y += 2;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(...COLORES.I);
        doc.text('Áreas de atención:', 20, y);

        y += 4;
        estilo.riesgos.forEach(riesgo => {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(...COLORES.texto);
          doc.text('!', 22, y);
          const lines = doc.splitTextToSize(riesgo, 165);
          doc.text(lines, 27, y);
          y += lines.length * 3.5;
        });

        y += 8;
      });

      // Continuar con últimos estilos...
      nuevaPagina();
      agregarEncabezado();
      y = 35;

      const estilos3 = [
        {
          nombre: 'ANALIZADOR (C)',
          emoji: '\u{1F4CB}',
          color: COLORES.C,
          ubicacion: 'Ritmo Pausado + Orientado a Tareas',
          descripcion: 'Los Analizadores buscan exactitud y aseguran los más altos niveles de calidad. Son precisos, sistemáticos y recopilan información detallada antes de actuar.',
          caracteristicas: [
            'Precisión y exactitud en el trabajo',
            'Pensamiento analítico profundo',
            'Enfoque en la calidad',
            'Metodología sistemática',
            'Atención meticulosa a los detalles'
          ],
          fortalezas: [
            'Identifican errores y riesgos potenciales',
            'Aseguran cumplimiento de estándares',
            'Analizan problemas complejos efectivamente',
            'Toman decisiones fundamentadas en datos'
          ],
          riesgos: [
            'Parálisis por análisis',
            'Tendencia al perfeccionismo extremo',
            'Pueden ser percibidos como críticos o distantes'
          ]
        },
        {
          nombre: 'IMPLEMENTADOR (C/D)',
          emoji: '\u26A1',
          color: COLORES.C,
          ubicacion: 'Balance en Ritmo + Orientado a Tareas',
          descripcion: 'Los Implementadores evalúan y aprovechan datos para llegar a soluciones. Aplican creativamente ideas basadas en hechos y administran bien tiempo y recursos.',
          caracteristicas: [
            'Combinación de análisis y acción',
            'Gestión eficiente de recursos',
            'Aplicación práctica de teorías',
            'Resolución de problemas basada en evidencia',
            'Administración efectiva del tiempo'
          ],
          fortalezas: [
            'Transforman ideas en planes ejecutables',
            'Optimizan procesos y sistemas',
            'Toman decisiones equilibrando datos y urgencia',
            'Implementan soluciones sostenibles'
          ],
          riesgos: [
            'Pueden ser percibidos como fríos o calculadores',
            'Tendencia a sub-valorar aspectos humanos',
            'Impaciencia con quienes no son igualmente eficientes'
          ]
        }
      ];

      estilos3.forEach(estilo => {
        if (y > 220) {
          nuevaPagina();
          agregarEncabezado();
          y = 35;
        }

        dibujarCuadro(15, y, 180, 85, estilo.color, 0.1);

        y += 8;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(...estilo.color);
        doc.text(estilo.nombre, 20, y);


        y += 6;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(...COLORES.textoClaro);
        doc.text(estilo.ubicacion, 20, y);

        y += 6;
        doc.setFontSize(9);
        doc.setTextColor(...COLORES.texto);
        y = dibujarTexto(estilo.descripcion, 20, y, 170, 9);

        y += 3;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(...estilo.color);
        doc.text('Características:', 20, y);

        y += 4;
        estilo.caracteristicas.forEach(car => {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(...COLORES.texto);
          doc.text('•', 22, y);
          const lines = doc.splitTextToSize(car, 165);
          doc.text(lines, 27, y);
          y += lines.length * 3.5;
        });

        y += 2;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(...COLORES.S);
        doc.text('Fortalezas:', 20, y);

        y += 4;
        estilo.fortalezas.forEach(fort => {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(...COLORES.texto);
          doc.text('✓', 22, y);
          const lines = doc.splitTextToSize(fort, 165);
          doc.text(lines, 27, y);
          y += lines.length * 3.5;
        });

        y += 2;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(...COLORES.I);
        doc.text('Áreas de atención:', 20, y);

        y += 4;
        estilo.riesgos.forEach(riesgo => {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(...COLORES.texto);
          doc.text('!', 22, y);
          const lines = doc.splitTextToSize(riesgo, 165);
          doc.text(lines, 27, y);
          y += lines.length * 3.5;
        });

        y += 8;
      });
    }

    // ========== DIMENSIONES COMPLETAS (4 PÁGINAS) ==========
    function generarDimensionesCompletas() {
      const dimensiones = [
        {
          letra: 'D',
          nombre: 'Dominancia',
          color: COLORES.D,
          subtitulo: 'Cómo Responde a Problemas y Desafíos',
          pregunta: '¿QUÉ? — Enfocado en resultados y acción',
          descripcion: 'Las personas con alta Dominancia se caracterizan por ser directas, decididas y orientadas a resultados. Les gusta tener el control, enfrentan desafíos con determinación y toman decisiones con rapidez. Son competitivas y buscan alcanzar objetivos de manera eficiente. Lideran con firmeza y se destacan en contextos que requieren acción inmediata y gestión bajo presión.',
          caracteristicas: [
            'Orientación natural al liderazgo y la toma de control',
            'Enfoque en resultados tangibles y medibles',
            'Comunicación directa, franca y sin rodeos',
            'Alta tolerancia al riesgo y la incertidumbre',
            'Competitividad y deseo de ganar',
            'Sentido de urgencia constante'
          ],
          motivadores: [
            'Poder y autoridad para tomar decisiones',
            'Oportunidades de avance y promoción',
            'Desafíos que pongan a prueba sus capacidades',
            'Autonomía e independencia',
            'Reconocimiento por resultados logrados',
            'Competencia y superación de obstáculos'
          ],
          fortalezas: [
            'Liderazgo natural y capacidad de movilizar equipos',
            'Toma de decisiones rápida y decisiva',
            'Orientación clara a resultados y objetivos',
            'Visión estratégica de largo plazo',
            'Habilidad para gestionar crisis y presión',
            'Iniciativa para comenzar proyectos ambiciosos'
          ],
          mejora: [
            'Puede ser percibido como impaciente o autoritario',
            'Tendencia a pasar por alto detalles importantes',
            'Riesgo de descuidar necesidades emocionales del equipo',
            'Dificultad para delegar apropiadamente',
            'Impaciencia con procesos que consideran lentos'
          ],
          bajoPression: [
            'Puede volverse agresivo o dominante',
            'Impaciencia extrema con errores',
            'Tendencia a imponer su voluntad sin considerar alternativas',
            'Toma de decisiones impulsivas sin análisis suficiente'
          ],
          entorno: [
            'Entornos dinámicos y competitivos',
            'Desafíos constantes y oportunidades de crecimiento',
            'Autonomía para tomar decisiones',
            'Resultados visibles y medibles',
            'Oportunidades de avance rápido',
            'Reconocimiento por logros'
          ]
        },
        {
          letra: 'I',
          nombre: 'Influencia',
          color: COLORES.I,
          subtitulo: 'Cómo Influye en el Punto de Vista de los Demás',
          pregunta: '¿QUIÉN? — Enfocado en personas y relaciones',
          descripcion: 'Las personas con alta Influencia son extrovertidas, optimistas y persuasivas. Disfrutan socializar, influir en otros y crear un ambiente positivo. Son comunicativas y les motiva el reconocimiento social. Generan entusiasmo y cohesión en los equipos, son creativas y excelentes para promover proyectos e ideas.',
          caracteristicas: [
            'Comunicación expresiva y entusiasta',
            'Optimismo natural y actitud positiva',
            'Habilidad para conectar con diversos tipos de personas',
            'Creatividad e innovación en ideas',
            'Expresividad emocional',
            'Facilidad para generar redes y contactos'
          ],
          motivadores: [
            'Reconocimiento social y popularidad',
            'Relaciones interpersonales significativas',
            'Trabajo en equipo y colaboración',
            'Libertad de expresión',
            'Ambiente de trabajo positivo y divertido',
            'Oportunidades para presentar ideas públicamente'
          ],
          fortalezas: [
            'Comunicación excepcional y persuasión',
            'Trabajo en equipo y construcción de relaciones',
            'Creatividad y pensamiento innovador',
            'Networking y desarrollo de contactos',
            'Capacidad de motivar e inspirar a otros',
            'Generación de entusiasmo por proyectos'
          ],
          mejora: [
            'Puede ser percibido como desorganizado o superficial',
            'Tendencia a priorizar popularidad sobre productividad',
            'Dificultad para mantener el foco en detalles',
            'Evitación de confrontaciones necesarias',
            'Puede sobre-comprometerse socialmente'
          ],
          bajoPression: [
            'Puede volverse desorganizado y disperso',
            'Superficialidad en el análisis de problemas',
            'Exceso emocional en respuestas',
            'Búsqueda de aprobación a toda costa',
            'Dificultad para priorizar tareas importantes'
          ],
          entorno: [
            'Entornos colaborativos con interacción frecuente',
            'Reconocimiento público de logros',
            'Flexibilidad y variedad en las tareas',
            'Ambiente optimista y positivo',
            'Oportunidades de trabajar con personas',
            'Libertad para expresar ideas creativas'
          ]
        },
        {
          letra: 'S',
          nombre: 'Estabilidad',
          color: COLORES.S,
          subtitulo: 'Cómo Responde al Ritmo del Entorno',
          pregunta: '¿CÓMO? — Enfocado en procesos y cooperación',
          descripcion: 'Las personas con alta Estabilidad son pacientes, leales y orientadas al equipo. Valoran la estabilidad y previsibilidad, son confiables y prefieren ambientes armoniosos. Se destacan por mantener la calma en situaciones difíciles, mediar en conflictos y generar un clima de trabajo seguro y predecible.',
          caracteristicas: [
            'Paciencia y perseverancia',
            'Lealtad hacia personas y organizaciones',
            'Preferencia por rutinas y estabilidad',
            'Escucha activa y empática',
            'Enfoque en el largo plazo',
            'Consistencia y confiabilidad'
          ],
          motivadores: [
            'Seguridad y estabilidad laboral',
            'Relaciones armoniosas y duraderas',
            'Reconocimiento sincero y personal',
            'Tiempo para adaptarse a cambios',
            'Ambiente de trabajo predecible',
            'Sentido de pertenencia al equipo'
          ],
          fortalezas: [
            'Lealtad excepcional a largo plazo',
            'Paciencia con procesos y personas',
            'Escucha activa sin juzgar',
            'Consistencia en la ejecución',
            'Capacidad de mediación en conflictos',
            'Perseverancia hasta completar tareas'
          ],
          mejora: [
            'Puede ser percibido como resistente al cambio',
            'Dificultad para tomar decisiones rápidas',
            'Tendencia a evitar confrontaciones necesarias',
            'Adaptación lenta a nuevas situaciones',
            'Dificultad para establecer límites firmes'
          ],
          bajoPression: [
            'Puede volverse pasivo e indeciso',
            'Excesiva complacencia con demandas',
            'Resistencia total a cualquier cambio',
            'Tendencia a guardar resentimientos',
            'Paralización ante decisiones difíciles'
          ],
          entorno: [
            'Entornos estables con cambios graduales',
            'Relaciones de largo plazo',
            'Roles y responsabilidades bien definidos',
            'Tiempo suficiente para adaptarse',
            'Liderazgo comprensivo y empático',
            'Trabajo en equipo colaborativo'
          ]
        },
        {
          letra: 'C',
          nombre: 'Cumplimiento',
          color: COLORES.C,
          subtitulo: 'Cómo Responde a Reglas y Procedimientos',
          pregunta: '¿POR QUÉ? — Enfocado en calidad y precisión',
          descripcion: 'Las personas con alto Cumplimiento son analíticas, precisas y orientadas a la calidad. Valoran la exactitud, siguen procedimientos establecidos y buscan la perfección. Son detallistas y sistemáticas, con gran capacidad de análisis profundo, pensamiento crítico y habilidad para identificar problemas antes de que ocurran.',
          caracteristicas: [
            'Precisión y exactitud en el trabajo',
            'Pensamiento analítico y sistemático',
            'Atención meticulosa a los detalles',
            'Respeto por normas y procedimientos',
            'Enfoque en la calidad',
            'Objetividad en la toma de decisiones'
          ],
          motivadores: [
            'Calidad y precisión en el trabajo',
            'Estándares altos y expectativas claras',
            'Información detallada y completa',
            'Tiempo para analizar antes de decidir',
            'Procedimientos y procesos claros',
            'Reconocimiento por exactitud y calidad'
          ],
          fortalezas: [
            'Análisis profundo y pensamiento crítico',
            'Precisión técnica y atención al detalle',
            'Control de calidad riguroso',
            'Planificación detallada y exhaustiva',
            'Identificación temprana de riesgos',
            'Cumplimiento de normas y estándares'
          ],
          mejora: [
            'Puede ser percibido como excesivamente crítico',
            'Parálisis por análisis',
            'Perfeccionismo que retrasa entregas',
            'Tendencia al aislamiento social',
            'Resistencia a innovaciones no probadas'
          ],
          bajoPression: [
            'Puede volverse excesivamente crítico con otros',
            'Pesimismo y enfoque en lo negativo',
            'Aislamiento del equipo',
            'Obsesión con detalles perdiendo visión global',
            'Inflexibilidad extrema'
          ],
          entorno: [
            'Entornos estructurados con reglas claras',
            'Tiempo suficiente para análisis',
            'Acceso a datos e información completa',
            'Valoración de la precisión y calidad',
            'Expectativas claramente definidas',
            'Mínima ambigüedad en las tareas'
          ]
        }
      ];

      dimensiones.forEach((dim, index) => {
        nuevaPagina();
        agregarEncabezado();

        let y = 35;

        // Header de dimensión
        dibujarCuadro(15, y, 180, 20, dim.color, 0.15);

        y += 8;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(28);
        doc.setTextColor(...dim.color);
        doc.text(dim.letra, 20, y + 5);

        doc.setFontSize(18);
        doc.text(dim.nombre, 40, y + 5);

        y += 10;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(...COLORES.textoClaro);
        doc.text(dim.subtitulo, 40, y);

        y += 15;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(...dim.color);
        doc.text(dim.pregunta, 15, y);

        y += 8;
        y = dibujarTexto(dim.descripcion, 15, y, 180, 10);

        y += 8;
        dibujarCuadro(15, y, 85, 45, dim.color, 0.08);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(...dim.color);
        doc.text('Características', 20, y + 6);

        let yTemp = y + 12;
        dim.caracteristicas.forEach(car => {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(...COLORES.texto);
          doc.text('•', 20, yTemp);
          const lines = doc.splitTextToSize(car, 70);
          doc.text(lines, 24, yTemp);
          yTemp += lines.length * 3;
        });

        dibujarCuadro(110, y, 85, 45, COLORES.I, 0.08);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(...COLORES.I);
        doc.text('Motivadores', 115, y + 6);

        yTemp = y + 12;
        dim.motivadores.forEach(mot => {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(...COLORES.texto);
          doc.text('•', 115, yTemp);
          const lines = doc.splitTextToSize(mot, 70);
          doc.text(lines, 119, yTemp);
          yTemp += lines.length * 3;
        });

        y += 53;
        dibujarCuadro(15, y, 85, 45, COLORES.S, 0.08);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(...COLORES.S);
        doc.text('Fortalezas', 20, y + 6);

        yTemp = y + 12;
        dim.fortalezas.forEach(fort => {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(...COLORES.texto);
          doc.text('+', 20, yTemp);
          const lines = doc.splitTextToSize(fort, 70);
          doc.text(lines, 24, yTemp);
          yTemp += lines.length * 3;
        });

        dibujarCuadro(110, y, 85, 45, COLORES.I, 0.08);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(...COLORES.I);
        doc.text('Áreas de Desarrollo', 115, y + 6);

        yTemp = y + 12;
        dim.mejora.forEach(mej => {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(...COLORES.texto);
          doc.text('!', 115, yTemp);
          const lines = doc.splitTextToSize(mej, 70);
          doc.text(lines, 119, yTemp);
          yTemp += lines.length * 3;
        });

        y += 53;
        dibujarCuadro(15, y, 180, 35, COLORES.D, 0.08);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(...COLORES.D);
        doc.text('Bajo Presión o Estrés', 20, y + 6);

        yTemp = y + 12;
        dim.bajoPression.forEach(bp => {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(...COLORES.texto);
          doc.text('!', 20, yTemp);
          const lines = doc.splitTextToSize(bp, 165);
          doc.text(lines, 25, yTemp);
          yTemp += lines.length * 3;
        });

        y += 43;
        dibujarCuadro(15, y, 180, 35, dim.color, 0.08);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(...dim.color);
        doc.text('Entorno Ideal de Trabajo', 20, y + 6);

        yTemp = y + 12;
        dim.entorno.forEach(ent => {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(...COLORES.texto);
          doc.text('>', 20, yTemp);
          const lines = doc.splitTextToSize(ent, 165);
          doc.text(lines, 25, yTemp);
          yTemp += lines.length * 3;
        });
      });
    }

    // ========== APLICACIONES DEL DISC ==========
    function generarAplicaciones() {
      nuevaPagina();
      agregarEncabezado();

      let y = 35;
      dibujarTitulo('Aplicaciones del Modelo DISC', y);

      y += 12;
      const intro = 'El modelo DISC tiene múltiples aplicaciones prácticas en diversos contextos organizacionales y personales. Su versatilidad lo convierte en una herramienta invaluable para el desarrollo y la gestión del talento humano.';
      y = dibujarTexto(intro, 15, y, 180, 10);

      y += 10;

      const aplicaciones = [
        {
          titulo: 'Desarrollo Organizacional',
          color: COLORES.primario,
          items: [
            'Selección de personal: Identificar candidatos cuyo estilo se alinee con la cultura y el rol',
            'Formación de equipos: Crear equipos balanceados y complementarios',
            'Resolución de conflictos: Comprender diferentes perspectivas para mediar efectivamente',
            'Planificación de sucesión: Identificar y desarrollar futuros líderes',
            'Onboarding: Personalizar la integración según el estilo del nuevo colaborador',
            'Evaluación de desempeño: Considerar estilos al dar feedback'
          ]
        },
        {
          titulo: 'Liderazgo y Gestión',
          color: COLORES.D,
          items: [
            'Estilo de liderazgo: Adaptar el enfoque según el estilo del equipo',
            'Delegación efectiva: Asignar tareas considerando fortalezas naturales',
            'Motivación de equipos: Aplicar estrategias personalizadas de motivación',
            'Comunicación estratégica: Ajustar mensajes al estilo del receptor',
            'Gestión del cambio: Anticipar resistencias y adaptar la estrategia',
            'Coaching: Personalizar el desarrollo según el perfil'
          ]
        },
        {
          titulo: 'Desarrollo Personal',
          color: COLORES.I,
          items: [
            'Autoconocimiento: Comprender fortalezas y áreas de desarrollo',
            'Gestión de estrés: Identificar qué situaciones generan tensión',
            'Mejora de relaciones: Entender y adaptarse a otros estilos',
            'Crecimiento profesional: Identificar roles y entornos ideales',
            'Comunicación efectiva: Adaptar estilo según el interlocutor',
            'Toma de decisiones: Balancear tendencias naturales'
          ]
        },
        {
          titulo: 'Ventas y Servicio al Cliente',
          color: COLORES.S,
          items: [
            'Identificar el estilo del cliente para adaptar el enfoque',
            'Personalizar presentaciones según preferencias del cliente',
            'Manejar objeciones según el estilo',
            'Construir relaciones duraderas',
            'Cerrar ventas con estrategias adaptadas',
            'Gestionar cuentas según necesidades específicas'
          ]
        }
      ];

      aplicaciones.forEach(app => {
        if (y > 230) {
          nuevaPagina();
          agregarEncabezado();
          y = 35;
        }

        dibujarCuadro(15, y, 180, 50, app.color, 0.1);

        y += 8;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(...app.color);
        doc.text(app.titulo, 20, y);

        y += 7;
        app.items.forEach(item => {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          doc.setTextColor(...COLORES.texto);
          doc.text('•', 20, y);
          const lines = doc.splitTextToSize(item, 165);
          doc.text(lines, 25, y);
          y += lines.length * 3.5;
        });

        y += 5;
      });
    }

    // ========== CONSIDERACIONES IMPORTANTES ==========
    function generarConsideraciones() {
      nuevaPagina();
      agregarEncabezado();

      let y = 35;
      dibujarTitulo('Consideraciones Importantes', y);

      y += 12;
      dibujarCuadro(15, y, 180, 160, COLORES.I, 0.08);

      y += 10;

      const consideraciones = [
        {
          titulo: 'No es un test de inteligencia ni aptitud',
          texto: 'El DISC evalúa tendencias conductuales, no capacidad intelectual, habilidades técnicas ni competencias profesionales. Es complementario a otras evaluaciones como tests de aptitud, conocimientos técnicos o inteligencia emocional.'
        },
        {
          titulo: 'No hay perfiles "buenos" o "malos"',
          texto: 'Cada estilo conductual tiene fortalezas únicas y áreas de desarrollo. El perfil "ideal" depende del contexto, rol y objetivos específicos. La diversidad de estilos enriquece a los equipos.'
        },
        {
          titulo: 'Refleja autopercepción en un momento específico',
          texto: 'Los resultados pueden variar según estado emocional, contexto laboral y momento de vida. Se recomienda re-evaluación periódica (cada 12-18 meses) o ante cambios significativos de rol o contexto.'
        },
        {
          titulo: 'El comportamiento es modificable y desarrollable',
          texto: 'Las personas pueden adaptar y desarrollar nuevos patrones conductuales con autoconocimiento, práctica consciente y entrenamiento adecuado. El DISC no es una "sentencia" sino un punto de partida para el desarrollo.'
        },
        {
          titulo: 'Contexto y situación importan',
          texto: 'El comportamiento puede variar según el contexto (laboral vs. personal, familia vs. amigos). El perfil "Natural" refleja tendencias innatas, mientras el "Adaptado" muestra ajustes al entorno laboral.'
        },
        {
          titulo: 'Se recomienda interpretación profesional',
          texto: 'Para máximo aprovechamiento, complementar este informe con una sesión de devolución con un consultor certificado en DISC. Un profesional puede profundizar en matices y aplicaciones específicas.'
        },
        {
          titulo: 'Considerar otros factores',
          texto: 'El DISC es una pieza del rompecabezas. Complementar con evaluaciones de valores, motivadores, inteligencia emocional, competencias técnicas y experiencia. Las decisiones importantes deben considerar múltiples fuentes de información.'
        },
        {
          titulo: 'Respeto por la confidencialidad',
          texto: 'Los resultados son confidenciales y pertenecen al evaluado. No deben compartirse sin consentimiento explícito. En contextos organizacionales, establecer claramente quién tendrá acceso y con qué propósito.'
        }
      ];

      consideraciones.forEach(cons => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(...COLORES.I);
        doc.text('!', 20, y);

        const tituloLines = doc.splitTextToSize(cons.titulo, 165);
        doc.text(tituloLines, 26, y);
        y += tituloLines.length * 3.5 + 2;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(...COLORES.texto);

        const textoLines = doc.splitTextToSize(cons.texto, 165);
        doc.text(textoLines, 26, y);
        y += textoLines.length * 3.5 + 6;
      });
    }

    // ========== RESUMEN DE RESULTADOS ==========
    function generarResumen() {
      nuevaPagina();
      agregarEncabezado();

      let y = 35;
      dibujarTitulo('Resumen de Resultados', y);

      y += 12;
      dibujarCuadro(15, y, 180, 25, COLORES.primario, 0.05);

      y += 8;
      const textoIntro = 'Este resumen presenta una visión general de tu perfil conductual basado en el Test DISC. Los resultados reflejan tus tendencias naturales hacia las cuatro dimensiones fundamentales del comportamiento profesional, obtenidas a través del análisis de tus respuestas a 28 grupos de características conductuales.';
      y = dibujarTexto(textoIntro, 20, y, 170, 9);

      y += 12;
      dibujarSubtitulo('Resultados Cuantitativos', y);

      // Tarjetas de puntajes
      y += 10;
      const scores = [
        { label: 'MÁS D/I', sublabel: 'Ritmo activo', val: resultado.masDI, pct: resultado.pctMasDI, color: COLORES.D, nivel: resultado.nivelMasDI },
        { label: 'MÁS S/C', sublabel: 'Ritmo pausado', val: resultado.masSC, pct: resultado.pctMasSC, color: COLORES.S, nivel: resultado.nivelMasSC }
      ];

      scores.forEach((score, i) => {
        const x = i === 0 ? 15 : 110;

        dibujarCuadro(x, y, 85, 40, score.color, 0.1);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(...score.color);
        doc.text(score.label, x + 5, y + 7);

        doc.setFontSize(7);
        doc.setTextColor(...COLORES.textoClaro);
        doc.text(score.sublabel, x + 5, y + 11);

        doc.setFontSize(36);
        doc.setTextColor(...score.color);
        doc.text(score.val.toString(), x + 5, y + 28);

        doc.setFontSize(14);
        doc.text(`${score.pct}%`, x + 28, y + 28);

        // Barra de progreso
        doc.saveGraphicsState();
        doc.setFillColor(...score.color);
        doc.setGState(new doc.GState({ opacity: 0.3 }));
        doc.roundedRect(x + 45, y + 23, 35, 5, 1, 1, 'F');
        doc.restoreGraphicsState();

        doc.setFillColor(...score.color);
        const barWidth = (score.pct / 100) * 35;
        doc.roundedRect(x + 45, y + 23, barWidth, 5, 1, 1, 'F');

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(...COLORES.texto);
        doc.text(`Nivel: ${score.nivel}`, x + 45, y + 35);
      });

      y += 50;
      const scores2 = [
        { label: 'MENOS D/I', sublabel: 'Ritmo activo', val: resultado.menosDI, pct: resultado.pctMenosDI, color: COLORES.I, nivel: resultado.nivelMenosDI },
        { label: 'MENOS S/C', sublabel: 'Ritmo pausado', val: resultado.menosSC, pct: resultado.pctMenosSC, color: COLORES.C, nivel: resultado.nivelMenosSC }
      ];

      scores2.forEach((score, i) => {
        const x = i === 0 ? 15 : 110;

        dibujarCuadro(x, y, 85, 40, score.color, 0.1);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(...score.color);
        doc.text(score.label, x + 5, y + 7);

        doc.setFontSize(7);
        doc.setTextColor(...COLORES.textoClaro);
        doc.text(score.sublabel, x + 5, y + 11);

        doc.setFontSize(36);
        doc.setTextColor(...score.color);
        doc.text(score.val.toString(), x + 5, y + 28);

        doc.setFontSize(14);
        doc.text(`${score.pct}%`, x + 28, y + 28);

        // Barra de progreso
        doc.saveGraphicsState();
        doc.setFillColor(...score.color);
        doc.setGState(new doc.GState({ opacity: 0.3 }));
        doc.roundedRect(x + 45, y + 23, 35, 5, 1, 1, 'F');
        doc.restoreGraphicsState();

        doc.setFillColor(...score.color);
        const barWidth = (score.pct / 100) * 35;
        doc.roundedRect(x + 45, y + 23, barWidth, 5, 1, 1, 'F');

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(...COLORES.texto);
        doc.text(`Nivel: ${score.nivel}`, x + 45, y + 35);
      });

      y += 50;
      dibujarCuadro(15, y, 180, 20, COLORES.textoClaro, 0.05);

      y += 7;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(...COLORES.texto);
      doc.text('Lectura de Resultados:', 20, y);

      y += 5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      const lectura = 'En el test se presentaron 28 grupos de 4 características. Para cada grupo seleccionaste la característica que MÁS te describe y la que MENOS te describe. Los valores "MÁS" indican identificación con ese tipo de comportamiento, mientras que "MENOS" indica rechazo. Cada par (MÁS/MENOS) suma 28, el total de preguntas.';
      y = dibujarTexto(lectura, 20, y, 170, 9, COLORES.textoClaro);
    }

    // ========== GRÁFICO DE BARRAS DISC ==========
    async function generarGraficoBarras() {
      nuevaPagina();
      agregarEncabezado();

      let y = 35;
      dibujarTitulo('Gráfico de Barras DISC', y);

      y += 12;
      dibujarCuadro(15, y, 180, 25, COLORES.primario, 0.05);

      y += 8;
      const intro = 'El gráfico muestra la intensidad de cada dimensión en tu perfil natural: las veces que elegiste esa letra como MÁS, menos las veces que la elegiste como MENOS. Como el test es de elección forzada, subir en una letra implica bajar en otra: por eso las cuatro barras siempre suman alrededor de 200 y su promedio es siempre 50. Lo que se interpreta es la posición relativa de cada letra dentro del perfil (60 o más = dimensión predominante, 40 o menos = poco marcada), no el valor absoluto de la barra.';
      y = dibujarTexto(intro, 20, y, 170, 9);

      y += 15;

      // Capturar el gráfico de barras del canvas
      try {
        const canvasElement = document.querySelector('#discBarChartContainer canvas');
        if (canvasElement) {
          const imgData = canvasElement.toDataURL('image/png');
          doc.addImage(imgData, 'PNG', 15, y, 180, 100);
          y += 110;
        } else {
          // Si no hay canvas, dibujar gráfico manualmente
          const discValues = core ? core.natural.valores : calcularValoresDISC(respuestasParsed);
          dibujarGraficoBarrasManual(15, y, discValues);
          y += 110;
        }
      } catch (error) {
        console.warn('No se pudo capturar el gráfico, dibujando manualmente:', error);
        const discValues = core ? core.natural.valores : calcularValoresDISC(respuestasParsed);
        dibujarGraficoBarrasManual(15, y, discValues);
        y += 110;
      }

      // Interpretación del gráfico
      dibujarCuadro(15, y, 180, 60, COLORES.secundario, 0.05);

      y += 8;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(...COLORES.primario);
      doc.text('Cómo Interpretar el Gráfico de Barras', 20, y);

      y += 7;
      const interpretaciones = [
        'Altura de barras: Indica la intensidad de cada dimensión. Valores altos (>60) muestran características predominantes en tu perfil.',
        'Barra más alta: Representa tu dimensión conductual dominante, la que más influye en tu comportamiento habitual.',
        'Combinación de barras: El patrón completo define tu estilo único. Por ejemplo, D+I alto = Persuasor, S+C alto = Coordinador.',
        'Valores balanceados: Si todas las barras están entre 40-60, indica versatilidad y adaptabilidad conductual, sin un estilo predominante marcado.',
        'Contraste de altura: Gran diferencia entre la barra más alta y más baja indica un perfil muy definido y especializado.'
      ];

      interpretaciones.forEach(interp => {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(...COLORES.texto);
        doc.text('>', 20, y);
        const lines = doc.splitTextToSize(interp, 165);
        doc.text(lines, 25, y);
        y += lines.length * 3 + 2;
      });
    }

    // ========== GRÁFICO DE BARRAS DISC — ADAPTADO (bajo presión) ==========
    // §12.2 de PROPUESTA_CONSISTENCIA_DISC.md: dos gráficos, no uno
    // superpuesto, para no dar a entender que el Natural es "el" perfil
    // único de la persona. Solo para tests con `detalle` real — los tests
    // legacy no tienen un vector Adaptado confiable calculado de forma
    // independiente (ver AUDITORIA_DISC_COMRURAL.md), así que esta página
    // directamente no se genera para ellos.
    async function generarGraficoBarrasAdaptado() {
      if (!core) return;

      nuevaPagina();
      agregarEncabezado();

      let y = 35;
      dibujarTitulo('Gráfico de Barras DISC — Bajo Presión', y);

      y += 12;
      dibujarCuadro(15, y, 180, 25, COLORES.primario, 0.05);

      y += 8;
      const introAdaptado = 'Es el mismo cálculo que el gráfico anterior, aplicado a la Parte II del test (las preguntas respondidas pensando en un contexto de exigencia o presión). No reemplaza a tu perfil Natural: lo complementa, mostrando si tu comportamiento se sostiene o se adapta cuando cambian las circunstancias.';
      y = dibujarTexto(introAdaptado, 20, y, 170, 9);

      y += 15;
      dibujarGraficoBarrasManual(15, y, core.adaptado.valores);
    }

    function dibujarGraficoBarrasManual(x, y, discValues) {
      const barWidth = 35;
      const maxHeight = 90;
      const spacing = 10;

      const dimensiones = [
        { letra: 'D', valor: discValues.D, color: COLORES.D, nombre: 'Dominancia' },
        { letra: 'I', valor: discValues.I, color: COLORES.I, nombre: 'Influencia' },
        { letra: 'S', valor: discValues.S, color: COLORES.S, nombre: 'Estabilidad' },
        { letra: 'C', valor: discValues.C, color: COLORES.C, nombre: 'Cumplimiento' }
      ];

      // Líneas de referencia
      doc.setDrawColor(...COLORES.textoClaro);
      doc.setLineWidth(0.2);
      for (let i = 0; i <= 100; i += 20) {
        const lineY = y + maxHeight - (i / 100 * maxHeight);
        doc.line(x, lineY, x + 180, lineY);

        doc.setFontSize(7);
        doc.setTextColor(...COLORES.textoClaro);
        doc.text(i.toString(), x - 5, lineY + 2, { align: 'right' });
      }

      // Barras
      dimensiones.forEach((dim, index) => {
        const barX = x + 20 + (index * (barWidth + spacing));
        const barHeight = (dim.valor / 100) * maxHeight;
        const barY = y + maxHeight - barHeight;

        // Barra con degradado simulado
        doc.setFillColor(...dim.color);
        doc.saveGraphicsState();
        doc.setGState(new doc.GState({ opacity: 0.8 }));
        doc.roundedRect(barX, barY, barWidth, barHeight, 2, 2, 'F');
        doc.restoreGraphicsState();

        // Borde
        doc.setDrawColor(...dim.color);
        doc.setLineWidth(0.5);
        doc.roundedRect(barX, barY, barWidth, barHeight, 2, 2, 'S');

        // Valor encima de la barra
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(...dim.color);
        doc.text(dim.valor.toString(), barX + barWidth / 2, barY - 3, { align: 'center' });

        // Letra debajo
        doc.setFontSize(18);
        doc.text(dim.letra, barX + barWidth / 2, y + maxHeight + 8, { align: 'center' });

        // Nombre
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(...COLORES.texto);
        doc.text(dim.nombre, barX + barWidth / 2, y + maxHeight + 14, { align: 'center' });
      });
    }


function svgElementToPngDataUrl(svgElement, width = 900, height = 900) {
  return new Promise((resolve, reject) => {
    try {
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svgElement);
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      const img = new Image();
      img.onload = function () {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          const imgData = canvas.toDataURL('image/png');
          URL.revokeObjectURL(url);
          resolve(imgData);
        } catch (err) {
          URL.revokeObjectURL(url);
          reject(err);
        }
      };

      img.onerror = function (err) {
        URL.revokeObjectURL(url);
        reject(err);
      };

      img.src = url;
    } catch (err) {
      reject(err);
    }
  });
}

    // ========== RUEDA SUCCESS INSIGHTS ==========
async function generarRueda() {
  nuevaPagina();
  agregarEncabezado();

  let y = 35;
  dibujarTitulo('Rueda Success Insights', y);

  y += 12;
  dibujarCuadro(15, y, 180, 30, COLORES.primario, 0.05);

  y += 8;

  // IMPORTANTE: sin símbolos Unicode problemáticos como ○ o ★
  const intro =
    'La Rueda Success Insights es un mapa polar de 60 posiciones conductuales organizadas en 5 niveles de intensidad. ' +
    'Cada sector representa uno de los 8 estilos conductuales DISC. ' +
    'Tu perfil se muestra en dos marcadores: Natural (circulo) que representa tu estilo innato, ' +
    'y Adaptado (estrella) que muestra tu estilo en el entorno laboral.';

  y = dibujarTexto(intro, 20, y, 170, 9);

  y += 20;

  try {
    const svgElement = document.querySelector('#ruedaSVG');

    if (svgElement) {
      const imgData = await svgElementToPngDataUrl(svgElement, 900, 900);
      doc.addImage(imgData, 'PNG', 30, y, 150, 150);
      y += 160;
    } else {
      dibujarCuadro(30, y, 150, 150, COLORES.textoClaro, 0.1);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(...COLORES.textoClaro);
      doc.text('Rueda DISC no disponible para exportacion', 105, y + 75, { align: 'center' });
      y += 160;
    }
  } catch (error) {
    console.warn('No se pudo capturar la rueda:', error);
    dibujarCuadro(30, y, 150, 150, COLORES.textoClaro, 0.1);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...COLORES.textoClaro);
    doc.text('No se pudo exportar la rueda DISC', 105, y + 75, { align: 'center' });
    y += 160;
  }

  y += 5;

  dibujarCuadro(15, y, 85, 25, COLORES.C, 0.08);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...COLORES.C);
  doc.text('O', 20, y + 10);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Perfil Natural', 28, y + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...COLORES.texto);
  doc.text('Estilo conductual innato', 28, y + 14);

  dibujarCuadro(110, y, 85, 25, COLORES.acento, 0.08);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...COLORES.acento);
  doc.text('*', 115, y + 10);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Perfil Adaptado', 123, y + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...COLORES.texto);
  doc.text('Estilo en entorno laboral', 123, y + 14);
}

    // ========== ANÁLISIS INTERPRETATIVO ==========
    function generarAnalisisCompleto() {
      nuevaPagina();
      agregarEncabezado();

      let y = 35;
      dibujarTitulo('Análisis Interpretativo Completo', y);

      y += 12;
      dibujarCuadro(15, y, 180, 20, COLORES.acento, 0.1);

      y += 7;
      const intro = 'Esta sección traduce tus puntuaciones DISC en conclusiones concretas sobre tu estilo conductual. No solo muestra los números, sino que explica qué significan para ti en términos de comportamiento, preferencias y tendencias naturales en diferentes contextos.';
      y = dibujarTexto(intro, 20, y, 170, 9);

      y += 10;
      dibujarSubtitulo('Tu Perfil Conductual Dominante', y);

      // Determinar perfil dominante
      let perfil, color, descripcionPerfil, caracteristicasClave, fortalezasPerfil, areasAtencion;

      // Con letra real por pregunta: el perfil se arma con los DOS ejes leídos por
      // separado (ritmo = D+I vs S+C; foco = D+C vs I+S) más la letra dominante.
      // Sin ella solo se puede describir el ritmo: el foco requiere distinguir
      // I de S y D de C, que es justo el dato que los tests viejos no guardaron.
      const tp = (core && window.DISCTextos) ? window.DISCTextos.perfil(core.natural) : null;

      if (tp) {
        const COL_LETRA = { D: COLORES.D, I: COLORES.I, S: COLORES.S, C: COLORES.C };
        perfil = `Perfil ${tp.letra.letra} - ${tp.letra.nombre}`;
        color = COL_LETRA[tp.letra.letra];
        descripcionPerfil = `${tp.letra.ubicacion}. ${tp.letra.resumen} Ritmo: ${tp.valores.activo}% activo / ${tp.valores.pausado}% pausado. Foco: ${tp.valores.tareas}% tareas / ${tp.valores.personas}% personas. Son dos ejes independientes: la velocidad con la que actúas no determina si miras primero la tarea o a las personas.`;
        caracteristicasClave = [
          `${tp.ritmo.titulo}: ${tp.ritmo.resumen}`,
        ].concat(tp.ritmo.bullets.slice(0, 2), [
          `${tp.foco.titulo}: ${tp.foco.resumen}`,
        ], tp.foco.bullets.slice(0, 2));
        fortalezasPerfil = tp.letra.fortalezas.slice(0, 4);
        areasAtencion = tp.letra.atencion.slice(0, 4);

      } else if (resultado.pctMasDI >= 60) {
        perfil = 'Ritmo Activo (D-I)';
        color = COLORES.D;
        descripcionPerfil = `Tu perfil muestra un ritmo predominantemente activo. Con un ${resultado.pctMasDI}% de selecciones en características de ritmo acelerado, tiendes a actuar con rapidez, preferir entornos dinámicos y tolerar bien la presión de tiempo. Este eje mide unicamente velocidad: no indica si tu foco esta en las tareas o en las personas, que es un eje distinto e independiente.`;

        caracteristicasClave = [
          'Actúas con rapidez y sentido de urgencia',
          'Tomas decisiones ágiles, priorizando la acción',
          'Te impacientas cuando algo avanza más lento de lo necesario',
          'Disfrutas de entornos dinámicos con variedad',
          'Toleras bien los plazos exigentes',
          'Prefieres el cambio sobre la rutina'
        ];

        fortalezasPerfil = [
          'Inicias proyectos con energía y determinación',
          'Destrabas situaciones que quedan estancadas',
          'Te adaptas rápidamente a nuevas situaciones',
          'Sostienes el rendimiento bajo presión de tiempo'
        ];

        areasAtencion = [
          'Puedes impacientarte con procesos lentos',
          'Riesgo de tomar decisiones sin analizar todos los detalles',
          'Tendencia a sobrecargar tu agenda',
          'Necesidad de recordar la importancia de la planificación'
        ];

      } else if (resultado.pctMasSC >= 60) {
        perfil = 'Ritmo Pausado (S-C)';
        color = COLORES.S;
        descripcionPerfil = `Tu perfil muestra un ritmo predominantemente pausado. Con un ${resultado.pctMasSC}% de selecciones en características de ritmo tranquilo, tiendes a actuar con reflexión, preferir ambientes estables y priorizar hacerlo bien por sobre hacerlo rápido. Este eje mide unicamente velocidad: no indica si tu foco esta en las tareas o en las personas, que es un eje distinto e independiente.`;

        caracteristicasClave = [
          'Actúas con reflexión y análisis previo',
          'Tomas decisiones tras considerar toda la información',
          'Prefieres ambientes estables y predecibles',
          'Priorizas hacerlo bien por sobre hacerlo rápido',
          'Necesitas tiempo para procesar antes de comprometerte',
          'Sostienes el esfuerzo en procesos largos'
        ];

        fortalezasPerfil = [
          'Aseguras cuidado y consistencia en las entregas',
          'Mantienes el rendimiento estable en el tiempo',
          'Generas confianza por tu previsibilidad',
          'Sostienes procesos que requieren constancia'
        ];

        areasAtencion = [
          'Puedes resistirte a cambios necesarios',
          'Riesgo de demorar decisiones buscando más certeza',
          'Los cambios sin aviso te generan tensión',
          'Necesidad de salir de la zona de confort ocasionalmente'
        ];

      } else {
        perfil = 'Ritmo Flexible';
        color = COLORES.primario;
        descripcionPerfil = `Tu perfil muestra un ritmo flexible, sin preferencia marcada por lo acelerado ni por lo pausado (MÁS D/I: ${resultado.pctMasDI}%, MÁS S/C: ${resultado.pctMasSC}%). Puedes acelerar cuando hay urgencia y bajar el ritmo cuando conviene. Este eje mide unicamente velocidad: no indica si tu foco esta en las tareas o en las personas, que es un eje distinto e independiente.`;

        caracteristicasClave = [
          'Capacidad de cambiar de velocidad según el contexto',
          'Puedes sostener tanto picos de urgencia como procesos largos',
          'No tienes preferencias extremas de ritmo',
          'Equilibrio entre acción y reflexión',
          'Te adaptas a equipos que trabajan a distinta velocidad'
        ];

        fortalezasPerfil = [
          'Te adaptas a diversos ritmos de trabajo',
          'Puedes desempeñarte en contextos variados',
          'Comprendes tanto la urgencia como la necesidad de tiempo',
          'Medias entre quienes van rápido y quienes van lento'
        ];

        areasAtencion = [
          'Necesidad de definir tu zona de máximo rendimiento',
          'Riesgo de dispersión intentando ser bueno en todo',
          'Importante encontrar el contexto que potencia tus fortalezas',
          'Evitar el rol de "comodín" permanente'
        ];
      }

      y += 8;
      dibujarCuadro(15, y, 180, 45, color, 0.1);

      y += 7;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(...color);
      doc.text(perfil, 20, y);

      y += 7;
      y = dibujarTexto(descripcionPerfil, 20, y, 170, 9);

      y += 3;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...color);
      doc.text('Características clave:', 20, y);

      y += 4;
      caracteristicasClave.forEach(car => {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(...COLORES.texto);
        doc.text('•', 22, y);
        const lines = doc.splitTextToSize(car, 165);
        doc.text(lines, 26, y);
        y += lines.length * 3;
      });

      y += 5;

      // Fortalezas y Áreas de Atención
      dibujarCuadro(15, y, 85, 40, COLORES.S, 0.08);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(...COLORES.S);
      doc.text('Fortalezas', 20, y + 6);


      let yTemp = y + 12;
      fortalezasPerfil.forEach(fort => {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(...COLORES.texto);
        doc.text('✓', 20, yTemp);
        const lines = doc.splitTextToSize(fort, 75);
        doc.text(lines, 24, yTemp);
        yTemp += lines.length * 3 + 1;
      });

      dibujarCuadro(110, y, 85, 40, COLORES.I, 0.08);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(...COLORES.I);
      doc.text('Áreas de Atención', 115, y + 6);


      yTemp = y + 12;
      areasAtencion.forEach(area => {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(...COLORES.texto);
        doc.text('!', 115, yTemp);
        const lines = doc.splitTextToSize(area, 75);
        doc.text(lines, 119, yTemp);
        yTemp += lines.length * 3 + 1;
      });

      y += 50;

      // Tabla de puntuaciones
      dibujarSubtitulo('Tabla de Puntuaciones Detallada', y);

      y += 8;

      const tableData = [
        ['Eje Conductual', 'MÁS', '%', 'Nivel', 'MENOS', '%', 'Nivel', 'Neto'],
        [
          'D/I (Ritmo activo)',
          resultado.masDI.toString(),
          `${resultado.pctMasDI}%`,
          resultado.nivelMasDI,
          resultado.menosDI.toString(),
          `${resultado.pctMenosDI}%`,
          resultado.nivelMenosDI,
          `${resultado.netoDI > 0 ? '+' : ''}${resultado.netoDI}`
        ],
        [
          'S/C (Ritmo pausado)',
          resultado.masSC.toString(),
          `${resultado.pctMasSC}%`,
          resultado.nivelMasSC,
          resultado.menosSC.toString(),
          `${resultado.pctMenosSC}%`,
          resultado.nivelMenosSC,
          `${resultado.netoSC > 0 ? '+' : ''}${resultado.netoSC}`
        ]
      ];

      const colWidths = [45, 15, 15, 20, 15, 15, 20, 15];
      const rowHeight = 9;

      tableData.forEach((row, rowIndex) => {
        let x = 15;

        row.forEach((cell, colIndex) => {
          if (rowIndex === 0) {
            // Header
            doc.setFillColor(...COLORES.primario);
            doc.rect(x, y, colWidths[colIndex], rowHeight, 'F');

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(7);
            doc.setTextColor(255, 255, 255);
            doc.text(cell, x + colWidths[colIndex] / 2, y + 6, { align: 'center' });
          } else {
            // Body
            if (rowIndex % 2 === 0) {
              doc.setFillColor(249, 250, 251);
              doc.rect(x, y, colWidths[colIndex], rowHeight, 'F');
            }

            doc.setFont(colIndex === 0 ? 'helvetica' : 'helvetica', colIndex === 0 ? 'bold' : 'normal');
            doc.setFontSize(colIndex === 0 ? 8 : 9);
            doc.setTextColor(...COLORES.texto);

            if (colIndex === 0) {
              doc.text(cell, x + 2, y + 6);
            } else {
              doc.text(cell, x + colWidths[colIndex] / 2, y + 6, { align: 'center' });
            }
          }

          x += colWidths[colIndex];
        });

        y += rowHeight;
      });
    }

    // ========== CONSISTENCIA DEL PERFIL ==========
    function generarConsistencia() {
      nuevaPagina();
      agregarEncabezado();

      let y = 35;
      dibujarSubtitulo('Consistencia del Perfil', y);

      y += 8;
      const consistencia = resultado.tipoConsistencia;
      let tituloConsistencia, textoConsistencia, colorConsistencia, implicaciones;

      if (consistencia === 'consistente_DI') {
        tituloConsistencia = 'Perfil Altamente Consistente: Ritmo Activo (D-I)';
        textoConsistencia = 'Existe alta consistencia en tu perfil conductual. Las características que identificas como MÁS representativas (ritmo activo, D-I) son complementarias con las que rechazas como MENOS representativas (ritmo pausado, S-C). Esto indica un autoconocimiento claro y una preferencia de ritmo bien definida hacia la acción y la velocidad de respuesta.';
        colorConsistencia = COLORES.S;

        implicaciones = [
          'Tu comportamiento es predecible y coherente en diferentes situaciones',
          'Las personas pueden anticipar tus reacciones y estilo de trabajo',
          'Tienes claridad sobre tus fortalezas y preferencias naturales',
          'Es importante asegurar que tu entorno laboral aproveche estas fortalezas',
          'Considera desarrollar flexibilidad para contextos que requieren estilo S-C'
        ];

      } else if (consistencia === 'consistente_SC') {
        tituloConsistencia = 'Perfil Altamente Consistente: Orientación Reservada (S-C)';
        textoConsistencia = 'Existe alta consistencia en tu perfil. Las características que identificas como MÁS representativas (ritmo pausado, S-C) son complementarias con las que rechazas como MENOS (ritmo activo, D-I). Esto indica autoconocimiento claro y una preferencia de ritmo bien definida hacia la reflexión y los tiempos largos.';
        colorConsistencia = COLORES.S;

        implicaciones = [
          'Tu comportamiento es estable y confiable en el tiempo',
          'Las personas valoran tu consistencia y capacidad analítica',
          'Tienes claridad sobre tu preferencia por calidad y estabilidad',
          'Busca entornos que valoren la precisión y el trabajo metódico',
          'Considera desarrollar tolerancia para situaciones de cambio rápido'
        ];

      } else if (consistencia === 'mixto') {
        tituloConsistencia = 'Perfil Mixto: Alta Adaptabilidad Conductual';
        textoConsistencia = 'Tu perfil muestra un patrón mixto sin orientación predominante marcada. Seleccionas tanto características activas (D-I) como reservadas (S-C) como representativas. Esto puede indicar versatilidad genuina, adaptabilidad conductual o un momento de transición personal/profesional.';
        colorConsistencia = COLORES.primario;

        implicaciones = [
          'Posees flexibilidad para adaptarte a diversos contextos y roles',
          'Puedes trabajar efectivamente tanto con ritmo acelerado como pausado',
          'Tu versatilidad es un activo valioso en entornos cambiantes',
          'Importante identificar en qué contextos rindes al máximo',
          'Evita dispersarte: define tu zona de excelencia preferida'
        ];

      } else {
        tituloConsistencia = 'Perfil a Analizar: Patrón de Inconsistencia';
        textoConsistencia = 'Tu perfil muestra un patrón que requiere análisis adicional. Puede ocurrir cuando hay disonancia entre lo que deseas ser y lo que crees ser, cuando factores situacionales distorsionan la autopercepción, o durante períodos de cambio significativo.';
        colorConsistencia = COLORES.I;

        implicaciones = [
          'Se recomienda una entrevista complementaria con un consultor DISC',
          'Reflexiona sobre posibles factores que influyen en tus respuestas',
          'Considera si estás en un período de transición personal/profesional',
          'Evalúa si hay presión externa para comportarte de cierta manera',
          'Útil re-evaluar en 3-6 meses para identificar patrones más estables'
        ];
      }

      dibujarCuadro(15, y, 180, 70, colorConsistencia, 0.1);

      y += 7;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(...colorConsistencia);
      doc.text(tituloConsistencia, 20, y);

      y += 7;
      y = dibujarTexto(textoConsistencia, 20, y, 170, 9);

      y += 5;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...colorConsistencia);
      doc.text('Valores Neto:', 20, y);

      y += 4;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...COLORES.texto);
      doc.text(`• Neto D/I (Activo): ${resultado.netoDI > 0 ? '+' : ''}${resultado.netoDI} — ${Math.abs(resultado.netoDI) > 10 ? 'Orientación marcada' : 'Orientación moderada'}`, 22, y);

      y += 4;
      doc.text(`• Neto S/C (Reservado): ${resultado.netoSC > 0 ? '+' : ''}${resultado.netoSC} — ${Math.abs(resultado.netoSC) > 10 ? 'Orientación marcada' : 'Orientación moderada'}`, 22, y);

      y += 8;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...colorConsistencia);
      doc.text('Implicaciones Prácticas:', 20, y);

      y += 5;
      implicaciones.forEach(impl => {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(...COLORES.texto);
        doc.text('>', 20, y);
        const lines = doc.splitTextToSize(impl, 165);
        doc.text(lines, 25, y);
        y += lines.length * 3 + 1.5;
      });
    }

    // ========== COMPARATIVA PARTE I VS PARTE II ==========
    function generarComparativaPartes() {
      nuevaPagina();
      agregarEncabezado();

      let y = 35;
      dibujarTitulo('Estabilidad del Perfil: Parte I vs Parte II', y);

      y += 12;
      const intro = 'La Parte I del test refleja tus fortalezas naturales (cómo prefieres comportarte). La Parte II refleja tu comportamiento bajo presión o en el entorno laboral. Comparar ambas revela si tu perfil es estable o si modificas tu conducta significativamente en situaciones exigentes.';
      y = dibujarTexto(intro, 15, y, 180, 9);

      y += 10;

      // Tabla comparativa
      const tableData = [
        ['Parte', 'MÁS D/I', 'MÁS S/C', 'MENOS D/I', 'MENOS S/C'],
        [
          'Parte I (Fortalezas)',
          resultado.masDI_P1.toString(),
          resultado.masSC_P1.toString(),
          resultado.menosDI_P1.toString(),
          resultado.menosSC_P1.toString()
        ],
        [
          'Parte II (Bajo presión)',
          resultado.masDI_P2.toString(),
          resultado.masSC_P2.toString(),
          resultado.menosDI_P2.toString(),
          resultado.menosSC_P2.toString()
        ],
        [
          'Diferencia',
          Math.abs(resultado.masDI_P1 - resultado.masDI_P2).toString(),
          Math.abs(resultado.masSC_P1 - resultado.masSC_P2).toString(),
          Math.abs(resultado.menosDI_P1 - resultado.menosDI_P2).toString(),
          Math.abs(resultado.menosSC_P1 - resultado.menosSC_P2).toString()
        ]
      ];

      const colWidths = [50, 30, 30, 30, 30];
      const rowHeight = 9;

      tableData.forEach((row, rowIndex) => {
        let x = 15;

        row.forEach((cell, colIndex) => {
          if (rowIndex === 0) {
            doc.setFillColor(...COLORES.primario);
            doc.rect(x, y, colWidths[colIndex], rowHeight, 'F');

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8);
            doc.setTextColor(255, 255, 255);
            doc.text(cell, x + colWidths[colIndex] / 2, y + 6, { align: 'center' });
          } else {
            if (rowIndex % 2 === 0) {
              doc.setFillColor(249, 250, 251);
              doc.rect(x, y, colWidths[colIndex], rowHeight, 'F');
            }

            if (rowIndex === 3) {
              // Fila de diferencias - destacar
              doc.setFillColor(...COLORES.acento);
              doc.saveGraphicsState();
              doc.setGState(new doc.GState({ opacity: 0.1 }));
              doc.rect(x, y, colWidths[colIndex], rowHeight, 'F');
              doc.restoreGraphicsState();
            }

            doc.setFont('helvetica', colIndex === 0 ? 'bold' : 'normal');
            doc.setFontSize(9);
            doc.setTextColor(...COLORES.texto);

            if (colIndex === 0) {
              doc.text(cell, x + 2, y + 6);
            } else {
              doc.text(cell, x + colWidths[colIndex] / 2, y + 6, { align: 'center' });
            }
          }

          x += colWidths[colIndex];
        });

        y += rowHeight;
      });

      y += 15;

      // Interpretación
      const diffDI = Math.abs(resultado.masDI_P1 - resultado.masDI_P2);
      const diffSC = Math.abs(resultado.masSC_P1 - resultado.masSC_P2);
      let diffTotal = diffDI + diffSC;
      let detalleDiff = `(D/I: ${diffDI}, S/C: ${diffSC})`;
      // Umbrales del algoritmo anterior (solo MÁS). Con núcleo: MÁS y MENOS en las 4 letras.
      let corteMuyEstable = 4, corteNucleo = 8;
      if (core) {
        const e = core.estabilidad;
        diffTotal = e.total;
        detalleDiff = `(D: ${e.porLetra.D}, I: ${e.porLetra.I}, S: ${e.porLetra.S}, C: ${e.porLetra.C} - incluye MAS y MENOS)`;
        corteMuyEstable = window.DISCCore.ESTABILIDAD.muyEstable;
        corteNucleo = window.DISCCore.ESTABILIDAD.nucleoEstable;
      }

      let titulo, icono, color, interpretacion;

      if (diffTotal <= corteMuyEstable) {
        titulo = 'Perfil Muy Estable';
        color = COLORES.S;
        interpretacion = `Tu comportamiento es consistente entre situaciones normales y bajo presión. Las diferencias son mínimas (${diffTotal} puntos de diferencia total). Esto indica que eres auténtico, tu comportamiento natural coincide con tu comportamiento adaptado, no modificas significativamente tu conducta bajo estrés y las personas te perciben como predecible y congruente. Tu entorno laboral actual te permite ser tú mismo, lo cual es positivo. Asegúrate de que este entorno realmente te permita desarrollar todo tu potencial.`;
      } else if (diffTotal <= corteNucleo) {
        titulo = 'Perfil Adaptable con Núcleo Estable';
        color = COLORES.primario;
        interpretacion = `Muestras cierta adaptación conductual pero mantienes tu esencia. Hay diferencias moderadas (${diffTotal} puntos). Adaptas tu comportamiento según el contexto pero sin forzarte demasiado. Bajo presión, ajustas algunas conductas pero mantienes tu identidad. Tienes flexibilidad conductual sin perder autenticidad. El esfuerzo de adaptación es manejable y sostenible. Este nivel de adaptación es saludable y muestra inteligencia emocional. Monitorea que no aumente con el tiempo.`;
      } else {
        titulo = 'Perfil con Adaptación Significativa';
        color = COLORES.D;
        interpretacion = `Modificas considerablemente tu comportamiento bajo presión. Hay diferencias notables (${diffTotal} puntos). Existe disonancia entre tu yo natural y tu yo laboral. Bajo estrés, activas conductas que no son naturales para ti. Podrías estar experimentando tensión o desgaste por mantener este ajuste. Tu entorno laboral puede estar exigiéndote ser alguien que no eres. A largo plazo, esta adaptación puede generar agotamiento. Recomendación: evalúa si tu rol actual es compatible con tus fortalezas naturales. Considera buscar entornos que te permitan ser más auténtico.`;
      }

      dibujarCuadro(15, y, 180, 60, color, 0.1);

      y += 7;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(...color);
      doc.text(titulo, 20, y);

      y += 7;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...COLORES.textoClaro);
      doc.text(`Diferencia total: ${diffTotal} puntos ${detalleDiff}`, 20, y);

      y += 6;
      y = dibujarTexto(interpretacion, 20, y, 170, 9);
    }

    // ========== IMPLICACIONES PRÁCTICAS ==========
    function generarImplicaciones() {
      nuevaPagina();
      agregarEncabezado();

      let y = 35;
      dibujarTitulo('Implicaciones Prácticas de tu Perfil', y);

      y += 12;

      // Determinar perfil para personalizar implicaciones
      let fortalezas, atencion, comunicacion, entorno;

      if (resultado.pctMasDI >= 60) {
        fortalezas = [
          'Capacidad de generar resultados rápidos y tomar decisiones ágiles sin dudar',
          'Habilidad natural para liderar equipos y motivar a otros hacia objetivos',
          'Alta adaptabilidad a cambios y entornos dinámicos e impredecibles',
          'Comunicación efectiva y capacidad de persuasión en presentaciones',
          'Energía contagiosa y proactividad en la ejecución de proyectos nuevos'
        ];

        atencion = [
          'Puedes impacientarte con procesos lentos o que requieren análisis detallado',
          'Riesgo de tomar decisiones sin considerar toda la información disponible',
          'Tendencia a sobrecargar la agenda con demasiadas actividades simultáneas',
          'Importante recordar la importancia de la planificación y el seguimiento',
          'Puedes descuidar el seguimiento detallado de tareas ya iniciadas'
        ];

        comunicacion = [
          'Sé directo y ve al punto: esta persona valora la eficiencia y claridad',
          'Enfócate en resultados concretos y beneficios tangibles del proyecto',
          'Permite que tome el liderazgo de conversaciones y proponga ideas nuevas',
          'Ofrece variedad y estímulo constante, evita la monotonía en las tareas',
          'Reconoce sus logros de forma visible y pública cuando sea apropiado'
        ];

        entorno = [
          'Entornos dinámicos con desafíos constantes y oportunidades de crecimiento',
          'Oportunidades claras de liderazgo y responsabilidad en toma de decisiones',
          'Autonomía y libertad para actuar sin microgestión excesiva',
          'Contacto frecuente con diversas personas, equipos y stakeholders',
          'Reconocimiento visible y público por resultados y logros alcanzados'
        ];

      } else if (resultado.pctMasSC >= 60) {
        fortalezas = [
          'Atención excepcional al detalle y precisión en la ejecución del trabajo',
          'Capacidad de análisis profundo y pensamiento crítico ante problemas complejos',
          'Consistencia y alta confiabilidad en el cumplimiento de compromisos',
          'Paciencia genuina para procesos largos y tareas que requieren meticulosidad',
          'Construcción de relaciones estables, sólidas y de largo plazo con colegas'
        ];

        atencion = [
          'Puedes resistirte excesivamente a cambios organizacionales necesarios',
          'Riesgo de "parálisis por análisis": dificultad para decidir con información limitada',
          'Tendencia a evitar confrontaciones incluso cuando son necesarias para avanzar',
          'Necesidad de salir periódicamente de la zona de confort para crecer',
          'Puedes perder oportunidades importantes por exceso de cautela o análisis'
        ];

        comunicacion = [
          'Proporciona información completa, detallada y fundamentada con evidencia',
          'Dale tiempo suficiente para procesar información y responder — no lo presiones',
          'Respeta su necesidad de preparación previa antes de reuniones importantes',
          'Valora explícitamente la calidad de su trabajo, no solo la velocidad de entrega',
          'Comunica cambios con anticipación suficiente y explicaciones claras del por qué'
        ];

        entorno = [
          'Ambientes estables con procesos bien definidos y documentados',
          'Tiempo suficiente para analizar información antes de tomar decisiones',
          'Estándares de calidad claramente definidos y comunicados',
          'Relaciones de trabajo armoniosas, predecibles y duraderas',
          'Reconocimiento sincero por precisión, exactitud y trabajo bien hecho'
        ];

      } else {
        fortalezas = [
          'Alta versatilidad para adaptarte efectivamente a situaciones muy diferentes',
          'Equilibrio natural entre acción rápida y reflexión analítica según necesidad',
          'Capacidad de trabajar tanto en equipo como de forma completamente independiente',
          'Flexibilidad para cambiar de ritmo de trabajo según lo requiera el contexto',
          'Comprensión profunda y apreciación de diferentes estilos de trabajo'
        ];

        atencion = [
          'Necesidad de definir claramente cuál es tu zona de máximo rendimiento',
          'Riesgo de dispersarte intentando ser bueno en absolutamente todo',
          'Posible falta de identidad profesional clara si no defines preferencias',
          'Importante encontrar el contexto específico que potencia tus fortalezas',
          'Debes evitar aceptar permanentemente el rol de "comodín" sin especialización'
        ];

        comunicacion = [
          'Adapta tu estilo de comunicación según el contexto — esta persona es flexible',
          'Ofrece tanto desafíos estimulantes como momentos de estabilidad predecible',
          'Valora explícitamente su capacidad única de adaptación a diferentes situaciones',
          'Dale oportunidades variadas de desarrollo en múltiples áreas',
          'Ayúdale a identificar progresivamente su zona personal de excelencia'
        ];

        entorno = [
          'Entornos con variedad genuina de tareas y responsabilidades diversas',
          'Oportunidades para explorar y experimentar con diferentes roles',
          'Balance saludable entre estructura organizacional y flexibilidad operativa',
          'Proyectos que combinen elementos de acción rápida con análisis profundo',
          'Equipos diversos con diferentes estilos de trabajo complementarios'
        ];
      }

      // Renderizar cada sección
      const secciones = [
{ titulo: 'Tus Fortalezas Naturales', items: fortalezas, color: COLORES.S },
{ titulo: 'Áreas que Requieren Atención', items: atencion, color: COLORES.I },
{ titulo: 'Cómo Comunicarse Contigo', items: comunicacion, color: COLORES.C },
{ titulo: 'Tu Entorno de Trabajo Ideal', items: entorno, color: COLORES.primario }
      ];

      secciones.forEach(seccion => {
        if (y > 220) {
          nuevaPagina();
          agregarEncabezado();
          y = 35;
        }

        dibujarCuadro(15, y, 180, 55, seccion.color, 0.08);

        y += 8;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(...seccion.color);
        doc.text(seccion.titulo, 20, y);

        y += 7;
        seccion.items.forEach(item => {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(...COLORES.texto);
          doc.text('•', 20, y);
          const lines = doc.splitTextToSize(item, 165);
          doc.text(lines, 25, y);
          y += lines.length * 3 + 1.5;
        });

        y += 8;
      });
    }

    // ========== DETALLE PREGUNTA POR PREGUNTA ==========
    function generarDetalle() {
      nuevaPagina();
      agregarEncabezado();

      let y = 35;
      dibujarTitulo('Detalle Pregunta por Pregunta', y);

      y += 12;
      dibujarSubtitulo('Parte I — Preguntas 1-14 (Fortalezas Naturales)', y);

      y += 8;

      const detalleP1 = resultado.detallePreguntas.filter(p => p.parte === 'I');
      y = dibujarTablaDetalle(y, detalleP1);

      // Nueva página para Parte II
      nuevaPagina();
      agregarEncabezado();

      y = 35;
      dibujarSubtitulo('Parte II — Preguntas 15-28 (Comportamiento Bajo Presión)', y);

      y += 8;

      const detalleP2 = resultado.detallePreguntas.filter(p => p.parte === 'II');
      y = dibujarTablaDetalle(y, detalleP2);

      y += 10;

      dibujarCuadro(15, y, 180, 15, COLORES.textoClaro, 0.05);

      y += 6;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...COLORES.texto);
      doc.text('Leyenda:', 20, y);

      y += 5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      const textoLeyenda = 'Cada fila muestra los 4 adjetivos del grupo. Las columnas "MÁS" y "MENOS" indican la letra exacta que se eligió como más y como menos descriptiva. D e I comparten ritmo activo; S y C, ritmo pausado.';
      dibujarTexto(textoLeyenda, 20, y, 170, 8, COLORES.textoClaro);
    }

    function dibujarTablaDetalle(yInicial, datos) {
      const colWidths = [12, 32, 32, 32, 32, 15, 15];
      const rowHeight = 7;
      let y = yInicial;

      // Header
      const headers = ['Nº', 'D', 'I', 'S', 'C', 'MÁS', 'MENOS'];

      let x = 15;
      headers.forEach((header, i) => {
        doc.setFillColor(...COLORES.primario);
        doc.rect(x, y, colWidths[i], rowHeight, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(255, 255, 255);
        doc.text(header, x + colWidths[i] / 2, y + 4.5, { align: 'center' });

        x += colWidths[i];
      });

      y += rowHeight;

      // Rows
      datos.forEach((item, index) => {
        x = 15;

        if (index % 2 === 0) {
          doc.setFillColor(249, 250, 251);
          doc.rect(15, y, 180, rowHeight, 'F');
        }

        const rowData = [
          item.numero.toString(),
          item.textoD,
          item.textoI,
          item.textoS,
          item.textoC,
          // Con letra real (tests nuevos): la letra exacta elegida; si no, solo el grupo D/I o S/C.
          item.masLetra ? item.masLetra : item.masGrupo,
          item.menosLetra ? item.menosLetra : item.menosGrupo
        ];

        rowData.forEach((cell, colIndex) => {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(6);
          doc.setTextColor(...COLORES.texto);

          if (colIndex === 0) {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(7);
          }

          if (colIndex >= 5) {
            // Badge para MÁS/MENOS (grupo D/I / S/C, o letra exacta D/I/S/C en tests nuevos)
            const esActivo = cell === 'D/I' || cell === 'D' || cell === 'I';
            const bgColor = COLORES[cell] || (esActivo ?
              (colIndex === 5 ? COLORES.D : COLORES.I) :
              (colIndex === 5 ? COLORES.S : COLORES.C));

            doc.saveGraphicsState();
            doc.setFillColor(...bgColor);
            doc.setGState(new doc.GState({ opacity: 0.2 }));
            doc.roundedRect(x + 1, y + 0.5, colWidths[colIndex] - 2, rowHeight - 1, 1, 1, 'F');
            doc.restoreGraphicsState();

            doc.setTextColor(...bgColor);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(6);
          }

          doc.text(cell, x + colWidths[colIndex] / 2, y + 4.5, { align: 'center' });

          x += colWidths[colIndex];
        });

        y += rowHeight;
      });

      return y;
    }

    // ========== GENERAR TODO EL DOCUMENTO ==========
    console.log('Generando PDF completo...');

    generarPortada();
    generarIndice();
    generarIntroduccion();
    generarHistoria();
    generarEjes();
    generarEstilos();
    generarDimensionesCompletas();
    generarAplicaciones();
    generarConsideraciones();
    generarResumen();
    await generarGraficoBarras();
    await generarGraficoBarrasAdaptado();
    await generarRueda();
    generarAnalisisCompleto();
    generarConsistencia();
    generarComparativaPartes();
    generarImplicaciones();
    generarDetalle();

    // Guardar PDF
    if (returnBase64) {
      const dataUri = doc.output('datauristring');
      return dataUri.split(',')[1];
    } else {
      console.log('Guardando PDF...');
      doc.save(`Informe_DISC_Completo_${nombreCompleto.replace(/ /g, '_')}.pdf`);
      console.log('PDF generado exitosamente');
    }

  } catch (error) {
    console.error('Error durante la generación del PDF:', error);
    alert(`Error al generar el PDF: ${error.message}`);
    throw error;
  }
}

// Función auxiliar para calcular valores DISC
function calcularValoresDISC(respuestas) {
  let D = 0, I = 0, S = 0, C = 0;

  for (let q = 1; q <= 28; q++) {
    let idMas;
    if (q <= 14) {
      idMas = (q - 1) * 2 + 1;
    } else {
      idMas = 28 + (q - 15) * 2 + 1;
    }

    const valMas = respuestas[idMas];

    if (valMas !== undefined) {
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

  const total = D + I + S + C;
  return {
    D: total > 0 ? Math.round((D / total) * 100) : 0,
    I: total > 0 ? Math.round((I / total) * 100) : 0,
    S: total > 0 ? Math.round((S / total) * 100) : 0,
    C: total > 0 ? Math.round((C / total) * 100) : 0
  };
}

// Exponer función globalmente
window.generarPDFInforme = generarPDFInforme;
// ── Versión base64 para subir al Drive desde el Test ──────────────────
async function generarPDFBase64(data, resultado, respuestasParsed) {
  return new Promise(async (resolve, reject) => {
    const jsPDF = window.jspdf?.jsPDF || window.jsPDF;
    if (!jsPDF) return reject(new Error('jsPDF no disponible'));
    const originalSave = jsPDF.prototype.save;
    jsPDF.prototype.save = function () {
      jsPDF.prototype.save = originalSave;
      try {
        const base64 = this.output('datauristring').split(',')[1];
        resolve(base64);
      } catch (e) { reject(e); }
    };
    try {
      await generarPDFInforme(data, resultado, respuestasParsed);
    } catch (e) {
      jsPDF.prototype.save = originalSave;
      reject(e);
    }
  });
}

// DESPUÉS (simple y directo):
async function generarPDFBase64(data, resultado, respuestasParsed) {
  return await generarPDFInforme(data, resultado, respuestasParsed, true);
}
// DESPUÉS — agregá calcularResultadoParaPDF antes del console.log:
window.generarPDFInforme = generarPDFInforme;
window.generarPDFBase64 = generarPDFBase64;

function calcularResultadoParaPDF(rp, detalle) {
  const DISC_QUESTIONS_LOCAL = [
    { id:1,D:"Enérgico",I:"Animado",S:"Plácido",C:"Preciso"},{id:2,D:"Competitivo",I:"Expresivo",S:"Leal",C:"Diplomático"},
    {id:3,D:"Directo",I:"Alentador",S:"Bondadoso",C:"Meticuloso"},{id:4,D:"Atrevido",I:"Encantador",S:"Amable",C:"Sistemático"},
    {id:5,D:"Decidido",I:"Optimista",S:"Sereno",C:"Perfeccionista"},{id:6,D:"Audaz",I:"Comunicativo",S:"Paciente",C:"Reflexivo"},
    {id:7,D:"Exigente",I:"Entusiasta",S:"Cooperativo",C:"Lógico"},{id:8,D:"Dominante",I:"Popular",S:"Tolerante",C:"Analítico"},
    {id:9,D:"Arriesgado",I:"Sociable",S:"Confiable",C:"Detallista"},{id:10,D:"Firme",I:"Persuasivo",S:"Moderado",C:"Cauteloso"},
    {id:11,D:"Orientado a resultados",I:"Entusiasta",S:"Colaborador",C:"Ordenado"},{id:12,D:"Emprendedor",I:"Inspirador",S:"Estable",C:"Cuidadoso"},
    {id:13,D:"Desafiante",I:"Influyente",S:"Servicial",C:"Organizado"},{id:14,D:"Impaciente",I:"Extrovertido",S:"De apoyo",C:"Metódico"},
    {id:15,D:"Independiente",I:"Amigable",S:"Moderado",C:"Convencional"},{id:16,D:"Asertivo",I:"Estimulante",S:"Comprensivo",C:"Reservado"},
    {id:17,D:"Determinado",I:"Positivo",S:"Paciente",C:"Controlado"},{id:18,D:"Agresivo",I:"Afectuoso",S:"Receptivo",C:"Perfeccionista"},
    {id:19,D:"Toma rápida de decisiones",I:"Sociable",S:"Considerado",C:"Meticuloso"},{id:20,D:"Líder nato",I:"Promotor",S:"Consistente",C:"Formal"},
    {id:21,D:"Pragmático",I:"Emocional",S:"Conciliador",C:"Normativo"},{id:22,D:"Obstinado",I:"Confiado",S:"Tolerante",C:"Evasivo"},
    {id:23,D:"Inflexible",I:"Egocéntrico",S:"Indeciso",C:"Terco"},{id:24,D:"Argumentador",I:"Descuidado",S:"Dubitativo",C:"Quisquilloso"},
    {id:25,D:"Impulsivo",I:"Imprudente",S:"Tímido",C:"Crítico"},{id:26,D:"Intolerante",I:"Poco organizado",S:"Pasivo",C:"Pesimista"},
    {id:27,D:"Insensible",I:"Hablador",S:"Sin ambición",C:"Distante"},{id:28,D:"Dominante",I:"Desordenado",S:"Dependiente",C:"Desconfiado"}
  ];
  let masDI=0,masSC=0,menosDI=0,menosSC=0;
  let masDI_P1=0,masSC_P1=0,menosDI_P1=0,menosSC_P1=0;
  let masDI_P2=0,masSC_P2=0,menosDI_P2=0,menosSC_P2=0;
  const det=[];
  for(let q=1;q<=28;q++){
    let idM,idL;
    if(q<=14){idM=(q-1)*2+1;idL=(q-1)*2+2;}
    else{idM=28+(q-15)*2+1;idL=28+(q-15)*2+2;}
    const vM=rp[idM],vL=rp[idL];
    if(vM!==undefined&&vL!==undefined){
      if(vM===5)masDI++;else masSC++;
      if(vL===5)menosDI++;else menosSC++;
      if(q<=14){if(vM===5)masDI_P1++;else masSC_P1++;if(vL===5)menosDI_P1++;else menosSC_P1++;}
      else{if(vM===5)masDI_P2++;else masSC_P2++;if(vL===5)menosDI_P2++;else menosSC_P2++;}
      const g=DISC_QUESTIONS_LOCAL[q-1];
      det.push({numero:q,parte:q<=14?"I":"II",textoD:g.D,textoI:g.I,textoS:g.S,textoC:g.C,valorMas:vM,valorMenos:vL,masGrupo:vM===5?"D/I":"S/C",menosGrupo:vL===5?"D/I":"S/C"});
    }
  }
  const pm=Math.round((masDI/28)*100),ps=Math.round((masSC/28)*100),pmd=Math.round((menosDI/28)*100),pms=Math.round((menosSC/28)*100);
  const nv=p=>{if(p>=75)return"Muy Alto";if(p>=55)return"Alto";if(p>=35)return"Moderado";if(p>=15)return"Bajo";return"Muy Bajo";};
  let tc='mixto';
  if(masDI>=18&&menosSC>=18)tc='consistente_DI';
  else if(masSC>=18&&menosDI>=18)tc='consistente_SC';
  else if(masDI>masSC&&menosSC>menosDI)tc='consistente_DI';
  else if(masSC>masDI&&menosDI>menosSC)tc='consistente_SC';
  else if((masDI>masSC&&menosDI>menosSC)||(masSC>masDI&&menosSC>menosDI))tc='contradictorio';
  // Con letra real por pregunta (tests nuevos): el detalle muestra la letra exacta elegida.
  const detFinal = (typeof window !== 'undefined' && window.DISCCore && window.DISCCore.tieneDetalle(detalle))
    ? window.DISCCore.detallePreguntas(detalle, DISC_QUESTIONS_LOCAL)
    : det;
  return{masDI,masSC,menosDI,menosSC,netoDI:masDI-menosDI,netoSC:masSC-menosSC,pctMasDI:pm,pctMasSC:ps,pctMenosDI:pmd,pctMenosSC:pms,nivelMasDI:nv(pm),nivelMasSC:nv(ps),nivelMenosDI:nv(pmd),nivelMenosSC:nv(pms),masDI_P1,masSC_P1,menosDI_P1,menosSC_P1,masDI_P2,masSC_P2,menosDI_P2,menosSC_P2,tipoConsistencia:tc,detallePreguntas:detFinal,preguntasRespondidas:det.length};
}
window.calcularResultadoParaPDF = calcularResultadoParaPDF;

console.log('pdfGenerator.js cargado correctamente');