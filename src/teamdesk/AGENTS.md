# src/teamdesk/ — mesa de ofertas de equipos

Contraofertas a las ofertas que **otros equipos nos hacen** (to-me) y que El Rastro rechaza (`below-margin`, `last-free-copy`). Solo ventas: el equipo pide una carta nuestra por caja y respondemos con una oferta dirigida (`to` = ese equipo, mismo venue) de esa carta; nunca compramos. Solo se lee la estructura, nunca su texto. Lo usa `pnpm bazaar:play`; los POST salen solo en vivo y con `--team-desk` (opt-in), y si no, son líneas «would».

## Archivos

- **`counter.ts`** — puro: `proposeTeamDesk`. La cifra sale del código: el suelo (`deskFloor`) es el `your_value` de la copia más un margen (el mayor de 2 P y el 10 % del precio) y la comisión del venue; el ancla es suelo × 1,14 (SAL-06: suelo 132, ancla 151). Se baja con `slowReprice` cada 6 ticks mientras la oferta del equipo siga abierta, siempre por `enforceGuardrails` (monótona, nunca bajo el suelo). Además ofrece una repetida que ese equipo pide (`RivalSignals.demand`), nunca la última copia libre. No usa activos ocupados (otras ofertas nuestras, lo que publica El Rastro, bloqueados o reservados). Máximo 3 abiertas; nunca opera en v01, v02, v07 ni v14. Solo baja o cancela las que publicó ella (`deskOfferIds`); las dirigidas de rival-page y rival-swap no son suyas.
- **`desk.ts`** — `executeTeamDesk`: primero las cancelaciones y luego los POST. Justo antes de publicar relee `busyAssets` y el valor del servidor (`/api/me/value`), y sube el suelo si ese valor subió. Registro en `results/bazaar-live/<fecha>/team-desk.jsonl` (`incoming`, `counter`, `step`, `cancel` y `outcome` con el Δ neg), que la tarjeta «Team desk» del visor lee. Al arrancar, `loadDeskLedger` siembra lo enviado hoy.

## Links

- ↑ [`src/`](../AGENTS.md)
