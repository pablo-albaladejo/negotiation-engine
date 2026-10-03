import { i, n } from "./jsx-runtime-CU3EbJiN.js";
import { c as c_1, v, y } from "./useEvents-BpJ5PfZT.js";
const a = i(n(), 1);
const o = new Set();
let s = {
  index: null,
  error: null,
  loading: false,
};
let c = null;
function l(e) {
  s = {
    ...s,
    ...e,
  };
  for (let e of [...o]) {
    e();
  }
}
function u(catalog) {
  let cards = new Map();
  let sets = new Map();
  for (let set of catalog.sets) {
    sets.set(set.id, set);
    for (let card of set.cards) {
      cards.set(card.id, {
        card,
        set,
      });
    }
  }
  return {
    catalog,
    cards,
    sets,
    packs: new Map(catalog.packs.map((e) => [e.id, e])),
    rarityColor: (t) => catalog.rarities[t]?.color ?? v[t] ?? `#9AA4B8`,
    rarityLabel: (t) => catalog.rarities[t]?.label ?? y[t] ?? t,
    symbol: catalog.currency_symbol || `P`,
  };
}
function refresh() {
  return (
    c ||
    (l({
      loading: true,
    }),
    (c = c_1
      .catalog()
      .then((e) =>
        l({
          index: u(e),
          error: null,
          loading: false,
        }),
      )
      .catch((error) =>
        l({
          error,
          loading: false,
        }),
      )
      .finally(() => {
        c = null;
      })),
    c)
  );
}
function f(e) {
  o.add(e);
  if (!s.index && !c && !s.error) {
    refresh();
  }
  return () => o.delete(e);
}
function useP() {
  return {
    ...a.useSyncExternalStore(
      f,
      () => s,
      () => s,
    ),
    refresh,
  };
}
export { useP as n, refresh as t };
