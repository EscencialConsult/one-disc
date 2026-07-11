/**
 * ruedaSuccessInsights5niveles.js
 * -----------------------------------------------------------------------------
 * Rueda polar tipo Success Insights (personalizada a 5 niveles):
 *
 * Niveles (de adentro hacia afuera):
 *  - Nivel 1: 57..60  (4 cuñas, 90°)
 *  - Nivel 2: 41..56  (16 cuñas, 22.5°)
 *  - Nivel 3: 25..40  (16 cuñas, 22.5°)
 *  - Nivel 4:  9..24  (16 cuñas, 22.5°)
 *  - Nivel 5:  1.. 8  (8 cuñas, 45°)  <-- ÚNICO NIVEL COLOREADO
 *
 * Reglas:
 *  - Numeración: horario, comenzando desde "arriba" (12 en punto) dentro de cada nivel.
 *  - Roles: 8 sectores de 45° (arriba y horario). El color de cada celda se decide
 *    por el ángulo del centro de la cuña (roleIndexFromCenterCW).
 *
 * Requiere D3 v7+: <script src="https://cdn.jsdelivr.net/npm/d3@7/dist/d3.min.js"></script>
 *
 * Uso (ESM):
 *   import { renderRuedaSI5 } from "./ruedaSuccessInsights5niveles.js";
 *   renderRuedaSI5("#viz", { celdaNatural: 19, celdaAdaptada: 21 });
 */

const d3ref = (typeof d3 !== "undefined") ? d3 : null;

window.renderRuedaSI5 = function(svgTarget, opts = {}) {
  if (!d3ref) throw new Error("D3 no está disponible. Carga d3@7 antes de usar este módulo.");

  const {
    width = 900,
    height = 900,

    // Radios base (ajusta a gusto)
    R_OUT = 360,
    R_HUB = 55,

    // Entrada (marcadores)
    celdaNatural = null,
    celdaAdaptada = null,

    // Roles y colores (8 sectores de 45° desde arriba, horario)
    roles = [
      { name: "CONDUCTOR", fill: "#ef4444" },
      { name: "PERSUASOR", fill: "#f97316" },
      { name: "PROMOTOR", fill: "#facc15" },
      { name: "RELACIONADOR", fill: "#22c55e" },
      { name: "COLABORADOR", fill: "#10b981" },
      { name: "COORDINADOR", fill: "#14b8a6" },
      { name: "ANALIZADOR", fill: "#3b82f6" },
      { name: "IMPLEMENTADOR", fill: "#64748b" }
    ],

    // Grilla
    gridStroke = "#0f172a",
    gridOpacityMajor = 0.22,
    gridOpacityMinor = 0.12,
    textColor = "#0f172a",

    // Si quieres ocultar números de algunos niveles:
    showNumbers = true,
  } = opts;
  
  const svg = typeof svgTarget === "string" ? d3ref.select(svgTarget) : d3ref.select(svgTarget);
  svg.attr("viewBox", `0 0 ${width} ${height}`);

  // Limpia
  svg.selectAll("*").remove();

  const cx = width / 2;
  const cy = height / 2;
  const TAU = Math.PI * 2;
  const ROLE_STEP = TAU / 8;

  // 5 niveles (adentro -> afuera) con cuñas por nivel
  const LEVELS = [
    { key: "lvl1", from: 57, to: 60, wedges: 4 },  // 4
    { key: "lvl2", from: 41, to: 56, wedges: 16 },  // 16
    { key: "lvl3", from: 25, to: 40, wedges: 16 },  // 16
    { key: "lvl4", from: 9, to: 24, wedges: 16 },  // 16
    { key: "lvl5", from: 1, to: 8, wedges: 8 },  // 8  (externo coloreado)
  ];

  // Radios de frontera: hub + 5 niveles = 6 valores
  // Puedes ajustar estos cortes para que se parezca más a tu referencia.
  const RADII = [
    R_HUB,
    R_HUB + 80,   // fin lvl1
    R_HUB + 155,  // fin lvl2
    R_HUB + 230,  // fin lvl3
    R_HUB + 270,  // fin lvl4
    R_OUT         // fin lvl5 (externo)
  ];

  // --- helpers angulares ---
  // wedgeAngles: índice i (0..n-1) sobre total n
  // centro = arriba (12) y horario
  function wedgeAngles(i, totalWedges) {
    const step = TAU / totalWedges;
    const centerCW = (i + 0.5) * step;          // 0..TAU, 0 "arriba", horario
    const centerD3 = (Math.PI / 2) - centerCW;  // convención D3
    return {
      start: centerD3 - step / 2,
      end: centerD3 + step / 2,
      centerCW,
      centerD3,
      step
    };
  }

  function roleIndexFromCenterCW(centerCW) {
    return Math.floor((centerCW % TAU) / ROLE_STEP); // 0..7
  }

  // --- capa raíz + fondo ---
  // --- capa raíz + fondo ---
const gRoot = svg.append("g");
gRoot.append("rect")
  .attr("x", 0).attr("y", 0).attr("width", width).attr("height", height)
  .attr("fill", "#0f1424")  // ← Solo cambiar esto a oscuro
  .attr("rx", 16);  // Bordes redondeados opcionales

  // --- generar todas las cuñas de los 5 niveles ---
  const allWedges = [];
  const cellToPos = new Map(); // celda -> { angle, r }

  LEVELS.forEach((lvl, ringIdx) => {
    const innerR = RADII[ringIdx];
    const outerR = RADII[ringIdx + 1];
    const rNum = (innerR + outerR) / 2;

    for (let i = 0; i < lvl.wedges; i++) {
      const a = wedgeAngles(i, lvl.wedges);
      let cell;

      if (lvl.wedges === 16) {
        // Regla especial: shift +1 y wrap al final
        cell = (i === 15) ? lvl.from : (lvl.from + i + 1);
      } else {
        // Regla normal para 4 y 8 (y cualquier otro)
        cell = lvl.from + i;
      }

      const roleIdx = roleIndexFromCenterCW(a.centerCW);

      allWedges.push({
        levelKey: lvl.key,
        ringIdx,
        innerR,
        outerR,
        wedge: i,
        wedgesTotal: lvl.wedges,
        cell,
        roleIdx,
        startAngle: a.start,
        endAngle: a.end,
        centerAngle: a.centerD3,
        rNum
      });

      cellToPos.set(cell, { angle: a.centerD3, r: rNum });
    }
  });

  // --- dibujar anillos (solo externo coloreado) ---
  const gRings = gRoot.append("g").attr("transform", `translate(${cx},${cy})`);
  const arc = d3ref.arc();

  gRings.selectAll("path.cell")
    .data(allWedges)
    .join("path")
    .attr("class", "cell")
    .attr("d", d => arc({
      innerRadius: d.innerR,
      outerRadius: d.outerR,
      startAngle: d.startAngle,
      endAngle: d.endAngle
    }))
    .attr("fill", d => {
      if (d.levelKey === "lvl5") return roles[d.roleIdx]?.fill ?? "#e2e8f0";
      return "#ffffff";
    })
    .attr("opacity", d => d.levelKey === "lvl5" ? 0.85 : 1);

  // --- grilla (círculos fronteras) ---
  const gGrid = gRoot.append("g");
  const borders = RADII.slice(0); // incluye R_HUB y R_OUT
  gGrid.selectAll("circle.border")
    .data(borders)
    .join("circle")
    .attr("class", "border")
    .attr("cx", cx).attr("cy", cy)
    .attr("r", r => r)
    .attr("fill", r => (r === R_HUB ? "#ffffff" : "none"))
    .attr("stroke", gridStroke)
    .attr("stroke-opacity", r => (r === R_OUT ? gridOpacityMajor : gridOpacityMajor))
    .attr("stroke-width", r => (r === R_OUT ? 2 : 1.5));

  // --- grilla: radios de roles (45°) como líneas mayores ---
  // Líneas desde hub hasta R_OUT en los límites de cada rol.
  for (let k = 0; k < 8; k++) {
    const boundaryCW = k * ROLE_STEP;           // 0..2pi
    const boundaryD3 = (Math.PI / 2) - boundaryCW;
    const x1 = cx + R_HUB * Math.cos(boundaryD3);
    const y1 = cy - R_HUB * Math.sin(boundaryD3);
    const x2 = cx + R_OUT * Math.cos(boundaryD3);
    const y2 = cy - R_OUT * Math.sin(boundaryD3);

    gGrid.append("line")
      .attr("x1", x1).attr("y1", y1)
      .attr("x2", x2).attr("y2", y2)
      .attr("stroke", gridStroke)
      .attr("stroke-opacity", gridOpacityMajor)
      .attr("stroke-width", 2);
  }

  // --- aro decorativo externo (sin divisiones) ---
const DECOR_COLOR = "#cac9c6";
const DECOR_THICKNESS = 14; // ajusta el grosor

const gDecor = gRoot.append("g").attr("transform", `translate(${cx},${cy})`);

const decorArc = d3ref.arc()
  .innerRadius(R_OUT + 6)                    // separación respecto al anillo externo actual
  .outerRadius(R_OUT + 6 + DECOR_THICKNESS)  // grosor
  .startAngle(0)
  .endAngle(Math.PI * 2);

gDecor.append("path")
  .attr("d", decorArc())
  .attr("fill", DECOR_COLOR);


  // --- grilla: divisiones por nivel (líneas menores) ---
  // Dibujamos las líneas de borde entre cuñas para cada nivel, solo en su franja radial.
  function drawWedgeBoundariesForLevel(levelKey, wedgesTotal, rInner, rOuter, opacity = gridOpacityMinor) {
    for (let i = 0; i < wedgesTotal; i++) {
      const a = wedgeAngles(i, wedgesTotal);
      const ang = a.end; // borde derecho del wedge i
      const x1 = cx + rInner * Math.cos(ang);
      const y1 = cy - rInner * Math.sin(ang);
      const x2 = cx + rOuter * Math.cos(ang);
      const y2 = cy - rOuter * Math.sin(ang);

      gGrid.append("line")
        .attr("x1", x1).attr("y1", y1)
        .attr("x2", x2).attr("y2", y2)
        .attr("stroke", gridStroke)
        .attr("stroke-opacity", opacity)
        .attr("stroke-width", 1);
    }
  }

  // Aplica a cada nivel con sus radios
  LEVELS.forEach((lvl, idx) => {
    const rInner = RADII[idx];
    const rOuter = RADII[idx + 1];
    // Para el externo (lvl5), dejamos divisiones suaves para no “ensuciar” el color
    const op = (lvl.key === "lvl5") ? 0.18 : gridOpacityMinor;
    drawWedgeBoundariesForLevel(lvl.key, lvl.wedges, rInner, rOuter, op);
  });

  // --- etiquetas de roles (textPath sobre aro externo) ---
  // --- etiquetas de roles (SIN textPath) ---
  // Texto tangencial centrado en cada sector de 45°, con auto-flip para lectura
  const gLabels = gRoot.append("g");

  const outerInner = RADII[4];
  const outerOuter = RADII[5];
  const labelRadius = outerInner + (outerOuter - outerInner) * 0.42;
  // antes era 0.50 (centro exacto)
  // 0.42 lo mete un poco hacia adentro → queda visualmente centrado


  // helper: parte un label largo en 2 líneas (simple)
  function splitLabel(name) {
    // Si quieres reglas específicas por palabra, edítalo acá.
    // Ej: "RELACIONADOR" => ["RELACIO", "NADOR"]
    if (name.length <= 10) return [name];

    // Si tiene espacio, corta por espacio (2 líneas max)
    if (name.includes(" ")) {
      const parts = name.split(/\s+/);
      if (parts.length >= 2) return [parts[0], parts.slice(1).join(" ")];
    }

    // Si no tiene espacio, corta en 2 aprox
    const mid = Math.ceil(name.length / 2);
    return [name.slice(0, mid), name.slice(mid)];
  }

  // Centro angular de cada rol (en sentido horario desde arriba):
  // rol 0 -> 0°, rol 1 -> 45°, etc.
  for (let i = 0; i < 8; i++) {
    const centerCW = (i + 0.5) * (TAU / 8);      // 0 arriba, horario
    const ang = (Math.PI / 2) - centerCW;        // a convención D3 (0 derecha, CCW)

    const x = cx + labelRadius * Math.cos(ang);
    const y = cy - labelRadius * Math.sin(ang);

    // Rotación tangencial (grados). Tangente = ang - 90° en convención SVG,
    // pero como ya invertimos y, conviene usar esta forma:
    let rot = (centerCW * 180 / Math.PI) - 90;
    // horario desde arriba -> rotación
    rot += 90; // para que quede tangencial

    // Auto-flip: si está del lado izquierdo, rotamos 180 para que no quede al revés
    // (cos(ang) < 0 => lado izquierdo)
    const isLeft = Math.cos(ang) < 0;
    if (isLeft) rot += 180;


    const lines = splitLabel(roles[i].name);

    const t = gLabels.append("text")
      .attr("x", x)
      .attr("y", y)
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .attr("font-size", 9)
      .attr("font-weight", 900)
      .attr("letter-spacing", 1.2)
      .attr("fill", "#ffffff")
      .attr("transform", `rotate(${rot}, ${x}, ${y})`)
      .attr("dominant-baseline", "central")
      .attr("alignment-baseline", "central");


    if (lines.length === 1) {
      t.text(lines[0]);
    } else {
      // 2 líneas: ajusta dy para separarlas dentro del aro
      t.append("tspan")
        .attr("x", x)
        .attr("dy", "-0.35em")
        .text(lines[0]);

      t.append("tspan")
        .attr("x", x)
        .attr("dy", "1.10em")
        .text(lines[1]);
    }
  }


  // --- números (opcional) ---
  if (showNumbers) {
    const gNums = gRoot.append("g");

    const DEG = Math.PI / 180;

function numPosition(d) {
  // base
  let r = d.rNum;
  let ang = d.centerAngle;

  // ✅ SOLO para el anillo 57-60
  if (d.levelKey === "lvl1") {
    // 1) empuja radialmente hacia afuera (más cerca del borde del anillo)
    const inner = d.innerR;
    const outer = d.outerR;
    r = inner + (outer - inner) * 0.60;  // 0.50 era el centro; 0.70 lo acerca al borde

    // 2) pequeño offset angular para que no caiga sobre los ejes (líneas gruesas)
    ang = ang + (20 * DEG); // prueba 4..8°
  }

  return {
    x: cx + r * Math.cos(ang - (8 * DEG))  ,
    y: cy - r * Math.sin(ang - (6 * DEG))
  };
}

gNums.selectAll("text.num")
  .data(allWedges)
  .join("text")
  .attr("class", "num")
  .attr("x", d => numPosition(d).x)
  .attr("y", d => numPosition(d).y + 4)
  .attr("text-anchor", "middle")
  .attr("font-size", d => (d.levelKey === "lvl1" ? 14 : 12))
  .attr("font-weight", d => (d.levelKey === "lvl1" ? 900 : 700))
  .attr("fill", textColor)
  .attr("opacity", 0.82)
  .text(d => d.cell);

  }

  // --- marcadores ---
  const gMarks = gRoot.append("g");

  function xyFromCell(cell) {
    const p = cellToPos.get(cell);
    if (!p) return null;
    return { x: cx + p.r * Math.cos(p.angle), y: cy - p.r * Math.sin(p.angle) };
  }

  function drawMarker(cell, kind) {
    if (cell == null) return;
    const p = xyFromCell(cell);
    if (!p) return;

    const R = kind === "natural" ? 16 : 18;

    gMarks.append("circle")
      .attr("cx", p.x).attr("cy", p.y)
      .attr("r", R)
      .attr("fill", "white")
      .attr("stroke", "#0f172a")
      .attr("stroke-width", 3);

    gMarks.append("text")
      .attr("x", p.x)
      .attr("y", p.y + (kind === "natural" ? 6 : 7))
      .attr("text-anchor", "middle")
      .attr("font-size", kind === "natural" ? 18 : 20)
      .attr("font-weight", 900)
      .attr("fill", "#0f172a")
      .text(kind === "natural" ? "○" : "★");
  }

  drawMarker(celdaNatural, "natural");
  drawMarker(celdaAdaptada, "adaptado");

  // --- leyenda ---
  // --- leyenda: posicionarla fuera del círculo (arriba-izquierda) ---
const legendX = cx - (R_OUT + 70);  // más a la izquierda del borde de la rueda
const legendY = cy - (R_OUT + 70);  // más arriba del borde de la rueda
const gLegend = gRoot.append("g").attr("transform", `translate(${legendX},${legendY})`);

  gLegend.append("rect")
    .attr("x", 0).attr("y", 0).attr("width", 260).attr("height", 84)
    .attr("rx", 12).attr("fill", "#ffffff").attr("stroke", "#e2e8f0");

  gLegend.append("text")
    .attr("x", 14).attr("y", 28)
    .attr("font-weight", 800)
    .attr("fill", textColor)
    .text("Marcadores");

  gLegend.append("text").attr("x", 18).attr("y", 54).attr("font-size", 18).attr("font-weight", 900).text("○");
  gLegend.append("text").attr("x", 40).attr("y", 54).attr("font-size", 14).attr("fill", "#334155").text("Natural");

  gLegend.append("text").attr("x", 18).attr("y", 76).attr("font-size", 18).attr("font-weight", 900).text("★");
  gLegend.append("text").attr("x", 40).attr("y", 76).attr("font-size", 14).attr("fill", "#334155").text("Adaptado");

//   return { cellToPos, allWedges, LEVELS, RADII };
return { cellToPos, allWedges, LEVELS, RADII };
}; // Cierre de la función window.renderRuedaSI5

