import type { Issue } from "./config.js";
import type { Role } from "./guardrails.js";

/** Un valor por issue declarado. */
export type Offer = Record<string, number>;

/**
 * Mandato privado de la sesión: rol y límites por issue (la oferta de reserva).
 * La utilidad de reserva se calcula con la misma función de utilidad.
 * Lo fija el código desde la configuración del escenario o de la sesión, nunca el texto del rival.
 */
export interface OfferMandate {
  role: Role;
  reservation: Offer;
}

/** Precisión de nuestras ofertas (decimales). */
export const OFFER_DECIMALS = 2;
const EPS = 1e-9;

/**
 * `direction` se declara en la configuración desde el rol comprador; para el vendedor se invierte.
 * Todo el motor trabaja con issues ya orientados a nuestro rol.
 */
export function orientIssues(issues: readonly Issue[], role: Role): Issue[] {
  if (role === "buyer") return issues.map((i) => ({ ...i }));
  return issues.map((i) => ({
    ...i,
    direction: i.direction === "higher-better" ? "lower-better" : "higher-better",
  }));
}

function valueOf(offer: Offer, issue: Issue): number {
  const value = offer[issue.name];
  if (value === undefined || !Number.isFinite(value)) {
    throw new Error(`Oferta sin valor finito para el issue ${issue.name}`);
  }
  return value;
}

/** Escala lineal a [0, 1] según los límites del issue y su dirección, recortando fuera de límites. */
export function normalizeIssue(issue: Issue, value: number): number {
  const raw = (value - issue.min) / (issue.max - issue.min);
  const clipped = Math.min(1, Math.max(0, raw));
  return issue.direction === "higher-better" ? clipped : 1 - clipped;
}

/** Utilidad aditiva ponderada: u = Σ wᵢ · normᵢ(xᵢ), en [0, 1]. Pesos ya normalizados a suma 1. */
export function utility(issues: readonly Issue[], offer: Offer): number {
  let total = 0;
  for (const issue of issues) total += issue.weight * normalizeIssue(issue, valueOf(offer, issue));
  return Math.min(1, Math.max(0, total));
}

/** Valor del issue cuya utilidad normalizada es `u`. */
export function valueAtNorm(issue: Issue, u: number): number {
  const span = issue.max - issue.min;
  const clamped = Math.min(1, Math.max(0, u));
  return issue.direction === "higher-better" ? issue.min + clamped * span : issue.max - clamped * span;
}

/** Una oferta con utilidad `u`: cada issue en su propio nivel `u` (Σ wᵢ · u = u). */
export function offerAtUtility(issues: readonly Issue[], u: number): Offer {
  return Object.fromEntries(issues.map((issue) => [issue.name, valueAtNorm(issue, u)]));
}

/** Redondea cada valor a la precisión de oferta en la dirección que nos favorece. */
export function roundInFavor(issues: readonly Issue[], offer: Offer): Offer {
  const factor = 10 ** OFFER_DECIMALS;
  return Object.fromEntries(
    issues.map((issue) => {
      const scaled = valueOf(offer, issue) * factor;
      const rounded = issue.direction === "higher-better" ? Math.ceil(scaled - EPS) : Math.floor(scaled + EPS);
      return [issue.name, rounded / factor];
    }),
  );
}

/** Ningún issue cruza su límite de reserva (y por tanto u ≥ u(reserva)). */
export function withinOfferMandate(issues: readonly Issue[], mandate: OfferMandate, offer: Offer): boolean {
  return issues.every((issue) => {
    const value = valueOf(offer, issue);
    const limit = valueOf(mandate.reservation, issue);
    return issue.direction === "higher-better" ? value >= limit - EPS : value <= limit + EPS;
  });
}

export function reservationUtility(issues: readonly Issue[], mandate: OfferMandate): number {
  return utility(issues, mandate.reservation);
}

export function sameOffer(issues: readonly Issue[], a: Offer, b: Offer, eps = 1e-6): boolean {
  return issues.every((issue) => Math.abs(valueOf(a, issue) - valueOf(b, issue)) <= eps);
}

/** Solo los issues declarados, en su orden. */
export function pickIssues(issues: readonly Issue[], offer: Offer): Offer {
  return Object.fromEntries(issues.map((issue) => [issue.name, valueOf(offer, issue)]));
}
