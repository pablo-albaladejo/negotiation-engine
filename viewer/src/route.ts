/** Single screen: the Bazaar tab, with filters in the hash query (`#/bazaar?kind=duel`). */
export type Route = { screen: "bazaar"; query: string };

export function parseRoute(hash: string): Route {
  const path = hash.replace(/^#\/?/, "");
  const i = path.indexOf("?");
  return { screen: "bazaar", query: i === -1 ? "" : path.slice(i + 1) };
}

export const routeTo = {
  bazaar: (query?: string): string => `#/bazaar${query ? `?${query}` : ""}`,
};
