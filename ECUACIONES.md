# Ecuaciones, supuestos y contradicciones

Generado desde `src/docs.js` (la misma información aparece en la pestaña *Modelo y datos*).

## Alimentación y trituración

### Mineral y agua del ROM

```
F_h = F_d / H            W_mineral = F_d · m / (1 − m)
```

- **Fuente:** Proyecto §3.3 (2,08 t/h × 24 h)
- **Nota:** Base seca. m = humedad (3–8 %, Tabla 1).

### Circuito cerrado mandíbula + criba

```
p_pass = min(1, (a / x_top)^0,75),  x_top = 1,5·CSS
P = F / (η_criba · p_pass)    CL = P/F − 1
```

- **Fuente:** Tabla 1 (abertura 40–100 mm; malla 12–25 mm; eficiencia 85–95 %)
- **Nota:** SUPUESTO: distribución del producto tipo Gates–Gaudin–Schuhmann (m = 0,75; tamaño máximo = 1,5 × abertura). No hay curva del equipo en los documentos.

### Energía de conminución (Bond)

```
W = 10 · Wi · (1/√P80 − 1/√F80)     [kWh/t, tamaños en µm]
```

- **Fuente:** Ecuación estándar de Bond (no está en los documentos)
- **Nota:** SUPUESTO: Wi = 14 kWh/t. F80 del molino = 0,8 × malla de la criba.

## Molienda, hidrociclón y distribución granulométrica

### Balance de sólidos y agua del circuito molino–ciclón

```
D = F(1 + CL)    U = F·CL
Agua(x) = Sólidos·(1 − x)/x
W_UF = W_alim.ciclón − W_rebose
Agua al molino = W_descarga − W_UF − W_mineral
```

- **Fuente:** Tabla 1 (65–75 % sólidos molino; 30–50 % ciclón; 150–300 % carga circulante)
- **Nota:** La descarga del ciclón resulta del balance (se valida contra 55–75 %).

### Distribución de tamaños (Rosin–Rammler)

```
F(x) = 1 − exp[−(x/x0)^n]     x0 = P80 / (−ln 0,2)^(1/n)
```

- **Fuente:** Modelo estándar
- **Nota:** SUPUESTO: n = 1,2. Se discretiza en 14 clases (0–1000 µm).

## Gravimetría, flotación y espesamiento

### Reparto de oro y masa

```
Au_libre = Au_cabeza · φ_libre
Au_Knelson = Au_libre · E_K     Au_Wilfley = Au_Knelson · E_W
Au_conc.flotación = Au_cabeza · φ_sulf · E_flot
Torta de flotación → repulpada al CIL
```

- **Fuente:** Tabla 1 (Knelson 30–70 % del oro libre; 0,1–0,5 % de la masa)
- **Nota:** Caso base fiel al Proyecto: φ_libre = φ_sulf = 0 (decisión del usuario). El oro de la torta vuelve al CIL (decisión del usuario).

### Espesador

```
W_UF = S·(1 − x_UF)/x_UF     A = Q_rebose / v_sed
```

- **Fuente:** Tabla 1 (45–60 % de sólidos; 0,5–5 m/h)
- **Nota:** El CIL pide 40 %: la pulpa espesada se diluye con agua recirculada.

## Lixiviación (CIL)

### Caudal y tiempo de residencia

```
Q_pulpa = F_h/SG + W_h    τ_tanque = V_ef / Q_pulpa    τ_total = N·τ_tanque
```

- **Fuente:** Proyecto §3.3 (3,9 m³/h; 94 m³; 24 h)
- **Nota:** Modo "equipo": V_ef fijo. Modo "objetivo": V_ef = τ·Q/N, validado contra el volumen geométrico.

### Velocidad de disolución (por clase de tamaño j)

```
−dC/dt = k_j · (C − C∞,j)²     [C en g/t]
k_j = K · [f_mt / f_mt,ref] · 10^(−0,1(pH−11)) · (75 / d_j)
f_mt = D_CN·D_O2·[CN⁻]·[O₂] / (D_CN·[CN⁻] + 4·D_O2·[O₂])
```

- **Fuente:** Orden ≈ 2 en oro: Srithammavut Ec. 25 y conclusiones (Ec. 59–60). f_mt: Ray & Ray Ec. 5.23 y Srithammavut Ec. 22 (D_CN = 1,83·10⁻⁵, D_O2 = 2,76·10⁻⁵ cm²/s). Área específica ∝ 1/d: Ec. 44–45.
- **Nota:** K es una constante CALIBRADA con un único punto del Proyecto (90 % a 24 h). El factor de pH (−0,1/unidad) es un SUPUESTO cualitativo (§4.3 tesis). D(T) por Stokes–Einstein con viscosidad de Vogel.

### Cadena de reactores de mezcla perfecta

```
Δ_sal = [−1 + √(1 + 4·τ·k·Δ_ent)] / (2·τ·k)     Δ = C − C∞
```

- **Fuente:** Solución exacta de C_ent − C = τ·k·(C − C∞)²
- **Nota:** Srithammavut §6; Yahya et al.: tanques en serie (CSTR).

### Fracción no lixiviable

```
f∞,j = c_f · (d_j/75)^0,2  (+ oro en sulfuros no lixiviable)
c_f tal que Σ w_j·f∞,j = 4 %
```

- **Fuente:** Techo de 96 % con O₂ o Pb(NO₃)₂ (Proyecto §3.1); residual creciente con el tamaño (Srithammavut Fig. 11)
- **Nota:** SUPUESTO calibrado: exponente 0,2 elegido para que P80 = 150 µm dé ≈ 85 % (límite inferior 85–93 % del Proyecto).

### Especiación de cianuro y O₂ disuelto

```
[CN⁻] = (NaCN/49,007)·α     α = 1/(1 + 10^(9,31 − pH))
O₂sat = f(T, altitud, y_O₂) (Benson–Krause) · P/101,3 · y_O₂/0,2095
```

- **Fuente:** Saturación 8,2 mg/L a 25 °C y nivel del mar (Proyecto §3.1)
- **Nota:** pKa = 9,31 es un dato estándar. El O₂ pedido se limita a la saturación alcanzable.

## Adsorción en carbón, elución y electroobtención

### Adsorción por tanque con carbón

```
C_L,i = (Q_L·C_L,i−1 + R_dis,i) / (Q_L + k_ads·a_i·M_C,i)
a_i = max(0,02; 1 − q_i/q_max)
```

- **Fuente:** Cinética de primer orden: Srithammavut Ec. 35–36 (Marsden & House); q_max = 20 kg Au/t C (§5.2)
- **Nota:** SUPUESTO: k_ads = 0,3 L/(g·h); la actividad lineal con la carga reemplaza la isoterma de Freundlich, que no tiene constantes en los documentos.

### Balance de carbón en contracorriente

```
q_i = q_i+1 + R_ads,i / m_c     q_b = (1 − η_elución)·q_primero
```

- **Fuente:** CIL contracorriente (Srithammavut §5.1.2.1, 5.2)
- **Nota:** m_c = carbón transferido a elución (kg/d). Oro eluido = adsorbido − oro en finos de carbón.

### Elución y electroobtención

```
V_eluato = Au_eluido / C_rica     C_pobre = C_rica·(1 − η_EW)
E_EW = V·I·n_celdas·24 h
```

- **Fuente:** Tabla 1 (50–300 mg/L; 2–4 V; 100–500 A; eficiencia 90–99 %)
- **Nota:** La solución pobre y el carbón eluido recirculan: no son pérdida neta. Recuperación neta aguas abajo = 100 % por defecto (sin datos de pérdidas).

## Reactivos, cianuro y agua

### Estequiometría

```
4Au + 8NaCN + O₂ + 2H₂O → 4NaAu(CN)₂ + 4NaOH
NaCN = 2·49,007/196,967 · Au_disuelto = 0,4976 g/g
O₂ = 31,998/(4·196,967) · Au_disuelto
```

- **Fuente:** Proyecto §3.3 (225 g/d NaCN y 18 g/d O₂); Yahya et al. Ec. 1
- **Nota:** Se reproduce 224 g/d y 18,3 g/d.

### Consumo real de NaCN

```
NaCN = estequiométrico + reacciones con cianicidas + NaCN que sale con la solución
salida = ξ·C_NaCN·W_pulpa     cianicidas ∝ C·(masa de sólidos en tanques)·f(pH, T, tamaño)
```

- **Fuente:** 30 kg/d = 0,6 kg/t (Proyecto §3.2–3.3)
- **Nota:** SUPUESTO: partición 35 % cianicidas / resto en solución (el Proyecto no la desglosa). f(pH): pérdida por HCN; f(T): Arrhenius con 40 kJ/mol; f(tamaño): (75/P80)^0,5.

### Destrucción de cianuro (INCO)

```
SO₂ = (SO₂:CN)·CN_kg/d     η = min(1, r/3)·(1 − exp(−t/20 min))
CN_res = CN_ent·(1 − η)
```

- **Fuente:** Tabla 1 (3–5 g/g; 30–120 min; meta < 50 mg/L)
- **Nota:** SUPUESTO: forma de la eficiencia; no hay modelo experimental en los documentos.

### Balance de agua

```
Demanda = agua molino + sumidero + dilución flotación + dilución CIL + soluciones
Recuperable = rebose espesador + filtrados
Recirculada = min(fracción·Recuperable, Demanda)
Fresca = Demanda − Recirculada     Cierre: Fresca + humedad mineral = agua en relave + purga
```

- **Fuente:** Proyecto §2 ítem 11 (agua recirculada)
- **Nota:** SUPUESTO: 80 % de recirculación (decisión del usuario).

## Recuperaciones

### Definiciones

```
R_CIL = Au_adsorbido / Au_alimentación_CIL
R_global = Au_doré / Au_cabeza
Au_cabeza = Au_doré + Au_relave(sólidos + solución + finos de carbón) + pérdidas aguas abajo
```

- **Fuente:** Proyecto §3.3 (450 de 500 g/d)
- **Nota:** Pérdidas metalúrgicas = oro no lixiviado, oro disuelto no adsorbido, carbón fino y pérdidas aguas abajo.

## Contradicciones entre documentos

| Tema | Qué dicen | Cómo se resolvió |
|---|---|---|
| Ley de cabeza | Proyecto §2 cita 1–5 g/t como ley común; el balance de §3.3 implica 10 g/t (500 g/d ÷ 50 t/d). | Se usa 10 g/t (balance del Proyecto). Es editable. |
| pH de lixiviación | Tabla 1 indica pH 10–11; §3.1 indica 10,5–11,5 y "nunca menos de 10,5". | Valor inicial 11,0 (cumple ambos). Por debajo de 10,5 el simulador marca error. |
| Concentración de NaCN | Tabla 1: 0,5–1,5 g/L; §3.1: 300–500 ppm (0,3–0,5 g/L); §3.2–3.3 equivale a 400 g/m³. | Valor inicial 400 ppm. |
| Sólidos del CIL vs. espesador | El CIL se diseña con 40 % de sólidos, pero la Tabla 1 da 45–60 % en el fondo del espesador. | Espesador a 45 % y dilución con agua recirculada hasta 40 %. |
| Mandíbula vs. criba | La mandíbula descarga 40–100 mm pero la criba en circuito cerrado es de 12–25 mm; el texto menciona un cono secundario que la Figura 1 no incluye. | Se modela el circuito cerrado con carga circulante calculada; se marca si supera la capacidad. |
| Destino de la torta de flotación | La Figura 1 pasa del filtro prensa (12) al espesador (13); la Tabla 1 dice que produce una torta sin indicar destino. | Decisión del usuario: la torta se repulpa y vuelve al CIL. |
| Alcance del balance de oro | El balance de §3.3 solo cubre la lixiviación; la Figura 1 pone Knelson, Wilfley y flotación antes. | Decisión del usuario: caso base fiel al Proyecto (los 500 g/d entran al CIL). |
| Recuperación esperada | Tabla 1: 85–95 %; §3.1: 85–93 % con aire y hasta 96 % con O₂ o nitrato de plomo. | Calibración a 90 %. El efecto del Pb(NO₃)₂ no se modela, por eso con O₂ el modelo llega a ≈ 93 %. |
| Tesis: constante k₂ | Srithammavut da k₂ = 0,624·10⁻¹ en la Ec. 60 y 0,624·10⁻⁶ en las conclusiones. | No se usan sus constantes; solo órdenes de reacción (≈ 2 en oro). |
| Tesis: efecto del O₂ | Ling et al. observan poco efecto del O₂ a 104 ppm de CN (Fig. 6), pero la Ec. 26 les da orden 0,73 en O₂. | Se usa la expresión mecanística de difusión (Ray & Ray 5.23), que reproduce ambas observaciones según la relación CN/O₂. |
| Consumo de NaCN | 30 kg/d = 400 g/m³ × 75 m³/d: coincide con el NaCN contenido en el agua de pulpa, no solo con lo consumido. | Se desglosa en estequiométrico, cianicidas y salida con la solución (partición supuesta). |

## Datos que faltan

- Índice de trabajo de Bond (Wi) y potencias instaladas de trituradora, molino, bombas, espesador y filtros.
- Capacidad nominal de la trituradora y del molino; abertura real de la mandíbula.
- Fracción del oro libre, ligado a sulfuros y refractario; recuperaciones de Knelson, Wilfley y flotación.
- Destino y tratamiento de la torta de flotación.
- Fracción de recirculación de agua y consumos de agua fresca.
- Cinética experimental del mineral (curvas de lixiviación vs. tiempo) y fracción residual de oro por tamaño.
- Isoterma y cinética de adsorción del carbón (K, n, k_ads); ciclo y volumen de elución.
- Cianicidas del mineral (Cu, Fe, S) y partición real del NaCN.
- Pérdidas en elución, electroobtención, fundición y refinación; contenido de plata del doré.
- Consumos de HCl, NaOH, fundentes, bolas de acero y floculante en el lavado, la elución y la fundición.
