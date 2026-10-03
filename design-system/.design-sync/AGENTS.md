# design-system/.design-sync/ — Sincronización con Claude Design

Contrato para exportar los componentes de [`design-system/`](../AGENTS.md) al proyecto Claude Design (`projectId` en `config.json`, fijo: no cambiarlo). Carpeta exenta del tope de 10 ficheros (generada y mantenida con la herramienta de sync).

## Archivos

- **`config.json`** — `pkg` (`@negotiation-ring/design-system`), `globalName` (`NegotiationRing`), `buildCmd` (`pnpm build`), `cssEntry` (`dist/styles.css`), `provider` (`Root` envuelve cada celda), `overrides` (`cardMode:"column"` en componentes anchos), `dtsPropsFor` (props tipadas inline por componente) y `readmeHeader`.
- **`conventions.md`** — README en inglés que lee el agente de Claude Design: envolver en `<Root>`, tokens CSS (`--us` azul = nosotros, `--them` ámbar = rival, `--ok`, `--warn`), números en formato inglés (`formatNumber(v, {locale:"en"})`), texto del rival literal, UI solo de presentación.
- **`NOTES.md`** — gotchas y riesgos de re-sync (render warns, bugs conocidos, Playwright 1.60.0 fijado).
- **`previews/*.tsx`** — una celda de preview por componente exportado (22; nunca una compartida, aunque compartan fuente, p. ej. los cuatro botones), a mano y sin marcador `@ds-preview generated`.
- Ignorados por git: `.cache/`, `ds-bundle/`, `learnings/` y `.ds-sync/`; `dist/` también (hay que ejecutar `pnpm build` antes de sincronizar).

## Cómo re-sincronizar

1. Cambiar un componente en `src/`: actualizar su preview y `dtsPropsFor` en `config.json`.
2. Desde Claude Code en `design-system/`: `/design-sync`.
3. Cambiar el JSX de un preview o las claves de `config.json` obliga a re-grade; `cardMode` y el texto de UI en inglés no.

## Links

- ↑ [`design-system/`](../AGENTS.md)
