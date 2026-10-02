import { describe, expect, it } from "vitest";
import { parseRoute, routeTo } from "../../src/route.js";

describe("hash route query string (INBOX §2: filters persisted on reload/back)", () => {
  it("routeTo.matches with a query round-trips through parseRoute", () => {
    const hash = routeTo.matches("r-1", "role=buyer&rival=boulware");
    expect(hash).toBe("#/runs/r-1?role=buyer&rival=boulware");
    expect(parseRoute(hash)).toEqual({ screen: "matches", runId: "r-1", query: "role=buyer&rival=boulware" });
  });

  it("routeTo.matches without a query has no trailing '?'", () => {
    expect(routeTo.matches("r-1")).toBe("#/runs/r-1");
    expect(parseRoute("#/runs/r-1")).toEqual({ screen: "matches", runId: "r-1", query: "" });
  });

  it("other routes are unaffected by the query split", () => {
    expect(parseRoute(routeTo.runs())).toEqual({ screen: "runs" });
    expect(parseRoute(routeTo.arenaReplay("r-1", "g-1"))).toEqual({ screen: "arena-replay", runId: "r-1", gameId: "g-1" });
  });
});
