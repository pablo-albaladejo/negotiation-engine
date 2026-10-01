# Spec Delta: ring-config

## Purpose

Hace configurable cada decisión que depende del protocolo del ring (desconocido hasta el viernes 18:45) con valores por defecto que siguen los supuestos de solo texto y cualquier idioma, sin tocar las reglas no negociables.

## ADDED Requirements

### Requirement: Configuración de ejecución con valores por defecto por modo
El sistema SHALL cargar una configuración de ejecución validada con Zod desde `config/runtime.json` (ruta cambiable con `RUNTIME_CONFIG`), separada de `AgentConfig`, con las claves: `ring.mode` (`text-only` | `structured` | `hybrid`, por defecto `text-only`), `ring.timeoutMs` (opcional), `parser.policy`, `parser.acceptWordNumbers` (`confirm` | `llm-only`, por defecto `confirm`), `parser.onLlmFailure` (`deterministic` | `confirm`, por defecto `deterministic`), `acceptance.signal`, `acceptance.walkSignal` (`trace-only` | `parser-intent-verified` | `ring-action`), `narrator.language` (`auto` o un código BCP-47, por defecto `auto`), `template.languages` (por defecto `["en","es"]`), `template.fallbackLanguage` (por defecto `en`), `template.uncovered` (`neutral` | `fallback-language`, por defecto `neutral`), `validator.coherence` (`known-languages` | `strict`, por defecto `known-languages`), `llm.parser` y `llm.narrator` (`provider`, `model`, `timeoutMs`, `attempts`), `llm.narrator.minRemainingMs`, `turn.budgetRatio` y `mandate.source` (`scenario-file` | `brief-text`, por defecto `scenario-file`). Las claves sin valor SHALL tomar el valor por defecto de su modo: en `text-only`, `parser.policy = llm-primary-verified`, `acceptance.signal = parser-intent-verified`, `acceptance.walkSignal = trace-only`; en `structured`, `dual-strict`, `ring-action` y `ring-action`; en `hybrid`, los de `text-only`, salvo que una acción del ring distinta de `message` siempre prevalece. Sin fichero SHALL usarse la configuración por defecto de `text-only`. Un valor inválido SHALL impedir el arranque señalando la clave.

#### Scenario: Sin fichero de configuración
- **WHEN** el agente arranca sin `config/runtime.json`
- **THEN** la configuración efectiva es `ring.mode = text-only`, `parser.policy = llm-primary-verified`, `acceptance.signal = parser-intent-verified` y `mandate.source = scenario-file`

#### Scenario: Modo estructurado
- **WHEN** el fichero solo contiene `ring.mode = structured`
- **THEN** la configuración efectiva usa `parser.policy = dual-strict` y `acceptance.signal = ring-action`

#### Scenario: Valor inválido
- **WHEN** el fichero contiene `parser.policy = llm-only`
- **THEN** el agente no arranca y el error nombra la clave `parser.policy` y los valores admitidos

### Requirement: Configuración efectiva visible y sin secretos
La configuración efectiva (con los valores por defecto resueltos) SHALL registrarse al arrancar y en cada entrada de la traza por su versión o huella, y la arena y `pnpm eval:llm` SHALL aceptar opciones de línea de comandos que sobrescriben `ring.mode`, `parser.policy`, `acceptance.signal`, `narrator.language` y el proveedor de cada caja. La configuración de ejecución MUST NOT contener el mandato, la reserva ni claves de API.

#### Scenario: Traza con huella de configuración
- **WHEN** se juega un turno con `parser.policy = dual-strict` pasado por línea de comandos
- **THEN** la traza del turno registra la huella de la configuración efectiva y la política `dual-strict`

#### Scenario: Clave secreta en el fichero
- **WHEN** `config/runtime.json` contiene una clave `reservation` o `apiKey`
- **THEN** la validación falla porque el esquema es cerrado

### Requirement: Reglas no negociables independientes de la configuración
Ninguna combinación de claves SHALL permitir que el LLM fije una cifra de nuestra oferta, una decisión de aceptar o retirarse, el mandato desde el texto del rival, la reserva o la identidad; que una oferta evite los guardarraíles; que un turno quede sin respuesta; o que un texto saliente sin pasar el validador y el detector de fugas llegue al ring. Esta propiedad SHALL comprobarse con un test que recorre todas las combinaciones de `ring.mode`, `parser.policy`, `acceptance.signal` y `parser.acceptWordNumbers`.

#### Scenario: Recorrido de combinaciones
- **WHEN** el test juega una partida sembrada contra el bot de texto completo con cada combinación de esas claves
- **THEN** en todas hay 0 violaciones del mandato, 0 fugas, una respuesta por turno y toda oferta enviada sale del motor
