# Plan de arreglo del cálculo DISC

Objetivo: que todos los tests que se tomen de ahora en más salgan correctos y consistentes en el Informe, el PDF, la rueda y el Panel RRHH — sin romper los tests ya guardados ni ninguna otra parte de la plataforma.

Regla que atraviesa todo el plan: **nada de lo existente se reemplaza, se agrega al lado.** El formato viejo de respuestas se sigue guardando igual; el cálculo viejo se sigue usando para los tests viejos. Solo los tests que traigan el dato nuevo entran por el cálculo nuevo.

Referencia de las fallas: `AUDITORIA_DISC_COMRURAL.md`.

---

## Fase 0 — Red de seguridad (antes de tocar nada)

1. Rama nueva (`fix/disc-scoring`). Nada va a `main` hasta la Fase 6.
2. Convertir el script de auditoría en **test de regresión**: guarda las salidas actuales de los 19 tests de COMRURAL (barras, ángulos, celdas, veredictos). Después de cada fase se vuelve a correr y tiene que dar **exactamente lo mismo** para los tests viejos. Si cambia algo, se rompió la compatibilidad.
3. Backup de la base (export de `respuestas`) antes de la migración de la Fase 1.

Resultado: podemos demostrar en cualquier momento que los tests viejos no se movieron.

---

## Fase 1 — Capturar el dato que hoy se pierde

Resuelve la falla 1 (raíz). Cero impacto visual: solo empieza a guardarse información nueva.

- **Base:** nueva columna `respuestas.detalle` (JSON, nullable). Tests viejos quedan en `null`. Migración idempotente, sin tocar filas existentes.
- **`TestDisc.jsx`:** al terminar el test, además del string actual (que no cambia), arma `detalle = { "1": { "mas": "D", "menos": "S" }, "2": {...}, ... "28": {...} }` con la **letra real** elegida en cada pregunta, y lo manda a `guardarRespuesta`.
- **`api.js`:** `guardarRespuesta` acepta `detalle`; `mapRespuesta` lo devuelve. `getRespuestasByAdmin` y compañía lo traen solos (`select('*')`).

Verificación: tomar un test de prueba y confirmar en la base que `detalle` tiene 28 pares con letras D/I/S/C, y que el string viejo sigue idéntico al de siempre.

---

## Fase 2 — Un solo núcleo de cálculo para todo el sistema

Resuelve las fallas 2, 3, 5 y 6 en un solo lugar, y deja de haber tres fórmulas distintas.

Archivo nuevo `public/informe/discCore.js` (JS plano, para que lo pueda cargar tanto el informe estático como React vía `loadScript`; copia idéntica en `public/legacy/`). Expone `window.DISCCore` con:

- `tieneDetalle(row)` → true si el test trae el dato nuevo.
- `puntajes(detalle)` → para Natural (preg. 1–14) y Adaptado (15–28), por cada letra: `MÁS − MENOS`. Cuatro escalas **independientes** de −14 a +14, normalizadas a 0–100 con `(x + 14) / 28 × 100`. Ya no suman 100 entre sí: cada letra tiene su intensidad propia.
- `dominante(puntajes)` → letra más alta, con regla de empate definida (p. ej. mayor MÁS bruto).
- `predominante(valor)` → umbral coherente con esa escala (propuesta inicial: ≥ 60, que equivale a un neto de +3 o más; **a validar con María Laura**).
- `polares(puntajes)` → ángulo por **media circular** (suma de vectores D=45°, I=135°, S=225°, C=315°) y radio por intensidad.
- `celda(radio, ángulo)` → numeración **alineada con el dibujo de la rueda** (misma regla `base + i + 1` con wrap en los niveles de 16). El renderer no se toca; se ajusta el cálculo a él.
- `rolPorAngulo(ángulo)` → nombre del rol (Conductor, Persuasor…) por el ángulo real, no por el centro de la celda.
- `estabilidad(puntajesNatural, puntajesAdaptado)` → suma de |Natural − Adaptado| en las cuatro letras (usa MÁS y MENOS, porque ambos entran en el puntaje). Umbrales **a validar con María Laura**.
- `legacy(rp)` → envuelve, sin modificar, las funciones viejas (`calcularValoresDISC`, `calcularVectorDISC`, etc.) para los tests sin `detalle`.

Verificación: tests unitarios con casos sintéticos (D=5/C=5 debe caer entre D y C, no en S; pura D debe dar D; empate) + los 19 de COMRURAL por la rama legacy dando lo mismo que hoy.

---

## Fase 3 — Informe y PDF usan el núcleo

Archivos: `public/informe/script.js`, `pdfGenerator.js`, `discToWheel.js`, `index.html` (y sus copias en `public/legacy/`). Cambios quirúrgicos: cada función que hoy calcula, primero pregunta `DISCCore.tieneDetalle`; si sí, usa el núcleo; si no, sigue por el camino de siempre.

- Barras D/I/S/C: valores del núcleo. Texto de interpretación: escala 0–100 independiente y criterio de "predominante" real (falla 5).
- Rueda: ángulo circular + celda alineada (fallas 3 y 6). Badges "Celda / Ángulo / Intensidad" y nombre de rol por ángulo.
- Natural vs Adaptado: veredicto con MÁS y MENOS (falla 4). La tabla Parte I/II se mantiene y se le agregan las cuatro letras.
- Detalle pregunta por pregunta: muestra la **palabra elegida** como MÁS y como MENOS (hoy solo dice D/I o S/C). Esto es lo que permite auditar a mano.
- "Resultados Cuantitativos" (eje D/I vs S/C) no cambia: ya estaba bien.
- Tests viejos: el informe muestra un aviso discreto "Calculado con la versión anterior del algoritmo".

Verificación: generar el PDF de un test nuevo y auditarlo a mano pregunta por pregunta (María Laura); regenerar el de un test viejo y compararlo byte a byte con el original.

---

## Fase 4 — Panel RRHH sobre valores reales

Archivos: `src/lib/discScoring.js`, `src/pages/Rrhh.jsx`.

- `discScoring.js` deja de replicar heurísticas: llama a `DISCCore`. `calcularVectorNatural100` y `calcularPerfilDominante` devuelven los valores reales cuando hay `detalle`, y los viejos (marcados `legacy: true`) cuando no.
- Análisis de Equipo: distribución por letra real; ritmo y prioridad derivados del vector, no de una letra.
- Persona vs Persona y Compatibilidad: puntaje de afinidad = distancia entre los cuatro valores + coincidencia de ejes (ritmo, personas/tareas) + diferencia Natural/Adaptado de cada uno. Se mantiene el contenido cualitativo por par de estilos, pero el semáforo sale del puntaje, no de "misma letra".
- Cultura Organizacional: promedio del equipo sobre los vectores reales.
- Personas con test viejo: aparecen con etiqueta "versión anterior" y **no entran** en promedios ni compatibilidades (decisión a confirmar: entran igual pero marcadas, o no entran).

Verificación: con 3 tests nuevos de prueba, comprobar que la letra del panel coincide con la barra más alta del informe (hoy se contradicen en 16 de 19).

---

## Fase 5 — Nomenclatura

Decisión de Facundo (7/9/2026): **se mantienen los nombres actuales** de la Landing y el Panel RRHH (Dominante / Influyente / Sensato / Correcto). No se unifica con el informe. Fase cerrada sin cambios.

---

## Fase 6 — Validación final y salida a producción

1. Regresión: los 19 tests viejos dan exactamente lo mismo que antes de empezar (Fase 0).
2. Tres personas reales vuelven a hacer el test (propuesta: Estrella, Samuel y Mercedes). María Laura audita cada PDF a mano contra sus respuestas, pregunta por pregunta, y valida los umbrales de "predominante" y de estabilidad.
3. Prueba end-to-end en la plataforma: test → PDF → informe web → Panel RRHH → Pack Líder, con un usuario nuevo y uno viejo.
4. Merge a `main`, deploy, y migración de la columna en la base real (Fase 1) aplicada antes del deploy.
5. Comunicación a COMRURAL: sus 19 informes actuales corresponden a la versión anterior del algoritmo; se les ofrece re-tomar el test para tener el informe corregido.

---

## Decisiones que necesito confirmadas para arrancar

1. **Permiso para editar** `public/informe/script.js`, `pdfGenerator.js`, `discToWheel.js` y sus copias en `public/legacy/` (hasta hoy marcados como intocables). Sin esto no se pueden arreglar las fallas 3, 4, 5 y 6.
2. **Umbrales** de "predominante" y de estabilidad: propongo valores iniciales y los valida María Laura con los 3 tests re-tomados.
3. **Tests viejos en el Panel RRHH:** ¿entran marcados o no entran en promedios y compatibilidades?
4. **Nomenclatura única** (Fase 5): cuál de los dos juegos de nombres queda.

## Orden y dependencias

Fase 0 → Fase 1 → Fase 2 → (Fase 3 y Fase 4 en paralelo) → Fase 5 → Fase 6.
Cada fase termina con su verificación y con el test de regresión en verde. Si el test de regresión falla, esa fase no se da por cerrada.
