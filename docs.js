/* ============================================================================
 * docs.js — Contenido documental: ecuaciones, análisis de los documentos,
 * datos faltantes y contradicciones. Se muestra en la pestaña "Modelo y datos".
 * ========================================================================== */
(function (root) {
  const GS = (root.GS = root.GS || {});
  GS.DOCS = {
    sources: [
      ['Proyecto.pdf (prioritario)', 'Diagrama de flujo de 20 operaciones (Fig. 1), Tabla 1 con entradas, salidas y parámetros, diseño de la lixiviación (§3), balances de masa de pulpa, oro y reactivos.'],
      ['Srithammavut (2008) Modeling of gold cyanidation', 'Cinética de disolución (Ec. 22–32), transferencia de masa, efecto de O₂, CN, pH, tamaño, temperatura, CIL/CIP y adsorción en carbón (Ec. 34–36).'],
      ['Yahya et al. (2020) IOP Conf. Ser. 736, 022111', 'Simulación de lixiviación con HSC: 5 tanques CSTR en serie, estequiometría 4Au + 8NaCN + O₂ + 2H₂O. Se usa como referencia de configuración en serie.'],
      ['Ray & Ray (2018) cap. 1–6', 'Cinética metalúrgica: modelo de núcleo sin reaccionar, control químico y difusional; cap. 5 Ec. 5.18–5.26 (cianuración electroquímica controlada por difusión de CN⁻ y O₂).'],
    ],
    eqs: [
      { sec: 'Alimentación y trituración', items: [
        { t: 'Mineral y agua del ROM', e: 'F_h = F_d / H            W_mineral = F_d · m / (1 − m)', s: 'Proyecto §3.3 (2,08 t/h × 24 h)', a: 'Base seca. m = humedad (3–8 %, Tabla 1).' },
        { t: 'Circuito cerrado mandíbula + criba', e: 'p_pass = min(1, (a / x_top)^0,75),  x_top = 1,5·CSS\nP = F / (η_criba · p_pass)    CL = P/F − 1', s: 'Tabla 1 (abertura 40–100 mm; malla 12–25 mm; eficiencia 85–95 %)', a: 'SUPUESTO: distribución del producto tipo Gates–Gaudin–Schuhmann (m = 0,75; tamaño máximo = 1,5 × abertura). No hay curva del equipo en los documentos.' },
        { t: 'Energía de conminución (Bond)', e: 'W = 10 · Wi · (1/√P80 − 1/√F80)     [kWh/t, tamaños en µm]', s: 'Ecuación estándar de Bond (no está en los documentos)', a: 'SUPUESTO: Wi = 14 kWh/t. F80 del molino = 0,8 × malla de la criba.' } ] },
      { sec: 'Molienda, hidrociclón y distribución granulométrica', items: [
        { t: 'Balance de sólidos y agua del circuito molino–ciclón', e: 'D = F(1 + CL)    U = F·CL\nAgua(x) = Sólidos·(1 − x)/x\nW_UF = W_alim.ciclón − W_rebose\nAgua al molino = W_descarga − W_UF − W_mineral', s: 'Tabla 1 (65–75 % sólidos molino; 30–50 % ciclón; 150–300 % carga circulante)', a: 'La descarga del ciclón resulta del balance (se valida contra 55–75 %).' },
        { t: 'Distribución de tamaños (Rosin–Rammler)', e: 'F(x) = 1 − exp[−(x/x0)^n]     x0 = P80 / (−ln 0,2)^(1/n)', s: 'Modelo estándar', a: 'SUPUESTO: n = 1,2. Se discretiza en 14 clases (0–1000 µm).' } ] },
      { sec: 'Gravimetría, flotación y espesamiento', items: [
        { t: 'Reparto de oro y masa', e: 'Au_libre = Au_cabeza · φ_libre\nAu_Knelson = Au_libre · E_K     Au_Wilfley = Au_Knelson · E_W\nAu_conc.flotación = Au_cabeza · φ_sulf · E_flot\nTorta de flotación → repulpada al CIL', s: 'Tabla 1 (Knelson 30–70 % del oro libre; 0,1–0,5 % de la masa)', a: 'Caso base fiel al Proyecto: φ_libre = φ_sulf = 0 (decisión del usuario). El oro de la torta vuelve al CIL (decisión del usuario).' },
        { t: 'Espesador', e: 'W_UF = S·(1 − x_UF)/x_UF     A = Q_rebose / v_sed', s: 'Tabla 1 (45–60 % de sólidos; 0,5–5 m/h)', a: 'El CIL pide 40 %: la pulpa espesada se diluye con agua recirculada.' } ] },
      { sec: 'Lixiviación (CIL)', items: [
        { t: 'Caudal y tiempo de residencia', e: 'Q_pulpa = F_h/SG + W_h    τ_tanque = V_ef / Q_pulpa    τ_total = N·τ_tanque', s: 'Proyecto §3.3 (3,9 m³/h; 94 m³; 24 h)', a: 'Modo "equipo": V_ef fijo. Modo "objetivo": V_ef = τ·Q/N, validado contra el volumen geométrico.' },
        { t: 'Velocidad de disolución (por clase de tamaño j)', e: '−dC/dt = k_j · (C − C∞,j)²     [C en g/t]\nk_j = K · [f_mt / f_mt,ref] · 10^(−0,1(pH−11)) · (75 / d_j)\nf_mt = D_CN·D_O2·[CN⁻]·[O₂] / (D_CN·[CN⁻] + 4·D_O2·[O₂])', s: 'Orden ≈ 2 en oro: Srithammavut Ec. 25 y conclusiones (Ec. 59–60). f_mt: Ray & Ray Ec. 5.23 y Srithammavut Ec. 22 (D_CN = 1,83·10⁻⁵, D_O2 = 2,76·10⁻⁵ cm²/s). Área específica ∝ 1/d: Ec. 44–45.', a: 'K es una constante CALIBRADA con un único punto del Proyecto (90 % a 24 h). El factor de pH (−0,1/unidad) es un SUPUESTO cualitativo (§4.3 tesis). D(T) por Stokes–Einstein con viscosidad de Vogel.' },
        { t: 'Cadena de reactores de mezcla perfecta', e: 'Δ_sal = [−1 + √(1 + 4·τ·k·Δ_ent)] / (2·τ·k)     Δ = C − C∞', s: 'Solución exacta de C_ent − C = τ·k·(C − C∞)²', a: 'Srithammavut §6; Yahya et al.: tanques en serie (CSTR).' },
        { t: 'Fracción no lixiviable', e: 'f∞,j = c_f · (d_j/75)^0,2  (+ oro en sulfuros no lixiviable)\nc_f tal que Σ w_j·f∞,j = 4 %', s: 'Techo de 96 % con O₂ o Pb(NO₃)₂ (Proyecto §3.1); residual creciente con el tamaño (Srithammavut Fig. 11)', a: 'SUPUESTO calibrado: exponente 0,2 elegido para que P80 = 150 µm dé ≈ 85 % (límite inferior 85–93 % del Proyecto).' },
        { t: 'Especiación de cianuro y O₂ disuelto', e: '[CN⁻] = (NaCN/49,007)·α     α = 1/(1 + 10^(9,31 − pH))\nO₂sat = f(T, altitud, y_O₂) (Benson–Krause) · P/101,3 · y_O₂/0,2095', s: 'Saturación 8,2 mg/L a 25 °C y nivel del mar (Proyecto §3.1)', a: 'pKa = 9,31 es un dato estándar. El O₂ pedido se limita a la saturación alcanzable.' } ] },
      { sec: 'Adsorción en carbón, elución y electroobtención', items: [
        { t: 'Adsorción por tanque con carbón', e: 'C_L,i = (Q_L·C_L,i−1 + R_dis,i) / (Q_L + k_ads·a_i·M_C,i)\na_i = max(0,02; 1 − q_i/q_max)', s: 'Cinética de primer orden: Srithammavut Ec. 35–36 (Marsden & House); q_max = 20 kg Au/t C (§5.2)', a: 'SUPUESTO: k_ads = 0,3 L/(g·h); la actividad lineal con la carga reemplaza la isoterma de Freundlich, que no tiene constantes en los documentos.' },
        { t: 'Balance de carbón en contracorriente', e: 'q_i = q_i+1 + R_ads,i / m_c     q_b = (1 − η_elución)·q_primero', s: 'CIL contracorriente (Srithammavut §5.1.2.1, 5.2)', a: 'm_c = carbón transferido a elución (kg/d). Oro eluido = adsorbido − oro en finos de carbón.' },
        { t: 'Elución y electroobtención', e: 'V_eluato = Au_eluido / C_rica     C_pobre = C_rica·(1 − η_EW)\nE_EW = V·I·n_celdas·24 h', s: 'Tabla 1 (50–300 mg/L; 2–4 V; 100–500 A; eficiencia 90–99 %)', a: 'La solución pobre y el carbón eluido recirculan: no son pérdida neta. Recuperación neta aguas abajo = 100 % por defecto (sin datos de pérdidas).' } ] },
      { sec: 'Reactivos, cianuro y agua', items: [
        { t: 'Estequiometría', e: '4Au + 8NaCN + O₂ + 2H₂O → 4NaAu(CN)₂ + 4NaOH\nNaCN = 2·49,007/196,967 · Au_disuelto = 0,4976 g/g\nO₂ = 31,998/(4·196,967) · Au_disuelto', s: 'Proyecto §3.3 (225 g/d NaCN y 18 g/d O₂); Yahya et al. Ec. 1', a: 'Se reproduce 224 g/d y 18,3 g/d.' },
        { t: 'Consumo real de NaCN', e: 'NaCN = estequiométrico + reacciones con cianicidas + NaCN que sale con la solución\nsalida = ξ·C_NaCN·W_pulpa     cianicidas ∝ C·(masa de sólidos en tanques)·f(pH, T, tamaño)', s: '30 kg/d = 0,6 kg/t (Proyecto §3.2–3.3)', a: 'SUPUESTO: partición 35 % cianicidas / resto en solución (el Proyecto no la desglosa). f(pH): pérdida por HCN; f(T): Arrhenius con 40 kJ/mol; f(tamaño): (75/P80)^0,5.' },
        { t: 'Destrucción de cianuro (INCO)', e: 'SO₂ = (SO₂:CN)·CN_kg/d     η = min(1, r/3)·(1 − exp(−t/20 min))\nCN_res = CN_ent·(1 − η)', s: 'Tabla 1 (3–5 g/g; 30–120 min; meta < 50 mg/L)', a: 'SUPUESTO: forma de la eficiencia; no hay modelo experimental en los documentos.' },
        { t: 'Balance de agua', e: 'Demanda = agua molino + sumidero + dilución flotación + dilución CIL + soluciones\nRecuperable = rebose espesador + filtrados\nRecirculada = min(fracción·Recuperable, Demanda)\nFresca = Demanda − Recirculada     Cierre: Fresca + humedad mineral = agua en relave + purga', s: 'Proyecto §2 ítem 11 (agua recirculada)', a: 'SUPUESTO: 80 % de recirculación (decisión del usuario).' } ] },
      { sec: 'Recuperaciones', items: [
        { t: 'Definiciones', e: 'R_CIL = Au_adsorbido / Au_alimentación_CIL\nR_global = Au_doré / Au_cabeza\nAu_cabeza = Au_doré + Au_relave(sólidos + solución + finos de carbón) + pérdidas aguas abajo', s: 'Proyecto §3.3 (450 de 500 g/d)', a: 'Pérdidas metalúrgicas = oro no lixiviado, oro disuelto no adsorbido, carbón fino y pérdidas aguas abajo.' } ] },
    ],
    contradictions: [
      ['Ley de cabeza', 'Proyecto §2 cita 1–5 g/t como ley común; el balance de §3.3 implica 10 g/t (500 g/d ÷ 50 t/d).', 'Se usa 10 g/t (balance del Proyecto). Es editable.'],
      ['pH de lixiviación', 'Tabla 1 indica pH 10–11; §3.1 indica 10,5–11,5 y "nunca menos de 10,5".', 'Valor inicial 11,0 (cumple ambos). Por debajo de 10,5 el simulador marca error.'],
      ['Concentración de NaCN', 'Tabla 1: 0,5–1,5 g/L; §3.1: 300–500 ppm (0,3–0,5 g/L); §3.2–3.3 equivale a 400 g/m³.', 'Valor inicial 400 ppm.'],
      ['Sólidos del CIL vs. espesador', 'El CIL se diseña con 40 % de sólidos, pero la Tabla 1 da 45–60 % en el fondo del espesador.', 'Espesador a 45 % y dilución con agua recirculada hasta 40 %.'],
      ['Mandíbula vs. criba', 'La mandíbula descarga 40–100 mm pero la criba en circuito cerrado es de 12–25 mm; el texto menciona un cono secundario que la Figura 1 no incluye.', 'Se modela el circuito cerrado con carga circulante calculada; se marca si supera la capacidad.'],
      ['Destino de la torta de flotación', 'La Figura 1 pasa del filtro prensa (12) al espesador (13); la Tabla 1 dice que produce una torta sin indicar destino.', 'Decisión del usuario: la torta se repulpa y vuelve al CIL.'],
      ['Alcance del balance de oro', 'El balance de §3.3 solo cubre la lixiviación; la Figura 1 pone Knelson, Wilfley y flotación antes.', 'Decisión del usuario: caso base fiel al Proyecto (los 500 g/d entran al CIL).'],
      ['Recuperación esperada', 'Tabla 1: 85–95 %; §3.1: 85–93 % con aire y hasta 96 % con O₂ o nitrato de plomo.', 'Calibración a 90 %. El efecto del Pb(NO₃)₂ no se modela, por eso con O₂ el modelo llega a ≈ 93 %.'],
      ['Tesis: constante k₂', 'Srithammavut da k₂ = 0,624·10⁻¹ en la Ec. 60 y 0,624·10⁻⁶ en las conclusiones.', 'No se usan sus constantes; solo órdenes de reacción (≈ 2 en oro).'],
      ['Tesis: efecto del O₂', 'Ling et al. observan poco efecto del O₂ a 104 ppm de CN (Fig. 6), pero la Ec. 26 les da orden 0,73 en O₂.', 'Se usa la expresión mecanística de difusión (Ray & Ray 5.23), que reproduce ambas observaciones según la relación CN/O₂.'],
      ['Consumo de NaCN', '30 kg/d = 400 g/m³ × 75 m³/d: coincide con el NaCN contenido en el agua de pulpa, no solo con lo consumido.', 'Se desglosa en estequiométrico, cianicidas y salida con la solución (partición supuesta).'],
    ],
    missing: [
      'Índice de trabajo de Bond (Wi) y potencias instaladas de trituradora, molino, bombas, espesador y filtros.',
      'Capacidad nominal de la trituradora y del molino; abertura real de la mandíbula.',
      'Fracción del oro libre, ligado a sulfuros y refractario; recuperaciones de Knelson, Wilfley y flotación.',
      'Destino y tratamiento de la torta de flotación.',
      'Fracción de recirculación de agua y consumos de agua fresca.',
      'Cinética experimental del mineral (curvas de lixiviación vs. tiempo) y fracción residual de oro por tamaño.',
      'Isoterma y cinética de adsorción del carbón (K, n, k_ads); ciclo y volumen de elución.',
      'Cianicidas del mineral (Cu, Fe, S) y partición real del NaCN.',
      'Pérdidas en elución, electroobtención, fundición y refinación; contenido de plata del doré.',
      'Consumos de HCl, NaOH, fundentes, bolas de acero y floculante en el lavado, la elución y la fundición.',
    ],
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
