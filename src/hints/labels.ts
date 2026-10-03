import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { normalize } from "../flags/flags.js";
import { claudeOnce } from "../shared/llm.js";
import type { HintLine } from "./corpus.js";

/**
 * Step 3 of the corpus: an LLM labels each candidate line ('hint' | 'egg-clue' | 'voice'), names the persona it
 * points to and proposes the probe phrase. Its output is checked against the line itself: the phrase must be a
 * literal substring of the dealer's text (no invented words, never digits) and the target a known persona.
 * Cached in `results/bazaar-live/hint-labels.json` by line key; it never blocks a tick and never yields a figure.
 */

export type HintClass = "hint" | "egg-clue" | "voice";

export interface HintLabel {
  classification: HintClass;
  /** Probe phrase: literal substring of the line's text. */
  phrase?: string;
  /** Persona the line points to (where the egg would be). */
  target?: string;
  at: string;
}

const SCHEMA = "bazaar-hint-labels/v1";
const CLASSES: readonly HintClass[] = ["hint", "egg-clue", "voice"];
/** Lines per LLM call: one call labels a batch, the rest wait for the next ones. */
export const LABEL_BATCH = 15;

export const defaultHintLabelsFile = (root: string) => join(root, "results", "bazaar-live", "hint-labels.json");

export function loadHintLabels(file: string): Map<string, HintLabel> {
  if (!existsSync(file)) return new Map();
  try {
    const data = JSON.parse(readFileSync(file, "utf8")) as { schema?: string; labels?: Record<string, HintLabel> };
    return data.schema === SCHEMA ? new Map(Object.entries(data.labels ?? {})) : new Map();
  } catch {
    // Corrupt file: relabel from scratch (labels are a cache).
    return new Map();
  }
}

function saveHintLabels(file: string, labels: ReadonlyMap<string, HintLabel>): void {
  mkdirSync(dirname(file), { recursive: true });
  const tmp = `${file}.tmp-${process.pid}`;
  writeFileSync(tmp, `${JSON.stringify({ schema: SCHEMA, updated: new Date().toISOString(), labels: Object.fromEntries(labels) }, null, 2)}\n`);
  renameSync(tmp, file);
}

/** Lines with their label: classification, phrase, and the label's target added to `targets`. */
export function applyLabels(lines: readonly HintLine[], labels: ReadonlyMap<string, HintLabel>): HintLine[] {
  return lines.map((l) => {
    const lab = labels.get(l.key);
    if (!lab) return l;
    const targets = lab.target && lab.target !== l.persona && !(l.targets ?? []).includes(lab.target) ? [...(l.targets ?? []), lab.target] : l.targets;
    return { ...l, classification: lab.classification, ...(lab.phrase ? { phrase: lab.phrase } : {}), ...(targets?.length ? { targets } : {}) };
  });
}

export function labelPrompt(lines: readonly HintLine[], personas: readonly { id: string; name?: string }[]): string {
  return [
    "You label lines spoken by NPC dealers in a trading-card game set in Madrid. Each dealer hides easter eggs: an egg fires when a player's message contains one of its secret phrases. Dealers also drop hints that point towards eggs, often at ANOTHER dealer's stall (\"ask Carmen about the golden chulapa\").",
    "For each line decide:",
    '- classification: "egg-clue" if it points to a secret, legend, rare object or a phrase to ask someone about; "hint" if it is a rumour or announcement (who opens when, another stall) without a phrase to ask; "voice" if it is just the character talking or haggling.',
    '- phrase: for egg-clue only, the shortest exact words FROM THE LINE that a player should say to the dealer to trigger the egg (e.g. "the golden chulapa"). Copy them literally from the line, 2 to 6 words, no numbers. Otherwise null.',
    "- target: the id of the dealer where that phrase should be said (the one the line tells you to ask), or the speaker's id if it is their own secret; null if unclear.",
    `Known dealers: ${personas.map((p) => `${p.id}${p.name ? ` (${p.name})` : ""}`).join(", ")}.`,
    'Answer ONLY a JSON array, one object per line, in order: [{"key": "...", "classification": "...", "phrase": "..." | null, "target": "..." | null}]',
    "",
    ...lines.map((l) => JSON.stringify({ key: l.key, speaker: l.persona, text: l.text.slice(0, 500) })),
  ].join("\n");
}

/** Validated labels from the LLM answer: unknown keys, classes, targets or phrases not in the text are dropped. */
export function parseLabels(answer: string, lines: readonly HintLine[], personaIds: readonly string[], now: Date = new Date()): Map<string, HintLabel> {
  const out = new Map<string, HintLabel>();
  const json = /\[[\s\S]*\]/.exec(answer)?.[0];
  if (!json) return out;
  let rows: unknown;
  try {
    rows = JSON.parse(json);
  } catch {
    return out;
  }
  if (!Array.isArray(rows)) return out;
  const byKey = new Map(lines.map((l) => [l.key, l]));
  for (const r of rows as Record<string, unknown>[]) {
    const line = typeof r?.key === "string" ? byKey.get(r.key) : undefined;
    const cls = r?.classification as HintClass;
    if (!line || !CLASSES.includes(cls)) continue;
    const phrase = typeof r.phrase === "string" ? r.phrase.trim() : "";
    const okPhrase = cls === "egg-clue" && phrase.length >= 3 && !/\d/.test(phrase) && normalize(line.text).includes(normalize(phrase));
    const target = typeof r.target === "string" && personaIds.includes(r.target) ? r.target : undefined;
    out.set(line.key, { classification: cls, ...(okPhrase ? { phrase } : {}), ...(target ? { target } : {}), at: now.toISOString() });
  }
  return out;
}

/**
 * Labels candidate lines in the background: at most one LLM call in flight; `tick` starts one when there are
 * unlabelled candidates and returns at once (the result is read on a later tick from the file).
 */
export class HintLabeler {
  private running = false;
  private failures = 0;

  constructor(
    private readonly file: string,
    private readonly ask: (prompt: string) => Promise<string | null> = (p) => claudeOnce(p, { timeoutMs: 90_000 }),
  ) {}

  tick(lines: readonly HintLine[], personas: readonly { id: string; name?: string }[]): string | undefined {
    if (this.running) return "hint labels: LLM call in flight";
    const labels = loadHintLabels(this.file);
    // Most recent first: today's clues matter more than Friday's.
    const todo = lines.filter((l) => l.candidate && !labels.has(l.key)).sort((a, b) => (b.tick ?? 0) - (a.tick ?? 0)).slice(0, LABEL_BATCH);
    if (!todo.length) return undefined;
    // Three failures in a row: stop asking for this run (no claude CLI, no quota…).
    if (this.failures >= 3) return `hint labels: LLM off after ${this.failures} failures (${todo.length}+ unlabelled)`;
    this.running = true;
    void this.ask(labelPrompt(todo, personas))
      .then((answer) => {
        const fresh = answer ? parseLabels(answer, todo, personas.map((p) => p.id)) : new Map<string, HintLabel>();
        if (!fresh.size) {
          this.failures++;
          return;
        }
        this.failures = 0;
        const merged = loadHintLabels(this.file);
        for (const [k, v] of fresh) merged.set(k, v);
        saveHintLabels(this.file, merged);
      })
      .catch(() => {
        this.failures++;
      })
      .finally(() => {
        this.running = false;
      });
    return `hint labels: labelling ${todo.length} candidate lines`;
  }
}
