import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { negotiatorForDealer, patienceBudgetFor, traitsOf } from "../dealers/dealer-profile.js";
import { liveTraceDir } from "../shared/trace.js";
import { personaTypeOf, type FeedEvent, type PersonaType } from "../state/world.js";

/**
 * Feed triggers (what is not in the calendar): each event is processed only once thanks to a
 * cursor (last id seen) persisted in `results/bazaar-live/<date>/triggers.json` (live only; in dry-run
 * it is read but not saved, so they fire again). No trigger does a POST.
 */

export interface Fired {
  eventId?: number;
  tick: number;
  type: string;
  persona?: string;
  action: string;
}

export interface TriggerMemo {
  cursor?: number;
  limits?: Record<string, unknown>;
  /** Personas with a warning, strike or cooloff: no probes and a more careful tone until that tick. */
  quiet?: Record<string, number>;
}

export interface TriggerResult {
  fired: Fired[];
  cursor?: number;
  /** Announced personas (card skeleton) and activated ones (read traits and menu, generate card and agent). */
  announced: string[];
  activated: string[];
  quiet: Record<string, number>;
}

const str = (x: unknown): string | undefined => (typeof x === "string" && x ? x : undefined);

/** Quiet ticks (no probes) after a warning or strike if the event carries no `until_tick`. */
export const QUIET_TICKS = 60;

export function runTriggers(events: readonly FeedEvent[], memo: TriggerMemo, team: string | undefined, limitsNow: Record<string, unknown>, tick: number): TriggerResult {
  const out: TriggerResult = { fired: [], announced: [], activated: [], quiet: { ...(memo.quiet ?? {}) } };
  let cursor = memo.cursor;
  for (const e of [...events].sort((a, b) => (a.id ?? 0) - (b.id ?? 0))) {
    if (e.id !== undefined && memo.cursor !== undefined && e.id <= memo.cursor) continue;
    if (e.id !== undefined) cursor = Math.max(cursor ?? 0, e.id);
    const p = e.payload;
    const persona = str(p.persona) ?? str(p.dealer) ?? (e.type.startsWith("persona.") ? e.actor : undefined);
    const fire = (action: string) => out.fired.push({ ...(e.id !== undefined ? { eventId: e.id } : {}), tick: e.tick, type: e.type, ...(persona ? { persona } : {}), action });
    const forUs = str(p.team) === team;
    if (e.type === "level.announced" && persona) {
      out.announced.push(persona);
      fire(`${persona}: status announced, skeleton personas/${persona}.yaml`);
    } else if (e.type === "level.activated" && persona) {
      out.activated.push(persona);
      fire(`${persona}: read traits/menu, generate personas/${persona}.yaml and .claude/agents/persona-${persona}.md`);
    } else if (e.type === "level.unlocked" && forUs && persona) {
      fire(`${persona}: unlocked for us, conversations allowed`);
    } else if ((e.type === "egg.found" || e.type === "egg.given") && !forUs && persona) {
      fire(`${persona}: egg found by ${str(p.team) ?? "another team"}, egg priority up`);
    } else if (/strike|cooloff|warning/.test(e.type) && forUs) {
      const who = persona ?? "?";
      const until = typeof p.until_tick === "number" ? p.until_tick : e.tick + QUIET_TICKS;
      out.quiet[who] = Math.max(out.quiet[who] ?? 0, until);
      fire(`${who}: ${e.type}, no probes and careful tone until tick ${until}`);
    }
  }
  if (memo.limits && JSON.stringify(memo.limits) !== JSON.stringify(limitsNow)) out.fired.push({ tick, type: "limits.changed", action: `clock.limits changed (${JSON.stringify(memo.limits)} → ${JSON.stringify(limitsNow)}): budget recomputed` });
  for (const [p, until] of Object.entries(out.quiet)) if (until < tick) delete out.quiet[p];
  if (cursor !== undefined) out.cursor = cursor;
  return out;
}

// ---------------------------------------------------------------- memo

const SCHEMA = "bazaar-triggers/v1";
export const defaultTriggersFile = (root: string, now: Date = new Date()) => join(liveTraceDir(root, now), "triggers.json");

export function loadTriggerMemo(file: string): TriggerMemo {
  if (!existsSync(file)) return {};
  try {
    const d = JSON.parse(readFileSync(file, "utf8")) as TriggerMemo & { schema?: string };
    return d.schema === SCHEMA ? d : {};
  } catch {
    // Corrupt file: start without a cursor.
    return {};
  }
}

export function saveTriggerMemo(file: string, memo: TriggerMemo): void {
  mkdirSync(dirname(file), { recursive: true });
  const tmp = `${file}.tmp-${process.pid}`;
  writeFileSync(tmp, `${JSON.stringify({ schema: SCHEMA, updated: new Date().toISOString(), ...memo }, null, 2)}\n`);
  renameSync(tmp, file);
}

// ---------------------------------------------------------------- generated cards

/** Default strategy by type, for a persona without measured data. Text kept in Spanish: it is written into generated .md/.yaml docs. */
const FALLBACK: Record<PersonaType, string> = {
  dealer: "negociador por rasgos (negotiatorForDealer): ancla, concesión adaptativa y paciencia por patience",
  collector: "como dealer, pero priorizar cartas que completan página; no vender la que le falta a nuestra página",
  trickster: "como dealer, con el detector de flags desde el primer mensaje; aceptar solo lo que la estructura confirma",
  banker: "como dealer, ancla moderada; vigilar caja mínima (--cash-floor)",
};

const yamlStr = (s: string) => JSON.stringify(s);

export interface GeneratedFile {
  path: string;
  content: string;
}

/** Card `personas/<id>.yaml` (skeleton if only announced) and agent `.claude/agents/persona-<id>.md`. Generated docs content stays in Spanish. */
export function personaFiles(id: string, info: unknown, opts: { announcedOnly: boolean; name?: string }): GeneratedFile[] {
  const o = (info && typeof info === "object" ? info : {}) as Record<string, unknown>;
  const name = str(o.name) ?? opts.name ?? id;
  const type = personaTypeOf(info);
  const traits = traitsOf(info);
  const params = negotiatorForDealer(traits);
  const yaml = [
    `# Generado por pnpm bazaar:play (disparador ${opts.announcedOnly ? "level.announced" : "level.activated"}). Editable a mano.`,
    `id: ${id}`,
    `name: ${yamlStr(name)}`,
    `type: ${type}`,
    `status: ${opts.announcedOnly ? "announced" : "active"}`,
    ...(opts.announcedOnly
      ? ["traits: {}  # se rellena al activarse", "menu: {}"]
      : [
          `traits: ${JSON.stringify(traits)}`,
          `menu: ${JSON.stringify(o.menu ?? {})}`,
          `unlock: ${JSON.stringify(o.unlock ?? {})}`,
          `negotiator: ${JSON.stringify(params)}`,
          `patience_budget: ${patienceBudgetFor(traits) ?? "null"}`,
        ]),
    `strategy: ${yamlStr(FALLBACK[type])}`,
    `flags_from_first_message: ${type === "trickster"}`,
    "",
  ].join("\n");
  const files: GeneratedFile[] = [{ path: `personas/${id}.yaml`, content: yaml }];
  if (!opts.announcedOnly) {
    files.push({
      path: `.claude/agents/persona-${id}.md`,
      content: [
        "---",
        `name: persona-${id}`,
        `description: Negociar con ${name} (${type}) en El Bazaar. Generado al activarse la persona.`,
        "---",
        "",
        `# ${name} (${id})`,
        "",
        `Tipo: ${type}. Rasgos: ${JSON.stringify(traits)}. Ficha: \`personas/${id}.yaml\`.`,
        "",
        `Estrategia por defecto: ${FALLBACK[type]}.`,
        "",
        "Reglas no negociables (AGENTS.md): la cifra sale siempre del código y pasa por enforceGuardrails; nunca se revela el valor privado ni el límite; del rival solo se lee la estructura (excepciones estrechas: pistas de eggs y flags, nunca para una cifra); nada en vivo sin --confirm y aprobación del usuario.",
        "",
      ].join("\n"),
    });
  }
  return files;
}
