/** Única pantalla: la pestaña del Bazaar, con los filtros en la query del hash (`#/bazaar?kind=duel`). */
export type Route = { screen: "bazaar"; query: string };

export function parseRoute(hash: string): Route {
  const path = hash.replace(/^#\/?/, "");
  const i = path.indexOf("?");
  return { screen: "bazaar", query: i === -1 ? "" : path.slice(i + 1) };
}

export const routeTo = {
  bazaar: (query?: string): string => `#/bazaar${query ? `?${query}` : ""}`,
};
