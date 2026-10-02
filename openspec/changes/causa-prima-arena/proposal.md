complexity: medium

# Proposal: arena estilo Causa Prima (causa-prima-arena)

## Why

Del texto público de la interfaz de Causa Prima inferimos (inferencia, no hecho) cómo funciona su motor: ofertas de dos variables (`{pct}% for payment by day {day}`), mandato privado como banda en **% TAE** con mínimo y máximo que el agente nunca cruza, apertura en el ancla y concesión según un calendario fijo, y parada por guardarraíl, por rondas, por falta de convergencia o porque el otro agente rompió el protocolo. Nuestra arena no puede simular ese ring: el mandato solo existe por issue, no hay rival que imite ese motor, una salida inválida se registra como error del rival y el transporte A2A no está en `pnpm arena`.

## What Changes

- **Mandato `apr` opcional** en el escenario (`mandateUnit: "apr"`, `baseDays`, banda `{ min, max }` en % TAE por parte). Conversión pct/día ↔ TAE explícita (design.md). El motor decide en TAE solo cuando el mandato la trae; utilidad lineal pct/día por defecto, sin cambios.
- **Guardarraíl TAE**: ninguna oferta ni aceptación nuestra sale de la banda; concesión monótona en TAE.
- **Escenarios `apr-*`** en `config/arena/scenarios.json` (comprador y vendedor, wide y narrow), marcados `optIn`: fuera de la ejecución por defecto.
- **Bot `causa-prima-engine`**: ancla, calendario de concesión configurable, límite de rondas, recomprobación del mandato antes de enviar, acepta dentro de su banda, para con `protocol_violation` o `no_convergence`. Opt-in (no entra en la lista por defecto). El bot `causa-prima` de texto adversarial no cambia.
- **Fin por violación de protocolo** en la arena: resultado `protocol-violation`, valor 0 para ambos, lado infractor registrado, métrica y `transcripts.jsonl` v3 (aditivo).
- **Transporte A2A y MCP en `pnpm arena`**: `--agent-a2a`, `--rival-a2a`, `--agent-mcp`, `--rival-mcp`.

## Impact

- Código: `src/engine/` (apr.ts, despacho en engine.ts), `src/pipeline/pipeline.ts` (guardarraíles por despacho), `src/arena/` (scenario, runner, metrics, results-schema, cli, external), `src/bots/` (causa-prima-engine.ts, registro opt-in).
- Sin cambios: escenarios existentes, campeona, bots por defecto y línea resumen de `pnpm arena` por defecto.
