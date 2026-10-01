import { readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { z } from "zod";
import type { LlmClient } from "../llm/provider.js";

interface TranscriptLine {
  gameId: string;
  scenarioId: string;
  rival: string;
  role: string;
  endReason: string;
  rounds: number;
  transcript: { round: number; from: string; action: string; offer?: Record<string, number> }[];
  metrics: { agreement: boolean; zopaEmpty: boolean; rivalError?: boolean };
}

const CriticSchema = z
  .object({
    summary: z.string().max(4_000),
    findings: z.array(z.object({ gameId: z.string(), cause: z.string().max(1_000), suggestion: z.string().max(1_000) }).strict()).max(50),
  })
  .strict();

/** Derrota: había ZOPA y no hubo acuerdo (los errores del rival no cuentan). */
export function lossesOf(lines: readonly TranscriptLine[]): TranscriptLine[] {
  return lines.filter((l) => !l.metrics.zopaEmpty && !l.metrics.agreement && !l.metrics.rivalError);
}

export interface CriticOptions {
  /** Directorio de una ejecución de `pnpm arena` (con transcripts.jsonl). */
  runDir: string;
  client: LlmClient;
  maxGames?: number;
  timeoutMs?: number;
}

/**
 * Crítico LLM: lee las derrotas de una ejecución de la arena (solo acciones y cifras, sin textos
 * ni mandatos) y escribe `critic.md` en el mismo directorio de `results/`. No toca configuraciones.
 */
export async function runCritic(options: CriticOptions): Promise<{ reportPath: string; losses: number }> {
  const lines = readFileSync(join(options.runDir, "transcripts.jsonl"), "utf8")
    .split("\n")
    .filter((l) => l.trim())
    .map((l) => JSON.parse(l) as TranscriptLine);
  const losses = lossesOf(lines);
  const reportPath = resolve(options.runDir, "critic.md");
  const header = `# Crítico de derrotas\n\nEjecución: ${options.runDir} · partidas ${lines.length} · derrotas ${losses.length}\n\n`;
  if (losses.length === 0) {
    writeFileSync(reportPath, `${header}Sin derrotas: no se ha consultado al LLM.\n`);
    return { reportPath, losses: 0 };
  }
  const games = losses.slice(0, options.maxGames ?? 20).map((l) => ({
    gameId: l.gameId,
    scenarioId: l.scenarioId,
    rival: l.rival,
    role: l.role,
    endReason: l.endReason,
    rounds: l.rounds,
    moves: l.transcript.map(({ round, from, action, offer }) => ({ round, from, action, ...(offer ? { offer } : {}) })),
  }));
  const result = await options.client.complete({
    system:
      "Analizas partidas de negociación perdidas (sin acuerdo con ZOPA) de un agente determinista. Para cada una da la causa probable y una sugerencia sobre parámetros (beta, márgenes, umbrales, horizonte). Solo análisis: no generes configuraciones.",
    prompt: `<games>\n${JSON.stringify(games)}\n</games>`,
    schema: CriticSchema,
    timeoutMs: options.timeoutMs ?? 120_000,
  });
  const body = result.ok
    ? `## Resumen\n\n${result.value.summary}\n\n## Partidas\n\n${result.value.findings.map((f) => `- **${f.gameId}**: ${f.cause}\n  - Sugerencia: ${f.suggestion}`).join("\n")}\n`
    : `El LLM no respondió (${result.error.message}).\n`;
  writeFileSync(reportPath, header + body);
  return { reportPath, losses: losses.length };
}
