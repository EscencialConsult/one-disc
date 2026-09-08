# Auditoría del cálculo DISC — caso COMRURAL (19 tests)

Fecha: 7 de septiembre de 2026. Alcance: los 19 tests completados bajo la cuenta COMRURAL, cruzando (a) las respuestas crudas guardadas en la base, (b) lo que muestra el Informe/PDF y (c) lo que muestra el Panel RRHH (Análisis de Equipo, Persona vs Persona, Cultura, Compatibilidad).

Método: se replicó en un script, sin modificar el código, cada fórmula real del sistema (`TestDisc.jsx`, `public/informe/script.js`, `pdfGenerator.js`, `discToWheel.js`, `ruedaSuccessInsights5niveles.js`, `src/lib/discScoring.js`) y se corrió sobre las 19 respuestas reales. La réplica reproduce al número lo que se ve en los PDFs ya generados (Estrella 43/32/7/18 y su tabla Parte I/II 11→10, 3→4, 1→7, 13→7; Samuel 25/29/25/21; Mercedes 18/7/32/43), así que lo auditado es exactamente lo que ve el cliente.

## Resumen ejecutivo

Los datos crudos están bien: las 19 personas tienen sus 56 respuestas completas y solo valores válidos. Lo que está correcto y es confiable es todo lo que trabaja a nivel de **eje D/I vs S/C** (conteos MÁS/MENOS, porcentajes, niveles, la card "Perfil dominante" del informe y la tabla Parte I / Parte II).

Todo lo que intenta bajar a **una letra específica** (D, I, S o C) — barras individuales, rueda, letra del Panel RRHH, análisis de equipo, compatibilidad, cultura — está construido sobre información que no existe en la base y sobre dos errores matemáticos. Se encontraron **6 fallas de cálculo/presentación** y **2 problemas de diseño/consistencia**. En 16 de las 19 personas el sistema da **tres letras dominantes distintas** según dónde se mire.

## Fallas confirmadas

### 1. La letra específica se pierde al guardar el test (raíz de todo)

`TestDisc.jsx` sabe qué adjetivo eligió la persona (D, I, S o C), pero al guardar aplica `DIM_MAP = { D: 5, I: 5, S: 1, C: 1 }`: D e I se guardan igual, S y C se guardan igual. En la base solo queda "eligió del lado D/I" o "del lado S/C". Por eso el detalle pregunta por pregunta del PDF dice `MÁS: D/I` y nunca "eligió Desafiante" o "eligió Influyente". A partir de acá, **ninguna salida a nivel de letra puede ser auditada ni verificada**, porque el dato no está.

### 2. Dos fórmulas distintas "adivinan" la letra por la posición de la pregunta — y no coinciden entre sí

Como el dato no existe, el código lo inventa según el número de pregunta, no según la respuesta:

- Barras del informe/PDF (`calcularValoresDISC`): `(q-1) % 4` → preguntas 1,2,5,6,… cuentan como D o S; 3,4,7,8,… como I o C.
- Rueda y Panel RRHH (`discToWheel.js` y `discScoring.js`): `(q-1) % 2` → impares D o S; pares I o C.

El propio comentario del código dice "Distribución por pregunta (simplificada para visualización)". Al usar reglas distintas, las salidas se contradicen:

| Persona | Barras D/I/S/C (informe) | Barra máx. | Letra Panel RRHH | Coinciden |
|---|---|---|---|---|
| Estrella Ojeda | 43 / 32 / 7 / 18 | **D** | **I** | no |
| Mercedes Cusi | 18 / 7 / 32 / 43 | **C** | **S** | no |
| Wara Ticona | 21 / 11 / 29 / 39 | C | S | no |
| Brayan Cordero | 25 / 39 / 25 / 11 | I | C | no |
| Vanessa Paye | 39 / 25 / 11 / 25 | D | S | no |
| Samuel Cruz | 25 / 29 / 25 / 21 | I | I | sí |

Resultado sobre los 19: **16 personas con contradicción** entre la barra más alta, la letra del RRHH y el vector del RRHH. Estrella "es D" en el gráfico, "es I" en el panel; Mercedes "es C" en el gráfico, "es S" en el panel.

### 3. La rueda promedia ángulos en forma lineal (error de matemática circular)

`vectorToPolares` en `discToWheel.js` calcula el ángulo como promedio ponderado de los centros de sector (D=45°, I=135°, S=225°, C=315°). Eso no es válido en un círculo: D (45°) y C (315°) son vecinos, pero su promedio lineal da 180° = S, el cuadrante opuesto.

Casos sintéticos: `{D:5, C:5}` → sistema: 180° (S); correcto: 0° (D/C). `{D:6, C:2}` → sistema: 112° (I); correcto: 27° (D).

Sobre los 19 reales, recalculando con media circular (misma entrada, solo corrigiendo el promedio): **a 13 personas les cambia la letra**. Estrella pasa de 105° (I) a 79° (D); Maria Calle de 144° (I) a 34° (D); Mercedes de 243° (S) a 293° (C); Wara, Daniela, Leslie y Vanessa pasan de S a C.

Consecuencia visible: la distribución del Panel RRHH para COMRURAL es **D: 0, I: 7, S: 11, C: 1**. Cero dominantes en un equipo donde 5 personas tienen D como barra más alta. El "Ritmo del equipo: 7 rápidos / 12 pausados" sale de esa misma letra.

### 4. La comparación Natural vs Adaptado ignora las respuestas MENOS

`renderInterpretacionPartes` (informe) y `generarComparativaPartes` (PDF) calculan la diferencia entre Parte I y Parte II usando solo las columnas MÁS:

```js
const diffDI = Math.abs(masDI_P1 - masDI_P2);
const diffSC = Math.abs(masSC_P1 - masSC_P2);
const diffTotal = diffDI + diffSC;
```

Las variables `menosDI_P1/P2` y `menosSC_P1/P2` existen y se calculan, pero no se usan. Con el mismo umbral aplicado a la diferencia completa, **el veredicto cambia en 10 de 19 personas**:

| Persona | MÁS P1→P2 | MENOS P1→P2 | Dif. sistema | Dif. completa | Dice | Diría |
|---|---|---|---|---|---|---|
| Estrella Ojeda | 11→10, 3→4 | 1→7, 13→7 | 2 | 14 | Muy Estable | Adaptación Significativa |
| Wara Ticona | 4→5, 10→9 | 7→12, 7→2 | 2 | 12 | Muy Estable | Adaptación Significativa |
| Vanessa Paye | 8→10, 6→4 | 9→5, 5→9 | 4 | 12 | Muy Estable | Adaptación Significativa |
| Maria Irene Callizaya | 8→11, 6→3 | 5→8, 9→6 | 6 | 12 | Núcleo Estable | Adaptación Significativa |
| Marco, Carolina, Daniela, Patricia, Maria Calle, Brigitte | — | — | 2–4 | 6–8 | Muy Estable | Núcleo Estable |

El informe le dice a Estrella "no modificás significativamente tu conducta bajo presión" con datos que muestran lo contrario en lo que rechaza.

### 5. El criterio ">60 = predominante" no aplica a la escala que se usa

El informe dice "Intensidad de cada dimensión (0-100)… Valores altos (>60) muestran características predominantes". Pero `calcularValoresDISC` normaliza D+I+S+C para que sumen 100 (reparto porcentual, no cuatro escalas independientes). En los 19 casos la suma es exactamente 100 y **ninguna barra supera 60**; el máximo observado es 46 (Carolina). Con esta escala el criterio es prácticamente inalcanzable: D=43 en Estrella es claramente su barra más alta y el texto diría que no es predominante.

### 6. La rueda dibuja el marcador en una celda distinta a la que calcula

`discToWheel.radiusToCell` numera las celdas de 16 como `base + índice` (celda 25 en 0–22,5°). El renderer `ruedaSuccessInsights5niveles.js` las dibuja como `base + índice + 1` con la última celda al final (celda 26 en 0–22,5°, celda 25 en 337,5–360°). Están corridas una celda. Además, las 4 celdas del nivel interno miden 90° y reciben el nombre de rol por su centro, abarcando dos roles cada una.

Sobre los 19: el marcador Natural queda dibujado en un rol distinto al de su ángulo en **10 personas**; el Adaptado también en 10. Estrella: ángulo 105° = PROMOTOR, celda 29 dibujada en PERSUASOR; su Adaptado 112,5° = PROMOTOR, celda 58 dibujada en RELACIONADOR. Es exactamente lo que se vio al navegar el informe ("celda 29 dice Persuasor…").

## Problemas de diseño / consistencia

### 7. El Panel RRHH construye todo sobre la letra defectuosa

Análisis de Equipo (distribución, ritmo, prioridad, diversidad), Persona vs Persona, Cultura Organizacional y Compatibilidad usan `calcularPerfilDominante` (la letra de la rueda, fallas 1+2+3) y `calcularVectorNatural100` (copia de la misma heurística). Compatibilidad además asume "misma letra = riesgo bajo". Estrella (75% activa / 25% reservada) y Samuel (54% / 46%, balanceado) quedan ambos "I" y el módulo los da como afines; sus perfiles reales son muy distintos, y Samuel cambia mucho bajo presión (MÁS D/I 10→5) mientras Estrella no. La compatibilidad debería comparar distancia entre las cuatro dimensiones, eje ritmo, eje personas/tareas y diferencia Natural/Adaptado, no una letra.

### 8. Cuatro nomenclaturas distintas conviven en el producto

- Informe/PDF: Dominancia, Influencia, Estabilidad, Cumplimiento.
- Landing y Panel RRHH: Dominante, Influyente, Sensato, Correcto.
- Pack Líder (`Manual.js`): Movilizador, Conector, Sostenedor, Analizador Estratégico (+ combinaciones).
- Rueda: 8 roles (Conductor, Persuasor, Promotor, Relacionador, Colaborador, Coordinador, Analizador, Implementador).

"Sensato" como nombre de S puede ser una decisión comercial, pero hoy la misma persona lee cuatro nombres distintos para la misma cosa según la pantalla.

## Qué sí está bien (y se puede usar hoy)

- Datos crudos completos y válidos en los 19 tests.
- Conteos MÁS/MENOS a nivel D/I vs S/C, porcentajes y niveles (Muy Alto … Muy Bajo).
- La card "Perfil dominante" del informe y del PDF (Activa D-I / Reservada S-C / Balanceado), que usa el eje y no la letra.
- Los números de la tabla Parte I vs Parte II (solo está mal la conclusión que se saca de ellos, falla 4).
- Los dos juegos de archivos (`public/legacy/` y `public/informe/`) son idénticos: no hay diferencia entre el PDF que se genera al terminar el test y el informe web.

## Tabla por persona (eje confiable vs. letras que muestra el sistema)

| id | Persona | MÁS D/I | MÁS S/C | Card informe | Barra máx. | Letra RRHH | Verdicto estabilidad (sistema → con MENOS) |
|---|---|---|---|---|---|---|---|
| 88 | Marco Salguero | 61% | 39% | Activa (D-I) | I | I | Muy Estable → Núcleo Estable |
| 89 | Jhonatan Condori | 25% | 75% | Reservada (S-C) | S | S | Adapt. Significativa (igual) |
| 90 | Samuel Cruz | 54% | 46% | Balanceado | I | I | Adapt. Significativa (igual) |
| 91 | Agustín Paco | 39% | 61% | Reservada (S-C) | S | S | Núcleo Estable (igual) |
| 92 | Estrella Ojeda | 75% | 25% | Activa (D-I) | D | I | Muy Estable → Adapt. Significativa |
| 93 | Wara Ticona | 32% | 68% | Reservada (S-C) | C | S | Muy Estable → Adapt. Significativa |
| 94 | Carolina Condori | 11% | 89% | Reservada (S-C) | C | S | Muy Estable → Núcleo Estable |
| 95 | Daniela Callezaya | 36% | 64% | Reservada (S-C) | C | S | Muy Estable → Núcleo Estable |
| 96 | Patricia Guarachi | 18% | 82% | Reservada (S-C) | C | S | Muy Estable → Núcleo Estable |
| 97 | Brayan Cordero | 64% | 36% | Activa (D-I) | I | C | Adapt. Significativa (igual) |
| 98 | Maria Calle | 71% | 29% | Activa (D-I) | I | I | Muy Estable → Núcleo Estable |
| 99 | Brigitte Tapia | 46% | 54% | Balanceado | C | S | Muy Estable → Núcleo Estable |
| 100 | Maria Irene Callizaya | 68% | 32% | Activa (D-I) | D | I | Núcleo Estable → Adapt. Significativa |
| 101 | Leslie Condori | 29% | 71% | Reservada (S-C) | C | S | Muy Estable (igual) |
| 102 | Eduardo Catacora | 64% | 36% | Activa (D-I) | D | I | Adapt. Significativa (igual) |
| 103 | Vanessa Paye | 64% | 36% | Activa (D-I) | D | S | Muy Estable → Adapt. Significativa |
| 104 | Michael Flores | 18% | 82% | Reservada (S-C) | C | S | Muy Estable (igual) |
| 105 | Mercedes Cusi | 25% | 75% | Reservada (S-C) | C | S | Muy Estable (igual) |
| 106 | Edwin Kantuta | 68% | 32% | Activa (D-I) | D | I | Núcleo Estable (igual) |

## Qué haría falta para cerrarlo metodológicamente

1. Guardar la letra real elegida en cada pregunta (cuatro valores distintos o un campo nuevo), manteniendo compatibilidad con los tests ya guardados.
2. Calcular D, I, S y C desde esa letra real, con una sola fórmula compartida por barras, rueda y Panel RRHH.
3. Reemplazar el promedio lineal de ángulos por una media circular (suma de vectores).
4. Incluir MÁS y MENOS en la comparación Natural/Adaptado y redefinir sus umbrales.
5. Definir un criterio de "predominante" coherente con la escala elegida (o cambiar la escala).
6. Unificar la numeración de celdas entre `discToWheel.js` y el renderer de la rueda.
7. Rehacer Compatibilidad/Cultura sobre los cuatro valores y el eje Natural/Adaptado, no sobre una letra.
8. Elegir una única nomenclatura para D, I, S y C en todo el producto.

Hasta que esto esté hecho, lo defendible frente a un cliente es el nivel de eje (Activa D-I / Reservada S-C / Balanceado, con sus porcentajes MÁS/MENOS y la tabla Parte I/II). No el gráfico de cuatro barras, ni la letra única, ni el veredicto de estabilidad, ni las comparaciones del Panel RRHH.
