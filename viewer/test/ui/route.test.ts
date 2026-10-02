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

describe("T11: ids with reserved/special characters round-trip through routeTo/parseRoute", () => {
  it("a run id containing ? / # % and a space round-trips", () => {
    const runId = "r 1?#/%x";
    const hash = routeTo.matches(runId);
    expect(parseRoute(hash)).toEqual({ screen: "matches", runId, query: "" });
  });

  it("a game id containing the same characters round-trips alongside a query", () => {
    const runId = "r-1";
    const gameId = "g 1?#/%x";
    const hash = routeTo.arenaReplay(runId, gameId, "role=buyer");
    expect(parseRoute(hash)).toEqual({ screen: "arena-replay", runId, gameId, query: "role=buyer" });
  });
});

describe("T11: routing edge cases (unknown head, empty hash, trailing '?')", () => {
  it("an unknown head falls back to Runs", () => {
    expect(parseRoute("#/not-a-real-screen/x")).toEqual({ screen: "runs" });
  });

  it("an empty hash falls back to Runs", () => {
    expect(parseRoute("")).toEqual({ screen: "runs" });
    expect(parseRoute("#")).toEqual({ screen: "runs" });
    expect(parseRoute("#/")).toEqual({ screen: "runs" });
  });

  it("a trailing '?' with nothing after it is an empty query, not undefined or '?'", () => {
    expect(parseRoute("#/runs/r?")).toEqual({ screen: "matches", runId: "r", query: "" });
  });
});

describe("T1: malformed percent-encoding does not throw (falls back to the raw segment)", () => {
  it("an invalid %-sequence in a run id is kept as-is instead of throwing URIError", () => {
    expect(() => parseRoute("#/runs/%E0%A4%A")).not.toThrow();
    expect(parseRoute("#/runs/%E0%A4%A")).toEqual({ screen: "matches", runId: "%E0%A4%A", query: "" });
  });

  it("a lone '%' in a game id is kept as-is", () => {
    expect(parseRoute("#/runs/r-1/games/g-%")).toEqual({ screen: "arena-replay", runId: "r-1", gameId: "g-%", query: "" });
  });
});

describe("route · bazaar", () => {
  it("keeps the filter query of the Bazaar tab (#bazaar and #/bazaar)", () => {
    expect(parseRoute("#bazaar")).toEqual({ screen: "bazaar", query: "" });
    expect(parseRoute("#/bazaar?verdict=bad&row=thread%3A178")).toEqual({ screen: "bazaar", query: "verdict=bad&row=thread%3A178" });
    expect(routeTo.bazaar("verdict=bad")).toBe("#/bazaar?verdict=bad");
    expect(routeTo.bazaar()).toBe("#/bazaar");
  });
});
