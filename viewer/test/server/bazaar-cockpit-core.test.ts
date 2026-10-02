import { describe, expect, it } from "vitest";
import { albumOf, holdingsOf, missingWithoutValue, scheduleOf } from "../../server/bazaar-cockpit-core.js";

const ME = {
  album: {
    filled: 3,
    slots: 6,
    pages: [
      { set: "MAL", name: "Malasaña", have: 1, of: 3, complete: false },
      { set: "SAL", name: "Salamanca", have: 2, of: 3, complete: false },
    ],
  },
  assets: [{ ref: "SAL-01", kind: "card" }, { ref: "SAL-01", kind: "card" }, { ref: "SAL-02", kind: "card" }, { ref: "MAL-01" }, { ref: "x", kind: "boost" }],
};
const CATALOG = {
  sets: [
    { id: "SAL", cards: [{ id: "SAL-01", name: "A" }, { id: "SAL-02", name: "B" }, { id: "SAL-03", name: "C", rarity: "rare", book: 90 }, { id: "SAL-99", name: "Extra", page: false }] },
    { id: "MAL", cards: [{ id: "MAL-01" }, { id: "MAL-02", name: "D" }, { id: "MAL-03", name: "E" }] },
  ],
};

describe("cabina · núcleo puro", () => {
  it("holdingsOf cuenta copias de cartas (sin otros activos)", () => {
    expect(holdingsOf(ME)).toEqual({ "SAL-01": 2, "SAL-02": 1, "MAL-01": 1 });
    expect(holdingsOf("basura")).toEqual({});
  });

  it("albumOf: páginas de más a menos completas, con las cartas de página que faltan y su valor", () => {
    const album = albumOf(ME, CATALOG, new Map([["SAL-03", 177.1]]));
    expect(album?.pages.map((p) => p.set)).toEqual(["SAL", "MAL"]);
    expect(album?.pages[0]?.missing).toEqual([{ ref: "SAL-03", name: "C", rarity: "rare", book: 90, value: 177.1 }]);
    expect(album?.pages[1]?.missing.map((m) => m.ref)).toEqual(["MAL-02", "MAL-03"]);
    expect(missingWithoutValue(album, 1)).toEqual(["MAL-02"]);
  });

  it("albumOf sin álbum ⇒ null; sin catálogo ⇒ páginas sin cartas que faltan", () => {
    expect(albumOf({}, CATALOG, new Map())).toBeNull();
    expect(albumOf(ME, null, new Map())?.pages.every((p) => p.missing.length === 0)).toBe(true);
  });

  it("scheduleOf: solo lo que no ha pasado, en orden", () => {
    const s = scheduleOf({ now_hours: 2, upcoming: [{ at_hours: 5, action: "duels" }, { at_hours: 1, action: "bench" }, { at_hours: 3, action: "round", note: "R2" }] });
    expect(s).toEqual({ now_hours: 2, upcoming: [{ at_hours: 3, action: "round", note: "R2", wall: null }, { at_hours: 5, action: "duels", note: "", wall: null }] });
    expect(scheduleOf("x")).toBeNull();
  });
});
