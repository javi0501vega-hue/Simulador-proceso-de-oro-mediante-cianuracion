/* ============================================================================
 * params.js — Registro de parámetros del simulador (única fuente de verdad).
 * Cada parámetro declara: valor inicial, unidad, rango y ORIGEN del dato:
 *   DOC  = valor explícito en Proyecto.pdf (o derivado directamente de él)
 *   RANGO= valor elegido dentro de un rango que da Proyecto.pdf (Tabla 1 / §3)
 *   SUP  = supuesto de simulación: NO hay dato en los documentos (editable)
 *   BIB  = valor de la bibliografía aportada (Srithammavut 2008, Ray & Ray 2018)
 * ========================================================================== */
(function (root) {
  const GS = (root.GS = root.GS || {});
  const P = [];
  const add = (group, id, label, unit, def, min, max, step, src, ref, opts) =>
    P.push(Object.assign({ group, id, label, unit, def, min, max, step, src, ref }, opts || {}));

  /* ---------------- Alimentación ---------------- */
  add('Alimentación', 'feedTpd', 'Mineral seco alimentado', 't/d', 50, 10, 150, 1, 'DOC', 'Proyecto §3.3: 2,08 t/h × 24 h ≈ 50 t/d');
  add('Alimentación', 'opHours', 'Horas de operación de la planta', 'h/d', 24, 8, 24, 1, 'DOC', 'Proyecto §3.3: 2,08 t/h → 50 t/d implica 24 h/d');
  add('Alimentación', 'headGrade', 'Ley de cabeza de oro', 'g/t', 10, 1, 30, 0.1, 'DOC', 'Proyecto §3.3: 500 g/d ÷ 50 t/d = 10 g/t (nota: §2 cita 1–5 g/t como típico)');
  add('Alimentación', 'moisture', 'Humedad del mineral (ROM)', '%', 5, 1, 12, 0.5, 'RANGO', 'Proyecto Tabla 1: humedad 3–8 %');
  add('Alimentación', 'solidSG', 'Gravedad específica del sólido', 't/m³', 2.7, 2.4, 3.2, 0.05, 'DOC', 'Derivada de Proyecto §3.3: 2,08 t/h y 3,9 m³/h de pulpa (con 3,13 m³/h de agua)');
  add('Alimentación', 'gravFree', 'Oro libre recuperable por gravimetría', '% del oro', 0, 0, 60, 1, 'SUP', 'Sin dato en los documentos. Caso base fiel al Proyecto: 0 % (los 500 g/d entran al CIL)');
  add('Alimentación', 'sulfAu', 'Oro asociado a sulfuros', '% del oro', 0, 0, 60, 1, 'SUP', 'Sin dato en los documentos. Caso base: 0 %');
  add('Alimentación', 'sulfLeach', 'Lixiviabilidad del oro en sulfuros', '%', 100, 0, 100, 5, 'SUP', 'Sin dato. Solo actúa si el oro en sulfuros > 0');

  /* ---------------- Conminución ---------------- */
  add('Conminución', 'romF80', 'F80 de la alimentación a trituración', 'mm', 300, 50, 800, 10, 'SUP', 'Proyecto Tabla 1: ROM < 600 mm a la mandíbula; F80 ≈ ½ de la parrilla (300–600 mm)');
  add('Conminución', 'jawCSS', 'Abertura de descarga de la mandíbula', 'mm', 50, 40, 100, 5, 'RANGO', 'Proyecto Tabla 1: 40–100 mm');
  add('Conminución', 'screenAp', 'Malla de la criba vibratoria', 'mm', 25, 12, 25, 1, 'RANGO', 'Proyecto Tabla 1: 12–25 mm');
  add('Conminución', 'screenEff', 'Eficiencia de la criba', '%', 90, 85, 95, 1, 'RANGO', 'Proyecto Tabla 1: 85–95 %');
  add('Conminución', 'crushCap', 'Capacidad de la trituradora', 't/h', 20, 5, 60, 1, 'SUP', 'Sin dato de capacidad en los documentos');
  add('Conminución', 'crushHours', 'Horas de trituración por día', 'h/d', 8, 4, 24, 1, 'SUP', 'Tolva de finos de 8–24 h desacopla trituración y molienda (Tabla 1)');
  add('Conminución', 'wi', 'Índice de trabajo de Bond (Wi)', 'kWh/t', 14, 8, 22, 0.5, 'SUP', 'Sin dato en los documentos (supuesto típico, respondido por el usuario)');
  add('Conminución', 'p80', 'P80 objetivo de molienda', 'µm', 75, 40, 200, 5, 'DOC', 'Proyecto §3.1: P80 = 75 µm (Tabla 1: 75–150 µm)');
  add('Conminución', 'rrN', 'Módulo de distribución Rosin–Rammler', '–', 1.2, 0.8, 2.0, 0.05, 'SUP', 'Forma de la distribución granulométrica del producto de molienda');
  add('Conminución', 'millPower', 'Potencia instalada del molino de bolas', 'kW', 45, 15, 150, 1, 'SUP', 'Sin dato en los documentos');
  add('Conminución', 'millSolids', 'Sólidos en la descarga del molino', '%', 70, 60, 80, 1, 'RANGO', 'Proyecto Tabla 1: 65–75 %');
  add('Conminución', 'cycCL', 'Carga circulante del molino', '%', 200, 100, 350, 10, 'RANGO', 'Proyecto Tabla 1: 150–300 %');
  add('Conminución', 'cycFeedSolids', 'Sólidos en la alimentación al hidrociclón', '%', 50, 25, 60, 1, 'RANGO', 'Proyecto Tabla 1: 30–50 %');
  add('Conminución', 'cycOFSolids', 'Sólidos en el rebose del hidrociclón (pulpa)', '%', 35, 25, 50, 1, 'RANGO', 'Proyecto Tabla 1: 30–45 %');

  /* ---------------- Gravimetría y flotación ---------------- */
  add('Gravimetría y flotación', 'knelsonMass', 'Masa a concentrado Knelson', '% de la alim.', 0.3, 0.1, 0.5, 0.05, 'RANGO', 'Proyecto Tabla 1: 0,1–0,5 % de la masa');
  add('Gravimetría y flotación', 'knelsonRec', 'Recuperación Knelson del oro libre', '%', 50, 30, 70, 5, 'RANGO', 'Proyecto Tabla 1: 30–70 % del oro libre');
  add('Gravimetría y flotación', 'wilfleyRec', 'Recuperación mesa Wilfley (del Knelson)', '%', 90, 50, 99, 1, 'SUP', 'Sin dato en los documentos');
  add('Gravimetría y flotación', 'wilfleyMass', 'Masa del concentrado Wilfley (del Knelson)', '%', 10, 2, 50, 1, 'SUP', 'Sin dato en los documentos');
  add('Gravimetría y flotación', 'flotSolids', 'Sólidos en flotación', '%', 30, 25, 35, 1, 'RANGO', 'Proyecto Tabla 1: 25–35 %');
  add('Gravimetría y flotación', 'flotPull', 'Masa a concentrado de flotación', '% de la alim.', 2, 0.5, 10, 0.5, 'SUP', 'Sin dato en los documentos');
  add('Gravimetría y flotación', 'flotAuRec', 'Recuperación de oro en sulfuros (flotación)', '%', 85, 50, 98, 1, 'SUP', 'Sin dato en los documentos');
  add('Gravimetría y flotación', 'xanthate', 'Dosis de xantato', 'g/t', 60, 20, 100, 5, 'RANGO', 'Proyecto Tabla 1: 20–100 g/t');
  add('Gravimetría y flotación', 'mibc', 'Dosis de espumante MIBC', 'g/t', 25, 10, 40, 5, 'RANGO', 'Proyecto Tabla 1: 10–40 g/t');
  add('Gravimetría y flotación', 'cakeConcMoist', 'Humedad torta filtro prensa (concentrado)', '%', 12, 8, 15, 1, 'RANGO', 'Proyecto Tabla 1: 8–15 %');
  add('Gravimetría y flotación', 'thickUF', 'Sólidos en la descarga del espesador', '%', 45, 45, 60, 1, 'RANGO', 'Proyecto Tabla 1: 45–60 % (el CIL pide 40 %: se diluye después)');
  add('Gravimetría y flotación', 'floc', 'Dosis de floculante', 'g/t', 25, 10, 40, 5, 'RANGO', 'Proyecto Tabla 1: 10–40 g/t');
  add('Gravimetría y flotación', 'settleRate', 'Velocidad de sedimentación de diseño', 'm/h', 1, 0.5, 5, 0.1, 'RANGO', 'Proyecto Tabla 1: 0,5–5 m/h (dimensiona el área del espesador)');

  /* ---------------- Lixiviación CIL ---------------- */
  add('Lixiviación CIL', 'cilSolids', 'Sólidos en la pulpa de lixiviación', '%', 40, 30, 55, 1, 'DOC', 'Proyecto §3.1: 40 % (rango 35–50 %)');
  add('Lixiviación CIL', 'nTanks', 'Número de tanques de lixiviación/CIL', '–', 6, 3, 8, 1, 'DOC', 'Proyecto §3.4: 6 tanques', { int: true });
  add('Lixiviación CIL', 'tankVolEff', 'Volumen efectivo por tanque', 'm³', 15.7, 5, 40, 0.1, 'DOC', 'Proyecto §3.3: 15,7 m³');
  add('Lixiviación CIL', 'tankVolGeom', 'Volumen geométrico por tanque (2,8 m × 3,2 m)', 'm³', 19.7, 5, 60, 0.1, 'DOC', 'Proyecto §3.4: ≈ 19,7 m³');
  add('Lixiviación CIL', 'tauMode', 'Modo de tiempo de residencia', '', 'equipo', null, null, null, 'DOC', 'equipo = tanques instalados (τ resulta del caudal); objetivo = τ manual', { choices: ['equipo', 'objetivo'] });
  add('Lixiviación CIL', 'tauTarget', 'Tiempo de residencia objetivo (modo objetivo)', 'h', 24, 6, 48, 1, 'DOC', 'Proyecto §3.1: 24 h (6 × 4 h); Tabla 1: 24–48 h');
  add('Lixiviación CIL', 'nacn', 'Concentración de NaCN', 'ppm', 400, 100, 800, 10, 'DOC', 'Proyecto §3.1: 300–500 ppm; 0,6 kg/t ÷ 1,5 m³/t de agua = 400 g/m³');
  add('Lixiviación CIL', 'ph', 'pH de la pulpa', '–', 11, 9, 12.5, 0.1, 'DOC', 'Proyecto §3.1: 10,5–11,5 (nunca < 10,5)');
  add('Lixiviación CIL', 'dox', 'Oxígeno disuelto objetivo', 'mg/L', 8, 2, 40, 0.5, 'DOC', 'Proyecto §3.1: 6–8 mg/L (saturación con aire ≈ 8,2 mg/L)');
  add('Lixiviación CIL', 'oxidant', 'Oxidante', '', 'aire', null, null, null, 'DOC', 'Proyecto §3.2: aire u oxígeno', { choices: ['aire', 'oxígeno'] });
  add('Lixiviación CIL', 'o2Purity', 'Pureza de O₂ (si oxígeno)', '% vol', 90, 50, 100, 1, 'SUP', 'Sin dato. Solo si el oxidante es oxígeno');
  add('Lixiviación CIL', 'temp', 'Temperatura de la pulpa', '°C', 25, 5, 60, 1, 'DOC', 'Proyecto §3.1: ambiente 20–25 °C');
  add('Lixiviación CIL', 'altitude', 'Altitud de la planta', 'm s. n. m.', 0, 0, 3500, 50, 'DOC', 'Proyecto §3.1: saturación referida a nivel del mar');
  add('Lixiviación CIL', 'carbonConc', 'Carbón activado en pulpa', 'g/L', 10, 5, 25, 1, 'DOC', 'Proyecto §3.1: 10–15 g/L; inventario 780 kg = 10 g/L en tanques 2–6');
  add('Lixiviación CIL', 'carbonTanks', 'Tanques con carbón (últimos)', '–', 5, 1, 8, 1, 'DOC', 'Proyecto §3.3: carbón en los tanques 2 a 6', { int: true });
  add('Lixiviación CIL', 'carbonXfer', 'Carbón transferido a elución', 'kg/d', 90, 20, 400, 5, 'SUP', 'Sin dato: equivale a 5 kg Au/t C (rango 1–10 kg/t, Tabla 1)');
  add('Lixiviación CIL', 'carbonMakeup', 'Reposición de carbón', 'g/t', 40, 10, 100, 5, 'DOC', 'Proyecto §3.2: ≈ 40 g/t');
  add('Lixiviación CIL', 'kAds', 'Constante de adsorción de Au(CN)₂⁻ en carbón', 'L/(g·h)', 0.3, 0.02, 2, 0.02, 'SUP', 'Cinética de primer orden (Marsden & House; Srithammavut Ec. 35–36). Valor no dado');
  add('Lixiviación CIL', 'qMax', 'Carga máxima de oro en carbón', 'kg Au/t C', 20, 5, 30, 1, 'BIB', 'Srithammavut §5.2: cargas de planta hasta 20 000 g/t');
  add('Lixiviación CIL', 'agitKW', 'Potencia por agitador', 'kW', 6.5, 5.5, 7.5, 0.1, 'RANGO', 'Proyecto §3.4: 5,5–7,5 kW');
  add('Lixiviación CIL', 'limeDose', 'Cal a pH de diseño', 'kg/t', 1.5, 0.5, 4, 0.1, 'DOC', 'Proyecto §3.2: 1,5 kg/t (ajustar por prueba)');
  add('Lixiviación CIL', 'pbNitrate', 'Nitrato de plomo (opcional)', 'g/t', 0, 0, 200, 10, 'DOC', 'Proyecto §3.2: opcional 100–200 g/t. SIN efecto cinético en el modelo (no hay dato)');
  add('Lixiviación CIL', 'cnSideFrac', 'Parte del NaCN que reacciona con cianicidas', '% del consumo', 35, 10, 60, 5, 'SUP', 'Proyecto §3.3 no desglosa los 30 kg/d: se asigna una partición supuesta');

  /* ---------------- Recuperación ---------------- */
  add('Recuperación del oro', 'eluEff', 'Eficiencia de elución por ciclo', '%', 98, 80, 100, 1, 'SUP', 'Sin dato. El carbón eluido recircula con la carga residual');
  add('Recuperación del oro', 'richAu', 'Oro en solución rica', 'mg/L', 150, 50, 300, 10, 'RANGO', 'Proyecto Tabla 1: 50–300 mg/L');
  add('Recuperación del oro', 'ewEff', 'Eficiencia de electroobtención por paso', '%', 97, 90, 99, 1, 'RANGO', 'Proyecto Tabla 1: 90–99 % (pobre < 5 mg/L)');
  add('Recuperación del oro', 'eluTemp', 'Temperatura de elución (Zadra)', '°C', 92.5, 90, 140, 0.5, 'RANGO', 'Proyecto Tabla 1: Zadra 90–95 °C; AARL 110–140 °C');
  add('Recuperación del oro', 'downRec', 'Recuperación neta desorción–EW–fundición', '%', 100, 90, 100, 0.5, 'SUP', 'Sin pérdidas documentadas: la solución pobre y el carbón eluido recirculan');
  add('Recuperación del oro', 'doreFine', 'Ley de la barra doré', '% Au', 80, 60, 95, 1, 'RANGO', 'Proyecto §2: 60–95 % de oro');
  add('Recuperación del oro', 'ewVolt', 'Voltaje de celda EW', 'V', 3, 2, 4, 0.1, 'RANGO', 'Proyecto Tabla 1: 2–4 V');
  add('Recuperación del oro', 'ewAmp', 'Corriente por celda EW', 'A', 300, 100, 500, 10, 'RANGO', 'Proyecto Tabla 1: 100–500 A');
  add('Recuperación del oro', 'ewCells', 'Celdas de electroobtención', '–', 2, 1, 6, 1, 'SUP', 'Sin dato', { int: true });

  /* ---------------- Relaves y agua ---------------- */
  add('Relaves y agua', 'detoxRatio', 'Dosis SO₂ : CN (INCO)', 'g/g', 4, 2, 6, 0.1, 'RANGO', 'Proyecto Tabla 1: 3–5 g SO₂/g CN');
  add('Relaves y agua', 'detoxTime', 'Tiempo de destrucción de cianuro', 'min', 60, 15, 150, 5, 'RANGO', 'Proyecto Tabla 1: 30–120 min');
  add('Relaves y agua', 'cnLimit', 'Límite CNWAD en el efluente', 'mg/L', 50, 1, 100, 1, 'DOC', 'Proyecto Tabla 1: meta CNWAD < 50 mg/L (o el permiso)');
  add('Relaves y agua', 'tailMoist', 'Humedad del relave filtrado', '%', 17.5, 15, 20, 0.5, 'RANGO', 'Proyecto Tabla 1: 15–20 %');
  add('Relaves y agua', 'waterRecycle', 'Recirculación de agua recuperable', '%', 80, 0, 100, 5, 'SUP', 'El Proyecto dice que el agua se recircula, sin fracción (respondido por el usuario)');
  add('Relaves y agua', 'opDays', 'Días de operación al año', 'd/año', 330, 200, 365, 5, 'SUP', 'Solo para anualizar la producción');

  GS.PARAMS = P;
  GS.PARAM_BY_ID = Object.fromEntries(P.map(p => [p.id, p]));
  GS.defaults = () => Object.fromEntries(P.map(p => [p.id, p.def]));
  GS.GROUPS = [...new Set(P.map(p => p.group))];
  GS.SRC_LABEL = { DOC: 'Documento', RANGO: 'Rango del doc.', SUP: 'Supuesto', BIB: 'Bibliografía', CAL: 'Calibrado' };
})(typeof globalThis !== 'undefined' ? globalThis : this);
