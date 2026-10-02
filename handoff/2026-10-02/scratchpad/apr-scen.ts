import { readFileSync, writeFileSync } from "node:fs";
import { aprOffer } from "/Users/pablo/development/hackathon/negotiation-ring.worktrees/causa-prima-arena/src/engine/apr.js";
const path = "config/arena/scenarios.json";
const catalog = JSON.parse(readFileSync(path, "utf8"));
const baseDays = 30, day = 10;
const issues = [
  { name: "pct", min: 0, max: 5, direction: "higher-better", weight: 0.5 },
  { name: "day", min: 0, max: 25, direction: "higher-better", weight: 0.5 },
];
const variants = { wide: { buyer: { min: 15, max: 45 }, seller: { min: 8, max: 30 } }, narrow: { buyer: { min: 20, max: 45 }, seller: { min: 8, max: 23 } } };
for (const zopa of ["wide", "narrow"] as const) {
  const b = variants[zopa].buyer, s = variants[zopa].seller;
  const buyerCorner = aprOffer({ ...b, baseDays, day }, "seller", b.min);
  const sellerCorner = aprOffer({ ...s, baseDays, day }, "buyer", s.max);
  for (const role of ["buyer", "seller"]) {
    catalog.push({
      id: `apr-${role}-${zopa}`,
      description: `Mandato en % TAE (net ${baseDays}, día de referencia ${day}): banda comprador [${b.min}, ${b.max}], vendedor [${s.min}, ${s.max}]. Opt-in (estilo Causa Prima).`,
      issues, rounds: 8, limitVisible: true, mode: "structured", role, zopa, optIn: true, mandateUnit: "apr", baseDays,
      mandates: { buyer: { reservation: buyerCorner, apr: b }, seller: { reservation: sellerCorner, apr: s } },
    });
  }
}
writeFileSync(path, JSON.stringify(catalog, null, 2) + "\n");
console.log(catalog.slice(-4).map((c: any) => [c.id, JSON.stringify(c.mandates)]));
