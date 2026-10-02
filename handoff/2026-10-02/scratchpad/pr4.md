## Qué trae

Versión 2 del design system **Negotiation Ring**, ya sincronizada con Claude Design: https://claude.ai/design/p/cdd2a1f7-6d46-4e13-92d2-b22d00a99e6c

- **5 componentes nuevos**, sacados de los elementos que el diseño del visor marcó como «componente nuevo»:
  - `Filters`
  - `ModeBadge`: ARENA / TOURNAMENT
  - `Scatter2D`: ofertas en dos issues con curvas de igual utilidad y región del mandato; solo dibuja lo que recibe
  - `Scoreboard`: cabecera del modo proyector
  - `WarningBanner`
- **Interfaz en inglés**:
  - La guía del agente de diseño (`.design-sync/conventions.md`), el README, los ejemplos y los previews.
  - `formatNumber(v, { locale: "en" | "es" })`; `formatEsNumber` se mantiene por compatibilidad.
  - El texto del rival y los identificadores de configuración se muestran literales.
- **Correcciones**:
  - `OfferChart`: etiquetas en inglés (eje «round», aria-label).
  - `Scatter2D`: etiquetas que no se salen del borde.
  - `Scoreboard`: marcador sin saltos de línea.
- **Sync**: 17 componentes, todas las celdas calificadas como buenas, validación limpia y nada borrado en el proyecto.

## Cómo probar

```bash
cd design-system && pnpm install && pnpm build && pnpm test && pnpm typecheck
```

🤖 Generated with [Claude Code](https://claude.com/claude-code)
