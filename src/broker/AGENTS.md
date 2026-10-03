# src/broker/ — Broker

Broker de nuestro venue (v04 "Team 2 · El Rastro Express", 0 % y 0 P por carta) con la cabecera `X-Broker-Key` (`BAZAAR_BROKER_KEY` en .env.broker, ignorado por git; nunca se imprime). El Market Test puntúa la ganancia entre los límites ocultos de las ofertas de banco casadas: el precio no cuenta, solo qué ofertas se cruzan. **Aviso**: con `mechanism: auto` el motor cruza el banco antes que el broker (nivel puesto, la mitad de los puntos); el broker solo supera al puesto en un venue `board`. Entrada: `main.ts` (`pnpm bazaar:broker`).

## Archivos

- **`broker.ts`** — puro. `parseBrokerBook` tolerante (formas raras a `errors`, nunca lanza); `benchRun` ("b3-7" → "b3"); `planBench`: por tanda, cruce ordenado (asks ascendentes contra bids descendentes mientras bid ≥ ask, punto medio entero `fairPrice`, nunca fuera de [ask, bid]), cada oferta una vez; capa de paciencia: `observeBench` sigue cotizaciones entre ticks, `temperOf` (new, relaxing, firm, settled), `estimatedLimit` (firme: `firmShade`; relajando: un paso más) ordena por límite estimado, `isUrgent` (relaja ahora o edad ≥ `maxAgeTicks`) y `holdTicks` aplaza pares nuevos y pacientes (0 por defecto = como el puesto). `planPublic`: venta de una carta contra puja por un tipo, otro maker, bid ≥ ask + comisión, como mucho `MAX_PUBLIC_MATCHES_PER_TICK` (10) por tick, los de más excedente. `bookStateKey` evita reenviar el mismo estado.
- **`client.ts`** — `BrokerClient` (libro, reloj, mercados, cruces, anuncio) con el `TokenBucket` de `../shared/client.ts`; `loadBrokerEnv`.
- **`agent.ts`** — `BrokerAgent.step`: lee reloj y libro, avisa si el venue es auto, anuncia una vez, planea solo si cambió el estado, no reutiliza ofertas ya casadas, registra rechazos sin parar. `FileBrokerSink`: `results/bazaar-live/<fecha>/broker.jsonl` (tick, sell, buy, price, surplus, estado) y `bench.jsonl` (fotos del banco para calibrar la paciencia).
- **`main.ts`** — `runBrokerCli`: `pnpm bazaar:broker --dry-run --once` (solo GET). En vivo exige quitar `--dry-run` y pasar `--confirm`; corre sin fin. Flags: `--poll-ms` (1000), `--hold-ticks` (0), `--firm-shade` (0,1), `--max-age-ticks` (6), `--max-public` (10), `--steps`, `--no-announce`.

## Links

- ↑ [`src/`](../AGENTS.md)
- → [`src/venue/`](../venue/AGENTS.md) — el venue que casa
