# Propuesta integral de consistencia — cálculo e interpretación DISC

Fecha: 8 de septiembre de 2026. Continuación de `AUDITORIA_DISC_COMRURAL.md`, `PLAN_ARREGLO_DISC.md` e `INFORME_INTEGRAL_DISC.md`.

Estado del que se parte: el arreglo de raíz (columna `detalle`, núcleo `discCore.js`, media circular, celdas alineadas, estabilidad con MÁS y MENOS) está en `main` y la regresión de los 19 tests viejos da 19/19. Lo que sigue **no vuelve sobre eso**: es lo que quedó abierto y las inconsistencias nuevas que aparecen al revisar el sistema completo.

## Estado de implementación (8/9/2026)

**Hecho** — los tres cambios críticos, aplicados a los informes que se generen de ahora en más:

- **Gráfico de barras = perfil Natural** (`script.js`, `pdfGenerator.js`). Es el mismo vector del que sale la letra del Panel RRHH, así que ya no pueden contradecirse. Antes graficaba el promedio de las 28 preguntas y divergía en ~50% de las personas que adaptan.
- **Ritmo y foco calculados por separado** (`discCore.js`) y textos generados desde `discTextos.js`, donde cada bloque recibe solo su eje. Incluye el arreglo de la frase invertida ("D/I bajo → orientado a tareas") y la purga de todo el léxico de foco de los textos de ritmo, en informe web, PDF y Landing.
- **Escala descrita con honestidad** (`index.html`, `pdfGenerator.js`): las cuatro barras suman siempre ~200; se interpreta la posición relativa.
- Verificación: `scripts/disc-invariantes.mjs` (nuevo) y el assert que faltaba en `disc-auditar.mjs`.

**Pendiente** — §4 (nivel de definición), §7 (niveles de confianza), §8 (compatibilidad), §9 (alerta MENOS), §10 parcial (fixtures dorados) y las decisiones de §12.

---

## 0. Resumen en cinco líneas

1. El cálculo ya es correcto. Lo que sigue roto es **la capa que lo interpreta**: lee "foco" (personas/tareas) sobre el eje de "ritmo" (activo/pausado).
2. Hay **tres perfiles distintos** conviviendo (Natural, Adaptado y un "Total" de 28 preguntas que no existe en el método) y cada consumidor elige uno por su cuenta. De ahí que la letra del Panel RRHH y la barra más alta del informe vuelvan a contradecirse.
3. La solución no es corregir textos: es **calcular ritmo y foco como campos de primera clase** y hacer que los textos se generen a partir de ellos, sin acceso cruzado.
4. Los tests viejos sí tienen un dato válido (el eje de ritmo, con MÁS y MENOS). Hoy se les inventa una letra. Se propone mostrarles lo que sí midieron.
5. La compatibilidad debe dejar de ser un solo porcentaje. Similitud no es compatibilidad.

---

## 1. Diagnóstico: por qué reaparecen las inconsistencias

Las inconsistencias detectadas no son diez problemas sueltos. Son **tres causas raíz** y sus consecuencias. Esto importa porque determina qué hay que arreglar: si se parchean los síntomas, vuelven.

### Causa A — Un eje se usa para responder preguntas del otro

El modelo tiene dos ejes ortogonales:

```
RITMO  = D+I (activo)   vs  S+C (pausado)
FOCO   = I+S (personas) vs  D+C (tareas)
```

El sistema calcula **solo el primero** y de ahí deduce el segundo. Como D e I comparten ritmo pero no foco, cualquier frase que salga de "D/I alto" y hable de personas es una inferencia inválida.

Consecuencias directas: `script.js:530` ("acción **y las relaciones**"), `script.js:631` (D/I bajo → "orientación más hacia tareas que hacia personas", que está **invertida**: D/I bajo implica S/C alto, y S es el polo de personas), `script.js:550`, `pdfGenerator.js:1988`, y todas las etiquetas "Activo / **Extrovertido**".

El síntoma es textual pero el origen es de cálculo: **no hay ninguna variable de foco en el sistema**. `grep -rn "foco" public/informe/*.js` no devuelve nada.

### Causa B — No existe un "perfil canónico"

`discCore.calcular()` devuelve tres vectores: `natural` (preguntas 1-14), `adaptado` (15-28) y `total` (las 28). Cada consumidor elige el que quiere:

| Consumidor | Usa |
|---|---|
| Gráfico de barras del informe y del PDF | `total` |
| Letra del Panel RRHH, cultura, afinidad | `natural` |
| Rueda | `natural` + `adaptado` |
| Estabilidad | `natural` vs `adaptado` |

Medido por simulación (5.000 perfiles, `discCore.js` real): en una persona estable `natural.dominante` y `total.dominante` coinciden el 98,5% de las veces, pero **en una persona que adapta (D natural → S bajo presión) divergen el 49,6%**. Es exactamente la falla original de la auditoría (16 de 19 personas con letras contradictorias), reintroducida por otra vía.

Además, `total` **no existe como concepto en el método Cleaver**. El instrumento produce dos gráficas: cómo se comporta la persona en condiciones normales y cómo bajo presión. Promediar las 28 preguntas produce un tercer número que no describe a nadie: alguien que es D en calma y S bajo presión no es "moderadamente D-S", es un D que se adapta. El promedio destruye justamente la información que la sección de estabilidad intenta mostrar.

### Causa C — La escala dice una cosa y hace otra

`index.html:667` afirma: *"escala independiente de 0 a 100 (…) Las cuatro no suman 100"*.

Verificado sobre 20.000 perfiles: **las cuatro barras suman siempre entre 199 y 202**. Y no puede ser de otra manera: como cada pregunta aporta un +1 y un −1, `Σ neto = 0` por construcción, y por lo tanto `Σ (neto+28)/56×100 = 200` siempre. El promedio de las cuatro barras es 50 en toda persona.

Es el mismo problema que la auditoría original marcó como falla 5, con otro número: antes sumaban 100 y ninguna barra llegaba a 60; ahora suman 200 y el umbral 60 sí es alcanzable (máximo observado 79 con respuestas al azar), así que el **criterio funciona** — pero **la descripción de la escala es falsa**, y es lo primero que va a encontrar cualquier revisor externo.

La causa de fondo: un test de elección forzada es **ipsativo** por definición. Subir en una letra obliga a bajar en otra. No existe forma de sacar cuatro puntajes independientes de este instrumento. Eso no es un defecto del arreglo: es una propiedad del método, y hay que decirla en vez de negarla.

---

## 2. Decisión de fondo: un solo contrato de perfil

**Propuesta: `discCore.calcular()` deja de exponer `total` como perfil, y devuelve un objeto único que todos los consumidores leen sin recalcular nada.**

```js
{
  version: 3,
  confianza: 'letra',            // 'letra' | 'eje'  (ver §7)

  natural: {                     // preguntas 1-14
    conteo: { mas: {...}, menos: {...} },
    neto:   { D, I, S, C },      // -14..+14
    valores:{ D, I, S, C },      // 0-100 por letra (ipsativo, Σ≈200)
    ritmo:  { activo: 0-100, pausado: 0-100 },      // Σ = 100
    foco:   { tareas: 0-100, personas: 0-100 },     // Σ = 100
    principal: 'D', secundaria: 'I',
    gap: 4,                                          // en preguntas
    nivel_definicion: 'moderado',                    // ver §4
    etiqueta: 'D/I con predominio D',
    polares: { angle, radius, cell, rol }
  },

  adaptado: { ...misma forma... },

  estabilidad: { total, porLetra, nivel, titulo, alerta_menos },
  control:     { conteo28: {...} }   // solo para verificaciones internas
}
```

Y dos reglas duras:

- **El informe muestra dos gráficos de barras** (Natural y Adaptado), no uno mezclado.
- **Todo lo que hoy dice "la letra de la persona" — Panel RRHH, cultura, afinidad, Pack Líder — lee `natural.principal`.** Es el estándar en DISC: el perfil Natural es "quién es"; el Adaptado es "qué hace en este contexto", y cambia de trabajo en trabajo.

**Por qué así:** con un solo número canónico por gráfica, la contradicción de la Causa B deja de ser posible por construcción — no hay un tercer valor del que diverger. Y es la única forma de que el chequeo "la letra del panel = la barra más alta del informe" sea verificable automáticamente, que hoy `disc-auditar.mjs` no puede hacer porque compara cada gráfica consigo misma.

**Costo:** el gráfico de barras del informe cambia de aspecto (pasa de 4 barras a 2×4). Es la parte visible de este cambio.

---

## 3. Los dos ejes, calculados de verdad

### Fórmula

Sobre los netos de cada parte (rango −14..+14):

```
ritmo_neto = neto_D + neto_I
foco_neto  = neto_D + neto_C

activo  = (ritmo_neto + 14) / 28 × 100      pausado  = 100 − activo
tareas  = (foco_neto  + 14) / 28 × 100      personas = 100 − tareas
```

### Por qué esta fórmula y no otra

- **Usa MÁS y MENOS.** Hoy la card "Perfil Dominante" decide con `pctMasDI`, que ignora las respuestas MENOS, mientras que la estabilidad sí las usa. Dos secciones del mismo informe miden lo mismo con criterios distintos. Con netos, todo el informe usa el mismo insumo.
- **Cada par suma exactamente 100** y llega a 0 y a 100 en los extremos reales (todas las MÁS de un lado y todas las MENOS del otro). Es un eje honesto, no una escala inflada.
- **Los dos ejes son independientes entre sí.** `ritmo` y `foco` son dos funcionales linealmente independientes sobre los netos; conocer uno no determina el otro. Es la formalización de lo que el PDF ya explica bien en su parte teórica (`pdfGenerator.js:493-588`, *"Nota Importante: Los Ejes son Independientes"*) y que después el propio informe contradice.
- **Los ejes no reemplazan a las letras, las resumen.** Los netos tienen 3 grados de libertad; ritmo y foco capturan 2. Por eso se muestran las dos cosas.
- **El ritmo se puede calcular para el 100% de los tests, viejos incluidos.** Los tests viejos guardaron `masDI/menosDI/masSC/menosSC` por parte — es decir, tienen el neto del eje de ritmo con dato real. Esto es la base de §7.

### Qué se conserva

Las cuatro cards de "Resultados Cuantitativos" (MÁS D/I, MÁS S/C, MENOS D/I, MENOS S/C con sus frecuencias) **no se tocan**: son el dato bruto auditable y la auditoría original las validó. Se les cambia el rótulo a *"Frecuencias"* para que no compitan con los ejes. Ritmo y foco se presentan como derivados, en su propia sección.

---

## 4. Nivel de definición: dejar de etiquetar empates

Hoy `discCore.dominante()` siempre devuelve una letra, con desempate por orden alfabético D,I,S,C. En simulación, **el 41,9% de los perfiles tiene 3 puntos o menos entre la primera y la segunda barra** y aun así recibe una letra dura, que el Panel RRHH muestra como identidad.

**Propuesta: clasificar por la distancia entre la 1ª y la 2ª letra, medida en preguntas (netos), no en la escala 0-100.**

```
gap = neto[principal] − neto[secundaria]      // unidades = preguntas

gap >= 5   → definido      → "Perfil D"
gap 3-4    → moderado      → "Perfil D/I con predominio D"
gap 1-2    → leve          → "Perfil combinado D/I"
gap  0     → mixto         → "Perfil mixto, sin letra dominante clara"
```

**Por qué en preguntas y no en la escala 0-100:** la unidad es interpretable y estable. "Su letra principal supera a la segunda por 4 preguntas de 14" se puede explicar a un cliente y auditar a mano contra el detalle; "supera por 14 puntos de una escala ipsativa que suma 200" no.

**Por qué no los cortes del documento externo (15 / 8-14 / 4-7 / ≤3):** esos números fueron escritos mirando la escala vieja, la que sumaba 100 y donde ninguna barra pasaba de 46. Trasladarlos tal cual a la escala nueva sería arbitrario. Los valores de arriba son una propuesta inicial y **deben calibrarse con el mismo procedimiento que ya se usó para `UMBRAL_PREDOMINANTE`** (§10).

Consecuencia en el Panel RRHH: una persona con `nivel_definicion: 'mixto'` no se muestra como "D", se muestra como "Mixto (D-I)" y **no entra en la distribución por letra** — sí en ritmo, foco y cultura, que son continuos y no dependen de forzar una categoría.

---

## 5. Motor de textos: que el error sea imposible, no solo corregido

### El problema estructural

Hoy los textos se generan con cadenas de `if/else` sobre `pctMasDI` que producen párrafos completos (`script.js:516-790`), duplicados casi literalmente en `pdfGenerator.js:1986-2260`. Un solo número genera prosa sobre velocidad, sociabilidad, foco y motivación a la vez. Corregir las frases no impide que vuelvan a mezclarse: la arquitectura invita a ello, y encima hay que corregirlas dos veces (web y PDF) y pueden divergir.

### Propuesta

Archivo nuevo `public/informe/discTextos.js` (copia idéntica en `public/legacy/`), única fuente de contenido para web y PDF:

```js
window.DISCTextos = {
  RITMO: { activo: {...}, pausado: {...}, flexible: {...} },
  FOCO:  { tareas: {...}, personas: {...}, equilibrado: {...} },
  LETRA: { D: {...}, I: {...}, S: {...}, C: {...} },
  COMBINADO: { 'D/I':…, 'D/C':…, 'D/S':…, 'I/S':…, 'I/C':…, 'S/C':… },

  perfil(graf)  // devuelve { ritmo, foco, estilo } — tres bloques separados
}
```

`perfil()` compone en tres bloques independientes, en este orden:

1. **Ritmo** — recibe *solo* `graf.ritmo`.
2. **Foco** — recibe *solo* `graf.foco`.
3. **Estilo** — recibe `principal`, `secundaria`, `nivel_definicion`.

**Por qué esta separación y no simplemente reescribir las frases:** porque el bloque de ritmo no tiene acceso a los datos de foco. Es estructuralmente imposible que vuelva a escribir "activo, por lo tanto sociable". El bug de hoy no es un error de redacción, es un error de arquitectura.

### Regla de redacción (para quien escriba el contenido)

| Léxico | Va en |
|---|---|
| velocidad, urgencia, impaciencia, cambio, dinamismo, cautela, paciencia, reflexión | **Ritmo** |
| vínculos, empatía, comunicación, colaboración / resultados, procesos, datos, calidad, normas | **Foco** |
| persuasión, precisión, competitividad, mediación (mezclan ambos ejes) | **Letra** |

Esta tabla se vuelve un test automatizado (§10).

### Umbrales de texto

```
activo >= 60  → "Ritmo predominantemente activo"
activo <= 40  → "Ritmo predominantemente pausado"
resto         → "Ritmo flexible"
```

Idem para foco. Se usan 60/40 por coherencia con `UMBRAL_PREDOMINANTE`/`UMBRAL_BAJO` ya validados, y se calibran junto con el resto (§10). Que todos los umbrales del producto sean los mismos números es en sí un valor: hace el informe explicable.

---

## 6. La escala, dicha con honestidad

Tres cosas distintas necesitan tres nombres distintos en la interfaz:

| Nombre en pantalla | Qué es | Suma |
|---|---|---|
| **Frecuencias** | conteos brutos MÁS y MENOS por letra y parte (0-14) | MÁS = 14, MENOS = 14 |
| **Intensidad por letra** | (neto + 14) / 28 × 100 | ≈ 200 (constante) |
| **Ejes (ritmo / foco)** | (neto del eje + 14) / 28 × 100 | 100 cada par |

Texto propuesto para reemplazar `index.html:666-668` y `pdfGenerator.js:1724`:

> Cada barra mide la intensidad de esa letra (veces elegida como MÁS, menos las veces elegida como MENOS). Como el test es de elección forzada, subir en una letra implica bajar en otra: por eso las cuatro barras siempre suman alrededor de 200 y su promedio es siempre 50. Lo que se interpreta es la **posición relativa** de cada letra dentro del perfil — 60 o más marca una dimensión predominante, 40 o menos una poco marcada — y no el valor absoluto de la barra.

**Por qué decirlo en vez de arreglarlo:** no se puede arreglar. La ipsatividad es constitutiva de un test de elección forzada; cualquier normalización que se aplique va a seguir sumando una constante. Declararlo es la posición defendible frente a un cliente o un revisor; afirmar independencia es la posición que se cae en la primera revisión — como acaba de pasar.

---

## 7. Tests viejos: tres niveles de confianza en vez de una letra inventada

### Situación actual

Decisión de Fase 6: los tests viejos entran en todo el Panel RRHH sin ninguna marca, con la letra que produce el algoritmo anterior. El problema es que esa letra **es la que la auditoría demostró incorrecta**: para COMRURAL el panel sigue mostrando `D:0, I:7, S:11, C:1` con cinco personas cuya barra más alta es D. Y `calcularVectorNatural100` en su rama vieja produce vectores donde D≈I y S≈C **por construcción del algoritmo**, no por la persona; esos vectores entran hoy en `promedioVectorEquipo` (cultura) y en `afinidadPersonas`.

### Propuesta

No un aviso de "tu test es viejo" — eso ya se descartó y con razón. **Mostrar de cada test lo que ese test realmente midió:**

| Nivel | Quién | Qué se muestra |
|---|---|---|
| `letra` | tests con `detalle` | letras, ejes, rueda, estabilidad, todo |
| `eje` | tests viejos | **ritmo** (dato real, con MÁS y MENOS), frecuencias, tabla Parte I/II, estabilidad de eje |
| — | — | tests viejos **no** producen foco ni letras |

**Por qué el ritmo sí y el foco no:** los tests viejos guardaron "eligió del lado D/I" o "del lado S/C". Eso *es* el eje de ritmo, con dato real y con MENOS incluido. El foco, en cambio, requiere distinguir I de S y D de C — que es exactamente la información que se perdió. No es una decisión conservadora: es lo que hay.

En el Panel RRHH, una persona de nivel `eje` aparece como **"Activo" / "Pausado" / "Balanceado"** en lugar de una letra. Entra en el análisis de ritmo del equipo (que pasa a ser el análisis más poblado y más confiable del panel), y queda fuera de la distribución por letra, del vector de cultura y de la afinidad por distancia.

**Por qué esto es mejor que la decisión actual:** es la diferencia entre mostrar menos y mostrar algo falso. Visualmente no cuesta nada — "Activo" es una etiqueta legítima del modelo, no un disclaimer. Y elimina el artefacto D≈I / S≈C que hoy contamina cultura y afinidad de cualquier empresa con tests mixtos.

**Punto de decisión (§12.1):** los informes ya entregados de COMRURAL siguen mostrando cuatro barras fabricadas. Hay que elegir entre congelarlos como están (coherencia con lo entregado) o que al reabrirse muestren solo ritmo (coherencia con la verdad). Es una decisión comercial, no técnica.

---

## 8. Compatibilidad: dejar de emitir un solo porcentaje

### Por qué el modelo actual no alcanza

`afinidadPersonas` calcula `similitud_vector + 5 (si comparten ritmo) + 5 (si comparten prioridad) − adaptación/4` y emite un `%` con semáforo Alta/Media/Baja. Y la matriz de `CompatibilidadTab` pinta **verde el "mismo estilo"** (`Rrhh.jsx:642`, leyenda *"Bajo — mismo estilo"*).

El problema conceptual: **similitud no es compatibilidad**. Dos perfiles D son máximamente similares y estructuralmente conflictivos — compiten por control. El propio contenido del sistema lo dice: `DISC_COMPATIBILIDAD['D-D'].tensiones` habla de disputa por protagonismo, mientras el semáforo de la misma pantalla lo pinta verde. La pantalla se contradice a sí misma.

Y un número único invita a la lectura determinista ("85%, se llevan bien") que hay que evitar.

### Propuesta: tres lecturas separadas, sin agregado

```
1. RITMO      |activo_A − activo_B|   → fricción probable en TIEMPOS
                                        0-10 casi nula · 11-20 leve
                                        21-35 moderada · >35 alta

2. FOCO       |tareas_A − tareas_B|   → acuerdo o tensión en PRIORIDADES
                                        similar = coinciden en qué atender primero
                                        distinto = complementariedad o choque, según el par

3. ESTILO     par (principal_A, principal_B) → riesgo de ROL
                                        tabla explícita de 10 pares
                                        (D-D: competencia por control, etc.)

+ PRESIÓN     dirección del cambio de cada uno bajo presión
              (no la magnitud: importa si uno acelera mientras el otro se repliega)
```

Cada lectura devuelve **fortaleza + riesgo**, nunca un veredicto. La redacción sigue el criterio del documento externo: *"presentan condiciones favorables en X, con posibles tensiones en Y"*, nunca *"se van a llevar bien"*.

Cambios concretos:

- `narrativaRelacion` — reescribir "Se van a entender rápido y sin fricción" y `DISC_COMPATIBILIDAD['D-D'].similitudes` ("se entienden al instante").
- Matriz de `CompatibilidadTab` — el semáforo deja de ser riesgo Bajo/Medio/Alto y pasa a **tipo de fricción probable**: `ritmo` / `prioridad` / `ambos` / `espejo`. D-D es `espejo`, no verde.
- Se conserva todo el contenido cualitativo por par (está bien escrito y es la parte que RRHH efectivamente usa).

**Sobre los pesos 30/25/20/15/10 del documento externo:** no se adoptan. Son razonables pero arbitrarios, y al combinarlos en un solo número se vuelve a perder la distinción entre "chocan por tiempos" y "chocan por prioridades", que es justamente lo accionable para RRHH. Tres lecturas separadas dan más información con menos supuestos.

---

## 9. Estabilidad: un ajuste menor

La fórmula actual (suma de `|neto_natural − neto_adaptado|` en las 4 letras, cortes 10/20) está validada por simulación y se conserva.

Ajuste: `|Δneto|` **cancela** cuando MÁS y MENOS de una letra se mueven juntos. Ejemplo real: MÁS D pasa de 5 a 8 y MENOS D de 2 a 5 → el neto no se mueve, pero la persona cambió su relación con esa dimensión en 6 elecciones. Medido sobre 20.000 perfiles, la fórmula de 8 variables absolutas da un valor mayor que la actual en el **62,7% de los casos**, con un exceso medio de 2,5 puntos.

Propuesta: mantener el neto como titular (es el que está calibrado) y agregar un flag `estabilidad.alerta_menos` cuando la suma de las 8 diferencias absolutas supere a la de netos por más de un margen a calibrar. No cambia el veredicto; agrega una nota del tipo *"el cambio se da sobre todo en lo que rechaza, no en lo que elige"*, que es información útil y hoy se pierde.

---

## 10. Verificación

### Fixtures dorados

Codificar como `detalle` real de 28 pares (no como vectores sueltos) los siguientes casos, en `scripts/fixtures/perfiles_referencia.json`:

- los 4 casos del documento externo, **reconstruidos** para la escala nueva (los números 43/32/7/18 son de la escala vieja y no son reproducibles tal cual);
- perfil plano (todas las letras iguales);
- empate exacto entre dos letras;
- D natural → S adaptado (el caso que hoy hace divergir panel e informe);
- C natural → I adaptado;
- un perfil `eje` (test viejo) para validar el camino de §7.

### Invariantes automáticos

Nuevo `scripts/disc-invariantes.mjs`, corrido sobre los fixtures y sobre N perfiles aleatorios:

```
Σ MÁS = Σ MENOS = 14 por parte
ritmo.activo + ritmo.pausado = 100
foco.tareas  + foco.personas = 100
principal = argmax(valores) de la MISMA gráfica
letra del Panel RRHH  ==  principal de la gráfica Natural del informe   ← hoy no se verifica
sector del ángulo de la rueda ∈ { principal, secundaria }
celda calculada == celda dibujada por el renderer
nivel_definicion coherente con gap
```

El quinto es el que faltaba: `disc-auditar.mjs` verifica que cada dominante sea el máximo de *su propia* tabla, lo cual es cierto por construcción y no detecta la Causa B.

### Lint de textos

Test que recorre `discTextos.js` y falla si un texto del bloque **ritmo** contiene una palabra del léxico de **foco** o viceversa, según la tabla de §5. Es barato y ataca exactamente la regresión que estamos arreglando.

### Regresión

`disc-regresion.mjs` debe seguir en verde en cada fase para los tests viejos que se dejen sin tocar. Si se adopta §7 con cambio visual para tests viejos, la baseline se regenera **una vez**, documentando el diff.

---

## 11. Plan por fases

Cada fase es desplegable por separado y deja el sistema coherente.

| Fase | Qué | Por qué en este orden | Riesgo |
|---|---|---|---|
| **1** | `script.js:631` — corregir la inversión tareas/personas. Ajustar textos de escala (`index.html:667`, `pdfGenerator.js:1724`) y la leyenda obsoleta de `pdfGenerator.js:2649` | Son errores factuales que se le están mostrando a gente hoy y no dependen de nada más | Nulo |
| **2** | `discCore` v3: `ritmo`, `foco`, `principal`/`secundaria`/`gap`/`nivel_definicion`. Sin cambiar ningún consumidor todavía | Habilita todo lo demás; aditivo, nadie lo lee aún | Nulo |
| **3** | `discTextos.js` + informe y PDF consumiéndolo. Nueva sección de ejes | El cambio de fondo del documento externo. Es el más grande y el más visible | Medio — cambia todo el copy |
| **4** | Eliminar `total` como perfil. Dos gráficos de barras. RRHH lee `natural.principal` | Requiere que la sección de ejes ya esté, para que la persona vea ejes donde antes veía la barra combinada | Medio — cambia el gráfico principal |
| **5** | Niveles de confianza (§7) y Panel RRHH sobre ellos | Depende de que ritmo exista como campo (fase 2) | Alto — toca lo que ve el cliente actual |
| **6** | Compatibilidad: tres lecturas, matriz de tipo de fricción, redacción no determinista | Independiente del resto; se puede adelantar si RRHH lo pide | Bajo |
| **7** | Fixtures, invariantes, lint de textos, calibración por simulación de los umbrales de §4 y §5 | Cierra el ciclo. La calibración necesita el código de las fases 2-4 | Nulo |

Las fases 1, 2 y 6 no tienen impacto visual y pueden ir de inmediato. Las fases 3, 4 y 5 conviene agruparlas en un único deploy anunciado, porque juntas cambian cómo se lee el informe.

### Procedimiento de calibración (fase 7)

El mismo que ya se usó y quedó documentado en `INFORME_INTEGRAL_DISC.md` §7.3: 40.000 tests simulados por escenario con el núcleo real, midiendo para cada umbral candidato la tasa de acierto en perfiles con preferencia conocida y la tasa de falso positivo en respuestas al azar. Se aplica a: cortes de `nivel_definicion` (§4), cortes de ritmo/foco para texto (§5) y margen de `alerta_menos` (§9).

---

## 12. Decisiones que hacen falta

**12.1 — Informes viejos ya entregados.** ¿Se congelan como están (siguen mostrando las cuatro barras fabricadas, coherentes con el PDF que el cliente recibió) o al reabrirse pasan a mostrar solo ritmo? *Recomendación: congelar los PDF entregados, aplicar el modo `eje` solo al informe web y al Panel RRHH.* Así nadie ve un informe distinto al que le dieron, pero el panel interno deja de trabajar sobre letras inventadas.

**12.2 — Gráfico de barras del informe.** ¿Dos gráficos (Natural y Adaptado) o uno solo con las barras de Natural y el Adaptado superpuesto en otra tonalidad? *Recomendación: dos gráficos.* Es lo estándar en DISC y evita que se lea una barra como si fuera el perfil único.

**12.3 — COMRURAL.** Con el modo `eje`, su panel pasaría de mostrar 19 letras a mostrar 19 ritmos. ¿Se comunica al cliente, se acompaña con la oferta de re-tomar el test, o se espera? Es la única vía para que tengan letras: el dato no existe en sus respuestas.

**12.4 — Nomenclatura (quedó cerrada en Fase 5, no la reabro).** Sugerencia de bajo costo: imprimir siempre la letra junto al nombre comercial (`Sensato (S)`, `Conector (I)`) en las cuatro superficies. No cambia ninguna decisión tomada y permite que una persona cruce el informe, la landing, el panel y el Pack Líder sin creer que le hablan de cuatro cosas distintas.

---

## 13. Qué NO propongo tocar

- El cálculo de netos, la media circular de la rueda y la numeración de celdas: están correctos y verificados.
- Los umbrales `UMBRAL_PREDOMINANTE = 60` / `UMBRAL_BAJO = 40` y los cortes de estabilidad 10/20: validados por simulación, se conservan.
- Las cuatro cards de frecuencias MÁS/MENOS y la tabla Parte I / Parte II: la auditoría las validó como el dato defendible.
- El contenido cualitativo de `DISC_COMPATIBILIDAD` y `DISC_PAIR_ADVICE`: está bien escrito, solo cambia cómo se decide mostrarlo.
- El camino legacy completo (`calcularValoresDISC`, `discToWheel` viejo): sigue intacto para no romper la regresión.
- La decisión de que el cambio de algoritmo sea invisible para el usuario: se mantiene. Nada de lo propuesto agrega avisos de versión.
