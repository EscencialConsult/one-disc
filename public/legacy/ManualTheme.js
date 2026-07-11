(function () {
  'use strict';

  const jsPDF = window.jspdf?.jsPDF;
  if (!jsPDF) throw new Error('jsPDF no está cargado. Cargá jspdf.umd.min.js antes de ManualTheme.js');

  /* ══════════════════════════════════════════════════════════════
     COLOR SYSTEM — ONE Escencial · Paleta oscura elegante
  ══════════════════════════════════════════════════════════════ */
  const C = {
    ink0:   [14,  14,  16],
    ink1:   [28,  28,  32],
    ink2:   [44,  44,  50],
    ink3:   [72,  72,  80],
    ink4:   [110,110, 118],
    ink5:   [158,158, 165],
    ink6:   [200,200, 206],
    ink7:   [228,228, 233],
    ink8:   [242,242, 246],
    ink9:   [250,250, 252],
    wh:     [255,255, 255],
    gold:   [168,148,  96],
    gold2:  [200,182, 128],
    gold3:  [232,222, 190],
    gold4:  [248,244, 232],
    tx:     [28,  28,  32],
    mu:     [110,110, 118],
    fa:     [168,168, 175],
    ln:     [220,220, 226],
    bg:     [248,248, 251],
    dR:   [168, 52,  44],
    iO:   [172,108,  44],
    sG:   [58, 118,  82],
    cB:   [52,  92, 158],
  };

  const PW  = 210;
  const PH  = 297;
  const MX  = 12;
  const CW  = PW - MX * 2;
  const HDR = 17;
  const FY  = 286;
  const CT  = 24;
  const MB  = 8;

  const DIM_COLOR = { D: C.dR, I: C.iO, S: C.sG, C: C.cB };

  function sf(doc, style, size, color) {
    doc.setFont('helvetica', style);
    doc.setFontSize(size);
    doc.setTextColor(...(color || C.tx));
  }

  function sw(doc, text, maxW) {
    return doc.splitTextToSize(String(text ?? ''), maxW);
  }

  function fr(doc, x, y, w, h, fill) {
    doc.setFillColor(...fill);
    doc.rect(x, y, w, h, 'F');
  }

  function rr(doc, x, y, w, h, r, fill, stroke, lw) {
    if (fill)   doc.setFillColor(...fill);
    if (stroke) { doc.setDrawColor(...stroke); doc.setLineWidth(lw || 0.25); }
    doc.roundedRect(x, y, w, h, r, r, fill && stroke ? 'FD' : fill ? 'F' : 'D');
  }

  function ensureSpace(doc, y, need, model) {
    if (y + need > FY - MB) return newPage(doc, model);
    return y;
  }

  /* ══════════════════════════════════════════════════════════════
     COVER PAGE
  ══════════════════════════════════════════════════════════════ */
  function drawCover(doc, model) {
    fr(doc, 0, 0, PW, PH, C.ink1);
    fr(doc, 0, 0, PW, 24, C.ink0);
    fr(doc, 0, 0, 3, PH, C.gold);

    // Logo letras en header portada — one-logoletra.png 800x400 ratio 2:1
    // h=13mm → w=26mm
    try {
      const hLogoP = new Image();
      hLogoP.src = '../img/one-logoletra.png';
      doc.addImage(hLogoP, 'PNG', 12, 5.5, 26, 13);
    } catch(e) {
      sf(doc, 'bold', 13, C.wh);
      doc.text('ONE', 12, 14);
    }
    sf(doc, 'normal', 7.5, C.gold2);
    doc.text('Escencial · Desarrollo de Personas', 40, 14);

    rr(doc, PW - 52, 8, 40, 9, 2, C.ink2);
    sf(doc, 'normal', 7, C.ink5);
    doc.text('MODELO DISC · 2026', PW - 32, 13.8, { align: 'center' });

    doc.setDrawColor(...C.ink3);
    doc.setLineWidth(0.3);
    doc.line(12, 28, PW - 12, 28);

    // Logo one-logocolor centrado entre MANUAL (y=60) y DE (y=78)
    // ratio 2:1 → h=32mm w=64mm; centro vertical=69 → top=53
    try {
      const sideLogo = new Image();
      sideLogo.src = '../img/one-logocolor.png';
      doc.addImage(sideLogo, 'PNG', 120, 53, 64, 32);
    } catch(e) {}

    sf(doc, 'bold', 42, C.wh);
    doc.text('MANUAL', 15, 60);
    sf(doc, 'bold', 42, C.ink5);
    doc.text('DE', 15, 78);
    sf(doc, 'normal', 14, C.gold2);
    doc.text('LIDERAZGO  PERSONALIZADO  DISC', 15, 90);
    fr(doc, 15, 96, 80, 0.6, C.gold);

    rr(doc, 12, 103, CW, 56, 3, C.ink2);
    fr(doc, 12, 103, 4, 56, C.gold);

    sf(doc, 'normal', 7, C.ink5);
    doc.text('MATERIAL PREPARADO PARA', 22, 114);
    sf(doc, 'bold', 22, C.wh);
    doc.text(model.fullName, 22, 127);
    sf(doc, 'bold', 10, C.gold2);
    doc.text(model.profileLabel, 22, 137);

    doc.setDrawColor(...C.ink3);
    doc.setLineWidth(0.3);
    doc.line(22, 142, 12 + CW - 6, 142);

    sf(doc, 'normal', 7.5, C.ink5);
    doc.text(`Evaluación: ${model.dateText}   ·   ${model.admin}`, 22, 148);
    doc.text(`Perfil: ${model.profileCode}  ·  Metodología DISC — Método Cleaver`, 22, 154);

    sf(doc, 'bold', 8, C.ink4);
    doc.text('PUNTAJES DISC', 12, 168);

    const dims = ['D','I','S','C'];
    const dimNames = ['Dominancia','Influencia','Estabilidad','Cumplimiento'];
    const cardW = (CW - 9) / 4;

    dims.forEach((d, i) => {
      const cx = 12 + i * (cardW + 3);
      const cy = 172;
      const score = model.scores[d];
      const col = DIM_COLOR[d];
      rr(doc, cx, cy, cardW, 24, 2, C.ink2);
      fr(doc, cx, cy, cardW, 2.5, col);
      sf(doc, 'bold', 14, col);
      doc.text(d, cx + 4, cy + 12);
      sf(doc, 'bold', 12, C.wh);
      doc.text(`${score}%`, cx + 4, cy + 20);
      sf(doc, 'normal', 6, C.ink5);
      doc.text(dimNames[i], cx + cardW - 3, cy + 20, { align: 'right' });
      const bx = cx + 4, by = cy + 21.5, bw = cardW - 8;
      fr(doc, bx, by, bw, 1.5, C.ink3);
      fr(doc, bx, by, bw * Math.min(score, 100) / 100, 1.5, col);
    });

    rr(doc, 12, 204, CW, 36, 3, C.ink2);
    fr(doc, 12, 204, 3, 36, C.gold);
    sf(doc, 'bold', 7, C.gold2);
    doc.text('FRASE DE LIDERAZGO', 20, 213);
    sf(doc, 'italic', 9.5, C.wh);
    const qLines = sw(doc, `"${model.quote}"`, CW - 20);
    doc.text(qLines, 20, 221);

    rr(doc, 12, 247, CW, 36, 3, C.ink2);
    fr(doc, 12, 247, 3, 36, C.gold);
    sf(doc, 'bold', 7, C.ink5);
    doc.text('RESUMEN DEL PERFIL', 20, 256);
    sf(doc, 'normal', 8.5, C.ink6);
    const sLines = sw(doc, model.summary, CW - 18);
    doc.text(sLines, 20, 263);

    sf(doc, 'normal', 6.5, C.ink4);
    doc.text('Documento confidencial · ONE Escencial · Plataforma DISC', PW / 2, PH - 7, { align: 'center' });
  }

  /* ══════════════════════════════════════════════════════════════
     CONTENT PAGE CHROME
  ══════════════════════════════════════════════════════════════ */
  function drawChrome(doc, model) {
    fr(doc, 0, 0, PW, PH, C.bg);
    fr(doc, 0, 0, PW, HDR, C.ink1);
    fr(doc, 0, 0, 3, PH, C.gold);

    // Logo letras en header de páginas de contenido
    // one-logoletra.png: 800×400px → ratio 2:1 → h=11mm, w=22mm
    try {
      const hImg = new Image();
      hImg.src = '../img/one-logoletra.png';
      doc.addImage(hImg, 'PNG', MX + 1, 3, 22, 11);
    } catch(e) {
      sf(doc, 'bold', 9, C.wh);
      doc.text('ONE', MX + 2, 9);
    }
    sf(doc, 'normal', 6.5, C.ink5);
    doc.text('Manual de Liderazgo Personalizado DISC', MX + 26, 14.5);

    rr(doc, PW - 66, 4, 54, 9, 2, C.ink2);
    sf(doc, 'bold', 6.5, C.gold2);
    doc.text(model.profileLabel, PW - 39, 9.5, { align: 'center' });

    // Marca de agua centrada en páginas de contenido
    try {
      const mwImg2 = new Image();
      mwImg2.src = '../img/one-iconocolor.png';
      // 500x500px → ratio 1:1 → 80x80mm centrado
      doc.saveGraphicsState();
      doc.setGState(new doc.GState({ opacity: 0.09 }));
      doc.addImage(mwImg2, 'PNG', (210 - 104) / 2, (297 - 104) / 2, 104, 104);
      doc.restoreGraphicsState();
    } catch(e) {}

    doc.setDrawColor(...C.gold3);
    doc.setLineWidth(0.4);
    doc.line(MX, FY, MX + CW, FY);

    sf(doc, 'normal', 6.5, C.mu);
    doc.text(model.fullName, MX + 3, FY + 4.5);
    doc.text(model.dateText, PW / 2, FY + 4.5, { align: 'center' });
    doc.text(`Perfil ${model.profileCode}`, PW - MX, FY + 4.5, { align: 'right' });
  }

  function newPage(doc, model) {
    doc.addPage();
    drawChrome(doc, model);
    return CT;
  }

  /* ══════════════════════════════════════════════════════════════
     TABLE OF CONTENTS
  ══════════════════════════════════════════════════════════════ */
  function drawTOC(doc, model) {
    let y = newPage(doc, model);

    rr(doc, MX, y, CW, 13, 2, C.ink1);
    sf(doc, 'bold', 11, C.wh);
    doc.text('ÍNDICE DEL MANUAL', MX + 6, y + 9);
    y += 17;

    const titles = [
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

    titles.forEach((title, i) => {
      const even = i % 2 === 0;
      fr(doc, MX, y - 3, CW, 9.5, even ? C.ink8 : C.wh);
      rr(doc, MX + 2, y - 2.5, 7.5, 7, 1.5, C.ink1);
      sf(doc, 'bold', 7.5, C.gold2);
      doc.text(String(i + 1).padStart(2, '0'), MX + 5.75, y + 2, { align: 'center' });
      sf(doc, 'normal', 9.5, C.tx);
      doc.text(title, MX + 13, y + 2);
      const tw2 = doc.getTextWidth(title);
      doc.setFillColor(...C.ln);
      for (let dx = MX + 13 + tw2 + 3; dx < PW - MX - 8; dx += 2.2) {
        doc.circle(dx, y + 1.2, 0.22, 'F');
      }
      y += 9.5;
    });

    y += 7;
    doc.setDrawColor(...C.gold3);
    doc.setLineWidth(0.4);
    doc.line(MX, y, MX + CW, y);
    y += 7;

    sf(doc, 'italic', 9, C.mu);
    doc.text('"El liderazgo más efectivo comienza con el profundo conocimiento de uno mismo."', PW / 2, y, { align: 'center' });
    y += 5;
    sf(doc, 'normal', 7, C.fa);
    doc.text('Basado en el Modelo DISC — Método Cleaver', PW / 2, y, { align: 'center' });
  }

  /* ══════════════════════════════════════════════════════════════
     SECTION BANNER
  ══════════════════════════════════════════════════════════════ */
  function drawBanner(doc, y, section, idx) {
    const bh = 15;
    rr(doc, MX, y, CW, bh, 2, C.ink1);
    fr(doc, MX, y, 3, bh, C.gold);
    rr(doc, MX + 6, y + 3, 9, 9, 2, C.ink2);
    sf(doc, 'bold', 7.5, C.gold2);
    doc.text(String(idx + 1).padStart(2, '0'), MX + 10.5, y + 9, { align: 'center' });
    sf(doc, 'bold', 11, C.wh);
    doc.text(section.title, MX + 20, y + 10);
    return y + bh + 4;
  }

  /* ══════════════════════════════════════════════════════════════
     CONTENT BLOCK RENDERERS
  ══════════════════════════════════════════════════════════════ */

  function renderPara(doc, y, block, model) {
    const x   = MX + 3;
    const mw  = CW - 8;
    const lh  = block.lineH || 4.4;
    sf(doc,
      block.bold ? 'bold' : block.italic ? 'italic' : 'normal',
      block.size || 9.8,
      block.color || C.tx
    );
    // Soportar saltos de línea explícitos en el texto
    const rawLines = String(block.text ?? '').split('\n');
    const lines = rawLines.flatMap(l => doc.splitTextToSize(l, mw));
    const bh  = lines.length * lh + 1;
    y = ensureSpace(doc, y, bh, model);
    doc.text(lines, x, y);
    return y + bh;
  }

  function renderSubtitle(doc, y, block, model) {
    // Reservar espacio para el subtítulo + al menos 20mm de contenido siguiente
    y = ensureSpace(doc, y + 2, 26, model);
    sf(doc, 'bold', 10, block.color || C.ink1);
    doc.text(block.text, MX + 3, y);
    const tw = doc.getTextWidth(block.text);
    fr(doc, MX + 3, y + 2, tw + 2, 0.6, C.gold);
    return y + 6.5;
  }

  function renderBullets(doc, y, items, model, opts = {}) {
    const bCol   = opts.bulletColor || C.gold;
    const indent = opts.indent || 0;
    for (const item of items) {
      y = ensureSpace(doc, y, 6, model);
      const x  = MX + 3 + indent;
      const mw = CW - 6 - indent - 7;
      doc.setFillColor(...bCol);
      doc.circle(x + 1.2, y - 1.6, 1.2, 'F');
      sf(doc, 'normal', 9.2, opts.color || C.tx);
      const lines = sw(doc, item, mw);
      doc.text(lines, x + 5.5, y);
      y += lines.length * 4.3 + 1;
    }
    return y + 0.5;
  }

  function renderNumbered(doc, y, items, model) {
    for (let i = 0; i < items.length; i++) {
      y = ensureSpace(doc, y, 10, model);
      const x  = MX + 3;
      const mw = CW - 13;
      rr(doc, x, y - 4.5, 7.5, 6.5, 1.5, C.ink8, C.ln, 0.2);
      sf(doc, 'bold', 7.5, C.gold);
      doc.text(String(i + 1), x + 3.75, y, { align: 'center' });
      sf(doc, 'normal', 9.2, C.tx);
      const lines = sw(doc, items[i], mw);
      doc.text(lines, x + 11, y);
      y += lines.length * 4.3 + 1.5;
    }
    return y + 0.5;
  }

  function renderQuote(doc, y, block, model) {
    const x      = MX + 3;
    const tw     = CW - 3;
    const textX  = x + 14;
    // Ancho real disponible: desde textX hasta el borde derecho de la caja (x+tw), menos 6mm de padding derecho
    const textMaxW = (x + tw) - textX - 6;
    sf(doc, 'italic', 8.5, C.ink2);
    const lines = sw(doc, block.text, textMaxW);
    const bh    = lines.length * 5.2 + 14;
    y = ensureSpace(doc, y, bh + 3, model);
    rr(doc, x, y, tw, bh, 2, C.ink8, C.ln, 0.2);
    fr(doc, x, y, 3, bh, C.gold);
    sf(doc, 'bold', 13, C.gold3);
    doc.text('"', x + 7, y + 10);
    sf(doc, 'italic', 8.5, C.ink2);
    doc.text(lines, textX, y + 9);
    return y + bh + 3;
  }

  function renderInfoCard(doc, y, block, model) {
    const x     = MX + 3;
    const tw    = CW - 3;
    const color = block.color || C.ink1;
    const textW  = tw - 16;
    sf(doc, 'normal', 9.2, C.tx);
    const bLines = doc.splitTextToSize(block.text || '', textW);
    const bh     = bLines.length * 4.8 + 18;
    if (y + bh + 6 > FY - MB) y = newPage(doc, model);
    rr(doc, x, y, tw, bh, 2, C.bg, C.ln, 0.2);
    fr(doc, x, y, tw, 8, color);
    rr(doc, x, y, tw, 8, 2, color);
    fr(doc, x, y + 5, tw, 3, color);
    sf(doc, 'bold', 7.5, C.wh);
    doc.text((block.title || '').toUpperCase(), x + 6, y + 6.5);
    sf(doc, 'normal', 9.2, C.tx);
    doc.text(bLines, x + 6, y + 15);
    return y + bh + 3;
  }

  function renderMetrics(doc, y, items, model) {
    const x    = MX + 3;
    const tw   = CW - 3;
    const gap  = 3;
    const n    = Math.min(items.length, 4);
    const colW = (tw - gap * (n - 1)) / n;
    y = ensureSpace(doc, y, 26, model);
    items.slice(0, n).forEach((m, i) => {
      const cx  = x + i * (colW + gap);
      const col = m.color || DIM_COLOR[m.label] || C.ink2;
      rr(doc, cx, y, colW, 22, 2, C.wh, C.ln, 0.2);
      fr(doc, cx, y, colW, 3, col);
      sf(doc, 'bold', 13, col);
      doc.text(m.label, cx + 4, y + 12);
      sf(doc, 'bold', 11, C.ink1);
      doc.text(`${m.value}`, cx + 4, y + 19);
      if (m.caption) {
        sf(doc, 'normal', 6.5, C.mu);
        doc.text(m.caption, cx + colW - 3, y + 19, { align: 'right' });
      }
      const bx = cx + 4, by = y + 20.5, bw = colW - 8;
      fr(doc, bx, by, bw, 1.5, C.ink7);
      fr(doc, bx, by, bw * Math.min(parseFloat(m.value) / 100, 1), 1.5, col);
    });
    return y + 26;
  }

  function renderTable(doc, y, block, model) {
    const { headers, rows, colWidths: fracs, headerBg, compact } = block;
    if (!rows?.length) return y;

    const x0   = MX + 3;
    const TW   = CW - 3;
    const colWs = fracs ? fracs.map(f => f * TW) : headers.map(() => TW / headers.length);
    const PAD  = compact ? 2 : 2.5;
    const LH   = compact ? 3.9 : 4.1;
    const FSZ  = compact ? 7.5 : 8.2;
    const hBg  = headerBg || C.ink1;

    const doHeader = (atY) => {
      rr(doc, x0, atY, TW, 8.5, 1.5, hBg);
      sf(doc, 'bold', 7.5, C.wh);
      let cx = x0;
      headers.forEach((h, i) => {
        doc.text(h, cx + PAD, atY + 6);
        cx += colWs[i];
      });
      return atY + 8.5;
    };

    // Calcular altura total de la tabla para intentar mantenerla junta
    const rowHeights = rows.map(row => {
      if (!Array.isArray(row)) return 0;
      let maxL = 1;
      row.forEach((cell, ci) => {
        if (ci < colWs.length) {
          maxL = Math.max(maxL, sw(doc, String(cell ?? ' '), colWs[ci] - PAD * 2 - 1).length);
        }
      });
      return maxL * LH + PAD * 2;
    });
    const totalTableH = 8.5 + rowHeights.reduce((a, b) => a + b, 0);
    // Si la tabla entera cabe en la página, reservar todo el espacio de una vez
    if (totalTableH <= (FY - MB - CT)) {
      y = ensureSpace(doc, y, totalTableH + 2, model);
    } else {
      y = ensureSpace(doc, y, 15, model);
    }
    y = doHeader(y);

    rows.forEach((row, rIdx) => {
      if (!Array.isArray(row)) return;
      let maxL = 1;
      row.forEach((cell, ci) => {
        if (ci < colWs.length) {
          maxL = Math.max(maxL, sw(doc, String(cell ?? ' '), colWs[ci] - PAD * 2 - 1).length);
        }
      });
      const rowH = Math.max(maxL * LH + PAD * 2, 10); // mínimo 10mm por fila

      if (y + rowH > FY - MB) {
        y = newPage(doc, model);
        y = doHeader(y);
      }

      fr(doc, x0, y, TW, rowH, rIdx % 2 === 0 ? C.ink8 : C.wh);

      let cx = x0;
      row.forEach((cell, ci) => {
        if (ci >= colWs.length) return;
        const cw      = colWs[ci] - PAD * 2 - 1;
        const isBold  = ci === 0;
        const isEmpty = String(cell ?? '').trim() === '' || String(cell ?? '').trim() === ' ';
        sf(doc, isBold ? 'bold' : 'normal', FSZ, isBold ? C.gold : C.tx);
        if (isEmpty && ci === 0) {
          // Columna # — solo el número de fila (rIdx+1)
          doc.text(String(rIdx + 1), cx + PAD, y + PAD + LH * 0.85);
        } else if (isEmpty && ci > 0) {
          // Celda vacía — dibujar línea de escritura
          const lineY = y + rowH - PAD - 1.5;
          doc.setDrawColor(...C.ink6);
          doc.setLineWidth(0.3);
          doc.line(cx + PAD, lineY, cx + colWs[ci] - PAD - 2, lineY);
        } else {
          const lines = sw(doc, String(cell), cw);
          doc.text(lines, cx + PAD, y + PAD + LH * 0.85);
        }
        cx += colWs[ci];
      });

      doc.setDrawColor(...C.ln);
      doc.setLineWidth(0.12);
      doc.line(x0, y + rowH, x0 + TW, y + rowH);
      y += rowH;
    });

    return y + 3;
  }

  function renderTwoCol(doc, y, block, model) {
    const x   = MX + 3;
    const tw  = CW - 3;
    const gap = 4;
    const cW  = (tw - gap) / 2;

    y = ensureSpace(doc, y, 18, model);

    if (block.leftTitle || block.rightTitle) {
      if (block.leftTitle) {
        rr(doc, x, y, cW, 7.5, 1.5, C.ink8, C.ln, 0.2);
        sf(doc, 'bold', 7.5, C.ink2);
        doc.text(block.leftTitle, x + 4, y + 5.5);
      }
      if (block.rightTitle) {
        rr(doc, x + cW + gap, y, cW, 7.5, 1.5, C.ink8, C.ln, 0.2);
        sf(doc, 'bold', 7.5, C.ink2);
        doc.text(block.rightTitle, x + cW + gap + 4, y + 5.5);
      }
      y += 11;
    }

    const lItems = block.leftItems  || [];
    const rItems = block.rightItems || [];

    for (let i = 0; i < Math.max(lItems.length, rItems.length); i++) {
      const lL = lItems[i] ? sw(doc, lItems[i], cW - 10) : [];
      const rL = rItems[i] ? sw(doc, rItems[i], cW - 10) : [];
      const mH = Math.max(lL.length, rL.length) * 4.2 + 4;

      y = ensureSpace(doc, y, mH + 1, model);

      if (lItems[i]) {
        doc.setFillColor(...C.gold);
        doc.circle(x + 1.2, y - 1.6, 1.1, 'F');
        sf(doc, 'normal', 8.8, C.tx);
        doc.text(lL, x + 5, y);
      }
      if (rItems[i]) {
        doc.setFillColor(...C.ink3);
        doc.circle(x + cW + gap + 1.2, y - 1.6, 1.1, 'F');
        sf(doc, 'normal', 8.8, C.tx);
        doc.text(rL, x + cW + gap + 5, y);
      }
      y += mH;
    }
    return y + 2;
  }

  function renderScenario(doc, y, block, model) {
    const x  = MX + 3;
    const tw = CW - 3;

    const parts = [
      { label: 'Tu respuesta natural', text: block.natural || '', color: C.ink3,  bg: C.ink8 },
      { label: 'Por qué funciona',     text: block.why     || '', color: C.sG,    bg: [238,248,242] },
      { label: 'Ajuste recomendado',   text: block.adjust  || '', color: C.gold,  bg: C.gold4 },
    ].filter(p => p.text);

    sf(doc, 'normal', 9, C.tx);
    let est = 13;
    parts.forEach(p => { est += 6.5 + sw(doc, p.text, tw - 14).length * 4.2 + 3; });

    y = ensureSpace(doc, y, Math.min(est, 50), model);

    rr(doc, x, y, tw, 11.5, 2, C.ink1);
    fr(doc, x, y, 3, 11.5, C.gold);
    sf(doc, 'bold', 6.5, C.gold2);
    doc.text((block.label || 'ESCENARIO').toUpperCase(), x + 6, y + 5);
    sf(doc, 'bold', 9, C.wh);
    doc.text(block.title || '', x + 6, y + 10.5);

    y += 13.5;

    parts.forEach(p => {
      const pL  = sw(doc, p.text, tw - 12);
      const pBh = 6.5 + pL.length * 4.2 + 3;
      y = ensureSpace(doc, y, pBh, model);
      rr(doc, x, y, tw, pBh, 1.5, p.bg, C.ln, 0.15);
      fr(doc, x, y, 2.5, pBh, p.color);
      sf(doc, 'bold', 7, p.color);
      doc.text(p.label + ':', x + 5.5, y + 5);
      sf(doc, 'normal', 8.8, C.tx);
      doc.text(pL, x + 5.5, y + 10);
      y += pBh + 1.5;
    });

    return y + 2.5;
  }

  function renderHighlight(doc, y, block, model) {
    const x     = MX + 3;
    const tw    = CW - 3;
    const color = block.color || C.ink2;
    const lines = sw(doc, block.text || '', tw - 14);
    const bh    = lines.length * 4.5 + 13;
    y = ensureSpace(doc, y, bh + 3, model);
    rr(doc, x, y, tw, bh, 2, block.bg || C.ink8, C.ln, 0.2);
    fr(doc, x, y, 3, bh, color);
    if (block.title) {
      sf(doc, 'bold', 7.5, color);
      doc.text(block.title, x + 7, y + 6.5);
      sf(doc, 'normal', 9.2, C.tx);
      doc.text(lines, x + 7, y + 12);
    } else {
      sf(doc, 'normal', 9.2, C.tx);
      doc.text(lines, x + 7, y + 7);
    }
    return y + bh + 3;
  }

  /* ══════════════════════════════════════════════════════════════
     SECTION RENDERER
  ══════════════════════════════════════════════════════════════ */
  function renderSection(doc, model, section, idx) {
    let y = newPage(doc, model);
    y = drawBanner(doc, y, section, idx);
    y += 1.5;

    if (section.intro) {
      sf(doc, 'italic', 9, C.mu);
      const lines = sw(doc, section.intro, CW - 3);
      doc.text(lines, MX + 3, y);
      y += lines.length * 4.3 + 3;
    }

    const blocks = section.blocks || [];

    // estimateH fuera del loop para evitar redefinición en cada iteración
    function estimateH(b) {
      if (!b) return 0;
      const TW2 = CW - 3;
      if (b.type === 'infoCard') {
        const lines = doc.splitTextToSize(b.text || '', TW2 - 14);
        return lines.length * 4.4 + 22;
      }
      if (b.type === 'table') {
        const fracs = b.colWidths || [];
        const colWs2 = fracs.length ? fracs.map(f => f * TW2) : (b.headers||[]).map(() => TW2/(b.headers||[1]).length);
        const PAD2 = b.compact ? 2 : 2.5;
        const LH2  = b.compact ? 3.9 : 4.1;
        let h = 8.5;
        (b.rows||[]).forEach(row => {
          if (!Array.isArray(row)) return;
          let maxL = 1;
          row.forEach((cell, ci) => {
            if (ci < colWs2.length) maxL = Math.max(maxL, doc.splitTextToSize(String(cell??''), colWs2[ci]-PAD2*2-1).length);
          });
          h += Math.max(maxL * LH2 + PAD2*2, 10);
        });
        return h + 3;
      }
      if (b.type === 'quote') {
        const lines = doc.splitTextToSize(b.text || '', TW2 - 22);
        return lines.length * 5.2 + 20;
      }
      if (b.type === 'paragraph') {
        const rawLines = String(b.text||'').split('\n');
        const lines = rawLines.flatMap(l => doc.splitTextToSize(l, CW-8));
        return lines.length * (b.lineH||4.4) + 4;
      }
      return 0;
    }

    for (let bi = 0; bi < blocks.length; bi++) {
      const block = blocks[bi];
      const next  = blocks[bi + 1];

      // Lookahead: pares que nunca deben separarse
      if (next && (block.type === 'infoCard' && next.type === 'table' ||
                   block.type === 'quote'    && next.type === 'paragraph')) {
        const combined = estimateH(block) + 5 + estimateH(next);
        if (y + combined > FY - MB) {
          y = newPage(doc, model);
        }
      }

      switch (block.type) {
        case 'paragraph':  y = renderPara(doc, y, block, model)           + 1.5; break;
        case 'subtitle':   y = renderSubtitle(doc, y, block, model)       + 1;   break;
        case 'bullets':    y = renderBullets(doc, y, block.items, model, block) + 1.5; break;
        case 'numbered':   y = renderNumbered(doc, y, block.items, model)  + 1.5; break;
        case 'quote':      y = renderQuote(doc, y, block, model)           + 1.5; break;
        case 'metrics':    y = renderMetrics(doc, y, block.items, model)   + 1.5; break;
        case 'table':      y = renderTable(doc, y, block, model)           + 1.5; break;
        case 'twoColumn':  y = renderTwoCol(doc, y, block, model)          + 1.5; break;
        case 'scenario':   y = renderScenario(doc, y, block, model)        + 2;   break;
        case 'infoCard':   y = renderInfoCard(doc, y, block, model)        + 1.5; break;
        case 'highlight':  y = renderHighlight(doc, y, block, model)       + 1.5; break;
        case 'divider':
          y = ensureSpace(doc, y + 2, 4, model);
          doc.setDrawColor(...C.ln);
          doc.setLineWidth(0.2);
          doc.line(MX + 3, y, MX + CW, y);
          y += 4;
          break;
      }
    }
  }

  /* ══════════════════════════════════════════════════════════════
     MAIN RENDER
  ══════════════════════════════════════════════════════════════ */
  function render(model) {
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    drawCover(doc, model);
    drawTOC(doc, model);
    model.sections.forEach((sec, i) => renderSection(doc, model, sec, i));
    return doc;
  }

  window.ManualTheme = { render };
})();