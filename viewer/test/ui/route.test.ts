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
    expect(parseRoute(routeTo.arenaReplay("r-1", "g-1"))).toEqual({ screen: "arena-replay", runId: "r-1", gameId: "g-1", query: "" });
  });

  it("routeTo.arenaReplay carries an optional query through to parseRoute (INBOX A2)", () => {
    const hash = routeTo.arenaReplay("r-1", "g-1", "role=buyer");
    expect(hash).toBe("#/runs/r-1/games/g-1?role=buyer");
    expect(parseRoute(hash)).toEqual({ screen: "arena-replay", runId: "r-1", gameId: "g-1", query: "role=buyer" });
  });
});

describe("#/compare/:runId (INBOX B1: primary route, #/promote/:runId kept as alias)", () => {
  it("routeTo.compare is the primary generator", () => {
    expect(routeTo.compare("r-1")).toBe("#/compare/r-1");
    expect(parseRoute(routeTo.compare("r-1"))).toEqual({ screen: "compare", runId: "r-1" });
  });

  it("#/promote/:runId still resolves to the same screen", () => {
    expect(parseRoute(routeTo.promote("r-1"))).toEqual({ screen: "compare", runId: "r-1" });
  });
});

describe("B3: round-trip per route — parse(format(x)) === x for every screen", () => {
  it("runs", () => {
    expect(parseRoute(routeTo.runs())).toEqual({ screen: "runs" });
  });

  it("matches, with and without a query", () => {
    expect(parseRoute(routeTo.matches("r-1"))).toEqual({ screen: "matches", runId: "r-1", query: "" });
    expect(parseRoute(routeTo.matches("r-1", "role=buyer"))).toEqual({ screen: "matches", runId: "r-1", query: "role=buyer" });
  });

  it("arena-replay (also covers two-issue, which shares the route), with and without a query", () => {
    expect(parseRoute(routeTo.arenaReplay("r-1", "g-1"))).toEqual({ screen: "arena-replay", runId: "r-1", gameId: "g-1", query: "" });
    expect(parseRoute(routeTo.arenaReplay("r-1", "g-1", "role=buyer"))).toEqual({ screen: "arena-replay", runId: "r-1", gameId: "g-1", query: "role=buyer" });
  });

  it("tournament-replay", () => {
    expect(parseRoute(routeTo.tournamentReplay("r-1", "ring-session-1"))).toEqual({ screen: "tournament-replay", runId: "r-1", session: "ring-session-1" });
  });

  it("compare, and its promote alias", () => {
    expect(parseRoute(routeTo.compare("r-1"))).toEqual({ screen: "compare", runId: "r-1" });
    expect(parseRoute(routeTo.promote("r-1"))).toEqual({ screen: "compare", runId: "r-1" });
  });

  it("states", () => {
    expect(parseRoute(routeTo.states())).toEqual({ screen: "states" });
  });

  it("live", () => {
    expect(parseRoute(routeTo.live())).toEqual({ screen: "live" });
  });
});
