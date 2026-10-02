## Qué trae

Design system **Negotiation Ring** como paquete React (`design-system/`, lockfile propio; no toca el paquete del agente), sincronizado con Claude Design: https://claude.ai/design/p/cdd2a1f7-6d46-4e13-92d2-b22d00a99e6c

- Tokens claro/oscuro (azul = nosotros, ámbar = rival, verde = trato, rojo = retirada/inyección) y clases `nr-*`.
- 12 componentes: `Root`, `Card`, `Tabs`, `MatchSelector`, `KpiStrip`, `ChatMessage`, `Flag`, `Pill`, `DataTable`, `Heatmap`, `OfferChart`, `Legend`.
- Los componentes solo pintan los valores que reciben; el texto del rival se renderiza siempre como texto (test que falla si aparece `dangerouslySetInnerHTML`).
- Fix: `OfferChart` pinta el fin por retirada en `--warn` (antes salía el anillo verde de trato).
- `.design-sync/`: configuración, 12 previews (27 celdas, todas calificadas «good»), convenciones para el agente de diseño y NOTES con los riesgos de re-sync.

Apilado sobre #1: mergear después.

## Cómo probar

```bash
cd design-system && pnpm install && pnpm build && pnpm test && pnpm typecheck   # 18 tests
```

🤖 Generated with [Claude Code](https://claude.com/claude-code)
