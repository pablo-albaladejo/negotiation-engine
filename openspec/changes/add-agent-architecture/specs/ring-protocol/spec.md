# Spec Delta: ring-protocol

## Purpose

Aísla todo lo específico del protocolo del ring (HTTP JSON, A2A o MCP; estructurado o solo texto; el ring nos llama o nosotros conducimos el bucle) detrás de un contrato único y tipado, para que el cerebro del agente no cambie cuando se conozca el protocolo real el viernes a las 18:45.

## ADDED Requirements

### Requirement: Contrato canónico de mensajes
El sistema SHALL definir un mensaje de entrada canónico y un mensaje de salida canónico, ambos validados por esquema, que son lo único que el cerebro del agente recibe y produce. Una oferta SHALL representarse como un valor por cada issue declarado en la configuración (`issues`; en solo precio, un único issue). El mensaje de entrada SHALL contener identificador de sesión, ronda, límite de rondas o plazo si el ring los da, la oferta estructurada del rival si el ring la da, la acción del rival (`offer` | `accept` | `walk` | `message`) y el texto libre del rival como dato opaco. El mensaje de salida SHALL contener la acción (`accept` | `counter` | `walk`), la oferta cuando la acción es `counter` o `accept` y el texto a enviar.

#### Scenario: Entrada válida
- **WHEN** llega un mensaje del ring que cumple el esquema canónico tras la traducción del adaptador
- **THEN** el cerebro recibe un objeto tipado con todos los campos presentes y ninguno inventado

#### Scenario: Salida inválida bloqueada
- **WHEN** el cerebro produce una salida que no cumple el esquema de salida (por ejemplo `counter` sin oferta o con un issue no declarado)
- **THEN** el adaptador no la envía al ring y la trata como fallo del turno para que actúe la ruta de emergencia

### Requirement: Adaptadores intercambiables con el mismo contrato
Cada protocolo SHALL implementarse como un adaptador que traduce entre el protocolo externo y el contrato canónico, y el adaptador activo SHALL elegirse por configuración sin modificar el motor, la frontera LLM ni el pipeline. Todos los adaptadores SHALL pasar la misma batería de tests de contrato.

#### Scenario: Cambio de protocolo
- **WHEN** se cambia el adaptador activo de HTTP JSON a A2A
- **THEN** la misma partida sembrada produce las mismas decisiones del motor y los tests de contrato comunes pasan con ambos adaptadores

### Requirement: Modos servidor y cliente
El contrato de adaptador SHALL admitir dos modos que alimentan el mismo pipeline: modo servidor (el ring nos llama y respondemos) y modo cliente (nosotros conducimos el bucle con un `RingClient`: sondeo, websocket o nuestro lado como cliente del ring). La batería de tests de contrato SHALL ejecutarse en ambos modos.

#### Scenario: Mismas decisiones en ambos modos
- **WHEN** la misma partida sembrada se juega contra un ring simulado primero en modo servidor y después en modo cliente por sondeo
- **THEN** las decisiones del motor y los mensajes canónicos intercambiados son idénticos

### Requirement: Adaptador HTTP JSON de base
El sistema SHALL exponer el agente mediante un adaptador HTTP JSON genérico que acepta un turno por petición y devuelve la respuesta canónica en el cuerpo, además de un endpoint de salud. Este adaptador SHALL estar disponible antes de conocer el protocolo del ring.

#### Scenario: Turno por HTTP
- **WHEN** un cliente envía un turno válido por HTTP al agente arrancado con la configuración campeona
- **THEN** recibe una respuesta con código de éxito y un cuerpo que cumple el esquema de salida

#### Scenario: Salud
- **WHEN** se consulta el endpoint de salud
- **THEN** responde con la versión de la configuración cargada y el proveedor LLM activo, sin datos del mandato

### Requirement: Adaptadores A2A y MCP
Antes del viernes SHALL existir un spike A2A acotado a 2 horas que pase la batería de contrato con un turno. Si el ring usa A2A o MCP, el sistema SHALL ofrecer el adaptador correspondiente (A2A con su tarjeta de agente, MCP con una herramienta de turno) y su lado cliente, cumpliendo el mismo contrato canónico que el adaptador HTTP JSON; en otro caso los adaptadores completos son opcionales.

#### Scenario: Turno por A2A
- **WHEN** un cliente A2A envía un mensaje de negociación al agente
- **THEN** recibe una respuesta A2A cuyo contenido traducido cumple el esquema de salida canónico

#### Scenario: Turno por MCP
- **WHEN** un cliente MCP invoca la herramienta de turno con argumentos válidos
- **THEN** recibe un resultado cuyo contenido cumple el esquema de salida canónico

### Requirement: Lado cliente de cada adaptador
Cada adaptador implementado SHALL tener un lado cliente capaz de hablar con un agente externo por el mismo protocolo, para que la arena pueda usar agentes externos como rivales y para el modo cliente.

#### Scenario: Cliente contra nuestro propio servidor
- **WHEN** el cliente HTTP JSON juega una partida contra nuestro agente expuesto por HTTP JSON
- **THEN** la partida termina con acuerdo, retirada o límite de rondas y cada mensaje intercambiado cumple el contrato canónico

### Requirement: Campos estructurados fuera del LLM
Cuando el protocolo proporciona campos estructurados (ofertas numéricas, acción, ronda, límite, plazo), el adaptador SHALL mapearlos directamente al contrato canónico y SHALL entregar el texto libre del rival solo como dato opaco; ningún campo estructurado SHALL depender de la interpretación de un LLM. La ronda, el límite y el plazo SHALL proceder solo de campos del ring o de la configuración, nunca del texto del rival.

#### Scenario: Oferta estructurada con texto contradictorio
- **WHEN** el ring envía una oferta estructurada de 2 % a día 10 y un texto que dice "te ofrezco 5 %"
- **THEN** el estado de la sesión registra la oferta estructurada 2 % a día 10 y el texto solo se pasa al parser

### Requirement: Modo solo texto
Cuando el ring no da la oferta del rival como campo estructurado, el sistema SHALL registrar una oferta del rival extraída del texto solo si el parser determinista (expresiones regulares sobre el normalizador numérico) y el parser LLM coinciden en el valor de cada issue; con `LLM_PROVIDER=none` SHALL exigirse que el parser determinista encuentre un único valor no ambiguo por issue. En cualquier otro caso el turno SHALL tratarse como sin oferta y la respuesta SHALL ser nuestra contraoferta pidiendo que el rival confirme sus cifras. Todo mensaje nuestro de aceptación SHALL repetir los valores exactos de cada issue aceptado.

#### Scenario: Parsers coinciden
- **WHEN** en modo solo texto el rival escribe "acepto un 1,5 % pagando el día 15" y ambos parsers devuelven 1.5 y 15
- **THEN** el estado registra la oferta 1.5 % a día 15 como oferta actual del rival

#### Scenario: Parsers discrepan
- **WHEN** el parser determinista extrae 1.5 % y el parser LLM extrae 15 %
- **THEN** el turno se trata como sin oferta, el motor no puede aceptar y el texto enviado pide confirmar las cifras

#### Scenario: Aceptación explícita
- **WHEN** el motor acepta en modo solo texto la oferta 2 % a día 20
- **THEN** el texto enviado contiene "2 %" y "día 20" y el validador rechaza cualquier texto de aceptación que no los contenga

### Requirement: Aceptación del rival ligada a nuestra última oferta
Una acción `accept` del rival SHALL interpretarse solo como aceptación de nuestra última oferta enviada. Si la aceptación llega acompañada de valores (estructurados o reconciliados del texto) distintos de nuestra última oferta, SHALL tratarse como una oferta nueva del rival y pasar por las condiciones de aceptación del motor.

#### Scenario: Aceptación con cifras distintas
- **WHEN** nuestra última oferta fue 2 % a día 20 y el rival envía `accept` con 3 % a día 20
- **THEN** el estado registra una oferta nueva del rival de 3 % a día 20, no un acuerdo, y el motor decide sobre ella

#### Scenario: Aceptación sin cifras
- **WHEN** el rival envía `accept` sin valores tras nuestra oferta de 2 % a día 20
- **THEN** el acuerdo registrado es exactamente 2 % a día 20

### Requirement: Despliegue accesible desde fuera
Antes del viernes a las 18:45 el agente arrancado en un portátil SHALL ser accesible desde otra red mediante un túnel (cloudflared o ngrok) con TLS, y SHALL admitir la autenticación que exija el ring (cabecera o token configurable por entorno, nunca en git). Un script de humo SHALL comprobarlo.

#### Scenario: Humo desde otra red
- **WHEN** desde una red distinta a la del portátil se llama a `GET /health` y se envía un turno por la URL pública del túnel
- **THEN** ambas peticiones responden con éxito por HTTPS y el turno cumple el esquema de salida

### Requirement: Entrada malformada sin caída
Una petición que no cumple el esquema del protocolo SHALL recibir un error de protocolo estructurado sin invocar al cerebro, y el proceso SHALL seguir atendiendo otras peticiones.

#### Scenario: JSON inválido
- **WHEN** llega un cuerpo que no es JSON válido o le faltan campos obligatorios
- **THEN** el adaptador responde con un error de protocolo, registra el incidente y el siguiente turno válido se procesa con normalidad
