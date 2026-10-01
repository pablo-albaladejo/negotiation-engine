import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { parseArgs } from "node:util";
import { DEFAULT_CATALOG, loadCatalog, type Scenario } from "../arena/scenario.js";
import { createProtocolSchemas, type Offer, type TurnInput, type TurnOutput } from "../protocol/schemas.js";

/**
 * Agente "dummy" totalmente independiente de nuestro motor (`src/engine/`): un programa externo
 * mínimo que solo habla el contrato canónico `POST /turn` / `GET /health` (los mismos esquemas Zod
 * de `src/protocol/schemas.ts`), para enchufarlo con `--agent-url` y compararlo con la campeona.
 * No importa nada de `src/engine/`: su propia aritmética de mandato vive aquí.
 */
export type DummyStrategyName = "accept-first" | "linear";

/** Issue ya orientado al rol del propio agente (`higherBetter`: más alto es mejor para él). */
export interface OrientedIssue {
  name: string;
  min: number;
  max: number;
  higherBetter: boolean;
}

/**
 * `direction` del escenario se declara desde el comprador; para el vendedor se invierte (igual que
 * `orientIssues` del motor, pero reimplementado aquí para no depender de `src/engine/`).
 */
export function orientToRole(scenario: Pick<Scenario, "issues" | "role">): OrientedIssue[] {
  const flip = scenario.role === "seller";
  return scenario.issues.map((issue) => ({
    name: issue.name,
    min: issue.min,
    max: issue.max,
    higherBetter: flip ? issue.direction !== "higher-better" : issue.direction === "higher-better",
  }));
}

export function withinMandate(issues: readonly OrientedIssue[], reservation: Offer, offer: Offer): boolean {
  return issues.every((issue) => {
    const value = offer[issue.name];
    const limit = reservation[issue.name];
    if (value === undefined || limit === undefined) return false;
    return issue.higherBetter ? value >= limit : value <= limit;
  });
}

/** Al menos tan bueno para el agente como `other` en todos los issues. */
function atLeastAsGood(issues: readonly OrientedIssue[], offer: Offer, other: Offer): boolean {
  return issues.every((issue) => (issue.higherBetter ? offer[issue.name]! >= other[issue.name]! : offer[issue.name]! <= other[issue.name]!));
}

function bestExtreme(issue: OrientedIssue): number {
  return issue.higherBetter ? issue.max : issue.min;
}

/** Nunca cruza la reserva: recorta el valor hacia ella si se hubiera pasado. */
function clampToReservation(issue: OrientedIssue, value: number, reservation: number): number {
  return issue.higherBetter ? Math.max(value, reservation) : Math.min(value, reservation);
}

export interface DummyMove {
  action: "accept" | "counter" | "walk";
  offer?: Offer;
}

/**
 * `accept-first`: acepta la primera oferta del rival que esté dentro de su mandato; si no, contesta
 * con su propia reserva (el límite, nunca más allá).
 */
export function acceptFirstMove(issues: readonly OrientedIssue[], reservation: Offer, turn: TurnInput): DummyMove {
  if (turn.rivalAction === "walk") return { action: "walk" };
  if (turn.rivalOffer && withinMandate(issues, reservation, turn.rivalOffer)) return { action: "accept", offer: turn.rivalOffer };
  return { action: "counter", offer: { ...reservation } };
}

/** Oferta del agente en la ronda `round` de `roundLimit`: lineal entre su apertura y su reserva. */
export function linearOffer(issues: readonly OrientedIssue[], reservation: Offer, round: number, roundLimit: number): Offer {
  const limit = Math.max(1, roundLimit);
  const t = limit <= 1 ? 1 : Math.min(1, Math.max(0, (round - 1) / (limit - 1)));
  const offer: Offer = {};
  for (const issue of issues) {
    const open = bestExtreme(issue);
    const res = reservation[issue.name]!;
    offer[issue.name] = clampToReservation(issue, open + (res - open) * t, res);
  }
  return offer;
}

/**
 * `linear`: concede linealmente desde su apertura hasta su reserva a lo largo del límite de
 * rondas (o 10 si el ring no lo da). Acepta si la oferta del rival está dentro de su mandato y es
 * al menos tan buena como la que iba a proponer, o en la última ronda si cubre su reserva.
 */
export function linearMove(issues: readonly OrientedIssue[], reservation: Offer, turn: TurnInput): DummyMove {
  if (turn.rivalAction === "walk") return { action: "walk" };
  const roundLimit = turn.roundLimit ?? 10;
  const offer = linearOffer(issues, reservation, turn.round, roundLimit);
  if (turn.rivalOffer && withinMandate(issues, reservation, turn.rivalOffer)) {
    const goodEnough = atLeastAsGood(issues, turn.rivalOffer, offer) || turn.round >= roundLimit;
    if (goodEnough) return { action: "accept", offer: turn.rivalOffer };
  }
  return { action: "counter", offer };
}

export function decide(strategy: DummyStrategyName, issues: readonly OrientedIssue[], reservation: Offer, turn: TurnInput): DummyMove {
  return strategy === "accept-first" ? acceptFirstMove(issues, reservation, turn) : linearMove(issues, reservation, turn);
}

function renderText(move: DummyMove): string {
  if (move.action === "accept") return "De acuerdo, acepto.";
  if (move.action === "walk") return "No hay acuerdo posible, me retiro.";
  return `Mi propuesta: ${Object.entries(move.offer ?? {}).map(([k, v]) => `${k}=${v}`).join(", ")}.`;
}

export interface DummyAgentAppOptions {
  scenario: Scenario;
  strategy: DummyStrategyName;
}

/**
 * Servidor HTTP del agente dummy: mismo contrato que `pnpm agent` (`POST /turn`, `GET /health`),
 * pero construido a mano con Hono (sin pasar por `src/protocol/http.ts` ni por el pipeline): es un
 * programa externo de verdad, no una reconfiguración de nuestro motor.
 */
export function createDummyAgentApp(options: DummyAgentAppOptions): Hono {
  const { scenario, strategy } = options;
  const issueNames = scenario.issues.map((i) => i.name);
  const issues = orientToRole(scenario);
  const reservation = { ...scenario.mandates[scenario.role].reservation };
  const schemas = createProtocolSchemas(issueNames);
  const app = new Hono();

  app.get("/health", (c) => c.json({ status: "ok", configVersion: 0, llmProvider: "none", strategy }));

  app.post("/turn", async (c) => {
    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: { code: "protocol_error", message: "Cuerpo JSON inválido" } }, 400);
    }
    const input = schemas.turnInput.safeParse(body);
    if (!input.success) {
      const fields = input.error.issues.map((i) => i.path.join(".") || "(raíz)");
      return c.json({ error: { code: "protocol_error", message: `Turno inválido: ${fields.join(", ")}`, fields } }, 400);
    }
    const move = decide(strategy, issues, reservation, input.data);
    const text = renderText(move);
    const base = { sessionId: input.data.sessionId, round: input.data.round, text };
    const output: TurnOutput = move.action === "walk" ? { ...base, action: "walk" } : { ...base, action: move.action, offer: move.offer! };
    const checked = schemas.turnOutput.safeParse(output);
    if (!checked.success) return c.json({ error: { code: "protocol_error", message: "Salida interna inválida" } }, 500);
    return c.json(checked.data);
  });

  return app;
}

function isStrategy(value: string): value is DummyStrategyName {
  return value === "accept-first" || value === "linear";
}

// `pnpm dummy:serve [--strategy accept-first|linear] [--port 8799] [--scenario price-buyer-wide]`:
// agente externo mínimo (no nuestro motor) para jugar con `--agent-url` en `pnpm arena`/`pnpm promote`.
async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      port: { type: "string", default: process.env.PORT ?? "8799" },
      scenario: { type: "string", default: "price-buyer-wide" },
      strategy: { type: "string", default: "accept-first" },
      catalog: { type: "string", default: DEFAULT_CATALOG },
    },
  });
  if (!isStrategy(values.strategy)) throw new Error(`estrategia desconocida: ${values.strategy} (accept-first | linear)`);
  const scenario = loadCatalog(values.catalog, { includeOptIn: true }).find((s) => s.id === values.scenario);
  if (!scenario) throw new Error(`Escenario desconocido: ${values.scenario}`);
  const app = createDummyAgentApp({ scenario, strategy: values.strategy });
  serve({ fetch: app.fetch, port: Number(values.port) }, (info) => {
    console.error(JSON.stringify({ level: "info", event: "dummy_agent_started", strategy: values.strategy, scenario: scenario.id, port: info.port }));
  });
}

const isMain = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
