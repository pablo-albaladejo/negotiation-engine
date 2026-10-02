# Arena Viewer — punto 13 (vistas restantes)

Especificación de Claude Design (2 oct 2026), con los **ajustes del equipo** al final: mandan sobre el texto original donde choquen.

Mismas reglas que los puntos 1–12: solo componentes de `window.NegotiationRing`, estilos con tokens `var(--*)` y clases `nr-*`, UI en inglés, texto del rival y del motor literal, identificadores de config literales (`calido-firme`). La UI nunca calcula valores: todo sale de los JSONL de `results/`, pasando por un adaptador de datos separado de los componentes. Si un dato no está en el log, se muestra "not logged" o no se muestra el bloque. No se inventan datos.

## Navegación (hash routing; atrás y adelante del navegador funcionan)

- `#/runs` → `#/runs/:runId` (matches) → `#/runs/:runId/:matchId` (replay)
- `#/compare/:runId` · `#/states` · `#/live` (ver ajuste 1)
- El replay elige vista según el log:
  - `mode=arena` → Replay arena
  - `mode=tournament` → Replay tournament
  - `issues.length === 2` → Two dimensions
- Enlace de vuelta en cada pantalla:
  - Botón de texto, `color var(--muted)`, `font 500 13px var(--font-body)`, sin borde ni fondo, `align-self:flex-start`.
  - Texto: "← Runs" o "← Matches in r-XXXX".
- Botones primarios ("Open live view", "Copy"): `background var(--ink)`, `color var(--bg)`, `radius var(--radius-md)`, `padding 7px 14px`.
- Botones secundarios: los del punto 2.

## A) Runs (`#/runs`)

- Cabecera:
  - `h2.nr-heading` "Runs" + `.nr-muted` "Each run is a batch of test-arena matches with a fixed agent configuration."
  - A la derecha, botón primario "Open live view".
- `Card` > `DataTable`, una fila por run:
  - Columnas: id, fecha, config/version, matches, duración, Surplus/ZOPA medio y deal rate.
  - `Pill verdict="champion"` en la fila del champion actual (ver ajuste 2).
  - La fila entera es clicable y lleva a matches.
- Estado vacío: `Card` centrada con "No runs yet" + "Run `pnpm arena` and the viewer will pick up the JSONL logs automatically." (code en mono y nowrap).

## B) Matches (`#/runs/:runId`)

- Cabecera:
  - Enlace "← Runs".
  - `h2` con el nombre del run + `Pill` "champion" si lo es.
  - `.nr-cfg` con el id del run, nº de matches, duración y los parámetros de la config literales del log: β, openingMargin, acceptMargin, acTimeThreshold, noise, horizon, persona.
- `KpiStrip`: deal rate, Surplus/ZOPA, walks y opponent errors, con tones.
- `Filters` controlado:
  - opponent (opciones sacadas del log), role (all/buyer/seller), result (all/deal/walk/error).
  - Checkboxes "with injection" y "with fallback".
  - Estado guardado en la query string del hash.
- `Card` de partidas:
  - Contador `.nr-muted` ("Showing 12 of 2646 matches").
  - `DataTable` con: match id, opponent, role, result (con `Flag`), rounds, Surplus/ZOPA y flags (injection/fallback).
  - Paginación de 50 en 50 o virtualización: nunca se cargan 2646 filas en el DOM.
  - Clic en una fila → replay.
  - Sin resultados: estado vacío dentro de la `Card` con "No matches for these filters" + botón secundario "Clear filters".

## C) Replay tournament (`mode=tournament`)

- Cabecera:
  - `ModeBadge mode="tournament"` + `h2` "t-XXX · vs Rival".
  - `.nr-muted` con rol · issue · T · fase.
  - `.nr-cfg` con la config + " · tournament mode".
- `KpiStrip`: result, rounds, final price y final estimate of their reserve. **Nunca** surplus ni ZOPA.
- Grid `minmax(0,1.55fr) minmax(320px,1fr)`, `align-items:start`.
- Columna izquierda:
  - `Card` "Offers by round":
    - Caption: "In a tournament the opponent's reserve is unknown: no ZOPA and no surplus, only our estimate."
    - `OfferChart` sin zopa ni theirReserve, con estimate, target, ourReserve, injectionRounds y end.
    - `Legend` sin ZOPA ni Their reserve.
  - `Card` "Estimate of their reserve by round":
    - Número final grande en `var(--them)` (`font 800 44px var(--font-display)`).
    - `.nr-muted` con la comparación contra el cierre real, si el log lo trae.
    - `DataTable` con round, estimate y método (ver ajuste 4).
- Columna derecha: `Card` "Messages" (`.nr-chat` con `ChatMessage`), con el mismo scroll y la misma selección de ronda que en el Replay arena.
- Debajo: la misma `Card` "Engine decision this round".

## D) Two dimensions (`issues.length === 2`)

- Cabecera:
  - Enlace "← Matches in r-XXXX".
  - `h2` "m-XXXX · vs Rival".
  - `.nr-muted` con el rol y los dos issues.
  - `.nr-cfg` con la config, la función de utilidad y el mandato, literales del log. El mandato solo aparece en arena (ver ajuste 3).
- `KpiStrip`: result, final point (p. ej. "3.5% · day 40"), our utility y rounds.
- Grid `minmax(0,1.3fr) minmax(0,1fr)`, `align-items:start`.
- Columna izquierda: `Card` "Offers on the {issueY} × {issueX} plane".
  - `Scatter2D` con:
    - xDomain/yDomain del config de issues, xLabel/yLabel.
    - ourOffers/theirOffers (`{round,x,y}`).
    - isoLines solo si el log las trae (ver ajuste 3).
    - mandate (polígono) y deal.
  - `Legend`: our offers, opponent offers, same round, our iso-utility (solo si se dibuja) y mandate.
- Columna derecha:
  - `Card` "Utility by round": `OfferChart` con la utilidad que registró el motor, en la misma escala que el log (ver ajuste 3 para ourReserve).
  - `Card` "Logged offers": `DataTable` con round, side, issueX, issueY y utility.
- Clic en un punto de `Scatter2D` u `OfferChart` → selecciona la ronda y resalta la fila de la tabla.

## E) Champion vs candidate (`#/compare/:runId`)

- Cabecera:
  - `h2` "Champion vX vs candidate vY".
  - `.nr-cfg` con los dos ids, nº de matches de cada uno y si usan los mismos seeds.
  - El diff de parámetros resumido ("only change: β 0.20 → 0.30").
  - A la derecha, el veredicto de la puerta tal como lo registra el log:
    - `Pill kind="verdict"` "candidate vY becomes champion", o
    - `kind="rejected"` "rejected · {motivo}".
    - La UI no decide el veredicto.
- Fila 1, grid de 2 columnas:
  - `Card` "Metrics": `DataTable` con metric, champion, candidate y Δ (en pp para tasas). Δ en `--ok` si mejora y en `--warn` si empeora, según la dirección de cada métrica que defina el log.
  - `Card` "Promotion gate": `DataTable` con cada criterio, umbral, valor y `Flag` (pass/fail).
- Fila 2:
  - `Card` "Surplus / ZOPA by opponent and role", con caption de umbrales. `Heatmap` con filas = opponents y columnas = seller/buyer, en inglés (ver ajuste 5).
  - `Card` "Parameter diff":
    - Líneas en mono, una por parámetro, con signo `-`/`+`/espacio en `var(--muted)`.
    - Borde `var(--line)`, radius `var(--radius-md)`.
    - Valores literales.
  - `Card` "Promote":
    - Caption: "The viewer does not promote: copy the command and run it in your terminal."
    - `<code>` nowrap con `pnpm promote config/candidates/vY.json`.
    - Botón primario "Copy", que pasa a "Copied" durante 1,5 s (`navigator.clipboard`).

## F) Comunes

- Contenedor `maxWidth 1200`, `margin 0 auto`, `padding "20px var(--gutter)"`, dentro de `Root`. Live es la única excepción (pantalla completa).
- Toggle de tema light/dark, guardado en `localStorage`.
- Estados de carga, log inválido y vacío como en States, reutilizando los mismos bloques.
- Responsive: por debajo de 900 px, todos los grids pasan a una columna.
- Checklist por vista:
  - ningún `<button>` sin estilo;
  - ni un hex ni una fuente fuera de los tokens;
  - `--us` = nosotros y `--them` = rival;
  - ni ZOPA ni theirReserve en torneo;
  - números con `formatNumber(v,{locale:"en"})`, "84%" sin espacio, diferencias en pp;
  - cero valores calculados en componentes.

## Ajustes del equipo (mandan sobre lo anterior)

1. **Comparativa.**
   - El veredicto y los Δ salen del `gate.json` v2 que escribe `pnpm promote --dry-run` en un único run.
   - Comparar dos runs arbitrarios obligaría a calcular Δ en la UI, así que la ruta es `#/compare/:runId`: el run del gate, que trae champion y candidate.
   - `#/promote/:runId` se mantiene como alias.
   - Los Δ y la dirección de cada métrica salen de `gate.json` (`meanDiffPp` y similares). Si un Δ no está registrado: "not logged".
2. **Champion actual.**
   - Para marcar la fila, el servidor expone solo la versión de `config/champion.json` (sin otros campos), de solo lectura.
   - `champion.json` no contiene el mandato; el mandato vive en `config/scenario.json` y no se sirve.
3. **Two dimensions.**
   - `isoLines`: el motor no las registra, así que no se dibujan y la leyenda no incluye "our iso-utility".
   - `ourReserve` en utilidad: se quitó de `explain` porque equivale a la reserva, así que no se muestra.
   - El mandato solo aparece en arena; las trazas de torneo no lo guardan.
4. **Estimate of their reserve.** Los valores salen de `explain.rivalReserveEstimate`. El método no se registra: la columna dice "not logged", o se omite.
5. **Heatmap.**
   - La cabecera fija "Rival" se sustituye por una prop nueva en el design system (`rowHeader`, por defecto "Opponent"), con test y preview.
   - Nada de parches CSS.
   - Requiere re-sync del design system con Claude Design.
