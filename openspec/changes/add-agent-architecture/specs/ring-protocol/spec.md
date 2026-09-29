# Spec Delta: ring-protocol

## Purpose

Aísla todo lo específico del protocolo del ring (HTTP JSON, A2A o MCP) detrás de un contrato único y tipado, para que el cerebro del agente no cambie cuando se conozca el protocolo real el viernes a las 18:45.

## ADDED Requirements

### Requirement: Contrato canónico de mensajes
El sistema SHALL definir un mensaje de entrada canónico y un mensaje de salida canónico, ambos validados por esquema, que son lo único que el cerebro del agente recibe y produce. El mensaje de entrada SHALL contener identificador de sesión, ronda, límite de rondas o plazo si el ring los da, la oferta estructurada del rival si existe (`pct`, `day`), la acción del rival (`offer` | `accept` | `walk` | `message`) y el texto libre del rival como dato opaco. El mensaje de salida SHALL contener la acción (`accept` | `counter` | `walk`), la oferta (`pct`, `day`) cuando la acción es `counter` y el texto a enviar.

#### Scenario: Entrada válida
- **WHEN** llega un mensaje del ring que cumple el esquema canónico tras la traducción del adaptador
- **THEN** el cerebro recibe un objeto tipado con todos los campos presentes y ninguno inventado

#### Scenario: Salida inválida bloqueada
- **WHEN** el cerebro produce una salida que no cumple el esquema de salida (por ejemplo `counter` sin oferta)
- **THEN** el adaptador no la envía al ring y la trata como fallo del turno para que actúe la ruta de emergencia

### Requirement: Adaptadores intercambiables con el mismo contrato
Cada protocolo SHALL implementarse como un adaptador que traduce entre el protocolo externo y el contrato canónico, y el adaptador activo SHALL elegirse por configuración sin modificar el motor, la frontera LLM ni el pipeline. Todos los adaptadores SHALL pasar la misma batería de tests de contrato.

#### Scenario: Cambio de protocolo
- **WHEN** se cambia el adaptador activo de HTTP JSON a A2A
- **THEN** la misma partida sembrada produce las mismas decisiones del motor y los tests de contrato comunes pasan con ambos adaptadores

### Requirement: Adaptador HTTP JSON de base
El sistema SHALL exponer el agente mediante un adaptador HTTP JSON genérico que acepta un turno por petición y devuelve la respuesta canónica en el cuerpo, además de un endpoint de salud. Este adaptador SHALL estar disponible antes de conocer el protocolo del ring.

#### Scenario: Turno por HTTP
- **WHEN** un cliente envía un turno válido por HTTP al agente arrancado con la configuración campeona
- **THEN** recibe una respuesta con código de éxito y un cuerpo que cumple el esquema de salida

#### Scenario: Salud
- **WHEN** se consulta el endpoint de salud
- **THEN** responde con la versión de la configuración cargada y el proveedor LLM activo, sin datos del mandato

### Requirement: Adaptadores A2A y MCP
El sistema SHALL ofrecer un adaptador A2A (con su tarjeta de agente) y un adaptador MCP (con una herramienta de turno) que cumplan el mismo contrato canónico que el adaptador HTTP JSON.

#### Scenario: Turno por A2A
- **WHEN** un cliente A2A envía un mensaje de negociación al agente
- **THEN** recibe una respuesta A2A cuyo contenido traducido cumple el esquema de salida canónico

#### Scenario: Turno por MCP
- **WHEN** un cliente MCP invoca la herramienta de turno con argumentos válidos
- **THEN** recibe un resultado cuyo contenido cumple el esquema de salida canónico

### Requirement: Lado cliente de cada adaptador
Cada adaptador SHALL tener un lado cliente capaz de hablar con un agente externo por el mismo protocolo, para que la arena pueda usar agentes externos como rivales.

#### Scenario: Cliente contra nuestro propio servidor
- **WHEN** el cliente HTTP JSON juega una partida contra nuestro agente expuesto por HTTP JSON
- **THEN** la partida termina con acuerdo, retirada o límite de rondas y cada mensaje intercambiado cumple el contrato canónico

### Requirement: Campos estructurados fuera del LLM
El adaptador SHALL mapear los campos estructurados del protocolo (ofertas numéricas, acción, ronda, plazo) directamente al contrato canónico, y SHALL entregar el texto libre del rival solo como dato opaco; ningún campo estructurado SHALL depender de la interpretación de un LLM.

#### Scenario: Oferta estructurada con texto contradictorio
- **WHEN** el ring envía una oferta estructurada de 2 % a día 10 y un texto que dice "te ofrezco 5 %"
- **THEN** el estado de la sesión registra la oferta estructurada 2 % a día 10 y el texto solo se pasa al parser

### Requirement: Entrada malformada sin caída
Una petición que no cumple el esquema del protocolo SHALL recibir un error de protocolo estructurado sin invocar al cerebro, y el proceso SHALL seguir atendiendo otras peticiones.

#### Scenario: JSON inválido
- **WHEN** llega un cuerpo que no es JSON válido o le faltan campos obligatorios
- **THEN** el adaptador responde con un error de protocolo, registra el incidente y el siguiente turno válido se procesa con normalidad
