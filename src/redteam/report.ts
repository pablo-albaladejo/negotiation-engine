/** Resultado de un caso de promptfoo tal y como lo guarda `-o promptfoo.json` (campos usados). */
export interface PromptfooRow {
  success: boolean;
  error?: string | null;
  testCase?: { description?: string; vars?: Record<string, unknown> };
  description?: string;
  gradingResult?: { pass: boolean; reason?: string; componentResults?: { pass: boolean; reason?: string; assertion?: { type?: string; metric?: string } }[] } | null;
}

/** Aserciones que dependen de un evaluador LLM: sus fallos solos quedan pendientes de revisión. */
const MODEL_GRADED = /^(llm-rubric|model-graded|g-eval|factuality|answer-relevance|context-|promptfoo:redteam)/;

export interface RedteamSummary {
  cases: number;
  passed: number;
  realFailures: { case: string; reasons: string[] }[];
  pendingReview: { case: string; reasons: string[] }[];
}

/**
 * Fallo real: falla una aserción determinista o el caso da error. Si solo fallan aserciones de
 * un evaluador LLM, el caso queda pendiente de revisión manual, separado de los fallos reales.
 */
export function summarizePromptfoo(rows: readonly PromptfooRow[]): RedteamSummary {
  const summary: RedteamSummary = { cases: rows.length, passed: 0, realFailures: [], pendingReview: [] };
  for (const row of rows) {
    const name = row.testCase?.description ?? row.description ?? String(row.testCase?.vars?.id ?? "caso");
    if (row.success) {
      summary.passed++;
      continue;
    }
    const failed = (row.gradingResult?.componentResults ?? []).filter((c) => !c.pass);
    const deterministic = failed.filter((c) => !MODEL_GRADED.test(c.assertion?.type ?? ""));
    const reasons = (deterministic.length ? deterministic : failed).map((c) => `${c.assertion?.metric ?? c.assertion?.type ?? "?"}: ${c.reason ?? ""}`.slice(0, 300));
    if (failed.length === 0) summary.realFailures.push({ case: name, reasons: [String(row.error ?? "error sin aserciones")] });
    else if (deterministic.length > 0) summary.realFailures.push({ case: name, reasons });
    else summary.pendingReview.push({ case: name, reasons });
  }
  return summary;
}

export function summaryLine(s: RedteamSummary): string {
  return `red team: ${s.cases} casos · ${s.passed} pasan · ${s.realFailures.length} fallos reales · ${s.pendingReview.length} pendientes de revisión`;
}

export function markdownReport(s: RedteamSummary, meta: { runId: string; config: string; broken: boolean }): string {
  const lines = [`# Red team ${meta.runId}`, "", `- configuración: \`${meta.config}\``, `- agente roto a propósito: ${meta.broken ? "sí" : "no"}`, `- ${summaryLine(s)}`, ""];
  if (s.realFailures.length) lines.push("## Fallos reales", "", ...s.realFailures.map((f) => `- **${f.case}**: ${f.reasons.join(" | ")}`), "");
  if (s.pendingReview.length) lines.push("## Pendientes de revisión (solo evaluador LLM)", "", ...s.pendingReview.map((f) => `- **${f.case}**: ${f.reasons.join(" | ")}`), "");
  return `${lines.join("\n")}\n`;
}
