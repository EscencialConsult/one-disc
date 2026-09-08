/**
 * Generador ONE-OFF de scripts/fixtures/perfiles_referencia.json.
 * No es parte del pipeline de tests — se corre a mano cuando hace falta
 * agregar o ajustar un fixture, y el JSON resultante es lo que se audita.
 *
 * Construye, para cada parte (14 preguntas), una asignación mas/menos por
 * pregunta que respeta los totales por letra pedidos (sum mas = sum menos =
 * 14) sin que ninguna pregunta tenga la misma letra en MÁS y en MENOS.
 */
const LETRAS = ['D', 'I', 'S', 'C'];

function expandir(counts) {
  const out = [];
  LETRAS.forEach((L) => { for (let i = 0; i < counts[L]; i++) out.push(L); });
  return out;
}

function asignarParte(masCounts, menosCounts) {
  const suma = (o) => LETRAS.reduce((a, L) => a + o[L], 0);
  if (suma(masCounts) !== 14 || suma(menosCounts) !== 14) {
    throw new Error(`Los totales deben sumar 14: MAS=${suma(masCounts)} MENOS=${suma(menosCounts)}`);
  }
  const masList = expandir(masCounts);
  let intento = 0;
  while (intento++ < 20000) {
    const menosList = expandir(menosCounts).sort(() => Math.random() - 0.5);
    if (masList.every((m, i) => m !== menosList[i])) return { masList, menosList };
  }
  throw new Error('No se encontró asignación sin conflictos — revisar los totales pedidos.');
}

function detalleDeCaso(masNatural, menosNatural, masAdaptado, menosAdaptado) {
  const p1 = asignarParte(masNatural, menosNatural);
  const p2 = asignarParte(masAdaptado, menosAdaptado);
  const detalle = {};
  for (let q = 1; q <= 14; q++) detalle[q] = { mas: p1.masList[q - 1], menos: p1.menosList[q - 1] };
  for (let q = 15; q <= 28; q++) detalle[q] = { mas: p2.masList[q - 15], menos: p2.menosList[q - 15] };
  return detalle;
}

// Cada caso repite la misma distribución en Natural y Adaptado salvo que se
// diga lo contrario (perfil "estable" por defecto — el documento original no
// especifica Parte II para los casos A-D, así que se asume estabilidad).
const casos = {
  caso_A: {
    doc: 'Documento original, Caso A (D=43,I=32,S=7,C=18), reconstruido para la escala nueva.',
    esperado: { principal: 'D', secundaria: 'I', nivel_definicion: 'moderado', ritmoActivoMin: 60, focoTareasMin: 55 },
    mas: { D: 7, I: 4, C: 2, S: 1 }, menos: { D: 1, I: 2, C: 2, S: 9 },
  },
  caso_B: {
    doc: 'Documento original, Caso B (D=25,I=29,S=25,C=21): balanceado, leve inclinación I.',
    esperado: { principal: 'I', nivel_definicion: 'leve', gapMax: 2 },
    mas: { D: 4, I: 5, S: 3, C: 2 }, menos: { D: 3, I: 2, S: 3, C: 6 },
  },
  caso_C: {
    doc: 'Documento original, Caso C (D=18,I=7,S=32,C=43): C predominante, ritmo pausado, foco tareas.',
    esperado: { principal: 'C', secundaria: 'S', nivel_definicion: 'moderado', ritmoActivoMax: 40, focoTareasMin: 55 },
    mas: { C: 7, S: 4, D: 2, I: 1 }, menos: { C: 0, S: 1, D: 3, I: 10 },
  },
  caso_D: {
    doc: 'Documento original, Caso D (D=39,I=29,S=11,C=21): D/I con predominio D, ritmo activo, foco tareas.',
    esperado: { principal: 'D', secundaria: 'I', nivel_definicion: 'moderado', ritmoActivoMin: 55, focoTareasMin: 55 },
    mas: { D: 6, I: 3, C: 2, S: 3 }, menos: { D: 1, I: 2, C: 4, S: 7 },
  },
  perfil_plano: {
    doc: 'Las cuatro letras parejas (neto 0 en las 4) — caso extremo de "sin letra dominante".',
    esperado: { nivel_definicion: 'mixto', gapMax: 0 },
    mas: { D: 4, I: 3, S: 4, C: 3 }, menos: { D: 4, I: 3, S: 4, C: 3 },
  },
  empate_exacto: {
    doc: 'D e I empatados exactamente en el neto (ambos +4), S y C por debajo — desempate real.',
    esperado: { nivel_definicion: 'mixto', gapMax: 0, principalEn: ['D', 'I'] },
    mas: { D: 5, I: 5, S: 2, C: 2 }, menos: { D: 1, I: 1, S: 5, C: 7 },
  },
  adaptacion_D_a_S: {
    doc: 'Natural D fuerte, Adaptado S fuerte — el caso que hacía divergir Panel RRHH e informe antes del arreglo (§2 de PROPUESTA_CONSISTENCIA_DISC.md).',
    esperado: { principalNatural: 'D', principalAdaptado: 'S' },
    mas: { D: 9, I: 3, S: 1, C: 1 }, menos: { D: 1, I: 1, S: 7, C: 5 },
    masAdaptado: { S: 9, C: 3, D: 1, I: 1 }, menosAdaptado: { S: 1, C: 1, D: 7, I: 5 },
  },
  adaptacion_C_a_I: {
    doc: 'Natural C fuerte, Adaptado I fuerte — mismo fenómeno con el otro par diagonal.',
    esperado: { principalNatural: 'C', principalAdaptado: 'I' },
    mas: { C: 9, D: 3, I: 1, S: 1 }, menos: { C: 1, D: 1, I: 7, S: 5 },
    masAdaptado: { I: 9, S: 3, C: 1, D: 1 }, menosAdaptado: { I: 1, D: 1, C: 7, S: 5 },
  },
};

const salida = {};
for (const [nombre, c] of Object.entries(casos)) {
  const masAdaptado = c.masAdaptado || c.mas;
  const menosAdaptado = c.menosAdaptado || c.menos;
  salida[nombre] = {
    doc: c.doc,
    esperado: c.esperado,
    detalle: detalleDeCaso(c.mas, c.menos, masAdaptado, menosAdaptado),
  };
}

// Caso adicional sin `detalle` (test legacy, §7): valida que el sistema no
// invente una letra donde no hay dato — no tiene preguntas, solo documenta
// el comportamiento esperado de discCore ante la ausencia del dato nuevo.
salida.legacy_sin_detalle = {
  doc: 'Test tomado antes del arreglo del cálculo: no guardó la letra exacta por pregunta.',
  esperado: { tieneDetalle: false, calcularEsNull: true },
  detalle: null,
};

console.log(JSON.stringify(salida, null, 2));
