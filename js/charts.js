/**
 * charts.js — dependency-free SVG chart primitives.
 * Same philosophy as the FitFuel charts: high intrinsic resolution +
 * non-scaling strokes keep everything crisp at any width.
 */
const Charts = (() => {
  const W = 1200, H = 480, PAD_L = 80, PAD_R = 32, PAD_T = 32, PAD_B = 64;
  const INNER_W = W - PAD_L - PAD_R;
  const INNER_H = H - PAD_T - PAD_B;

  function esc(s) {
    return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // Horizontal bar chart. items = [{label, value, hint?, highlight?}]
  // valueMax defaults to Math.max(values) so callers can lock a 0-1 range.
  function barChart({ items, valueMax = null, unit = '', formatValue }) {
    if (!items.length) return `<p class="chart-empty">No data.</p>`;
    const max = valueMax != null ? valueMax : Math.max(...items.map((i) => i.value), 1);
    const barH = Math.min(48, (INNER_H - (items.length - 1) * 10) / items.length);
    const gap = 10;

    const rows = items.map((it, i) => {
      const y = PAD_T + i * (barH + gap);
      const w = Math.max(2, (it.value / max) * INNER_W);
      const val = formatValue ? formatValue(it.value) : `${it.value}${unit}`;
      const cls = it.highlight ? 'chart-bar chart-bar--hi' : 'chart-bar';
      return `
        <g class="chart-row">
          <text x="${PAD_L - 12}" y="${y + barH / 2 + 6}" text-anchor="end" class="chart-label">${esc(it.label)}</text>
          <rect x="${PAD_L}" y="${y}" width="${INNER_W}" height="${barH}" rx="6" class="chart-track" />
          <rect x="${PAD_L}" y="${y}" width="${w.toFixed(1)}" height="${barH}" rx="6" class="${cls}" />
          <text x="${PAD_L + w + 8}" y="${y + barH / 2 + 6}" class="chart-value">${esc(val)}</text>
          ${it.hint ? `<title>${esc(it.hint)}</title>` : ''}
        </g>`;
    }).join('');

    return `<svg viewBox="0 0 ${W} ${H}" class="chart chart--bar" preserveAspectRatio="xMidYMid meet" role="img">
      ${rows}
    </svg>`;
  }

  // Simple histogram of values in [0,1], binned into `bins` buckets.
  // Optionally overlay a "you are here" marker.
  function histogram({ values, bins = 10, youValue = null, xLabel = 'value' }) {
    if (!values.length) return `<p class="chart-empty">No data.</p>`;
    const buckets = new Array(bins).fill(0);
    values.forEach((v) => {
      const clamped = Math.max(0, Math.min(0.999999, v));
      buckets[Math.floor(clamped * bins)]++;
    });
    const max = Math.max(...buckets, 1);
    const bw = INNER_W / bins;
    const bars = buckets.map((count, i) => {
      const h = (count / max) * INNER_H;
      const x = PAD_L + i * bw;
      const y = PAD_T + (INNER_H - h);
      return `<rect x="${(x + 2).toFixed(1)}" y="${y.toFixed(1)}" width="${(bw - 4).toFixed(1)}" height="${h.toFixed(1)}" rx="3" class="chart-bar" />`;
    }).join('');

    // x-axis ticks at 0, 0.25, 0.5, 0.75, 1
    const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => {
      const x = PAD_L + t * INNER_W;
      return `<g>
        <line x1="${x}" x2="${x}" y1="${PAD_T + INNER_H}" y2="${PAD_T + INNER_H + 6}" class="chart-axis" vector-effect="non-scaling-stroke"/>
        <text x="${x}" y="${PAD_T + INNER_H + 26}" text-anchor="middle" class="chart-tick">${Math.round(t * 100)}%</text>
      </g>`;
    }).join('');

    const marker = youValue != null ? (() => {
      const x = PAD_L + Math.max(0, Math.min(1, youValue)) * INNER_W;
      return `
        <line x1="${x}" x2="${x}" y1="${PAD_T}" y2="${PAD_T + INNER_H}" class="chart-marker" vector-effect="non-scaling-stroke"/>
        <rect x="${x - 24}" y="${PAD_T - 22}" width="48" height="18" rx="4" class="chart-marker-tag"/>
        <text x="${x}" y="${PAD_T - 9}" text-anchor="middle" class="chart-marker-text">you</text>`;
    })() : '';

    const xTitle = `<text x="${PAD_L + INNER_W / 2}" y="${H - 10}" text-anchor="middle" class="chart-axis-title">${esc(xLabel)}</text>`;

    return `<svg viewBox="0 0 ${W} ${H}" class="chart chart--hist" preserveAspectRatio="xMidYMid meet" role="img">
      <line x1="${PAD_L}" x2="${PAD_L + INNER_W}" y1="${PAD_T + INNER_H}" y2="${PAD_T + INNER_H}" class="chart-axis" vector-effect="non-scaling-stroke"/>
      ${bars}
      ${ticks}
      ${marker}
      ${xTitle}
    </svg>`;
  }

  // Scatter of {x, y} in [0,1] x [0,1]. Optional highlighted point (you).
  function scatter({ points, youPoint = null, xLabel = 'x', yLabel = 'y' }) {
    if (!points.length) return `<p class="chart-empty">No data.</p>`;
    const project = (p) => ({
      cx: PAD_L + Math.max(0, Math.min(1, p.x)) * INNER_W,
      cy: PAD_T + (1 - Math.max(0, Math.min(1, p.y))) * INNER_H,
    });
    const dots = points.map((p) => {
      const { cx, cy } = project(p);
      return `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="5" class="chart-dot"/>`;
    }).join('');
    const you = youPoint ? (() => {
      const { cx, cy } = project(youPoint);
      return `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="10" class="chart-dot chart-dot--you"/>
              <text x="${(cx + 14).toFixed(1)}" y="${(cy + 5).toFixed(1)}" class="chart-marker-text chart-marker-text--dark">you</text>`;
    })() : '';

    // Axis + labels
    const axes = `
      <line x1="${PAD_L}" x2="${PAD_L + INNER_W}" y1="${PAD_T + INNER_H}" y2="${PAD_T + INNER_H}" class="chart-axis" vector-effect="non-scaling-stroke"/>
      <line x1="${PAD_L}" x2="${PAD_L}" y1="${PAD_T}" y2="${PAD_T + INNER_H}" class="chart-axis" vector-effect="non-scaling-stroke"/>`;
    const xTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => {
      const x = PAD_L + t * INNER_W;
      return `<text x="${x}" y="${PAD_T + INNER_H + 26}" text-anchor="middle" class="chart-tick">${Math.round(t * 100)}%</text>`;
    }).join('');
    const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => {
      const y = PAD_T + (1 - t) * INNER_H;
      return `<text x="${PAD_L - 12}" y="${y + 5}" text-anchor="end" class="chart-tick">${Math.round(t * 100)}%</text>`;
    }).join('');

    return `<svg viewBox="0 0 ${W} ${H}" class="chart chart--scatter" preserveAspectRatio="xMidYMid meet" role="img">
      ${axes}
      ${dots}
      ${you}
      ${xTicks}
      ${yTicks}
      <text x="${PAD_L + INNER_W / 2}" y="${H - 10}" text-anchor="middle" class="chart-axis-title">${esc(xLabel)}</text>
      <text transform="translate(20 ${PAD_T + INNER_H / 2}) rotate(-90)" text-anchor="middle" class="chart-axis-title">${esc(yLabel)}</text>
    </svg>`;
  }

  return { barChart, histogram, scatter };
})();
