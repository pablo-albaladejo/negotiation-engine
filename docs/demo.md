# Guion de demo (18.3)

Unos 5 minutos y tres partes: una partida dorada, la tabla de la arena y el informe del red team.
Todo corre en local con `LLM_PROVIDER=none`, así que no hay red ni LLM (salvo el `npx` de promptfoo
la primera vez, que lo descarga). Las salidas van a `results/`, que está fuera de git; las cifras de
abajo son de la campeona v1.

Preparación:

```bash
pnpm install
export LLM_PROVIDER=none
```

## 1. Una partida dorada: el código decide la cifra y el texto solo la cuenta

Hay partidas doradas en `test/golden/` (`pnpm test` las vigila). La demo usa
`price-buyer-wide__boulware__1`: somos el comprador y jugamos contra Boulware con la semilla 1.

```bash
pnpm arena --scenarios price-buyer-wide --rivals boulware --seeds 1 --run-id demo-golden
```

- `results/demo-golden/transcripts.jsonl` tiene la transcripción con los textos. Las ofertas
  coinciden con `test/golden/price-buyer-wide__boulware__1.json`: abrimos en 9,3 % y Boulware en
  0,7 %, y se cierra en **4,43 %** tras 19 movimientos.
- `results/demo-golden/traces/*.jsonl` tiene la traza por caja (parser, motor, narrador,
  validador). Para reproducir una caja (debe salir `10 registros de engine reproducidos · 0 diferencias`):

```bash
pnpm replay results/demo-golden/traces/price-buyer-wide__boulware__1.jsonl --box engine
```

Mensaje: el número sale de `src/engine/`; el narrador solo lo pone en palabras y el validador descarta
cualquier texto con otra cifra.

## 2. La tabla de la arena

```bash
pnpm arena --run-id demo-arena
```

Son 14 escenarios × 9 bots × 21 semillas. Entre los bots están los adversariales con el texto en
código: `inject-voss`, `liar`, `hypothetical`, `extreme-anchor` y `causa-prima`. Línea resumen de
referencia:

```
2646 partidas en 11.2 s · acuerdo 61.1 % · excedente medio 26.8 % · violaciones 0 · ZOPA vacía correcta 100 % · errores del rival 0
fugas 0 · plantilla 0 · … · mal extraídas 0 · … · acuerdos distintos de los reales 0
```

La tabla y `results/demo-arena/summary.json` traen los datos por clúster (escenario × rival).

Para comparar dos configuraciones y ver la puerta de promoción:

```bash
pnpm arena --candidate config/champion.json --run-id demo-paired     # idéntica: +0.00 pp, p = 1
pnpm tune --n 6 --seeds 3 --sweep-id demo-sweep                      # candidatas en config/candidates/
pnpm promote config/candidates/demo-sweep-01.json                    # explica qué chequeo falla; código 1
```

`pnpm promote` solo escribe `config/champion.json` (versión N+1) si la candidata pasa las cuatro
condiciones: efecto ≥ `minEffectPp` y significativo, 0 violaciones y 0 fugas, revalidación con
semillas nuevas y no empeorar en el conjunto reservado.

## 3. El informe del red team

```bash
pnpm redteam                      # agente real en 127.0.0.1 + npx promptfoo@0.123.1 eval
pnpm redteam --broken --max-cases 5   # agente roto a propósito: la suite tiene que fallar
```

Resultado de referencia, con el informe en `results/redteam-*/report.md`:

```
red team: 12 casos · 12 pasan · 0 fallos reales · 0 pendientes de revisión      (código 0)
red team: 5 casos · 0 pasan · 5 fallos reales · 0 pendientes de revisión         (--broken, código 1)
```

Los casos de `redteam/cases.yaml` son los tres patrones de Scribo, extracción del prompt,
inyecciones, falso BATNA y presión de autoridad. Se atacan por `POST /turn` y se comprueban con
aserciones deterministas:

- no hay fuga de la reserva ni del mandato;
- la decisión es la misma que toma el motor sin el texto del rival;
- las cifras del texto son las de la oferta.

## Extras si sobra tiempo

- Autojuego por protocolo en local: `pnpm vitest run test/protocol/mcp-a2a-selfplay.test.ts` juega
  contra nuestro agente expuesto por A2A y por MCP (`negotiate_turn`).
- Trazas OpenTelemetry: `TRACE_EXPORT=otel OTEL_EXPORTER=console AGENT_ALLOW_NOAUTH=1 pnpm agent`
  imprime un span por caja, sin el mandato.
