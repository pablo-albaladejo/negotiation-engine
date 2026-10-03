import type { Intent } from "../coordinator/coordinator.js";
import { DEFAULT_MECHANISM_THRESHOLDS, VENUE_SWITCH_BOND, VENUE_SWITCH_FEE, type MechanismDecision, type MechanismThresholds } from "./mechanism.js";

/**
 * `venue-mechanism` coordinator route: proposes `venue:switch-to-board` (close v04 + open a board venue + start
 * the live broker) when the rule recommends it, and `venue:back-to-auto` as a safety net if we are on board without a
 * live broker before a bench. Never proposes moving to board less than `noSwitchWithinTicks` from a bench.
 * Executing requires `--confirm` AND `--allow-venue-switch` (express user approval); even so it only prints the steps
 * (`pnpm bazaar:venue --replace`).
 */

export const SWITCH_TO_BOARD_ID = "venue:switch-to-board";
export const BACK_TO_AUTO_ID = "venue:back-to-auto";

export function proposeVenueMechanism(
  d: MechanismDecision,
  venueId: string | undefined,
  t: MechanismThresholds = DEFAULT_MECHANISM_THRESHOLDS,
): { intents: Intent[]; notes: string[] } {
  const notes: string[] = [];
  const v = venueId ?? "our venue";
  if (d.recommendation === "switch-to-board") {
    // Guardrail repeated here on purpose: even if the rule changes, it is never proposed near a bench.
    if (d.ticksToBench !== undefined && d.ticksToBench < t.noSwitchWithinTicks) {
      notes.push(`switch-to-board not proposed: ${d.ticksToBench} ticks to the bench < ${t.noSwitchWithinTicks}`);
      return { intents: [], notes };
    }
    return {
      intents: [
        {
          id: SWITCH_TO_BOARD_ID,
          route: "venue",
          kind: "venue",
          summary: `close ${v} (auto; bond back after cooldown) + open a board venue (${VENUE_SWITCH_BOND} P bond + ${VENUE_SWITCH_FEE} P) + start the broker live · ${d.reason}`,
        },
      ],
      notes,
    };
  }
  if (d.recommendation === "back-to-auto") {
    return {
      intents: [{ id: BACK_TO_AUTO_ID, route: "venue", kind: "venue", summary: `close ${v} (board) + open an auto venue (${VENUE_SWITCH_BOND} P bond + ${VENUE_SWITCH_FEE} P) · ${d.reason}` }],
      notes,
    };
  }
  notes.push(`${d.recommendation}: ${d.reason}`);
  return { intents: [], notes };
}

export interface VenueSwitchFlags {
  dryRun: boolean;
  confirm: boolean;
  allowVenueSwitch: boolean;
}

/** Execution gate: live only without --dry-run, with --confirm AND with --allow-venue-switch. */
export function venueSwitchGate(f: VenueSwitchFlags): { execute: boolean; reason: string } {
  if (f.dryRun) return { execute: false, reason: "dry-run" };
  if (!f.confirm) return { execute: false, reason: "needs --confirm" };
  if (!f.allowVenueSwitch) return { execute: false, reason: "needs --allow-venue-switch (explicit user approval)" };
  return { execute: true, reason: "--confirm and --allow-venue-switch" };
}

/**
 * What this route selected. With the gate closed it only says it does not go out; with the gate open it prints the steps
 * for the operator (`pnpm bazaar:venue --replace`: the switch is never sent from the coordinator).
 */
export function executeVenueMechanism(selected: readonly Intent[], venueId: string | undefined, f: VenueSwitchFlags): string[] {
  const mine = selected.filter((i) => i.route === "venue");
  if (!mine.length) return [];
  const gate = venueSwitchGate(f);
  const v = venueId ?? "<venue>";
  return mine.flatMap((i) => {
    if (!gate.execute) return [`venue: ${i.id} NOT executed (${gate.reason})`];
    const mechanism = i.id === SWITCH_TO_BOARD_ID ? "board" : "auto";
    return [
      `venue: ${i.id} APPROVED (${gate.reason}); run by hand (closes ${v}, checks the close, opens the new venue):`,
      `  1. pnpm bazaar:venue --replace --mechanism ${mechanism} --dry-run, then the same with --confirm instead of --dry-run`,
      mechanism === "board" ? "  2. pnpm bazaar:broker --confirm (live broker; stop the shadow one)" : "  2. pnpm bazaar:broker --shadow (back to shadow)",
    ];
  });
}
