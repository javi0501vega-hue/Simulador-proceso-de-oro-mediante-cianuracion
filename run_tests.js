/* Pruebas del motor: node tests/run_tests.js */
require('../src/params.js'); require('../src/engine.js'); require('../src/validate.js');
const GS = globalThis.GS; let fail = 0;
const t = (name, ok, extra) => { console.log((ok ? 'OK   ' : 'FALLA'), name, extra || ''); if (!ok) fail++; };
const d = GS.defaults();
for (const row of GS.verifyDesign()) t(`Diseño: ${row.name}`, row.ok, `doc ${row.doc} · modelo ${row.model.toFixed(3)} ${row.unit}`);
const r = GS.run(d);
t('Recuperación CIL de diseño = 90 %', Math.abs(r.au.recCIL - 90) < 0.01, r.au.recCIL.toFixed(3));
t('Balance de oro cierra', Math.abs(r.au.closure) < 1e-9);
t('Balance de agua cierra', Math.abs(r.water.closure) < 1e-9);
// Casos extremos: ningún NaN y balances cierran
const cases = [{}, { feedTpd: 120 }, { feedTpd: 12 }, { headGrade: 25 }, { p80: 40 }, { p80: 200 }, { gravFree: 40, sulfAu: 30 }, { cilSolids: 55 }, { nacn: 800, ph: 12.5 }, { ph: 9 }, { oxidant: 'oxígeno', dox: 40 }, { tauMode: 'objetivo', tauTarget: 48 }, { waterRecycle: 0 }, { waterRecycle: 100 }, { nTanks: 3 }, { temp: 55, altitude: 3000 }, { carbonXfer: 20 }, { cycCL: 350, cycFeedSolids: 25 }];
for (const c of cases) {
  const p = Object.assign({}, d, c), x = GS.run(p), v = GS.validate(p, x);
  const nan = JSON.stringify(x.au).includes('null') || Object.values(x.au).some((n) => !isFinite(n));
  const bal = v.filter((e) => /Balance|Conservación|unidades/.test(e.cat) && e.lvl === 'error');
  t('Caso ' + JSON.stringify(c), !nan && bal.length === 0, `rec ${x.au.recCIL.toFixed(1)} % ${bal.map((b) => b.title).join('; ')}`);
}
const s = GS.sanity(d); s.forEach((e) => t('Coherencia: ' + e.text, e.ok, e.delta.toFixed(3)));
const o = GS.optimize(Object.assign({}, d), 'oro'); t('Optimizador devuelve resultados', o.length > 0, o[0] && JSON.stringify(o[0].vars) + ' ' + o[0].r.au.recGlobal.toFixed(2));
console.log(fail ? `\n${fail} FALLAS` : '\nTodas las pruebas pasan'); process.exit(fail ? 1 : 0);
