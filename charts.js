/* ============================================================================
 * charts.js — Gráficos SVG propios (sin dependencias): líneas, barras, apilado
 * Paleta categórica validada (guía dataviz): azul, naranja, turquesa, amarillo, magenta
 * ========================================================================== */
(function (root) {
  const GS = (root.GS = root.GS || {});
  const COL = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#6250d6', '#e34948', '#008300'];
  const nf = (x, d) => (isFinite(x) ? Number(x).toLocaleString('es-CO', { minimumFractionDigits: d, maximumFractionDigits: d }) : '–');
  const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  function ticks(lo, hi, n) {
    const span = hi - lo || 1, raw = span / n, mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const step = [1, 2, 2.5, 5, 10].map((k) => k * mag).find((s) => span / s <= n + 0.5) || mag * 10;
    const out = []; for (let v = Math.ceil(lo / step - 1e-9) * step; v <= hi + 1e-9; v += step) out.push(+v.toFixed(10));
    return out;
  }
  function tip(host) {
    let t = host.querySelector('.tip'); if (!t) { t = document.createElement('div'); t.className = 'tip'; host.appendChild(t); }
    return t;
  }
  function legend(series) {
    if (series.length < 2) return '';
    return '<div class="legend">' + series.map((s) => `<span><i style="background:${s.color}"></i>${esc(s.name)}</span>`).join('') + '</div>';
  }

  /* Línea: cfg = {series:[{name,color,pts:[[x,y]],dash}], xlab,ylab,xfmt,yfmt,ymin,ymax,marker:{x,y,label},bands:[{x0,x1,label}], h} */
  function line(host, cfg) {
    const W = 560, Hh = cfg.h || 300, m = { l: 58, r: 16, t: 14, b: 44 };
    const all = cfg.series.flatMap((s) => s.pts);
    let xs = all.map((p) => p[0]), ys = all.map((p) => p[1]);
    const x0 = cfg.xmin != null ? cfg.xmin : Math.min(...xs), x1 = cfg.xmax != null ? cfg.xmax : Math.max(...xs);
    let y0 = cfg.ymin != null ? cfg.ymin : Math.min(...ys), y1 = cfg.ymax != null ? cfg.ymax : Math.max(...ys);
    if (cfg.ymin == null) { const pad = (y1 - y0) * 0.1 || 1; y0 -= pad; y1 += pad; }
    const X = (v) => m.l + ((v - x0) / (x1 - x0 || 1)) * (W - m.l - m.r), Y = (v) => Hh - m.b - ((v - y0) / (y1 - y0 || 1)) * (Hh - m.t - m.b);
    const xf = cfg.xfmt || ((v) => nf(v, 0)), yf = cfg.yfmt || ((v) => nf(v, 1));
    let g = '';
    (cfg.bands || []).forEach((b) => { const a = Math.max(x0, b.x0), c = Math.min(x1, b.x1); if (c > a) g += `<rect x="${X(a)}" y="${m.t}" width="${X(c) - X(a)}" height="${Hh - m.t - m.b}" fill="#2a78d6" opacity=".07"/><text x="${X(a) + 4}" y="${m.t + 11}" class="ax" fill="#52514e">${esc(b.label)}</text>`; });
    ticks(y0, y1, 5).forEach((v) => { g += `<line x1="${m.l}" x2="${W - m.r}" y1="${Y(v)}" y2="${Y(v)}" class="grid"/><text x="${m.l - 8}" y="${Y(v) + 4}" text-anchor="end" class="ax">${yf(v)}</text>`; });
    ticks(x0, x1, 6).forEach((v) => { g += `<line x1="${X(v)}" x2="${X(v)}" y1="${Hh - m.b}" y2="${Hh - m.b + 4}" class="axl"/><text x="${X(v)}" y="${Hh - m.b + 17}" text-anchor="middle" class="ax">${xf(v)}</text>`; });
    g += `<line x1="${m.l}" x2="${W - m.r}" y1="${Hh - m.b}" y2="${Hh - m.b}" class="axl"/>`;
    g += `<text x="${(m.l + W - m.r) / 2}" y="${Hh - 6}" text-anchor="middle" class="axt">${esc(cfg.xlab || '')}</text>`;
    g += `<text transform="translate(13 ${(m.t + Hh - m.b) / 2}) rotate(-90)" text-anchor="middle" class="axt">${esc(cfg.ylab || '')}</text>`;
    cfg.series.forEach((s) => {
      const d = s.pts.map((p, i) => (i ? 'L' : 'M') + X(p[0]).toFixed(1) + ' ' + Y(p[1]).toFixed(1)).join('');
      g += `<path d="${d}" fill="none" stroke="${s.color}" stroke-width="2" stroke-linejoin="round" ${s.dash ? 'stroke-dasharray="6 4"' : ''}/>`;
    });
    if (cfg.marker) {
      const mx = cfg.marker.x, my = cfg.marker.y;
      if (mx >= x0 && mx <= x1) g += `<line x1="${X(mx)}" x2="${X(mx)}" y1="${m.t}" y2="${Hh - m.b}" stroke="#b8860b" stroke-dasharray="3 3"/><circle cx="${X(mx)}" cy="${Y(my)}" r="5" fill="#fff" stroke="#b8860b" stroke-width="2.5"/><text x="${Math.min(X(mx) + 8, W - 90)}" y="${Math.max(Y(my) - 10, m.t + 24)}" class="ax" fill="#8a6508" font-weight="600">${esc(cfg.marker.label || 'Punto actual')}</text>`;
    }
    g += '<g class="hov"></g><rect class="ov" x="' + m.l + '" y="' + m.t + '" width="' + (W - m.l - m.r) + '" height="' + (Hh - m.t - m.b) + '" fill="transparent"/>';
    host.innerHTML = (cfg.title ? `<div class="ct">${esc(cfg.title)}</div>` : '') + legend(cfg.series) + `<svg viewBox="0 0 ${W} ${Hh}" class="chart">${g}</svg>`;
    const svg = host.querySelector('svg'), ov = svg.querySelector('.ov'), hov = svg.querySelector('.hov'), t = tip(host);
    const base = cfg.series[0].pts;
    ov.addEventListener('mousemove', (e) => {
      const b = svg.getBoundingClientRect(), px = ((e.clientX - b.left) / b.width) * W, xv = x0 + ((px - m.l) / (W - m.l - m.r)) * (x1 - x0);
      let i = 0, best = 1e99; base.forEach((p, k) => { const dd = Math.abs(p[0] - xv); if (dd < best) { best = dd; i = k; } });
      const cx = X(base[i][0]);
      hov.innerHTML = `<line x1="${cx}" x2="${cx}" y1="${m.t}" y2="${Hh - m.b}" stroke="#52514e" stroke-width="1"/>` + cfg.series.map((s) => (s.pts[i] ? `<circle cx="${cx}" cy="${Y(s.pts[i][1])}" r="4" fill="${s.color}" stroke="#fff" stroke-width="2"/>` : '')).join('');
      t.innerHTML = `<b>${esc(cfg.xlab ? cfg.xlab.split('(')[0].trim() : 'x')}: ${xf(base[i][0])}</b>` + cfg.series.map((s) => (s.pts[i] ? `<div><i style="background:${s.color}"></i>${esc(s.name)}: <b>${yf(s.pts[i][1])}</b></div>` : '')).join('');
      t.style.display = 'block';
      const hb = host.getBoundingClientRect(); let lx = e.clientX - hb.left + 14; if (lx > hb.width - 170) lx = e.clientX - hb.left - 170; t.style.left = lx + 'px'; t.style.top = e.clientY - hb.top - 10 + 'px';
    });
    ov.addEventListener('mouseleave', () => { hov.innerHTML = ''; t.style.display = 'none'; });
  }

  /* Barras agrupadas: cfg = {cats:[], series:[{name,color,vals}], yfmt, ylab, h} */
  function bars(host, cfg) {
    const W = 560, Hh = cfg.h || 300, m = { l: 62, r: 12, t: 12, b: 56 };
    const vals = cfg.series.flatMap((s) => s.vals);
    let y0 = cfg.ymin != null ? cfg.ymin : 0, y1 = cfg.ymax != null ? cfg.ymax : Math.max(...vals) * 1.1 || 1;
    const Y = (v) => Hh - m.b - ((v - y0) / (y1 - y0 || 1)) * (Hh - m.t - m.b), yf = cfg.yfmt || ((v) => nf(v, 1));
    const nC = cfg.cats.length, gw = (W - m.l - m.r) / nC, S = cfg.series.length, bw = Math.min(28, (gw * 0.7) / S);
    let g = '';
    ticks(y0, y1, 5).forEach((v) => { g += `<line x1="${m.l}" x2="${W - m.r}" y1="${Y(v)}" y2="${Y(v)}" class="grid"/><text x="${m.l - 8}" y="${Y(v) + 4}" text-anchor="end" class="ax">${yf(v)}</text>`; });
    cfg.cats.forEach((c, i) => {
      const cx = m.l + gw * (i + 0.5);
      const lab = String(c); const parts = lab.length > 14 ? [lab.slice(0, lab.lastIndexOf(' ', 14) > 0 ? lab.lastIndexOf(' ', 14) : 14), lab.slice(lab.lastIndexOf(' ', 14) > 0 ? lab.lastIndexOf(' ', 14) + 1 : 14)] : [lab];
      parts.forEach((p, k) => (g += `<text x="${cx}" y="${Hh - m.b + 16 + k * 12}" text-anchor="middle" class="ax">${esc(p)}</text>`));
      cfg.series.forEach((s, k) => {
        const v = s.vals[i], x = cx - (S * bw + (S - 1) * 2) / 2 + k * (bw + 2), y = Y(Math.max(v, y0)), h = Math.max(0, Hh - m.b - y);
        g += `<path d="M${x} ${y + h}V${y + 4}Q${x} ${y} ${x + 4} ${y}H${x + bw - 4}Q${x + bw} ${y} ${x + bw} ${y + 4}V${y + h}Z" fill="${s.color}" class="bar" data-i="${i}" data-k="${k}"/>`;
      });
    });
    g += `<line x1="${m.l}" x2="${W - m.r}" y1="${Y(y0)}" y2="${Y(y0)}" class="axl"/><text transform="translate(13 ${(m.t + Hh - m.b) / 2}) rotate(-90)" text-anchor="middle" class="axt">${esc(cfg.ylab || '')}</text>`;
    host.innerHTML = (cfg.title ? `<div class="ct">${esc(cfg.title)}</div>` : '') + legend(cfg.series) + `<svg viewBox="0 0 ${W} ${Hh}" class="chart">${g}</svg>`;
    const t = tip(host);
    host.querySelectorAll('.bar').forEach((el) => {
      el.addEventListener('mousemove', (e) => {
        const i = +el.dataset.i, k = +el.dataset.k, hb = host.getBoundingClientRect();
        t.innerHTML = `<b>${esc(cfg.cats[i])}</b><div><i style="background:${cfg.series[k].color}"></i>${esc(cfg.series[k].name)}: <b>${yf(cfg.series[k].vals[i])}</b></div>`;
        t.style.display = 'block'; let lx = e.clientX - hb.left + 14; if (lx > hb.width - 190) lx = e.clientX - hb.left - 190; t.style.left = lx + 'px'; t.style.top = e.clientY - hb.top - 10 + 'px';
      });
      el.addEventListener('mouseleave', () => (t.style.display = 'none'));
    });
  }

  /* Barra apilada horizontal con tabla: cfg = {items:[{name,color,val}], unit, total} */
  function stack(host, cfg) {
    const tot = cfg.items.reduce((a, c) => a + Math.max(0, c.val), 0) || 1;
    let x = 0, seg = '';
    cfg.items.forEach((it, i) => {
      const w = (Math.max(0, it.val) / tot) * 100; if (w <= 0) return;
      seg += `<div class="seg" data-i="${i}" style="width:calc(${w}% - 2px);background:${it.color}"></div>`; x += w;
    });
    host.innerHTML = (cfg.title ? `<div class="ct">${esc(cfg.title)}</div>` : '') + `<div class="stackbar">${seg}</div><table class="dist">` +
      cfg.items.map((it) => `<tr><td><i style="background:${it.color}"></i>${esc(it.name)}</td><td class="num">${nf(it.val, cfg.d != null ? cfg.d : 1)} ${esc(cfg.unit)}</td><td class="num">${nf((100 * it.val) / tot, 1)} %</td></tr>`).join('') + '</table>';
    const t = tip(host);
    host.querySelectorAll('.seg').forEach((el) => {
      el.addEventListener('mousemove', (e) => { const it = cfg.items[+el.dataset.i], hb = host.getBoundingClientRect(); t.innerHTML = `<b>${esc(it.name)}</b><div>${nf(it.val, 2)} ${esc(cfg.unit)} · ${nf((100 * it.val) / tot, 1)} %</div>`; t.style.display = 'block'; t.style.left = Math.min(e.clientX - hb.left + 12, hb.width - 200) + 'px'; t.style.top = e.clientY - hb.top - 40 + 'px'; });
      el.addEventListener('mouseleave', () => (t.style.display = 'none'));
    });
  }
  GS.charts = { line, bars, stack, COL, nf };
})(typeof globalThis !== 'undefined' ? globalThis : this);
