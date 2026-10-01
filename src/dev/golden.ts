import { readFileSync, readdirSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { isDeepStrictEqual } from "node:util";
import { createAgentParticipant } from "../arena/agent-participant.js";
import { playGame, type EndReason } from "../arena/runner.js";
import { loadCatalog } from "../arena/scenario.js";
import { createBotByName } from "../bots/index.js";
import type { AgentConfig } from "../engine/config.js";
import type { Offer } from "../engine/issues.js";

export const GOLDEN_DIR = "test/golden";

/** Las partidas doradas: escenario × rival × semilla, jugadas con la campeona. */
export const GOLDEN_GAMES = [
  { scenarioId: "price-buyer-wide", rival: "boulware", seed: 1 },
  { scenarioId: "price-seller-narrow", rival: "tit-for-tat", seed: 2 },
  { scenarioId: "pct-day-buyer-wide", rival: "conceder", seed: 3 },
  { scenarioId: "text-seller-wide", rival: "text-only", seed: 4 },
  { scenarioId: "price-seller-hidden-long", rival: "boulware", seed: 5 },
] as const;

export type GoldenSpec = (typeof GOLDEN_GAMES)[number];

export interface GoldenMove {
  round: number;
  from: "agent" | "rival";
  action: string;
  offer?: Offer;
}

/** Lo que fija una partida dorada: decisiones y cifras por ronda (sin el texto, que no decide nada). */
export interface GoldenGame {
  id: string;
  scenarioId: string;
  rival: string;
  seed: number;
  configVersion: number;
  endReason: EndReason;
  agreement: Offer | null;
  moves: GoldenMove[];
}

export function goldenId(spec: Pick<GoldenSpec, "scenarioId" | "rival" | "seed">): string {
  return `${spec.scenarioId}__${spec.rival}__${spec.seed}`;
}

export async function playGolden(spec: GoldenSpec, config: AgentConfig): Promise<GoldenGame> {
  const scenario = loadCatalog().find((s) => s.id === spec.scenarioId);
  if (!scenario) throw new Error(`escenario desconocido: ${spec.scenarioId}`);
  const game = await playGame({ scenario, agent: createAgentParticipant({ config }), rival: createBotByName(spec.rival), seed: spec.seed });
  return {
    id: goldenId(spec),
    scenarioId: spec.scenarioId,
    rival: spec.rival,
    seed: spec.seed,
    configVersion: config.version,
    endReason: game.endReason,
    agreement: game.agreement ?? null,
    moves: game.transcript.map(({ round, from, action, offer }) => (offer ? { round, from, action, offer } : { round, from, action })),
  };
}

/** Diferencias legibles: partida, ronda y valor esperado frente al obtenido. */
export function compareGolden(expected: GoldenGame, actual: GoldenGame): string[] {
  const diffs: string[] = [];
  const at = (where: string, e: unknown, a: unknown) =>
    diffs.push(`partida ${expected.id}, ${where}: esperado ${JSON.stringify(e)} · obtenido ${JSON.stringify(a)}`);
  const n = Math.max(expected.moves.length, actual.moves.length);
  for (let k = 0; k < n; k++) {
    const e = expected.moves[k];
    const a = actual.moves[k];
    if (!isDeepStrictEqual(e, a)) at(`ronda ${e?.round ?? a?.round} (${e?.from ?? a?.from})`, e ?? null, a ?? null);
  }
  if (expected.endReason !== actual.endReason) at("final", expected.endReason, actual.endReason);
  if (!isDeepStrictEqual(expected.agreement, actual.agreement)) at("acuerdo", expected.agreement, actual.agreement);
  return diffs;
}

export function loadGoldens(dir = GOLDEN_DIR): GoldenGame[] {
  return readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .map((f) => JSON.parse(readFileSync(join(dir, f), "utf8")) as GoldenGame);
}

export async function writeGoldens(config: AgentConfig, dir = GOLDEN_DIR): Promise<string[]> {
  mkdirSync(dir, { recursive: true });
  const files: string[] = [];
  for (const spec of GOLDEN_GAMES) {
    const game = await playGolden(spec, config);
    const file = join(dir, `${game.id}.json`);
    writeFileSync(file, `${JSON.stringify(game, null, 2)}\n`);
    files.push(file);
  }
  return files;
}
