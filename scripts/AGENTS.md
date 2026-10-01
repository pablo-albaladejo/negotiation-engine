# scripts/ — Utilidades Shell

Scripts automatizados para pruebas, despliegue, integración.

## Propósito

Utilidades shell que coordinan flujos complejos: smoke tests, sparring, evaluación de dummy, despliegue por túnel.

## Archivos

- **`smoke.sh`** — Smoke test: arranca agente, envía 1 turno HTTP, valida respuesta (sin LLM, sin herramientas).
- **`sparring.sh`** — Sparring: agente local vs bot HTTP, usa arena.
- **`eval-dummy.sh`** — Evaluación end-to-end vs dummy (5 semillas, ~20 s), resultados en `results/eval-dummy/`.
- **`eval-llm.sh`** — Medición del valor del LLM con llamadas reales (`pnpm eval:llm`); variables `EVAL_LLM_*`, resultados en `results/eval-llm/`.
- **`tunnel-smoke.sh`** — Smoke test a través de túnel HTTP (ej. Cloudflare, ngrok).
- **`check-turn.ts`** — Validador de turno (TypeScript).
- **`sim-ring.ts`** — Simulador de ring.

## Cómo usar

```bash
# Smoke test (agente + 1 turno)
pnpm smoke

# Sparring
pnpm sparring

# Evaluación vs dummy
pnpm eval:dummy 5  # 5 semillas

# Smoke test remoto (por túnel)
cloudflared tunnel --url http://localhost:8787 &
scripts/tunnel-smoke.sh https://<url-del-túnel>
```

## Links

- ↑ [`AGENTS.md`](../AGENTS.md)
- → Agent: [`src/agent/`](../src/agent/AGENTS.md)
- → Bots: [`src/bots/`](../src/bots/AGENTS.md)
- → Arena: [`src/arena/`](../src/arena/AGENTS.md)
