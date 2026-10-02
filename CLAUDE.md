# negotiation-ring — contexto para Claude Code

@AGENTS.md

Agente negociador para un torneo (Negotiation Ring, hackathon Causa Prima). TypeScript, Node ≥ 22, pnpm, Zod, Vitest + fast-check.

## Flujo git de este repo (decisión del equipo, 3 oct 2026)

- **La rama DAY2 es la fuente de verdad.** Todo, absolutamente todo, se comitea en **DAY2**: nada a `main`, sin otras ramas, sin worktrees y sin PR. Se trabaja en la carpeta principal del repo, en **DAY2**.
- Antes de cada commit: `pnpm test`, `pnpm typecheck` y `pnpm docs:check` en verde (y `pnpm viewer:test` / `pnpm ds:test` si se tocan esos paquetes).
- Commits pequeños y `git push origin DAY2` justo después; si **DAY2** remoto avanzó, `git pull --rebase` antes de empujar.
- Esta regla manda sobre cualquier instrucción global de usar ramas o worktrees; el guardia de ramas se desactiva solo en este repo con `GUARD_BRANCH=off`.

## Notas de Claude Code

- Reglas no negociables: ver [`AGENTS.md`](AGENTS.md) (motor, parser, guardarraíles, siempre respuesta, protocolo modular).
- Orden de lectura recomendado: ver root `AGENTS.md` (sección "Para empezar").
- Scripts `pnpm`: ver root `AGENTS.md` (tabla).
- Convención: código e identificadores en inglés; documentación y comentarios en español.
- Proveedor LLM: `LLM_PROVIDER` (none|claude-cli|anthropic-api). Nunca subir claves.
