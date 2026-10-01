# Spec Delta: arena

## Purpose

Simular un ring estilo Causa Prima: escenarios en TAE, un rival que imita su motor, fin por violación de protocolo y transporte A2A/MCP en `pnpm arena`.

## ADDED Requirements

### Requirement: Escenarios apr opt-in
El catálogo SHALL admitir escenarios con `mandateUnit: "apr"`, `baseDays` y banda `apr { min, max }` por parte, y la etiqueta `zopa` SHALL comprobarse en TAE. Los escenarios con `optIn: true` MUST NOT entrar en `pnpm arena` sin `--scenarios`.

#### Scenario: Ejecución por defecto
- **WHEN** se ejecuta `pnpm arena` sin `--scenarios` ni `--rivals`
- **THEN** se juegan los mismos escenarios y bots que antes y la línea resumen no cambia

### Requirement: Bot causa-prima-engine
El bot SHALL abrir en su ancla, conceder según un calendario fijo configurable, aceptar una oferta explícita dentro de su banda, no cruzar nunca su mandato y retirarse con `protocol_violation` ante un turno inválido o con `no_convergence` si la distancia no baja. Su texto SHALL ser `Opening offer: X% for payment by day D`, `Counter: …` o `Accepted`.

#### Scenario: Turno inválido
- **WHEN** el bot recibe una oferta con un issue no declarado
- **THEN** responde `walk` con el texto `Negotiation stopped: protocol_violation`

### Requirement: Fin por violación de protocolo
Si la salida de un participante no valida el esquema canónico o no corresponde a la sesión o ronda en curso, la partida SHALL terminar con `endReason: "protocol_violation"`, excedente 0 para ambos y el lado infractor en `protocolViolation.by`. La métrica y `transcripts.jsonl` (`schemaVersion: 3`, aditivo) SHALL registrarlo; v1 y v2 siguen validando.

#### Scenario: Rival con mensaje inválido
- **WHEN** un bot responde `counter` sin oferta
- **THEN** la partida termina con `protocol_violation`, `by: "rival"` y `surplusShare: 0`

### Requirement: Transporte A2A y MCP
`pnpm arena` SHALL aceptar `--agent-a2a <url>`, `--rival-a2a <url>`, `--agent-mcp <url>` y `--rival-mcp <url>`, como `--agent-url` y `--rival-url`.

#### Scenario: Mismos resultados por A2A
- **WHEN** nuestro agente servido por su adaptador A2A en localhost juega contra un bot con las mismas semillas
- **THEN** resultados, rondas y ofertas coinciden con la partida en proceso
