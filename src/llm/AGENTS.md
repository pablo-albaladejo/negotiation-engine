# src/llm/ — Parser, Narrador, Proveedor

Parse el texto del rival en JSON tipado, redacta la respuesta en nombre del agente, y valida que el número coincida con la decisión del motor.

## Propósito

Aisla el LLM en dos cajas desconectadas:
1. **Parser**: lee el texto rival sin herramientas (cualquier idioma) y devuelve JSON validado con Zod: cifras con evidencia literal (`figures`), intención con `intentEvidence` e idioma. Sus cifras solo llegan al motor vía `reconcileOffer` (`src/pipeline/reconcile.ts`) según `parser.policy`, tras `verifyFigures` (`verify.ts`); intención y tácticas solo van al narrador y a la aceptación verificada. Nunca fija mandato, reserva ni identidad.
2. **Narrador**: redacta la respuesta (texto) a partir de la decisión del motor ya tomada.

La validación final (el número en el texto = el número del motor) garantiza que no hay fuga de autoridad.

## Archivos clave

- **`parser.ts`** — Interfaz `TextParser`: `parse(text)` → `ParserOutput` (campos tipados del rival).
- **`llm-parser.ts`** — `createLlmParser(client, options)` → `TextParser`: invoca al LLM sin herramientas para estructurar el texto.
- **`deterministic-parser.ts`** — `parseDeterministic()` y `deterministicParser`: parsea reglas simples (no LLM), por defecto con `LLM_PROVIDER=none`.
- **`narrator.ts`** — Interfaz `Narrator`: `narrate(input: NarratorInput, signal)` → texto (redacción de la respuesta).
- **`llm-narrator.ts`** — `createLlmNarrator(client, options)` → `Narrator`: invoca al LLM para redactar (la cifra ya está decidida, no varía).
- **`template.ts`** — `renderTemplate(decision, language, options)`: plantilla determinista sin LLM (fallback si timeout o error) por idioma (`templates/en.ts`, `templates/es.ts`); idioma no cubierto ⇒ forma neutral (`template.uncovered = neutral`: marca en `template.fallbackLanguage` y cifras con issue y unidad) o plantilla de `fallbackLanguage`. Asks: `confirm-figures`, `confirm-acceptance`. Al menos 4 formulaciones por intención, rotadas con `templateVariant(sessionId, round)`; la petición de confirmar puede repetir cifras del rival (`Echo`: rango o cifra solo LLM), que el validador admite como cifras repetidas y que el pipeline descarta si el detector de fugas las bloquea. `templateNarrator` (en `narrator.ts`) la usa como narrador `none`.
- **`validator.ts`** (idioma) — cifras de cualquier escritura con el normalizador; coherencia con `COHERENCE` por idioma (en, es); idioma no cubierto: `validator.coherence = known-languages` aprueba con `coherence: "unchecked"`, `strict` rechaza.
- **`leak.ts`** (idioma) — proximidad numérica a la reserva en cualquier escritura (señal principal); `MANDATE_PATTERNS` por idioma (en, es) como señal secundaria.
- **Narrador** — `NarratorInputSchema` añade solo `language` (BCP-47); el prompt de `llm-narrator.ts` pide escribir en ese idioma.
- **`validator.ts`** — `validateText()`: comprueba que cifra en texto = cifra del motor.
- **`provider.ts`** — Factory: instancia parser y narrador según `LLM_PROVIDER` (none, claude-cli, anthropic-api).
- **`numbers.ts`** — Normaliza y extrae números del texto rival: `foldText()` (NFKC, sin `\p{Cf}`, dígitos `\p{Nd}` de cualquier escritura, separadores locales), rangos y ambigüedad.
- **`verify.ts`** — `verifyFigures()`: verificación determinista de cada cifra del LLM (el fragmento aparece en el texto y su lectura es el valor, dentro del rango del issue).
- **`language.ts`** — `detectLanguage()`/`turnLanguage()`: idioma BCP-47 del rival con respaldo por escritura Unicode.
- **`leak.ts`** — `detectLeak(text, {issues, reservation, decided})`: verifica que nuestro texto saliente no revela la reserva ni el mandato (las cifras decididas están exentas).

## Invariantes

Desde root `AGENTS.md`:

- **El texto rival solo entra al parser**, sin herramientas, nunca al motor ni al narrador.
- **El parser devuelve JSON validado con Zod**: nunca pasa incertidumbre al motor.
- **La cifra de la respuesta debe coincidir exactamente con la decisión del motor** (validador final).
- **Timeout o error del narrador → plantilla determinista** con el mismo número.
- **Leak (intento de influencia en la cifra) → registro, pero no cambia la decisión**.
- **`NarratorInputSchema` es `.strict()`**: solo admite `action`, `offer` (decidida), `rivalIntent`/`tactics` (enums), `persona` y `ask`. Nunca lleva texto del rival.

## Cómo trabajar aquí

```bash
# Tests del parser, narrador, validador
pnpm test test/llm/

# Fixtures de prueba
# test/fixtures/parser/    - entrada/salida del parser
# test/fixtures/llm/       - pruebas de números y plantilla
# test/fixtures/numbers/   - normalización de números

# TypeScript
pnpm typecheck
```

Configurar `LLM_PROVIDER` en `.env`:
- `none` — parser determinista, narrador plantilla (no requiere API).
- `claude-cli` — usa `claude` en PATH (requiere sesión Claude CLI).
- `anthropic-api` — usa `ANTHROPIC_API_KEY` (para producción el día del torneo).

## Links

- ↑ [`src/`](../AGENTS.md)
- ← Entrada: texto rival de `TurnInput`
- → Salida: texto de la respuesta en `TurnOutput`
- ← Decisión: viene del `engine/` (acción + oferta + explicación)
- → [`provider.ts`](provider.ts) — inyección de dependencias (parser, narrador)
- → [`test/llm/`](../../test/llm/) — tests del parser
- → [`test/fixtures/`](../../test/fixtures/) — fixtures de prueba
