import type { Intent } from "../coordinator/coordinator.js";
import { DEFAULT_MECHANISM_THRESHOLDS, VENUE_SWITCH_BOND, VENUE_SWITCH_FEE, type MechanismDecision, type MechanismThresholds } from "./mechanism.js";

/**
 * Ruta `venue-mechanism` del coordinador: propone `venue:switch-to-board` (cerrar v04 + abrir un venue board + arrancar
 * el broker en vivo) cuando la regla lo recomienda, y `venue:back-to-auto` como red de seguridad si estamos en board sin
 * broker vivo antes de un bench. Nunca propone pasar a board a menos de `noSwitchWithinTicks` de un bench.
 * Ejecutar exige `--confirm` Y `--allow-venue-switch` (aprobación expresa del usuario); aun así solo imprime los pasos.
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
    // Guardarraíl repetido aquí a propósito: aunque la regla cambie, nunca se propone cerca de un bench.
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

/** Puerta de ejecución: en vivo solo sin --dry-run, con --confirm Y con --allow-venue-switch. */
export function venueSwitchGate(f: VenueSwitchFlags): { execute: boolean; reason: string } {
  if (f.dryRun) return { execute: false, reason: "dry-run" };
  if (!f.confirm) return { execute: false, reason: "needs --confirm" };
  if (!f.allowVenueSwitch) return { execute: false, reason: "needs --allow-venue-switch (explicit user approval)" };
  return { execute: true, reason: "--confirm and --allow-venue-switch" };
}

/**
 * Lo seleccionado de esta ruta. Con la puerta cerrada solo dice que no sale; con la puerta abierta imprime los pasos
 * para el operador (el cierre `POST /api/venues/{id}/close` del kit no se ha probado: no se envía desde aquí).
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
      `venue: ${i.id} APPROVED (${gate.reason}); run in order, by hand:`,
      `  1. POST /api/venues/${v}/close (kit close_venue; unverified)`,
      `  2. pnpm bazaar:venue --mechanism ${mechanism} --confirm`,
      mechanism === "board" ? "  3. pnpm bazaar:broker --confirm (live broker; stop the shadow one)" : "  3. pnpm bazaar:broker --shadow (back to shadow)",
    ];
  });
}
