# negotiation-ring — contexto para Claude Code

@AGENTS.md

Agente negociador para un torneo (Negotiation Ring, hackathon Causa Prima). TypeScript, Node ≥ 22, pnpm, Zod, Vitest + fast-check.

## Notas de Claude Code

- Reglas no negociables: ver [`AGENTS.md`](AGENTS.md) (motor, parser, guardarraíles, siempre respuesta, protocolo modular).
- Orden de lectura recomendado: ver root `AGENTS.md` (sección "Para empezar").
- Scripts `pnpm`: ver root `AGENTS.md` (tabla).
- Convención: código e identificadores en inglés; documentación y comentarios en español.
- Proveedor LLM: `LLM_PROVIDER` (none|claude-cli|anthropic-api). Nunca subir claves.
