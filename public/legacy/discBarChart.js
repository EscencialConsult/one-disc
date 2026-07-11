/**
 * discBarChart.js
 * Genera el gráfico de barras DISC personalizado con valores D, I, S, C
 */

(function() {
  'use strict';

  /**
   * Renderiza el gráfico de barras DISC
   * @param {string} containerId - ID del contenedor SVG
   * @param {Object} data - Datos DISC { D, I, S, C } con valores 0-100
   */
  window.renderDISCBarChart = function(containerId, data) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error('Container not found:', containerId);
      return;
    }

    const { D, I, S, C } = data;

    // Dimensiones
    const width = 400;
    const height = 500;
    const barWidth = 70;
    const barSpacing = 20;
    const chartTop = 60;
    const chartBottom = height - 100;
    const chartHeight = chartBottom - chartTop;

    // Limpiar contenedor
    container.innerHTML = '';

    // Crear SVG
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.setAttribute('class', 'disc-bar-chart');

    // Colores DISC
    const colors = {
      D: { fill: '#dc2626', light: '#fca5a5' },
      I: { fill: '#f59e0b', light: '#fcd34d' },
      S: { fill: '#10b981', light: '#6ee7b7' },
      C: { fill: '#3b82f6', light: '#93c5fd' }
    };

    const dims = ['D', 'I', 'S', 'C'];
    const labels = ['D', 'I', 'S', 'C'];
    const startX = (width - (barWidth * 4 + barSpacing * 3)) / 2;

    // Líneas de guía horizontales (0, 20, 40, 60, 80, 100)
    const gridGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    gridGroup.setAttribute('class', 'grid-lines');
    
    for (let i = 0; i <= 100; i += 20) {
      const y = chartBottom - (i / 100) * chartHeight;
      
      // Línea
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', startX - 10);
      line.setAttribute('y1', y);
      line.setAttribute('x2', startX + barWidth * 4 + barSpacing * 3 + 10);
      line.setAttribute('y2', y);
      line.setAttribute('stroke', i === 0 ? '#1e293b' : '#e2e8f0');
      line.setAttribute('stroke-width', i === 0 ? '2' : '1');
      line.setAttribute('opacity', i === 0 ? '1' : '0.3');
      gridGroup.appendChild(line);

      // Etiqueta de valor
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', startX - 20);
      text.setAttribute('y', y + 4);
      text.setAttribute('text-anchor', 'end');
      text.setAttribute('font-size', '11');
      text.setAttribute('font-weight', '600');
      text.setAttribute('fill', '#64748b');
      text.textContent = i;
      gridGroup.appendChild(text);
    }
    svg.appendChild(gridGroup);

    // Barras DISC
    dims.forEach((dim, idx) => {
      const value = data[dim] || 0;
      const x = startX + idx * (barWidth + barSpacing);
      const barHeight = (value / 100) * chartHeight;
      const y = chartBottom - barHeight;

      // Grupo de barra
      const barGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      barGroup.setAttribute('class', `bar-group bar-${dim}`);

      // Barra principal
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', x);
      rect.setAttribute('y', y);
      rect.setAttribute('width', barWidth);
      rect.setAttribute('height', barHeight);
      rect.setAttribute('fill', colors[dim].fill);
      rect.setAttribute('rx', '6');
      
      // Animación
      rect.style.animation = `barGrow 0.8s ease-out ${idx * 0.1}s both`;
      barGroup.appendChild(rect);

      // Valor en la parte superior de la barra
      const valueText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      valueText.setAttribute('x', x + barWidth / 2);
      valueText.setAttribute('y', y - 8);
      valueText.setAttribute('text-anchor', 'middle');
      valueText.setAttribute('font-size', '16');
      valueText.setAttribute('font-weight', '800');
      valueText.setAttribute('fill', colors[dim].fill);
      valueText.setAttribute('font-family', "'Exo 2', sans-serif");
      valueText.textContent = value;
      barGroup.appendChild(valueText);

      // Etiqueta de dimensión en la parte superior
      const labelGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      
      // Rectángulo de fondo para la letra
      const labelBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      labelBg.setAttribute('x', x);
      labelBg.setAttribute('y', 15);
      labelBg.setAttribute('width', barWidth);
      labelBg.setAttribute('height', 28);
      labelBg.setAttribute('fill', colors[dim].fill);
      labelBg.setAttribute('rx', '6');
      labelGroup.appendChild(labelBg);

      const labelText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      labelText.setAttribute('x', x + barWidth / 2);
      labelText.setAttribute('y', 34);
      labelText.setAttribute('text-anchor', 'middle');
      labelText.setAttribute('font-size', '18');
      labelText.setAttribute('font-weight', '800');
      labelText.setAttribute('fill', '#ffffff');
      labelText.setAttribute('font-family', "'Exo 2', sans-serif");
      labelText.textContent = labels[idx];
      labelGroup.appendChild(labelText);

      barGroup.appendChild(labelGroup);

      // Badge circular con porcentaje en la parte inferior
      const badgeY = chartBottom + 35;
      
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', x + barWidth / 2);
      circle.setAttribute('cy', badgeY);
      circle.setAttribute('r', '22');
      circle.setAttribute('fill', '#ffffff');
      circle.setAttribute('stroke', colors[dim].fill);
      circle.setAttribute('stroke-width', '3');
      barGroup.appendChild(circle);

      const percentText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      percentText.setAttribute('x', x + barWidth / 2);
      percentText.setAttribute('y', badgeY + 5);
      percentText.setAttribute('text-anchor', 'middle');
      percentText.setAttribute('font-size', '14');
      percentText.setAttribute('font-weight', '800');
      percentText.setAttribute('fill', colors[dim].fill);
      percentText.setAttribute('font-family', "'DM Sans', sans-serif");
      percentText.textContent = value;
      barGroup.appendChild(percentText);

      svg.appendChild(barGroup);
    });

    // Agregar SVG al contenedor
    container.appendChild(svg);

    // Agregar estilos de animación
    if (!document.getElementById('disc-bar-chart-styles')) {
      const style = document.createElement('style');
      style.id = 'disc-bar-chart-styles';
      style.textContent = `
        @keyframes barGrow {
          from {
            height: 0;
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .disc-bar-chart {
          width: 100%;
          height: auto;
          max-width: 400px;
          margin: 0 auto;
          display: block;
        }
      `;
      document.head.appendChild(style);
    }
  };

})();