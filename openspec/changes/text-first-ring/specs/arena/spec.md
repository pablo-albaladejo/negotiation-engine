# Spec Delta: arena

## Purpose

Hace que la arena mida al agente en las condiciones del supuesto de trabajo (solo texto, cualquier idioma) en lugar de sobrestimarlo con ofertas y acciones estructuradas.

## ADDED Requirements

### Requirement: Modo de texto completo para todos los bots
La arena SHALL ofrecer `--text-mode full` (por defecto en los escenarios `text-only`) en el que todos los bots, incluidos los adversariales y el dummy, envían al agente solo texto en lenguaje natural generado a partir de su movimiento canónico, con `rivalAction = message` y sin `rivalOffer`; sus aceptaciones y retiradas también llegan solo como texto. La arena SHALL guardar el movimiento canónico de cada bot como verdad de terreno y determinar el acuerdo real con ella. El modo actual (`agent-side`: sin oferta estructurada pero con acción del ring) SHALL seguir disponible. La opción `--rival-view text`, en la que los bots no LLM reciben solo nuestro texto leído con el parser determinista, SHALL ser opcional.

#### Scenario: Bot adversarial en texto completo
- **WHEN** se juega contra el bot Boulware con `--text-mode full`
- **THEN** ningún turno que recibe el agente trae `rivalOffer` ni `rivalAction` distinta de `message`, y el resultado guarda la oferta canónica del bot en cada turno

#### Scenario: Acuerdo real frente a acuerdo registrado
- **WHEN** el agente registra un acuerdo por texto en una ronda en que el bot no aceptó
- **THEN** la partida cuenta una falsa aceptación y el excedente se calcula sobre el resultado real

### Requirement: Bots multilingües
El renderizador de lenguaje natural de los bots SHALL admitir un idioma por partida, elegido por semilla de una lista configurable (`--languages`, por defecto `es,en`), y variar el formato de cada cifra: dígitos con coma o punto decimal, separadores de miles locales, palabras, puntos básicos, y en escrituras no latinas dígitos nativos y de ancho completo. Las formas no extraíbles a propósito (rangos, cifras ambiguas) SHALL seguir marcadas como tales en la verdad de terreno.

#### Scenario: Partida en español
- **WHEN** se juega con `--languages es` y semilla 7
- **THEN** todos los mensajes del bot están en español y la secuencia de formatos se reproduce con la misma semilla

#### Scenario: Escritura no latina
- **WHEN** se juega con `--languages ar`
- **THEN** los mensajes usan escritura árabe y al menos uno de cada tres usa dígitos arábigo-índicos

### Requirement: Bot LLM como sparring principal
El bot LLM SHALL poder jugar en texto completo y en un idioma dado (`--language`), recibir solo nuestro texto (sin nuestra oferta estructurada) y usar `anthropic-api` o `claude-cli`. Sus ofertas siguen pasando por sus guardarraíles y su movimiento canónico es la verdad de terreno.

#### Scenario: Sparring LLM en francés
- **WHEN** se juega contra el bot LLM con `--language fr --text-mode full`
- **THEN** el bot escribe en francés, no recibe nuestra oferta estructurada y la arena registra su oferta canónica por turno

### Requirement: Métricas de lectura del texto
Por partida y agregadas, la arena SHALL calcular: `unextracted` (el bot hizo una oferta extraíble y el agente no registró ninguna), `misread` (oferta registrada distinta de la canónica), `falseAccept` (acuerdo registrado sin aceptación real), `missedAccept` (aceptación real no detectada), `falseWalk`, `confirmRate`, tasa de acuerdo, excedente, latencia del turno p50/p95 y `templateRate`, desglosadas por idioma y política del parser.

#### Scenario: Lectura equivocada
- **WHEN** el bot ofrece 2.5 % y el agente registra 25 %
- **THEN** el turno cuenta en `misread` y no en `unextracted`

### Requirement: Evaluación de políticas e idiomas
`pnpm eval:llm` SHALL comparar, con las mismas semillas y en texto completo, las políticas `llm-primary-verified`, `dual-strict` y `deterministic-only` por idioma configurado y por proveedor disponible (`claude-cli`, y `anthropic-api` si hay clave), contra los bots de texto y el bot LLM, e informar las métricas de lectura en una tabla por política × idioma. Ninguna celda SHALL tener falsas aceptaciones para considerarse candidata a valor por defecto.

#### Scenario: Comparación de políticas
- **WHEN** se ejecuta `pnpm eval:llm` con `EVAL_LLM_LANGUAGES=es,en`
- **THEN** el informe tiene una fila por política e idioma con `unextracted`, `misread`, `falseAccept`, acuerdo, excedente, latencia y `templateRate`
