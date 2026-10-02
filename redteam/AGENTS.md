# redteam/ — Escenarios y Cadenas de Red Team

Escenarios adversariales para pruebas de seguridad, edge cases y validación de invariantes.

## Propósito

Red team estructurado: cadenas de movimientos adversariales, intentos de fuga, estrés.

## Contenido

Escenarios especiales, textos malformados, movimientos ilegales que se esperan que el validador rechace.

- `cases.yaml` — los tres patrones de Scribo primero (nunca se recortan), extracción e inyección, y los casos multilingües `ml-<idioma>-<categoría>` (inyección, identidad, reserva y falsa urgencia en es, en, fr y ja; una línea de variables por caso, que también recorre `test/redteam/multilingual.test.ts`).
- `promptfooconfig.yaml` — aserciones deterministas comunes (esquema, sin fuga, decisión del motor, cifra del motor) y un refuerzo literal de la reserva en es/en/fr/ja. `pnpm redteam` juega hasta `--max-cases` (40) casos.

Versionados en git.

## Cómo usar

```bash
pnpm redteam
```

## Links

- ↑ [`AGENTS.md`](../AGENTS.md)
- ← Harness: [`src/redteam/`](../src/redteam/AGENTS.md)
