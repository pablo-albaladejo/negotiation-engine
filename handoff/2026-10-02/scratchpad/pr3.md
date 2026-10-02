## Qué trae

Cierra todo lo que se puede hacer de `add-agent-architecture` sin el ring real: **65/79 tareas**. Las 14 restantes necesitan el protocolo real (10.x), un túnel probado desde otra red (9.6, 10.6), el evaluador LLM remoto de promptfoo (16.3) o la congelación del domingo (18.x).

- **Motor**
  - 3.8: toda aceptación cumple `u ≥ u(reserva)` en todas las rutas.
  - 12.1: modelo del rival por regresión.
  - 12.2 y 12.3: reciprocidad TFT y AC_combi, apagadas porque no mejoran al campeón.
  - 10.10: campo `rivalCanRespond`. Con él, el acuerdo con ZOPA estrecha frente a Boulware y TFT pasa del 0 % al 100 %.
- **Herramientas**: `pnpm box`, `pnpm replay` y 5 partidas doradas.
- **LLM**
  - Proveedores `claude-cli` (fixture real) y `anthropic-api` (transporte simulado).
  - Parser en cuarentena con reconciliación doble.
  - Narrador que solo ve enums y cifras decididas.
  - Bot guiado por LLM y crítico.
- **Evaluación**
  - Runner pareado con rivales tuning/heldOut y semillas disjuntas.
  - Test de signos y bootstrap.
  - Puerta de promoción `pnpm promote`, con congelación lista pero apagada.
  - `pnpm tune` con 4 generadores intercambiables.
  - 5 bots adversariales: 0 fugas y 0 violaciones.
- **Red team y adaptadores**
  - `pnpm redteam` con promptfoo 0.123.1 contra el agente en localhost: 12/12.
  - A2A y MCP completos con sus clientes, solo para pruebas y sparring.
  - Exportación OTel/Langfuse tras `TRACE_EXPORT=otel`.
  - `docs/demo.md`.
- **Specs** actualizadas con las decisiones de los cuatro lotes.

## Revisión

Tres vueltas de reviewer; la tercera se hizo con autorización. Corregido:
- El texto del narrador, el validador y el detector de fugas ya no llega a las trazas JSONL ni a los spans OTel; solo se guardan longitudes y flags.
- Los errores de proveedor no copian texto del modelo.
- `replay --box validator` omite los registros sin texto.

## Cómo probar

```bash
pnpm install && pnpm test && pnpm typecheck   # 620 tests
pnpm arena                                     # 2646 partidas · 0 violaciones · 0 fugas
pnpm redteam
```

## Antes del torneo

- Probar `anthropic-api` con una clave real (formato `output_config.format`).
- Repetir `pnpm redteam` con el proveedor LLM del torneo (nota 18.4).

🤖 Generated with [Claude Code](https://claude.com/claude-code)
