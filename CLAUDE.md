# negotiation-ring — contexto para Claude Code

@AGENTS.md

Agente del Equipo 2 para El Bazaar (hackathon Causa Prima). TypeScript, Node ≥ 22, pnpm, Zod, Vitest + fast-check.

## Flujo git de este repo (decisión del equipo, 3 oct 2026)

- **La rama DAY2 es la fuente de verdad.** Todo, absolutamente todo, se comitea en **DAY2**: nada a `main`, sin otras ramas, sin worktrees y sin PR. Se trabaja en la carpeta principal del repo, en **DAY2**.
- Antes de cada commit: `pnpm test`, `pnpm typecheck` y `pnpm docs:check` en verde (y `pnpm viewer:test` / `pnpm ds:test` si se tocan esos paquetes).
- Commits pequeños y `git push origin DAY2` justo después; si **DAY2** remoto avanzó, `git pull --rebase` antes de empujar.
- Esta regla manda sobre cualquier instrucción global de usar ramas o worktrees; el guardia de ramas se desactiva solo en este repo con `GUARD_BRANCH=off`.

## Notas de Claude Code

- Reglas no negociables: ver [`AGENTS.md`](AGENTS.md) (la cifra sale del código, solo estructura del rival, guardarraíles, nada en vivo sin aprobación).
- Orden de lectura recomendado: ver root `AGENTS.md` y luego `src/AGENTS.md`.
- Scripts `pnpm`: ver root `AGENTS.md` (tabla).
- Convención: código e identificadores en inglés; documentación y comentarios en español.
- Claves (`BAZAAR_KEY`, broker) solo en .env y .env.broker; nunca en docs ni código.
