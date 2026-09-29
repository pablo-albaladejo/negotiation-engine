import { describe, expect, it } from "vitest";
import { CatalogSchema, loadCatalog, ScenarioSchema, zopaOf, type Scenario } from "../../src/arena/scenario.js";

const catalog = loadCatalog();

function variant(overrides: Record<string, unknown>): unknown {
  return { ...catalog.find((s) => s.id === "price-buyer-wide")!, ...overrides };
}

describe("catálogo de escenarios", () => {
  it("carga y valida el catálogo por defecto", () => {
    expect(catalog.length).toBeGreaterThanOrEqual(6);
    expect(CatalogSchema.safeParse(catalog).success).toBe(true);
  });

  it("cubre cada combinación de rol y tipo de ZOPA", () => {
    for (const role of ["buyer", "seller"] as const) {
      for (const zopa of ["wide", "narrow", "empty"] as const) {
        expect(catalog.some((s) => s.role === role && s.zopa === zopa), `${role} × ${zopa}`).toBe(true);
      }
    }
  });

  it("la etiqueta de ZOPA coincide con los mandatos", () => {
    for (const scenario of catalog) expect(zopaOf(scenario) === null, scenario.id).toBe(scenario.zopa === "empty");
  });

  it.each([
    ["reserva sin un issue declarado", { mandates: { buyer: { reservation: {} }, seller: { reservation: { pct: 7 } } } }, "mandates.buyer.reservation"],
    ["reserva fuera de límites", { mandates: { buyer: { reservation: { pct: 11 } }, seller: { reservation: { pct: 7 } } } }, "mandates.buyer.reservation.pct"],
    ["etiqueta de ZOPA incoherente", { zopa: "empty" }, "zopa"],
    ["modo desconocido", { mode: "voice" }, "mode"],
    ["campo extra", { secret: 1 }, ""],
  ])("rechaza %s señalando el campo", (_name, overrides, path) => {
    const result = ScenarioSchema.safeParse(variant(overrides));
    expect(result.success).toBe(false);
    expect(result.error!.issues.map((i) => i.path.join("."))).toContain(path);
  });

  it("rechaza ids repetidos", () => {
    const first = catalog[0] as Scenario;
    expect(CatalogSchema.safeParse([first, first]).success).toBe(false);
  });
});
