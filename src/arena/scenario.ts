import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { z } from "zod";
import { ConfigError, IssueSchema, type Issue } from "../engine/config.js";
import type { Role } from "../engine/guardrails.js";
import type { Offer, OfferMandate } from "../engine/issues.js";

export const DEFAULT_CATALOG = "config/arena/scenarios.json";

const ReservationSchema = z.object({ reservation: z.record(z.string(), z.number()) }).strict();

/**
 * Escenario de la arena como dato: issues (dirección declarada desde el comprador), límite de
 * rondas y si se comunica al agente, ring estructurado o de solo texto, nuestro rol y el mandato
 * de ambas partes. `zopa` es la etiqueta declarada; se comprueba contra los mandatos.
 */
export const ScenarioSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9][a-z0-9-]*$/),
    description: z.string().optional(),
    issues: z.array(IssueSchema).min(1),
    rounds: z.number().int().min(1),
    limitVisible: z.boolean(),
    /** El agente recibe `rivalCanRespond: true` (en la arena el rival responde siempre, también tras nuestro último movimiento). */
    rivalCanRespond: z.boolean().optional(),
    mode: z.enum(["structured", "text-only"]),
    role: z.enum(["buyer", "seller"]),
    zopa: z.enum(["wide", "narrow", "empty"]),
    mandates: z.object({ buyer: ReservationSchema, seller: ReservationSchema }).strict(),
  })
  .strict()
  .superRefine((scenario, ctx) => {
    const names = scenario.issues.map((i) => i.name);
    if (new Set(names).size !== names.length) ctx.addIssue({ code: "custom", path: ["issues"], message: "issues repetidos" });
    for (const role of ["buyer", "seller"] as const) {
      const reservation = scenario.mandates[role].reservation;
      const keys = Object.keys(reservation);
      if (keys.length !== names.length || !names.every((n) => keys.includes(n))) {
        ctx.addIssue({ code: "custom", path: ["mandates", role, "reservation"], message: `debe tener exactamente los issues ${names.join(", ")}` });
        continue;
      }
      for (const issue of scenario.issues) {
        const value = reservation[issue.name]!;
        if (value < issue.min || value > issue.max) {
          ctx.addIssue({ code: "custom", path: ["mandates", role, "reservation", issue.name], message: "fuera de [min, max]" });
        }
      }
    }
    if (ctx.issues.length === 0 && (zopaOf(scenario) === null) !== (scenario.zopa === "empty")) {
      ctx.addIssue({ code: "custom", path: ["zopa"], message: "la etiqueta no coincide con los mandatos" });
    }
  });

export type Scenario = z.infer<typeof ScenarioSchema>;

export const CatalogSchema = z
  .array(ScenarioSchema)
  .min(1)
  .refine((list) => new Set(list.map((s) => s.id)).size === list.length, { message: "ids de escenario repetidos" });

/** Intervalo acordable por issue: [peor para el comprador, mejor para el comprador]. */
export interface ZopaInterval {
  issue: Issue;
  /** Valor en la reserva del comprador (lo peor que acepta el comprador). */
  buyerLimit: number;
  /** Valor en la reserva del vendedor (lo mejor que concede al comprador). */
  sellerLimit: number;
}

/**
 * ZOPA por issue (los mandatos son límites por issue): no vacía si en todos los issues la reserva
 * del vendedor es al menos tan buena para el comprador como la del comprador. null si está vacía.
 */
export function zopaOf(scenario: Pick<Scenario, "issues" | "mandates">): ZopaInterval[] | null {
  const intervals: ZopaInterval[] = [];
  for (const issue of scenario.issues) {
    const buyerLimit = scenario.mandates.buyer.reservation[issue.name]!;
    const sellerLimit = scenario.mandates.seller.reservation[issue.name]!;
    const ok = issue.direction === "higher-better" ? sellerLimit >= buyerLimit : sellerLimit <= buyerLimit;
    if (!ok) return null;
    intervals.push({ issue, buyerLimit, sellerLimit });
  }
  return intervals;
}

export function mandateFor(scenario: Scenario, role: Role): OfferMandate {
  return { role, reservation: { ...scenario.mandates[role].reservation } };
}

export function rivalRole(role: Role): Role {
  return role === "buyer" ? "seller" : "buyer";
}

export function loadCatalog(path = DEFAULT_CATALOG): Scenario[] {
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    throw new ConfigError(`No se puede leer el catálogo ${path}: ${(error as Error).message}`);
  }
  const parsed = CatalogSchema.safeParse(raw);
  if (!parsed.success) throw new ConfigError(`Catálogo inválido (${path}):\n${z.prettifyError(parsed.error)}`);
  return parsed.data;
}

/** Referencia estable al escenario (id + hash de su contenido) para las trazas en modo torneo. */
export function scenarioHash(content: string | Offer | object): string {
  const text = typeof content === "string" ? content : JSON.stringify(content);
  return createHash("sha256").update(text).digest("hex").slice(0, 16);
}
