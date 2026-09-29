# negotiation-ring — contexto para Claude Code

Agente negociador para un torneo (Negotiation Ring, hackathon Causa Prima). TypeScript, Node ≥ 22, pnpm, Zod, Vitest + fast-check.

## Reglas que no se rompen

- **La cifra de una oferta y la decisión de aceptar/retirarse salen de `src/engine/`, nunca de un LLM.**
  El narrador solo pone palabras a una decisión ya tomada; el validador descarta textos cuyo número no coincida.
- **El texto del rival solo lo lee el parser de `src/llm/`**, sin herramientas, y devuelve JSON validado con Zod.
  Nunca fija mandato, reserva ni identidad.
- **Toda oferta pasa por `enforceGuardrails`** (`src/engine/guardrails.ts`): no cruza el mandato y es monótona.
- **Siempre se responde**: si el LLM falla o tarda, sale la plantilla determinista con el mismo número.
- El protocolo del ring está por confirmar: todo lo específico del protocolo vive en `src/protocol/`.

## Comandos

- `pnpm test` — tests (incluye propiedades fast-check). Deben pasar antes de cada commit.
- `pnpm typecheck`
- `pnpm arena` — self-play local; los resultados van a `results/` (fuera de git).
- `pnpm agent` — arranca el agente con `AGENT_CONFIG` (por defecto `config/champion.json`).

## Convenciones

- Una configuración solo se promueve a `config/champion.json` si mejora el excedente con 0 violaciones en la arena.
- Proveedor LLM por `LLM_PROVIDER`: `none` | `claude-cli` | `anthropic-api`. Nunca subir claves (`.env` está en `.gitignore`).
- Código e identificadores en inglés; documentación y comentarios en español.
