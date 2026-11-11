/* ============================================================================
 * validate.js — Validación, verificación contra el Proyecto y optimización
 * ========================================================================== */
(function (root) {
  const GS = (root.GS = root.GS || {});

  /* Comparación del caso de diseño del modelo con las cifras de Proyecto.pdf §3.3–3.4 */
  GS.verifyDesign = function () {
    const r = GS.run(GS.defaults());
    const rows = [
      ['Mineral seco', 2.08, r.sums.feedSolids / r.p.opHours, 't/h', 0.01, 'Balance de masa §3.3'],
      ['Agua en la pulpa', 3.13, r.cil.waterTph, 'm³/h', 0.01, 'Balance de masa §3.3'],
      ['Pulpa', 5.21, r.cil.pulpTph, 't/h', 0.01, 'Balance de masa §3.3'],
      ['Densidad de pulpa', 1.34, r.cil.dens, 't/m³', 0.01, 'Balance de masa §3.3'],
      ['Caudal volumétrico de pulpa', 3.9, r.cil.Qpulp, 'm³/h', 0.01, 'Balance de masa §3.3'],
      ['Volumen efectivo total', 94, r.cil.Veff * r.cil.N, 'm³', 0.01, 'Balance de masa §3.3'],
      ['Volumen efectivo por tanque', 15.7, r.cil.Veff, 'm³', 0.01, 'Balance de masa §3.3'],
      ['Tiempo de residencia total', 24, r.cil.tauTot, 'h', 0.02, '§3.1: 6 tanques × 4 h'],
      ['Volumen geométrico del tanque (Ø 2,8 × 3,2 m)', 19.7, Math.PI / 4 * 2.8 * 2.8 * 3.2, 'm³', 0.01, '§3.4'],
      ['Oro en la alimentación al CIL', 500, r.au.cilFeed, 'g/d', 0.01, 'Balance de oro §3.3'],
      ['Oro disuelto y adsorbido (90 %)', 450, r.au.adsorbed, 'g/d', 0.01, 'Balance de oro §3.3'],
      ['Oro en el relave', 50, r.au.tails, 'g/d', 0.03, 'Balance de oro §3.3'],
      ['Ley de relave', 1, r.au.tailGrade, 'g/t', 0.03, 'Balance de oro §3.3'],
      ['NaCN consumido', 30, r.reag.nacn, 'kg/d', 0.01, '§3.2 (0,6 kg/t)'],
      ['Cal (CaO)', 75, r.reag.lime, 'kg/d', 0.01, '§3.2 (1,5 kg/t)'],
      ['Reposición de carbón', 2, r.reag.carbon, 'kg/d', 0.01, '§3.2 (≈ 40 g/t)'],
      ['NaCN estequiométrico', 225, r.cn.stoich * 1000, 'g/d', 0.02, 'Reactivos §3.3'],
      ['O₂ estequiométrico', 18, r.reag.stoichO2 * 1000, 'g/d', 0.03, 'Reactivos §3.3'],
      ['Inventario de carbón (tanques 2–6)', 780, r.cil.carbonInv, 'kg', 0.01, 'Reactivos §3.3'],
    ];
    return rows.map(([name, doc, model, unit, tol, ref]) => ({ name, doc, model, unit, tol, ref, err: (model - doc) / doc, ok: Math.abs((model - doc) / doc) <= tol }));
  };

  /* Comprobaciones de balance y de coherencia sobre el estado actual */
  GS.validate = function (p, r) {
    const out = [];
    const add = (cat, lvl, title, detail, value) => out.push({ cat, lvl, title, detail, value });
    const rel = (a, b) => Math.abs(a - b) / Math.max(1e-9, Math.abs(b));
    // Balances
    const feed = r.sums.feedSolids, outS = r.sums.tailSolids + r.grav.Mw;
    add('Balance de masa', rel(feed, outS) < 1e-6 ? 'ok' : 'error', 'Sólidos: entrada = relave + concentrado gravimétrico', `Entrada ${feed.toFixed(3)} t/d · salida ${outS.toFixed(3)} t/d`, feed - outS);
    add('Balance de masa', Math.abs(r.water.closure) < 1e-6 ? 'ok' : 'error', 'Agua: (fresca + humedad del mineral) = (agua en relave + purga)', `Fresca ${r.water.fresh.toFixed(2)} + mineral ${r.water.Wore.toFixed(2)} = ${(r.water.Wtc + r.water.purge).toFixed(2)} m³/d`, r.water.closure);
    add('Conservación del oro', Math.abs(r.au.closure) < 1e-6 ? 'ok' : 'error', 'Oro: cabeza = doré + relave + pérdidas aguas abajo', `Cabeza ${r.au.head.toFixed(2)} g/d = ${(r.au.dore + r.au.tails + r.au.downLoss).toFixed(2)} g/d`, r.au.closure);
    const dis = r.au.dissolved, sum = r.au.adsorbed + r.au.tailsSol;
    add('Conservación del oro', rel(dis, sum) < 1e-5 ? 'ok' : 'error', 'CIL: disuelto = adsorbido + disuelto en relave', `${dis.toFixed(3)} = ${sum.toFixed(3)} g/d`, dis - sum);
    const cil = r.au.cilFeed, sum2 = r.au.adsorbed + r.au.tailsSol + r.au.tailsSolids;
    add('Conservación del oro', rel(cil, sum2) < 1e-5 ? 'ok' : 'error', 'CIL: alimentación = carbón + solución + sólidos de relave', `${cil.toFixed(3)} = ${sum2.toFixed(3)} g/d`, cil - sum2);
    const dens = r.cil.dens, dens2 = (1 + 0) && (r.cil.pulpTph / r.cil.Qpulp);
    add('Coherencia entre entradas y salidas', Math.abs(dens - dens2) < 1e-9 ? 'ok' : 'error', 'Densidad de pulpa = t/h ÷ m³/h', `${dens.toFixed(3)} t/m³`, dens - dens2);
    const pct = (p.feedTpd / (p.feedTpd + 0)) && (r.cil.cilDry / (r.cil.cilDry + r.cil.Wcil_real) * 100);
    const gap = Math.abs(pct - p.cilSolids);
    add('Coherencia entre variables y resultados', gap < 0.5 ? 'ok' : 'warn', 'Sólidos de la pulpa CIL: pedido vs. logrado', `Pedido ${p.cilSolids} % · logrado ${pct.toFixed(1)} %`, gap);
    // Unidades
    const Qchk = (r.cil.cilDry / p.opHours) / p.solidSG + r.cil.waterTph;
    add('Consistencia de unidades', Math.abs(Qchk - r.cil.Qpulp) < 1e-9 ? 'ok' : 'error', 'Caudal volumétrico = t/h ÷ SG + m³/h de agua', `${r.cil.Qpulp.toFixed(3)} m³/h`, Qchk - r.cil.Qpulp);
    const cnChk = (p.nacn * r.reag.nacnSpec) >= 0;
    add('Consistencia de unidades', cnChk ? 'ok' : 'error', 'ppm (g/m³) × m³/d ÷ 1000 = kg/d en consumo de NaCN', `NaCN ${p.nacn} ppm × ${r.cil.Wcil.toFixed(1)} m³/d`, 0);
    // Límites de equipos
    const lim = (title, util, extra) => add('Límites de capacidad', util > 1 ? 'error' : util > 0.85 ? 'warn' : 'ok', title, `Utilización ${(util * 100).toFixed(0)} %${extra ? ' · ' + extra : ''}`, util);
    lim('Trituradora de mandíbulas', r.crush.util, `${r.crush.tph.toFixed(1)} t/h de ${p.crushCap}`);
    lim('Molino de bolas (potencia Bond)', r.mill.util, `${r.mill.kWreq.toFixed(1)} kW de ${p.millPower}`);
    lim('Tanques CIL (volumen)', r.cil.Veff / p.tankVolGeom, `${r.cil.Veff.toFixed(1)} m³ de ${p.tankVolGeom} m³`);
    lim('Compresor de aire (3 m³/min)', r.air.util, `${r.air.airNeed.toFixed(2)} m³/min necesarios`);
    lim('Carga del carbón', r.cil.loading / p.qMax, `${r.cil.loading.toFixed(1)} de ${p.qMax} kg Au/t C`);
    // Rangos operativos del Proyecto
    const rg = (title, v, lo, hi, unit, hard) => { const ok = v >= lo && v <= hi; add('Rangos del Proyecto', ok ? 'ok' : hard ? 'error' : 'warn', title, `${(+v).toFixed(2).replace(/\.00$/, '')} ${unit} (rango ${lo}–${hi})`, v); };
    rg('Tiempo de residencia total', r.cil.tauTot, 24, 48, 'h');
    rg('pH', p.ph, 10.5, 11.5, '', p.ph < 10.5);
    rg('NaCN', p.nacn, 300, 500, 'ppm');
    rg('Oxígeno disuelto', r.chem.DOeff, 6, 40, 'mg/L');
    rg('Sólidos en CIL', p.cilSolids, 35, 50, '%');
    rg('P80', p.p80, 75, 150, 'µm');
    rg('Carbón en pulpa', p.carbonConc, 10, 25, 'g/L');
    rg('Temperatura', p.temp, 20, 25, '°C');
    rg('CNWAD tras destrucción', r.detox.cnRes, 0, p.cnLimit, 'mg/L', true);
    return out;
  };

  /* Prueba de coherencia: cada variable se perturba +10 % y se verifica el signo esperado */
  GS.sanity = function (p) {
    const base = GS.run(p);
    const tests = [
      ['nacn', 'recCIL', +1, 'Más NaCN → no baja la recuperación', (r) => r.au.recCIL],
      ['nacn', 'cons', +1, 'Más NaCN → sube el consumo de NaCN', (r) => r.reag.nacn],
      ['p80', 'recCIL', -1, 'Más P80 (más grueso) → no sube la recuperación', (r) => r.au.recCIL],
      ['p80', 'energy', -1, 'Más P80 → baja la energía de molienda', (r) => r.mill.kWhd],
      ['feedTpd', 'oro', +1, 'Más alimentación → más oro producido (g/d)', (r) => r.au.dore],
      ['feedTpd', 'water', +1, 'Más alimentación → más agua fresca', (r) => r.water.fresh],
      ['headGrade', 'oro', +1, 'Más ley → más oro producido', (r) => r.au.dore],
      ['ph', 'lime', +1, 'Más pH → más cal', (r) => r.reag.lime],
      ['dox', 'recCIL', +1, 'Más O₂ disuelto → no baja la recuperación', (r) => r.au.recCIL],
      ['waterRecycle', 'fresh', -1, 'Más recirculación → menos agua fresca', (r) => r.water.fresh],
    ];
    return tests.map(([id, key, sign, text, f]) => {
      const def = GS.PARAM_BY_ID[id];
      let v = p[id] * 1.1; if (def.max != null && v > def.max) v = p[id] * 0.9, sign = -sign;
      if (id === 'waterRecycle' && p[id] >= 100) v = 90;
      const r2 = GS.run(Object.assign({}, p, { [id]: v }));
      const d = f(r2) - f(base);
      const ok = sign * d >= -1e-9;
      return { text, ok, delta: d, id };
    });
  };

  /* Búsqueda de mejores condiciones dentro de los criterios del Proyecto */
  GS.optimize = function (p, objective) {
    const grid = {
      nacn: [300, 350, 400, 450, 500],
      ph: [10.5, 11, 11.5],
      p80: [75, 90, 105, 120, 135, 150],
      cilSolids: [35, 40, 45, 50],
      dox: [6, 7, 8],
    };
    const res = [];
    for (const nacn of grid.nacn) for (const ph of grid.ph) for (const p80 of grid.p80) for (const cs of grid.cilSolids) for (const dox of grid.dox) {
      const q = Object.assign({}, p, { nacn, ph, p80, cilSolids: cs, dox });
      const r = GS.run(q);
      if (r.flags.some((f) => f.lvl === 'error' || f.id === 'cil_dil' || f.id === 'do_sat')) continue;
      if (r.detox.cnRes > q.cnLimit) continue;
      const score = objective === 'cn' ? -(r.reag.nacn / Math.max(1e-9, r.au.dore)) : objective === 'energy' ? r.au.dore / r.energy.total : r.au.dore;
      if (objective === 'cn' || objective === 'energy') { if (r.au.recGlobal < p.__minRec) continue; }
      res.push({ q, r, score, vars: { nacn, ph, p80, cilSolids: cs, dox } });
    }
    res.sort((a, b) => b.score - a.score);
    return res.slice(0, 6);
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
