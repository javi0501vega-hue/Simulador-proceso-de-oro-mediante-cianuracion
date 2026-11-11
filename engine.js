/* ============================================================================
 * engine.js — Motor de cálculo de la planta aurífera (balances + cinética CIL)
 * Todas las ecuaciones están descritas en docs/ECUACIONES.md y en la pestaña
 * "Modelo y ecuaciones" de la aplicación. Sin dependencias: corre en navegador
 * y en Node (tests/run_tests.js).
 * Unidades: masa t/d (base seca) · agua m³/d · oro g/d · tiempo h · conc. mg/L
 * ========================================================================== */
(function (root) {
  const GS = (root.GS = root.GS || {});
  const MW = { Au: 196.967, NaCN: 49.007, CN: 26.017, O2: 31.998, SO2: 64.066 };
  const R_GAS = 8.314;

  /* ---------- utilidades físicas ---------- */
  // Saturación de O2 en agua (Benson–Krause/Weiss, 1 atm, aire) × presión × fracción de O2 del gas
  function doSat(T_C, alt_m, yO2) {
    const T = T_C + 273.15;
    const ln = -139.34411 + 1.575701e5 / T - 6.642308e7 / (T * T) + 1.2438e10 / Math.pow(T, 3) - 8.621949e11 / Math.pow(T, 4);
    const P = 101.325 * Math.pow(1 - 2.25577e-5 * alt_m, 5.25588);
    return Math.exp(ln) * (P / 101.325) * (yO2 / 0.2095);
  }
  const visc = (T_C) => 2.414e-5 * Math.pow(10, 247.8 / (T_C + 273.15 - 140)); // Pa·s (Vogel)
  const alphaCN = (pH) => 1 / (1 + Math.pow(10, 9.31 - pH)); // fracción CN⁻ (pKa HCN = 9,31)

  // Distribución Rosin–Rammler en clases de tamaño (µm). Devuelve [{d, w}]
  const EDGES = [0, 10, 20, 30, 45, 63, 75, 90, 106, 150, 212, 300, 425, 600, 1000];
  function psd(p80, n) {
    const x0 = p80 / Math.pow(-Math.log(0.2), 1 / n);
    const cdf = (x) => 1 - Math.exp(-Math.pow(x / x0, n));
    const out = [];
    for (let i = 0; i < EDGES.length - 1; i++) {
      const lo = EDGES[i], hi = EDGES[i + 1];
      out.push({ lo, hi, d: lo === 0 ? 6 : Math.sqrt(lo * hi), w: cdf(hi) - cdf(lo) });
    }
    const s = out.reduce((a, c) => a + c.w, 0);
    out.forEach((c) => (c.w /= s));
    return { classes: out, cdf, x0 };
  }

  const M_EXP = 0.2; // exponente de la fracción no lixiviable vs tamaño (supuesto calibrado, ver docs)

  /* ---------- cinética: cadena de CSTR con ley de 2.º orden en oro (Ec. 25 / orden ≈ 2 de la tesis) ---------- */
  function mtFactor(T, ph, nacn, dox, alt, yO2) {
    const doEff = Math.min(dox, doSat(T, alt, yO2));
    const cn = (nacn / 1000 / MW.NaCN) * alphaCN(ph); // mol/L CN⁻ libre
    const o2 = doEff / 1000 / MW.O2; // mol/L
    const sc = (T + 273.15) / 298.15 * (visc(25) / visc(T));
    const Dcn = 1.83e-5 * sc, Do2 = 2.76e-5 * sc; // Ray & Ray cap. 5 (Ec. 5.23)
    return { f: (Dcn * Do2 * cn * o2) / (Dcn * cn + 4 * Do2 * o2), doEff, cn, o2 }; // 2/δ constante, se absorbe en K
  }
  const MT_REF = mtFactor(25, 11, 400, 8, 0, 0.2095).f;

  function leachChain(classes, C0, fInfFn, kFn, tau, N) {
    // devuelve gradiente medio de sólidos tras cada tanque (g/t) y por clase
    const state = classes.map((c) => {
      const fi = fInfFn(c);
      return { Cinf: fi * C0, D: (1 - fi) * C0, k: kFn(c), w: c.w };
    });
    const prof = [C0];
    for (let i = 0; i < N; i++) {
      let tot = 0;
      for (const s of state) {
        const a = tau * s.k;
        s.D = a > 1e-12 ? (-1 + Math.sqrt(1 + 4 * a * s.D)) / (2 * a) : s.D;
        tot += s.w * (s.Cinf + s.D);
      }
      prof.push(tot);
    }
    return prof;
  }

  /* ---------- modelo principal ---------- */
  function simulate(p, calIn) {
    const cal = calIn || GS.CAL || { K: 0.01, cf: 0.04 };
    const flags = []; // {lvl:'error'|'warn'|'info', id, msg}
    const flag = (lvl, id, msg) => flags.push({ lvl, id, msg });
    const H = p.opHours, F = p.feedTpd, Fh = F / H;
    const m = p.moisture / 100;
    const r = { p, flags };

    /* 1) Mineral ROM */
    const Wore = (F * m) / (1 - m);
    const ROM = { solids: F, water: Wore, au: F * p.headGrade };
    const AuH = ROM.au;

    /* 2) Circuito de trituración (mandíbula + criba, circuito cerrado) */
    const xTop = 1.5 * p.jawCSS, mGGS = 0.75;
    const pPass = Math.min(1, Math.pow(p.screenAp / xTop, mGGS));
    const eta = p.screenEff / 100;
    const Pcr = F / (eta * pPass);
    const Rcr = Pcr - F;
    const crushTph = Pcr / p.crushHours;
    const F80c = p.romF80 * 1000, P80c = 0.8 * p.screenAp * 1000;
    const wCr = 10 * p.wi * (1 / Math.sqrt(P80c) - 1 / Math.sqrt(F80c)); // kWh/t (Bond)
    r.crush = { Pcr, Rcr, cl: Rcr / F * 100, tph: crushTph, util: crushTph / p.crushCap, pPass, wSp: wCr, kWhd: wCr * F, binCoarse_m3: (1.5 * F / p.crushHours) / 1.6, binFines_m3: (16 * Fh) / 1.6 };
    if (r.crush.util > 1) flag('error', 'crush_cap', `Trituradora sobrecargada: ${(crushTph).toFixed(1)} t/h (incluye carga circulante ${(Rcr / F * 100).toFixed(0)} %) frente a ${p.crushCap} t/h.`);
    if (Rcr / F > 2.5) flag('warn', 'crush_circ', `La abertura de la mandíbula (${p.jawCSS} mm) es mucho mayor que la malla (${p.screenAp} mm): la carga circulante de trituración sube a ${(Rcr / F * 100).toFixed(0)} %. Contradicción del Proyecto (Tabla 1): mandíbula 40–100 mm con criba de 12–25 mm.`);

    /* 3) Molienda + hidrociclón (balance de agua y sólidos) */
    const CL = p.cycCL / 100;
    const D = F * (1 + CL), U = F * CL;
    const Wmd = (D * (1 - p.millSolids / 100)) / (p.millSolids / 100);
    const Wcf = (D * (1 - p.cycFeedSolids / 100)) / (p.cycFeedSolids / 100);
    let Wof = (F * (1 - p.cycOFSolids / 100)) / (p.cycOFSolids / 100);
    if (Wof > Wcf) { flag('error', 'cyc_water', 'El balance de agua del hidrociclón no cierra: el rebose pide más agua que la alimentación. Aumente los sólidos en la alimentación o los sólidos del rebose.'); Wof = Wcf; }
    const Wuf = Wcf - Wof;
    const ufSolids = (U / (U + Wuf)) * 100;
    let Wmill = Wmd - Wuf - Wore, surplus = 0;
    if (Wmill < 0) { surplus += -Wmill; flag('warn', 'mill_water', 'El agua que entra al molino (mineral + descarga del ciclón) ya supera la requerida para los sólidos de descarga fijados.'); Wmill = 0; }
    let Wsump = Wcf - Wmd;
    if (Wsump < 0) { surplus += -Wsump; flag('warn', 'sump_water', 'Los sólidos de alimentación al ciclón son mayores que los de descarga del molino: no se puede concentrar con agua.'); Wsump = 0; }
    const F80m = 0.8 * p.screenAp * 1000;
    const wMill = 10 * p.wi * (1 / Math.sqrt(p.p80) - 1 / Math.sqrt(F80m)); // kWh/t
    const millKWreq = (wMill * Fh) / 0.95;
    r.mill = { cl: CL * 100, D, U, wSp: wMill, kWreq: millKWreq, util: millKWreq / p.millPower, maxTph: (p.millPower * 0.95) / wMill, Wmd, Wcf, Wuf, Wof, Wmill, Wsump, ufSolids, kWhd: wMill * F };
    if (r.mill.util > 1) flag('error', 'mill_cap', `Molino sobrecargado: requiere ${millKWreq.toFixed(1)} kW (Bond) frente a ${p.millPower} kW instalados. Capacidad máxima ≈ ${r.mill.maxTph.toFixed(2)} t/h al P80 elegido.`);
    if (ufSolids < 55 || ufSolids > 75) flag('warn', 'cyc_uf', `Sólidos en la descarga del ciclón ${ufSolids.toFixed(0)} % (típico 55–75 %): la combinación de carga circulante y sólidos no es coherente.`);

    const PS = psd(p.p80, p.rrN);
    r.psd = PS;
    r.pass75 = PS.cdf(75) * 100; r.pass38 = PS.cdf(38) * 100;

    /* 4) Gravimetría (Knelson + Wilfley) */
    const auFree = AuH * p.gravFree / 100;
    const auK = auFree * p.knelsonRec / 100;
    const auW = auK * p.wilfleyRec / 100;
    const Mk = F * p.knelsonMass / 100, Wk = Mk * 0.3 / 0.7;
    const Mw = Mk * p.wilfleyMass / 100;
    const gravConc = { solids: Mw, au: auW };
    r.grav = { auFree, auK, auW, Mk, Mw, kgConc: Mk * 1000 };

    /* 5) Flotación */
    const flotFeedDry = F - Mw;
    const flotFeedAu = AuH - auW;
    const Wff0 = Wof; // agua que llega (Wilfley seco: el agua del Knelson vuelve en las colas)
    const WffTarget = (flotFeedDry * (1 - p.flotSolids / 100)) / (p.flotSolids / 100);
    let Wdil = WffTarget - Wff0;
    if (Wdil < 0) { Wdil = 0; flag('info', 'flot_dil', `La pulpa ya llega a flotación con menos sólidos (${((flotFeedDry / (flotFeedDry + Wff0)) * 100).toFixed(0)} %) que el ajuste: no se agrega agua.`); }
    const Wff = Wff0 + Wdil;
    const Mc = F * p.flotPull / 100;
    const auSulf = AuH * p.sulfAu / 100;
    const auConc = Math.min(auSulf * p.flotAuRec / 100, flotFeedAu);
    const Wconc = Mc * 3; // concentrado como espuma a 25 % de sólidos
    const Wcake = (Mc * p.cakeConcMoist / 100) / (1 - p.cakeConcMoist / 100);
    const Wfilt1 = Math.max(0, Wconc - Wcake);
    const flotTails = { solids: flotFeedDry - Mc, water: Wff - Wconc, au: flotFeedAu - auConc };
    if (flotTails.water < 0) flag('error', 'flot_water', 'El agua de flotación no alcanza para el concentrado.');
    r.flot = { feedSolidsPct: (flotFeedDry / (flotFeedDry + Wff)) * 100, Wdil, Mc, auConc, xanthate_kgd: p.xanthate * F / 1000, mibc_kgd: p.mibc * F / 1000 };

    /* 6) Espesador */
    const Wuf_th = Math.min(flotTails.water, (flotTails.solids * (1 - p.thickUF / 100)) / (p.thickUF / 100));
    const Wof_th = Math.max(0, flotTails.water - Wuf_th);
    if (flotTails.water < Wuf_th) flag('warn', 'thick_water', 'La pulpa llega al espesador más espesa que la descarga fijada.');
    const ovfRate = Wof_th / H; // m³/h
    r.thick = { feedWater: flotTails.water, Wuf: Wuf_th, Wof: Wof_th, area: ovfRate / p.settleRate, diam: Math.sqrt((4 * (ovfRate / p.settleRate)) / Math.PI), floc_kgd: p.floc * F / 1000 };

    /* 7) Alimentación al CIL (pulpa espesada + torta repulpada + reactivos + dilución) */
    const cilDry = flotTails.solids + Mc;
    const cilAu = flotTails.au + auConc; // = AuH - auW
    const C0 = cilAu / cilDry; // g/t
    const WcilTarget = (cilDry * (1 - p.cilSolids / 100)) / (p.cilSolids / 100);
    const limeNom = p.limeDose * F * Math.max(0, p.ph - 8) / 3;
    const Wreact = 0.009 * (0.6 * F) + 0.009 * limeNom; // soluciones de preparación al 10 % (NaCN nominal 0,6 kg/t)
    const Wcake_ = (Mc * p.cakeConcMoist / 100) / (1 - p.cakeConcMoist / 100);

    /* Condiciones químicas */
    const yO2 = p.oxidant === 'oxígeno' ? p.o2Purity / 100 : 0.2095;
    const DOs = doSat(p.temp, p.altitude, yO2);
    const mt = mtFactor(p.temp, p.ph, p.nacn, p.dox, p.altitude, yO2);
    if (p.dox > DOs * 1.0001) flag('warn', 'do_sat', `El O₂ disuelto pedido (${p.dox} mg/L) supera la saturación alcanzable (${DOs.toFixed(1)} mg/L a ${p.temp} °C, ${p.altitude} m, ${p.oxidant}). Se usa ${DOs.toFixed(1)} mg/L.`);
    const aCN = alphaCN(p.ph);
    r.chem = { DOsat: DOs, DOeff: mt.doEff, alphaCN: aCN, cnFreeMgL: p.nacn * (MW.CN / MW.NaCN) * aCN, mtRel: mt.f / MT_REF };
    if (p.ph < 10.5) flag('error', 'ph_hcn', `pH ${p.ph} < 10,5: el Proyecto prohíbe operar por debajo (se desprende HCN, letal). ${(100 * (1 - aCN)).toFixed(0)} % del cianuro queda como HCN.`);

    /* Consumos de reactivos que añaden agua (soluciones de preparación) → se calculan después del NaCN.
       Primero, flujo de pulpa para el tiempo de residencia (agua = objetivo de sólidos). */
    const Wcil = Math.max(WcilTarget, Wuf_th + Wcake_ + Wreact);
    const Qpulp = cilDry / H / p.solidSG + Wcil / H; // m³/h
    const N = p.nTanks;
    let Veff = p.tauMode === 'objetivo' ? (p.tauTarget * Qpulp) / N : p.tankVolEff;
    const tau = Veff / Qpulp;
    if (Veff > p.tankVolGeom) flag('error', 'tank_vol', `Se requieren ${Veff.toFixed(1)} m³ por tanque, más que el volumen geométrico instalado (${p.tankVolGeom} m³). Hacen falta más tanques o menos caudal.`);
    else if (p.tauMode === 'objetivo' && Veff > p.tankVolEff) flag('warn', 'tank_fill', `El volumen requerido (${Veff.toFixed(1)} m³) supera el efectivo de diseño (${p.tankVolEff} m³, ~80 % de llenado).`);
    const tauTot = tau * N;

    /* 8) CIL: lixiviación + adsorción */
    const fSulfLocked = (p.sulfAu / 100) * (1 - p.sulfLeach / 100) * (AuH / cilAu > 0 ? 1 : 0);
    const fInf = (c) => Math.min(0.98, cal.cf * Math.pow(c.d / 75, M_EXP) + fSulfLocked);
    const gpH = Math.pow(10, -0.1 * (p.ph - 11));
    const kFn = (c) => cal.K * (mt.f / MT_REF) * gpH * (75 / c.d);
    const prof = leachChain(PS.classes, C0, fInf, kFn, tau, N);
    const Cs = prof; // g/t tras cada tanque (índice 0 = alimentación)
    const QL = (Wcil / H) * 1000; // L/h
    const dryh = cilDry / H;
    const Rdis = []; // mg/h
    for (let i = 0; i < N; i++) Rdis.push(dryh * (Cs[i] - Cs[i + 1]) * 1000);

    const s0 = Math.max(0, N - p.carbonTanks);
    const mc = p.carbonXfer, fAttr = (p.carbonMakeup * cilDry) / 1000;
    const q = new Array(N).fill(0), CL_ = new Array(N).fill(0), Rads = new Array(N).fill(0);
    for (let it = 0; it < 400; it++) {
      let prev = 0;
      for (let i = 0; i < N; i++) {
        const a = i >= s0 ? Math.max(0.02, 1 - q[i] / p.qMax) : 0;
        const Mc_g = i >= s0 ? p.carbonConc * Veff * 1000 : 0;
        const kk = p.kAds * a * Mc_g;
        CL_[i] = (QL * prev + Rdis[i]) / (QL + kk);
        Rads[i] = kk * CL_[i];
        prev = CL_[i];
      }
      const toGd = (x) => (x * H) / 1000; // mg/h → g/d
      const qb = (1 - p.eluEff / 100) * q[s0];
      const qn = new Array(N).fill(0);
      qn[N - 1] = (mc * qb + toGd(Rads[N - 1])) / (mc + fAttr);
      for (let i = N - 2; i >= s0; i--) qn[i] = qn[i + 1] + toGd(Rads[i]) / mc;
      let err = 0;
      for (let i = s0; i < N; i++) { const nv = 0.5 * q[i] + 0.5 * qn[i]; err = Math.max(err, Math.abs(nv - q[i])); q[i] = nv; }
      if (err < 1e-9) break;
    }
    const gd = (x) => (x * H) / 1000;
    const Adis = gd(Rdis.reduce((a, b) => a + b, 0));
    const Aads = gd(Rads.reduce((a, b) => a + b, 0));
    const AuSolLoss = gd(QL * CL_[N - 1]);
    const AuTailSolids = Cs[N] * cilDry;
    const AuFines = fAttr * q[N - 1];
    const AuEluted = Aads - AuFines;
    const loading = q[s0];
    r.cil = { Qpulp, Veff, tau, tauTot, N, C0, Cs, solutionMgL: CL_.slice(), q: q.slice(), s0, Adis, Aads, AuSolLoss, AuTailSolids, AuFines, loading, carbonInv: p.carbonConc * Veff * 1000 * p.carbonTanks / 1000, Wcil, Rdis: Rdis.map(gd), Rads: Rads.map(gd), cilDry, cilAu, dens: (cilDry / H + Wcil / H) / Qpulp, pulpTph: (cilDry + Wcil) / H, waterTph: Wcil / H };
    if (loading > 0.8 * p.qMax) flag('warn', 'carbon_sat', `Carga del carbón ${loading.toFixed(1)} kg Au/t C cercana a la máxima (${p.qMax}). Aumente la transferencia de carbón.`);
    if (loading > 10) flag('warn', 'carbon_load', `Carga del carbón ${loading.toFixed(1)} kg Au/t C fuera del rango del Proyecto (1–10).`);
    if (AuSolLoss / Math.max(cilAu, 1e-9) > 0.01) flag('warn', 'sol_loss', `El ${(100 * AuSolLoss / cilAu).toFixed(1)} % del oro se pierde disuelto en el relave: adsorción insuficiente.`);

    /* 9) Reactivos */
    const stoichNaCN = (2 * MW.NaCN / MW.Au) * Adis / 1000; // kg/d
    const stoichO2 = (MW.O2 / (4 * MW.Au)) * Adis / 1000; // kg/d  (4Au + O2 …)
    let cn = { total: 0, stoich: stoichNaCN, side: 0, out: 0 };
    const CN = cal.cn;
    if (CN) {
      const Y0 = (p.cnSideFrac / 100) * CN.T0;
      const O0 = Math.max(0, CN.T0 - Y0 - CN.S0);
      const xi = O0 / ((400 * CN.Wcil0) / 1000);
      const fT = Math.exp((40000 / R_GAS) * (1 / 298.15 - 1 / (p.temp + 273.15)));
      const hcn = (1 - aCN) / (1 - alphaCN(11));
      const fpH = 0.8 + 0.2 * hcn;
      const fSz = Math.pow(75 / p.p80, 0.5);
      const hold = dryh * tauTot;
      cn.side = Y0 * (p.nacn / 400) * (hold / CN.hold0) * fT * fpH * fSz;
      cn.out = xi * p.nacn * Wcil / 1000;
      cn.total = cn.stoich + cn.side + cn.out;
      cn.fpH = fpH; cn.fT = fT; cn.fSz = fSz;
    } else { cn.total = 0.6 * F; }
    const lime = p.limeDose * F * Math.max(0, p.ph - 8) / 3;
    const carbonMk = fAttr;
    const pbKg = p.pbNitrate * F / 1000;
    r.reag = { nacn: cn.total, nacnSpec: cn.total / F, cn, lime, limeSpec: lime / F, carbon: carbonMk, pb: pbKg, floc: p.floc * F / 1000, xanthate: r.flot.xanthate_kgd, mibc: r.flot.mibc_kgd, stoichO2 };

    /* 10) Destrucción de cianuro */
    const cnOutKg = cn.out * (MW.CN / MW.NaCN); // kg CN/d
    const cnIn = (cnOutKg / Wcil) * 1000; // mg/L como CN
    const eff = Math.min(1, p.detoxRatio / 3) * (1 - Math.exp(-p.detoxTime / 20));
    const cnRes = cnIn * (1 - eff);
    const so2 = p.detoxRatio * cnOutKg;
    r.detox = { cnIn, cnRes, so2, smbs: so2 / 0.674, eff };
    if (cnIn < 100 || cnIn > 300) flag('info', 'cnwad_in', `CNWAD a destrucción ${cnIn.toFixed(0)} mg/L (Proyecto: 100–300 mg/L).`);
    if (cnRes > p.cnLimit) flag('error', 'cn_limit', `CNWAD residual ${cnRes.toFixed(0)} mg/L supera el límite de ${p.cnLimit} mg/L. Aumente SO₂:CN o el tiempo de destrucción.`);

    /* 11) Filtración del relave */
    const Wtc = (cilDry * p.tailMoist / 100) / (1 - p.tailMoist / 100);
    const Wfilt2 = Math.max(0, Wcil - Wtc);
    if (Wcil < Wtc) flag('warn', 'tail_water', 'La pulpa de relave trae menos agua que la humedad del relave filtrado.');

    /* 12) Agua */
    const Wdil2 = Wcil - Wuf_th - Wcake - Wreact;
    if (WcilTarget < Wuf_th + Wcake + Wreact - 1e-9) flag('warn', 'cil_dil', `Los sólidos de la pulpa del CIL (${(100 * cilDry / (cilDry + Wcil)).toFixed(0)} %) no pueden llegar a ${p.cilSolids} % con la descarga del espesador (${p.thickUF} %). Se usa la densidad real.`);
    const Wcil_real = Wcil;
    const recov = Wof_th + Wfilt1 + Wfilt2 + surplus;
    const demand = Wmill + Wsump + Wdil + Wdil2 + Wreact;
    const recycled = Math.min(recov * p.waterRecycle / 100, demand);
    const fresh = demand - recycled, purge = recov - recycled;
    r.water = { demand, recov, recycled, fresh, purge, freshPerT: fresh / F, Wore, Wtc, closure: (fresh + Wore) - (Wtc + purge) };

    /* 13) Oro: balances */
    const AuDoreCIL = AuEluted * p.downRec / 100, AuDoreGrav = auW * p.downRec / 100;
    const AuTails = AuTailSolids + AuSolLoss + AuFines;
    const AuDownLoss = (AuEluted - AuDoreCIL) + (auW - AuDoreGrav);
    const AuDore = AuDoreCIL + AuDoreGrav;
    r.au = { head: AuH, grav: auW, cilFeed: cilAu, dissolved: Adis, adsorbed: Aads, eluted: AuEluted, tailsSolids: AuTailSolids, tailsSol: AuSolLoss, tailsFines: AuFines, tails: AuTails, downLoss: AuDownLoss, dore: AuDore, doreCIL: AuDoreCIL,
      recCIL: Aads / cilAu * 100, recLeach: Adis / cilAu * 100, recGlobal: AuDore / AuH * 100, tailGrade: AuTails / cilDry, closure: AuH - (AuDore + AuTails + AuDownLoss),
      byYear_kg: (AuDore * p.opDays) / 1000, doreKg: AuDore / (p.doreFine / 100) / 1000, oz_d: AuDore / 31.1035 };

    /* 14) Elución, electroobtención */
    const eluVol = AuEluted / p.richAu; // m³/d (g/d ÷ mg/L)
    const poor = p.richAu * (1 - p.ewEff / 100);
    r.elu = { carbon: mc, loading, eluVol, bv: eluVol / (mc / 450), poor, naoh_kg: eluVol * 15, q_b: (1 - p.eluEff / 100) * loading, residence: r.cil.carbonInv / mc };
    if (loading < 1) flag('info', 'carbon_low', 'Carga del carbón < 1 kg Au/t C: se está transfiriendo más carbón del necesario.');
    if (poor >= 5) flag('info', 'ew_poor', `Solución pobre ${poor.toFixed(1)} mg/L (Proyecto: < 5 mg/L).`);

    /* 15) Energía */
    const kAgit = p.agitKW * N * H;
    const airFlow = 3; // m³/min, del Proyecto
    const dP = 1340 * 9.81 * 2.9 / 1000 + 5; // kPa: sumergencia ≈ 2,9 m + pérdidas
    const kComp = ((airFlow / 60) * dP) / 0.6; // kW
    const kEW = (p.ewVolt * p.ewAmp * p.ewCells / 1000) * 24;
    const eluHeat = (eluVol * 1000 * 4.18 * (p.eluTemp - 25)) / 3600 / 0.7; // kWh/d
    const regen = (mc * (0.85 * (700 - 25) + 0.5 * (2257 + 4.18 * 75))) / 3600 / 0.5; // kWh/d
    const items = [
      { k: 'Trituración (Bond)', v: r.crush.kWhd, src: 'SUP' }, { k: 'Molienda (Bond)', v: r.mill.kWhd / 0.95, src: 'SUP' },
      { k: `Agitadores (${N} × ${p.agitKW} kW)`, v: kAgit, src: 'DOC' }, { k: 'Compresor de aire', v: kComp * H, src: 'SUP' },
      { k: 'Electroobtención (V·I)', v: kEW, src: 'RANGO' }, { k: 'Calentamiento de eluyente', v: eluHeat, src: 'SUP' }, { k: 'Regeneración de carbón', v: regen, src: 'SUP' },
    ];
    const kTot = items.reduce((a, c) => a + c.v, 0);
    r.energy = { items, total: kTot, perT: kTot / F, perOz: kTot / Math.max(1e-9, r.au.oz_d), agitUtil: p.agitKW * 1000 / (Veff * 1000) };
    const o2Dem = stoichO2 + 0.615 * (cn.side * 0.5 * (MW.CN / MW.NaCN)) + 0.02 * F;
    const airNeed = o2Dem / (0.08 * 0.299 * 1440); // m³/min con 8 % de transferencia
    r.air = { o2Dem, airNeed, util: airNeed / airFlow };

    /* 16) Corrientes (tabla de balance) */
    const S = [];
    const pct = (s, w) => (s + w > 0 ? (s / (s + w)) * 100 : 0);
    const st = (id, name, from, to, type, solids, water, au, extra) => S.push(Object.assign({ id, name, from, to, type, solids, water, pct: pct(solids, water), au }, extra || {}));
    st('s01', 'Mineral ROM', 1, 2, 'ore', F, Wore, AuH);
    st('s02', 'Alimentación a mandíbula (fresca)', 2, 3, 'ore', F, Wore, AuH);
    st('s03', 'Producto de la trituradora', 3, 4, 'ore', Pcr, Wore, AuH * Pcr / F, { note: 'incluye carga circulante' });
    st('s04', 'Recirculación de gruesos', 4, 3, 'recycle', Rcr, 0, AuH * Rcr / F);
    st('s05', 'Finos a tolva', 4, 5, 'ore', F, Wore, AuH);
    st('s06', 'Alimentación al molino', 5, 6, 'ore', F, Wore, AuH);
    st('s07', 'Descarga del molino + sumidero', 6, 7, 'pulp', D, Wcf, AuH * D / F);
    st('s08', 'Descarga (gruesos) del ciclón', 7, 6, 'recycle', U, Wuf, AuH * U / F);
    st('s09', 'Rebose del ciclón (pulpa)', 7, 8, 'pulp', F, Wof, AuH, { p80: p.p80 });
    st('s10', 'Pulpa a gravimetría', 8, 9, 'pulp', F, Wof, AuH);
    st('s11', 'Concentrado Knelson', 9, 10, 'gold', Mk, Wk, auK);
    st('s12', 'Colas Knelson', 9, 11, 'pulp', F - Mk, Wof - 0, AuH - auK);
    st('s13', 'Colas Wilfley', 10, 11, 'pulp', Mk - Mw, Wk, auK - auW);
    st('s14', 'Concentrado Wilfley a fundición', 10, 17, 'gold', Mw, 0, auW);
    st('s15', 'Concentrado de flotación', 11, 12, 'pulp', Mc, Wconc, auConc);
    st('s16', 'Colas de flotación', 11, 13, 'pulp', flotTails.solids, flotTails.water, flotTails.au);
    st('s17', 'Torta de concentrado repulpada', 12, 14, 'pulp', Mc, Wcake, auConc);
    st('s18', 'Pulpa espesada + dilución', 13, 14, 'pulp', flotTails.solids, Wuf_th + Wdil2 + Wreact, flotTails.au, { dil: Wdil2 });
    st('s19', 'Carbón cargado', 14, 15, 'carbon', mc / 1000, 0, AuEluted, { gt: loading * 1000, unitGt: 'g Au/t C' });
    st('s20', 'Solución rica', 15, 16, 'solution', 0, eluVol, AuEluted, { mgL: p.richAu });
    st('s21', 'Solución pobre', 16, 15, 'recycle', 0, eluVol, eluVol * poor, { mgL: poor });
    st('s22', 'Oro catódico (lodo)', 16, 17, 'gold', 0, 0, AuEluted);
    st('s23', 'Barra doré', 17, 18, 'gold', 0, 0, AuDore, { doreKg: r.au.doreKg });
    st('s24', 'Pulpa de relave CIL', 14, 19, 'tailings', cilDry, Wcil_real, AuTails);
    st('s25', 'Pulpa destoxificada', 19, 20, 'tailings', cilDry, Wcil_real, AuTails, { cnwad: cnRes });
    st('s26', 'Relave filtrado (a depósito)', 20, 0, 'tailings', cilDry, Wtc, AuTails);
    S.forEach((s) => { if (s.gt == null && s.solids > 0 && s.type !== 'carbon') s.gt = s.au / s.solids; });
    r.streams = S;

    r.sums = { feedSolids: F, tailSolids: cilDry, solidsClosure: F - (cilDry + Mw), Wcil_real, Wtc };
    r.cil.Wcil_real = Wcil_real;
    r.kin = { K: cal.K, cf: cal.cf, kEff75: kFn({ d: 75 }), gpH };
    r.cn = cn;
    r.cal = cal;
    return r;
  }

  /* ---------- calibración con el punto de diseño del Proyecto ---------- */
  function calibrate(target) {
    target = target || 0.90;
    const p0 = GS.defaults();
    const ps = psd(p0.p80, p0.rrN);
    const sumW = ps.classes.reduce((a, c) => a + c.w * Math.pow(c.d / 75, M_EXP), 0);
    const cf = 0.04 / sumW; // f∞ medio = 4 % (techo 96 % con O₂ o Pb(NO₃)₂, Proyecto §3.1)
    let lo = 1e-6, hi = 10;
    for (let i = 0; i < 80; i++) {
      const mid = Math.sqrt(lo * hi);
      const rr = simulate(p0, { K: mid, cf }).au.recCIL / 100;
      if (rr < target) lo = mid; else hi = mid;
    }
    const K = Math.sqrt(lo * hi);
    const base = simulate(p0, { K, cf });
    const cal = { K, cf, cn: { T0: 0.6 * p0.feedTpd, S0: base.reag.stoichNaCN !== undefined ? base.reag.stoichNaCN : base.cn.stoich, Wcil0: base.cil.Wcil, hold0: (p0.feedTpd / p0.opHours) * base.cil.tauTot } };
    cal.cn.S0 = base.cn.stoich;
    return cal;
  }
  GS.MW = MW; GS.doSat = doSat; GS.alphaCN = alphaCN; GS.psd = psd; GS.simulate = simulate; GS.calibrate = calibrate;
  GS.CAL = calibrate();
  GS.run = (p) => simulate(p, GS.CAL);
  GS.sweep = (p, id, vals, fn) => vals.map((v) => { const q = Object.assign({}, p, { [id]: v }); return { x: v, y: fn(GS.run(q), q), r: null }; });
})(typeof globalThis !== 'undefined' ? globalThis : this);
