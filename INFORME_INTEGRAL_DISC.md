# Informe integral — Arreglo del cálculo DISC (7 de septiembre de 2026)

Documento de traspaso. Está escrito para que un desarrollador que no participó del trabajo pueda entender qué estaba mal, qué se cambió, cómo funciona ahora el cálculo, cómo se verificó y qué queda pendiente, sin necesidad de preguntarle a nadie.

Documentos relacionados en el repositorio:

- `AUDITORIA_DISC_COMRURAL.md` — la auditoría original, con la tabla persona por persona de los 19 tests de COMRURAL.
- `PLAN_ARREGLO_DISC.md` — el plan por fases que se siguió, con el estado de cada fase.
- Este informe resume ambos y agrega lo que se hizo después (validación, decisiones, auditoría automática).

---

## 1. Dónde está todo

| Qué | Dónde |
|---|---|
| Código | Este repositorio (React + Vite + Supabase). Rama de trabajo: `fix/disc-scoring`. `main` todavía **no** tiene el arreglo. |
| Base de datos y Storage | Proyecto Supabase de **Escencial Consultora**. Cuenta: `facundoescencial@gmail.com` (organización Escencial). URL del proyecto: `https://pnyzlhmpfavrusqgjuxk.supabase.co`. Las claves están en el `.env` del repo (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`). |
| Tabla clave | `respuestas` — una fila por test tomado. Columnas relevantes: `disc_id` (número correlativo), `usuario_user`, `admin_id`, `respuestas` (string del formato viejo), `detalle` (JSON nuevo, ver §4), `pdf_path` (ruta en el bucket de Storage `informes`), `fecha`. |
| Migración aplicada | `supabase/migration_detalle_disc.sql` — ya ejecutada en la base real el 7/9/2026. Es idempotente (`add column if not exists`). |

### Commits del día

Punto de partida: `main` en `9063986` (borrado definitivo de usuarios/admins). Sobre eso:

| Commit | Rama | Qué hace |
|---|---|---|
| `d727365` | `main` | Link de Registro Rápido por empresa (no relacionado con el cálculo) + los dos documentos de auditoría y plan. Es el último commit de `main`. |
| `7ea9449` | `fix/disc-scoring` | **El arreglo de fondo**: núcleo de cálculo nuevo, columna `detalle`, test de regresión, informe/PDF/rueda/Panel RRHH usando el núcleo. |
| `ff5004d` | `fix/disc-scoring` | Revierte un cambio de nombres (Sensato/Correcto) que no estaba pedido. |
| `f7d5fac` | `fix/disc-scoring` | Muestra estilo, celda, ángulo e intensidad debajo de la rueda del informe. |
| `1721963` | `fix/disc-scoring` | Validación end-to-end con un test real (documentada en el plan). |
| `d4272e8` | `fix/disc-scoring` | Hace **invisible** el cambio de algoritmo (sin avisos de "versión anterior"), los tests viejos entran en todo el Panel RRHH, y agrega la auditoría automática por test. |

Nada de esto fue pusheado ni mergeado todavía. Ver §9.

---

## 2. Contexto: cómo se llegó acá

El cliente COMRURAL (Bolivia, 19 personas evaluadas en agosto de 2026) recibió sus informes y una colega del área de RRHH (María Laura) detectó que había "indicadores al revés": personas que se describían como dominantes salían como Influyentes o Estables, y la letra del Panel RRHH no coincidía con la barra más alta del informe PDF de la misma persona. Se pidió una auditoría completa de todo el cálculo antes de una demo con SIPROSA.

La auditoría se hizo replicando en Node el código real del informe (`public/informe/script.js`, `pdfGenerator.js`, `discToWheel.js`) sobre los 19 strings de respuestas reales de COMRURAL. La réplica reprodujo **exactamente** los números de los PDFs entregados (por ejemplo Estrella 43/32/7/18), lo que confirmó que lo que se estaba auditando era lo que el cliente había recibido.

---

## 3. Cómo funciona el test (lo que hay que saber antes de leer los problemas)

- El test tiene **28 preguntas**. En cada una se muestran 4 adjetivos, uno por letra (D, I, S, C, siempre en ese orden interno), y la persona elige uno como **MÁS** (el que más la describe) y otro como **MENOS**.
- Preguntas **1 a 14** = perfil **Natural** (Parte I). Preguntas **15 a 28** = perfil **Adaptado** (Parte II, "bajo presión").
- El método es el de Cleaver: por cada letra se cuenta cuántas veces fue elegida como MÁS y cuántas como MENOS; el puntaje de la letra es **MÁS − MENOS**.
- Los adjetivos de cada pregunta están en `GRUPOS_DISC` dentro de `public/informe/script.js` (y su equivalente en `TestDisc.jsx`).

---

## 4. Los problemas encontrados (y por qué pasaban)

### Problema 1 — raíz: la letra elegida nunca se guardaba

`TestDisc.jsx` guardaba cada elección con un mapa `DIM_MAP = { D: 5, I: 5, S: 1, C: 1 }`. Es decir: si la persona elegía D **o** I, se guardaba un `5`; si elegía S **o** C, se guardaba un `1`. El string resultante tiene esta forma:

```
{PI: 4m 5s - 1;1, 2;1, 3;5, 4;1, ...} {PII: 4m 48s - 29;1, 30;1, ...}
```

Los ids 1–28 son la Parte I (impar = MÁS, par = MENOS de cada pregunta) y 29–56 la Parte II. El valor es solo `5` o `1`. **La información de qué letra exacta eligió la persona se perdía en el momento de guardar.** Todo lo demás era consecuencia de esto.

### Problema 2 — el informe "inventaba" la letra por el número de pregunta

Como no tenía la letra, `calcularValoresDISC` (en `script.js` y `pdfGenerator.js`) la deducía con una regla fija: si el valor era `5`, la letra era D o I según `(q − 1) % 4`; si era `1`, S o C según la misma rotación. O sea, la letra dependía del **número de pregunta**, no de lo que la persona eligió. Dos personas que respondieron distinto podían salir iguales, y una persona que eligió siempre D podía salir mitad D mitad I.

### Problema 3 — la rueda usaba otra regla distinta

`discToWheel.js` (la Rueda Success Insights) hacía lo mismo pero con `(q − 1) % 2`. Como la regla era distinta a la de las barras, **la rueda y las barras se contradecían** en la misma persona. `src/lib/discScoring.js` (Panel RRHH) copiaba la regla de la rueda. Resultado medido: en **16 de 19** personas de COMRURAL la letra del Panel RRHH no coincidía con la barra más alta del PDF.

### Problema 4 — el ángulo de la rueda se promediaba mal

`vectorToPolares` calculaba el ángulo como promedio lineal de los ángulos de cada letra (D = 45°, I = 135°, S = 225°, C = 315°). Una persona con D y C altos (45° y 315°) daba **180°, que es S**. Por eso en COMRURAL no había **ninguna** persona con Natural D en el Panel RRHH, aunque sí las había según sus respuestas.

### Problema 5 — la numeración de celdas de la rueda no coincidía con el dibujo

`radiusToCell` numeraba las cuñas como `base + i`; el renderer (`ruedaSuccessInsights5niveles.js`) las dibuja como `base + i + 1` con vuelta al inicio en los niveles de 16 cuñas. La celda que decía el texto no era la que se pintaba.

### Problema 6 — "predominante" era inalcanzable y la estabilidad estaba incompleta

- Las 4 barras se normalizaban para sumar 100. Con esa escala, el texto "60 o más = predominante" era casi imposible de alcanzar (habría que tener 60 de 100 en una sola letra).
- La comparación Natural vs Adaptado ("estabilidad") solo miraba las diferencias en MÁS, ignorando MENOS, que pesa lo mismo en el puntaje.

### Dos cuestiones de diseño (no bugs)

- Conviven dos juegos de nombres: el informe usa Dominancia/Influencia/Estabilidad/Cumplimiento y la Landing/Panel RRHH usan Dominante/Influyente/Sensato/Correcto. **Decisión: se mantienen los dos, no se unifican.**
- Qué hacer con los tests ya tomados (que no tienen la letra). Ver §6.

---

## 5. La solución

Principio rector: **no reemplazar nada, agregar al lado.** El formato viejo se sigue guardando igual; el cálculo viejo se sigue usando para los tests viejos; los tests nuevos entran por un cálculo nuevo. Esto garantiza que ningún informe ya entregado cambie.

### 5.1 Se guarda la letra real (`detalle`)

- Nueva columna `respuestas.detalle` (JSON, nullable). Tests viejos: `null`.
- `TestDisc.jsx` arma, al terminar el test, un objeto con la letra real elegida en cada pregunta y lo manda junto con el string viejo (que no cambió en nada):

```json
{ "1": { "mas": "D", "menos": "S" }, "2": { "mas": "C", "menos": "I" }, ..., "28": { "mas": "S", "menos": "I" } }
```

- `src/lib/api.js`: `guardarRespuesta` inserta `detalle`; `mapRespuesta` lo devuelve como `Detalle` en cada fila, así que todos los lugares que ya traían respuestas lo reciben sin cambios.

### 5.2 Un solo núcleo de cálculo: `discCore.js`

Archivo nuevo `public/informe/discCore.js` (JavaScript plano, sin módulos, para que lo carguen tanto el informe estático como React). **Copia idéntica en `public/legacy/discCore.js`** — si se edita uno hay que copiar el otro (`cp public/informe/discCore.js public/legacy/discCore.js`). Expone `window.DISCCore` con:

| Función | Qué hace |
|---|---|
| `tieneDetalle(detalle)` | `true` solo si hay 28 preguntas con MÁS y MENOS válidos y distintos. Es el interruptor: si da `false`, todo sigue por el camino viejo. |
| `conteos` / `neto` | Cuenta MÁS y MENOS por letra en un rango de preguntas; neto = MÁS − MENOS (−14 a +14 por parte). |
| `escala100(neto)` | Escala **independiente** por letra: `(neto + 14) / 28 × 100`. Las cuatro ya **no** suman 100: cada letra tiene su propia intensidad. |
| `dominante(valores, conteo)` | La letra más alta. Empate: más elecciones MÁS; si sigue el empate, orden D, I, S, C. |
| `nivelIntensidad(v)` | `Predominante` (≥ 60), `Moderada` (40–59), `Baja` (< 40). |
| `polares(neto)` | Ángulo por **media circular** (suma de vectores en D=45°, I=135°, S=225°, C=315°, con peso = neto − mínimo). D + C ahora cae entre D y C (0°/360°), no en S. Radio = módulo de la resultante / 28. |
| `celda(radio, ángulo)` | Numeración **igual a la del dibujo** (`base + i + 1` con vuelta en los niveles de 16). Se ajustó el cálculo al renderer; el renderer no se tocó. |
| `rolPorAngulo` / `letraPorAngulo` | Rol (Conductor, Persuasor, Promotor, Relacionador, Colaborador, Coordinador, Analizador, Implementador) y letra por el ángulo real. |
| `estabilidad(netoNatural, netoAdaptado)` | Suma de \|Natural − Adaptado\| en las 4 letras (0–56, siempre par). Usa MÁS y MENOS porque ambos entran en el neto. `≤ 10` Muy Estable, `≤ 20` Núcleo Estable, `> 20` Adaptación Significativa. |
| `calcular(detalle)` | Todo junto: `{ natural, adaptado, total, estabilidad, version: 2 }`. `total` son las 28 preguntas y alimenta las barras del informe (neto −28 a +28 → 0–100). |
| `detallePreguntas(detalle, preguntas)` | Tabla pregunta por pregunta con la **palabra** elegida como MÁS y MENOS y su letra. Es lo que permite auditar a mano. |

Los umbrales están al principio del archivo como constantes (`UMBRAL_PREDOMINANTE = 60`, `UMBRAL_BAJO = 40`, `ESTABILIDAD = { muyEstable: 10, nucleoEstable: 20 }`). Cambiarlos es cambiar esas líneas y copiar el archivo a `public/legacy/`.

### 5.3 Consumidores: todos preguntan primero si hay `detalle`

En cada uno de estos archivos el patrón es el mismo: `if (DISCCore.tieneDetalle(detalle)) { usar núcleo } else { código anterior, intacto }`.

| Archivo | Cambio |
|---|---|
| `public/informe/index.html` | Carga `discCore.js` antes de `discToWheel.js`. Texto de interpretación actualizado a la escala independiente. |
| `public/informe/script.js` (informe web) | Lee `data.Detalle` de la sesión. Con detalle: barras desde `core.total.valores`, tabla de detalle con palabras y letras, rueda con núcleo, comparación Natural/Adaptado con estabilidad de 4 letras. Debajo de la rueda muestra "Rol · Celda · Ángulo · Intensidad" para Natural y Adaptado. |
| `public/informe/pdfGenerator.js` (PDF) y copia en `public/legacy/` | Mismo criterio: barras, tabla de detalle (con letra y color), comparación de partes, y `calcularResultadoParaPDF(rp, detalle)`. |
| `public/informe/discToWheel.js` y copia en `public/legacy/` | `discToWheel(respuestas, detalle)`: con detalle devuelve las polares del núcleo; sin detalle, el cálculo anterior. |
| `src/pages/TestDisc.jsx` | Carga `/legacy/discCore.js`, arma `detalle`, lo pasa a `guardarRespuesta`, al PDF y a la rueda. |
| `src/lib/discScoring.js` (Panel RRHH) | `calcularPerfilDominante`, `calcularVectorNatural100` y `calcularPerfilCompleto` usan el núcleo cuando hay detalle y marcan `legacy: true` cuando no. Nueva `afinidadPersonas(a, b)` (ver abajo). |
| `src/pages/Rrhh.jsx` | Carga `/legacy/discCore.js` antes de `discToWheel.js`. Cada persona lleva `legacy`, `vectorAdaptado` y `estabilidad`. Nuevo bloque "Afinidad calculada" en Persona vs Persona. |

**Afinidad calculada** (Persona vs Persona): `100 − promedio de |Δ| en las 4 dimensiones Natural`, `+5` si comparten ritmo, `+5` si comparten prioridad, `− máx(estabilidad de los dos) / 4`. Alta ≥ 75, Media ≥ 50, Baja < 50. Para pares donde alguno es test viejo se muestra solo el resumen (porcentaje, similitud, ritmo/prioridad), sin las barras por letra ni el "cambio bajo presión", porque esos datos no existen para tests viejos.

---

## 6. Decisiones tomadas (y por quién)

1. **Se pueden editar los archivos del informe** (`script.js`, `pdfGenerator.js`, `discToWheel.js` y copias). Hasta este trabajo estaban marcados como intocables; se editaron con cambios quirúrgicos y con el test de regresión de §7.1 como garantía.
2. **Los nombres no se unifican** (Facundo, 7/9). Informe: Dominancia/Influencia/Estabilidad/Cumplimiento. Landing y Panel RRHH: Dominante/Influyente/Sensato/Correcto.
3. **El cambio de algoritmo es invisible para el usuario final** (Facundo, 7/9). No hay avisos de "versión anterior" en el informe web, en el PDF ni en el Panel RRHH. Se eliminaron el banner `#avisoVersionAnterior`, la nota del PDF, las etiquetas de la tabla de Informes y el sufijo en los selectores.
4. **Los tests viejos entran en todo el Panel RRHH** (Facundo, 7/9): Análisis de Equipo, Cultura, Compatibilidad, Persona vs Persona. Usan el cálculo anterior (con sus limitaciones). Una primera versión los excluía y dejaba el panel de COMRURAL vacío; eso se revirtió.
5. **Umbrales validados por simulación, no por revisión manual** (Facundo, 7/9: "auditalos vos"). Ver §7.3.

La distinción viejo/nuevo sigue existiendo **solo en código** (`legacy: true` en el Panel RRHH, `detalle === null` en la base) y en los documentos internos.

---

## 7. Resultados de la auditoría y de la validación

### 7.1 Regresión: los tests viejos no cambiaron

`scripts/disc-regresion.mjs` carga los archivos reales del informe en un sandbox de Node y corre los 19 tests de COMRURAL (fixture anonimizado en `scripts/fixtures/comrural_respuestas.json`, solo `disc_id` + string). La salida (barras, resultados, rueda, veredicto de estabilidad, grupos por pregunta, PDF) está congelada en `scripts/fixtures/baseline_legacy.json`, tomada **antes** de tocar nada.

```
node scripts/disc-regresion.mjs
→ REGRESIÓN OK — 19 tests viejos dan exactamente lo mismo que la baseline.
```

Se corrió después de cada fase y después del último commit. Si alguna vez falla, algo rompió la compatibilidad con los informes ya entregados.

### 7.2 Validación end-to-end con un test real

Con la migración aplicada, se tomó un test completo por la plataforma (usuario temporal, después borrado) con un perfil elegido a propósito: Natural D + C, Adaptado S. Con el algoritmo viejo este perfil salía **S** (el problema 4). Resultado:

| Punto | Resultado |
|---|---|
| Base | `detalle` con 28 pares idénticos a lo clickeado; string viejo intacto; PDF subido a Storage. |
| Informe web | Barras D 71 / I 13 / S 54 / C 63. Rueda Natural "Conductor · Celda 10 · 0° · Intensidad 71%", Adaptado "Analizador · Celda 39 · 299°". Estabilidad 32 (con MÁS y MENOS). Detalle con palabra y letra. Sin errores de JavaScript. |
| Panel RRHH | La persona aparece como **D**, igual que la barra más alta del informe. Afinidad calculada funciona. |
| Panel RRHH de un admin con solo tests viejos | Muestra los 14 evaluados, distribución, cultura, compatibilidad y afinidad, sin ninguna mención a versiones. |

### 7.3 Umbrales: validación por simulación

Como los tests viejos no tienen la letra, no se pueden usar para calibrar. Se simularon 40.000 tests por escenario con el núcleo real (`discCore.js`), modelando personas con distinta consistencia de respuesta.

**Predominante (≥ 60 en la escala total = neto MÁS − MENOS ≥ +6 sobre 28 preguntas):**

| Escenario | Letra real marcada predominante | Letra falsa marcada | Ninguna |
|---|---|---|---|
| Responde al azar | 7% | 14% | 72% |
| Preferencia débil | 40% | 3% | 45% |
| Preferencia clara, consistencia media | 100% | 0% | 0% |
| Dos letras altas (D + C) | 100% (ambas) | 0% | 0% |

Lectura: quien no tiene preferencia real casi nunca recibe una letra "predominante"; quien la tiene, siempre. Umbrales más estrictos (64 o 68) empezaban a perder gente con dos letras altas. **Se mantiene 60.**

**Estabilidad (suma de |Natural − Adaptado| en 4 letras; cortes 10 / 20):**

| Escenario | Muy Estable | Núcleo Estable | Adaptación Significativa |
|---|---|---|---|
| Misma persona en ambas partes, muy consistente | 91% | 9% | 0% |
| Misma persona, consistencia media | 69% | 30% | 1% |
| Misma persona, responde al azar | 46% | 49% | 5% |
| Adapta moderadamente (D sube S) | 15% | 63% | 22% |
| Cambia fuerte (D natural → S bajo presión) | 0% | 0% | 100% |

Lectura: el ruido de responder no produce falsos "adaptación significativa"; un cambio real sí la produce siempre. **Se mantienen 10 / 20.** Los 19 de COMRURAL (donde solo se puede medir el eje D/I vs S/C) son coherentes: diferencia Natural−Adaptado mediana 4, máxima 11.

### 7.4 Auditoría automática de cualquier test nuevo

`scripts/disc-auditar.mjs` reemplaza la revisión manual del PDF. Trae el test de la base (por `disc_id` o por usuario), imprime pregunta por pregunta la palabra elegida como MÁS y MENOS con su letra, recalcula conteos, netos, barras, letra dominante, rueda y estabilidad, y verifica la coherencia interna (recuento manual = núcleo, 28 MÁS y 28 MENOS, dominante = barra más alta, rueda apunta a una de las dos letras más altas, celda/rol corresponden al ángulo, estabilidad = suma de diferencias, la rueda del informe da las mismas celdas).

```
node scripts/disc-auditar.mjs 114            # por disc_id
node scripts/disc-auditar.mjs juan.perez     # por usuario_user (toma el más reciente)
node scripts/disc-auditar.mjs archivo.json   # modo local: { respuestas, detalle }
→ AUDITORÍA OK — el informe de este test es coherente con sus respuestas.
```

Con un test viejo (sin `detalle`) lo dice y termina, porque no hay letra que auditar.

---

## 8. Cómo operar el sistema de ahora en más

- **Tomar un test nuevo**: no cambia nada para el usuario. Se guarda el string viejo y el `detalle` nuevo. El PDF se genera en el momento con el núcleo.
- **Ver si un test es viejo o nuevo**: en Supabase, `respuestas.detalle` es `null` en los viejos.
- **Editar el cálculo**: solo en `public/informe/discCore.js`, y después copiar a `public/legacy/discCore.js`. Correr `node scripts/disc-regresion.mjs` (tiene que seguir OK: el núcleo no se usa para tests viejos, así que no debería cambiar nada) y `node scripts/disc-auditar.mjs <id>` sobre un test nuevo.
- **Cambiar umbrales**: las tres constantes al inicio de `discCore.js`. El texto del informe ("60 o más = predominante, 40 o menos = poco marcada") está en `index.html` y en `pdfGenerator.js` y hay que actualizarlo a mano si se cambian.
- **Scripts de Playwright**: los usados para validar viven fuera del repo (scratchpad); el flujo está descripto en `PLAN_ARREGLO_DISC.md`. Se corren con `NODE_PATH="C:/Users/PERSONAL/node_modules"` y el dev server en `npm run dev -- --port 5174`.

---

## 9. Pendientes

1. **Merge de `fix/disc-scoring` en `main` y deploy.** La migración ya está aplicada, así que no hay paso previo en la base. Nada fue pusheado todavía: se hace cuando Facundo lo pida.
2. **Personas de COMRURAL que vuelvan a tomar el test** (por ejemplo Estrella, Samuel y Mercedes) tendrán informe correcto automáticamente; para verificarlo basta `node scripts/disc-auditar.mjs <disc_id>`. No hace falta una revisión manual.
3. **Informes ya entregados**: siguen mostrando exactamente lo que se entregó (por diseño). Si un cliente quiere el informe corregido, la única vía es re-tomar el test, porque la letra elegida no existe en los datos viejos.
4. Los PDFs de tests borrados quedan huérfanos en Storage (no hay policy de delete sobre `storage.objects`). Es un tema previo a este trabajo.

---

## 10. Resumen en tres líneas

- **Problema**: el test guardaba solo "lado D/I" o "lado S/C", no la letra; el informe, la rueda y el Panel RRHH la inventaban con tres reglas distintas y además promediaban mal el ángulo de la rueda. Por eso 16 de 19 personas de COMRURAL tenían letras contradictorias.
- **Solución**: guardar la letra real (`detalle`), un único núcleo de cálculo (`discCore.js`) que usan todos los consumidores cuando hay detalle, y el cálculo viejo intacto para los tests viejos. Sin avisos visibles; los tests viejos siguen entrando en todo.
- **Verificación**: 19 tests viejos idénticos a la baseline (regresión), un test real de punta a punta correcto, umbrales validados con 40.000 simulaciones por escenario, y un script que audita automáticamente cualquier test nuevo.
