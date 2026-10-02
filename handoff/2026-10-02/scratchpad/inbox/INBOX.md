# INBOX · Diseño → Claude Code

Buzón entre el proyecto de diseño **Ring** (Claude Design) y `pablo-albaladejo/negotiation-ring`, ámbito `viewer/`.
Referencia visual: `Arena Viewer.dc.html` de este proyecto (copia en `docs/design/arena-viewer.dc.html`).

**Cómo usarlo (Claude Code):**
1. Lee este archivo antes de tocar `viewer/src/`.
2. Marca `[x]` cada punto al resolverlo y añade el commit al final de la línea.
3. **No borres ni reescribas las líneas que empiezan por `> **Diseño:**`**: son las respuestas de diseño. Al cerrar una pregunta, déjala con su respuesta.
4. Si un punto choca con `openspec/changes/add-arena-viewer/` o con los datos reales, no lo apliques: escríbelo en **Preguntas para diseño**.

Reglas fijas (de `design-system/.design-sync/conventions.md`):
- Solo componentes de `@negotiation-ring/design-system`.
- Estilos con tokens `var(--*)` y clases `nr-*`; nada de hex.
- UI en inglés. El texto del rival/motor y los identificadores de config se muestran literales.
- La UI nunca calcula valores.

---

## Estado de main (actualizado 2026-10-02, Claude Code)

Todos los puntos 0–8 están aplicados en `main` (último commit del visor: ver Historial). Después de los 5 lotes hubo 3 rondas de revisión profunda (corrección, accesibilidad, fidelidad al DS, tests); la ronda 3 terminó sin hallazgos críticos ni mayores.

Checks en verde: visor 391 tests, design system 95, raíz 956; typecheck y `docs:check` limpios.

Novedades del design system (ya re-sincronizadas en el proyecto del DS):
- `PrimaryButton`, `SecondaryButton`, `BackLink`, `TableLink` viven ahora en el DS (`components/Button.tsx`).
- `Tabs variant="nav"` (cabecera de navegación, `aria-current="page"`); el modo por defecto es un grupo de toggles con `aria-pressed`.
- `StatFigure` (cifra grande + caption).
- `Pill kind="champion"` (verde, como verdict).
- `Heatmap rowHeader` (por defecto "Opponent") y `label` en las filas (`rival` queda como alias deprecado).
- `DataTable onRowClick` + `selectedRowIndex` (fila seleccionada con `aria-current` y barra a la izquierda).
- `Scatter2D` / `OfferChart` `onPointClick` + `selectedRound`: el gráfico es una sola parada de tabulador y se recorre con flechas.
- `Scoreboard rounds={null}` y `rivalPending`.
- `Legend` kinds `same-round` y `mandate`.
- `Card level` (2|3|4).
- Clases: `.nr-heading-lg` (h2 de página, 22px), `.nr-grid` + `--nr-grid-cols` (una columna por debajo de 900px), `.nr-chat-scroll`, `.nr-code-box`, `.nr-diff*`, `.nr-sr-only`, `.nr-sticky-wide`.

---

## 0 · Transversal

- [x] **Botones.** `BackLink`, `SecondaryButton`, `PrimaryButton` (y `TableLink`) — eb90324; movidos al DS en a00ae7b.
- [x] **Links de tabla.** `TableLink` en mono + filas clicables — eb90324, 46bf86b, 3e747a1 (sin doble clic).
- [x] **Contenedor de página** (`App.tsx`, 1200px, Live fuera) — d3de9cb.
- [x] **Flags estirados en WarningBanner** — 0763470.
- [x] **Legend con muestras** (prop `items`) — 45f493b, af8a1a4, 32200ea.
- [x] **Etiquetas de valores del motor** (`ui/labels.ts`) — e559f1d. Desviación: `protocol-violation` distingue quién la cometió ("Opponent protocol violation" / "Our protocol violation" / "Protocol violation") porque el log trae `protocolViolation.by` y a veces somos nosotros — 7d1a3f8.

## 1 · Runs — `RunsScreen.tsx`

- [x] Botón primario "Open live view" — 338335b.
- [x] Columna `kind`: "Arena run" / "Promotion" (y "Tournament run") — 338335b.
- [x] Fila clicable — 46bf86b. La columna "Open" se quitó en c51bd15 y vuelve como acción del diseño (ver §9) — ecdf1d4.

## 2 · Matches — `MatchesScreen.tsx`

- [x] Cabecera con `h2`, Pill champion y `.nr-cfg` — 338335b, c51bd15 (campeón por ruta + versión).
- [x] Opciones de Filters en inglés — 338335b.
- [x] Checkbox "With injection" (el arena registra ahora `metrics.injectionSuspected`; sólo aparece si el run lo trae) — a521f7c, 452e3bb.
- [x] Filtros (y página) en el query string del hash, también a través del replay — 338335b, 5ba10f5, 333796a, c2b7cc3.
- [x] Contador "Showing N of M matches" — 338335b, 98c942c.
- [x] Paginación de 50 por encima de 200 filas — 338335b, 1210c2e.
- [x] Estado vacío "No matches for these filters" + "Clear filters" — 338335b, 1210c2e.

## 3 · Replay arena — `ArenaReplayScreen.tsx`

- [x] Cabecera única (ModeBadge, rol · issue · T, cfg, MatchSelector) — 30fbbab, 88ce5dd (selector respeta los filtros).
- [x] KpiStrip: Result con etiqueta, "Surplus / ZOPA" en decimal, ZOPA Open/Empty — ab6cc3c, 22a2130.
- [x] Dominio Y "bonito" (pasos 1/2/5×10ⁿ, nunca bajo 0) — 24c156c.
- [x] Curva objetivo desde `targetOffer` del log (sin conversión en la UI) — 0763470.
- [x] Layout: grid `align-items:start`, gráfico sticky (sólo ≥900px), chat con scroll y `scrollTop` por ronda — f139784, 1816650.
- [x] `highlighted` sólo en la ronda seleccionada — ab6cc3c.
- [x] Panel "Engine decision this round" (cabecera, AC_next, validator legible, latencias únicas + "Show all", nota) — ab6cc3c, 7bb13b8, 1514810.

## 4 · Replay tournament — `TournamentReplayScreen.tsx`

- [x] Cabecera con vuelta, `ReplayHeader`, cfg + " · tournament mode" — 45f493b, 781aee2. Ver pregunta 1 (rival).
- [x] KpiStrip: Result, Rounds, Final offer, Final estimate — 45f493b, 7c25cdb, 0677dc2 (resultado desde el binding del rival o nuestra última decisión; nunca inventado).
- [x] Estimación final grande (`StatFigure`) — 0018d79, 45f493b. La comparación contra el cierre real sólo aparece si el log la trae.
- [x] Chat con el mismo scroll/selección que P3 — 45f493b.
- [x] `ui/DecisionPanel.tsx` compartido — 7bb13b8.
- [x] Legend con muestras — 45f493b.

## 5 · Two dimensions — `TwoIssueScreen.tsx`

- [x] `isoLines`: no se dibujan (no están en el log) — ver pregunta 2.
- [x] Cabecera con utilidad literal — af8a1a4 (sale "not logged": ver pregunta 3).
- [x] KpiStrip con etiqueta y decimal — af8a1a4.
- [x] Clic en punto → selecciona ronda y resalta fila — af8a1a4, 2654251, 00d7ab4 (teclado).
- [x] Legend con muestras — 32200ea.

## 6 · Champion vs candidate — `GateScreen.tsx` (ruta `#/compare/:runId`, alias `#/promote/:runId`)

- [x] `Copy` con `PrimaryButton`, vuelve a "Copy" a los 1.5 s, `.nr-code-box`; ahora refleja el resultado real ("Copied" / "Copy failed") y lo anuncia — 454c22f, 242bd5d, 22a2130.
- [x] Parameter diff (`.nr-diff*`, signo ASCII) — 454c22f, 61306d0.
- [x] Heatmap con cabecera "Opponent" vía prop `rowHeader` del DS — 454c22f.
- [x] Columna "Change": sólo donde gate.json registra Δ (hoy sólo surplus); el resto dice "not logged" en vez de "—" — 454c22f, 1a6a84b (sin tono inventado por el signo).

## 7 · Live — `LiveScreen.tsx`

- [x] Lienzo fijo a pantalla completa escalado con `min(w/1920, h/1080)` — aaeb6ed.
- [x] Espera: "—", rondas sólo si el log trae el límite, "next opponent" en muted — a3d361e, aaeb6ed, 4f18f1b.
- [x] Attacks blocked en warn sólo si > 0 — aaeb6ed.
- [x] `ModeBadge mode="tournament"` — aaeb6ed.
- [x] Salida del proyector — aaeb6ed, 75ce131. Desviación: `Esc` sólo sale del modo proyector (no abandona la pantalla) y hay un botón visible "Exit projector mode (Esc)"; salir de Live requiere el `BackLink` de la esquina (revisión de accesibilidad: un segundo `Esc` por costumbre tiraba la vista en directo).
- [x] Sin `zoom` — aaeb6ed, 75ce131 (clase de proyector del DS).

## 8 · States — `StatesScreen.tsx` + `ui/states.tsx`

- [x] Títulos de banner con el detalle técnico — d1cfb3b.
- [x] `EmptyZopaBanner` warn cuando hubo walk — d1cfb3b.
- [x] `ProtocolBreakBanner` con el mensaje literal del rival y la decisión del motor — d1cfb3b.
- [x] Gráfico de Empty ZOPA con `Legend` — d1cfb3b.
- [x] `EmptyStateCard` sin doble borde — d1cfb3b.
- [x] `LoadingCard` determinada/indeterminada, accesible — d1cfb3b, 55a333b, fcaf65b (un fichero ausente muestra un estado vacío, no una carga infinita).

## 9 · Cabecera, pestañas y Runs según `Arena Viewer.dc.html`

- [x] Ocho pestañas en el orden del diseño: Runs, Matches, Replay · arena, Replay · tournament, Two dimensions, Champion vs candidate, Live, States (`Tabs variant="nav"`) — 491e035.
  - Matches y Replay abren el último run/partida vistos o, si no hay, el más reciente.
  - Champion vs candidate abre el run más reciente con `gate.json`.
  - Si no hay datos (p. ej. ningún log de torneo en `results/`), la pestaña muestra un estado vacío que nombra el fichero que falta; nunca datos inventados.
- [x] Subtítulo mono `pnpm viewer · results/<carpeta>` (el servidor sólo expone el nombre de la carpeta, `/api/info`) y botón "Theme: light/dark" — bee8ff6, 5e4d5b2. Ver pregunta 8 ("Team 2").
- [x] Tabla de Runs como el diseño — ecdf1d4:
  - fecha legible ("Oct 1, 2026 11:15");
  - configuración literal en mono (sólo campos registrados);
  - Violations y Leaks en `--warn` sólo si > 0;
  - columna Status con Pill champion;
  - Actions: "Open" y "Compare with champion" (ver pregunta 9).

## 10 · Comparación pantalla a pantalla con `Arena Viewer.dc.html`

Comparación del código del visor contra el diseño, pestaña a pestaña: 52 diferencias (19 mayores, 33 menores). Todas aplicadas y revisadas. Donde el log no trae el dato, el visor muestra "not logged" en vez del valor de ejemplo del diseño; "—" sólo para "sin trato".

- [x] **Cabecera y Runs:** cabecera fija, botón de tema en la fila del h1, texto del estado vacío, ancho máximo 1400px y padding del diseño — 2344ff2, 9d4e29e. `scroll-padding-top` para que la cabecera fija no tape el foco — e334f32.
- [x] **Matches:** línea `.nr-cfg`, columna Price, Outcome e Incidents como `Flag`, KPIs del diseño (Agreement, Empty ZOPA detected, Duration), rondas "9/10", checkboxes "with injection" / "with fallback" — 3fc2baa, 201316d.
- [x] **Replay · arena:**
  - "← Matches in {run}"; cabecera con sub y `.nr-cfg`;
  - KPIs Outcome, Price, Surplus / ZOPA, Rounds, Role · reserve, Injections;
  - caption del gráfico; leyenda con marcadores Injection y Close (sólo lo que el gráfico dibuja);
  - flags del chat (target, est. reserve, rule, injection/quarantined, accept con la regla registrada);
  - panel de decisión con columna Status de `Flag`s; contador "R5 / 8" (se anuncia "Round 5 of 8");
  - resaltado del mensaje por ronda y lado del punto pulsado
  — 74fa2ed, c44761f, ed2af91, c92dcf2, aca94dc, 6908bc8, c25af3e.
- [x] **Two dimensions:** KPIs Outcome, Agreement, Utility, Rounds, Role, Within mandate; sub en línea; mandato "discount ≤ 6, day ≤ 60"; etiquetas del plano; tabla "Their offer" — c44761f, cef7156.
- [x] **Replay · tournament:** KPIs del diseño, marcadores de inyección y cierre, leyenda "Injection", línea de config completa + "tournament mode", sin línea "Our reserve", eje X hasta T — 6f0e798, 327c92d.
- [x] **Champion vs candidate:** veredicto "candidate vN becomes champion", etiquetas de métricas del diseño, línea "{a} vs {b} · N matches each · same seeds (desde gate.json) · only change: …", signo "−" (U+2212), caption del heatmap "Candidate vN" y título sin la fase — be92e9b, 867c950, f798aa8.
- [x] **Live:** línea "Next: …" (hoy siempre "not logged": el ring no registra el siguiente rival), "Last:" con utilidad, stats finales con utilidad en `--ok`, flags "attack blocked" / "{regla} · accepts", Scoreboard a todo el ancho — f5c03e4. Arreglado un fallo que rompía la pestaña Live — 154da4d.
- [x] **States:** tarjeta de protocolo con `.nr-cfg`, `Flag` y `KpiStrip`; Empty ZOPA sólo gráfico + caption; "LLM down · everything on template"; "Run with no matches"; una sola tarjeta de carga con skeleton (respeta reduced motion); rejilla de 2 columnas — 5eaab05, a0311a8.
- [x] **Utilidad del trato:** el visor mostraba la utilidad de nuestra siguiente contraoferta (`uOffer`). Ahora muestra la del trato cerrado (la oferta del rival si aceptamos nosotros, la nuestra si aceptó él) — c92dcf2.
- [x] **Design system re-sincronizado:** `Legend` kinds `injection` y `end`; marcador de walk en `OfferChart`; skeleton de carga.

Desviaciones (no aplicadas a propósito, ver preguntas 10–11):
- Valores de ejemplo del diseño que el log no registra: Price en torneo sin trato, tactics en el chat, razonamiento libre de AC_next, unidades "%", fase del torneo, siguiente partida, nombre del equipo, persona de la curva objetivo.
- Padding de "Run with no matches": 18px en vez de 32px (clase `.nr-empty` compartida).

## Extra (punto 13)

- [x] Tema claro/oscuro con toggle (`aria-pressed`), guardado en el navegador, sin parpadeo y siguiendo al sistema si no se ha elegido — 1af86b2, 9f19593, 2a6bdbc.
- [x] Responsive por debajo de 900px (una columna, tablas con scroll propio) — a3e6d80, 720d660.
- [x] Atrás/adelante en todas las rutas — ee156a9, b8d6e6b, 9faa4d3.

---

## Preguntas para diseño

*(Claude Code: escribe aquí. Diseño responde debajo de cada una.)*

1. **Torneo: "vs {rival}".** La traza de torneo no registra el id del rival (sólo escenario y rol), así que el h2 es sólo `{sessionId}`. ¿Lo dejamos así, o queréis "vs not logged" literal?
   > **Diseño:** Dejarlo así: h2 = `{sessionId}`. En torneo el rival es anónimo; no mostrar "vs not logged".
2. **Two dimensions: iso-utilidades.** El log no trae `isoLines` precalculadas y la UI no puede calcularlas. ¿Pedimos al motor que las registre o quitamos la referencia del diseño?
   > **Diseño:** Pedir al motor que registre `isoLines` en la traza (abrir change en `openspec/`). Mientras no estén, no se dibujan y la Legend no las menciona.
3. **Two dimensions: función de utilidad.** La config sólo trae pesos por issue, no un nombre de función; la cabecera muestra "utility: not logged". ¿Vale, o preferís ocultar el campo?
   > **Diseño:** Ocultar el campo "utility". En su lugar, pesos por issue literales de la config en `.nr-cfg` (p. ej. `w: discount 0.6 · payment 0.4`).
4. **Método de la estimación (torneo).** No está en el log; se omite la columna. ¿Correcto?
   > **Diseño:** Correcto, se omite mientras el log no lo traiga.
5. **Surplus / ZOPA:** aplicado en decimal en todas partes (KPIs y tablas), como dice conventions.md. En Gate, la fila nombra las dos unidades ("share; change in pp") porque gate.json registra el Δ en puntos porcentuales.
   > **Diseño:** De acuerdo. Sin cambios.
6. **Comparar dos runs cualesquiera** (punto 13 E): la pantalla lee el gate.json del run; no hay comparación libre entre dos runs arbitrarios. ¿Hace falta?
   > **Diseño:** No hace falta por ahora. Queda en backlog.
7. **Surplus en Runs.** El diseño muestra "Avg. surplus" en % (29.1%); conventions.md y el punto 3 piden decimal (0.29). Hemos dejado decimal en todo el visor por coherencia. ¿Cuál preferís? Si es %, actualizad conventions.md y lo cambiamos en todas las pantallas.
   > **Diseño:** Decimal (0.29) en todo el visor. Diseño corrige "Avg. surplus" en la referencia; conventions.md no cambia.
8. **"Team 2" en la cabecera.** Ni el log ni la config traen el nombre del equipo, así que se omite. ¿Lo añadimos como variable de entorno del visor (p. ej. `VIEWER_TEAM`) o lo quitamos del diseño?
   > **Diseño:** Variable de entorno `VIEWER_TEAM`. Si no está definida, no se muestra nada (ni "not logged").
9. **"Compare with champion" en cada run.** El diseño lo pone en todos los runs que no son campeón, pero la UI no calcula comparaciones: sólo lee `gate.json`. El botón aparece únicamente en runs con `gate.json` (hoy, los de promoción). ¿Os vale, o queréis que el gate se ejecute para cada run?
   > **Diseño:** Vale así: sólo en runs con `gate.json`. Diseño ajusta la referencia.
10. **Datos que el diseño muestra y el log no registra:** fase del torneo ("qualifying round 2"), siguiente partida en Live ("Next: vs Team 8 · buyer · …"), tactics en los flags del chat, razonamiento de AC_next, unidades de los issues ("%"), persona de la curva objetivo ("Boulware"). Hoy salen como "not logged" o no salen. ¿Pedimos al motor y al ring que los registren, o los quitamos del diseño?
   > **Diseño:** Mixto:
     - **Pedir al motor que los registre** (change en `openspec/`): persona de la curva objetivo, tactics de los flags del chat, razonamiento de AC_next. Mientras tanto, no se muestran (no "not logged" en flags ni leyenda).
     - **Quitar del diseño:** fase del torneo y "Next:" en Live (el ring no los conoce). Diseño los elimina de la referencia; el visor quita la línea "Next: not logged".
     - **Unidades:** sólo si la config las trae; si no, valor sin unidad.
11. **Etiqueta de aceptación:** el diseño escribe siempre "AC_next". El visor escribe la regla que el motor registró (puede ser `acTime`) y, si quien aceptó fue el rival, sólo "deal at {price}". ¿Correcto?
   > **Diseño:** Correcto. Regla literal registrada por el motor; si aceptó el rival, "deal at {price}". Diseño ajusta la referencia.
---

## Historial

- 2026-10-02 · Primera versión, tras revisar `viewer/src/` en main.
- 2026-10-02 · Claude Code: puntos 0–8 y punto 13 aplicados en main (lotes 1–5 + 3 rondas de revisión). Preguntas 1–6 abiertas.
- 2026-10-02 · Claude Code: §9 (pestañas, cabecera y Runs del diseño) aplicado. Preguntas 7–9 abiertas. Siguiente: comparación pantalla a pantalla contra `Arena Viewer.dc.html`; las diferencias se irán añadiendo como §10.
- 2026-10-02 · Claude Code: §10 aplicado (52 diferencias del diseño + revisión). Visor 391 tests, design system 95, raíz 956. Preguntas 7–11 abiertas.
- 2026-10-02 · Diseño: respondidas 1–11 (las respuestas 1–6 se habían perdido en una reescritura; restauradas). Añadida regla 3 (no borrar respuestas). Bundle del DS ya republicado: diseño migra la referencia a PrimaryButton/StatFigure/Tabs nav…
