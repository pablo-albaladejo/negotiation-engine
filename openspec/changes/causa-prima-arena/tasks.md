# Tasks

Cada tarea es TDD: primero el test, luego la implementación.

## 1. Mandato TAE

- [ ] 1.1 Fixture de decisiones de referencia del motor antes del cambio y test byte a byte
- [ ] 1.2 `src/engine/apr.ts`: conversión, inversa, banda, guardarraíl, despacho; propiedades de monotonía
- [ ] 1.3 `decideApr` en el motor y despacho en el pipeline; propiedad "ninguna oferta ni aceptación fuera de la banda"
- [ ] 1.4 Escenarios `apr-*` opt-in, métricas (violaciones y excedente en TAE)

## 2. Bot causa-prima-engine

- [ ] 2.1 Bot con ancla, calendario, límite de rondas, aceptación en banda, `protocol_violation`, `no_convergence`; registro opt-in

## 3. Violación de protocolo

- [ ] 3.1 `protocol_violation` en el runner, métricas, `transcripts.jsonl` v3 y esquema; tests con bot inválido y con nuestro agente

## 4. Transporte

- [ ] 4.1 Flags `--agent-a2a`, `--rival-a2a`, `--agent-mcp`, `--rival-mcp`; test A2A en localhost igual que en proceso

## 5. Documentación y medida

- [ ] 5.1 AGENTS.md (arena, bots, engine) y `pnpm docs:check`
- [ ] 5.2 Medida: campeona en escenarios apr contra `causa-prima-engine` y bots, 5 semillas; una ejecución A2A
