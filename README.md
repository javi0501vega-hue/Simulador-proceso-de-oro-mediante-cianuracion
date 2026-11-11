# Simulador de planta de beneficio de oro (CIL, 50 t/d)

Simulador interactivo basado en *Proyecto.pdf* (prioritario), Srithammavut (2008), Yahya et al. (2020) y Ray & Ray (cap. 1–6). Sin dependencias: HTML + JavaScript puro.

## Ejecutar
- **Uso directo:** abra `index.html` en Chrome, Edge o Firefox. No necesita servidor ni internet.
- **Pruebas del motor:** `node tests/run_tests.js` (balances, 18 casos extremos, pruebas de dirección y optimizador).
- **Reconstruir `index.html` tras editar `src/`:** `python3 build.py`.

## Páginas
Inicio · Diagrama de flujo (20 operaciones, clic en equipos y corrientes) · Variables · Resultados (balances, pérdidas, validación) · Gráficos · Escenarios (guardar, comparar, optimizar) · Equipos · Modelo y datos (ecuaciones, contradicciones, datos faltantes).

## Persistencia de escenarios
Las variables actuales y los escenarios se guardan en `localStorage` del navegador (claves `gs_params_v1`, `gs_scenarios_v1`). Para llevarlos a otro equipo use **Exportar JSON / Importar JSON** en la página Escenarios.

## Estructura
| Archivo | Contenido |
|---|---|
| `src/params.js` | Registro de ~70 parámetros: valor inicial, rango, unidad y origen (DOC, RANGO, SUP, BIB, CAL). Para añadir una variable, agréguela aquí. |
| `src/engine.js` | Motor: conminución, ciclón, CIL en serie, adsorción, elución, reactivos, agua, energía, balances. `GS.run(params)`. |
| `src/validate.js` | Validación de balances y rangos, comprobación contra el Proyecto, pruebas de dirección y optimizador. |
| `src/docs.js` | Ecuaciones y análisis documental mostrados en la interfaz. |
| `src/flowsheet.js`, `charts.js`, `ui.js`, `styles.css` | Diagrama, gráficos SVG, interfaz y estilos. |
| `docs/ECUACIONES.md` | Ecuaciones, supuestos y contradicciones. |

## Supuestos y límites
Los datos que el Proyecto no da (Wi = 14 kWh/t, capacidades, fracciones de oro libre y sulfuro = 0, recirculación de agua 80 %, partición del NaCN 35 %, cinética de adsorción) están marcados como **Supuesto** y son editables. La constante cinética se calibra al único punto del Proyecto (90 % en 24 h). Con oxígeno el modelo llega a ≈ 93 %, no a 96 %, porque el efecto del nitrato de plomo no se modela.

## Publicar en GitHub
1. Cree un repositorio nuevo en github.com (botón **New**), sin README inicial.
2. Descomprima el zip y, en el repositorio, use **Add file → Upload files**: arrastre el *contenido* de la carpeta (no el zip) y pulse **Commit changes**.
3. Para tener una página pública: **Settings → Pages → Deploy from a branch → main / (root)**. El simulador quedará en `https://SU_USUARIO.github.io/NOMBRE_REPO/`.
