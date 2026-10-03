import { i, n, t } from "./jsx-runtime-CU3EbJiN.js";
import { i as i_2, r as r_1 } from "./Button-DIaWEsZ9.js";
const a = {
  name: `key-round`,
  size: 24,
  node: [
    [
      `path`,
      {
        d: `M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z`,
        key: `1s6t7t`,
      },
    ],
    [
      `circle`,
      {
        cx: `16.5`,
        cy: `7.5`,
        r: `.5`,
        fill: `currentColor`,
        key: `w0ekpg`,
      },
    ],
  ],
};
a.node;
const o = i_2(a);
const s = {
  name: `triangle-alert`,
  size: 24,
  node: [
    [
      `path`,
      {
        d: `m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3`,
        key: `wmoenq`,
      },
    ],
    [
      `path`,
      {
        d: `M12 9v4`,
        key: `juzpu7`,
      },
    ],
    [
      `path`,
      {
        d: `M12 17h.01`,
        key: `p32p05`,
      },
    ],
  ],
  aliases: [`alert-triangle`],
};
s.node;
const c = i_2(s);
const l = [`common`, `uncommon`, `rare`, `epic`, `legendary`];
const u = {
  common: `#9AA4B8`,
  uncommon: `#3DDC97`,
  rare: `#4C8DFF`,
  epic: `#B061FF`,
  legendary: `#FFC44D`,
};
const d = {
  common: `Common`,
  uncommon: `Uncommon`,
  rare: `Rare`,
  epic: `Epic`,
  legendary: `Legendary`,
};
const f = (e) => Math.max(0, l.indexOf(e));
const p = (e) => e === `epic` || e === `legendary`;
const m = (e) => typeof e == `string` && l.includes(e);
const h = [
  {
    level: 1,
    name: `Friendly`,
    blurb: `Warm, patient, forgiving — learn the rules`,
  },
  {
    level: 2,
    name: `Sharp`,
    blurb: `Strict, remembers, walks away from games`,
  },
  {
    level: 3,
    name: `Collector`,
    blurb: `Pays for what she loves, looks down on the rest`,
  },
  {
    level: 4,
    name: `Tricksters`,
    blurb: `Fake deadlines, switched cards — read the offer, flag the trick`,
  },
  {
    level: 5,
    name: `Banker`,
    blurb: `Endless patience, gold packs, never in a hurry`,
  },
];
const g = (level) =>
  h.find((t) => t.level === level) ?? {
    level,
    name: `Level ${level}`,
    blurb: ``,
  };
const _ = {
  dealer: `Dealer`,
  collector: `Collector`,
  trickster: `Trickster`,
  banker: `Banker`,
};
const v = {
  patience: `Patience`,
  generosity: `Generosity`,
  shrewdness: `Shrewdness`,
  memory: `Memory`,
  strictness: `Strictness`,
  chattiness: `Chattiness`,
};
function ee(e) {
  let t = /^([A-Z]{3})-(\d+)$/.exec(e);
  if (t) {
    return {
      set: t[1],
      number: Number(t[2]),
    };
  }
  return {
    set: e.slice(0, 3),
    number: 0,
  };
}
function y(e) {
  let t = 2166136261;
  for (let n = 0; n < e.length; n++) {
    t ^= e.charCodeAt(n);
    t = Math.imul(t, 16777619);
  }
  return t >>> 0;
}
function te(e) {
  let t = e >>> 0;
  return () => {
    t = (t + 1831565813) >>> 0;
    let e = t;
    e = Math.imul(e ^ (e >>> 15), e | 1);
    e ^= e + Math.imul(e ^ (e >>> 7), e | 61);
    return ((e ^ (e >>> 14)) >>> 0) / 4294967296;
  };
}
function b(e) {
  let t = e.replace(`#`, ``).trim();
  if (t.length === 3) {
    t = t
      .split(``)
      .map((e) => e + e)
      .join(``);
  }
  let n = Number.parseInt(t.slice(0, 6), 16);
  if (Number.isNaN(n)) {
    return [136, 136, 136];
  }
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
const x = (e, t, n) =>
  `#` +
  [e, t, n]
    .map((e) =>
      Math.round(Math.max(0, Math.min(255, e)))
        .toString(16)
        .padStart(2, `0`),
    )
    .join(``);
function S(e, t, n) {
  let [r, i, a] = b(e);
  let [o, s, c] = b(t);
  return x(r + (o - r) * n, i + (s - i) * n, a + (c - a) * n);
}
function ne(e, t) {
  let [n, r, i] = b(e);
  return `rgba(${n}, ${r}, ${i}, ${t})`;
}
function C(e) {
  let [t, n, r] = b(e).map((e) => {
    let t = e / 255;
    if (t <= 0.03928) {
      return t / 12.92;
    }
    return ((t + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * t + 0.7152 * n + 0.0722 * r;
}
const w = (e) => {
  if (C(e) > 0.45) {
    return `#0B1020`;
  }
  return `#F4F6FB`;
};
const T = i(n(), 1);
const E = t();
class D extends Error {
  status;
  error;
  body;
  path;
  constructor(e, t, n, r, i) {
    super(n);
    this.name = `ApiError`;
    this.status = e;
    this.error = t;
    this.path = r;
    this.body = i;
  }
  get info() {
    return {
      ...(O(this.body) ? this.body : {}),
      error: this.error,
      message: this.message,
    };
  }
}
function re(e) {
  if (e instanceof D) {
    return e.info;
  }
  if (e instanceof Error) {
    return {
      error: e.name || `error`,
      message: e.message,
    };
  }
  return {
    error: `error`,
    message: String(e),
  };
}
function O(e) {
  return typeof e == `object` && !!e && !Array.isArray(e);
}
const k = `bazaar.adminToken`;
const A = `bazaar:admin-auth-required`;
const j = `bazaar:admin-token-changed`;
let M = null;
function N() {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
}
function ie(e) {
  try {
    localStorage.setItem(k, e.trim());
  } catch {
    M = e.trim();
  }
  window.dispatchEvent(new Event(j));
}
function ae() {
  M = null;
  try {
    localStorage.removeItem(k);
  } catch {}
  window.dispatchEvent(new Event(j));
}
const P = () => N() ?? M;
function F(e) {
  let t = (t) => e(t.detail);
  window.addEventListener(A, t);
  return () => window.removeEventListener(A, t);
}
function I(detail) {
  window.dispatchEvent(
    new CustomEvent(A, {
      detail,
    }),
  );
}
const L = I;
function R(e, t) {
  let n = new URLSearchParams();
  for (let [e, r] of Object.entries(t ?? {})) {
    if (r != null && r !== ``) {
      n.set(e, String(r));
    }
  }
  let r = n.toString();
  return `${e}${r ? `?${r}` : ``}`;
}
async function z(method, t, n = {}) {
  let headers = {
    Accept: `application/json`,
    ...n.headers,
  };
  if (n.admin) {
    let e = P();
    if (!e) {
      L(`missing`);
      throw new D(
        401,
        `no_token`,
        `Admin token required — enter it once, it is kept in this browser.`,
        t,
      );
    }
    headers[`X-Admin-Token`] = e;
  } else if (!headers[`X-Team-Key`]) {
    let e = P();
    if (e) {
      headers[`X-Admin-Token`] = e;
    }
  }
  let body;
  if (n.body !== undefined) {
    headers[`Content-Type`] = `application/json`;
    body = JSON.stringify(n.body);
  }
  let a;
  try {
    a = await fetch(R(t, n.query), {
      method,
      headers,
      body,
      signal: n.signal,
    });
  } catch (error) {
    throw error?.name === `AbortError`
      ? error
      : new D(
          0,
          `network`,
          `Cannot reach the Bazaar API (${method} ${t}). Is the server running?`,
          t,
        );
  }
  let o = a.headers.get(`content-type`) ?? ``;
  let s = o.includes(`application/json`);
  let c = null;
  let l = ``;
  if (s) {
    c = await a.json().catch(() => null);
  } else {
    l = await a.text().catch(() => ``);
  }
  if (!a.ok) {
    let e = `http_${a.status}`;
    let r = a.statusText || `HTTP ${a.status}`;
    if (O(c) && typeof c.error == `string`) {
      e = c.error;
      r = typeof c.message == `string` ? c.message : r;
    } else if (O(c) && `detail` in c) {
      r =
        typeof c.detail == `string`
          ? c.detail
          : JSON.stringify(c.detail).slice(0, 400);
      if (a.status === 404) {
        e = `not_found`;
      }
      if (a.status === 422) {
        e = `invalid`;
      }
    } else if (l) {
      r = l.slice(0, 300);
    }
    if (n.admin && a.status === 401) {
      L(`rejected`);
    }
    throw new D(a.status, e, r, t, c ?? l);
  }
  if (!s) {
    throw new D(
      a.status,
      `bad_response`,
      `Expected JSON from ${method} ${t}, got ${o || `no content type`} — does this route exist on the server?`,
      t,
      l.slice(0, 300),
    );
  }
  return c;
}
const B = (e, t) => z(`GET`, e, t);
const V = (e, t, n) =>
  z(`POST`, e, {
    ...n,
    body: t ?? {},
  });
const H = (e, t, n) =>
  z(`PUT`, e, {
    ...n,
    body: t ?? {},
  });
const U = encodeURIComponent;
function team(e) {
  let t = {
    headers: {
      "X-Team-Key": e,
    },
  };
  return {
    me: (e) =>
      B(`/api/me`, {
        ...t,
        signal: e,
      }),
    myValue: (card) =>
      B(`/api/me/value`, {
        ...t,
        query: {
          card,
        },
      }),
    myThreads: (status) =>
      B(`/api/me/threads`, {
        ...t,
        query: {
          status,
        },
      }),
    myOffers: () => B(`/api/me/offers`, t),
    thread: (e) => B(`/api/threads/${e}`, t),
    openThread: (e) => V(`/api/threads`, e, t),
    postMessage: (e, n) => V(`/api/threads/${e}/messages`, n, t),
    createOffer: (e) => V(`/api/offers`, e, t),
    cancelOffer: (e) => z(`DELETE`, `/api/offers/${e}`, t),
    acceptOffer: (e, n) => V(`/api/offers/${e}/accept`, n ?? {}, t),
    openPack: (e) => V(`/api/packs/${e}/open`, {}, t),
    openVenue: (e) => V(`/api/venues`, e, t),
    setVenueFee: (e, fee_bps, fee_per_card) =>
      z(`PATCH`, `/api/venues/${U(e)}`, {
        ...t,
        body: {
          fee_bps,
          fee_per_card,
        },
      }),
    closeVenue: (e) => V(`/api/venues/${U(e)}/close`, {}, t),
    flag: (message_id, n) =>
      V(
        `/api/flags`,
        {
          message_id,
          reason: n,
        },
        t,
      ),
    duels: (e = false) =>
      B(`/api/duels`, {
        ...t,
        query: {
          done: e || undefined,
        },
      }),
    duelSay: (e, n) => V(`/api/duels/${e}/messages`, n, t),
    duelAccept: (e) => V(`/api/duels/${e}/accept`, {}, t),
  };
}
function broker(e) {
  let t = {
    headers: {
      "X-Broker-Key": e,
    },
  };
  return {
    book: () => B(`/api/broker/book`, t),
    match: (sell, buy, price) =>
      V(
        `/api/broker/matches`,
        {
          sell,
          buy,
          price,
        },
        t,
      ),
    announce: (e) =>
      V(
        `/api/broker/announce`,
        {
          text: e,
        },
        t,
      ),
  };
}
const K = {
  admin: true,
};
const admin = {
  overview: (e) =>
    B(`/api/admin/overview`, {
      ...K,
      signal: e,
    }),
  setClock: (e) => V(`/api/admin/clock`, e, K),
  setCalendar: (days) =>
    H(
      `/api/admin/calendar`,
      {
        days,
      },
      K,
    ),
  tick: () => V(`/api/admin/tick`, {}, K),
  levels: (e) =>
    B(`/api/admin/levels`, {
      ...K,
      signal: e,
    }),
  setLevel: (e, to, head_start_hours) =>
    V(
      `/api/admin/levels/${encodeURIComponent(e)}`,
      {
        to,
        head_start_hours,
      },
      K,
    ),
  news: (e) =>
    B(`/api/admin/news`, {
      ...K,
      signal: e,
    }),
  airNews: (e) => V(`/api/admin/news`, e, K),
  airDeckItem: (e) => V(`/api/admin/news/${U(e)}/air`, {}, K),
  integrity: (e) =>
    B(`/api/admin/integrity`, {
      ...K,
      signal: e,
    }),
  clearIntegrity: (giver, receiver) =>
    V(
      `/api/admin/integrity/clear`,
      {
        giver,
        receiver,
      },
      K,
    ),
  teams: (e) =>
    B(`/api/admin/teams`, {
      ...K,
      signal: e,
    }),
  createTeam: (e, members = ``) =>
    V(
      `/api/admin/teams`,
      {
        name: e,
        members,
      },
      K,
    ),
  team: (e, t) =>
    B(`/api/admin/teams/${U(e)}`, {
      ...K,
      signal: t,
    }),
  rotateKey: (e) => V(`/api/admin/teams/${U(e)}/rotate`, {}, K),
  grant: (e, t) => V(`/api/admin/teams/${U(e)}/grant`, t, K),
  adjust: (e, t) => V(`/api/admin/teams/${U(e)}/adjust`, t, K),
  freeze: (e, frozen) =>
    V(
      `/api/admin/teams/${U(e)}/freeze`,
      {
        frozen,
      },
      K,
    ),
  personas: (e) =>
    B(`/api/admin/personas`, {
      ...K,
      signal: e,
    }),
  persona: (e, t) =>
    B(`/api/admin/personas/${U(e)}`, {
      ...K,
      signal: t,
    }),
  savePersona: (e, body) =>
    z(`PUT`, `/api/admin/personas/${U(e)}`, {
      ...K,
      body,
    }),
  lintPersona: (e, t) =>
    B(`/api/admin/personas/${U(e)}/lint`, {
      ...K,
      signal: t,
    }),
  createPersona: (e) => V(`/api/admin/personas`, e, K),
  personaVersion: (e, t) => B(`/api/admin/personas/${U(e)}/versions/${t}`, K),
  rollbackPersona: (e, version) =>
    V(
      `/api/admin/personas/${U(e)}/rollback`,
      {
        version,
      },
      K,
    ),
  playground: (e, t) => V(`/api/admin/personas/${U(e)}/playground`, t, K),
  threads: (e = {}, t) =>
    B(`/api/admin/threads`, {
      ...K,
      query: e,
      signal: t,
    }),
  thread: (e, t) =>
    B(`/api/admin/threads/${e}`, {
      ...K,
      signal: t,
    }),
  venues: (e) =>
    B(`/api/admin/venues`, {
      ...K,
      signal: e,
    }),
  suspendVenue: (e, t, slash_frac) =>
    V(
      `/api/admin/venues/${U(e)}/suspend`,
      {
        reason: t,
        slash_frac,
      },
      K,
    ),
  unsuspendVenue: (e) => V(`/api/admin/venues/${U(e)}/unsuspend`, {}, K),
  cards: (e = {}, t) =>
    B(`/api/admin/cards`, {
      ...K,
      query: e,
      signal: t,
    }),
  card: (e) => B(`/api/admin/cards/${e}`, K),
  rounds: () => B(`/api/admin/rounds`, K),
  startRound: (e, t = 1, reset = false) =>
    V(
      `/api/admin/rounds/start`,
      {
        name: e,
        weight: t,
        reset,
      },
      K,
    ),
  endRound: () => V(`/api/admin/rounds/end`, {}, K),
  voidRound: (e) => V(`/api/admin/rounds/${e}/void`, {}, K),
  setRoundWeight: (e, t) =>
    V(
      `/api/admin/rounds/${e}/weight`,
      {
        weight: t,
      },
      K,
    ),
  announce: (e) =>
    V(
      `/api/admin/announce`,
      {
        text: e,
      },
      K,
    ),
  leaderboard: (e) =>
    B(`/api/admin/leaderboard`, {
      ...K,
      signal: e,
    }),
  events: (e = {}, t) =>
    B(`/api/admin/events`, {
      ...K,
      query: {
        ...e,
      },
      signal: t,
    }),
  settlements: (e = {}, t) =>
    B(`/api/admin/settlements`, {
      ...K,
      query: e,
      signal: t,
    }),
  config: () => B(`/api/admin/config`, K),
  duels: (e) =>
    B(`/api/admin/duels`, {
      ...K,
      signal: e,
    }),
  scheduleDuels: (e = {}) => V(`/api/admin/duels`, e, K),
  bench: (e) =>
    B(`/api/admin/bench`, {
      ...K,
      signal: e,
    }),
  scheduleBench: (e = {}) => V(`/api/admin/bench`, e, K),
  insights: (e) =>
    B(`/api/admin/insights`, {
      ...K,
      signal: e,
    }),
  exportPersonas: () => V(`/api/admin/export`, {}, K),
  verifyToken: async (e) => {
    let t = await fetch(R(`/api/admin/overview`), {
      headers: {
        "X-Admin-Token": e.trim(),
      },
    }).catch(() => null);
    return !!t && t.ok;
  },
};
const J = {
  health: (e) =>
    B(`/api/health`, {
      signal: e,
    }),
  clock: (e) =>
    B(`/api/clock`, {
      signal: e,
    }),
  catalog: (e) =>
    B(`/api/catalog`, {
      signal: e,
    }),
  leaderboard: (e) =>
    B(`/api/leaderboard`, {
      signal: e,
    }),
  feed: (limit = 150, t) =>
    B(`/api/feed`, {
      query: {
        limit,
      },
      signal: t,
    }),
  personas: async (e) => {
    let t = await B(`/api/dealers`, {
      signal: e,
    });
    let n = (e) => e.status === `announced`;
    return {
      personas: t.personas.filter((e) => !n(e)),
      teasers: t.personas.filter(n),
    };
  },
  levels: (e) =>
    B(`/api/levels`, {
      signal: e,
    }),
  venues: (e) =>
    B(`/api/venues`, {
      signal: e,
    }),
  venueOffers: (e, t) =>
    B(`/api/venues/${U(e)}/offers`, {
      signal: t,
    }),
  card: (e, t) =>
    B(`/api/cards/${e}`, {
      signal: t,
    }),
  schedule: (e) =>
    B(`/api/schedule`, {
      signal: e,
    }),
  team,
  broker,
  admin,
  streamTarget(scope = `public`, t = {}) {
    let url = R(`/api/events/stream`, {
      scope,
    });
    if (scope === `admin`) {
      return {
        url,
        headers: {
          "X-Admin-Token": t.token ?? P() ?? ``,
        },
      };
    }
    if (scope === `team`) {
      return {
        url,
        headers: {
          "X-Team-Key": t.key ?? ``,
        },
      };
    }
    let r = P();
    return {
      url,
      headers: r
        ? {
            "X-Admin-Token": r,
          }
        : {},
    };
  },
};
function OeComponent({ className, lines }) {
  if (lines && lines > 1) {
    return (
      <div className={`flex flex-col gap-2`} aria-hidden>
        {Array.from(
          {
            length: lines,
          },
          (n, r) => (
            <div
              key={r}
              className={r_1(
                `skeleton h-3.5`,
                r === lines - 1 ? `w-2/3` : `w-full`,
                className,
              )}
            />
          ),
        )}
      </div>
    );
  }
  return <div className={r_1(`skeleton h-4 w-full`, className)} aria-hidden />;
}
const se = (e) => new Promise((resolve) => setTimeout(resolve, e));
class ce {
  url;
  headers;
  listeners = new Set();
  statusListeners = new Set();
  status = `idle`;
  hello = null;
  generation = 0;
  running = false;
  ctl = null;
  stopTimer = null;
  constructor(e, t) {
    this.url = e;
    this.headers = t;
  }
  subscribe(e) {
    this.listeners.add(e);
    this.start();
    return () => {
      this.listeners.delete(e);
      this.maybeStop();
    };
  }
  watch(e) {
    this.statusListeners.add(e);
    return () => {
      this.statusListeners.delete(e);
      this.maybeStop();
    };
  }
  setStatus(e) {
    if (this.status !== e) {
      this.status = e;
      for (let e of [...this.statusListeners]) {
        e();
      }
    }
  }
  start() {
    this.stopTimer &&= (clearTimeout(this.stopTimer), null);
    if (!this.running) {
      this.running = true;
      this.loop();
    }
  }
  maybeStop() {
    if (!(this.listeners.size > 0 || this.stopTimer)) {
      this.stopTimer = setTimeout(() => {
        this.stopTimer = null;
        if (!(this.listeners.size > 0)) {
          this.running = false;
          this.ctl?.abort();
          Y.delete(X(this));
        }
      }, 3000);
    }
  }
  async loop() {
    let e = 600;
    while (this.running) {
      this.ctl = new AbortController();
      this.setStatus(this.generation ? `reconnecting` : `connecting`);
      try {
        let t = await fetch(this.url, {
          signal: this.ctl.signal,
          headers: {
            Accept: `text/event-stream`,
            ...this.headers,
          },
          cache: `no-store`,
        });
        if (t.status === 401) {
          this.setStatus(`unauthorised`);
          this.running = false;
          if (this.url.includes(`scope=admin`)) {
            I(`rejected`);
          }
          break;
        }
        if (!t.ok || !t.body) {
          throw Error(`stream HTTP ${t.status}`);
        }
        e = 600;
        await this.read(t.body);
      } catch {}
      if (!this.running) {
        break;
      }
      this.setStatus(`reconnecting`);
      await se(e + Math.random() * 300);
      e = Math.min(e * 2, 10000);
    }
    if (this.status !== `unauthorised`) {
      this.setStatus(`idle`);
    }
  }
  async read(e) {
    let t = e.getReader();
    let n = new TextDecoder();
    let r = ``;
    try {
      while (true) {
        let { value, done } = await t.read();
        if (done) {
          break;
        }
        r += n.decode(value, {
          stream: true,
        });
        if (r.includes(`\r`)) {
          r = r.replace(
            /\r\n?/g,
            `
`,
          );
        }
        let a;
        while (
          (a = r.indexOf(`

`)) >= 0
        ) {
          let e = r.slice(0, a);
          r = r.slice(a + 2);
          this.dispatch(e);
        }
      }
    } finally {
      t.releaseLock();
    }
  }
  dispatch(e) {
    let t = `message`;
    let n = [];
    for (let r of e.split(`
`)) {
      if (!r || r.startsWith(`:`)) {
        continue;
      }
      let e = r.indexOf(`:`);
      let i = e < 0 ? r : r.slice(0, e);
      let a = e < 0 ? `` : r.slice(e + 1);
      if (a.startsWith(` `)) {
        a = a.slice(1);
      }
      if (i === `event`) {
        t = a;
      } else if (i === `data`) {
        n.push(a);
      }
    }
    if (!n.length) {
      return;
    }
    let r;
    try {
      r = JSON.parse(
        n.join(`
`),
      );
    } catch {
      return;
    }
    if (t === `hello`) {
      this.hello = r;
      this.generation += 1;
      this.setStatus(`open`);
      for (let e of [...this.statusListeners]) {
        e();
      }
      return;
    }
    let i = r;
    if (i && typeof i == `object` && typeof i.type == `string`) {
      for (let e of [...this.listeners]) {
        try {
          e(i);
        } catch (error) {
          console.error(`[bazaar] event handler failed`, error);
        }
      }
    }
  }
}
var Y = new Map();
var X = (e) => `${e.url}
${JSON.stringify(e.headers)}`;
function le(e) {
  let t = X(e);
  let n = Y.get(t);
  if (!n) {
    n = new ce(e.url, e.headers);
    Y.set(t, n);
  }
  return n;
}
function useUe(e) {
  let [t, setT] = T.useState(() => {
    if (e) {
      return N();
    }
    return null;
  });
  T.useEffect(() => {
    if (!e) {
      return;
    }
    let t = () => setT(N());
    let r = F(t);
    window.addEventListener(`storage`, t);
    window.addEventListener(j, t);
    return () => {
      r();
      window.removeEventListener(`storage`, t);
      window.removeEventListener(j, t);
    };
  }, [e]);
  return t;
}
function useZ(e, t = {}) {
  let { scope = `public`, key, types, enabled = true } = t;
  let o = useUe(scope === `admin` && !t.token);
  let token = t.token ?? (scope === `admin` ? (o ?? undefined) : undefined);
  let c =
    enabled && (scope !== `admin` || token) && (scope !== `team` || key)
      ? J.streamTarget(scope, {
          token,
          key,
        })
      : null;
  let l = c ? X(c) : null;
  let uRef = T.useRef(e);
  uRef.current = e;
  let d = types?.join(`|`) ?? ``;
  let [f, setF] = T.useState({
    status: `idle`,
    hello: null,
    generation: 0,
  });
  T.useEffect(() => {
    if (!l) {
      setF({
        status: `idle`,
        hello: null,
        generation: 0,
      });
      return;
    }
    let e = le(
      J.streamTarget(scope, {
        token,
        key,
      }),
    );
    let t = d ? new Set(d.split(`|`)) : null;
    let i = () =>
      setF({
        status: e.status,
        hello: e.hello,
        generation: e.generation,
      });
    let a = e.watch(i);
    let o = e.subscribe((e) => {
      if (!t || t.has(e.type)) {
        uRef.current(e);
      }
    });
    i();
    return () => {
      o();
      a();
    };
  }, [l, d]);
  return f;
}
function useDe(e = {}) {
  let { limit = 200, includeTicks = false, seed } = e;
  let [events, setEvents] = T.useState([]);
  let [lastTick, setLastTick] = T.useState(null);
  let cRef = T.useRef([]);
  let lRef = T.useRef(null);
  T.useEffect(() => {
    if (seed?.length) {
      setEvents((e) => Q(e, seed, limit));
    }
  }, [seed, limit]);
  let u = T.useCallback(() => {
    lRef.current = null;
    let cRef_current = cRef.current;
    cRef.current = [];
    if (cRef_current.length) {
      setEvents((n) => Q(n, cRef_current, limit));
    }
  }, [limit]);
  T.useEffect(
    () => () => {
      if (lRef.current !== null) {
        cancelAnimationFrame(lRef.current);
      }
    },
    [],
  );
  let d = useZ((e) => {
    if (!(e.type === `tick` && (setLastTick(e.tick), !includeTicks))) {
      cRef.current.push(e);
      if (lRef.current === null) {
        lRef.current = requestAnimationFrame(u);
      }
    }
  }, e);
  return {
    events,
    lastTick,
    clear: T.useCallback(() => setEvents([]), []),
    ...d,
  };
}
function Q(e, t, limit) {
  let r = new Set(e.map((e) => e.id));
  let i = t.filter((e) => !r.has(e.id));
  if (i.length) {
    return [...i, ...e].sort((e, t) => t.id - e.id).slice(0, limit);
  }
  return e;
}
function useComponent(
  e,
  t,
  n = [],
  { pauseHidden = true, enabled = true } = {},
) {
  let [data, setData] = T.useState(undefined);
  let [error, setError] = T.useState(null);
  let [loading, setLoading] = T.useState(true);
  let [fetching, setFetching] = T.useState(false);
  let [updatedAt, setUpdatedAt] = T.useState(null);
  let [g, setG] = T.useState(0);
  let vRef = T.useRef(e);
  vRef.current = e;
  T.useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    let e = true;
    let n = null;
    let r = null;
    let o = true;
    let c = async () => {
      if (e) {
        if (
          !o &&
          pauseHidden &&
          t !== null &&
          typeof document < `u` &&
          document.hidden
        ) {
          u();
          return;
        }
        o = false;
        r = new AbortController();
        setFetching(true);
        try {
          let t = await vRef.current(r.signal);
          if (!e) {
            return;
          }
          setData(t);
          setError(null);
          setUpdatedAt(Date.now());
        } catch (err) {
          if (!e || err?.name === `AbortError`) {
            return;
          }
          setError(err);
        } finally {
          if (e) {
            setLoading(false);
            setFetching(false);
          }
        }
        u();
      }
    };
    let u = () => {
      if (e && t !== null) {
        n = setTimeout(c, t);
      }
    };
    c();
    return () => {
      e = false;
      if (n) {
        clearTimeout(n);
      }
      r?.abort();
    };
  }, [...n, t, g, enabled, pauseHidden]);
  return {
    data,
    error,
    loading,
    fetching,
    refresh: T.useCallback(() => setG((e) => e + 1), []),
    updatedAt,
  };
}
function fe(e, t = [], n = {}) {
  return useComponent(e, null, t, n);
}
export {
  f as A,
  w as C,
  S as D,
  g as E,
  o as M,
  ee as O,
  y as S,
  m as T,
  l as _,
  OeComponent as a,
  v as b,
  J as c,
  N as d,
  I as f,
  _ as g,
  h,
  useComponent as i,
  c as j,
  te as k,
  ae as l,
  ie as m,
  useZ as n,
  D as o,
  F as p,
  useDe as r,
  admin as s,
  fe as t,
  re as u,
  u as v,
  p as w,
  ne as x,
  d as y,
};
