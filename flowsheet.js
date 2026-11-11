/* ============================================================================
 * flowsheet.js — Diagrama de flujo interactivo (20 operaciones del Proyecto, Fig. 1)
 * Numeración y disposición en serpentín idénticas a la Figura 1 de Proyecto.pdf
 * ========================================================================== */
(function (root) {
  const GS = (root.GS = root.GS || {});
  const NW = 240, NH = 130, COLX = [40, 360, 680, 1000], ROWY = [30, 230, 430, 630, 830];
  const GROUPCOL = { gris: '#6b7280', azul: '#3b6fb6', verde: '#1f9d8a', oro: '#b8860b' };
  const nf = (x, d) => (isFinite(x) ? Number(x).toLocaleString('es-CO', { minimumFractionDigits: d, maximumFractionDigits: d }) : '–');

  /* col,row en la cuadrícula del serpentín de la Figura 1 */
  const NODES = [
    { id: 1, name: 'Entrada de mineral', sub: 'Mineral de mina (ROM)', c: 0, r: 0, g: 'gris', icon: 'ore', tag: 'ROM',
      specs: [['Tamaño', 'hasta 1 m', 'DOC'], ['Ley', '1–5 g/t típica (diseño 10 g/t)', 'DOC'], ['Humedad', '3–8 %', 'DOC']], vars: ['feedTpd', 'headGrade', 'moisture', 'opHours'],
      kpi: (r) => [['Mineral seco', nf(r.p.feedTpd, 1), 't/d'], ['Oro contenido', nf(r.au.head, 0), 'g/d'], ['Humedad → agua', nf(r.water.Wore, 2), 'm³/d']] },
    { id: 2, name: 'Tolva de gruesos', sub: 'Almacena mineral', c: 1, r: 0, g: 'azul', icon: 'hopper', tag: 'TV-101',
      specs: [['Capacidad', '1–2 h de producción', 'DOC'], ['Ángulo de paredes', '> 60°', 'DOC'], ['Parrilla', '300–600 mm', 'DOC']], vars: ['romF80'],
      kpi: (r) => [['Volumen para 1,5 h', nf(r.crush.binCoarse_m3, 1), 'm³'], ['Parrilla', '300–600', 'mm']] },
    { id: 3, name: 'Trituradora de mandíbulas', sub: 'Reduce de ROM a 50–100 mm', c: 2, r: 0, g: 'azul', icon: 'jaw', tag: 'CR-101',
      specs: [['Alimentación', '< 600 mm', 'DOC'], ['Abertura de descarga', '40–100 mm', 'DOC'], ['Relación de reducción', '4:1 a 8:1', 'DOC'], ['Capacidad', 'sin dato (supuesto)', 'SUP']], vars: ['romF80', 'jawCSS', 'crushCap', 'crushHours', 'wi'],
      kpi: (r) => [['Carga', nf(r.crush.tph, 1) + ' t/h', ''], ['Utilización', nf(r.crush.util * 100, 0), '%'], ['Energía (Bond)', nf(r.crush.wSp, 2), 'kWh/t']] },
    { id: 4, name: 'Criba vibratoria', sub: 'Separa por tamaño', c: 3, r: 0, g: 'azul', icon: 'screen', tag: 'SC-101',
      specs: [['Malla', '12–25 mm', 'DOC'], ['Inclinación', '15–20°', 'DOC'], ['Eficiencia', '85–95 %', 'DOC']], vars: ['screenAp', 'screenEff'],
      kpi: (r) => [['Carga circulante', nf(r.crush.cl, 0), '%'], ['Recirculación', nf(r.crush.Rcr, 1), 't/d']] },
    { id: 8, name: 'Pulpa', sub: 'Mineral y agua', c: 0, r: 1, g: 'verde', icon: 'tank', tag: 'TK-201',
      specs: [['Sólidos', '30–45 %', 'DOC'], ['Densidad', '1,3–1,5 t/m³', 'DOC'], ['P80', '75–150 µm', 'DOC']], vars: ['cycOFSolids', 'p80'],
      kpi: (r) => [['Sólidos', nf(r.streams.find((s) => s.id === 's10').pct, 1), '%'], ['P80', nf(r.p.p80, 0), 'µm'], ['−75 µm', nf(r.pass75, 0), '%']] },
    { id: 7, name: 'Hidrociclón', sub: 'Clasifica por tamaño', c: 1, r: 1, g: 'azul', icon: 'cyclone', tag: 'HC-201',
      specs: [['Presión', '40–100 kPa', 'DOC'], ['Sólidos en alimentación', '30–50 %', 'DOC'], ['Rebose → pulpa fina', 'gruesos al molino', 'DOC']], vars: ['cycFeedSolids', 'cycOFSolids'],
      kpi: (r) => [['Sólidos descarga', nf(r.mill.ufSolids, 0), '%'], ['Rebose', nf(r.streams.find((s) => s.id === 's09').pct, 0), '% sól.'], ['Agua dilución', nf(r.mill.Wsump, 1), 'm³/d']] },
    { id: 6, name: 'Molino de bolas', sub: 'Reduce a polvo', c: 2, r: 1, g: 'azul', icon: 'mill', tag: 'ML-201',
      specs: [['P80', '75–150 µm', 'DOC'], ['Sólidos', '65–75 %', 'DOC'], ['Velocidad crítica', '70–80 %', 'DOC'], ['Llenado de bolas', '30–40 %', 'DOC'], ['Carga circulante', '150–300 %', 'DOC'], ['Potencia instalada', 'sin dato (supuesto)', 'SUP']], vars: ['p80', 'wi', 'millPower', 'millSolids', 'cycCL', 'rrN'],
      kpi: (r) => [['Potencia requerida', nf(r.mill.kWreq, 1), 'kW'], ['Utilización', nf(r.mill.util * 100, 0), '%'], ['Energía (Bond)', nf(r.mill.wSp, 1), 'kWh/t']] },
    { id: 5, name: 'Tolva de finos', sub: 'Almacena finos', c: 3, r: 1, g: 'azul', icon: 'bin', tag: 'TV-102',
      specs: [['Capacidad', '8–24 h', 'DOC'], ['Humedad', '< 8 %', 'DOC']], vars: [],
      kpi: (r) => [['Volumen para 16 h', nf(r.crush.binFines_m3, 1), 'm³'], ['Humedad', nf(r.p.moisture, 1), '%']] },
    { id: 9, name: 'Knelson', sub: 'Concentra oro libre', c: 0, r: 2, g: 'verde', icon: 'knelson', tag: 'GR-301',
      specs: [['Fuerza centrífuga', '60–200 G', 'DOC'], ['Agua de fluidización', '20–70 kPa', 'DOC'], ['Sólidos', '30–40 %', 'DOC'], ['Tamaño', '< 6 mm', 'DOC'], ['Recupera', '30–70 % del oro libre', 'DOC']], vars: ['gravFree', 'knelsonMass', 'knelsonRec'],
      kpi: (r) => [['Concentrado', nf(r.grav.kgConc, 0), 'kg/d'], ['Oro al concentrado', nf(r.grav.auK, 1), 'g/d']] },
    { id: 10, name: 'Mesa Wilfley', sub: 'Oro a fundición', c: 1, r: 2, g: 'verde', icon: 'table', tag: 'GR-302',
      specs: [['Sólidos', '20–30 %', 'DOC'], ['Golpes', '250–300/min', 'DOC'], ['Carrera', '10–25 mm', 'DOC'], ['Pendiente', '2–6°', 'DOC']], vars: ['wilfleyRec', 'wilfleyMass'],
      kpi: (r) => [['Oro a fundición', nf(r.grav.auW, 1), 'g/d'], ['Concentrado', nf(r.grav.Mw * 1000, 1), 'kg/d']] },
    { id: 11, name: 'Flotación', sub: 'Sulfuros auríferos', c: 2, r: 2, g: 'verde', icon: 'flot', tag: 'FL-301',
      specs: [['Sólidos', '25–35 %', 'DOC'], ['pH', '7–10', 'DOC'], ['Tiempo', '10–30 min por etapa', 'DOC'], ['Xantato', '20–100 g/t', 'DOC'], ['Espumante MIBC', '10–40 g/t', 'DOC']], vars: ['sulfAu', 'sulfLeach', 'flotSolids', 'flotPull', 'flotAuRec', 'xanthate', 'mibc'],
      kpi: (r) => [['Concentrado', nf(r.flot.Mc, 2), 't/d'], ['Oro en concentrado', nf(r.flot.auConc, 1), 'g/d'], ['Sólidos', nf(r.flot.feedSolidsPct, 0), '%']] },
    { id: 12, name: 'Filtro prensa', sub: 'Deshidrata concentrado', c: 3, r: 2, g: 'verde', icon: 'press', tag: 'FP-301',
      specs: [['Presión', '6–15 bar', 'DOC'], ['Humedad de la torta', '8–15 %', 'DOC'], ['Ciclo', '1–2 h', 'DOC']], vars: ['cakeConcMoist'],
      kpi: (r) => [['Torta', nf(r.flot.Mc, 2), 't/d'], ['Filtrado', nf(r.streams.find((s) => s.id === 's15').water - r.streams.find((s) => s.id === 's17').water, 2), 'm³/d'], ['Destino', 'repulpada al CIL', '']] },
    { id: 13, name: 'Espesador', sub: 'Densifica pulpa', c: 3, r: 3, g: 'oro', icon: 'thick', tag: 'TH-401',
      specs: [['Floculante', '10–40 g/t', 'DOC'], ['Sólidos en el fondo', '45–60 %', 'DOC'], ['Sedimentación', '0,5–5 m/h', 'DOC']], vars: ['thickUF', 'floc', 'settleRate'],
      kpi: (r) => [['Área requerida', nf(r.thick.area, 1), 'm²'], ['Diámetro', nf(r.thick.diam, 1), 'm'], ['Agua de rebose', nf(r.thick.Wof, 1), 'm³/d']] },
    { id: 14, name: 'Cianuración (CIL)', sub: 'Disuelve y adsorbe el oro', c: 2, r: 3, g: 'oro', icon: 'cil', tag: 'CIL-401…406',
      specs: [['Tanques', '6 × Ø 2,8 m × 3,2 m (≈ 19,7 m³)', 'DOC'], ['Volumen efectivo', '15,7 m³ por tanque', 'DOC'], ['pH', '10,5–11,5', 'DOC'], ['NaCN', '300–500 ppm', 'DOC'], ['O₂ disuelto', '6–8 mg/L', 'DOC'], ['Sólidos', '35–50 % (diseño 40 %)', 'DOC'], ['Carbón', '10–15 g/L (tanques 2–6)', 'DOC'], ['Recuperación esperada', '85–93 % con aire; hasta 96 % con O₂', 'DOC'], ['Agitador', '5,5–7,5 kW', 'DOC']],
      vars: ['cilSolids', 'tauMode', 'tauTarget', 'nacn', 'ph', 'dox', 'oxidant', 'temp', 'altitude', 'carbonConc', 'carbonXfer', 'kAds', 'limeDose', 'pbNitrate', 'cnSideFrac'],
      kpi: (r) => [['Recuperación CIL', nf(r.au.recCIL, 1), '%'], ['Residencia total', nf(r.cil.tauTot, 1), 'h'], ['NaCN', nf(r.reag.nacn, 1), 'kg/d']] },
    { id: 15, name: 'Desorción (elución)', sub: 'El oro sale del carbón', c: 1, r: 3, g: 'oro', icon: 'desorp', tag: 'EL-401',
      specs: [['Zadra', '90–95 °C, 24–48 h', 'DOC'], ['AARL', '110–140 °C, 3–4 bar, 8–12 h', 'DOC'], ['Lavado ácido', 'HCl ≈ 3 %', 'DOC'], ['Regeneración', '650–750 °C', 'DOC'], ['Carbón cargado', '1–10 kg Au/t C', 'DOC'], ['NaOH', '1–2 %', 'DOC']], vars: ['eluEff', 'richAu', 'eluTemp', 'carbonXfer'],
      kpi: (r) => [['Carga del carbón', nf(r.elu.loading, 2), 'kg Au/t C'], ['Eluato', nf(r.elu.eluVol, 1), 'm³/d'], ['Carbón', nf(r.elu.carbon, 0), 'kg/d']] },
    { id: 16, name: 'Electroobtención', sub: 'Oro en cátodos', c: 0, r: 3, g: 'oro', icon: 'ew', tag: 'EW-401',
      specs: [['Voltaje', '2–4 V', 'DOC'], ['Corriente', '100–500 A por celda', 'DOC'], ['Temperatura', '60–80 °C', 'DOC'], ['pH', '> 11', 'DOC'], ['Cátodos', 'lana de acero', 'DOC'], ['Eficiencia', '90–99 %', 'DOC']], vars: ['ewEff', 'ewVolt', 'ewAmp', 'ewCells', 'richAu'],
      kpi: (r) => [['Rica → pobre', nf(r.p.richAu, 0) + ' → ' + nf(r.elu.poor, 1), 'mg/L'], ['Oro depositado', nf(r.au.eluted, 1), 'g/d']] },
    { id: 17, name: 'Fundición', sub: 'Lodo a barra doré', c: 0, r: 4, g: 'gris', icon: 'furnace', tag: 'FD-501',
      specs: [['Temperatura', '1100–1300 °C', 'DOC'], ['Tiempo', '1–3 h por colada', 'DOC'], ['Fundentes', 'bórax, sílice, carbonato de sodio', 'DOC']], vars: ['downRec', 'doreFine'],
      kpi: (r) => [['Oro al doré', nf(r.au.dore, 1), 'g/d'], ['Barra doré', nf(r.au.doreKg, 3), 'kg/d']] },
    { id: 18, name: 'Refinación', sub: 'Oro de 99,99 %', c: 1, r: 4, g: 'gris', icon: 'refine', tag: 'RF-501',
      specs: [['Miller', 'Cl₂ a ~1100 °C → 99,5 %', 'DOC'], ['Wohlwill', 'electrólisis HAuCl₄/HCl, 60–70 °C → 99,99 %', 'DOC'], ['Doré', '60–95 % Au', 'DOC']], vars: ['doreFine', 'opDays'],
      kpi: (r) => [['Oro refinado', nf(r.au.dore, 1), 'g/d'], ['Anual', nf(r.au.byYear_kg, 1), 'kg/año'], ['', nf(r.au.oz_d, 2), 'oz t/d']] },
    { id: 19, name: 'Destrucción de cianuro', sub: 'SO₂/aire (proceso INCO)', c: 2, r: 4, g: 'gris', icon: 'detox', tag: 'DT-601',
      specs: [['Proceso INCO', 'pH 8–9; SO₂:CN 3–5 g/g', 'DOC'], ['Catalizador', 'cobre', 'DOC'], ['Tiempo', '30–120 min', 'DOC'], ['Meta CNWAD', '< 50 mg/L (o el permiso)', 'DOC']], vars: ['detoxRatio', 'detoxTime', 'cnLimit'],
      kpi: (r) => [['CNWAD entra → sale', nf(r.detox.cnIn, 0) + ' → ' + nf(r.detox.cnRes, 1), 'mg/L'], ['SO₂', nf(r.detox.so2, 1), 'kg/d']] },
    { id: 20, name: 'Filtro prensa', sub: 'Relaves secos', c: 3, r: 4, g: 'gris', icon: 'press2', tag: 'FP-601',
      specs: [['Presión', '6–15 bar', 'DOC'], ['Humedad', '15–20 %', 'DOC'], ['Ciclo', '45–90 min', 'DOC']], vars: ['tailMoist', 'waterRecycle'],
      kpi: (r) => [['Relave seco', nf(r.sums.tailSolids, 1), 't/d'], ['Agua recuperada', nf(r.water.recov, 0), 'm³/d'], ['Ley relave', nf(r.au.tailGrade, 2), 'g/t']] },
  ];
  const NODE = Object.fromEntries(NODES.map((n) => [n.id, n]));
  const nx = (n) => COLX[n.c], ny = (n) => ROWY[n.r];
  const P = (id, side, dx = 0, dy = 0) => { const n = NODE[id], x = nx(n), y = ny(n); return { L: [x, y + NH / 2], R: [x + NW, y + NH / 2], T: [x + NW / 2, y], B: [x + NW / 2, y + NH] }[side].map((v, i) => v + (i ? dy : dx)); };
  const cx = (id) => nx(NODE[id]) + NW / 2;

  const GEO = {
    s01: [P(1, 'R'), P(2, 'L')], s02: [P(2, 'R'), P(3, 'L')], s03: [P(3, 'R'), P(4, 'L')],
    s04: [P(4, 'T', -50), [cx(4) - 50, 12], [cx(3) + 50, 12], P(3, 'T', 50)],
    s05: [P(4, 'B'), P(5, 'T')], s06: [P(5, 'L'), P(6, 'R')], s07: [P(6, 'L'), P(7, 'R')],
    s08: [P(7, 'T', 50), [cx(7) + 50, 206], [cx(6) - 50, 206], P(6, 'T', -50)],
    s09: [P(7, 'L'), P(8, 'R')], s10: [P(8, 'B'), P(9, 'T')], s11: [P(9, 'R'), P(10, 'L')],
    s12: [P(9, 'B', -50), [cx(9) - 50, 585], [cx(11) - 50, 585], P(11, 'B', -50)],
    s13: [P(10, 'R'), P(11, 'L')],
    s14: [P(10, 'B', 50), [cx(10) + 50, 600], [320, 600], [320, 795], [230, 795], P(17, 'T', 70)],
    s15: [P(11, 'R'), P(12, 'L')],
    s16: [P(11, 'B', 50), [cx(11) + 50, 608], [cx(13) - 20, 608], P(13, 'T', -20)],
    s17: [P(12, 'B', 50), [cx(12) + 50, 580], [cx(14) + 80, 580], P(14, 'T', 80)],
    s18: [P(13, 'L'), P(14, 'R')],
    s19: [P(14, 'L', 0, -20), P(15, 'R', 0, -20)], s20: [P(15, 'L', 0, -20), P(16, 'R', 0, -20)], s21: [P(16, 'R', 0, 20), P(15, 'L', 0, 20)],
    s22: [P(16, 'B', -50), P(17, 'T', -50)], s23: [P(17, 'R'), P(18, 'L')],
    s24: [P(14, 'B'), P(19, 'T')], s25: [P(19, 'R'), P(20, 'L')], s26: [P(20, 'B'), [cx(20), 995]],
  };
  const TYPECOL = { ore: '#6b7280', pulp: '#2a78d6', carbon: '#3f3f46', solution: '#1baf7a', gold: '#c58a00', tailings: '#92400e', recycle: '#b4478c' };
  const TYPENAME = { ore: 'Mineral', pulp: 'Pulpa', carbon: 'Carbón cargado', solution: 'Solución', gold: 'Oro / concentrado', tailings: 'Relave', recycle: 'Recirculación' };

  /* Íconos esquemáticos (viewBox 0 0 70 60) */
  const ICONS = {
    ore: '<path d="M6 48 L22 24 L34 40 L44 30 L62 48Z" class="f"/><path d="M4 52H66" class="s"/><circle cx="46" cy="20" r="5" class="f"/>',
    hopper: '<path d="M10 10H60L44 44H26Z" class="f"/><path d="M26 44V54H44V44" class="s"/><path d="M14 18H56" class="s"/>',
    jaw: '<path d="M14 8L30 8L34 48L20 48Z" class="f"/><path d="M56 8L42 10L38 48L50 52Z" class="f"/><circle cx="22" cy="28" r="3" class="s"/>',
    screen: '<path d="M6 40L58 18L64 28L12 50Z" class="f"/><path d="M14 38L52 22M20 42L58 26M26 46L62 30" class="s"/><path d="M14 52L10 56M56 40L60 44" class="s"/>',
    tank: '<ellipse cx="35" cy="20" rx="26" ry="7" class="f"/><path d="M9 20V42C9 46 22 50 35 50S61 46 61 42V20" class="f"/><path d="M35 8V30M26 8H44" class="s"/>',
    cyclone: '<path d="M14 8H56V22L42 52H28L14 22Z" class="f"/><path d="M56 14H66M35 52V58M6 14H14" class="s"/>',
    mill: '<ellipse cx="35" cy="30" rx="24" ry="14" class="f"/><path d="M6 24H12M58 24H64M6 36H12M58 36H64" class="s"/><circle cx="26" cy="30" r="2.5" class="s"/><circle cx="35" cy="26" r="2.5" class="s"/><circle cx="44" cy="31" r="2.5" class="s"/><circle cx="34" cy="35" r="2.5" class="s"/>',
    bin: '<path d="M10 12H60L48 38H22Z" class="f"/><path d="M22 38V50H48V38" class="s"/>',
    knelson: '<path d="M18 10H52V40L44 50H26L18 40Z" class="f"/><path d="M18 22H52M18 32H52" class="s"/><path d="M56 22H64V40H56" class="s"/>',
    table: '<path d="M6 40L58 18L64 28L12 50Z" class="f"/><path d="M12 44L58 24" class="s"/><path d="M8 54H60" class="s"/>',
    flot: '<path d="M6 22H24V50H6ZM26 22H44V50H26ZM46 22H64V50H46Z" class="f"/><path d="M10 28H20M30 28H40M50 28H60" class="s"/><path d="M6 16H64" class="s"/>',
    press: '<path d="M6 18H14V46H6ZM56 18H64V46H56Z" class="f"/><path d="M14 22H56V42H14Z" class="f"/><path d="M20 22V42M26 22V42M32 22V42M38 22V42M44 22V42M50 22V42" class="s"/><path d="M6 50H64" class="s"/>',
    press2: '<path d="M6 14H12V40H6ZM42 14H48V40H42Z" class="f"/><path d="M12 18H42V36H12Z" class="f"/><path d="M18 18V36M24 18V36M30 18V36M36 18V36" class="s"/><path d="M52 48L58 34L64 48Z" class="f"/><path d="M4 48H48" class="s"/>',
    thick: '<path d="M4 22H66L56 42H14Z" class="f"/><path d="M35 8V34M26 8H44" class="s"/><path d="M4 22V18M66 22V18" class="s"/>',
    cil: '<path d="M4 18H20V50H4ZM25 18H41V50H25ZM46 18H62V50H46Z" class="f"/><path d="M12 8V30M33 8V30M54 8V30M8 8H16M29 8H37M50 8H58" class="s"/><circle cx="12" cy="42" r="2" class="s"/><circle cx="33" cy="40" r="2" class="s"/><circle cx="54" cy="43" r="2" class="s"/>',
    desorp: '<path d="M10 24H24V50H10Z" class="f"/><path d="M32 8H52L56 14V48L52 52H32L28 48V14Z" class="f"/><path d="M24 36H28M56 30H64M42 8V2" class="s"/>',
    ew: '<path d="M6 16H64V50H6Z" class="f"/><path d="M16 12V44M26 12V44M36 12V44M46 12V44M56 12V44" class="s"/><path d="M6 24H64" class="s"/>',
    furnace: '<path d="M10 20H50V48H10Z" class="f"/><path d="M18 48V38C18 32 30 32 30 38V48" class="s"/><path d="M50 26L64 34L58 44" class="s"/><path d="M52 50H66" class="s"/>',
    refine: '<path d="M8 24H44V50H8Z" class="f"/><path d="M48 44L54 32H62L66 44Z" class="f"/><path d="M52 44L56 36H60L63 44" class="s"/><circle cx="26" cy="37" r="7" class="s"/>',
    detox: '<ellipse cx="30" cy="18" rx="22" ry="6" class="f"/><path d="M8 18V44C8 48 18 52 30 52S52 48 52 44V18" class="f"/><path d="M30 6V28M22 6H38" class="s"/><path d="M56 36H66M56 30L62 36L56 42" class="s"/>',
  };

  function status(n, r) {
    const f = r.flags, has = (...ids) => f.filter((x) => ids.includes(x.id));
    const map = { 3: ['crush_cap', 'crush_circ'], 6: ['mill_cap', 'mill_water', 'sump_water'], 7: ['cyc_water', 'cyc_uf'], 11: ['flot_water', 'flot_dil'], 13: ['thick_water'], 14: ['tank_vol', 'tank_fill', 'ph_hcn', 'do_sat', 'carbon_sat', 'carbon_load', 'sol_loss', 'cil_dil'], 15: ['carbon_low'], 16: ['ew_poor'], 19: ['cn_limit', 'cnwad_in'], 20: ['tail_water'] };
    const hit = has(...(map[n.id] || []));
    if (hit.some((x) => x.lvl === 'error')) return 'error';
    if (hit.some((x) => x.lvl === 'warn')) return 'warn';
    return 'ok';
  }

  function stats(r, sid, mode) {
    const s = r.streams.find((x) => x.id === sid); if (!s) return '';
    if (mode === 'solids') return s.solids > 0 ? nf(s.solids, s.solids < 1 ? 2 : 1) + ' t/d' : (s.type === 'carbon' ? nf(s.solids * 1000, 0) + ' kg/d' : '');
    if (mode === 'water') return s.water > 0 ? nf(s.water, 1) + ' m³/d' : '';
    if (mode === 'pct') return s.solids > 0 && s.water > 0 ? nf(s.pct, 0) + ' % sól.' : '';
    if (mode === 'au') return s.au > 0 ? nf(s.au, s.au < 10 ? 1 : 0) + ' g Au/d' : '';
    return '';
  }

  function render(host, r, opts) {
    const mode = opts.mode, sel = opts.sel;
    let g = '';
    // Corrientes
    r.streams.forEach((s) => {
      const pts = GEO[s.id]; if (!pts) return;
      const flow = Math.max(s.solids, s.water / 3, s.au / 150, 0.05);
      const w = Math.max(1.6, Math.min(6.5, 1.2 + 1.1 * Math.log(1 + flow)));
      const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0] + ' ' + p[1]).join('');
      const col = TYPECOL[s.type] || '#555', dash = s.type === 'recycle' ? 'stroke-dasharray="7 5"' : '';
      const act = sel && sel.kind === 's' && sel.id === s.id ? ' sel' : '';
      g += `<g class="strm${act}" data-s="${s.id}"><path d="${d}" fill="none" stroke="transparent" stroke-width="16"/><path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linejoin="round" ${dash} marker-end="url(#ar-${s.type})"/>${s.type !== 'recycle' ? `<path d="${d}" class="flow" fill="none" stroke="#fff" stroke-width="${Math.max(1, w * 0.35)}" stroke-dasharray="3 13" stroke-linejoin="round"/>` : ''}`;
      // etiqueta
      const lab = stats(r, s.id, mode);
      if (lab) {
        let bi = 0, bl = -1; for (let i = 0; i < pts.length - 1; i++) { const l = Math.abs(pts[i + 1][0] - pts[i][0]) + Math.abs(pts[i + 1][1] - pts[i][1]); if (l > bl) { bl = l; bi = i; } }
        const mx = (pts[bi][0] + pts[bi + 1][0]) / 2, my = (pts[bi][1] + pts[bi + 1][1]) / 2, tw = lab.length * 6.1 + 12;
        g += `<g class="lab"><rect x="${mx - tw / 2}" y="${my - 10}" width="${tw}" height="19" rx="9" fill="#fff" stroke="${col}" stroke-width="1.2"/><text x="${mx}" y="${my + 4}" text-anchor="middle">${lab}</text></g>`;
      }
      g += '</g>';
    });
    // Nodos
    NODES.forEach((n) => {
      const x = nx(n), y = ny(n), col = GROUPCOL[n.g], st = status(n, r), act = sel && sel.kind === 'n' && sel.id === n.id ? ' sel' : '';
      const k = n.kpi(r).slice(0, 3);
      g += `<g class="node${act}" data-n="${n.id}" transform="translate(${x} ${y})" tabindex="0" role="button" aria-label="${n.id}. ${n.name}">
        <rect class="card" width="${NW}" height="${NH}" rx="8"/><rect width="${NW}" height="30" rx="8" fill="${col}"/><rect y="22" width="${NW}" height="8" fill="${col}"/>
        <circle cx="19" cy="15" r="11" fill="#fff"/><text x="19" y="19.5" text-anchor="middle" class="num" fill="${col}">${n.id}</text>
        <text x="38" y="19.5" class="ttl">${n.name}</text>
        <g transform="translate(8 40) scale(0.95)" class="ico">${ICONS[n.icon]}</g>
        <text x="8" y="116" class="sub">${n.sub}</text>
        ${k.map((it, i) => `<text x="${NW - 8}" y="${52 + i * 18}" text-anchor="end" class="kv"><tspan class="kn">${it[0] ? it[0] + ' ' : ''}</tspan><tspan class="kx">${it[1]}</tspan><tspan class="ku"> ${it[2]}</tspan></text>`).join('')}
        <circle cx="${NW - 12}" cy="15" r="5" class="st st-${st}"/></g>`;
    });
    g += `<text x="${cx(20)}" y="1008" text-anchor="middle" class="term">Depósito de relaves filtrados</text><path d="M${cx(18)} 960V995" stroke="#c58a00" stroke-width="5" marker-end="url(#ar-gold)"/><text x="${cx(18)}" y="1008" text-anchor="middle" class="term">Oro refinado 99,99 %</text>`;
    const defs = '<defs>' + Object.entries(TYPECOL).map(([t, c]) => `<marker id="ar-${t}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="${c}"/></marker>`).join('') + '</defs>';
    host.innerHTML = `<svg viewBox="0 0 1280 1020" class="fs" role="img" aria-label="Diagrama de flujo de la planta">${defs}${g}</svg>`;
  }

  GS.flow = { NODES, NODE, GEO, TYPECOL, TYPENAME, GROUPCOL, render, status, stats };
})(typeof globalThis !== 'undefined' ? globalThis : this);
