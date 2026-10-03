import { i as i_1, n } from "./jsx-runtime-CU3EbJiN.js";
import { c as c_1 } from "./useEvents-BpJ5PfZT.js";
const r = i_1(n(), 1);
const i = {
  id: `world`,
  name: `The house`,
  kind: `house`,
};
const a = new Set();
let o = {
  byId: new Map([[i.id, i]]),
  ready: false,
};
let s = null;
let c = null;
async function refresh() {
  return (
    c ||
    ((c = (async () => {
      try {
        let [e, t] = await Promise.all([c_1.leaderboard(), c_1.personas()]);
        let byId = new Map([[i.id, i]]);
        for (let t of e.teams) {
          byId.set(t.team, {
            id: t.team,
            name: t.name,
            kind: `team`,
            level: t.level,
          });
        }
        for (let t of e.venues) {
          byId.set(t.venue, {
            id: t.venue,
            name: t.name,
            kind: `venue`,
          });
        }
        for (let e of t.personas) {
          byId.set(e.id, {
            id: e.id,
            name: e.name,
            kind: `persona`,
            avatar: e.avatar,
            level: e.level,
          });
        }
        o = {
          byId,
          ready: true,
        };
        for (let e of [...a]) {
          e();
        }
      } catch {
      } finally {
        c = null;
      }
    })()),
    c)
  );
}
function u(e) {
  a.add(e);
  s ||= (refresh(), setInterval(() => void refresh(), 30000));
  return () => {
    a.delete(e);
    if (!a.size && s) {
      clearInterval(s);
      s = null;
    }
  };
}
function useD() {
  let e = r.useSyncExternalStore(
    u,
    () => o,
    () => o,
  );
  return r.useMemo(
    () => ({
      ready: e.ready,
      info: (t) => {
        if (t) {
          return e.byId.get(t);
        }
      },
      name: (t) => {
        if (t) {
          return e.byId.get(t)?.name ?? t;
        }
        return `—`;
      },
      refresh,
    }),
    [e],
  );
}
export { useD as t };
