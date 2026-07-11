/**
 * discToWheel.js - Convierte puntuaciones DISC a coordenadas de rueda
 */

function calcularVectorDISC(respuestas, inicio, fin) {
  let D = 0, I = 0, S = 0, C = 0;
  
  // Mapeo simple: cada grupo tiene D, I, S, C en posiciones fijas
  const DISC_MAP = {
    0: 'D', 1: 'I', 2: 'S', 3: 'C'
  };

  for (let q = inicio; q <= fin; q++) {
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
      // Determinar dimensión basado en el valor
      // Cada pregunta tiene 4 opciones: 0=D, 1=I, 2=S, 3=C
      // El test almacena 5 para D/I y 1 para S/C
      
      // Para MÁS
      let dimIndexMas;
      if (valMas === 5) {
        // D o I (alternamos según pregunta)
        dimIndexMas = (q - 1) % 2; // 0=D, 1=I
      } else {
        // S o C
        dimIndexMas = 2 + ((q - 1) % 2); // 2=S, 3=C
      }
      
      // Para MENOS
      let dimIndexMenos;
      if (valMenos === 5) {
        dimIndexMenos = (q - 1) % 2;
      } else {
        dimIndexMenos = 2 + ((q - 1) % 2);
      }

      const dimMas = DISC_MAP[dimIndexMas];
      const dimMenos = DISC_MAP[dimIndexMenos];

      // Incrementar MÁS, decrementar MENOS
      if (dimMas === 'D') D++;
      else if (dimMas === 'I') I++;
      else if (dimMas === 'S') S++;
      else if (dimMas === 'C') C++;

      if (dimMenos === 'D') D--;
      else if (dimMenos === 'I') I--;
      else if (dimMenos === 'S') S--;
      else if (dimMenos === 'C') C--;
    }
  }

  return { D, I, S, C };
}

function normalizarVector(vector) {
  const minVal = Math.min(vector.D, vector.I, vector.S, vector.C);
  return {
    D: vector.D - minVal,
    I: vector.I - minVal,
    S: vector.S - minVal,
    C: vector.C - minVal
  };
}

function vectorToPolares(vector) {
  const { D, I, S, C } = vector;
  
  // Sectores: D=0-90°, I=90-180°, S=180-270°, C=270-360°
  const sectores = { D: 45, I: 135, S: 225, C: 315 };

  const sumaPesos = D + I + S + C;
  if (sumaPesos === 0) return { angle: 0, radius: 0, cell: 30 };

  const angle = ((D * sectores.D + I * sectores.I + S * sectores.S + C * sectores.C) / sumaPesos) % 360;

  const magnitud = Math.sqrt(D*D + I*I + S*S + C*C);
  const magnitudMax = Math.sqrt(4 * 14 * 14);
  const radius = Math.min(magnitud / magnitudMax, 1);

  const cell = radiusToCell(radius, angle);

  return { angle, radius, cell };
}

function radiusToCell(radius, angle) {
  let nivel, celdas, baseCell;
  
  if (radius < 0.20) { nivel = 1; celdas = 4; baseCell = 57; }
  else if (radius < 0.40) { nivel = 2; celdas = 16; baseCell = 41; }
  else if (radius < 0.60) { nivel = 3; celdas = 16; baseCell = 25; }
  else if (radius < 0.80) { nivel = 4; celdas = 16; baseCell = 9; }
  else { nivel = 5; celdas = 8; baseCell = 1; }

  const anglePerCell = 360 / celdas;
  const cellIndex = Math.floor(angle / anglePerCell) % celdas;

  return baseCell + cellIndex;
}

function discToWheel(respuestas) {
  const vectorNatural = calcularVectorDISC(respuestas, 1, 14);
  const vectorNaturalNorm = normalizarVector(vectorNatural);
  const coordNatural = vectorToPolares(vectorNaturalNorm);

  const vectorAdaptado = calcularVectorDISC(respuestas, 15, 28);
  const vectorAdaptadoNorm = normalizarVector(vectorAdaptado);
  const coordAdaptado = vectorToPolares(vectorAdaptadoNorm);

  return {
    natural: coordNatural,
    adaptado: coordAdaptado
  };
}

// Exportar para uso en el script principal
if (typeof window !== 'undefined') {
  window.discToWheel = discToWheel;
}